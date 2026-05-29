import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiStar } from 'react-icons/fi';

const MovieCard = ({ movie }) => {
  const navigate = useNavigate();
  const fallbackPoster = `https://via.placeholder.com/300x450/1a1a26/e5335d?text=${encodeURIComponent(movie.title || 'Movie')}`;

  return (
    <div className="movie-card" onClick={() => navigate(`/movie/${movie._id}`)}>
      <div style={{ position: 'relative' }}>
        <img
          src={movie.poster || fallbackPoster}
          alt={movie.title}
          onError={e => { e.target.src = fallbackPoster; }}
        />
        {movie.rating > 0 && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            background: 'rgba(0,0,0,0.8)', borderRadius: 6,
            padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, fontWeight: 700, color: '#ffb300',
          }}>
            <FiStar size={11} fill="#ffb300" /> {movie.rating}
          </div>
        )}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
          padding: '20px 12px 10px',
        }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {movie.format?.slice(0, 2).map(f => (
              <span key={f} style={{
                background: 'rgba(229,51,93,0.2)', border: '1px solid rgba(229,51,93,0.4)',
                color: '#e5335d', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4
              }}>{f}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="movie-card-info">
        <div className="movie-card-title">{movie.title}</div>
        <div className="movie-card-meta">
          {movie.genre?.slice(0, 2).join(', ')} &bull; {movie.language?.slice(0, 2).join(', ')}
        </div>
        <button
          className="btn-primary"
          style={{ marginTop: 10, width: '100%', fontSize: 12, padding: '8px' }}
          onClick={e => { e.stopPropagation(); navigate(`/movie/${movie._id}`); }}
        >
          Book Tickets
        </button>
      </div>
    </div>
  );
};

export default MovieCard;