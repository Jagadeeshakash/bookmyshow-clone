import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import generateTicketPDF from '../utils/generateTicketPDF';
import './BookingConfirmation.css';

// ── Helper: get token from localStorage (works with both storage formats) ──
const getToken = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.token) return userInfo.token;
  } catch {}
  return localStorage.getItem('token') || '';
};

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailSending, setEmailSending] = useState(false);

  // ── Fetch booking ────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const token = getToken();
        const { data } = await axios.get(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBooking(data.booking);
      } catch (err) {
        toast.error('Could not load booking details.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    if (bookingId) fetchBooking();
  }, [bookingId, navigate]);

  // ── Download PDF ─────────────────────────────────────────────────────────
  const handleDownloadPDF = () => {
    if (!booking) return;
    try {
      generateTicketPDF(booking);
      toast.success('🎟️ Ticket PDF downloaded!');
    } catch (err) {
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  // ── Resend Email ──────────────────────────────────────────────────────────
  const handleResendEmail = async () => {
    setEmailSending(true);
    try {
      const token = getToken();
      await axios.post(
        `/api/bookings/${bookingId}/resend-email`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`📧 Ticket resent to ${booking?.user?.email}!`);
    } catch (err) {
      toast.error('Failed to resend email. Please try again.');
    } finally {
      setEmailSending(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="confirmation-loading">
        <div className="spinner" />
        <p>Loading your ticket...</p>
      </div>
    );
  }

  if (!booking) return null;

  const { movie, show, theatre, seats, totalAmount, paymentId, paymentMethod, bookingDate, user } = booking;
  const seatsDisplay = Array.isArray(seats) ? seats.join(', ') : seats;
  const showDate = show?.date
    ? new Date(show.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    : 'N/A';
  const theatreName = theatre?.name  || show?.theatre?.name  || 'N/A';
  const theatreCity = theatre?.city  || show?.theatre?.city  || '';
  const theatreLoc  = theatre?.location || show?.theatre?.location || '';

  return (
    <div className="confirmation-page">
      {/* ── Success Banner ────────────────────────────────────────────────── */}
      <div className="confirmation-banner">
        <div className="banner-icon">🎉</div>
        <h1>Booking Confirmed!</h1>
        <p>Your ticket has been confirmed and a confirmation email has been sent.</p>
      </div>

      <div className="confirmation-content">
        {/* ── Ticket Card ──────────────────────────────────────────────────── */}
        <div className="ticket-card">
          {/* Ticket top: movie info */}
          <div className="ticket-top">
            {movie?.poster && (
              <img src={movie.poster} alt={movie.title} className="ticket-poster" />
            )}
            <div className="ticket-movie-info">
              <span className="confirmed-badge">✅ Confirmed</span>
              <h2 className="ticket-movie-title">{movie?.title}</h2>
              <div className="ticket-meta">
                {movie?.genre?.slice(0, 2).map(g => (
                  <span key={g} className="meta-tag">{g}</span>
                ))}
                {show?.format && <span className="meta-tag format">{show.format}</span>}
                {show?.language && <span className="meta-tag">{show.language}</span>}
              </div>
              <p className="booking-id-text">Booking ID: <strong>{booking._id}</strong></p>
            </div>
          </div>

          {/* Divider with circles */}
          <div className="ticket-divider">
            <div className="circle left" />
            <div className="dashed-line" />
            <div className="circle right" />
          </div>

          {/* Ticket bottom: show details */}
          <div className="ticket-bottom">
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Theatre</span>
                <span className="detail-value">{theatreName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Location</span>
                <span className="detail-value">{theatreLoc}, {theatreCity}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date</span>
                <span className="detail-value">{showDate}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Time</span>
                <span className="detail-value">{show?.time || 'N/A'}</span>
              </div>
            </div>

            {/* Seats */}
            <div className="seats-section">
              <span className="detail-label">Your Seats</span>
              <div className="seat-tags">
                {(Array.isArray(seats) ? seats : [seats]).map((s) => (
                  <span key={s} className="seat-tag">{s}</span>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div className="amount-row">
              <div className="amount-box">
                <span className="amount-label">Amount Paid</span>
                <span className="amount-value">₹{totalAmount}</span>
              </div>
              <div className="payment-info">
                <span className="detail-label">Payment Method</span>
                <span className="detail-value">{paymentMethod || 'Razorpay'}</span>
                {paymentId && (
                  <>
                    <span className="detail-label" style={{ marginTop: 6 }}>Payment ID</span>
                    <span className="detail-value small">{paymentId}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Email Notice ─────────────────────────────────────────────────── */}
        <div className="email-notice">
          <span className="email-icon">📧</span>
          <div>
            <strong>Ticket sent to your email!</strong>
            <p>A confirmation email has been sent to <em>{user?.email}</em></p>
          </div>
        </div>

        {/* ── Action Buttons ───────────────────────────────────────────────── */}
        <div className="action-buttons">
          <button className="btn-primary btn-download" onClick={handleDownloadPDF}>
            <span className="btn-icon">⬇️</span>
            Download PDF Ticket
          </button>

          <button
            className="btn-secondary btn-email"
            onClick={handleResendEmail}
            disabled={emailSending}
          >
            <span className="btn-icon">📧</span>
            {emailSending ? 'Sending...' : 'Resend Email'}
          </button>

          <Link to="/my-bookings" className="btn-outline">
            View All Bookings
          </Link>

          <Link to="/" className="btn-ghost">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;