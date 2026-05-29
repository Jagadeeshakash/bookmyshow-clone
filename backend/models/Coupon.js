const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  description: { type: String, default: '' },
  discountType: {
    type: String,
    enum: ['percentage', 'flat'],
    default: 'percentage',
  },
  discountValue: { type: Number, required: true },   // % or flat ₹
  maxDiscount: { type: Number, default: null },       // cap for % type
  minOrderAmount: { type: Number, default: 0 },
  usageLimit: { type: Number, default: null },        // null = unlimited
  usedCount: { type: Number, default: 0 },
  expiryDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  type: { type: String, default: 'General' },         // e.g. Weekend, First Booking
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);