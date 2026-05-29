const mongoose = require('mongoose');

const screenSchema = new mongoose.Schema({
  number:     { type: Number, required: true },   // 1, 2, 3...
  name:       { type: String },                    // "Screen 1", "IMAX Screen" etc
  totalSeats: { type: Number, default: 100 },
  format:     [{ type: String }],                  // ['2D','IMAX','4DX']
  status:     { type: String, enum: ['Active','Inactive'], default: 'Active' },
}, { _id: true });

const theatreSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  location:   { type: String, required: true },
  city:       { type: String, required: true },
  screens:    { type: Number, default: 1 },        // total screen count
  screenList: [screenSchema],                      // ✅ named screen details
  totalSeats: { type: Number, required: true },
  status:     { type: String, enum: ['Active','Inactive'], default: 'Active' },
  amenities:  [{ type: String }],
}, { timestamps: true });

module.exports = mongoose.model('Theatre', theatreSchema);