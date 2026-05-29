import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import {
  FiGrid, FiFilm, FiMapPin, FiCalendar, FiBookmark,
  FiUsers, FiLogOut, FiBell, FiSearch, FiMenu, FiX, FiHome,
  FiBarChart2, FiTag, FiSettings, FiMoon, FiSun, FiCreditCard,
} from 'react-icons/fi';

const NAV_MAIN = [
  { path: '/admin', label: 'Dashboard', icon: FiGrid, exact: true },
  { path: '/admin/movies', label: 'Movies', icon: FiFilm },
  { path: '/admin/theatres', label: 'Theatres', icon: FiMapPin },
  { path: '/admin/shows', label: 'Shows', icon: FiCalendar },
  { path: '/admin/bookings', label: 'Bookings', icon: FiBookmark },
  { path: '/admin/users', label: 'Users', icon: FiUsers },
  { path: '/admin/payment-history', label: 'Payment History', icon: FiCreditCard },
];

const NAV_SECONDARY = [
  { path: '/admin/reports', label: 'Reports', icon: FiBarChart2 },
  { path: '/admin/offers', label: 'Offers', icon: FiTag },
  { path: '/admin/settings', label: 'Settings', icon: FiSettings },
];

const AdminLayout = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo } = useSelector(state => state.auth);
  const [collapsed, setCollapsed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const dropdownRef = useRef(null);

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
    navigate('/admin/login');
  };

  const isActive = (path, exact) =>
    exact ? location.pathname === '/admin' : location.pathname === path;

  // ✅ FIXED: All light mode colors are now clean bright white
  const theme = {
    bg:        darkMode ? '#080810'               : '#f5f6fa',
    sidebar:   darkMode ? 'rgba(7,7,12,0.95)'    : '#ffffff',
    topbar:    darkMode ? 'rgba(6,6,12,0.88)'    : '#ffffff',
    text:      darkMode ? '#ffffff'               : '#111111',
    subtext:   darkMode ? 'rgba(241,233,233,0.9)' : '#555555',
    border:    darkMode ? 'rgba(255,255,255,0.07)': 'rgba(0,0,0,0.10)',
    searchBg:  darkMode ? 'rgba(255,255,255,0.05)': '#f0f0f5',
    iconBtn:   darkMode ? 'rgba(255,255,255,0.04)': '#f0f0f5',
    navActive: darkMode ? 'rgba(229,51,93,0.12)'  : 'rgba(229,51,93,0.10)',
    cardBg:    darkMode ? 'rgba(255,255,255,0.03)' : '#ffffff',
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        .adm * { font-family: 'Outfit', sans-serif; box-sizing: border-box; }

        /* ✅ FIXED: Light mode has no glow/dot effects — clean white */
        .adm-bg {
          position: fixed; inset: 0; z-index: 0;
          background: ${theme.bg}; transition: background 0.3s;
        }
        .adm-bg::before {
          content: ''; position: absolute; inset: 0;
          background: ${darkMode
            ? 'radial-gradient(ellipse 70% 50% at 15% 25%, rgba(229,51,93,0.1) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 85% 75%, rgba(99,51,229,0.08) 0%, transparent 50%)'
            : 'none'};
          animation: ${darkMode ? 'bgp 8s ease-in-out infinite alternate' : 'none'};
        }
        @keyframes bgp { from{opacity:0.7} to{opacity:1} }
        .adm-bg::after {
          content: ''; position: absolute; inset: 0;
          background-image: ${darkMode
            ? 'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)'
            : 'none'};
          background-size: 30px 30px;
        }

        .adm-sidebar {
          position: fixed; top:0; bottom:0; left:0; z-index:50;
          display: flex; flex-direction: column;
          background: ${theme.sidebar};
          ${darkMode ? 'backdrop-filter: blur(20px);' : ''}
          border-right: 1px solid ${theme.border};
          transition: width 0.3s cubic-bezier(.4,0,.2,1), background 0.3s;
          overflow: hidden;
          box-shadow: ${darkMode ? 'none' : '2px 0 12px rgba(0,0,0,0.06)'};
        }

        .sb-logo {
          padding: 18px 14px; border-bottom: 1px solid ${theme.border};
          display: flex; align-items: center; gap: 10px; flex-shrink: 0;
        }
        .sb-logo-icon {
          width: 32px; height: 32px; flex-shrink: 0;
          background: linear-gradient(135deg, #e5335d, #ff6384);
          border-radius: 9px; display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 15px; color: #fff;
          box-shadow: 0 4px 12px rgba(229,51,93,0.35);
        }
        /* ✅ FIXED: logo text dark in light mode */
        .sb-logo-text { font-size: 14px; font-weight: 800; color: ${darkMode ? '#ffffff' : '#111111'}; white-space: nowrap; }
        .sb-logo-text span { color: #e5335d; }

        /* ✅ FIXED: section label visible in light mode */
        .sb-section-label {
          font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: 1.5px;
          color: ${darkMode ? 'rgba(255,255,255,0.2)' : '#aaaaaa'};
          padding: 12px 14px 6px; white-space: nowrap;
        }

        .sb-nav { flex: 1; padding: 8px; overflow-y: auto; }
        .sb-nav::-webkit-scrollbar { width: 0; }

        /* ✅ FIXED: nav links dark in light mode */
        .nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 10px; border-radius: 9px; margin-bottom: 2px;
          cursor: pointer; transition: all 0.18s; text-decoration: none;
          color: ${darkMode ? 'rgba(241,233,233,0.9)' : '#444444'};
          border: 1px solid transparent;
          position: relative; white-space: nowrap; overflow: hidden;
        }
        .nav-link:hover {
          color: ${darkMode ? '#ffffff' : '#111111'};
          background: ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'};
        }
        .nav-link.active {
          color: ${darkMode ? '#ffffff' : '#cc0000'};
          background: ${theme.navActive};
          border-color: rgba(229,51,93,0.28);
        }
        .nav-link .ndot {
          display: none; position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%); width: 5px; height: 5px;
          border-radius: 50%; background: #e5335d; box-shadow: 0 0 6px #e5335d;
        }
        .nav-link.active .ndot { display: block; }
        .nav-label { font-size: 13px; font-weight: 600; }

        .premium-card {
          margin: 10px 8px; border-radius: 12px;
          background: linear-gradient(135deg, rgba(229,51,93,0.15), rgba(99,51,229,0.15));
          border: 1px solid rgba(229,51,93,0.25); padding: 14px;
          white-space: nowrap; overflow: hidden;
        }
        .premium-btn {
          display: block; margin-top: 10px; background: #e5335d; color: #fff;
          border: none; border-radius: 8px; font-weight: 700; font-size: 12px;
          cursor: pointer; text-align: center; width: 100%;
          font-family: Outfit, sans-serif; padding: 8px; transition: opacity 0.2s;
        }
        .premium-btn:hover { opacity: 0.85; }

        .sb-logout { padding: 8px; border-top: 1px solid ${theme.border}; flex-shrink: 0; }
        .logout-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 10px; border-radius: 9px; cursor: pointer;
          color: #e5335d; transition: all 0.18s; white-space: nowrap;
        }
        .logout-btn:hover { background: rgba(229,51,93,0.1); }

        /* ✅ FIXED: topbar pure white in light mode */
        .adm-topbar {
          height: 60px;
          background: ${theme.topbar};
          ${darkMode ? 'backdrop-filter: blur(20px);' : ''}
          border-bottom: 1px solid ${theme.border};
          box-shadow: ${darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.06)'};
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 22px; position: sticky; top: 0; z-index: 40;
          transition: background 0.3s;
        }

        .top-search {
          display: flex; align-items: center; gap: 10px;
          background: ${theme.searchBg}; border: 1px solid ${theme.border};
          border-radius: 10px; padding: 8px 14px; transition: all 0.2s;
        }
        .top-search:focus-within { border-color: rgba(229,51,93,0.35); background: rgba(229,51,93,0.04); }
        .top-search input {
          background: none; border: none; outline: none;
          color: ${theme.text}; font-family: Outfit, sans-serif; font-size: 13px; width: 220px;
        }
        /* ✅ FIXED: placeholder visible in light mode */
        .top-search input::placeholder { color: ${darkMode ? 'rgba(255,255,255,0.2)' : '#aaaaaa'}; }

        .top-icon-btn {
          width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          background: ${theme.iconBtn}; border: 1px solid ${theme.border};
          cursor: pointer; transition: all 0.18s;
          color: ${darkMode ? 'rgba(241,233,233,0.9)' : '#555555'};
          text-decoration: none;
        }
        /* ✅ FIXED: icon hover visible in light mode */
        .top-icon-btn:hover {
          color: ${darkMode ? '#ffffff' : '#111111'};
          background: ${darkMode ? 'rgba(255,255,255,0.08)' : '#e8e8ee'};
        }

        .bell-dot {
          position: absolute; top: -4px; right: -4px;
          width: 15px; height: 15px; background: #e5335d;
          border-radius: 50%; font-size: 8px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          color: #fff; box-shadow: 0 0 8px rgba(229,51,93,0.6);
          animation: bellanim 2s ease-in-out infinite;
        }
        @keyframes bellanim { 0%,100%{transform:scale(1)} 50%{transform:scale(1.2)} }

        .adm-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #e5335d, #ff6384);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 13px; color: #fff;
          box-shadow: 0 0 0 2px rgba(229,51,93,0.3); cursor: pointer; flex-shrink: 0;
        }

        .adm-dropdown {
          position: absolute; right: 0; top: calc(100% + 8px);
          background: ${darkMode ? 'rgba(12,12,20,0.98)' : '#ffffff'};
          border: 1px solid ${theme.border};
          border-radius: 13px; min-width: 195px; z-index: 9999; overflow: hidden;
          box-shadow: ${darkMode ? '0 20px 60px rgba(0,0,0,0.6)' : '0 8px 30px rgba(0,0,0,0.12)'};
          animation: dropin 0.15s ease;
        }
        @keyframes dropin { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }

        /* ✅ FIXED: content area clean white background in light mode */
        .adm-content {
          flex: 1; padding: 24px; overflow-y: auto;
          position: relative; z-index: 1; animation: cfade 0.3s ease;
          color: ${theme.text};
          background: ${darkMode ? 'transparent' : '#f5f6fa'};
        }
        @keyframes cfade { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .adm-content::-webkit-scrollbar { width: 4px; }
        .adm-content::-webkit-scrollbar-thumb { background: rgba(229,51,93,0.25); border-radius: 2px; }

        /* ✅ FIXED: hamburger button visible in both modes */
        .menu-toggle-btn {
          background: none; border: none; cursor: pointer;
          display: flex; padding: 4px;
          color: ${darkMode ? 'rgba(255,255,255,0.5)' : '#555555'};
        }
        .menu-toggle-btn:hover { color: ${darkMode ? '#ffffff' : '#111111'}; }
      `}</style>

      <div className="adm" style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
        <div className="adm-bg" />

        {/* ── Sidebar ── */}
        <div className="adm-sidebar" style={{ width: collapsed ? 56 : 210 }}>
          <div className="sb-logo">
            <div className="sb-logo-icon">B</div>
            {!collapsed && <div className="sb-logo-text">Book<span>My</span>Show</div>}
          </div>

          <div className="sb-nav">
            {!collapsed && <div className="sb-section-label">Main Menu</div>}
            {NAV_MAIN.map(({ path, label, icon: Icon, exact }) => (
              <Link key={path} to={path} className={`nav-link ${isActive(path, exact) ? 'active' : ''}`}>
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && <span className="nav-label">{label}</span>}
                <span className="ndot" />
              </Link>
            ))}

            {!collapsed && <div className="sb-section-label" style={{ marginTop: 8 }}>Others</div>}
            {NAV_SECONDARY.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} className={`nav-link ${location.pathname === path ? 'active' : ''}`}>
                <Icon size={16} style={{ flexShrink: 0 }} />
                {!collapsed && <span className="nav-label">{label}</span>}
                <span className="ndot" />
              </Link>
            ))}

            {!collapsed && (
              <div className="premium-card" style={{ marginTop: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#ffb300' }}>👑 Premium Admin</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4, lineHeight: 1.5 }}>
                  Unlock advanced insights and analytics.
                </div>
                <button className="premium-btn">Upgrade Now</button>
              </div>
            )}
          </div>

          <div className="sb-logout">
            <div className="logout-btn" onClick={handleLogout}>
              <FiLogOut size={16} style={{ flexShrink: 0 }} />
              {!collapsed && <span style={{ fontSize: 13, fontWeight: 600 }}>Logout</span>}
            </div>
          </div>
        </div>

        {/* ── Main area ── */}
        <div style={{
          marginLeft: collapsed ? 56 : 210, flex: 1,
          transition: 'margin-left 0.3s cubic-bezier(.4,0,.2,1)',
          display: 'flex', flexDirection: 'column',
          position: 'relative', zIndex: 1,
        }}>
          {/* Topbar */}
          <div className="adm-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className="menu-toggle-btn"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <FiMenu size={19} /> : <FiX size={19} />}
              </button>
              <div className="top-search">
                <FiSearch size={13} color={darkMode ? 'rgba(255,255,255,0.25)' : '#aaaaaa'} />
                <input placeholder="Search movies, shows, users..." />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Link to="/" className="top-icon-btn"><FiHome size={15} /></Link>

              {/* Dark/Light toggle */}
              <div
                className="top-icon-btn"
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                style={{
                  color: darkMode ? '#ffb300' : '#555',
                  background: darkMode ? 'rgba(255,179,0,0.1)' : 'rgba(0,0,0,0.06)',
                  border: `1px solid ${darkMode ? 'rgba(255,179,0,0.3)' : 'rgba(0,0,0,0.12)'}`,
                }}
              >
                {darkMode ? <FiSun size={15} /> : <FiMoon size={15} />}
              </div>

              <div className="top-icon-btn" style={{ position: 'relative' }}>
                <FiBell size={15} />
                <div className="bell-dot">3</div>
              </div>

              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <div
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginLeft: 4 }}
                >
                  <div className="adm-avatar">{userInfo?.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{userInfo?.name}</div>
                    <div style={{ fontSize: 10, color: theme.subtext }}>Super Admin</div>
                  </div>
                </div>

                {showDropdown && (
                  <div className="adm-dropdown">
                    <div style={{ padding: '13px 15px', borderBottom: `1px solid ${theme.border}` }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: theme.text }}>{userInfo?.name}</div>
                      <div style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>{userInfo?.email}</div>
                    </div>
                    <button
                      onClick={handleLogout}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 15px', color: '#e5335d',
                        background: 'none', border: 'none', width: '100%',
                        fontSize: 13, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(229,51,93,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <FiLogOut size={13} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="adm-content">
            <Outlet context={{ darkMode }} />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminLayout;