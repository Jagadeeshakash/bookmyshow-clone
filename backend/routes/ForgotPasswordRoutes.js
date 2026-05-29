const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// ── User model ────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    role: { type: String, default: 'user' },
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model('User', userSchema);

// ── In-memory OTP store (use Redis in production) ─────────────────────────────
const otpStore = {};

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

// ── POST /api/forgot-password/send-otp ────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    // Fetch user for personalization — but do NOT block if not found
    const user = await User.findOne({ email });
    const userName = user ? user.name : 'User';

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 10 * 60 * 1000 }; // 10 min expiry

    // Send OTP email
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"BookMyShow" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Your OTP for Password Reset — BookMyShow',
      html: `
<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f4;margin:0;padding:20px">
<div style="max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
  <div style="background:linear-gradient(135deg,#cc0000,#ff3366);padding:28px 24px;text-align:center">
    <div style="font-size:26px;font-weight:800;color:#fff">BookMyShow</div>
    <p style="color:rgba(255,255,255,0.85);margin-top:6px;font-size:13px">Password Reset OTP</p>
  </div>
  <div style="padding:30px 24px">
    <p style="font-size:15px;color:#333;margin-bottom:24px">Hi <strong>${userName}</strong>,<br/>Use the OTP below to reset your password. It expires in <strong>10 minutes</strong>.</p>
    <div style="background:#f8f8f8;border:2px dashed #e5335d;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
      <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#cc0000">${otp}</div>
      <p style="font-size:12px;color:#999;margin-top:8px">Valid for 10 minutes only</p>
    </div>
    <p style="font-size:12px;color:#999;line-height:1.6">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
  </div>
  <div style="background:#f8f8f8;padding:16px;text-align:center;border-top:1px solid #eee">
    <p style="font-size:11px;color:#aaa">&copy; ${new Date().getFullYear()} BookMyShow. All rights reserved.</p>
  </div>
</div>
</body></html>`,
    });

    console.log(`✅ OTP sent to ${email}: ${otp}`);
    res.json({ success: true, message: 'OTP sent to your email' });
  } catch (err) {
    console.error('Send OTP error:', err.message);
    res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
  }
});

// ── POST /api/forgot-password/verify-otp ─────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: 'Email and OTP are required' });

    const record = otpStore[email];
    if (!record)
      return res.status(400).json({ message: 'OTP not found. Please request a new one.' });

    if (Date.now() > record.expires) {
      delete otpStore[email];
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== otp)
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });

    // Mark as verified
    otpStore[email].verified = true;
    res.json({ success: true, message: 'OTP verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed. Please try again.' });
  }
});

// ── POST /api/forgot-password/reset-password ──────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword || !confirmPassword)
      return res.status(400).json({ message: 'All fields are required' });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: 'Passwords do not match' });

    if (newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const record = otpStore[email];
    if (!record || !record.verified)
      return res.status(400).json({ message: 'Please verify OTP first' });

    // ✅ FIX: If user doesn't exist, create a new account with the email
    let user = await User.findOne({ email });
    if (!user) {
      // Extract a name from the email (part before @)
      const nameFromEmail = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim();
      user = await User.create({
        name: nameFromEmail,
        email,
        phone: '',
        password: bcrypt.hashSync(newPassword, 10),
        role: 'user',
      });
      delete otpStore[email];
      return res.json({ success: true, message: 'Account created and password set! Please login.' });
    }

    // Existing user — just update password
    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();

    delete otpStore[email];
    res.json({ success: true, message: 'Password reset successfully! Please login.' });
  } catch (err) {
    console.error('Reset password error:', err.message);
    res.status(500).json({ message: 'Failed to reset password. Please try again.' });
  }
});

// Keep old routes for compatibility
router.post('/', async (req, res) =>
  res.status(400).json({ message: 'Use /send-otp endpoint' })
);
router.post('/reset', async (req, res) =>
  res.status(400).json({ message: 'Use /reset-password endpoint' })
);

module.exports = router;