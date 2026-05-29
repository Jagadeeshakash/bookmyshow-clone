import React, { useEffect, useState } from 'react';
import { authAPI } from '../utils/api';
import { useOutletContext } from 'react-router-dom';
import { FiSearch, FiUser, FiShield, FiPhone, FiMail, FiCalendar } from 'react-icons/fi';
import moment from 'moment';

const AdminUsers = () => {
  const { darkMode } = useOutletContext();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [error,   setError]   = useState(null);

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

  useEffect(() => {
    authAPI.getAllUsers()
      .then(({ data }) => { setUsers(data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.message || 'Failed to load users'); setLoading(false); });
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.phone?.includes(q);
  });

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount  = users.filter(u => u.role === 'user').length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: t.text }}>👥 Users</h1>
        <p style={{ color: t.sub, fontSize: 13, marginTop: 4 }}>All registered users on the platform</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Users',    value: users.length, icon: FiUser,   color: '#00b0ff', bg: 'rgba(0,176,255,0.12)'  },
          { label: 'Admin Users',    value: adminCount,   icon: FiShield, color: '#e5335d', bg: 'rgba(229,51,93,0.12)'  },
          { label: 'Regular Users',  value: userCount,    icon: FiUser,   color: '#00c853', bg: 'rgba(0,200,83,0.12)'   },
        ].map(card => (
          <div key={card.label} style={{
            background: t.cardBg, border: `1px solid ${t.border}`,
            borderRadius: 14, padding: 20,
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 12px rgba(0,0,0,0.06)',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: card.bg, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <card.icon size={22} />
            </div>
            <div>
              <div style={{ fontSize: 24, fontWeight: 800, color: t.text }}>{card.value}</div>
              <div style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

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
          <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Users ({filtered.length})</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: '8px 14px', width: 280 }}>
            <FiSearch size={14} color={t.sub} />
            <input placeholder="Search by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontFamily: 'Outfit, sans-serif', fontSize: 13, flex: 1 }} />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
              <div style={{ width: 36, height: 36, border: '3px solid rgba(229,51,93,0.2)', borderTopColor: '#e5335d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
              <p style={{ color: '#e5335d', fontSize: 15, fontWeight: 600 }}>{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>👤</div>
              <p style={{ color: t.sub, fontSize: 15 }}>No users found</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: t.theadBg }}>
                  {['User', 'Email', 'Phone', 'Role', 'Joined'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: t.theadText, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${t.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user._id}
                    style={{ borderTop: `1px solid ${t.border}`, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: '50%',
                          background: user.role === 'admin'
                            ? 'linear-gradient(135deg,#e5335d,#ff6b8a)'
                            : 'linear-gradient(135deg,#00b0ff,#0080c0)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 15, fontWeight: 800, color: '#fff', flexShrink: 0,
                        }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13, color: t.text }}>{user.name}</div>
                          <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>ID: {user._id?.slice(-6)}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: t.sub }}><FiMail size={12} />{user.email}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: t.sub }}><FiPhone size={12} />{user.phone || '—'}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        background: user.role === 'admin' ? 'rgba(229,51,93,0.12)' : 'rgba(0,176,255,0.12)',
                        color: user.role === 'admin' ? '#e5335d' : '#00b0ff',
                        border: `1px solid ${user.role === 'admin' ? 'rgba(229,51,93,0.3)' : 'rgba(0,176,255,0.3)'}`,
                        padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        textTransform: 'capitalize', display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        {user.role === 'admin' ? <FiShield size={10} /> : <FiUser size={10} />}
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: t.sub }}>
                        <FiCalendar size={11} />{moment(user.createdAt).format('DD MMM YYYY')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminUsers;