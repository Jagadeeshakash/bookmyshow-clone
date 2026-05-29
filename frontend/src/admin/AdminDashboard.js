import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { dashboardAPI, bookingAPI } from '../utils/api';
import { FiDollarSign, FiBookmark, FiUsers, FiPlay, FiStar, FiFilm } from 'react-icons/fi';

// ── Sparkline mini chart ───────────────────────────────────────────────────────
const Sparkline = ({ color }) => {
  const pts = [30,45,35,60,50,70,55,80,65,90,75,100].map((v,i) => `${i*9},${100-v}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" style={{ width: '100%', height: 40, marginTop: 8 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`sg-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon fill={`url(#sg-${color.replace('#','')})`} points={`0,100 ${pts} 99,100`} />
      <polyline fill="none" stroke={color} strokeWidth="2.5" points={pts} strokeLinejoin="round" />
    </svg>
  );
};

const AdminDashboard = () => {
  const { userInfo } = useSelector(state => state.auth);
  const { darkMode } = useOutletContext();
  const [stats,          setStats]          = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(({ data }) => {
        setStats(data);
        // ✅ Use recentBookings from dashboard stats directly
        setRecentBookings(data.recentBookings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const card          = darkMode ? 'rgba(255,255,255,0.03)' : '#ffffff';
  const cardBorder    = darkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)';
  const cardShadow    = darkMode ? 'none' : '0 2px 12px rgba(0,0,0,0.06)';
  const textPrimary   = darkMode ? '#ffffff' : '#111111';
  const textSecondary = darkMode ? 'rgba(255,255,255,0.45)' : '#888888';
  const textMuted     = darkMode ? '#9999bb' : '#aaaaaa';
  const rowHover      = darkMode ? 'rgba(229,51,93,0.04)' : 'rgba(229,51,93,0.03)';
  const rowBorder     = darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
  const theadBg       = darkMode ? 'rgba(255,255,255,0.02)' : '#f8f8fb';
  const theadText     = darkMode ? 'rgba(255,255,255,0.35)' : '#888888';
  const selectBg      = darkMode ? '#1a1a26' : '#f0f0f5';
  const selectBorder  = darkMode ? '#2a2a3a' : '#dddddd';
  const selectColor   = darkMode ? '#9999bb' : '#555555';
  const donutBg       = darkMode ? '#1a1a26' : '#eeeeee';
  const donutText     = darkMode ? '#fff' : '#111';
  const donutSub      = darkMode ? '#9999bb' : '#888';

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  // ✅ Correctly read all fields from backend response
  const moviesBooked = stats?.totalMoviesBooked ?? 0;
  const showsToday   = stats?.showsToday        ?? 0;
  // allStatusTotal = every booking regardless of status
  const allStatusTotal = (stats?.bookingsByStatus || []).reduce((s, b) => s + b.count, 0);
  const totalB         = allStatusTotal || 1;

  // ── Stat cards ────────────────────────────────────────────────────────────
  const statCards = [
    {
      label:  'Total Revenue',
      value:  `₹${stats?.totalRevenue?.toLocaleString('en-IN') || '0'}`,
      change: 'from last month',
      icon:   FiDollarSign,
      color:  '#e5335d',
      bg:     darkMode ? 'rgba(229,51,93,0.12)' : 'rgba(229,51,93,0.08)',
    },
    {
      label:  'Total Bookings',
      value:  stats?.totalBookings?.toLocaleString() || '0',
      change: 'all time bookings',
      icon:   FiBookmark,
      color:  '#00b0ff',
      bg:     darkMode ? 'rgba(0,176,255,0.12)' : 'rgba(0,176,255,0.08)',
    },
    {
      label:  'Movies Booked',
      value:  moviesBooked.toLocaleString(),   // ✅ now shows real count
      change: 'unique movies booked',
      icon:   FiFilm,
      color:  '#a855f7',
      bg:     darkMode ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.08)',
    },
    {
      label:  'Total Users',
      value:  stats?.totalUsers?.toLocaleString() || '0',
      change: 'registered users',
      icon:   FiUsers,
      color:  '#00c853',
      bg:     darkMode ? 'rgba(0,200,83,0.12)' : 'rgba(0,200,83,0.08)',
    },
    {
      label:  'Shows Today',
      value:  showsToday.toString(),           // ✅ now shows real count
      change: 'active shows today',
      icon:   FiPlay,
      color:  '#ffb300',
      bg:     darkMode ? 'rgba(255,179,0,0.12)' : 'rgba(255,179,0,0.08)',
    },
  ];

  // Only active statuses in donut (exclude Cancelled & Refunded)
  const bookingStatus  = stats?.bookingsByStatus || [];
  const getStatusCount = (s) => bookingStatus.find(b => b._id === s)?.count || 0;
  // Donut shows only Confirmed + Pending (active bookings only)
  const confirmedCount = getStatusCount('Confirmed');
  const pendingCount   = getStatusCount('Pending');
  const activeTotal    = confirmedCount + pendingCount;
  const donutData = [
    { label: 'Confirmed', count: confirmedCount, color: '#00c853' },
    { label: 'Pending',   count: pendingCount,   color: '#ffb300' },
  ];

  // ── SVG Donut ─────────────────────────────────────────────────────────────
  const DonutChart = () => {
    const size = 160; const r = 60; const cx = 80; const cy = 80;
    const circumference = 2 * Math.PI * r;
    let offset = 0;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={donutBg} strokeWidth={22} />
        {donutData.map(({ count, color }) => {
          const pct  = activeTotal > 0 ? count / activeTotal : 0;
          const dash = pct * circumference;
          const gap  = circumference - dash;
          const el   = (
            <circle key={color} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={22}
              strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '80px 80px' }} />
          );
          offset += dash;
          return el;
        })}
        <text x={cx} y={cy}    textAnchor="middle" dominantBaseline="middle" fill={donutText} fontSize="20" fontWeight="800">{activeTotal}</text>
        <text x={cx} y={cy+18} textAnchor="middle" fill={donutSub} fontSize="10">Total</text>
      </svg>
    );
  };

  // ── Revenue Line Chart ─────────────────────────────────────────────────────
  const LineChart = () => {
    // ✅ reads revenueChart (not revenueByMonth)
    const chart = stats?.revenueChart || [];
    if (chart.length < 2) return (
      <div style={{ padding: '40px 20px', color: textMuted, fontSize: 13, textAlign: 'center' }}>No data yet</div>
    );
    const vals   = chart.map(d => d.revenue);
    const labels = chart.map(d => d._id || '');
    const max    = Math.max(...vals) || 1;
    const W = 500; const H = 150; const pad = 20;
    const pts = vals.map((v, i) =>
      `${pad + (i / (vals.length - 1)) * (W - pad * 2)},${H - pad - (v / max) * (H - pad * 2)}`
    ).join(' ');
    const lastPt   = pts.split(' ').pop();
    const [lx, ly] = lastPt.split(',').map(Number);
    return (
      <div>
        <div style={{ fontSize: 13, color: textMuted, marginBottom: 4 }}>Total Revenue</div>
        <div style={{ fontSize: 24, fontWeight: 800, color: textPrimary, marginBottom: 12 }}>
          ₹{stats?.totalRevenue?.toLocaleString('en-IN') || '0'}
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 150 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#e5335d" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#e5335d" stopOpacity="0"   />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
            <line key={i} x1={pad} y1={pad + t*(H - pad*2)} x2={W - pad} y2={pad + t*(H - pad*2)}
              stroke={darkMode ? '#2a2a3a' : '#eeeeee'} strokeWidth="0.5" />
          ))}
          <polygon fill="url(#revGrad)" points={`${pad},${H} ${pts} ${W-pad},${H}`} />
          <polyline fill="none" stroke="#e5335d" strokeWidth="2.5" points={pts} strokeLinejoin="round" />
          <circle cx={lx} cy={ly} r={5} fill="#e5335d" />
          <rect   x={lx - 30} y={ly - 28} width={60} height={20} rx={4} fill="#e5335d" />
          <text   x={lx} y={ly - 14} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">
            ₹{vals[vals.length - 1]}
          </text>
        </svg>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          {labels
            .filter((_, i) => i % Math.ceil(labels.length / 6) === 0)
            .map((l, i) => (
              <span key={i} style={{ fontSize: 10, color: textMuted }}>{l}</span>
            ))}
        </div>
      </div>
    );
  };

  const statusColors = {
    Confirmed: '#00c853',
    Pending:   '#ffb300',
    Cancelled: '#e5335d',
    Refunded:  '#9c27b0',
  };

  return (
    <div>

      {/* ── Welcome Banner ── */}
      <div style={{
        borderRadius: 16, overflow: 'hidden', marginBottom: 24,
        position: 'relative', height: 160,
        background: card, border: cardBorder, boxShadow: cardShadow,
      }}>
        <div style={{
          position: 'absolute', right: 40, top: '50%', transform: 'translateY(-50%)',
          fontSize: 70, opacity: 0.85, userSelect: 'none',
        }}>🍿</div>
        <div style={{ position: 'absolute', left: 32, top: '50%', transform: 'translateY(-50%)' }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: textPrimary }}>
            Welcome back,{' '}
            <span style={{ color: '#e5335d' }}>{userInfo?.name || 'Admin'}!</span>{' '}
            👋
          </div>
          <div style={{ fontSize: 13, color: textSecondary, marginTop: 6 }}>
            Here's what's happening with your platform today.
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 24 }}>
        {statCards.map(c => (
          <div key={c.label} style={{
            background: card, border: cardBorder, boxShadow: cardShadow,
            borderRadius: 14, padding: '18px 16px', cursor: 'pointer',
            transition: 'all 0.25s', position: 'relative', overflow: 'hidden',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = `${c.color}44`;
              e.currentTarget.style.transform   = 'translateY(-3px)';
              e.currentTarget.style.boxShadow   = `0 8px 30px ${c.color}18`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
              e.currentTarget.style.transform   = 'translateY(0)';
              e.currentTarget.style.boxShadow   = cardShadow;
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: textSecondary, fontWeight: 500 }}>{c.label}</div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <c.icon size={15} color={c.color} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: textPrimary, lineHeight: 1 }}>{c.value}</div>
            <div style={{ fontSize: 11, color: textMuted, marginTop: 6 }}>↑ {c.change}</div>
            <Sparkline color={c.color} />
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.1fr 1.1fr', gap: 16, marginBottom: 24 }}>

        {/* Revenue Chart */}
        <div style={{ background: card, border: cardBorder, boxShadow: cardShadow, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: textPrimary }}>Revenue Overview</h3>
            <select style={{
              background: selectBg, border: `1px solid ${selectBorder}`, borderRadius: 6,
              padding: '4px 10px', color: selectColor, fontSize: 12, fontFamily: 'Outfit, sans-serif',
            }}>
              <option>This Month</option>
              <option>Last Month</option>
            </select>
          </div>
          <LineChart />
        </div>

        {/* Bookings Donut */}
        <div style={{
          background: card, border: cardBorder, boxShadow: cardShadow,
          borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: textPrimary, marginBottom: 16, alignSelf: 'flex-start' }}>
            Bookings Overview
          </h3>
          <DonutChart />
          <div style={{ marginTop: 14, width: '100%' }}>
            {[
              { label: 'Confirmed', count: getStatusCount('Confirmed'), color: '#00c853' },
              { label: 'Pending',   count: getStatusCount('Pending'),   color: '#ffb300' },
              { label: 'Cancelled', count: getStatusCount('Cancelled'), color: '#e5335d' },
              { label: 'Refunded',  count: getStatusCount('Refunded'),  color: '#9c27b0' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  <span style={{ color: textMuted }}>{label}</span>
                </div>
                <span style={{ fontWeight: 700, color: textPrimary }}>
                  {count}{' '}
                  <span style={{ color: textMuted }}>
                    ({Math.round((count / (allStatusTotal || 1)) * 100)}%)
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Movies */}
        <div style={{ background: card, border: cardBorder, boxShadow: cardShadow, borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: textPrimary }}>Top Movies</h3>
            <Link to="/admin/movies" style={{ fontSize: 12, color: '#e5335d', fontWeight: 600, textDecoration: 'none' }}>
              View All
            </Link>
          </div>
          {(stats?.topMovies || []).length === 0
            ? <p style={{ color: textMuted, fontSize: 13 }}>No data yet</p>
            : (stats.topMovies || []).map((movie, idx) => (
              <div key={movie._id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                marginBottom: 14, paddingBottom: 14,
                borderBottom: idx < stats.topMovies.length - 1 ? `1px solid ${rowBorder}` : 'none',
              }}>
                <span style={{ color: textMuted, fontSize: 13, fontWeight: 700, width: 16 }}>{idx + 1}</span>
                <img
                  src={movie.poster || 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=40&h=50&fit=crop'}
                  alt={movie.title}
                  onError={e => { e.target.src = 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=40&h=50&fit=crop'; }}
                  style={{ width: 36, height: 48, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: textPrimary,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {movie.title}
                  </div>
                  <div style={{ fontSize: 11, color: textMuted }}>{movie.totalBookings} Bookings</div>
                </div>
                <FiStar size={13} color="#ffb300" />
              </div>
            ))
          }
        </div>
      </div>

      {/* ── Recent Bookings Table ── */}
      <div style={{ background: card, border: cardBorder, boxShadow: cardShadow, borderRadius: 14, overflow: 'hidden' }}>
        <div style={{
          padding: '16px 20px', borderBottom: `1px solid ${rowBorder}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: textPrimary }}>Recent Bookings</h3>
          <Link to="/admin/bookings" style={{ fontSize: 12, color: '#e5335d', fontWeight: 600, textDecoration: 'none' }}>
            View All
          </Link>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: theadBg }}>
              {['Booking ID', 'Movie', 'Date', 'Status', 'Amount'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', fontSize: 11, fontWeight: 600,
                  color: theadText, textAlign: 'left',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentBookings.length === 0
              ? (
                <tr>
                  <td colSpan={5} style={{ padding: '20px 16px', color: textMuted, fontSize: 13, textAlign: 'center' }}>
                    No bookings yet
                  </td>
                </tr>
              )
              : recentBookings.map((b) => (
                <tr key={b._id}
                  style={{ borderTop: `1px solid ${rowBorder}` }}
                  onMouseEnter={e => e.currentTarget.style.background = rowHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#e5335d', fontWeight: 700, fontFamily: 'monospace' }}>
                    #{b.bookingId || b._id?.toString().slice(-10).toUpperCase()}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: textPrimary }}>
                    {b.show?.movie?.title || 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: textSecondary }}>
                    {b.createdAt
                      ? new Date(b.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                      : 'N/A'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: `${statusColors[b.status] || '#666'}22`,
                      color: statusColors[b.status] || '#666',
                    }}>
                      {b.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: textPrimary }}>
                    ₹{b.totalAmount}
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AdminDashboard;