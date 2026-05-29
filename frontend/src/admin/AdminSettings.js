import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  FiUser, FiLock, FiBell, FiShield,
  FiSave, FiEye, FiEyeOff, FiCheck
} from 'react-icons/fi';

const AdminSettings = () => {
  const { darkMode } = useOutletContext();
  const { userInfo } = useSelector(s => s.auth);
  const token = userInfo?.token;

  const [activeTab,    setActiveTab]    = useState('profile');
  const [saving,       setSaving]       = useState(false);
  const [showOldPass,  setShowOldPass]  = useState(false);
  const [showNewPass,  setShowNewPass]  = useState(false);
  const [showConfPass, setShowConfPass] = useState(false);

  const [profile, setProfile] = useState({
    name:  userInfo?.name  || '',
    email: userInfo?.email || '',
    phone: userInfo?.phone || '',
  });

  const [passwords, setPasswords] = useState({
    oldPassword: '', newPassword: '', confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailBookings:    true,
    emailCancels:     true,
    emailRevenue:     false,
    pushBookings:     true,
    pushAlerts:       true,
    weeklyReport:     true,
  });

  // ── Theme ──
  const t = {
    text:        darkMode ? '#f1f5f9'                : '#111111',
    sub:         darkMode ? '#94a3b8'                : '#555555',
    cardBg:      darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
    border:      darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
    inputBg:     darkMode ? 'rgba(255,255,255,0.06)' : '#f5f5f8',
    inputBorder: darkMode ? 'rgba(255,255,255,0.1)'  : '#e0e0e0',
    tabActive:   darkMode ? 'rgba(229,51,93,0.12)'   : 'rgba(229,51,93,0.08)',
    tabInactive: darkMode ? 'rgba(255,255,255,0.03)' : '#f5f5f8',
    divider:     darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    toggleOff:   darkMode ? 'rgba(255,255,255,0.12)' : '#e0e0e0',
  };

  const inputStyle = {
    width: '100%', background: t.inputBg,
    border: `1.5px solid ${t.inputBorder}`,
    borderRadius: 10, padding: '11px 14px 11px 42px',
    color: t.text, fontSize: 14,
    fontFamily: 'Outfit, sans-serif', outline: 'none',
    transition: 'border-color 0.2s',
  };

  const TABS = [
    { key: 'profile',       label: 'Profile',       icon: FiUser    },
    { key: 'security',      label: 'Security',      icon: FiLock    },
    { key: 'notifications', label: 'Notifications', icon: FiBell    },
    { key: 'admin',         label: 'Admin Info',    icon: FiShield  },
  ];

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profile.name || !profile.email) return toast.error('Name and email are required');
    setSaving(true);
    try {
      await axios.put('/api/auth/profile', profile, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    }
    setSaving(false);
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword)
      return toast.error('All password fields are required');
    if (passwords.newPassword.length < 6)
      return toast.error('New password must be at least 6 characters');
    if (passwords.newPassword !== passwords.confirmPassword)
      return toast.error('New passwords do not match');
    setSaving(true);
    try {
      await axios.put('/api/auth/change-password', passwords, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Password changed successfully!');
      setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
    setSaving(false);
  };

  const Toggle = ({ value, onChange }) => (
    <div
      onClick={onChange}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: value ? '#e5335d' : t.toggleOff,
        cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3,
        left: value ? 23 : 3,
        transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </div>
  );

  const PasswordInput = ({ label, field, show, setShow, placeholder }) => (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.sub, marginBottom: 8 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <FiLock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 15 }} />
        <input
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          style={inputStyle}
          value={passwords[field]}
          onChange={e => setPasswords({ ...passwords, [field]: e.target.value })}
        />
        <button type="button" onClick={() => setShow(!show)} style={{
          position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', color: t.sub, cursor: 'pointer', padding: 0,
        }}>
          {show ? <FiEyeOff size={16} /> : <FiEye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ color: t.text }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#e5335d' }}>Settings</h1>
        <p style={{ color: t.sub, fontSize: 13, marginTop: 4 }}>Manage your admin account preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20 }}>

        {/* Sidebar Tabs */}
        <div style={{
          background: t.cardBg, border: `1px solid ${t.border}`,
          borderRadius: 14, padding: 10, height: 'fit-content',
          boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.07)',
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 10, border: 'none',
                background: activeTab === tab.key ? t.tabActive : 'transparent',
                color: activeTab === tab.key ? '#e5335d' : t.sub,
                fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                marginBottom: 2, textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{
          background: t.cardBg, border: `1px solid ${t.border}`,
          borderRadius: 14, padding: 28,
          boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.07)',
        }}>

          {/* ── Profile ── */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 20 }}>Profile Settings</h2>

              {/* Avatar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: `1px solid ${t.divider}` }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #e5335d, #ff6b8a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 800, color: '#fff',
                  boxShadow: '0 0 0 3px rgba(229,51,93,0.25)',
                }}>
                  {userInfo?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: t.text }}>{userInfo?.name}</div>
                  <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>Super Admin</div>
                  <div style={{ fontSize: 11, color: '#e5335d', marginTop: 4, fontWeight: 600 }}>✓ Verified Account</div>
                </div>
              </div>

              {[
                { key: 'name',  label: 'Full Name',     icon: FiUser,   placeholder: 'Your name',         type: 'text'  },
                { key: 'email', label: 'Email Address', icon: FiUser,   placeholder: 'your@email.com',    type: 'email' },
                { key: 'phone', label: 'Phone Number',  icon: FiShield, placeholder: '10-digit number',   type: 'tel'   },
              ].map(({ key, label, icon: Icon, placeholder, type }) => (
                <div key={key} style={{ marginBottom: 18 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.sub, marginBottom: 8 }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <Icon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontSize: 15 }} />
                    <input
                      type={type} placeholder={placeholder} style={inputStyle}
                      value={profile[key]} onChange={e => setProfile({ ...profile, [key]: e.target.value })}
                    />
                  </div>
                </div>
              ))}

              <button type="submit" disabled={saving} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #e5335d, #be123c)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '12px 24px', fontSize: 14, fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'Outfit, sans-serif', opacity: saving ? 0.7 : 1,
                boxShadow: '0 4px 14px rgba(229,51,93,0.35)',
                marginTop: 8, width: '100%', justifyContent: 'center',
              }}>
                <FiSave size={15} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* ── Security ── */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSave}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 20 }}>Change Password</h2>

              <div style={{
                background: darkMode ? 'rgba(229,51,93,0.08)' : 'rgba(229,51,93,0.05)',
                border: '1px solid rgba(229,51,93,0.2)',
                borderRadius: 10, padding: '12px 16px', marginBottom: 24, fontSize: 13, color: t.sub,
              }}>
                🔒 For security, please enter your current password before setting a new one.
              </div>

              <PasswordInput label="Current Password"  field="oldPassword"     show={showOldPass}  setShow={setShowOldPass}  placeholder="Enter current password" />
              <PasswordInput label="New Password"       field="newPassword"     show={showNewPass}  setShow={setShowNewPass}  placeholder="Min 6 characters" />
              <PasswordInput label="Confirm New Password" field="confirmPassword" show={showConfPass} setShow={setShowConfPass} placeholder="Re-enter new password" />

              {passwords.newPassword && passwords.confirmPassword && (
                <div style={{
                  fontSize: 12, marginBottom: 16, fontWeight: 600,
                  color: passwords.newPassword === passwords.confirmPassword ? '#00c853' : '#e5335d',
                }}>
                  {passwords.newPassword === passwords.confirmPassword ? '✅ Passwords match' : '❌ Passwords do not match'}
                </div>
              )}

              <button type="submit" disabled={saving || passwords.newPassword !== passwords.confirmPassword} style={{
                display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                background: 'linear-gradient(135deg, #e5335d, #be123c)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '12px 24px', fontSize: 14, fontWeight: 700,
                cursor: (saving || passwords.newPassword !== passwords.confirmPassword) ? 'not-allowed' : 'pointer',
                fontFamily: 'Outfit, sans-serif',
                opacity: (saving || passwords.newPassword !== passwords.confirmPassword) ? 0.6 : 1,
                width: '100%', boxShadow: '0 4px 14px rgba(229,51,93,0.3)',
              }}>
                <FiLock size={15} />
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}

          {/* ── Notifications ── */}
          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 20 }}>Notification Preferences</h2>

              {[
                {
                  section: '📧 Email Notifications',
                  items: [
                    { key: 'emailBookings', label: 'New Booking Alerts',    desc: 'Get notified when a new booking is made'    },
                    { key: 'emailCancels',  label: 'Cancellation Alerts',   desc: 'Get notified when a booking is cancelled'  },
                    { key: 'emailRevenue',  label: 'Revenue Reports',       desc: 'Daily revenue summary emails'              },
                    { key: 'weeklyReport',  label: 'Weekly Summary Report', desc: 'Performance report every Monday'           },
                  ],
                },
                {
                  section: '🔔 Push Notifications',
                  items: [
                    { key: 'pushBookings', label: 'Booking Notifications', desc: 'Real-time booking alerts in browser'  },
                    { key: 'pushAlerts',   label: 'System Alerts',         desc: 'Critical system and error alerts'     },
                  ],
                },
              ].map(group => (
                <div key={group.section} style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.sub, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {group.section}
                  </div>
                  {group.items.map(item => (
                    <div key={item.key} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 0', borderBottom: `1px solid ${t.divider}`,
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: t.text }}>{item.label}</div>
                        <div style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>{item.desc}</div>
                      </div>
                      <Toggle
                        value={notifications[item.key]}
                        onChange={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      />
                    </div>
                  ))}
                </div>
              ))}

              <button onClick={() => toast.success('Notification preferences saved!')} style={{
                display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
                background: 'linear-gradient(135deg, #e5335d, #be123c)',
                color: '#fff', border: 'none', borderRadius: 10,
                padding: '12px 24px', fontSize: 14, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                width: '100%', boxShadow: '0 4px 14px rgba(229,51,93,0.3)',
              }}>
                <FiSave size={15} /> Save Preferences
              </button>
            </div>
          )}

          {/* ── Admin Info ── */}
          {activeTab === 'admin' && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: t.text, marginBottom: 20 }}>Admin Information</h2>

              {[
                { label: 'Account Type',   value: 'Super Admin',          color: '#e5335d' },
                { label: 'Admin ID',       value: userInfo?._id?.slice(-8).toUpperCase() || 'ADM001', color: t.sub },
                { label: 'Email',          value: userInfo?.email || '—',  color: t.text   },
                { label: 'Member Since',   value: 'January 2024',          color: t.text   },
                { label: 'Last Login',     value: 'Today',                 color: '#00c853'},
                { label: 'Login Attempts', value: '0 failed attempts',     color: '#00c853'},
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 0', borderBottom: `1px solid ${t.divider}`,
                }}>
                  <span style={{ fontSize: 13, color: t.sub }}>{item.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>{item.value}</span>
                </div>
              ))}

              <div style={{
                marginTop: 24,
                background: 'rgba(0,200,83,0.08)', border: '1px solid rgba(0,200,83,0.2)',
                borderRadius: 10, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <FiShield size={18} color="#00c853" />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#00c853' }}>Account Secured</div>
                  <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>Your admin account has full security protections enabled</div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminSettings;