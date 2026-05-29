const asyncHandler = require('express-async-handler');
const Movie = require('../models/Movie');

const getMovies = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const movies = await Movie.find(filter).sort({ createdAt: -1 });
  res.json(movies);
});

const getMovieById = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  res.json(movie);
});

const createMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.create(req.body);
  res.status(201).json(movie);
});

const updateMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!movie) return res.status(404).json({ message: 'Movie not found' });
  res.json(movie);
});

const deleteMovie = asyncHandler(async (req, res) => {
  await Movie.findByIdAndDelete(req.params.id);
  res.json({ message: 'Movie removed' });
});

// ── TMDB Search proxy (keeps API key server-side) ─────────────────────────
const searchTMDB = asyncHandler(async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ message: 'Query is required' });

  const url = `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&include_adult=false&language=en-US&page=1`;

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
    },
  });

  if (!response.ok) return res.status(502).json({ message: 'TMDB API error' });

  const data = await response.json();
  res.json(data.results || []);
});

// ── TMDB Get full movie details by TMDB ID ────────────────────────────────
const getTMDBDetails = asyncHandler(async (req, res) => {
  const { tmdbId } = req.params;

  // Fetch movie details + videos (trailers) in one call using append_to_response
  const url = `https://api.themoviedb.org/3/movie/${tmdbId}?append_to_response=videos,credits&language=en-US`;

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${process.env.TMDB_READ_TOKEN}`,
    },
  });

  if (!response.ok) return res.status(502).json({ message: 'TMDB API error' });

  const movie = await response.json();

  // Find YouTube trailer
  const trailer = movie.videos?.results?.find(
    v => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
  );

  // Map genres
  const genres = movie.genres?.map(g => g.name) || [];

  // Map spoken languages
  const languages = movie.spoken_languages?.map(l => l.english_name) || [];

  // Build clean response
  res.json({
    tmdbId:      movie.id,
    title:       movie.title || '',
    description: movie.overview || '',
    poster:      movie.poster_path   ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`    : '',
    banner:      movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : '',
    trailer:     trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : '',
    genre:       genres,
    language:    languages.length > 0 ? languages : ['English'],
    duration:    movie.runtime || 0,
    rating:      movie.vote_average ? parseFloat(movie.vote_average.toFixed(1)) : 0,
    releaseDate: movie.release_date || '',
    popularity:  movie.popularity || 0,
  });
});

module.exports = { getMovies, getMovieById, createMovie, updateMovie, deleteMovie, searchTMDB, getTMDBDetails };