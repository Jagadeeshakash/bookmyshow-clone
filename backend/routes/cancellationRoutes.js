const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');

// ── Use existing models (not inline schemas) ───────────────────────────────────
const Booking = require('../models/Booking');
const Show = require('../models/Show');

// ─── Cancellation Policy ───────────────────────────────────────────────────────
function convertTo24h(timeStr) {
  if (!timeStr) return '00:00:00';
  const parts = timeStr.trim().split(' ');
  if (parts.length === 1) return timeStr; // already 24h
  const [time, modifier] = parts;
  let [hours, minutes] = time.split(':');
  hours = parseInt(hours);
  if (modifier === 'PM' && hours !== 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${minutes}:00`;
}

function calculateRefundPercent(showDate, showTime) {
  try {
    const showDateStr = new Date(showDate).toISOString().split('T')[0];
    const showDateTime = new Date(`${showDateStr}T${convertTo24h(showTime)}`);
    const now = new Date();
    const hoursLeft = (showDateTime - now) / (1000 * 60 * 60);

    if (hoursLeft > 24) return { percent: 100, label: 'Full Refund (>24h before show)' };
    if (hoursLeft > 12) return { percent: 75,  label: '75% Refund (12-24h before show)' };
    if (hoursLeft > 4)  return { percent: 50,  label: '50% Refund (4-12h before show)' };
    if (hoursLeft > 1)  return { percent: 25,  label: '25% Refund (1-4h before show)' };
    return { percent: 0, label: 'No Refund (<1h before show)' };
  } catch {
    return { percent: 100, label: 'Full Refund' };
  }
}

// ─── GET /api/cancellation/policy ─────────────────────────────────────────────
router.get('/policy', (req, res) => {
  res.json({
    policy: [
      { timeframe: 'More than 24 hours before show', refund: '100%', label: 'Full Refund' },
      { timeframe: '12 – 24 hours before show',      refund: '75%',  label: 'Partial Refund' },
      { timeframe: '4 – 12 hours before show',       refund: '50%',  label: 'Partial Refund' },
      { timeframe: '1 – 4 hours before show',        refund: '25%',  label: 'Minimal Refund' },
      { timeframe: 'Less than 1 hour before show',   refund: '0%',   label: 'No Refund' },
    ],
    note: 'Refunds are credited to your original payment method within 5-7 business days.'
  });
});

// ─── GET /api/cancellation/check/:bookingId ────────────────────────────────────
router.get('/check/:bookingId', asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId).populate({
    path: 'show',
    populate: [{ path: 'movie' }, { path: 'theatre' }]
  });

  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.status === 'Cancelled') return res.status(400).json({ message: 'Booking already cancelled' });

  const show = booking.show;
  const { percent, label } = calculateRefundPercent(show.date, show.time);
  const refundAmount = Math.floor((booking.totalAmount * percent) / 100);

  res.json({
    bookingId: booking._id,
    movie: show.movie?.title,
    theatre: show.theatre?.name,
    showDate: show.date,
    showTime: show.time,
    seats: booking.seats,
    totalPaid: booking.totalAmount,
    refundPercent: percent,
    refundAmount,
    refundLabel: label,
    canCancel: true,
    nonRefundable: booking.totalAmount - refundAmount,
  });
}));

// ─── POST /api/cancellation/cancel/:bookingId ──────────────────────────────────
router.post('/cancel/:bookingId', asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const booking = await Booking.findById(req.params.bookingId).populate('show');
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.status === 'Cancelled') return res.status(400).json({ message: 'Already cancelled' });

  const show = booking.show;
  const { percent, label } = calculateRefundPercent(show?.date, show?.time);
  const refundAmount = Math.floor((booking.totalAmount * percent) / 100);

  // Restore seats in the show
  if (show) {
    await Show.findByIdAndUpdate(show._id, {
      $pull: { bookedSeats: { $in: booking.seats } },
      $inc: { availableSeats: booking.seats.length },
    });
  }

  // Update booking status — use 'Cancelled' to match schema enum
  booking.status = 'Cancelled';
  booking.cancellationReason = reason || 'Cancelled by admin';
  booking.cancelledAt = new Date();
  booking.refundAmount = refundAmount;
  booking.refundStatus = refundAmount > 0 ? 'pending' : 'not_applicable';

  // Try Razorpay refund if payment exists
  if (booking.paymentId && refundAmount > 0) {
    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const refund = await razorpay.payments.refund(booking.paymentId, {
        amount: refundAmount * 100,
        notes: { reason: reason || 'User requested cancellation', bookingId: booking._id.toString() },
      });
      booking.refundId = refund.id;
      booking.refundStatus = 'processed';
    } catch (err) {
      console.error('Razorpay refund error:', err.message);
      booking.refundStatus = 'pending';
    }
  }

  await booking.save();

  res.json({
    success: true,
    message: refundAmount > 0
      ? `Booking cancelled. ₹${refundAmount} will be refunded within 5-7 business days.`
      : 'Booking cancelled. No refund applicable as per cancellation policy.',
    refundAmount,
    refundLabel: label,
    refundStatus: booking.refundStatus,
    cancellationId: booking._id,
  });
}));

// ─── GET /api/cancellation/history ────────────────────────────────────────────
router.get('/history', asyncHandler(async (req, res) => {
  const cancelled = await Booking.find({ status: 'Cancelled' })
    .populate({ path: 'show', populate: [{ path: 'movie' }, { path: 'theatre' }] })
    .sort({ cancelledAt: -1 })
    .limit(20);

  res.json(cancelled);
}));

module.exports = router;