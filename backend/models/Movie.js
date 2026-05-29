const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  genre: [{ type: String }],
  language: [{ type: String }],
  duration: { type: Number }, // in minutes
  releaseDate: { type: Date },
  poster: { type: String },
  banner: { type: String },
  trailer: { type: String },
  cast: [{ name: String, role: String }],
  rating: { type: Number, default: 0 },
  status: { type: String, enum: ['Upcoming', 'Now Showing', 'Coming Soon'], default: 'Upcoming' },
  format: [{ type: String }], // 2D, IMAX 2D, 4DX etc
}, { timestamps: true });

module.exports = mongoose.model('Movie', movieSchema);