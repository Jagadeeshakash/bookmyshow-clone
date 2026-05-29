const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Show = require('../models/Show');
const Coupon = require('../models/Coupon');
const { sendTicketEmail } = require('../utils/emailService');

// ─── Helper: safe populate ────────────────────────────────────────────────────
const populateBooking = (query) =>
  query
    .populate('user', 'name email phone')
    .populate({
      path: 'show',
      populate: [
        { path: 'movie', select: 'title poster genre rating duration language format' },
        { path: 'theatre', select: 'name location city' },
      ],
    });

// ─── @desc  Create a new booking ──────────────────────────────────────────────
// ─── @route POST /api/bookings ────────────────────────────────────────────────
// ─── @access Private ──────────────────────────────────────────────────────────
const createBooking = asyncHandler(async (req, res) => {
  const { showId, seats, totalAmount, paymentId, paymentMethod, couponCode, couponDiscount } = req.body;

  if (!showId || !seats || seats.length === 0) {
    res.status(400);
    throw new Error('Show ID and seats are required');
  }

  const show = await Show.findById(showId).populate('movie').populate('theatre');
  if (!show) {
    res.status(404);
    throw new Error('Show not found');
  }

  // Check for already-booked seats
  const alreadyBooked = seats.filter(seat => show.bookedSeats.includes(seat));
  if (alreadyBooked.length > 0) {
    res.status(400);
    throw new Error(`Seats already booked: ${alreadyBooked.join(', ')}`);
  }

  // Reserve the seats
  show.bookedSeats.push(...seats);
  show.availableSeats = show.totalSeats - show.bookedSeats.length;
  await show.save();

  // Increment coupon usage if applied
  if (couponCode) {
    await Coupon.findOneAndUpdate(
      { code: couponCode.toUpperCase() },
      { $inc: { usedCount: 1 } }
    );
  }

  // Create the booking record
  const booking = await Booking.create({
    user: req.user._id,
    show: showId,
    seats,
    amount: totalAmount,
    totalAmount,
    paymentId,
    paymentMethod: paymentMethod || 'Razorpay',
    paymentStatus: 'Paid',
    status: 'Confirmed',
    couponCode: couponCode || null,
    couponDiscount: couponDiscount || 0,
  });

  const populatedBooking = await populateBooking(Booking.findById(booking._id));

  // Send confirmation email (non-blocking)
  sendTicketEmail(populatedBooking).catch(err =>
    console.error('Email send failed (non-fatal):', err.message)
  );

  res.status(201).json({
    success: true,
    message: 'Booking confirmed!',
    booking: populatedBooking,
  });
});

// ─── @desc  Get all bookings for logged-in user ───────────────────────────────
// ─── @route GET /api/bookings/my ─────────────────────────────────────────────
// ─── @access Private ──────────────────────────────────────────────────────────
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await populateBooking(
    Booking.find({ user: req.user._id }).sort({ createdAt: -1 })
  );
  res.json({ success: true, bookings });
});

// ─── @desc  Get single booking by ID ─────────────────────────────────────────
// ─── @route GET /api/bookings/:id ────────────────────────────────────────────
// ─── @access Private ──────────────────────────────────────────────────────────
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await populateBooking(Booking.findById(req.params.id));

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (
    booking.user._id.toString() !== req.user._id.toString() &&
    req.user.role !== 'admin'
  ) {
    res.status(403);
    throw new Error('Not authorized to view this booking');
  }

  res.json({ success: true, booking });
});

// ─── @desc  Get all bookings (admin) ─────────────────────────────────────────
// ─── @route GET /api/bookings/all ────────────────────────────────────────────
// ─── @access Private/Admin ───────────────────────────────────────────────────
const getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await populateBooking(
    Booking.find({}).sort({ createdAt: -1 })
  );
  res.json({ success: true, count: bookings.length, bookings });
});

// ─── @desc  Resend ticket email ───────────────────────────────────────────────
// ─── @route POST /api/bookings/:id/resend-email ──────────────────────────────
// ─── @access Private ──────────────────────────────────────────────────────────
const resendTicketEmail = asyncHandler(async (req, res) => {
  const booking = await populateBooking(Booking.findById(req.params.id));

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (booking.user._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }

  await sendTicketEmail(booking);
  res.json({ success: true, message: `Ticket resent to ${booking.user.email}` });
});

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  getAllBookings,
  resendTicketEmail,
};