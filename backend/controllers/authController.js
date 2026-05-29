const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// @desc  Register user
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ message: 'Please fill all required fields' });

  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'User already exists' });

  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = await User.create({ name, email, phone, password: hashedPassword, role: 'user' });

  if (user) {
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role, token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
});

// @desc  Login — direct, no OTP
// POST  /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Please enter email and password' });

  const user = await User.findOne({ email });
  if (!user)
    return res.status(401).json({ message: 'Invalid email or password' });

  const passwordMatch = bcrypt.compareSync(password, user.password);
  if (!passwordMatch)
    return res.status(401).json({ message: 'Invalid email or password' });

  // ✅ Direct login for all users — no OTP
  res.json({
    _id: user._id, name: user.name, email: user.email,
    phone: user.phone, role: user.role, token: generateToken(user._id),
  });
});

// @desc  Get profile
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({ _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

// @desc  Get all users (admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
});

module.exports = { registerUser, loginUser, getUserProfile, getAllUsers };