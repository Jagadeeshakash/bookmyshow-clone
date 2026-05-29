const express = require('express');
const router = express.Router();
const {
  createBooking,
  getMyBookings,
  getBookingById,
  getAllBookings,
  resendTicketEmail,
} = require('../controllers/bookingController');
const { protect, admin } = require('../middleware/authMiddleware');

// ── Specific routes FIRST (before /:id) ──────────────────────────────────────
router.get('/my', protect, getMyBookings);
router.get('/all', protect, admin, getAllBookings);

// ── General routes ────────────────────────────────────────────────────────────
router.post('/', protect, createBooking);
router.get('/:id', protect, getBookingById);
router.post('/:id/resend-email', protect, resendTicketEmail);

module.exports = router;