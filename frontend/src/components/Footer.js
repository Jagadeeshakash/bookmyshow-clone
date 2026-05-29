import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    // Read initial theme
    const theme = document.documentElement.getAttribute('data-theme');
    setDarkMode(theme !== 'light');

    // Watch for theme changes from Navbar toggle
    const observer = new MutationObserver(() => {
      const t = document.documentElement.getAttribute('data-theme');
      setDarkMode(t !== 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

  const bg         = darkMode ? '#0f0f17'           : '#ffffff';
  const border     = darkMode ? '#1e1e2e'           : '#e0e0e0';
  const text       = darkMode ? '#ffffff'           : '#111111';
  const muted      = darkMode ? '#9999bb'           : '#666666';
  const linkColor  = darkMode ? '#9999bb'           : '#555555';
  const logoBg     = '#e5335d';
  const bottomBg   = darkMode ? '#080810'           : '#f5f5f8';
  const bottomText = darkMode ? '#555577'           : '#999999';

  return (
    <footer style={{
      background: bg,
      borderTop: `1px solid ${border}`,
      padding: '40px 24px 24px',
      marginTop: 60,
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 32,
          marginBottom: 32,
        }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{
                background: logoBg, width: 28, height: 28, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 14, color: '#fff',
              }}>B</div>
              <span style={{ fontWeight: 800, fontSize: 16, color: text }}>
                Book<span style={{ color: '#e5335d' }}>My</span>Show
              </span>
            </div>
            <p style={{ color: muted, fontSize: 13, lineHeight: 1.7 }}>
              India's largest entertainment ticketing platform. Book movies, events, and more.
            </p>
          </div>

          {/* Movies */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: text }}>Movies</h4>
            {['Now Showing', 'Upcoming', 'Top Rated', 'Languages'].map(item => (
              <div key={item} style={{ marginBottom: 8 }}>
                <Link to="/" style={{
                  color: linkColor, fontSize: 13, textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e5335d'}
                  onMouseLeave={e => e.currentTarget.style.color = linkColor}
                >{item}</Link>
              </div>
            ))}
          </div>

          {/* Help */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: text }}>Help</h4>
            {['About Us', 'Contact Us', 'Terms of Use', 'Privacy Policy', 'FAQs'].map(item => (
              <div key={item} style={{ marginBottom: 8 }}>
                <span style={{
                  color: linkColor, fontSize: 13, cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e5335d'}
                  onMouseLeave={e => e.currentTarget.style.color = linkColor}
                >{item}</span>
              </div>
            ))}
          </div>

          {/* Follow Us */}
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: text }}>Follow Us</h4>
            {[
              { name: 'Facebook',  icon: '📘' },
              { name: 'Twitter',   icon: '🐦' },
              { name: 'Instagram', icon: '📸' },
              { name: 'YouTube',   icon: '▶️' },
            ].map(({ name, icon }) => (
              <div key={name} style={{ marginBottom: 8 }}>
                <span style={{
                  color: linkColor, fontSize: 13, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.color = '#e5335d'}
                  onMouseLeave={e => e.currentTarget.style.color = linkColor}
                >
                  <span>{icon}</span> {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: `1px solid ${border}`,
          paddingTop: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
          background: darkMode ? 'transparent' : 'transparent',
        }}>
          <p style={{ color: bottomText, fontSize: 12, margin: 0 }}>
            © 2024 BookMyShow Clone. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Privacy Policy', 'Terms of Use', 'Cookie Policy'].map(item => (
              <span key={item} style={{
                color: bottomText, fontSize: 12, cursor: 'pointer',
                transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#e5335d'}
                onMouseLeave={e => e.currentTarget.style.color = bottomText}
              >{item}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;