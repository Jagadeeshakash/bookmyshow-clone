import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMovieById } from '../redux/slices/movieSlice';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FiStar, FiClock, FiCalendar, FiPlay, FiArrowLeft, FiX, FiHeart } from 'react-icons/fi';
import moment from 'moment';

const extractYouTubeId = (url) => {
  if (!url) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
    if (u.pathname.includes('/embed/')) return u.pathname.split('/embed/')[1].split('?')[0];
    return u.searchParams.get('v');
  } catch {
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }
};

const MovieDetails = () => {
  const { id }   = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentMovie: movie, loading } = useSelector(state => state.movies);
  const [showTrailer, setShowTrailer] = useState(false);
  const [liked,       setLiked]       = useState(false);
  const [imgError,    setImgError]    = useState(false);

  useEffect(() => { dispatch(fetchMovieById(id)); }, [id, dispatch]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setShowTrailer(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  if (loading) return (
    <div style={{ background: '#f5f5f7', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(229,51,93,0.2)', borderTopColor: '#e5335d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!movie) return (
    <div style={{ background: '#f5f5f7', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ textAlign: 'center', padding: 80, color: '#666' }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🎬</div>
        <h2 style={{ color: '#333', marginBottom: 8 }}>Movie not found</h2>
        <button onClick={() => navigate('/')} style={{ background: '#e5335d', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 600 }}>
          Go Home
        </button>
      </div>
    </div>
  );

  const fallback    = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&h=500&fit=crop';
  const youtubeId   = extractYouTubeId(movie.trailer);
  const thumbnailUrl= youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : null;

  const statusColor = {
    'Now Showing': { bg: '#e5335d', text: '#fff',     label: '● Now Showing' },
    'Upcoming':    { bg: '#0ea5e9', text: '#fff',     label: '📅 Upcoming'   },
    'Coming Soon': { bg: '#f59e0b', text: '#fff',     label: '🔜 Coming Soon'},
  }[movie.status] || { bg: '#666', text: '#fff', label: movie.status };

  return (
    <div style={{ background: '#f5f5f7', minHeight: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
        .md-tag { display:inline-block; padding:4px 14px; border-radius:20px; font-size:12px; font-weight:600; margin:0 4px 4px 0; }
        .md-btn-book {
          display:inline-flex; align-items:center; gap:8px;
          background: linear-gradient(135deg,#e5335d,#be123c);
          color:#fff; border:none; border-radius:10px;
          padding:13px 28px; font-size:15px; font-weight:700;
          cursor:pointer; font-family:Poppins; width:100%;
          justify-content:center;
          box-shadow: 0 4px 16px rgba(229,51,93,0.35);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .md-btn-book:hover { transform:translateY(-1px); box-shadow:0 8px 24px rgba(229,51,93,0.45); }
        .md-btn-trailer {
          display:inline-flex; align-items:center; gap:8px;
          background:#fff; color:#e5335d;
          border:2px solid #e5335d; border-radius:10px;
          padding:11px 28px; font-size:14px; font-weight:700;
          cursor:pointer; font-family:Poppins; width:100%;
          justify-content:center; margin-top:10px;
          transition: all 0.2s;
        }
        .md-btn-trailer:hover { background:#e5335d; color:#fff; }
        .info-card {
          background:#fff; border-radius:14px;
          border:1px solid rgba(0,0,0,0.08);
          padding:20px 24px; margin-bottom:16px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          animation: fadeIn 0.4s ease;
        }
        .info-card-title {
          font-size:11px; font-weight:700; color:#999;
          text-transform:uppercase; letter-spacing:1px; margin-bottom:12px;
        }
        .trailer-thumb {
          position:relative; border-radius:12px; overflow:hidden;
          cursor:pointer; border:1px solid rgba(0,0,0,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
          aspect-ratio: 16/9;
        }
        .trailer-thumb:hover { transform:scale(1.02); box-shadow:0 8px 24px rgba(229,51,93,0.25); }
        .play-btn {
          position:absolute; top:50%; left:50%;
          transform:translate(-50%,-50%);
          width:60px; height:60px; border-radius:50%;
          background:rgba(229,51,93,0.92);
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 20px rgba(229,51,93,0.5);
          transition: transform 0.2s;
        }
        .trailer-thumb:hover .play-btn { transform:translate(-50%,-50%) scale(1.1); }
      `}</style>

      <Navbar />

      {/* ── Hero Banner ── */}
      <div style={{ position: 'relative', height: 360, overflow: 'hidden', background: '#1a1a2e' }}>
        <img
          src={imgError ? fallback : (movie.banner || movie.poster || fallback)}
          alt={movie.title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.38) saturate(1.2)' }}
          onError={() => setImgError(true)}
        />
        {/* Gradient to white at bottom */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(245,245,247,1) 95%)',
        }} />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 20, left: 20,
            background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
            borderRadius: 8, color: '#fff', padding: '8px 14px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontFamily: 'Poppins', fontWeight: 600,
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,51,93,0.7)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.55)'}
        >
          <FiArrowLeft size={14} /> Back
        </button>

        {/* Status badge */}
        <div style={{
          position: 'absolute', top: 20, right: 20,
          background: statusColor.bg, color: statusColor.text,
          borderRadius: 20, padding: '5px 14px',
          fontSize: 11, fontWeight: 800, fontFamily: 'Poppins',
        }}>
          {statusColor.label}
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ maxWidth: 1100, margin: '-100px auto 0', padding: '0 24px 48px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* ── LEFT: Poster + Actions ── */}
          <div style={{ flex: '0 0 200px', animation: 'fadeIn 0.5s ease' }}>
            {/* Poster */}
            <div style={{
              borderRadius: 14, overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
              border: '3px solid #fff',
              background: '#e8e8f0',
              aspectRatio: '2/3',
            }}>
              <img
                src={movie.poster || movie.banner || fallback}
                alt={movie.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.src = fallback; }}
              />
            </div>

            {/* Book Tickets */}
            <button
              className="md-btn-book"
              style={{ marginTop: 14 }}
              onClick={() => navigate(`/movie/${id}/shows`)}
            >
              🎟 Book Tickets
            </button>

            {/* Watch Trailer */}
            {youtubeId && (
              <button className="md-btn-trailer" onClick={() => setShowTrailer(true)}>
                <FiPlay size={14} /> Watch Trailer
              </button>
            )}

            {/* Wishlist */}
            <button
              onClick={() => setLiked(!liked)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', marginTop: 10, padding: '10px',
                background: liked ? 'rgba(229,51,93,0.08)' : '#fff',
                border: `1.5px solid ${liked ? '#e5335d' : '#e0e0e0'}`,
                borderRadius: 10, color: liked ? '#e5335d' : '#666',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Poppins', transition: 'all 0.2s',
              }}
            >
              <FiHeart size={14} fill={liked ? '#e5335d' : 'none'} />
              {liked ? 'Wishlisted' : 'Add to Wishlist'}
            </button>
          </div>

          {/* ── RIGHT: Movie Info ── */}
          <div style={{ flex: 1, minWidth: 280, paddingTop: 60, animation: 'fadeIn 0.6s ease' }}>

            {/* Genre tags */}
            <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap' }}>
              {movie.genre?.map(g => (
                <span key={g} className="md-tag" style={{ background: '#f0f0f5', color: '#555', border: '1px solid #e0e0e8' }}>{g}</span>
              ))}
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 34, fontWeight: 900, color: '#111', marginBottom: 14, lineHeight: 1.15 }}>
              {movie.title}
            </h1>

            {/* Meta row */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 18, alignItems: 'center' }}>
              {movie.rating > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 8, padding: '6px 12px' }}>
                  <FiStar fill="#f59e0b" color="#f59e0b" size={15} />
                  <span style={{ fontWeight: 800, fontSize: 16, color: '#b45309' }}>{movie.rating}</span>
                  <span style={{ fontSize: 12, color: '#b45309' }}>/10</span>
                </div>
              )}
              {movie.duration > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#555', fontSize: 14 }}>
                  <FiClock size={14} color="#888" /> {movie.duration} min
                </div>
              )}
              {movie.releaseDate && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#555', fontSize: 14 }}>
                  <FiCalendar size={14} color="#888" /> {moment(movie.releaseDate).format('DD MMM YYYY')}
                </div>
              )}
            </div>

            {/* Language + Format tags */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 22 }}>
              {movie.language?.map(l => (
                <span key={l} className="md-tag" style={{ background: 'rgba(229,51,93,0.08)', color: '#e5335d', border: '1px solid rgba(229,51,93,0.25)' }}>{l}</span>
              ))}
              {movie.format?.map(f => (
                <span key={f} className="md-tag" style={{ background: '#f0f0f5', color: '#555', border: '1px solid #ddd' }}>{f}</span>
              ))}
            </div>

            {/* About section */}
            <div className="info-card">
              <div className="info-card-title">About the Movie</div>
              <p style={{ color: '#444', fontSize: 14, lineHeight: 1.85, margin: 0 }}>
                {movie.description || 'No description available for this movie.'}
              </p>
            </div>

            {/* Trailer section */}
            {youtubeId && (
              <div className="info-card">
                <div className="info-card-title">Official Trailer</div>
                <div className="trailer-thumb" onClick={() => setShowTrailer(true)}>
                  <img
                    src={thumbnailUrl || movie.poster || fallback}
                    alt="Trailer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    onError={e => { e.target.src = movie.poster || fallback; }}
                  />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />
                  <div className="play-btn">
                    <FiPlay size={24} color="#fff" fill="#fff" style={{ marginLeft: 3 }} />
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 12, left: 14,
                    fontSize: 13, fontWeight: 700, color: '#fff',
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                  }}>
                    ▶ Watch Official Trailer
                  </div>
                </div>
              </div>
            )}

            {/* Book Tickets CTA */}
            <button
              className="md-btn-book"
              style={{ marginTop: 8 }}
              onClick={() => navigate(`/movie/${id}/shows`)}
            >
              🎟️ Book Tickets Now
            </button>
          </div>
        </div>

        {/* Cast section */}
        {movie.cast?.length > 0 && (
          <div className="info-card" style={{ marginTop: 28 }}>
            <div className="info-card-title">Cast & Crew</div>
            <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 8 }}>
              {movie.cast.map((c, i) => (
                <div key={i} style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#f0f0f5', border: '2px solid #e0e0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 8px' }}>🎭</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#222' }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: '#888' }}>{c.role}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Trailer Modal ── */}
      {showTrailer && youtubeId && (
        <div
          onClick={() => setShowTrailer(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, padding: 20,
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, animation: 'modalIn 0.25s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>
                🎬 {movie.title} — Official Trailer
              </div>
              <button
                onClick={() => setShowTrailer(false)}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8, padding: '7px 14px', color: '#fff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontFamily: 'Poppins', fontWeight: 600,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,51,93,0.4)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              >
                <FiX size={14} /> Close (Esc)
              </button>
            </div>
            <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 14, overflow: 'hidden', background: '#000' }}>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&showinfo=0`}
                title={`${movie.title} Trailer`}
                allow="autoplay; encrypted-media; fullscreen"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MovieDetails;