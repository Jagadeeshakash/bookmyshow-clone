const asyncHandler = require('express-async-handler');
const Theatre = require('../models/Theatre');

const getTheatres = asyncHandler(async (req, res) => {
  const { city } = req.query;
  const filter = city ? { city: new RegExp(city, 'i') } : {};
  const theatres = await Theatre.find(filter);
  res.json(theatres);
});

const getTheatreById = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);
  if (!theatre) return res.status(404).json({ message: 'Theatre not found' });
  res.json(theatre);
});

const createTheatre = asyncHandler(async (req, res) => {
  const { screens, screenList, ...rest } = req.body;
  const screenCount = Number(screens) || 1;

  // ✅ Auto-generate screenList if not provided
  let finalScreenList = screenList;
  if (!screenList || screenList.length === 0) {
    finalScreenList = Array.from({ length: screenCount }, (_, i) => ({
      number:     i + 1,
      name:       `Screen ${i + 1}`,
      totalSeats: Math.floor((Number(rest.totalSeats) || 100) / screenCount),
      format:     ['2D'],
      status:     'Active',
    }));
  }

  const theatre = await Theatre.create({
    ...rest,
    screens: screenCount,
    screenList: finalScreenList,
  });
  res.status(201).json(theatre);
});

const updateTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!theatre) return res.status(404).json({ message: 'Theatre not found' });
  res.json(theatre);
});

const deleteTheatre = asyncHandler(async (req, res) => {
  await Theatre.findByIdAndDelete(req.params.id);
  res.json({ message: 'Theatre removed' });
});

// ✅ Update individual screen details
const updateScreen = asyncHandler(async (req, res) => {
  const { screenId } = req.params;
  const theatre = await Theatre.findById(req.params.id);
  if (!theatre) return res.status(404).json({ message: 'Theatre not found' });

  const screen = theatre.screenList.id(screenId);
  if (!screen) return res.status(404).json({ message: 'Screen not found' });

  Object.assign(screen, req.body);
  await theatre.save();
  res.json(theatre);
});

module.exports = {
  getTheatres, getTheatreById, createTheatre,
  updateTheatre, deleteTheatre, updateScreen,
};