import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setBookingDetails } from '../redux/slices/bookingSlice';
import { paymentAPI, bookingAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  FiSmartphone, FiCreditCard, FiGlobe,
  FiDollarSign, FiClock, FiCheck, FiZap, FiTag, FiX
} from 'react-icons/fi';
import moment from 'moment';

const PAYMENT_METHODS = [
  { id: 'stripe',      label: 'Stripe (Card / UPI / Wallets)',  icon: FiCreditCard, desc: 'Pay securely via Stripe',      recommended: true },
  { id: 'upi',         label: 'UPI (Google Pay, PhonePe)',       icon: FiSmartphone, desc: 'Pay using any UPI app' },
  { id: 'card',        label: 'Card (Visa, Mastercard, RuPay)', icon: FiCreditCard, desc: 'Debit or Credit Card' },
  { id: 'netbanking',  label: 'Net Banking',                     icon: FiGlobe,      desc: 'All major banks supported' },
  { id: 'wallets',     label: 'Wallets',                         icon: FiDollarSign, desc: 'Paytm, Amazon Pay & more' },
  { id: 'paylater',   label: 'Pay Later',                        icon: FiClock,      desc: 'Book now, pay later' },
];

// ── Read theme from localStorage ──────────────────────────────────────────────
const getTheme = () => { try { return localStorage.getItem('bms_theme') || 'dark'; } catch { return 'dark'; } };

