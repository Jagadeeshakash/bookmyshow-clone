const Razorpay = require('razorpay');
const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Show = require('../models/Show');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc  Create Razorpay Order
// @route POST /api/payment/create-order
const createOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid amount' });
  }

  const options = {
    amount: Math.round(amount * 100), // paise
    currency: 'INR',
    receipt: `receipt_${Date.now()}`,
    notes: { userId: req.user._id.toString() },
  };

  const order = await razorpay.orders.create(options);

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});

// @desc  Verify Razorpay Payment & Create Booking
// @route POST /api/payment/verify
const verifyPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    showId,
    seats,
    amount,
    convenienceFee,
    discount,
    totalAmount,
  } = req.body;

  // Step 1: Verify signature
  const body = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
  }

  // Step 2: Check show exists
  const show = await Show.findById(showId);
  if (!show) return res.status(404).json({ message: 'Show not found' });

  // Step 3: Check seat conflict
  const conflict = seats.some(s => show.bookedSeats.includes(s));
  if (conflict) return res.status(400).json({ message: 'Some seats are already booked' });

  // Step 4: Update booked seats
  show.bookedSeats = [...show.bookedSeats, ...seats];
  show.availableSeats = show.totalSeats - show.bookedSeats.length;
  await show.save();

  // Step 5: Create booking — 'amount' is required in Booking schema
  const baseAmount   = amount || totalAmount || 0;
  const convenience  = convenienceFee ?? 48;
  const disc         = discount ?? 0;
  const finalTotal   = totalAmount || (baseAmount + convenience - disc);

  const booking = await Booking.create({
    user:            req.user._id,
    show:            showId,
    seats,
    amount:          baseAmount,        // ← required field
    convenienceFee:  convenience,
    discount:        disc,
    totalAmount:     finalTotal,
    paymentMethod:   'Razorpay',
    paymentId:       razorpay_payment_id,
    orderId:         razorpay_order_id,
    status:          'Confirmed',
  });

  const populated = await booking.populate([
    { path: 'show', populate: [{ path: 'movie' }, { path: 'theatre' }] },
    { path: 'user', select: 'name email' },
  ]);

  res.status(201).json({
    message: 'Payment verified and booking confirmed!',
    booking: populated,
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
  });
});

// @desc  Get Razorpay Key
// @route GET /api/payment/key
const getKey = asyncHandler(async (req, res) => {
  res.json({ keyId: process.env.RAZORPAY_KEY_ID });
});

module.exports = { createOrder, verifyPayment, getKey };