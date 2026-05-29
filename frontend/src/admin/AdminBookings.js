import React, { useEffect, useState } from 'react';
import { bookingAPI } from '../utils/api';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiSearch } from 'react-icons/fi';
import { useOutletContext } from 'react-router-dom';
import moment from 'moment';

const STATUS_TABS = ['All', 'Confirmed', 'Pending', 'Cancelled'];

const getToken = () => {
  try {
    const u = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (u.token) return u.token;
  } catch {}
  return localStorage.getItem('token') || '';
};

const AdminBookings = () => {
  const { darkMode } = useOutletContext();
  const [bookings,  setBookings]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const t = {
    text:       darkMode ? '#f1f5f9'                : '#111111',
    sub:        darkMode ? '#94a3b8'                : '#666666',
    cardBg:     darkMode ? 'rgba(255,255,255,0.04)' : '#ffffff',
    border:     darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
    rowHover:   darkMode ? 'rgba(229,51,93,0.06)'   : 'rgba(229,51,93,0.04)',
    theadBg:    darkMode ? 'rgba(255,255,255,0.04)' : '#f8f8fb',
    theadText:  darkMode ? '#94a3b8'                : '#888888',
    inputBg:    darkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f8',
    inputBorder:darkMode ? 'rgba(255,255,255,0.1)'  : '#e0e0e0',
    tabActive:  darkMode ? 'rgba(229,51,93,0.1)'    : 'rgba(229,51,93,0.08)',
    tabBorder:  darkMode ? '#e5335d'                : '#e5335d',
    tabInactive:darkMode ? 'rgba(255,255,255,0.03)' : '#ffffff',
    pillBg:     darkMode ? 'rgba(255,255,255,0.07)' : '#f0f0f5',
    pillText:   darkMode ? '#94a3b8'                : '#555555',
  };

  const fetchBookings = () => {
    setLoading(true);
    bookingAPI.getAllBookings()
      .then(({ data }) => { setBookings(data.bookings || data || []); setLoading(false); })
      .catch(() => { toast.error('Failed to load bookings'); setLoading(false); });
  };

  useEffect(() => { fetchBookings(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      const token = getToken();
      await axios.post(`/api/cancellation/cancel/${id}`, { reason: 'Cancelled by admin' }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Booking cancelled');
      fetchBookings();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to cancel'); }
  };

  const statusColors = {
    Confirmed: '#00c853', Pending: '#ffb300', Cancelled: '#e5335d', Refunded: '#9c27b0',
  };
  const refundCfg = {
    processed:      { label: '✅ Processed', color: '#00a846', bg: 'rgba(0,168,70,0.12)' },
    pending:        { label: '⏳ Pending',   color: '#e6a800', bg: 'rgba(230,168,0,0.12)' },
    failed:         { label: '❌ Failed',    color: '#e5335d', bg: 'rgba(229,51,93,0.12)'  },
    not_applicable: { label: '— N/A',        color: '#888',    bg: 'rgba(0,0,0,0.08)'      },
  };

  const filtered = bookings.filter(b => {
    const matchTab = activeTab === 'All' || b.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch = b.bookingId?.toLowerCase().includes(q) ||
      b.user?.name?.toLowerCase().includes(q) ||
      b.show?.movie?.title?.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const tabCount = (tab) => tab === 'All' ? bookings.length : bookings.filter(b => b.status === tab).length;
  const isCancelled = activeTab === 'Cancelled';

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: t.text }}>📋 Bookings</h1>
        <p style={{ color: t.sub, fontSize: 13, marginTop: 4 }}>View and manage all bookings</p>
      </div>

      {/* Status Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '7px 18px', borderRadius: 20,
            border: `1px solid ${activeTab === tab ? '#e5335d' : t.border}`,
            background: activeTab === tab ? t.tabActive : t.tabInactive,
            color: activeTab === tab ? '#e5335d' : t.sub,
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {tab}
            <span style={{ background: t.pillBg, borderRadius: 10, padding: '1px 7px', fontSize: 11, color: t.pillText }}>
              {tabCount(tab)}
            </span>
          </button>
        ))}
      </div>

      {/* Cancelled summary */}
      {isCancelled && filtered.length > 0 && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Cancelled',    value: filtered.length,                                                                    color: '#e5335d', bg: 'rgba(229,51,93,0.07)' },
            { label: 'Total Refunded',     value: '₹' + filtered.reduce((s, b) => s + (b.refundAmount || 0), 0),                     color: '#00a846', bg: 'rgba(0,168,70,0.07)'  },
            { label: 'Refund Processed',   value: filtered.filter(b => b.refundStatus === 'processed').length,                        color: '#00a846', bg: 'rgba(0,168,70,0.07)'  },
            { label: 'Refund Pending',     value: filtered.filter(b => b.refundStatus === 'pending').length,                          color: '#e6a800', bg: 'rgba(230,168,0,0.07)' },
          ].map(card => (
            <div key={card.label} style={{ background: card.bg, border: `1px solid ${card.color}33`, borderRadius: 12, padding: '12px 20px', minWidth: 140 }}>
              <div style={{ color: card.color, fontSize: 20, fontWeight: 800 }}>{card.value}</div>
              <div style={{ color: t.sub, fontSize: 12, marginTop: 2 }}>{card.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div style={{
        background: t.cardBg, border: `1px solid ${t.border}`,
        borderRadius: 14, overflow: 'hidden',
        boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: `1px solid ${t.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Showing {filtered.length} bookings</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: '8px 14px', width: 280 }}>
            <FiSearch size={14} color={t.sub} />
            <input placeholder="Search booking ID, user, movie..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontFamily: 'Outfit, sans-serif', fontSize: 13, flex: 1 }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: t.theadBg }}>
                {['Booking ID', 'User', 'Movie', 'Show Time', 'Seats', 'Amount', 'Status',
                  ...(isCancelled ? ['Refund Amount', 'Refund Status', 'Reason', 'Cancelled On'] : ['Action'])
                ].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: t.theadText, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${t.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isCancelled ? 11 : 8} style={{ textAlign: 'center', padding: 40 }}>
                  <div style={{ width: 32, height: 32, border: '3px solid rgba(229,51,93,0.2)', borderTopColor: '#e5335d', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: 'auto' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={isCancelled ? 11 : 8} style={{ textAlign: 'center', padding: 40, color: t.sub }}>
                  {isCancelled ? '🎉 No cancellations yet' : 'No bookings found'}
                </td></tr>
              ) : filtered.map(booking => {
                const sc  = statusColors[booking.status];
                const rfc = refundCfg[booking.refundStatus] || refundCfg['not_applicable'];
                return (
                  <tr key={booking._id}
                    style={{ borderTop: `1px solid ${t.border}`, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: 12, color: t.sub, fontFamily: 'monospace' }}>{booking.bookingId}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: t.text }}>{booking.user?.name}</div>
                      <div style={{ fontSize: 11, color: t.sub }}>{booking.user?.email}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: t.text }}>{booking.show?.movie?.title}</div>
                      <div style={{ fontSize: 11, color: t.sub }}>{booking.show?.theatre?.name}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: t.sub }}>{moment(booking.show?.date).format('DD MMM')} • {booking.show?.time}</td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#e5335d', fontWeight: 600 }}>{booking.seats?.join(', ')}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: t.text }}>₹{booking.totalAmount}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: `${sc}22`, color: sc, padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{booking.status}</span>
                    </td>
                    {isCancelled && (
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#00a846', fontSize: 14 }}>
                        ₹{booking.refundAmount ?? 0}
                        <div style={{ fontSize: 11, color: t.sub, fontWeight: 400 }}>of ₹{booking.totalAmount}</div>
                      </td>
                    )}
                    {isCancelled && (
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: rfc.bg, color: rfc.color, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{rfc.label}</span>
                      </td>
                    )}
                    {isCancelled && <td style={{ padding: '12px 16px', fontSize: 12, color: t.sub, maxWidth: 140 }}>{booking.cancellationReason || '—'}</td>}
                    {isCancelled && <td style={{ padding: '12px 16px', fontSize: 12, color: t.sub }}>{booking.cancelledAt ? moment(booking.cancelledAt).format('DD MMM YYYY') : '—'}</td>}
                    {!isCancelled && (
                      <td style={{ padding: '12px 16px' }}>
                        {booking.status === 'Confirmed' && (
                          <button onClick={() => handleCancel(booking._id)} style={{ background: 'rgba(229,51,93,0.12)', border: '1px solid rgba(229,51,93,0.3)', color: '#e5335d', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                            Cancel
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminBookings;