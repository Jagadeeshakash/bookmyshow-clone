import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowLeft } from 'react-icons/fi';

// Steps: 1=email, 2=otp, 3=newpassword
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // ── Step 1: Send OTP ────────────────────────────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter your email');
    setLoading(true);
    try {
      await axios.post('/api/forgot-password/send-otp', { email });
      toast.success('OTP sent to your email!');
      setStep(2);
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await axios.post('/api/forgot-password/send-otp', { email });
      toast.success('OTP resent!');
      startResendTimer();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling ──────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      document.getElementById('otp-5')?.focus();
    }
  };

  // ── Step 2: Verify OTP ──────────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return toast.error('Please enter the 6-digit OTP');
    setLoading(true);
    try {
      await axios.post('/api/forgot-password/verify-otp', { email, otp: otpValue });
      toast.success('OTP verified! Set your new password.');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ──────────────────────────────────────────────────
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return toast.error('Please fill all fields');
    if (newPassword !== confirmPassword) return toast.error('Passwords do not match');
    if (newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await axios.post('/api/forgot-password/reset-password', { email, newPassword, confirmPassword });
      toast.success('Password reset successfully! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const bgStyle = {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(ellipse at 20% 50%, rgba(229,51,93,0.08) 0%, transparent 60%), #0a0a0f',
    padding: 20,
  };

  const cardStyle = { width: '100%', maxWidth: 420 };

  const headerStyle = { textAlign: 'center', marginBottom: 28 };

  return (
    <div style={bgStyle}>
      <div style={cardStyle}>
        {/* Logo */}
        <div style={headerStyle}>
          <div style={{
            width: 52, height: 52, background: '#e5335d', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 800, color: '#fff', margin: '0 auto 14px',
          }}>B</div>

          {/* Step indicators */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
            {[1, 2, 3].map(s => (
              <React.Fragment key={s}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  background: step >= s ? '#e5335d' : '#1a1a26',
                  color: step >= s ? '#fff' : '#666688',
                  border: `2px solid ${step >= s ? '#e5335d' : '#2a2a3a'}`,
                  transition: 'all 0.3s',
                }}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && <div style={{ width: 32, height: 2, background: step > s ? '#e5335d' : '#2a2a3a', transition: 'background 0.3s' }} />}
              </React.Fragment>
            ))}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800 }}>
            {step === 1 ? 'Forgot Password?' : step === 2 ? 'Verify OTP' : 'Reset Password'}
          </h2>
          <p style={{ color: '#9999bb', fontSize: 13, marginTop: 6 }}>
            {step === 1 ? 'Enter your email to receive an OTP'
              : step === 2 ? `OTP sent to ${email}`
              : 'Enter your new password'}
          </p>
        </div>

        <div className="card" style={{ padding: 28 }}>

          {/* ── STEP 1: Email ── */}
          {step === 1 && (
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <FiMail style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666688' }} />
                  <input
                    type="email" className="form-input" style={{ paddingLeft: 38 }}
                    placeholder="jagadeeshakash171@gmail.com"
                    value={email} onChange={e => setEmail(e.target.value)} required
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}
                style={{ width: '100%', padding: '12px', fontSize: 15, justifyContent: 'center', marginTop: 8 }}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 2 && (
            <form onSubmit={handleVerifyOTP}>
              <div style={{ marginBottom: 24 }}>
                <label className="form-label" style={{ textAlign: 'center', display: 'block', marginBottom: 16 }}>
                  Enter 6-digit OTP
                </label>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i} id={`otp-${i}`}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      style={{
                        width: 46, height: 52, textAlign: 'center', fontSize: 22, fontWeight: 700,
                        background: '#1a1a26', border: `2px solid ${digit ? '#e5335d' : '#2a2a3a'}`,
                        borderRadius: 10, color: '#fff', outline: 'none', fontFamily: 'Poppins',
                        transition: 'border-color 0.2s',
                      }}
                    />
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#9999bb' }}>
                  {resendTimer > 0
                    ? <span>Resend OTP in <strong style={{ color: '#e5335d' }}>{resendTimer}s</strong></span>
                    : <span>Didn't receive? <button type="button" onClick={handleResendOTP}
                        style={{ color: '#e5335d', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                        Resend OTP
                      </button></span>
                  }
                </div>
              </div>
              <button type="submit" className="btn-primary" disabled={loading}
                style={{ width: '100%', padding: '12px', fontSize: 15, justifyContent: 'center' }}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
              <button type="button" onClick={() => setStep(1)}
                style={{ width: '100%', marginTop: 10, padding: '10px', background: 'transparent', border: '1px solid #2a2a3a', borderRadius: 6, color: '#9999bb', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <FiArrowLeft size={14} /> Change Email
              </button>
            </form>
          )}

          {/* ── STEP 3: New Password ── */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666688' }} />
                  <input
                    type={showPwd ? 'text' : 'password'} className="form-input"
                    style={{ paddingLeft: 38, paddingRight: 38 }}
                    placeholder="Min 6 characters"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)} required
                  />
                  <div onClick={() => setShowPwd(!showPwd)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666688' }}>
                    {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </div>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <FiLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#666688' }} />
                  <input
                    type={showConfirm ? 'text' : 'password'} className="form-input"
                    style={{ paddingLeft: 38, paddingRight: 38 }}
                    placeholder="Re-enter password"
                    value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                  />
                  <div onClick={() => setShowConfirm(!showConfirm)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#666688' }}>
                    {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                  </div>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p style={{ color: '#e5335d', fontSize: 12, marginTop: 4 }}>Passwords do not match</p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p style={{ color: '#00c853', fontSize: 12, marginTop: 4 }}>✓ Passwords match</p>
                )}
              </div>
              <button type="submit" className="btn-primary" disabled={loading}
                style={{ width: '100%', padding: '12px', fontSize: 15, justifyContent: 'center' }}>
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#9999bb' }}>
            Remember your password?{' '}
            <Link to="/login" style={{ color: '#e5335d', fontWeight: 600, textDecoration: 'none' }}>Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;