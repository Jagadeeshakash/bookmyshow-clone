import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { FiSearch, FiMapPin, FiBell, FiLogOut, FiBookmark, FiShield, FiSun, FiMoon } from 'react-icons/fi';

const Navbar = () => {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const { userInfo } = useSelector((state) => state.auth);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery,  setSearchQuery]  = useState('');
  const [darkMode,     setDarkMode]     = useState(true);
  const dropdownRef = useRef(null);

  // Apply theme to <html> so the whole page reacts
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    document.body.style.background    = darkMode ? '#0a0a0f' : '#f5f5f8';
    document.body.style.color         = darkMode ? '#ffffff' : '#111111';
  }, [darkMode]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    setShowDropdown(false);
  };

  const navBg       = darkMode ? '#0f0f17'           : '#ffffff';
  const navBorder   = darkMode ? '#2a2a3a'           : '#e0e0e0';
  const searchBg    = darkMode ? '#1a1a26'           : '#f0f0f5';
  const searchBdr   = darkMode ? '#2a2a3a'           : '#ddd';
  const inputColor  = darkMode ? '#ffffff'           : '#111111';
  const textColor   = darkMode ? '#ffffff'           : '#111111';
  const dropdownBg  = darkMode ? '#1a1a26'           : '#ffffff';
  const dropdownBdr = darkMode ? '#2a2a3a'           : '#e0e0e0';
  const itemHover   = darkMode ? '#2a2a3a'           : '#f5f5f8';
  const toggleBg    = darkMode ? '#1a1a26'           : '#f0f0f5';
  const toggleBdr   = darkMode ? '#2a2a3a'           : '#ddd';

  return (
    <nav style={{
      background: navBg,
      borderBottom: `1px solid ${navBorder}`,
      padding: '0 24px',
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      transition: 'background 0.3s, border-color 0.3s',
    }}>

      {/* Logo */}
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          background: '#e5335d', width: 32, height: 32, borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, fontWeight: 800, color: '#fff',
        }}>B</div>
        <span style={{ fontSize: 18, fontWeight: 800, color: textColor }}>
          Book<span style={{ color: '#e5335d' }}>My</span>Show
        </span>
      </Link>

      {/* City + Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, maxWidth: 600, margin: '0 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#e5335d', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <FiMapPin size={14} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Chennai</span>
        </div>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 8,
          background: searchBg, border: `1px solid ${searchBdr}`,
          borderRadius: 8, padding: '8px 14px', transition: 'background 0.3s',
        }}>
          <FiSearch size={16} color="#888" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for movies, theatres..."
            style={{
              background: 'none', border: 'none', outline: 'none',
              color: inputColor, fontSize: 13, width: '100%', fontFamily: 'Poppins',
            }}
          />
        </div>
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

        {/* ── Dark / Light Toggle ── */}
        <button
          onClick={() => setDarkMode(d => !d)}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: toggleBg, border: `1px solid ${toggleBdr}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(229,51,93,0.15)'; e.currentTarget.style.borderColor = 'rgba(229,51,93,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = toggleBg; e.currentTarget.style.borderColor = toggleBdr; }}
        >
          {darkMode
            ? <FiSun  size={16} color="#ffb300" />
            : <FiMoon size={16} color="#555" />
          }
        </button>

        {userInfo ? (
          <>
            <FiBell size={18} color={darkMode ? '#9999bb' : '#666'} style={{ cursor: 'pointer' }} />

            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <div
                onClick={() => setShowDropdown(!showDropdown)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                  background: searchBg, borderRadius: 8, padding: '6px 12px',
                  border: `1px solid ${searchBdr}`,
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#e5335d', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff',
                }}>
                  {userInfo.name?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: textColor }}>
                  {userInfo.name?.split(' ')[0]}
                </span>
              </div>

              {showDropdown && (
                <div style={{
                  position: 'absolute', right: 0, top: '110%',
                  background: dropdownBg, border: `1px solid ${dropdownBdr}`,
                  borderRadius: 10, minWidth: 190, zIndex: 9999,
                  overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                  transition: 'background 0.3s',
                }}>
                  {/* User info */}
                  <div style={{ padding: '12px 16px', borderBottom: `1px solid ${dropdownBdr}` }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{userInfo.name}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{userInfo.email}</div>
                  </div>

                  <Link
                    to="/my-bookings"
                    onClick={() => setShowDropdown(false)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: textColor, textDecoration: 'none', fontSize: 13 }}
                    onMouseEnter={e => e.currentTarget.style.background = itemHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <FiBookmark size={14} /> My Bookings
                  </Link>

                  {userInfo.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setShowDropdown(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', color: '#e5335d', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}
                      onMouseEnter={e => e.currentTarget.style.background = itemHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <FiShield size={14} /> Admin Panel
                    </Link>
                  )}

                  <div style={{ borderTop: `1px solid ${dropdownBdr}` }}>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                        color: '#e5335d', background: 'none', border: 'none', width: '100%',
                        fontSize: 13, cursor: 'pointer', fontFamily: 'Poppins',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = itemHover}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <FiLogOut size={14} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/login">
              <button style={{
                padding: '7px 18px', fontSize: 13, fontFamily: 'Poppins',
                background: 'transparent', border: `1px solid ${darkMode ? '#2a2a3a' : '#ddd'}`,
                borderRadius: 8, color: textColor, cursor: 'pointer', fontWeight: 600,
                transition: 'all 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#e5335d'; e.currentTarget.style.color = '#e5335d'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode ? '#2a2a3a' : '#ddd'; e.currentTarget.style.color = textColor; }}
              >Sign In</button>
            </Link>
            <Link to="/register">
              <button style={{
                padding: '7px 18px', fontSize: 13, fontFamily: 'Poppins',
                background: '#e5335d', border: 'none',
                borderRadius: 8, color: '#fff', cursor: 'pointer', fontWeight: 700,
              }}>Sign Up</button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;