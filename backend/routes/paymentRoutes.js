const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { protect } = require('../middleware/authMiddleware');
const { sendTicketEmail } = require('../utils/emailService');

const Booking = require('../models/Booking');
const Show = require('../models/Show');

const { createOrder, verifyPayment, getKey } = require('../controllers/paymentController');

// ─── Razorpay Routes ──────────────────────────────────────────────────────────
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/key', protect, getKey);

// ─── Stripe: Create Checkout Session ─────────────────────────────────────────
router.post(
  '/stripe/create-session',
  protect,
  asyncHandler(async (req, res) => {
    const { showId, seats, amount, movieTitle, customerEmail } = req.body;

    if (!showId || !seats || !seats.length || !amount) {
      res.status(400);
      throw new Error('Missing required fields');
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail || undefined,
      line_items: [{
        price_data: {
          currency: 'inr',
          product_data: {
            name: `${movieTitle} - Movie Tickets`,
            description: `Seats: ${seats.join(', ')}`,
            images: [],
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
      metadata: {
        showId,
        seats: JSON.stringify(seats),
        userId: req.user._id.toString(),
        amount: amount.toString(),
      },
      success_url: `${process.env.FRONTEND_URL}/payment/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment`,
    });

    res.json({ url: session.url, sessionId: session.id });
  })
);

// ─── Stripe: Verify Session & Create Booking ──────────────────────────────────
router.get(
  '/stripe/success',
  asyncHandler(async (req, res) => {
    const { session_id } = req.query;

    if (!session_id) {
      res.status(400);
      throw new Error('Session ID is required');
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status !== 'paid') {
      res.status(400);
      throw new Error('Payment not completed');
    }

    const { showId, seats: seatsJson, userId, amount } = session.metadata;
    const seats = JSON.parse(seatsJson);

    // ── Idempotency check ────────────────────────────────────────────────────
    const existing = await Booking.findOne({ stripeSessionId: session_id })
      .populate('user', 'name email phone')
      .populate({ path: 'show', populate: [{ path: 'movie' }, { path: 'theatre' }] });
    if (existing) return res.json({ booking: existing });

    // ── Get show ─────────────────────────────────────────────────────────────
    const show = await Show.findById(showId);
    if (!show) {
      res.status(404);
      throw new Error('Show not found');
    }

    // ── Check seat conflict ───────────────────────────────────────────────────
    const alreadyBooked = seats.filter(s => show.bookedSeats.includes(s));
    if (alreadyBooked.length > 0) {
      const sameSession = await Booking.findOne({ stripeSessionId: session_id });
      if (sameSession) return res.json({ booking: sameSession });
      res.status(400);
      throw new Error(`Seats already booked: ${alreadyBooked.join(', ')}`);
    }

    // ── Create booking ────────────────────────────────────────────────────────
    const booking = await Booking.create({
      user: new mongoose.Types.ObjectId(userId),
      show: new mongoose.Types.ObjectId(showId),
      seats,
      amount: parseFloat(amount),
      totalAmount: parseFloat(amount),
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      stripeSessionId: session_id,
      stripePaymentIntentId: session.payment_intent,
      status: 'Confirmed',
    });

    // ── Update show seats ─────────────────────────────────────────────────────
    await Show.findByIdAndUpdate(showId, {
      $push: { bookedSeats: { $each: seats } },
      $inc: { availableSeats: -seats.length },
    });

    // ── Populate for response & email ─────────────────────────────────────────
    const populatedBooking = await Booking.findById(booking._id)
      .populate('user', 'name email phone')
      .populate({ path: 'show', populate: [{ path: 'movie' }, { path: 'theatre' }] });

    // ── Send ticket email (non-blocking) ──────────────────────────────────────
    sendTicketEmail(populatedBooking).catch(err =>
      console.error('Email send failed (non-fatal):', err.message)
    );

    res.json({ booking: populatedBooking });
  })
);

// ─── Stripe Webhook ───────────────────────────────────────────────────────────
const webhookRouter = express.Router();

webhookRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body, sig, process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'checkout.session.completed') {
      console.log('Payment successful for session:', event.data.object.id);
    }
    res.json({ received: true });
  })
);

module.exports = router;
module.exports.webhookRouter = webhookRouter;