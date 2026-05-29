const asyncHandler = require('express-async-handler');
const Movie   = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show    = require('../models/Show');
const Booking = require('../models/Booking');
const User    = require('../models/User');

const getDashboardStats = asyncHandler(async (req, res) => {

  const today      = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd   = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const [
    totalMovies, totalTheatres, totalShows, totalUsers, showsToday,
    allBookings, confirmedBookings,
  ] = await Promise.all([
    Movie.countDocuments(),
    Theatre.countDocuments(),
    Show.countDocuments(),
    User.countDocuments(),
    Show.countDocuments({ date: { $gte: todayStart, $lt: todayEnd } }),
    Booking.find()
      .populate({ path: 'show', populate: { path: 'movie', select: 'title poster genre' } })
      .lean(),
    Booking.find({ status: 'Confirmed' })
      .populate({ path: 'show', populate: { path: 'movie', select: 'title poster genre' } })
      .lean(),
  ]);

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalBookings = confirmedBookings.length;
  const totalRevenue  = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // ── Unique movies booked ──────────────────────────────────────────────
  const movieIdSet = new Set();
  confirmedBookings.forEach(b => {
    const id = b.show?.movie?._id?.toString();
    if (id) movieIdSet.add(id);
  });
  const totalMoviesBooked = movieIdSet.size;

  // ── Occupancy rate ────────────────────────────────────────────────────
  // Total seats booked / total seats available across all shows
  const allShows = await Show.find().lean();
  const totalCapacity = allShows.reduce((sum, s) => sum + (s.totalSeats || 0), 0);
  const totalBooked   = allShows.reduce((sum, s) => sum + (s.bookedSeats?.length || 0), 0);
  const occupancyRate = totalCapacity > 0
    ? Math.round((totalBooked / totalCapacity) * 100 * 10) / 10
    : 0;

  // ── Bookings by status (all bookings) ────────────────────────────────
  const statusMap = {};
  allBookings.forEach(b => {
    const s = b.status || 'Unknown';
    statusMap[s] = (statusMap[s] || 0) + 1;
  });
  const bookingsByStatus = Object.entries(statusMap).map(([_id, count]) => ({ _id, count }));

  // ── Revenue chart (confirmed, last 6 months) ─────────────────────────
  const revenueMap = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    revenueMap[key] = 0;
  }
  confirmedBookings.forEach(b => {
    const d   = new Date(b.createdAt);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (revenueMap[key] !== undefined) revenueMap[key] += b.totalAmount || 0;
  });
  const revenueChart = Object.entries(revenueMap).map(([_id, revenue]) => ({ _id, revenue }));

  // ── Top movies (confirmed only) ───────────────────────────────────────
  const movieBookingMap = {};
  confirmedBookings.forEach(b => {
    const movie = b.show?.movie;
    if (!movie) return;
    const id = movie._id?.toString();
    if (!id) return;
    if (!movieBookingMap[id]) {
      movieBookingMap[id] = {
        _id: id, title: movie.title || 'Unknown',
        poster: movie.poster || '', genre: movie.genre || [],
        totalBookings: 0, totalRevenue: 0,
      };
    }
    movieBookingMap[id].totalBookings += 1;
    movieBookingMap[id].totalRevenue  += b.totalAmount || 0;
  });
  const topMovies = Object.values(movieBookingMap)
    .sort((a, b) => b.totalBookings - a.totalBookings)
    .slice(0, 5);

  // ── Bookings by channel (derive from paymentMethod) ───────────────────
  const channelMap = { 'Mobile App': 0, 'Website': 0, 'Box Office': 0, 'Partner Apps': 0 };
  allBookings.forEach(b => {
    const m = (b.paymentMethod || '').toLowerCase();
    if (m.includes('stripe'))   channelMap['Website']      += 1;
    else if (m.includes('razorpay')) channelMap['Mobile App'] += 1;
    else if (m.includes('cash'))     channelMap['Box Office']  += 1;
    else                              channelMap['Website']     += 1;
  });
  const bookingsByChannel = Object.entries(channelMap).map(([name, count]) => ({ name, count }));

  // ── User growth (registrations per month, last 6 months) ─────────────
  const users = await User.find({}, 'createdAt').lean();
  const userGrowthMap = {};
  for (let i = 5; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    userGrowthMap[key] = 0;
  }
  users.forEach(u => {
    const d   = new Date(u.createdAt);
    const key = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    if (userGrowthMap[key] !== undefined) userGrowthMap[key] += 1;
  });
  // Cumulative
  let cumulative = 0;
  const userGrowth = Object.entries(userGrowthMap).map(([month, newUsers]) => {
    cumulative += newUsers;
    return { month, newUsers, total: cumulative };
  });

  // ── Recent bookings (last 5, all statuses) ────────────────────────────
  const recentBookings = await Booking.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('user', 'name email')
    .populate({ path: 'show', populate: { path: 'movie', select: 'title poster genre' } })
    .lean();

  res.json({
    totalMovies, totalTheatres, totalShows, totalBookings,
    totalUsers, totalRevenue, totalMoviesBooked,
    showsToday, occupancyRate,
    bookingsByStatus, revenueChart, topMovies,
    bookingsByChannel, userGrowth,
    recentBookings,
  });
});

module.exports = { getDashboardStats };