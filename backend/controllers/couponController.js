const asyncHandler = require('express-async-handler');
const Coupon = require('../models/Coupon');

// @desc  Validate & apply a coupon code
// @route POST /api/coupons/validate
// @access Private
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;

  if (!code) {
    res.status(400);
    throw new Error('Coupon code is required');
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });

  if (!coupon) {
    res.status(404);
    throw new Error('Invalid coupon code');
  }

  if (!coupon.isActive) {
    res.status(400);
    throw new Error('This coupon is no longer active');
  }

  // ✅ FIX: Compare date only (ignore time), so today's date is still valid
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(coupon.expiryDate);
  expiry.setHours(23, 59, 59, 999); // expiry date is valid until end of that day

  if (today > expiry) {
    res.status(400);
    throw new Error('This coupon has expired');
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error('This coupon has reached its usage limit');
  }

  // ✅ FIX: Use raw orderAmount for min check, default to 0 if not sent
  const amount = parseFloat(orderAmount) || 0;

  if (coupon.minOrderAmount > 0 && amount < coupon.minOrderAmount) {
    res.status(400);
    throw new Error(`Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`);
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (amount * coupon.discountValue) / 100;
    if (coupon.maxDiscount) {
      discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    }
  } else {
    discountAmount = coupon.discountValue;
  }

  discountAmount = Math.min(discountAmount, amount);
  discountAmount = Math.round(discountAmount);

  res.json({
    success: true,
    coupon: {
      _id: coupon._id,
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
    },
    discountAmount,
    finalAmount: amount - discountAmount,
  });
});

// @desc  Get all coupons (admin)
// @route GET /api/coupons
// @access Private/Admin
const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 });
  res.json({ success: true, coupons });
});

// @desc  Create coupon (admin)
// @route POST /api/coupons
// @access Private/Admin
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code, description, discountType, discountValue,
    maxDiscount, minOrderAmount, usageLimit, expiryDate, isActive, type,
  } = req.body;

  if (!code || !discountValue || !expiryDate) {
    res.status(400);
    throw new Error('Code, discount value, and expiry date are required');
  }

  const exists = await Coupon.findOne({ code: code.toUpperCase().trim() });
  if (exists) {
    res.status(400);
    throw new Error('Coupon code already exists');
  }

  const coupon = await Coupon.create({
    code: code.toUpperCase().trim(),
    description,
    discountType: discountType || 'percentage',
    discountValue,
    maxDiscount: maxDiscount || null,
    minOrderAmount: minOrderAmount || 0,
    usageLimit: usageLimit || null,
    expiryDate,
    isActive: isActive !== undefined ? isActive : true,
    type: type || 'General',
  });

  res.status(201).json({ success: true, coupon });
});

// @desc  Update coupon (admin)
// @route PUT /api/coupons/:id
// @access Private/Admin
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  const updated = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json({ success: true, coupon: updated });
});

// @desc  Delete coupon (admin)
// @route DELETE /api/coupons/:id
// @access Private/Admin
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error('Coupon not found');
  }
  await coupon.deleteOne();
  res.json({ success: true, message: 'Coupon deleted' });
});

module.exports = { validateCoupon, getAllCoupons, createCoupon, updateCoupon, deleteCoupon };