const mongoose = require('mongoose');

const seatCategorySchema = new mongoose.Schema({
  name:    { type: String, required: true },
  rows:    [{ type: String }],
  columns: { type: Number, default: 10 },   // ✅ per-category column count
  price:   { type: Number, required: true },
  color:   { type: String, default: '#e5335d' },
}, { _id: false });

const showSchema = new mongoose.Schema({
  movie:          { type: mongoose.Schema.Types.ObjectId, ref: 'Movie',   required: true },
  theatre:        { type: mongoose.Schema.Types.ObjectId, ref: 'Theatre', required: true },
  date:           { type: Date,   required: true },
  time:           { type: String, required: true },
  format:         { type: String, default: '2D' },
  language:       { type: String },
  totalSeats:     { type: Number, required: true },
  availableSeats: { type: Number },
  bookedSeats:    [{ type: String }],
  price:          { type: Number, required: true },
  status:         { type: String, enum: ['Active','Inactive','Cancelled'], default: 'Active' },
  // ✅ Screen reference
  screenNumber:   { type: Number, default: 1 },
  screenName:     { type: String, default: 'Screen 1' },
  seatCategories: [seatCategorySchema],
}, { timestamps: true });

showSchema.pre('save', function (next) {
  if (this.isNew) this.availableSeats = this.totalSeats;
  next();
});

module.exports = mongoose.model('Show', showSchema);