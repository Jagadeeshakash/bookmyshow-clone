import React, { useState, useEffect } from 'react';
import { FiCreditCard, FiDollarSign, FiTrendingUp, FiSearch, FiDownload, FiX } from 'react-icons/fi';
import { SiStripe } from 'react-icons/si';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useOutletContext } from 'react-router-dom';
import moment from 'moment';

const AdminPaymentHistory = () => {
  const { darkMode } = useOutletContext();
  const { userInfo } = useSelector(state => state.auth);
  const token = userInfo?.token;

  const [bookings,      setBookings]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [filterMethod,  setFilterMethod]  = useState('all');
  const [filterStatus,  setFilterStatus]  = useState('all');

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
  };

  const selectStyle = {
    background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 9, padding: '8px 14px',
    color: t.text, fontSize: 13,
    fontFamily: 'Outfit, sans-serif', outline: 'none', cursor: 'pointer',
  };

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/bookings/all', { headers: { Authorization: `Bearer ${token}` } });
        setBookings(data.bookings || []);
      } catch { toast.error('Failed to load payment history'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [token]);

  const filtered = bookings.filter(b => {
    const q = search.toLowerCase();
    const matchSearch = !q || b.show?.movie?.title?.toLowerCase().includes(q) ||
      b.user?.name?.toLowerCase().includes(q) || b.user?.email?.toLowerCase().includes(q) || b._id?.toLowerCase().includes(q);
    const matchMethod = filterMethod === 'all' || b.paymentMethod?.toLowerCase() === filterMethod;
    const matchStatus = filterStatus === 'all' || b.paymentStatus?.toLowerCase() === filterStatus || b.status?.toLowerCase() === filterStatus;
    return matchSearch && matchMethod && matchStatus;
  });

  const totalRevenue    = bookings.filter(b => b.status !== 'Cancelled' && b.status !== 'Refunded').reduce((s, b) => s + (b.totalAmount || 0), 0);
  const stripeCount     = bookings.filter(b => b.paymentMethod?.toLowerCase() === 'stripe').length;
  const refundedAmount  = bookings.filter(b => b.status === 'Refunded').reduce((s, b) => s + (b.refundAmount || b.totalAmount || 0), 0);

  const getStatusStyle = (booking) => {
    if (booking.status === 'Cancelled') return { color: '#e5335d', bg: 'rgba(229,51,93,0.12)' };
    if (booking.status === 'Refunded')  return { color: '#ff9800', bg: 'rgba(255,152,0,0.12)' };
    if (booking.paymentStatus?.toLowerCase() === 'paid' || booking.status === 'Confirmed')
      return { color: '#00c853', bg: 'rgba(0,200,83,0.12)' };
    return { color: '#888', bg: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' };
  };

  const exportCSV = () => {
    const rows = [
      ['Booking ID','User','Email','Movie','Theatre','Seats','Amount','Payment Method','Status','Date'],
      ...filtered.map(b => [b._id, b.user?.name||'', b.user?.email||'', b.show?.movie?.title||'', b.show?.theatre?.name||'', (b.seats||[]).join(' | '), b.totalAmount, b.paymentMethod||'', b.status, moment(b.createdAt).format('DD MMM YYYY HH:mm')])
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `payments_${moment().format('YYYYMMDD')}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#e5335d' }}>💳 Payment History</h1>
          <p style={{ color: t.sub, fontSize: 13, marginTop: 4 }}>All transactions and payment records</p>
        </div>
        <button onClick={exportCSV} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: t.cardBg, border: `1px solid ${t.border}`,
          borderRadius: 10, color: t.text, fontWeight: 600, fontSize: 13,
          padding: '10px 18px', cursor: 'pointer',
          fontFamily: 'Outfit, sans-serif',
          boxShadow: darkMode ? 'none' : '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <FiDownload size={14} /> Export CSV
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: FiDollarSign,  label: 'Total Revenue',    value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: '#00c853' },
          { icon: FiTrendingUp,  label: 'Transactions',     value: bookings.length,                            color: '#635BFF' },
          { icon: FiCreditCard,  label: 'Stripe Payments',  value: stripeCount,                                color: '#e5335d' },
          { icon: FiX,           label: 'Refunded',         value: `₹${refundedAmount.toLocaleString('en-IN')}`, color: '#ff9800' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 14, padding: 20, boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 12, color: t.sub }}>{label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={15} color={color} />
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: t.text }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 9, padding: '8px 14px', flex: 1, minWidth: 200 }}>
          <FiSearch size={13} color={t.sub} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by movie, user, booking ID..."
            style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontSize: 13, fontFamily: 'Outfit, sans-serif', width: '100%' }} />
        </div>
        <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} style={selectStyle}>
          <option value="all">All Methods</option>
          <option value="stripe">Stripe</option>
          <option value="upi">UPI</option>
          <option value="card">Card</option>
          <option value="netbanking">Net Banking</option>
          <option value="razorpay">Razorpay</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
          <option value="all">All Status</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Transactions ({filtered.length})</span>
        </div>

        {loading ? (
          <div style={{ padding: 50, textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(229,51,93,0.2)', borderTopColor: '#e5335d', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: 'auto' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 50, textAlign: 'center', color: t.sub }}>No transactions found.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead>
                <tr style={{ background: t.theadBg }}>
                  {['Booking ID','User','Movie','Seats','Method','Amount','Status','Date'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: t.theadText, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${t.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(booking => {
                  const { color, bg } = getStatusStyle(booking);
                  return (
                    <tr key={booking._id}
                      style={{ borderTop: `1px solid ${t.border}`, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: t.sub, fontFamily: 'monospace' }}>{booking._id?.slice(-10)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{booking.user?.name || 'N/A'}</div>
                        <div style={{ fontSize: 11, color: t.sub }}>{booking.user?.email}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{booking.show?.movie?.title || 'N/A'}</div>
                        <div style={{ fontSize: 11, color: t.sub }}>{booking.show?.theatre?.name}</div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#e5335d', fontWeight: 600 }}>{(booking.seats || []).join(', ')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {booking.paymentMethod?.toLowerCase() === 'stripe' ? <SiStripe size={14} color="#635BFF" /> : <FiCreditCard size={14} color={t.sub} />}
                          <span style={{ fontSize: 12, color: t.sub, textTransform: 'capitalize' }}>{booking.paymentMethod || 'N/A'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 800, color: '#635BFF' }}>₹{booking.totalAmount?.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color }}>{booking.status}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: t.sub, whiteSpace: 'nowrap' }}>{moment(booking.createdAt).format('DD MMM YY, HH:mm')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminPaymentHistory;