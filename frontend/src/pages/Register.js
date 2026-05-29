import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi';

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userInfo, loading, error } = useSelector(state => state.auth);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });

  useEffect(() => { if (userInfo) navigate('/'); }, [userInfo, navigate]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) return toast.error('Please fill all required fields');
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    dispatch(registerUser({ name: form.name, email: form.email, phone: form.phone, password: form.password }));
  };

  const fields = [
    { key: 'name', label: 'Full Name', icon: FiUser, type: 'text', placeholder: 'John Doe' },
    { key: 'email', label: 'Email Address', icon: FiMail, type: 'email', placeholder: 'john@example.com' },
    { key: 'phone', label: 'Phone Number', icon: FiPhone, type: 'tel', placeholder: '+91 9876543210' },
    { key: 'password', label: 'Password', icon: FiLock, type: 'password', placeholder: '••••••••' },
    { key: 'confirmPassword', label: 'Confirm Password', icon: FiLock, type: 'password', placeholder: '••••••••' },
  ];

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 80% 50%, rgba(229,51,93,0.08) 0%, transparent 60%), #0a0a0f',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, background: '#e5335d', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 auto 14px',
          }}>B</div>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Create Account</h2>
          <p style={{ color: '#9999bb', fontSize: 13, marginTop: 6 }}>Join BookMyShow today</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <form onSubmit={handleSubmit}>
            {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
              <div className="form-group" key={key}>
                <label className="form-label">{label}</label>
                <div style={{ position: 'relative' }}>
                  <Icon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666688' }} size={15} />
                  <input
                    type={type}
                    className="form-input"
                    style={{ paddingLeft: 38 }}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={e => setForm({ ...form, [key]: e.target.value })}
                  />
                </div>
              </div>
            ))}
            <button type="submit" className="btn-primary" disabled={loading}
              style={{ width: '100%', padding: '12px', fontSize: 15, justifyContent: 'center', marginTop: 4 }}>
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#9999bb' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#e5335d', fontWeight: 600, textDecoration: 'none' }}>Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;