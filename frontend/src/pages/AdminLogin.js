import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError, logout } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';

const AdminLogin = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo, loading, error } = useSelector(state => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  useEffect(() => {
    if (userInfo && userInfo.role !== 'admin') {
      dispatch(logout());
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setEmail('');
      setPassword('');
      if (emailRef.current) emailRef.current.value = '';
      if (passwordRef.current) passwordRef.current.value = '';
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (userInfo && userInfo.role === 'admin') {
      navigate('/admin');
    }
  }, [userInfo, navigate]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalEmail = emailRef.current?.value || email;
    const finalPassword = passwordRef.current?.value || password;
    if (!finalEmail || !finalPassword) return toast.error('Please fill all fields');
    dispatch(loginUser({ email: finalEmail, password: finalPassword }));
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 80% 20%, rgba(100,51,229,0.1) 0%, transparent 60%), #0a0a0f',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 52, height: 52,
            background: 'linear-gradient(135deg, #6433e5, #e5335d)',
            borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px',
          }}>
            <FiShield size={26} color="#fff" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>Admin Portal 🔐</h2>
          <p style={{ color: '#9999bb', fontSize: 13, marginTop: 6 }}>Login with your admin credentials</p>
        </div>

        {/* Admin badge */}
        <div style={{
          textAlign: 'center', marginBottom: 20, padding: '8px 16px',
          background: 'rgba(100,51,229,0.12)',
          border: '1px solid rgba(100,51,229,0.3)',
          borderRadius: 8, fontSize: 12, color: '#a084f5',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <FiShield size={13} /> Admin Access Only
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 28, border: '1px solid rgba(100,51,229,0.2)' }}>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <div style={{ position: 'relative' }}>
                <FiMail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666688' }} />
                <input
                  ref={emailRef}
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 38 }}
                  placeholder="jagadeeshakash171@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="off"
                  data-lpignore="true"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Admin Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666688' }} />
                <input
                  ref={passwordRef}
                  type={showPwd ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingLeft: 38, paddingRight: 38 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  data-lpignore="true"
                />
                <div
                  onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666688' }}
                >
                  {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '12px', fontSize: 15, marginTop: 8,
                background: loading ? '#555' : 'linear-gradient(135deg, #6433e5, #e5335d)',
                border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Poppins',
              }}
            >
              {loading ? 'Signing in...' : '🔐 Admin Login'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#9999bb' }}>
            Not an admin?{' '}
            <Link to="/login" style={{ color: '#e5335d', fontWeight: 600, textDecoration: 'none' }}>
              User Login
            </Link>
          </p>
        </div>

        {/* Demo credentials */}
        <div style={{
          marginTop: 16, padding: '12px 16px',
          background: 'rgba(100,51,229,0.08)',
          border: '1px solid rgba(100,51,229,0.2)',
          borderRadius: 8, fontSize: 12, color: '#9999bb',
        }}>
          <strong style={{ color: '#a084f5' }}>Admin Demo:</strong> jagadeeshakash171@gmail.com / Admin@123
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;