const asyncHandler = require('express-async-handler');
const Show = require('../models/Show');

const getShows = asyncHandler(async (req, res) => {
  const { movie, theatre, date } = req.query;
  let filter = {};
  if (movie)   filter.movie   = movie;
  if (theatre) filter.theatre = theatre;
  if (date) {
    const start = new Date(date); start.setHours(0,0,0,0);
    const end   = new Date(date); end.setHours(23,59,59,999);
    filter.date = { $gte: start, $lte: end };
  }
  const shows = await Show.find(filter)
    .populate('movie',   'title poster language genre duration format')
    .populate('theatre', 'name location city screens totalSeats')
    .sort({ date: 1, time: 1 });
  res.json(shows);
});

const getShowById = asyncHandler(async (req, res) => {
  const show = await Show.findById(req.params.id)
    .populate('movie')
    .populate('theatre');
  if (!show) return res.status(404).json({ message: 'Show not found' });
  res.json(show);
});

const createShow = asyncHandler(async (req, res) => {
  const show = await Show.create(req.body);
  res.status(201).json(show);
});

const updateShow = asyncHandler(async (req, res) => {
  const show = await Show.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!show) return res.status(404).json({ message: 'Show not found' });
  res.json(show);
});

const deleteShow = asyncHandler(async (req, res) => {
  await Show.findByIdAndDelete(req.params.id);
  res.json({ message: 'Show removed' });
});

// ── PUT /api/shows/:id/seat-layout ────────────────────────────────────────────
const updateSeatLayout = asyncHandler(async (req, res) => {
  const { seatCategories } = req.body;
  const show = await Show.findById(req.params.id);
  if (!show) return res.status(404).json({ message: 'Show not found' });

  // Recalculate totalSeats: each category row × its own columns
  const totalSeats = seatCategories.reduce(
    (sum, cat) => sum + (cat.rows.length * (cat.columns || 10)), 0
  );
  const bookedCount    = show.bookedSeats?.length || 0;
  const availableSeats = Math.max(0, totalSeats - bookedCount);

  const updated = await Show.findByIdAndUpdate(
    req.params.id,
    { seatCategories, totalSeats, availableSeats },
    { new: true }
  );
  res.json(updated);
});

// ── PUT /api/shows/:id/toggle-seat  (admin book/unbook individual seat) ────────
const adminToggleSeat = asyncHandler(async (req, res) => {
  const { seatId, action } = req.body; // action: 'book' | 'unbook'
  const show = await Show.findById(req.params.id);
  if (!show) return res.status(404).json({ message: 'Show not found' });

  let bookedSeats = [...(show.bookedSeats || [])];

  if (action === 'book') {
    if (!bookedSeats.includes(seatId)) bookedSeats.push(seatId);
  } else {
    bookedSeats = bookedSeats.filter(s => s !== seatId);
  }

  show.bookedSeats    = bookedSeats;
  show.availableSeats = show.totalSeats - bookedSeats.length;
  await show.save();

  res.json({ bookedSeats: show.bookedSeats, availableSeats: show.availableSeats });
});

module.exports = {
  getShows, getShowById, createShow, updateShow, deleteShow,
  updateSeatLayout, adminToggleSeat,
};