const Payment = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { selectedShow, selectedSeats } = useSelector(state => state.booking);
  const { userInfo }                    = useSelector(state => state.auth);

  const [paymentMethod, setPaymentMethod] = useState('stripe');
  const [loading,        setLoading]       = useState(false);
  const [couponInput,    setCouponInput]   = useState('');
  const [couponApplied,  setCouponApplied] = useState(null);
  const [couponLoading,  setCouponLoading] = useState(false);
  // ✅ Theme state
  const [theme, setTheme] = useState(getTheme);

  // ✅ Poll localStorage every 200ms to sync with Navbar toggle
  useEffect(() => {
    const interval = setInterval(() => {
      const t = getTheme();
      setTheme(prev => prev !== t ? t : prev);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  if (!selectedShow || !selectedSeats.length) {
    navigate('/');
    return null;
  }

  const isDark = theme === 'dark';

  // ✅ Theme colors
  const c = {
    bg:         isDark ? '#0a0a0f'  : '#f5f5fa',
    cardBg:     isDark ? '#12121a'  : '#ffffff',
    border:     isDark ? '#2a2a3a'  : '#e8e8f0',
    text:       isDark ? '#ffffff'  : '#111111',
    sub:        isDark ? '#9999bb'  : '#666666',
    inputBg:    isDark ? '#1a1a26'  : '#f5f5fa',
    inputBd:    isDark ? '#2a2a3a'  : '#e0e0ec',
    rowHover:   isDark ? '#1a1a26'  : '#f8f8fc',
    methodBg:   isDark ? '#1a1a26'  : '#f5f5fa',
    infoBg:     isDark ? 'rgba(99,91,255,0.08)' : 'rgba(99,91,255,0.05)',
    infoBd:     isDark ? 'rgba(99,91,255,0.2)'  : 'rgba(99,91,255,0.15)',
    movieBg:    isDark ? '#1a1a26'  : '#f5f5fa',
    shadow:     isDark ? 'none'     : '0 2px 12px rgba(0,0,0,0.07)',
  };

  const price        = selectedShow.price || 500;
  const baseAmount   = selectedSeats.length * price;
  const convFee      = 48;
  const staticDisc   = 10;
  const couponDisc   = couponApplied?.discountAmount || 0;
  const total        = baseAmount + convFee - staticDisc - couponDisc;

  // ── Apply coupon ─────────────────────────────────────────────────────────────
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) { toast.error('Please enter a coupon code'); return; }
    try {
      setCouponLoading(true);
      const { data } = await axios.post(
        '/api/coupons/validate',
        { code: couponInput.trim(), orderAmount: baseAmount + convFee - staticDisc },
        { headers: { Authorization: `Bearer ${userInfo?.token}` } }
      );
      setCouponApplied({ code: data.coupon.code, discountAmount: data.discountAmount });
      toast.success(`🏷️ Coupon applied! You saved ₹${data.discountAmount}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon code');
      setCouponApplied(null);
    } finally { setCouponLoading(false); }
  };

  const handleRemoveCoupon = () => { setCouponApplied(null); setCouponInput(''); toast.info('Coupon removed'); };

  // ── Stripe ───────────────────────────────────────────────────────────────────
  const handleStripePayment = async () => {
    try {
      setLoading(true);
      const { data } = await paymentAPI.createStripeSession({
        showId: selectedShow._id, seats: selectedSeats, amount: total,
        movieTitle: selectedShow.movie?.title,
        customerEmail: userInfo?.email, customerName: userInfo?.name,
        couponCode: couponApplied?.code || null, couponDiscount: couponDisc,
      });
      if (data.url) { window.location.href = data.url; }
      else { toast.error('Failed to initiate Stripe payment'); setLoading(false); }
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to initiate payment'); setLoading(false); }
  };

  // ── Simulated ────────────────────────────────────────────────────────────────
  const handleSimulatedPayment = async () => {
    try {
      setLoading(true);
      const { data } = await bookingAPI.create({
        showId: selectedShow._id, seats: selectedSeats, totalAmount: total,
        paymentMethod, couponCode: couponApplied?.code || null, couponDiscount: couponDisc,
      });
      dispatch(setBookingDetails(data));
      toast.success('Booking Confirmed! 🎉');
      navigate(`/booking-confirmation/${data._id}`);
    } catch (err) { toast.error(err.response?.data?.message || 'Payment failed. Try again.'); }
    finally { setLoading(false); }
  };

  const handlePay = () => {
    if (paymentMethod === 'stripe') handleStripePayment();
    else handleSimulatedPayment();
  };

  return (
    <div style={{ minHeight: '100vh', background: c.bg, transition: 'background 0.3s' }}>
      <Navbar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 28, color: c.text }}>
          💳 Payment
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* ── Payment Methods ── */}
          <div>
            <div style={{
              background: c.cardBg, border: `1px solid ${c.border}`,
              borderRadius: 14, overflow: 'hidden',
              boxShadow: c.shadow, transition: 'background 0.3s',
            }}>
              <div style={{
                padding: '16px 20px', borderBottom: `1px solid ${c.border}`,
                fontSize: 14, fontWeight: 700, color: c.text,
              }}>
                Select Payment Method
              </div>

              {PAYMENT_METHODS.map(method => (
                <div
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
                    cursor: 'pointer', borderBottom: `1px solid ${c.border}`, transition: 'background 0.15s',
                    background: paymentMethod === method.id
                      ? (isDark ? 'rgba(99,91,255,0.06)' : 'rgba(99,91,255,0.04)')
                      : 'transparent',
                  }}
                  onMouseEnter={e => { if (paymentMethod !== method.id) e.currentTarget.style.background = c.rowHover; }}
                  onMouseLeave={e => { if (paymentMethod !== method.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 42, height: 42, borderRadius: 10, flexShrink: 0,
                    background: paymentMethod === method.id
                      ? 'rgba(99,91,255,0.12)'
                      : c.methodBg,
                    border: `1.5px solid ${paymentMethod === method.id ? '#635BFF' : c.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: paymentMethod === method.id ? '#635BFF' : c.sub,
                  }}>
                    <method.icon size={18} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: c.text, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {method.label}
                      {method.recommended && (
                        <span style={{
                          background: 'rgba(99,91,255,0.12)', color: '#635BFF',
                          fontSize: 10, fontWeight: 700, padding: '2px 8px',
                          borderRadius: 10, border: '1px solid rgba(99,91,255,0.25)',
                        }}>RECOMMENDED</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: c.sub }}>{method.desc}</div>
                  </div>

                  {paymentMethod === method.id && (
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: '#635BFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <FiCheck size={12} color="#fff" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {paymentMethod === 'stripe' && (
              <div style={{
                marginTop: 12, padding: '12px 16px',
                background: c.infoBg, border: `1px solid ${c.infoBd}`,
                borderRadius: 8, fontSize: 12, color: c.sub,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <FiZap size={14} color="#635BFF" />
                <span>Stripe securely handles your payment. Supports Cards, UPI, Net Banking & Wallets.</span>
              </div>
            )}
          </div>

          {/* ── Order Summary ── */}
          <div style={{
            background: c.cardBg, border: `1px solid ${c.border}`,
            borderRadius: 14, padding: 20,
            boxShadow: c.shadow, transition: 'background 0.3s',
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: c.text }}>Order Summary</h3>

            {/* Movie info card */}
            <div style={{
              display: 'flex', gap: 12, marginBottom: 20,
              padding: 14, background: c.movieBg,
              borderRadius: 10, border: `1px solid ${c.border}`,
            }}>
              <img
                src={selectedShow.movie?.poster || 'https://via.placeholder.com/60x80/1a1a26/e5335d?text=M'}
                alt="movie"
                style={{ width: 55, height: 75, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: c.text }}>{selectedShow.movie?.title}</div>
                <div style={{ color: c.sub, fontSize: 12, marginTop: 4 }}>
                  {moment(selectedShow.date).format('DD MMM')} &bull; {selectedShow.time}
                </div>
                <div style={{ color: c.sub, fontSize: 12 }}>{selectedShow.theatre?.name}</div>
                <div style={{ color: '#e5335d', fontSize: 12, fontWeight: 600, marginTop: 4 }}>
                  Seats: {selectedSeats.join(', ')}
                </div>
              </div>
            </div>

            {/* ── Coupon Input ── */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: c.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiTag size={13} color="#e5335d" /> Have a coupon?
              </div>

              {couponApplied ? (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', background: 'rgba(0,200,83,0.08)',
                  border: '1px solid rgba(0,200,83,0.3)', borderRadius: 8,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiTag size={14} color="#00c853" />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#00c853' }}>{couponApplied.code}</div>
                      <div style={{ fontSize: 11, color: c.sub }}>Saved ₹{couponApplied.discountAmount}</div>
                    </div>
                  </div>
                  <button onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.sub, padding: 4 }}>
                    <FiX size={16} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                    placeholder="Enter coupon code"
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: 8,
                      background: c.inputBg, border: `1px solid ${c.inputBd}`,
                      color: c.text, fontSize: 13, outline: 'none',
                      fontFamily: 'monospace', letterSpacing: 1,
                    }}
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={couponLoading}
                    style={{
                      padding: '9px 14px', borderRadius: 8,
                      border: '1px solid #e5335d',
                      background: 'rgba(229,51,93,0.1)', color: '#e5335d',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {couponLoading ? '...' : 'Apply'}
                  </button>
                </div>
              )}
            </div>

            {/* ── Price Breakdown ── */}
            {[
              { label: `${selectedSeats.length} Ticket(s) × ₹${price}`, value: `₹${baseAmount}` },
              { label: 'Convenience Fee',                                 value: `₹${convFee}` },
              { label: 'Discount',                                        value: `-₹${staticDisc}`, color: '#00c853' },
              ...(couponApplied ? [{ label: `Coupon (${couponApplied.code})`, value: `-₹${couponDisc}`, color: '#00c853' }] : []),
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 13 }}>
                <span style={{ color: c.sub }}>{label}</span>
                <span style={{ color: color || c.text, fontWeight: 600 }}>{value}</span>
              </div>
            ))}

            <div style={{
              borderTop: `1px solid ${c.border}`, paddingTop: 14, marginTop: 8,
              display: 'flex', justifyContent: 'space-between', fontSize: 16,
            }}>
              <span style={{ fontWeight: 700, color: c.text }}>Total Amount</span>
              <span style={{ fontWeight: 800, color: '#635BFF' }}>₹{total}</span>
            </div>

            {/* ── Pay Button ── */}
            <button
              className="btn-primary"
              onClick={handlePay}
              disabled={loading}
              style={{
                width: '100%', marginTop: 20, padding: '14px', fontSize: 16,
                justifyContent: 'center',
                background: paymentMethod === 'stripe' ? '#635BFF' : undefined,
                borderColor: paymentMethod === 'stripe' ? '#635BFF' : undefined,
              }}
            >
              {loading
                ? 'Processing...'
                : paymentMethod === 'stripe'
                  ? `Pay ₹${total} via Stripe`
                  : `Pay ₹${total}`}
            </button>

            <p style={{ textAlign: 'center', fontSize: 11, color: c.sub, marginTop: 10 }}>
              🔒 Secured by 256-bit SSL encryption
            </p>

            {paymentMethod === 'stripe' && (
              <div style={{ textAlign: 'center', marginTop: 6 }}>
                <img
                  src="https://cdn.brandfetch.io/idxAg10C0L/theme/dark/logo.svg"
                  alt="Powered by Stripe"
                  style={{ height: 20, opacity: 0.6 }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;