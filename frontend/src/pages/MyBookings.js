import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import generateTicketPDF from '../utils/generateTicketPDF';
import './MyBookings.css';

// ── Helper: get token from localStorage ──────────────────────────────────────
const getToken = () => {
  try {
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    if (userInfo.token) return userInfo.token;
  } catch {}
  return localStorage.getItem('token') || '';
};

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [emailSending, setEmailSending] = useState({});

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = getToken();
        const { data } = await axios.get('/api/bookings/my', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBookings(data.bookings || []);
      } catch {
        toast.error('Failed to load bookings.');
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const handleDownload = (booking) => {
    try {
      generateTicketPDF(booking);
      toast.success('🎟️ Ticket downloaded!');
    } catch {
      toast.error('PDF generation failed.');
    }
  };

  const handleResendEmail = async (bookingId) => {
    setEmailSending((prev) => ({ ...prev, [bookingId]: true }));
    try {
      const token = getToken();
      const { data } = await axios.post(
        `/api/bookings/${bookingId}/resend-email`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(data.message || '📧 Ticket email resent!');
    } catch {
      toast.error('Failed to resend email.');
    } finally {
      setEmailSending((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="bookings-loading">
        <div className="spinner" />
        <p>Loading your bookings...</p>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="bookings-empty">
        <div className="empty-icon">🎬</div>
        <h2>No bookings yet</h2>
        <p>Your booked tickets will appear here.</p>
        <Link to="/" className="browse-btn">Browse Movies</Link>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <div className="bookings-header">
        <h1>My Bookings</h1>
        <span className="bookings-count">{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="bookings-list">
        {bookings.map((booking) => {
          const { _id, show, seats, totalAmount, status, paymentMethod } = booking;

          // ── Get movie & theatre through show (correct schema path) ──
          const movie    = show?.movie;
          const theatre  = show?.theatre;

          const theatreName = theatre?.name || 'N/A';
          const theatreCity = theatre?.city || '';
          const showDate = show?.date
            ? new Date(show.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'N/A';

          return (
            <div key={_id} className={`booking-card ${status === 'Cancelled' ? 'cancelled' : ''}`}>
              {/* Movie poster + title */}
              <div className="booking-card-top">
                {movie?.poster && (
                  <img src={movie.poster} alt={movie?.title} className="booking-poster" />
                )}
                <div className="booking-movie-info">
                  <h3 className="booking-movie-title">{movie?.title || 'Movie'}</h3>
                  <div className="booking-tags">
                    {movie?.genre?.slice(0, 2).map(g => (
                      <span key={g} className="tag">{g}</span>
                    ))}
                    {show?.format && <span className="tag format">{show.format}</span>}
                  </div>
                  <p className="booking-id-small">ID: {_id}</p>
                </div>
                <div className={`status-badge ${status?.toLowerCase()}`}>{status}</div>
              </div>

              {/* Details */}
              <div className="booking-details-grid">
                <div>
                  <span className="det-label">Theatre</span>
                  <span className="det-value">{theatreName}, {theatreCity}</span>
                </div>
                <div>
                  <span className="det-label">Date & Time</span>
                  <span className="det-value">{showDate} | {show?.time || 'N/A'}</span>
                </div>
                <div>
                  <span className="det-label">Seats</span>
                  <span className="det-value seats-inline">
                    {(Array.isArray(seats) ? seats : [seats]).map(s => (
                      <span key={s} className="mini-seat">{s}</span>
                    ))}
                  </span>
                </div>
                <div>
                  <span className="det-label">Amount</span>
                  <span className="det-value amount-red">₹{totalAmount}</span>
                </div>
              </div>

              {/* Actions */}
              {status !== 'Cancelled' && (
                <div className="booking-actions">
                  <button className="action-btn download" onClick={() => handleDownload(booking)}>
                    ⬇️ Download Ticket
                  </button>
                  <button
                    className="action-btn email"
                    onClick={() => handleResendEmail(_id)}
                    disabled={emailSending[_id]}
                  >
                    {emailSending[_id] ? '⏳ Sending...' : '📧 Resend Email'}
                  </button>
                  <Link to={`/booking-confirmation/${_id}`} className="action-btn view">
                    👁 View Details
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyBookings;