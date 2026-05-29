// src/pages/StripeSuccess.jsx
// This page handles the redirect from Stripe after successful payment.
// Add this route in your App.js:
//   <Route path="/payment/stripe/success" element={<StripeSuccess />} />

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setBookingDetails } from '../redux/slices/bookingSlice';
import { paymentAPI } from '../utils/api';
import Navbar from '../components/Navbar';
import { FiCheck, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const StripeSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Verify payment and create booking
    paymentAPI.verifyStripeSession(sessionId)
      .then(({ data }) => {
        dispatch(setBookingDetails(data.booking));
        setBookingId(data.booking._id);
        setStatus('success');
        toast.success('🎉 Payment Successful! Booking Confirmed!');
      })
      .catch(err => {
        console.error(err);
        setStatus('error');
        toast.error(err.response?.data?.message || 'Payment verification failed');
      });
  }, [searchParams, dispatch, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f' }}>
      <Navbar />
      <div style={{ maxWidth: 480, margin: '80px auto', padding: 24, textAlign: 'center' }}>

        {status === 'loading' && (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              border: '3px solid #635BFF', borderTopColor: 'transparent',
              margin: '0 auto 24px', animation: 'spin 0.8s linear infinite',
            }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>Verifying Payment...</h2>
            <p style={{ color: '#9999bb', marginTop: 8 }}>Please wait while we confirm your payment with Stripe.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(0,200,83,0.15)', border: '3px solid #00c853',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', animation: 'pulse 2s infinite',
            }}>
              <FiCheck size={36} color="#00c853" strokeWidth={3} />
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#00c853' }}>Payment Successful!</h2>
            <p style={{ color: '#9999bb', marginTop: 8, marginBottom: 32 }}>
              Your booking is confirmed. Redirecting to your ticket...
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate(`/booking-confirmation/${bookingId}`)}
              style={{ padding: '14px 32px', fontSize: 15, justifyContent: 'center' }}
            >
              View Ticket
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(229,51,93,0.15)', border: '3px solid #e5335d',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
            }}>
              <FiAlertCircle size={36} color="#e5335d" />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#e5335d' }}>Payment Failed</h2>
            <p style={{ color: '#9999bb', marginTop: 8, marginBottom: 32 }}>
              Something went wrong. Please try again or contact support.
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate('/payment')}
              style={{ padding: '14px 32px', fontSize: 15, justifyContent: 'center' }}
            >
              Try Again
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(0,200,83,0.3)} 50%{box-shadow:0 0 0 12px rgba(0,200,83,0)} }
      `}</style>
    </div>
  );
};

export default StripeSuccess;