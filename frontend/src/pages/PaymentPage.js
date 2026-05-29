import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './PaymentPage.css'; // keep your existing styles

// Load Razorpay script
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Expect these from navigation state (set in SeatSelection)
  const {
    showId,
    selectedSeats = [],
    ticketPrice = 0,
    convenienceFee = 0,
    discount = 0,
    totalAmount = 0,
    movieTitle,
    showDate,
    showTime,
    theatreName,
    format,
    language,
  } = location.state || {};

  const [selectedMethod, setSelectedMethod] = useState('razorpay');
  const [processing, setProcessing] = useState(false);

  // Redirect if accessed directly without state
  useEffect(() => {
    if (!showId || selectedSeats.length === 0) {
      toast.error('Invalid payment session. Please select seats again.');
      navigate('/');
    }
  }, [showId, selectedSeats, navigate]);

  // ── Create booking record after successful payment ──────────────────────
  const createBooking = async (paymentId, paymentMethod) => {
    const token = localStorage.getItem('token');
    const { data } = await axios.post(
      '/api/bookings',
      {
        showId,
        seats: selectedSeats,
        totalAmount,
        paymentId,
        paymentMethod,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.booking;
  };

  // ── Razorpay payment ────────────────────────────────────────────────────
  const handleRazorpayPayment = async () => {
    setProcessing(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error('Failed to load Razorpay. Check your internet connection.');
        setProcessing(false);
        return;
      }

      const token = localStorage.getItem('token');

      // 1. Create Razorpay order on backend
      const { data: orderData } = await axios.post(
        '/api/payment/razorpay/create-order',
        { amount: totalAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2. Open Razorpay checkout
      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: orderData.amount,           // in paise
        currency: 'INR',
        name: 'BookMyShow',
        description: `${movieTitle} - ${selectedSeats.join(', ')}`,
        order_id: orderData.id,
        handler: async (response) => {
          try {
            // 3. Verify on backend
            await axios.post(
              '/api/payment/razorpay/verify',
              {
                razorpay_order_id:   response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            // 4. Create booking (triggers email)
            const booking = await createBooking(response.razorpay_payment_id, 'Razorpay');
            toast.success('🎉 Booking confirmed! Ticket sent to your email.');
            navigate(`/booking-confirmation/${booking._id}`);
          } catch (err) {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: {
          name:  localStorage.getItem('userName')  || '',
          email: localStorage.getItem('userEmail') || '',
        },
        theme: { color: '#cc0000' },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            toast.info('Payment cancelled.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Payment initiation failed.');
      setProcessing(false);
    }
  };

  const handlePay = () => {
    if (selectedMethod === 'razorpay') handleRazorpayPayment();
    // Add other methods if needed
  };

  const paymentMethods = [
    { id: 'razorpay',    icon: '⚡', label: 'Razorpay (UPI / Card / Net Banking)', sub: 'Pay securely via Razorpay gateway', recommended: true },
    { id: 'upi',         icon: '📱', label: 'UPI (Google Pay, PhonePe)',            sub: 'Pay using any UPI app' },
    { id: 'card',        icon: '💳', label: 'Card (Visa, Mastercard, RuPay)',       sub: 'Debit or Credit Card' },
    { id: 'netbanking',  icon: '🌐', label: 'Net Banking',                          sub: 'All major banks supported' },
    { id: 'wallet',      icon: '💵', label: 'Wallets',                              sub: 'Paytm, Amazon Pay & more' },
    { id: 'paylater',    icon: '🕐', label: 'Pay Later',                            sub: 'EMI & BNPL options' },
  ];

  return (
    <div className="payment-page">
      <div className="payment-header">
        <span className="payment-header-icon">💳</span>
        <h1>Payment</h1>
      </div>

      <div className="payment-layout">
        {/* ── Left: Method Selection ────────────────────────────────────── */}
        <div className="payment-methods-panel">
          <h3>Select Payment Method</h3>

          {paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`method-item ${selectedMethod === method.id ? 'selected' : ''}`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className="method-icon">{method.icon}</div>
              <div className="method-text">
                <div className="method-label">
                  {method.label}
                  {method.recommended && (
                    <span className="recommended-badge">RECOMMENDED</span>
                  )}
                </div>
                <div className="method-sub">{method.sub}</div>
              </div>
              <div className={`method-radio ${selectedMethod === method.id ? 'active' : ''}`} />
            </div>
          ))}
        </div>

        {/* ── Right: Order Summary ──────────────────────────────────────── */}
        <div className="order-summary-panel">
          <h3>Order Summary</h3>

          <div className="summary-movie-card">
            <div className="summary-movie-info">
              <div className="summary-movie-title">{movieTitle || 'Movie'}</div>
              <div className="summary-meta">
                {showDate && <span>{showDate}</span>}
                {showTime && <span>• {showTime}</span>}
              </div>
              {theatreName && <div className="summary-meta">{theatreName}</div>}
              {selectedSeats.length > 0 && (
                <div className="summary-seats">
                  Seats: <strong>{selectedSeats.join(', ')}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Breakdown */}
          <div className="summary-breakdown">
            <div className="breakdown-row">
              <span>{selectedSeats.length} Ticket(s) × ₹{ticketPrice}</span>
              <span>₹{ticketPrice * selectedSeats.length}</span>
            </div>
            {convenienceFee > 0 && (
              <div className="breakdown-row">
                <span>Convenience Fee</span>
                <span>₹{convenienceFee}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="breakdown-row discount">
                <span>Discount</span>
                <span>-₹{discount}</span>
              </div>
            )}
          </div>

          <div className="summary-total">
            <span>Total Amount</span>
            <span className="total-amount">₹{totalAmount}</span>
          </div>

          <button
            className="pay-btn"
            onClick={handlePay}
            disabled={processing}
          >
            {processing ? (
              <span className="btn-spinner" />
            ) : (
              `Pay ₹${totalAmount} via Razorpay`
            )}
          </button>

          <p className="secure-note">🔒 Secured by 256-bit SSL encryption</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;