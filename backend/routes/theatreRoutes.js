// theatreRoutes.js - save as routes/theatreRoutes.js
const express = require('express');
const router = express.Router();
const { getTheatres, getTheatreById, createTheatre, updateTheatre, deleteTheatre } = require('../controllers/theatreController');
const { protect } = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

router.get('/', getTheatres);
router.get('/:id', getTheatreById);
router.post('/', protect, adminMiddleware, createTheatre);
router.put('/:id', protect, adminMiddleware, updateTheatre);
router.delete('/:id', protect, adminMiddleware, deleteTheatre);

module.exports = router;