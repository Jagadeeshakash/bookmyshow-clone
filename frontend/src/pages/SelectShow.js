import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMovieById } from '../redux/slices/movieSlice';
import { setSelectedShow, setSelectedTheatre } from '../redux/slices/bookingSlice';
import { showAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import { FiMapPin, FiArrowLeft, FiClock, FiChevronRight, FiInfo } from 'react-icons/fi';
import moment from 'moment';

const SelectShow = () => {
  const { id }   = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentMovie: movie } = useSelector(state => state.movies);

  const [shows,        setShows]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));

  // 7 days
  const dates = Array.from({ length: 7 }, (_, i) => moment().add(i, 'days'));

  useEffect(() => { dispatch(fetchMovieById(id)); }, [id, dispatch]);

  useEffect(() => {
    const fetchShows = async () => {
      try {
        setLoading(true);
        const { data } = await showAPI.getAll({ movie: id, date: selectedDate });
        setShows(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setShows([]);
      } finally {
        setLoading(false);
      }
    };
    fetchShows();
  }, [id, selectedDate]);

  // Group by theatre
  const showsByTheatre = shows.reduce((acc, show) => {
    const tid = show.theatre?._id;
    if (!tid) return acc;
    if (!acc[tid]) acc[tid] = { theatre: show.theatre, shows: [] };
    acc[tid].shows.push(show);
    return acc;
  }, {});

  const handleSelectShow = (show) => {
    dispatch(setSelectedShow(show));
    dispatch(setSelectedTheatre(show.theatre));
    navigate(`/show/${show._id}/seats`);
  };

  // Time of day label + color
  const getTimeStyle = (time) => {
    const h = parseInt(time?.split(':')[0] || time?.split(' ')[0] || 0);
    const isPM = time?.toLowerCase().includes('pm');
    const hour = isPM && h !== 12 ? h + 12 : h;
    if (hour < 12) return { color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd', label: 'Morning'  };
    if (hour < 17) return { color: '#b45309', bg: '#fef3c7', border: '#fde68a', label: 'Afternoon' };
    if (hour < 20) return { color: '#7c3aed', bg: '#ede9fe', border: '#ddd6fe', label: 'Evening'  };
    return              { color: '#1d4ed8', bg: '#dbeafe', border: '#bfdbfe', label: 'Night'    };
  };

  const availabilityColor = (available, total) => {
    const pct = available / total;
    if (pct > 0.5) return { color: '#15803d', label: 'Available'      };
    if (pct > 0.2) return { color: '#b45309', label: 'Filling Fast!'  };
    return              { color: '#b91c1c', label: 'Almost Full!'  };
  };

  return (
    <div style={{ background: '#f5f5f7', minHeight: '100vh', fontFamily: 'Poppins, sans-serif' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .show-time-btn {
          padding: 10px 18px; border-radius: 10px; cursor: pointer;
          text-align: center; transition: all 0.2s; min-width: 90px;
          font-family: Poppins;
        }
        .show-time-btn:hover { transform: translateY(-2px); }
        .theatre-card {
          background: #fff; border-radius: 14px;
          border: 1px solid rgba(0,0,0,0.08);
          padding: 20px 22px; margin-bottom: 14px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          animation: fadeIn 0.4s ease;
          transition: box-shadow 0.2s;
        }
        .theatre-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,0.1); }
        .date-btn {
          flex-shrink: 0; padding: 10px 16px; border-radius: 12px;
          cursor: pointer; text-align: center; min-width: 68px;
          font-family: Poppins; transition: all 0.2s; border: 2px solid;
        }
        .date-btn:hover { transform: translateY(-2px); }
      `}</style>

      <Navbar />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px 60px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: '#fff', border: '1px solid #e0e0e8', borderRadius: 10,
              color: '#333', padding: '9px 14px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, fontWeight: 600,
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#e5335d'; e.currentTarget.style.color = '#e5335d'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e8'; e.currentTarget.style.color = '#333'; }}
          >
            <FiArrowLeft size={15} />
          </button>

          {movie && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Movie mini-poster */}
              {(movie.poster || movie.banner) && (
                <img
                  src={movie.poster || movie.banner}
                  alt={movie.title}
                  style={{ width: 44, height: 58, borderRadius: 8, objectFit: 'cover', border: '1px solid #e0e0e8', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              )}
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: 0 }}>{movie.title}</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: '#666' }}>{movie.genre?.join(', ')}</span>
                  {movie.duration > 0 && (
                    <span style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiClock size={11} /> {movie.duration} min
                    </span>
                  )}
                  {movie.rating > 0 && (
                    <span style={{ fontSize: 12, color: '#b45309', fontWeight: 700 }}>⭐ {movie.rating}/10</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Date Selector ── */}
        <div style={{
          background: '#fff', borderRadius: 14, padding: '18px 20px',
          marginBottom: 20, border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            Select Date
          </div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {dates.map(d => {
              const val        = d.format('YYYY-MM-DD');
              const isSelected = val === selectedDate;
              const isToday    = d.isSame(moment(), 'day');
              return (
                <button
                  key={val}
                  className="date-btn"
                  onClick={() => setSelectedDate(val)}
                  style={{
                    borderColor:  isSelected ? '#e5335d' : '#e0e0e8',
                    background:   isSelected ? 'linear-gradient(135deg,#e5335d,#be123c)' : '#fff',
                    color:        isSelected ? '#fff' : '#333',
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 600, opacity: isSelected ? 0.85 : 0.6 }}>
                    {isToday ? 'Today' : d.format('ddd')}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.2 }}>{d.format('D')}</div>
                  <div style={{ fontSize: 10, opacity: isSelected ? 0.85 : 0.55 }}>{d.format('MMM')}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Location + Filter row ── */}
        <div style={{
          background: '#fff', borderRadius: 12, padding: '12px 18px',
          marginBottom: 20, border: '1px solid rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 10,
          boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <FiMapPin size={14} color="#e5335d" />
            <span style={{ color: '#555' }}>Chennai</span>
            <FiChevronRight size={13} color="#999" />
            <span style={{ color: '#e5335d', fontWeight: 700 }}>All Theatres</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['All Formats', 'All Languages'].map(f => (
              <select key={f} style={{
                background: '#f5f5f7', border: '1px solid #e0e0e8', borderRadius: 8,
                padding: '6px 12px', color: '#555', fontSize: 12,
                fontFamily: 'Poppins', cursor: 'pointer', outline: 'none',
              }}>
                <option>{f}</option>
              </select>
            ))}
          </div>
        </div>

        {/* ── Shows count badge ── */}
        {!loading && shows.length > 0 && (
          <div style={{ marginBottom: 16, fontSize: 13, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiInfo size={13} color="#e5335d" />
            <span>
              <strong style={{ color: '#111' }}>{Object.keys(showsByTheatre).length}</strong> theatre{Object.keys(showsByTheatre).length !== 1 ? 's' : ''} •{' '}
              <strong style={{ color: '#111' }}>{shows.length}</strong> show{shows.length !== 1 ? 's' : ''} available on{' '}
              <strong style={{ color: '#e5335d' }}>{moment(selectedDate).format('DD MMM YYYY')}</strong>
            </span>
          </div>
        )}

        {/* ── Theatre + Shows List ── */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: 120, borderRadius: 14, background: '#fff',
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'linear-gradient(90deg,#f5f5f7 25%,#ebebeb 50%,#f5f5f7 75%)',
                backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
              }} />
            ))}
            <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
          </div>
        ) : Object.values(showsByTheatre).length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            background: '#fff', borderRadius: 14,
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
          }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎬</div>
            <h3 style={{ color: '#333', fontSize: 18, marginBottom: 8 }}>No shows available</h3>
            <p style={{ fontSize: 14, color: '#888', marginBottom: 20 }}>
              No shows on {moment(selectedDate).format('DD MMM YYYY')}. Try another date.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {dates.slice(1, 4).map(d => (
                <button
                  key={d.format('YYYY-MM-DD')}
                  onClick={() => setSelectedDate(d.format('YYYY-MM-DD'))}
                  style={{
                    padding: '8px 18px', background: '#f5f5f7',
                    border: '1px solid #e0e0e8', borderRadius: 8,
                    color: '#555', fontSize: 13, cursor: 'pointer',
                    fontFamily: 'Poppins', fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#e5335d'; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#e5335d'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f5f5f7'; e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#e0e0e8'; }}
                >
                  {d.format('ddd, DD MMM')}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {Object.values(showsByTheatre).map(({ theatre, shows: tShows }) => (
              <div key={theatre?._id} className="theatre-card">

                {/* Theatre header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: 0, marginBottom: 5 }}>
                      {theatre?.name}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#777', fontSize: 12 }}>
                      <FiMapPin size={11} color="#e5335d" />
                      <span>{theatre?.location}</span>
                      <span style={{ color: '#ddd' }}>•</span>
                      <span>{theatre?.city}</span>
                    </div>
                    {theatre?.amenities?.length > 0 && (
                      <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                        {theatre.amenities.slice(0, 4).map(a => (
                          <span key={a} style={{ background: '#f0f0f5', color: '#555', border: '1px solid #e0e0e8', borderRadius: 4, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>{a}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#888', background: '#f5f5f7', border: '1px solid #e0e0e8', borderRadius: 6, padding: '3px 10px' }}>
                      {theatre?.screens} screens
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: '#f0f0f5', marginBottom: 16 }} />

                {/* Show times */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {tShows.map(show => {
                    const ts  = getTimeStyle(show.time);
                    const avl = availabilityColor(show.availableSeats, show.totalSeats);
                    return (
                      <button
                        key={show._id}
                        className="show-time-btn"
                        onClick={() => handleSelectShow(show)}
                        style={{
                          background:   ts.bg,
                          border:       `1.5px solid ${ts.border}`,
                          color:        ts.color,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = ts.color;
                          e.currentTarget.style.color = '#fff';
                          e.currentTarget.style.borderColor = ts.color;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = ts.bg;
                          e.currentTarget.style.color = ts.color;
                          e.currentTarget.style.borderColor = ts.border;
                        }}
                      >
                        <div style={{ fontSize: 15, fontWeight: 800 }}>{show.time}</div>
                        <div style={{ fontSize: 10, marginTop: 3, opacity: 0.8, fontWeight: 500 }}>
                          {show.language} • {show.format}
                        </div>
                        <div style={{ fontSize: 10, marginTop: 2, fontWeight: 700, color: avl.color }}>
                          {avl.label}
                        </div>
                        <div style={{ fontSize: 10, marginTop: 1, opacity: 0.65 }}>
                          ₹{show.price}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Warning if seats low */}
                {tShows.some(s => s.availableSeats < 20) && (
                  <div style={{ marginTop: 12, fontSize: 12, color: '#d97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                    ⚠️ Some shows are filling up fast! Book soon.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectShow;