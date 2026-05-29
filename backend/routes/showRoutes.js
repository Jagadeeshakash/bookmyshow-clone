const express = require('express');
const router  = express.Router();
const {
  getShows, getShowById, createShow, updateShow, deleteShow,
  updateSeatLayout, adminToggleSeat,
} = require('../controllers/showController');
const { protect }         = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

router.get('/',    getShows);
router.get('/:id', getShowById);
router.post('/',      protect, adminMiddleware, createShow);
router.put('/:id',    protect, adminMiddleware, updateShow);
router.delete('/:id', protect, adminMiddleware, deleteShow);
router.put('/:id/seat-layout', protect, adminMiddleware, updateSeatLayout);
router.put('/:id/toggle-seat', protect, adminMiddleware, adminToggleSeat);

module.exports = router;