import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { userInfo, loading, error } = useSelector(state => state.auth);

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);

  // Where to redirect after login (defaults to '/')
  const from = location.state?.from || '/';

  // ✅ Redirect once logged in — goes back to where user came from
  useEffect(() => {
    if (userInfo && userInfo.token) {
      if (userInfo.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [userInfo, navigate, from]);

  // ✅ Show error toasts
  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill all fields');
    dispatch(loginUser(form));
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 20% 50%, rgba(229,51,93,0.08) 0%, transparent 60%), #0a0a0f',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, background: '#e5335d', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 auto',
          }}>B</div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Welcome Back 👋</h2>
          <p style={{ color: '#9999bb', fontSize: 13, marginTop: 6 }}>Login to your account</p>
          {/* Show where user will be redirected back to */}
          {from && from !== '/' && (
            <div style={{
              marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(229,51,93,0.1)', border: '1px solid rgba(229,51,93,0.3)',
              borderRadius: 8, padding: '5px 12px', fontSize: 12, color: '#e5335d',
            }}>
              🔒 Login to continue booking your tickets
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit} autoComplete="off">
            <input type="text" style={{ display: 'none' }} name="fake-user" />
            <input type="password" style={{ display: 'none' }} name="fake-pass" />

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <FiMail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666688' }} />
                <input
                  type="email" className="form-input" style={{ paddingLeft: 38 }}
                  placeholder="Enter your email" value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  autoComplete="off" name="bms-login-email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666688' }} />
                <input
                  type={showPwd ? 'text' : 'password'} className="form-input"
                  style={{ paddingLeft: 38, paddingRight: 38 }}
                  placeholder="••••••••" value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password" name="bms-login-password"
                />
                <div onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666688' }}>
                  {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#9999bb', cursor: 'pointer' }}>
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/forgot-password" style={{ fontSize: 13, color: '#e5335d', textDecoration: 'none', fontWeight: 600 }}>
                Forgot Password?
              </Link>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: 15, justifyContent: 'center' }}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{ textAlign: 'center', margin: '20px 0', color: '#666688', fontSize: 13 }}>OR</div>

          <button style={{
            width: '100%', padding: '11px', background: '#1a1a26',
            border: '1px solid #2a2a3a', borderRadius: 8, color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>G</span> Login with Google
          </button>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#9999bb' }}>
            New here?{' '}
            <Link
              to="/register"
              state={{ from }}
              style={{ color: '#e5335d', fontWeight: 600, textDecoration: 'none' }}
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;