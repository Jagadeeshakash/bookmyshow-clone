import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiTag, FiPercent, FiGift } from 'react-icons/fi';
import moment from 'moment';

const EMPTY = {
  code: '', discountType: 'percentage', discountValue: '',
  maxDiscount: '', minOrderAmount: '',
  expiryDate: '', usageLimit: '', status: 'Active', description: '',
};

const AdminOffers = () => {
  const { darkMode } = useOutletContext();
  const { userInfo } = useSelector(s => s.auth);
  const token = userInfo?.token;

  const [coupons,   setCoupons]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);

  // ── Theme ──
  const t = {
    text:        darkMode ? '#f1f5f9'                : '#111111',
    sub:         darkMode ? '#94a3b8'                : '#555555',
    cardBg:      darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
    border:      darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
    rowHover:    darkMode ? 'rgba(229,51,93,0.06)'   : 'rgba(229,51,93,0.04)',
    rowBorder:   darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)',
    inputBg:     darkMode ? 'rgba(255,255,255,0.06)' : '#f5f5f8',
    inputBorder: darkMode ? 'rgba(255,255,255,0.1)'  : '#e0e0e0',
    statBg:      darkMode ? 'rgba(255,255,255,0.04)' : '#f8f9fc',
    modalBg:     darkMode ? '#12122a'                : '#ffffff',
    shadow:      darkMode ? '0 24px 60px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.12)',
  };

  const inputStyle = {
    width: '100%', background: t.inputBg,
    border: `1.5px solid ${t.inputBorder}`,
    borderRadius: 10, padding: '10px 14px',
    color: t.text, fontSize: 13,
    fontFamily: 'Outfit, sans-serif', outline: 'none',
  };

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/coupons', { headers: { Authorization: `Bearer ${token}` } });
      setCoupons(Array.isArray(data) ? data : data.coupons || []);
    } catch {
      // Demo fallback
      setCoupons([
        { _id: '1', code: 'SAVE20', discountType: 'percentage', discountValue: 15, maxDiscount: 300, minOrderAmount: 500, usageLimit: 100, usedCount: 42, status: 'Active',   expiryDate: '2026-06-30', description: 'Save 15% up to ₹300' },
        { _id: '2', code: 'SAVE15', discountType: 'percentage', discountValue: 10, maxDiscount: 100, minOrderAmount: 300, usageLimit: 200, usedCount: 89, status: 'Active',   expiryDate: '2026-07-15', description: 'Save 10% up to ₹100' },
        { _id: '3', code: 'FLAT50', discountType: 'flat',       discountValue: 50, maxDiscount: 50,  minOrderAmount: 200, usageLimit: 50,  usedCount: 50, status: 'Inactive', expiryDate: '2026-05-01', description: '₹50 flat off' },
      ]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, [token]);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setShowModal(true); };
  const openEdit = (c) => {
    setForm({ ...c, expiryDate: c.expiryDate?.split('T')[0] || '' });
    setEditing(c._id); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountValue) return toast.error('Code and discount value are required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        discountValue:   Number(form.discountValue),
        maxDiscount:     Number(form.maxDiscount)     || 0,
        minOrderAmount:  Number(form.minOrderAmount)  || 0,
        usageLimit:      Number(form.usageLimit)      || 100,
      };
      if (editing) {
        await axios.put(`/api/coupons/${editing}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Coupon updated');
      } else {
        await axios.post('/api/coupons', payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Coupon created');
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving coupon');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await axios.delete(`/api/coupons/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch { toast.error('Failed to delete'); }
  };

  const toggleStatus = async (coupon) => {
    try {
      const newStatus = coupon.status === 'Active' ? 'Inactive' : 'Active';
      await axios.put(`/api/coupons/${coupon._id}`, { ...coupon, status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Coupon ${newStatus === 'Active' ? 'activated' : 'deactivated'}`);
      fetchCoupons();
    } catch { toast.error('Failed to update status'); }
  };

  const active   = coupons.filter(c => c.status === 'Active').length;
  const inactive = coupons.filter(c => c.status !== 'Active').length;
  const totalUsed= coupons.reduce((a, c) => a + (c.usedCount || 0), 0);

  return (
    <div style={{ color: t.text }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#e5335d' }}>Offers & Coupons</h1>
          <p style={{ color: t.sub, fontSize: 13, marginTop: 4 }}>Manage discount codes and promotional offers</p>
        </div>
        <button onClick={openCreate} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, #e5335d, #be123c)',
          color: '#fff', border: 'none', borderRadius: 10,
          padding: '10px 20px', fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
          boxShadow: '0 4px 14px rgba(229,51,93,0.35)',
        }}>
          <FiPlus size={15} /> Create Coupon
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { icon: FiTag,     label: 'Total Coupons',   value: coupons.length, color: '#e5335d', bg: 'rgba(229,51,93,0.12)'  },
          { icon: FiPercent, label: 'Active Coupons',  value: active,         color: '#00c853', bg: 'rgba(0,200,83,0.12)'   },
          { icon: FiGift,    label: 'Times Used',       value: totalUsed,      color: '#7c3aed', bg: 'rgba(124,58,237,0.12)' },
        ].map(card => (
          <div key={card.label} style={{
            background: t.cardBg, border: `1px solid ${t.border}`,
            borderRadius: 14, padding: 20,
            display: 'flex', alignItems: 'center', gap: 16,
            boxShadow: darkMode ? '0 4px 20px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.07)',
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <card.icon size={22} color={card.color} />
            </div>
            <div>
              <div style={{ fontSize: 26, fontWeight: 800, color: t.text }}>{card.value}</div>
              <div style={{ fontSize: 12, color: t.sub, marginTop: 2 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Coupon List */}
      <div style={{
        background: t.cardBg, border: `1px solid ${t.border}`,
        borderRadius: 14, overflow: 'hidden',
        boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.07)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${t.border}` }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>All Coupons</span>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div style={{ width: 32, height: 32, border: '3px solid rgba(229,51,93,0.2)', borderTopColor: '#e5335d', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : coupons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎟️</div>
            <p style={{ color: t.sub, fontSize: 14 }}>No coupons yet. Create your first one!</p>
          </div>
        ) : (
          <div>
            {coupons.map(coupon => (
              <div key={coupon._id} style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr auto auto auto',
                alignItems: 'center', gap: 16,
                padding: '16px 20px',
                borderBottom: `1px solid ${t.rowBorder}`,
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Code */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: darkMode ? 'rgba(229,51,93,0.12)' : 'rgba(229,51,93,0.08)',
                  border: '1px solid rgba(229,51,93,0.25)',
                  borderRadius: 8, padding: '6px 14px',
                }}>
                  <FiTag size={13} color="#e5335d" />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#e5335d', fontFamily: 'monospace' }}>{coupon.code}</span>
                </div>

                {/* Details */}
                <div>
                  <div style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}% (max ₹${coupon.maxDiscount})`
                      : `₹${coupon.discountValue} flat off`}
                  </div>
                  <div style={{ fontSize: 11, color: t.sub, marginTop: 3 }}>
                    Min order: ₹{coupon.minOrderAmount || 0} •
                    Used: {coupon.usedCount || 0}/{coupon.usageLimit} •
                    Expires: {coupon.expiryDate ? moment(coupon.expiryDate).format('DD MMM YYYY') : 'No expiry'}
                  </div>
                </div>

                {/* Status badge */}
                <button
                  onClick={() => toggleStatus(coupon)}
                  style={{
                    background: coupon.status === 'Active' ? 'rgba(0,200,83,0.12)' : darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                    color: coupon.status === 'Active' ? '#00c853' : t.sub,
                    border: `1px solid ${coupon.status === 'Active' ? 'rgba(0,200,83,0.3)' : t.border}`,
                    borderRadius: 20, padding: '4px 14px', fontSize: 11,
                    fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                    transition: 'all 0.2s',
                  }}
                >
                  {coupon.status}
                </button>

                {/* Edit */}
                <button onClick={() => openEdit(coupon)} style={{
                  background: 'rgba(0,176,255,0.1)', border: '1px solid rgba(0,176,255,0.3)',
                  borderRadius: 8, padding: '6px 10px', color: '#00b0ff', cursor: 'pointer',
                }}><FiEdit2 size={13} /></button>

                {/* Delete */}
                <button onClick={() => handleDelete(coupon._id)} style={{
                  background: 'rgba(229,51,93,0.1)', border: '1px solid rgba(229,51,93,0.3)',
                  borderRadius: 8, padding: '6px 10px', color: '#e5335d', cursor: 'pointer',
                }}><FiTrash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: t.modalBg, borderRadius: 18, padding: 28,
            width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto',
            border: `1px solid ${t.border}`, boxShadow: t.shadow,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: t.text, margin: 0 }}>
                {editing ? 'Edit Coupon' : 'Create Coupon'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: t.sub, cursor: 'pointer' }}>
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.sub, marginBottom: 6 }}>
                  Coupon Code *
                </label>
                <input
                  type="text" placeholder="e.g. SAVE20" style={{ ...inputStyle, textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700, fontSize: 15 }}
                  value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.sub, marginBottom: 6 }}>Description</label>
                <input type="text" placeholder="Short description" style={inputStyle}
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.sub, marginBottom: 6 }}>Discount Type</label>
                  <select style={inputStyle} value={form.discountType} onChange={e => setForm({ ...form, discountType: e.target.value })}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat (₹)</option>
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.sub, marginBottom: 6 }}>
                    Discount Value {form.discountType === 'percentage' ? '(%)' : '(₹)'} *
                  </label>
                  <input type="number" placeholder={form.discountType === 'percentage' ? '15' : '50'} style={inputStyle}
                    value={form.discountValue} onChange={e => setForm({ ...form, discountValue: e.target.value })} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.sub, marginBottom: 6 }}>Max Discount (₹)</label>
                  <input type="number" placeholder="300" style={inputStyle}
                    value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.sub, marginBottom: 6 }}>Min Order Amount (₹)</label>
                  <input type="number" placeholder="500" style={inputStyle}
                    value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.sub, marginBottom: 6 }}>Usage Limit</label>
                  <input type="number" placeholder="100" style={inputStyle}
                    value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.sub, marginBottom: 6 }}>Expiry Date</label>
                  <input type="date" style={inputStyle}
                    value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} />
                </div>
              </div>

              <div style={{ marginBottom: 22 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.sub, marginBottom: 6 }}>Status</label>
                <select style={inputStyle} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)} style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  border: `1px solid ${t.border}`, background: 'transparent',
                  color: t.text, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                }}>Cancel</button>
                <button type="submit" disabled={saving} style={{
                  flex: 1, padding: '11px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #e5335d, #be123c)',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontFamily: 'Outfit, sans-serif', opacity: saving ? 0.7 : 1,
                }}>
                  {saving ? 'Saving...' : editing ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AdminOffers;