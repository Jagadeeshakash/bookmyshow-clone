const express = require('express');
const router  = express.Router();
const {
  getMovies, getMovieById, createMovie, updateMovie, deleteMovie,
  searchTMDB, getTMDBDetails,
} = require('../controllers/movieController');
const { protect }         = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/adminMiddleware');

// ── TMDB proxy routes MUST come BEFORE /:id ───────────────────────────────

// ✅ Search & details — protected (admin only)
router.get('/tmdb/search',          protect, adminMiddleware, searchTMDB);
router.get('/tmdb/details/:tmdbId', protect, adminMiddleware, getTMDBDetails);

// ✅ Image proxy — NO auth required
// Browser <img> tags can't send Authorization headers,
// so this must be public. It only proxies public TMDB images anyway.
router.get('/tmdb/image', async (req, res) => {
  try {
    const { path, size = 'w500' } = req.query;
    if (!path) return res.status(400).json({ message: 'path query param is required' });

    // Security: only allow valid TMDB image paths
    if (!/^\/[a-zA-Z0-9_\-.]+\.(jpg|jpeg|png|webp)$/i.test(path)) {
      return res.status(400).json({ message: 'Invalid image path' });
    }

    const url = `https://image.tmdb.org/t/p/${size}${path}`;
    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({ message: 'Failed to fetch image from TMDB' });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400');

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('TMDB image proxy error:', err.message);
    res.status(502).json({ message: 'Image proxy error' });
  }
});

// ── Public routes ─────────────────────────────────────────────────────────
router.get('/',    getMovies);
router.get('/:id', getMovieById);

// ── Admin CRUD ────────────────────────────────────────────────────────────
router.post('/',      protect, adminMiddleware, createMovie);
router.put('/:id',    protect, adminMiddleware, updateMovie);
router.delete('/:id', protect, adminMiddleware, deleteMovie);

module.exports = router;