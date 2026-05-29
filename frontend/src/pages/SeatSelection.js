import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedSeats, setSelectedShow } from '../redux/slices/bookingSlice';
import { showAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import { FiX, FiArrowRight } from 'react-icons/fi';
import moment from 'moment';

const getTheme = () => { try { return localStorage.getItem('bms_theme') || 'dark'; } catch { return 'dark'; } };

const SeatSelection = () => {
  const { showId }  = useParams();
  const navigate    = useNavigate();
  const dispatch    = useDispatch();
  const { selectedShow } = useSelector(state => state.booking);

  const [show,     setShow]     = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading,  setLoading]  = useState(true); // always fetch fresh
  const [theme,    setTheme]    = useState(getTheme);
  const [hovered,  setHovered]  = useState(null);

  // Sync theme with navbar toggle
  useEffect(() => {
    const interval = setInterval(() => {
      const t = getTheme();
      setTheme(prev => prev !== t ? t : prev);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // ✅ Always fetch fresh from server so admin-booked seats show correctly
  useEffect(() => {
    setLoading(true);
    showAPI.getById(showId).then(({ data }) => {
      setShow(data);
      dispatch(setSelectedShow(data));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [showId, dispatch]); // no selectedShow dependency — always fresh

  const isDark      = theme === 'dark';
  const bookedSeats = show?.bookedSeats || [];

  // ── Build categories — use show.seatCategories or fall back to legacy ─────
  const categories = show?.seatCategories?.length
    ? show.seatCategories
    : [
        { name: 'Premium', rows: ['A','B','C'],     columns: 10, price: (show?.price||200)+100, color: '#ffb300' },
        { name: 'Gold',    rows: ['D','E','F'],     columns: 10, price: (show?.price||200),      color: '#e5335d' },
        { name: 'Silver',  rows: ['G','H'],         columns: 10, price: (show?.price||200)-50,   color: '#94a3b8' },
      ];

  // All rows in sorted order
  const allRows = categories
    .flatMap(cat => cat.rows.map(row => ({ row, cat })))
    .sort((a, b) => a.row.localeCompare(b.row));

  // Get category for a given seatId
  const getCatForSeat = (seatId) => {
    const row = seatId.replace(/[0-9]/g, '');
    return categories.find(c => c.rows.includes(row)) || categories[categories.length - 1];
  };

  const toggleSeat = (seatId) => {
    if (bookedSeats.includes(seatId)) return;
    setSelected(prev =>
      prev.includes(seatId) ? prev.filter(s => s !== seatId) : [...prev, seatId]
    );
  };

  // Total = sum of each seat's category price
  const total = selected.reduce((sum, seatId) => {
    const cat = getCatForSeat(seatId);
    return sum + (cat?.price || show?.price || 200);
  }, 0);

  const handleContinue = () => {
    if (selected.length === 0) return;
    dispatch(setSelectedSeats(selected));
    navigate('/payment');
  };

  // Theme colors
  const c = {
    bg:        isDark ? '#0a0a0f'  : '#f5f5fa',
    barBg:     isDark ? '#12121a'  : '#ffffff',
    barBorder: isDark ? '#2a2a3a'  : '#e8e8f0',
    text:      isDark ? '#ffffff'  : '#111111',
    sub:       isDark ? '#9999bb'  : '#666666',
    bottomBg:  isDark ? '#12121a'  : '#ffffff',
    shadow:    isDark ? 'none'     : '0 -2px 12px rgba(0,0,0,0.08)',
    catLabel:  isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
  };

  if (loading) return (
    <div style={{ background: c.bg, minHeight: '100vh' }}>
      <Navbar />
      <div className="loading-center" style={{ minHeight: '80vh' }}>
        <div className="spinner" />
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: c.bg, transition: 'background 0.3s' }}>
      <Navbar />

      {/* ── Show Info Bar ── */}
      <div style={{
        background: c.barBg, borderBottom: `1px solid ${c.barBorder}`,
        padding: '14px 24px', transition: 'background 0.3s',
        boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: c.sub, cursor: 'pointer' }}>
              <FiX size={20} />
            </button>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: c.text }}>{show?.theatre?.name}</div>
              <div style={{ color: c.sub, fontSize: 12 }}>
                {moment(show?.date).format('ddd, DD MMM')} &bull; {show?.time} &bull; {show?.movie?.title}
                {show?.screenName && (
                  <span style={{
                    marginLeft:8, fontSize:10, fontWeight:700,
                    padding:'2px 8px', borderRadius:5,
                    background:'rgba(168,85,247,0.15)',
                    color:'#a855f7', border:'1px solid rgba(168,85,247,0.3)',
                  }}>
                    {show.screenName}
                  </span>
                )}
              </div>
            </div>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: c.sub, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: isDark?'rgba(255,255,255,0.08)':'#eef', border: '1.5px solid #94a3b8', display: 'inline-block' }} />
              Available
            </span>
            <span style={{ fontSize: 12, color: c.sub, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: '#e5335d', display: 'inline-block' }} />
              Selected
            </span>
            <span style={{ fontSize: 12, color: c.sub, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, background: isDark?'#2a2a3a':'#e0e0e0', display: 'inline-block' }} />
              Booked
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>

        {/* ── Screen ── */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            background: 'linear-gradient(to right,transparent,rgba(229,51,93,0.5),transparent)',
            height: 3, borderRadius: 3, marginBottom: 8,
          }} />
          <span style={{ fontSize: 11, color: c.sub, letterSpacing: 4, textTransform: 'uppercase' }}>
            All Eyes This Way — Screen
          </span>
        </div>

        {/* ── Seat Grid ── */}
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 480, display: 'inline-block', width: '100%' }}>
            {(() => {
              let lastCat = null;
              return allRows.map(({ row, cat }) => {
                const isNewCat = lastCat !== cat.name;
                lastCat = cat.name;
                const cols = cat.columns || 10;

                return (
                  <React.Fragment key={row}>
                    {/* Category separator */}
                    {isNewCat && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        margin: '14px 0 8px',
                        padding: '6px 12px',
                        background: `${cat.color}12`,
                        borderLeft: `3px solid ${cat.color}`,
                        borderRadius: '0 8px 8px 0',
                      }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: cat.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 800, color: cat.color }}>{cat.name}</span>
                        <span style={{ fontSize: 11, color: c.sub }}>
                          Rows {cat.rows.join(', ')} &bull; {cols} seats/row &bull; ₹{cat.price} per seat
                        </span>
                      </div>
                    )}

                    {/* Seat row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 5, justifyContent: 'center' }}>
                      {/* Row label */}
                      <span style={{ width: 20, fontSize: 11, fontWeight: 700, color: cat.color, textAlign: 'right', flexShrink: 0 }}>
                        {row}
                      </span>

                      {Array.from({ length: cols }, (_, i) => {
                        const seatId     = `${row}${i + 1}`;
                        const isBooked   = bookedSeats.includes(seatId);
                        const isSelected = selected.includes(seatId);
                        const isHovered  = hovered === seatId;

                        return (
                          <React.Fragment key={seatId}>
                            {/* Aisle gap in middle */}
                            {i === Math.floor(cols / 2) && <div style={{ width: 14, flexShrink: 0 }} />}

                            <div
                              onClick={() => toggleSeat(seatId)}
                              onMouseEnter={() => setHovered(seatId)}
                              onMouseLeave={() => setHovered(null)}
                              title={
                                isBooked
                                  ? `${seatId} — Booked`
                                  : `${seatId} — ${cat.name} ₹${cat.price}`
                              }
                              style={{
                                width: 28, height: 28, borderRadius: 6,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontWeight: 700,
                                cursor: isBooked ? 'not-allowed' : 'pointer',
                                transition: 'all 0.12s',
                                flexShrink: 0,
                                // Background
                                background: isBooked
                                  ? (isDark ? '#2a2a3a' : '#e0e0e0')
                                  : isSelected
                                    ? cat.color
                                    : isHovered
                                      ? `${cat.color}33`
                                      : `${cat.color}15`,
                                // Border
                                border: `1.5px solid ${
                                  isBooked
                                    ? (isDark ? '#3a3a4a' : '#ccc')
                                    : isSelected
                                      ? cat.color
                                      : isHovered
                                        ? cat.color
                                        : `${cat.color}44`
                                }`,
                                // Text color
                                color: isBooked
                                  ? (isDark ? '#555' : '#bbb')
                                  : isSelected
                                    ? '#fff'
                                    : cat.color,
                                // Effects
                                boxShadow: isSelected
                                  ? `0 2px 10px ${cat.color}66`
                                  : isHovered && !isBooked
                                    ? `0 1px 6px ${cat.color}44`
                                    : 'none',
                                transform: isSelected
                                  ? 'scale(1.12)'
                                  : isHovered && !isBooked
                                    ? 'scale(1.05)'
                                    : 'scale(1)',
                              }}
                            >
                              {i + 1}
                            </div>
                          </React.Fragment>
                        );
                      })}

                      {/* Row label right */}
                      <span style={{ width: 20, fontSize: 11, fontWeight: 700, color: cat.color, textAlign: 'left', flexShrink: 0, marginLeft: 2 }}>
                        {row}
                      </span>
                    </div>
                  </React.Fragment>
                );
              });
            })()}
          </div>
        </div>

        {/* ── Category pricing cards ── */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          {categories.map(cat => {
            const catSeats  = cat.rows.flatMap(r => Array.from({length:cat.columns||10},(_,i)=>`${r}${i+1}`));
            const booked    = catSeats.filter(s => bookedSeats.includes(s)).length;
            const available = catSeats.length - booked;
            return (
              <div key={cat.name} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: `${cat.color}10`,
                border: `1px solid ${cat.color}44`,
                borderRadius: 12, padding: '10px 16px',
                minWidth: 160,
              }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: cat.color, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: cat.color }}>{cat.name}</div>
                  <div style={{ fontSize: 11, color: c.sub, marginTop: 2 }}>
                    ₹{cat.price} &bull; {available} left
                  </div>
                  <div style={{ fontSize: 10, color: c.sub }}>
                    Rows {cat.rows.join(', ')} &bull; {cat.columns||10} cols
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      {selected.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: c.bottomBg, borderTop: `1px solid ${c.barBorder}`,
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          zIndex: 50, boxShadow: c.shadow, transition: 'background 0.3s',
        }}>
          <div>
            <div style={{ fontSize: 12, color: c.sub, marginBottom: 3 }}>
              {selected.length} seat{selected.length > 1 ? 's' : ''} —&nbsp;
              {selected.map((seatId, idx) => {
                const cat = getCatForSeat(seatId);
                return (
                  <span key={seatId} style={{ color: cat?.color || '#e5335d', fontWeight: 700 }}>
                    {seatId}{idx < selected.length - 1 ? ', ' : ''}
                  </span>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#e5335d' }}>₹{total}</span>
              <span style={{ fontSize: 11, color: c.sub }}>+ convenience fee</span>
            </div>
            {/* Per-category breakdown */}
            <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
              {categories.filter(cat => selected.some(s => cat.rows.includes(s.replace(/[0-9]/g,'')))).map(cat => {
                const count = selected.filter(s => cat.rows.includes(s.replace(/[0-9]/g,''))).length;
                return (
                  <span key={cat.name} style={{ fontSize: 10, color: cat.color, fontWeight: 600 }}>
                    {count}× {cat.name} @₹{cat.price}
                  </span>
                );
              })}
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={handleContinue}
            style={{ padding: '12px 28px', fontSize: 15, gap: 8 }}
          >
            Pay ₹{total} <FiArrowRight size={16} />
          </button>
        </div>
      )}
      <div style={{ height: 110 }} />
    </div>
  );
};

export default SeatSelection;