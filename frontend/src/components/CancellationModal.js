import React, { useState, useEffect } from 'react';
import axios from 'axios';

// ─── Cancellation Policy Modal ────────────────────────────────────────────────
export function CancellationPolicyModal({ onClose }) {
  const [policy, setPolicy] = useState([]);

  useEffect(() => {
    axios.get('/api/cancellation/policy').then(r => setPolicy(r.data.policy));
  }, []);

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>Cancellation Policy</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p style={styles.policyNote}>
          Refund amount depends on how early you cancel before the show.
        </p>
        <div style={styles.policyTable}>
          {policy.map((row, i) => (
            <div key={i} style={{ ...styles.policyRow, background: i % 2 === 0 ? '#1a1a2e' : '#16213e' }}>
              <div style={styles.policyTime}>{row.timeframe}</div>
              <div style={{ ...styles.policyRefund, color: getRefundColor(row.refund) }}>
                {row.refund}
                <span style={styles.policyLabel}>{row.label}</span>
              </div>
            </div>
          ))}
        </div>
        <p style={styles.policyFootnote}>
          * Refunds are credited to your original payment method within 5-7 business days.
        </p>
      </div>
    </div>
  );
}

// ─── Cancel Booking Flow ──────────────────────────────────────────────────────
export function CancelBookingModal({ bookingId, onClose, onSuccess }) {
  const [step, setStep] = useState('check'); // check | confirm | done
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState(null);
  const [reason, setReason] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const CANCEL_REASONS = [
    'Change of plans',
    'Wrong show selected',
    'Emergency / personal reason',
    'Duplicate booking',
    'Other',
  ];

  useEffect(() => {
    setLoading(true);
    axios.get(`/api/cancellation/check/${bookingId}`)
      .then(r => { setInfo(r.data); setLoading(false); })
      .catch(e => { setError(e.response?.data?.message || 'Failed to load booking'); setLoading(false); });
  }, [bookingId]);

  const handleCancel = async () => {
    if (!reason) { setError('Please select a cancellation reason.'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post(`/api/cancellation/cancel/${bookingId}`, { reason });
      setResult(data);
      setStep('done');
      if (onSuccess) onSuccess(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Cancellation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {step === 'done' ? '✅ Booking Cancelled' : '🎟 Cancel Booking'}
          </h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={{ color: '#aaa', marginTop: 12 }}>
              {step === 'check' ? 'Checking eligibility...' : 'Processing cancellation...'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={styles.errorBox}>{error}</div>
        )}

        {/* Step 1: Show refund info */}
        {!loading && step === 'check' && info && (
          <>
            <div style={styles.bookingCard}>
              <div style={styles.bookingRow}>
                <span style={styles.bookingLabel}>Movie</span>
                <span style={styles.bookingValue}>{info.movie}</span>
              </div>
              <div style={styles.bookingRow}>
                <span style={styles.bookingLabel}>Theatre</span>
                <span style={styles.bookingValue}>{info.theatre}</span>
              </div>
              <div style={styles.bookingRow}>
                <span style={styles.bookingLabel}>Date & Time</span>
                <span style={styles.bookingValue}>
                  {new Date(info.showDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} &bull; {info.showTime}
                </span>
              </div>
              <div style={styles.bookingRow}>
                <span style={styles.bookingLabel}>Seats</span>
                <span style={styles.bookingValue}>{info.seats?.join(', ')}</span>
              </div>
              <div style={styles.divider} />
              <div style={styles.bookingRow}>
                <span style={styles.bookingLabel}>Amount Paid</span>
                <span style={styles.bookingValue}>₹{info.totalPaid}</span>
              </div>
              <div style={styles.bookingRow}>
                <span style={styles.bookingLabel}>Refund Policy</span>
                <span style={{ ...styles.bookingValue, color: getRefundColor(info.refundPercent + '%') }}>
                  {info.refundLabel}
                </span>
              </div>
              <div style={{ ...styles.refundBox, borderColor: getRefundColor(info.refundPercent + '%') }}>
                <div style={styles.refundRow}>
                  <span style={styles.refundLabel}>You will receive</span>
                  <span style={{ ...styles.refundAmount, color: getRefundColor(info.refundPercent + '%') }}>
                    ₹{info.refundAmount}
                  </span>
                </div>
                {info.nonRefundable > 0 && (
                  <div style={styles.refundRow}>
                    <span style={{ ...styles.refundLabel, color: '#ff6b6b' }}>Non-refundable</span>
                    <span style={{ color: '#ff6b6b', fontWeight: 600 }}>₹{info.nonRefundable}</span>
                  </div>
                )}
              </div>
            </div>

            <button style={styles.proceedBtn} onClick={() => setStep('confirm')}>
              Proceed to Cancel
            </button>
          </>
        )}

        {/* Step 2: Confirm with reason */}
        {!loading && step === 'confirm' && info && (
          <>
            <div style={styles.confirmSummary}>
              <span style={styles.confirmLabel}>Refund you'll get:</span>
              <span style={{ ...styles.confirmAmount, color: getRefundColor(info.refundPercent + '%') }}>
                ₹{info.refundAmount} ({info.refundPercent}%)
              </span>
            </div>

            <p style={styles.reasonLabel}>Why are you cancelling?</p>
            <div style={styles.reasonGrid}>
              {CANCEL_REASONS.map(r => (
                <button
                  key={r}
                  style={{ ...styles.reasonBtn, ...(reason === r ? styles.reasonBtnActive : {}) }}
                  onClick={() => setReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            {error && <div style={styles.errorBox}>{error}</div>}

            <div style={styles.btnRow}>
              <button style={styles.backBtn} onClick={() => setStep('check')}>← Back</button>
              <button style={styles.cancelBtn} onClick={handleCancel} disabled={loading}>
                {loading ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </>
        )}

        {/* Step 3: Done */}
        {step === 'done' && result && (
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✓</div>
            <p style={styles.successMsg}>{result.message}</p>
            <div style={styles.refundDetails}>
              <div style={styles.refundDetailRow}>
                <span>Refund Amount</span>
                <span style={{ color: '#4ade80', fontWeight: 700 }}>₹{result.refundAmount}</span>
              </div>
              <div style={styles.refundDetailRow}>
                <span>Status</span>
                <span style={styles.statusBadge}>
                  {result.refundStatus === 'processed' ? '✅ Processed' :
                   result.refundStatus === 'pending' ? '⏳ Pending' : 'N/A'}
                </span>
              </div>
              {result.refundStatus !== 'not_applicable' && (
                <p style={styles.refundNote}>
                  Refund will be credited to your original payment method within 5-7 business days.
                </p>
              )}
            </div>
            <button style={styles.doneBtn} onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Cancellation History Table (for Admin Dashboard) ───────────────────────
export function CancellationHistory() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/cancellation/history')
      .then(r => { setRecords(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ color: '#aaa', padding: 20 }}>Loading cancellation history...</div>;

  return (
    <div style={styles.historyContainer}>
      <h3 style={styles.historyTitle}>Cancellation & Refund History</h3>
      {records.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center', padding: 32 }}>No cancellations yet.</p>
      ) : (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span>Booking ID</span>
            <span>Movie</span>
            <span>Seats</span>
            <span>Paid</span>
            <span>Refund</span>
            <span>Status</span>
            <span>Cancelled On</span>
          </div>
          {records.map(b => (
            <div key={b._id} style={styles.tableRow}>
              <span style={{ color: '#888', fontSize: 12 }}>{b._id.slice(-8)}</span>
              <span>{b.show?.movie?.title || '—'}</span>
              <span>{b.seats?.join(', ')}</span>
              <span>₹{b.totalAmount}</span>
              <span style={{ color: '#4ade80' }}>₹{b.refundAmount ?? 0}</span>
              <span>
                <span style={{
                  ...styles.statusPill,
                  background: b.refundStatus === 'processed' ? '#14532d' :
                               b.refundStatus === 'pending' ? '#713f12' : '#1e1e2e',
                  color: b.refundStatus === 'processed' ? '#4ade80' :
                         b.refundStatus === 'pending' ? '#fbbf24' : '#888',
                }}>
                  {b.refundStatus || 'N/A'}
                </span>
              </span>
              <span style={{ color: '#aaa', fontSize: 12 }}>
                {b.cancelledAt ? new Date(b.cancelledAt).toLocaleDateString('en-IN') : '—'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function getRefundColor(pct) {
  const num = parseInt(pct);
  if (num >= 100) return '#4ade80';
  if (num >= 75)  return '#86efac';
  if (num >= 50)  return '#fbbf24';
  if (num >= 25)  return '#fb923c';
  return '#f87171';
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#0f0f1a', border: '1px solid #2a2a3e', borderRadius: 16,
    width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
    padding: 28, position: 'relative', fontFamily: "'Segoe UI', sans-serif",
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 700, margin: 0 },
  closeBtn: {
    background: 'none', border: 'none', color: '#888', cursor: 'pointer',
    fontSize: 18, padding: '4px 8px', borderRadius: 6,
  },
  policyNote: { color: '#aaa', fontSize: 14, marginBottom: 16 },
  policyTable: { borderRadius: 10, overflow: 'hidden', border: '1px solid #2a2a3e' },
  policyRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px', borderBottom: '1px solid #2a2a3e',
  },
  policyTime: { color: '#ccc', fontSize: 13 },
  policyRefund: { fontSize: 14, fontWeight: 700, textAlign: 'right' },
  policyLabel: { display: 'block', fontSize: 11, color: '#888', fontWeight: 400 },
  policyFootnote: { color: '#666', fontSize: 12, marginTop: 12, fontStyle: 'italic' },

  bookingCard: {
    background: '#1a1a2e', borderRadius: 12, padding: 20, marginBottom: 20,
  },
  bookingRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 10,
  },
  bookingLabel: { color: '#888', fontSize: 13, flexShrink: 0, marginRight: 12 },
  bookingValue: { color: '#eee', fontSize: 13, fontWeight: 500, textAlign: 'right' },
  divider: { borderTop: '1px solid #2a2a3e', margin: '12px 0' },

  refundBox: {
    marginTop: 16, padding: '14px 16px', borderRadius: 10,
    border: '1px solid', background: 'rgba(255,255,255,0.03)',
  },
  refundRow: { display: 'flex', justifyContent: 'space-between', marginBottom: 6 },
  refundLabel: { color: '#aaa', fontSize: 14 },
  refundAmount: { fontSize: 22, fontWeight: 800 },

  proceedBtn: {
    width: '100%', padding: '14px 0', background: '#e50914', color: '#fff',
    border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 15,
    cursor: 'pointer', letterSpacing: 0.5,
  },

  confirmSummary: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    background: '#1a1a2e', borderRadius: 10, padding: '14px 20px', marginBottom: 20,
  },
  confirmLabel: { color: '#aaa', fontSize: 14 },
  confirmAmount: { fontSize: 20, fontWeight: 800 },

  reasonLabel: { color: '#ccc', fontSize: 14, marginBottom: 10 },
  reasonGrid: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  reasonBtn: {
    background: '#1a1a2e', border: '1px solid #333', color: '#ccc',
    borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13,
  },
  reasonBtnActive: {
    background: '#2a1a3e', borderColor: '#9b59b6', color: '#d6a8ff',
  },

  btnRow: { display: 'flex', gap: 12 },
  backBtn: {
    flex: 1, padding: '12px 0', background: '#1a1a2e', border: '1px solid #333',
    color: '#ccc', borderRadius: 10, cursor: 'pointer', fontSize: 14,
  },
  cancelBtn: {
    flex: 2, padding: '12px 0', background: '#e50914', border: 'none',
    color: '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700,
  },

  errorBox: {
    background: '#2d0000', border: '1px solid #f87171', borderRadius: 8,
    color: '#f87171', padding: '10px 14px', marginBottom: 16, fontSize: 13,
  },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40 },
  spinner: {
    width: 36, height: 36, border: '3px solid #333',
    borderTop: '3px solid #e50914', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },

  successBox: { textAlign: 'center', padding: '8px 0' },
  successIcon: {
    width: 60, height: 60, background: '#14532d', borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 28, color: '#4ade80', margin: '0 auto 16px',
  },
  successMsg: { color: '#eee', fontSize: 15, marginBottom: 20, lineHeight: 1.5 },
  refundDetails: {
    background: '#1a1a2e', borderRadius: 12, padding: 20, marginBottom: 20,
  },
  refundDetailRow: {
    display: 'flex', justifyContent: 'space-between', marginBottom: 10,
    color: '#ccc', fontSize: 14,
  },
  statusBadge: { fontWeight: 600 },
  refundNote: { color: '#888', fontSize: 12, marginTop: 12, lineHeight: 1.5 },
  doneBtn: {
    padding: '12px 48px', background: '#e50914', border: 'none',
    color: '#fff', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 15,
  },

  // Admin History Table
  historyContainer: { padding: 20 },
  historyTitle: { color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 20 },
  table: {
    background: '#0f0f1a', borderRadius: 12, border: '1px solid #2a2a3e', overflow: 'hidden',
  },
  tableHeader: {
    display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 0.8fr 0.8fr 1fr 1fr',
    background: '#1a1a2e', padding: '12px 16px',
    color: '#888', fontSize: 12, fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 0.8fr 0.8fr 1fr 1fr',
    padding: '12px 16px', borderTop: '1px solid #1a1a2e',
    color: '#ccc', fontSize: 13, alignItems: 'center',
  },
  statusPill: {
    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
  },
};

// inject spinner keyframe
const styleTag = document.createElement('style');
styleTag.innerHTML = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(styleTag);