const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
  seats: [{ type: String }],
  amount: { type: Number, required: true },
  convenienceFee: { type: Number, default: 48 },
  discount: { type: Number, default: 0 },
  totalAmount: { type: Number },
  paymentMethod: { type: String },
  paymentStatus: { type: String, default: 'paid' },
  status: { type: String, enum: ['Confirmed', 'Pending', 'Cancelled', 'Refunded'], default: 'Confirmed' },

  // ── Coupon Fields ─────────────────────────────────────────
  couponCode: { type: String, default: null },
  couponDiscount: { type: Number, default: 0 },

  // ── Stripe Fields ─────────────────────────────────────────
  stripeSessionId:       { type: String, default: null },
  stripePaymentIntentId: { type: String, default: null },

  // ── Cancellation & Refund Fields ──────────────────────────
  cancellationReason: { type: String, default: null },
  cancelledAt:        { type: Date,   default: null },
  refundId:           { type: String, default: null },
  refundAmount:       { type: Number, default: 0 },
  refundStatus:       { type: String, enum: ['pending', 'processed', 'failed', 'not_applicable', null], default: null },

}, { timestamps: true });

bookingSchema.pre('save', function (next) {
  if (this.isNew) {
    this.bookingId = 'BK' + Date.now().toString().slice(-10);
    if (!this.totalAmount) {
      this.totalAmount = this.amount + this.convenienceFee - this.discount - (this.couponDiscount || 0);
    }
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);