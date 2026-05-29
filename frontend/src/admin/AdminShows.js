import React, { useEffect, useState, useCallback } from 'react';
import { showAPI, movieAPI, theatreAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiGrid } from 'react-icons/fi';
import { useOutletContext } from 'react-router-dom';
import moment from 'moment';
import { CancellationHistory } from '../components/CancellationModal';

const EMPTY = {
  movie: '', theatre: '', date: '', time: '',
  format: '2D', language: 'Hindi',
  totalSeats: 100, price: 200, status: 'Active',
  screenNumber: 1, screenName: 'Screen 1',
};

const CATEGORY_PRESETS = [
  { name: 'VIP',     color: '#a855f7' },
  { name: 'Couple',  color: '#ec4899' },
  { name: 'Premium', color: '#ffb300' },
  { name: 'Gold',    color: '#00b0ff' },
  { name: 'Silver',  color: '#94a3b8' },
  { name: 'General', color: '#64748b' },
];

const DEFAULT_CATEGORIES = [
  { name: 'VIP',     rows: ['A','B'],         columns: 10, price: 800,  color: '#a855f7' },
  { name: 'Couple',  rows: ['C'],             columns: 10, price: 600,  color: '#ec4899' },
  { name: 'Premium', rows: ['D','E','F'],     columns: 10, price: 400,  color: '#ffb300' },
  { name: 'Gold',    rows: ['G','H','I'],     columns: 10, price: 250,  color: '#00b0ff' },
  { name: 'Silver',  rows: ['J','K'],         columns: 10, price: 150,  color: '#94a3b8' },
];

const ALL_ROWS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P'];

// ─────────────────────────────────────────────────────────────────────────────
// Seat Layout Modal
// ─────────────────────────────────────────────────────────────────────────────
const SeatLayoutModal = ({ show, darkMode, onClose, onSaved }) => {
  const [categories, setCategories] = useState(
    show.seatCategories?.length ? show.seatCategories : DEFAULT_CATEGORIES
  );
  const [saving,       setSaving]       = useState(false);
  const [activeTab,    setActiveTab]    = useState('layout');   // 'layout' | 'book'
  const [bookedSeats,  setBookedSeats]  = useState(show.bookedSeats || []);
  const [toggling,     setToggling]     = useState(null);        // seatId being toggled
  const [hovered,      setHovered]      = useState(null);

  const t = {
    bg:       darkMode ? '#0f0f20' : '#ffffff',
    panel:    darkMode ? '#16162a' : '#f8f8fb',
    text:     darkMode ? '#f1f5f9' : '#111111',
    sub:      darkMode ? '#94a3b8' : '#666666',
    border:   darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
    input:    darkMode ? 'rgba(255,255,255,0.06)' : '#ffffff',
    inBorder: darkMode ? 'rgba(255,255,255,0.12)' : '#d0d0d0',
    rowCard:  darkMode ? 'rgba(255,255,255,0.03)' : '#f0f0f8',
  };

  const inp = {
    background: t.input, border: `1.5px solid ${t.inBorder}`,
    borderRadius: 8, padding: '8px 12px', color: t.text,
    fontSize: 13, fontFamily: 'Outfit,sans-serif', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  };

  const assignedRows  = categories.flatMap(c => c.rows);
  const availableRows = ALL_ROWS.filter(r => !assignedRows.includes(r));

  const updateCat  = (idx, field, val) =>
    setCategories(prev => prev.map((c,i) => i===idx ? {...c,[field]:val} : c));

  const addRow = (idx, row) => {
    if (assignedRows.includes(row)) return;
    setCategories(prev => prev.map((c,i) =>
      i===idx ? {...c, rows:[...c.rows,row].sort()} : c
    ));
  };

  const removeRow = (idx, row) =>
    setCategories(prev => prev.map((c,i) =>
      i===idx ? {...c, rows:c.rows.filter(r=>r!==row)} : c
    ));

  const addCategory = () => {
    const preset = CATEGORY_PRESETS.find(p => !categories.find(c=>c.name===p.name));
    setCategories(prev => [...prev, {
      name: preset?.name || 'New', color: preset?.color || '#64748b',
      rows: [], columns: 10, price: 200,
    }]);
  };

  const removeCategory = (idx) => setCategories(prev => prev.filter((_,i)=>i!==idx));

  const totalSeatsCalc = categories.reduce((s,c) => s + c.rows.length*(c.columns||10), 0);

  const getCatForRow = (row) => categories.find(c => c.rows.includes(row));

  // All rows sorted
  const allRows = categories
    .flatMap(c => c.rows.map(r => ({ row: r, cat: c })))
    .sort((a,b) => a.row.localeCompare(b.row));

  // ── Save layout ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (categories.some(c => c.rows.length === 0))
      return toast.error('Every category needs at least 1 row');
    if (categories.some(c => !c.price || c.price <= 0))
      return toast.error('All categories need a valid price');
    setSaving(true);
    try {
      await showAPI.updateSeatLayout(show._id, { seatCategories: categories });
      toast.success('✅ Seat layout saved!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  // ── Admin toggle individual seat ───────────────────────────────────────────
  const handleToggleSeat = async (seatId) => {
    const action = bookedSeats.includes(seatId) ? 'unbook' : 'book';
    setToggling(seatId);
    try {
      const { data } = await showAPI.toggleSeat(show._id, { seatId, action });
      setBookedSeats(data.bookedSeats);
      toast.success(action === 'book'
        ? `🔒 Seat ${seatId} marked as booked`
        : `✅ Seat ${seatId} released`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle seat');
    }
    setToggling(null);
  };

  return (
    <div onClick={onClose} style={{
      position:'fixed',
      top:0, left:0, right:0, bottom:0,
      background:'rgba(0,0,0,0.75)',
      backdropFilter:'blur(4px)',
      display:'flex', alignItems:'flex-start', justifyContent:'center',
      zIndex:9999,
      paddingTop: 70,
      paddingBottom: 16,
      paddingLeft: 226,
      paddingRight: 16,
      overflowY:'auto',
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background: t.bg, borderRadius: 20,
        width: '100%', maxWidth: 960,
        border:`1px solid ${t.border}`,
        boxShadow: darkMode ? '0 32px 80px rgba(0,0,0,0.8)' : '0 12px 48px rgba(0,0,0,0.18)',
        display:'flex', flexDirection:'column',
        marginBottom: 16,
      }}>

        {/* ── Header ── */}
        <div style={{
          padding:'18px 24px', borderBottom:`1px solid ${t.border}`,
          display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0,
        }}>
          <div>
            <h2 style={{fontSize:17, fontWeight:800, color:t.text, margin:0}}>
              🪑 Seat Layout — {show.movie?.title}
            </h2>
            <p style={{fontSize:12, color:t.sub, margin:'3px 0 0'}}>
              {show.theatre?.name} &bull; {moment(show.date).format('DD MMM')} &bull; {show.time}
              &nbsp;&bull;&nbsp;
              <strong style={{color:t.text}}>{totalSeatsCalc} total seats</strong>
              &nbsp;&bull;&nbsp;
              <strong style={{color:'#e5335d'}}>{bookedSeats.length} booked</strong>
            </p>
          </div>
          <button onClick={onClose} style={{
            background: darkMode?'rgba(255,255,255,0.07)':'#f0f0f5',
            border:'none', borderRadius:8, width:34, height:34,
            cursor:'pointer', color:t.sub, display:'flex', alignItems:'center', justifyContent:'center',
          }}><FiX size={18}/></button>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display:'flex', borderBottom:`1px solid ${t.border}`, flexShrink:0,
          padding:'0 24px',
        }}>
          {[
            { key:'layout', label:'🗂 Configure Layout' },
            { key:'book',   label:'🔒 Book / Release Seats' },
          ].map(tab => (
            <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{
              background:'none', border:'none',
              borderBottom: activeTab===tab.key ? '2px solid #e5335d' : '2px solid transparent',
              color: activeTab===tab.key ? '#e5335d' : t.sub,
              padding:'12px 18px', cursor:'pointer', fontSize:13,
              fontWeight: activeTab===tab.key ? 700 : 400,
              fontFamily:'Outfit,sans-serif', marginBottom:-1, transition:'all 0.2s',
            }}>{tab.label}</button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1 — CONFIGURE LAYOUT
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'layout' && (
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', flex:1, minHeight:0}}>

            {/* LEFT — editor */}
            <div style={{padding:24, borderRight:`1px solid ${t.border}`, overflowY:'auto'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
                <h3 style={{fontSize:14, fontWeight:700, color:t.text, margin:0}}>Categories</h3>
                <button onClick={addCategory} style={{
                  background:'rgba(229,51,93,0.1)', border:'1px solid rgba(229,51,93,0.3)',
                  borderRadius:8, padding:'6px 12px', color:'#e5335d',
                  fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Outfit,sans-serif',
                  display:'flex', alignItems:'center', gap:4,
                }}><FiPlus size={12}/> Add Category</button>
              </div>

              {categories.map((cat, idx) => (
                <div key={idx} style={{
                  background:t.rowCard, border:`1px solid ${t.border}`,
                  borderRadius:12, padding:16, marginBottom:12,
                  borderLeft:`4px solid ${cat.color}`,
                }}>
                  {/* Name + color + delete */}
                  <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:10}}>
                    <select value={cat.name}
                      onChange={e => {
                        const preset = CATEGORY_PRESETS.find(p=>p.name===e.target.value);
                        updateCat(idx,'name',e.target.value);
                        if (preset) updateCat(idx,'color',preset.color);
                      }}
                      style={{...inp, flex:1}}
                    >
                      {CATEGORY_PRESETS.map(p=><option key={p.name} value={p.name}>{p.name}</option>)}
                    </select>
                    <input type="color" value={cat.color}
                      onChange={e=>updateCat(idx,'color',e.target.value)}
                      style={{width:34,height:34,border:'none',borderRadius:6,cursor:'pointer',padding:2,background:'none'}}
                      title="Pick color"
                    />
                    <button onClick={()=>removeCategory(idx)} style={{
                      background:'rgba(229,51,93,0.1)', border:'1px solid rgba(229,51,93,0.2)',
                      borderRadius:6, padding:'6px 8px', color:'#e5335d', cursor:'pointer',
                    }}><FiTrash2 size={13}/></button>
                  </div>

                  {/* Price */}
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:11, color:t.sub, display:'block', marginBottom:4}}>Price (₹)</label>
                    <input type="number" min={0} value={cat.price}
                      onChange={e=>updateCat(idx,'price',Number(e.target.value))}
                      style={inp}
                    />
                  </div>

                  {/* ✅ Columns per row */}
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:11, color:t.sub, display:'block', marginBottom:4}}>
                      Seats per Row (Columns)
                    </label>
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <input type="number" min={1} max={30} value={cat.columns||10}
                        onChange={e=>updateCat(idx,'columns',Number(e.target.value))}
                        style={{...inp, width:80}}
                      />
                      <span style={{fontSize:11, color:t.sub}}>
                        → {cat.rows.length} rows × {cat.columns||10} cols
                        = <strong style={{color:t.text}}>{cat.rows.length*(cat.columns||10)} seats</strong>
                      </span>
                    </div>
                  </div>

                  {/* Rows */}
                  <div>
                    <label style={{fontSize:11, color:t.sub, display:'block', marginBottom:6}}>
                      Rows — {cat.rows.length} row{cat.rows.length!==1?'s':''}
                    </label>
                    <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                      {cat.rows.map(row => (
                        <div key={row} onClick={()=>removeRow(idx,row)} style={{
                          background:cat.color, color:'#fff', borderRadius:6,
                          padding:'4px 10px', fontSize:12, fontWeight:700,
                          cursor:'pointer', display:'flex', alignItems:'center', gap:4,
                          userSelect:'none',
                        }} title="Click to remove">
                          Row {row} <FiX size={11}/>
                        </div>
                      ))}
                      {availableRows.length > 0 && (
                        <select value="" onChange={e=>{if(e.target.value)addRow(idx,e.target.value);}}
                          style={{...inp, width:'auto', padding:'4px 8px', fontSize:12, cursor:'pointer'}}
                        >
                          <option value="">+ Add Row</option>
                          {availableRows.map(r=><option key={r} value={r}>Row {r}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={handleSave} disabled={saving} style={{
                width:'100%', padding:'13px',
                background: saving ? '#555' : 'linear-gradient(135deg,#e5335d,#be123c)',
                border:'none', borderRadius:12, color:'#fff',
                fontSize:14, fontWeight:700, cursor: saving?'not-allowed':'pointer',
                fontFamily:'Outfit,sans-serif',
                boxShadow: saving?'none':'0 4px 16px rgba(229,51,93,0.4)',
                marginTop:8,
              }}>
                {saving ? '⏳ Saving…' : '✅ Save Layout'}
              </button>
            </div>

            {/* RIGHT — live preview */}
            <div style={{padding:24, overflowY:'auto', background: darkMode?'rgba(255,255,255,0.01)':'#fafafa'}}>
              <h3 style={{fontSize:14, fontWeight:700, color:t.text, marginBottom:16}}>Live Preview</h3>

              {/* Screen */}
              <div style={{textAlign:'center', marginBottom:20}}>
                <div style={{background:'linear-gradient(to right,transparent,rgba(229,51,93,0.5),transparent)', height:3, borderRadius:3, marginBottom:6}}/>
                <span style={{fontSize:10, color:t.sub, letterSpacing:3, textTransform:'uppercase'}}>SCREEN</span>
              </div>

              {/* Grid — aligned by max columns */}
              <div style={{overflowX:'auto'}}>
                {(() => {
                  const maxCols = Math.max(...categories.map(c => c.columns||10));
                  const SEAT_W  = 22; // px per seat
                  const GAP     = 3;
                  const AISLE   = 8;
                  // total width of a full row (maxCols seats)
                  const fullW   = maxCols * SEAT_W + (maxCols - 1) * GAP + AISLE;
                  return allRows.map(({row, cat}) => {
                    const cols   = cat.columns || 10;
                    const rowW   = cols * SEAT_W + (cols - 1) * GAP + AISLE;
                    const padEach = Math.max(0, (fullW - rowW) / 2);
                    return (
                      <div key={row} style={{display:'flex', alignItems:'center', gap:3, marginBottom:4, justifyContent:'center'}}>
                        <span style={{width:16, fontSize:10, fontWeight:700, color:cat.color, textAlign:'right', flexShrink:0}}>{row}</span>
                        {/* Left padding to align narrower rows */}
                        {padEach > 0 && <div style={{width:padEach, flexShrink:0}}/>}
                        {Array.from({length: cols}, (_,i) => {
                          const seatId   = `${row}${i+1}`;
                          const isBooked = bookedSeats.includes(seatId);
                          return (
                            <React.Fragment key={seatId}>
                              {i===Math.floor(cols/2) && <div style={{width:AISLE, flexShrink:0}}/>}
                              <div style={{
                                width:SEAT_W, height:SEAT_W, borderRadius:4, flexShrink:0,
                                background: isBooked?(darkMode?'#2a2a3a':'#e0e0e0'):`${cat.color}22`,
                                border:`1.5px solid ${isBooked?(darkMode?'#333':'#ccc'):cat.color}`,
                                fontSize:7, display:'flex', alignItems:'center', justifyContent:'center',
                                color: isBooked?'#666':cat.color, fontWeight:700,
                              }} title={`${seatId} — ${cat.name} ₹${cat.price}`}>
                                {i+1}
                              </div>
                            </React.Fragment>
                          );
                        })}
                        {/* Right padding */}
                        {padEach > 0 && <div style={{width:padEach, flexShrink:0}}/>}
                        <span style={{fontSize:9, color:cat.color, fontWeight:700, marginLeft:4, whiteSpace:'nowrap'}}>{cat.name}</span>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Legend */}
              <div style={{marginTop:16, display:'flex', flexWrap:'wrap', gap:8}}>
                {categories.map(cat => (
                  <div key={cat.name} style={{
                    display:'flex', alignItems:'center', gap:6,
                    background:`${cat.color}15`, border:`1px solid ${cat.color}44`,
                    borderRadius:8, padding:'5px 10px',
                  }}>
                    <div style={{width:10, height:10, borderRadius:3, background:cat.color}}/>
                    <span style={{fontSize:11, fontWeight:700, color:cat.color}}>{cat.name}</span>
                    <span style={{fontSize:10, color:t.sub}}>₹{cat.price}</span>
                    <span style={{fontSize:10, color:t.sub}}>({cat.rows.join(',')||'—'}) ×{cat.columns||10}</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div style={{
                marginTop:14, padding:'12px 14px',
                background: darkMode?'rgba(229,51,93,0.06)':'rgba(229,51,93,0.04)',
                border:'1px solid rgba(229,51,93,0.2)', borderRadius:10,
              }}>
                <div style={{fontSize:11, fontWeight:700, color:'#e5335d', marginBottom:6}}>Layout Summary</div>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 12px'}}>
                  {categories.map(cat => (
                    <div key={cat.name} style={{fontSize:11, color:t.sub}}>
                      <span style={{color:cat.color, fontWeight:700}}>{cat.name}</span>
                      {': '}{cat.rows.length}×{cat.columns||10}={cat.rows.length*(cat.columns||10)} @ ₹{cat.price}
                    </div>
                  ))}
                  <div style={{
                    fontSize:12, fontWeight:700, color:t.text,
                    gridColumn:'1/-1', marginTop:4,
                    borderTop:`1px solid ${t.border}`, paddingTop:4,
                  }}>
                    Total: {totalSeatsCalc} seats
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2 — BOOK / RELEASE SEATS
        ════════════════════════════════════════════════════════════════════ */}
        {activeTab === 'book' && (
          <div style={{padding:24, overflowY:'auto'}}>
            <div style={{
              padding:'10px 16px', background:'rgba(255,179,0,0.08)',
              border:'1px solid rgba(255,179,0,0.3)', borderRadius:10,
              fontSize:12, color:'#ffb300', marginBottom:20,
            }}>
              💡 Click any seat to <strong>book</strong> it (marks as occupied for users) or <strong>release</strong> it. Changes apply instantly.
            </div>

            {/* Legend */}
            <div style={{display:'flex', gap:16, marginBottom:16, flexWrap:'wrap'}}>
              {[
                {label:'Available', bg:darkMode?'rgba(0,200,83,0.15)':'#e8f5e9', border:'#00c853', color:'#00c853'},
                {label:'Booked',    bg:darkMode?'#2a2a3a':'#e0e0e0',             border: darkMode?'#333':'#bbb', color:darkMode?'#555':'#aaa'},
                {label:'Toggling',  bg:'rgba(255,179,0,0.2)',                    border:'#ffb300', color:'#ffb300'},
              ].map(l => (
                <div key={l.label} style={{display:'flex', alignItems:'center', gap:6, fontSize:12, color:t.sub}}>
                  <div style={{width:16, height:16, borderRadius:4, background:l.bg, border:`1.5px solid ${l.border}`}}/>
                  {l.label}
                </div>
              ))}
              <div style={{marginLeft:'auto', fontSize:12, color:t.sub}}>
                <strong style={{color:'#e5335d'}}>{bookedSeats.length}</strong> booked &nbsp;/&nbsp;
                <strong style={{color:'#00c853'}}>{totalSeatsCalc - bookedSeats.length}</strong> available
              </div>
            </div>

            {/* Screen */}
            <div style={{textAlign:'center', marginBottom:20}}>
              <div style={{background:'linear-gradient(to right,transparent,rgba(229,51,93,0.5),transparent)', height:3, borderRadius:3, marginBottom:6}}/>
              <span style={{fontSize:10, color:t.sub, letterSpacing:3, textTransform:'uppercase'}}>SCREEN</span>
            </div>

            {/* Seat grid — interactive, aligned */}
            <div style={{overflowX:'auto'}}>
              {(() => {
                const maxCols = Math.max(...categories.map(c => c.columns||10));
                const SEAT_W  = 30;
                const GAP     = 4;
                const AISLE   = 12;
                const fullW   = maxCols * SEAT_W + (maxCols-1) * GAP + AISLE;
                return allRows.map(({row, cat}) => {
                  const cols    = cat.columns || 10;
                  const rowW    = cols * SEAT_W + (cols-1) * GAP + AISLE;
                  const padEach = Math.max(0, (fullW - rowW) / 2);
                  return (
                    <div key={row}>
                      {cat.rows[0] === row && (
                        <div style={{
                          display:'flex', alignItems:'center', gap:8,
                          margin:'10px 0 6px', padding:'4px 8px',
                          background:`${cat.color}15`,
                          borderLeft:`3px solid ${cat.color}`,
                          borderRadius:'0 8px 8px 0',
                        }}>
                          <span style={{fontSize:11, fontWeight:700, color:cat.color}}>{cat.name}</span>
                          <span style={{fontSize:10, color:t.sub}}>₹{cat.price}/seat</span>
                          <span style={{fontSize:10, color:t.sub}}>(Rows {cat.rows.join(', ')} × {cols} cols)</span>
                        </div>
                      )}

                      <div style={{display:'flex', alignItems:'center', gap:GAP, marginBottom:5, justifyContent:'center'}}>
                        <span style={{width:18, fontSize:11, fontWeight:700, color:cat.color, textAlign:'right', flexShrink:0}}>{row}</span>
                        {padEach > 0 && <div style={{width:padEach, flexShrink:0}}/>}

                        {Array.from({length: cols}, (_,i) => {
                          const seatId     = `${row}${i+1}`;
                          const isBooked   = bookedSeats.includes(seatId);
                          const isToggling = toggling === seatId;
                          return (
                            <React.Fragment key={seatId}>
                              {i===Math.floor(cols/2) && <div style={{width:AISLE, flexShrink:0}}/>}
                              <div
                                onClick={() => !isToggling && handleToggleSeat(seatId)}
                                onMouseEnter={() => setHovered(seatId)}
                                onMouseLeave={() => setHovered(null)}
                                title={isBooked ? `${seatId} — Click to Release` : `${seatId} — Click to Book`}
                                style={{
                                  width:SEAT_W, height:SEAT_W, borderRadius:6, flexShrink:0,
                                  display:'flex', alignItems:'center', justifyContent:'center',
                                  fontSize:10, fontWeight:700,
                                  cursor: isToggling ? 'wait' : 'pointer',
                                  transition:'all 0.15s',
                                  background: isToggling
                                    ? 'rgba(255,179,0,0.2)'
                                    : isBooked
                                      ? (darkMode?'#2a2a3a':'#e0e0e0')
                                      : hovered===seatId ? `${cat.color}44` : `${cat.color}18`,
                                  border:`1.5px solid ${isToggling?'#ffb300':isBooked?(darkMode?'#444':'#bbb'):hovered===seatId?cat.color:`${cat.color}55`}`,
                                  color: isToggling?'#ffb300':isBooked?(darkMode?'#666':'#aaa'):cat.color,
                                  transform: hovered===seatId && !isBooked ? 'scale(1.08)' : 'scale(1)',
                                  boxShadow: isBooked?'none':hovered===seatId?`0 2px 8px ${cat.color}44`:'none',
                                }}
                              >
                                {isToggling ? '…' : i+1}
                              </div>
                            </React.Fragment>
                          );
                        })}

                        {padEach > 0 && <div style={{width:padEach, flexShrink:0}}/>}
                        <span style={{fontSize:10, color:t.sub, marginLeft:4, minWidth:36}}>
                          {bookedSeats.filter(s=>s.startsWith(row)).length}/{cols}
                        </span>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Booked seats summary */}
            {bookedSeats.length > 0 && (
              <div style={{
                marginTop:20, padding:'14px 16px',
                background: darkMode?'rgba(229,51,93,0.06)':'rgba(229,51,93,0.04)',
                border:'1px solid rgba(229,51,93,0.2)', borderRadius:12,
              }}>
                <div style={{fontSize:12, fontWeight:700, color:'#e5335d', marginBottom:8}}>
                  🔒 Booked Seats ({bookedSeats.length})
                </div>
                <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                  {bookedSeats.sort().map(seatId => {
                    const row = seatId.replace(/[0-9]/g,'');
                    const cat = categories.find(c=>c.rows.includes(row));
                    return (
                      <span key={seatId} onClick={()=>handleToggleSeat(seatId)} style={{
                        background:`${cat?.color||'#e5335d'}22`,
                        border:`1px solid ${cat?.color||'#e5335d'}55`,
                        color: cat?.color||'#e5335d',
                        borderRadius:6, padding:'3px 9px', fontSize:11, fontWeight:700,
                        cursor:'pointer',
                      }} title="Click to release">
                        {seatId}
                      </span>
                    );
                  })}
                </div>
                <div style={{fontSize:11, color:t.sub, marginTop:8}}>
                  Click any seat tag above to release it instantly.
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main AdminShows
// ─────────────────────────────────────────────────────────────────────────────
const AdminShows = () => {
  const { darkMode } = useOutletContext();
  const [shows,     setShows]     = useState([]);
  const [movies,    setMovies]    = useState([]);
  const [theatres,  setTheatres]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [showModal, setShowModal] = useState(false);
  const [seatModal, setSeatModal] = useState(null);
  const [selectedTheatreScreens, setSelectedTheatreScreens] = useState([]);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [activeTab, setActiveTab] = useState('shows');

  const t = {
    text:        darkMode ? '#f1f5f9'                : '#111111',
    sub:         darkMode ? '#94a3b8'                : '#666666',
    cardBg:      darkMode ? 'rgba(255,255,255,0.04)' : '#ffffff',
    border:      darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
    rowHover:    darkMode ? 'rgba(229,51,93,0.06)'   : 'rgba(229,51,93,0.04)',
    theadBg:     darkMode ? 'rgba(255,255,255,0.04)' : '#f8f8fb',
    theadText:   darkMode ? '#94a3b8'                : '#888888',
    inputBg:     darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
    inputBorder: darkMode ? 'rgba(255,255,255,0.1)'  : '#d0d0d0',
    inputText:   darkMode ? '#f1f5f9'                : '#111111',
    filterBg:    darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
    tdText:      darkMode ? '#cbd5e1'                : '#333333',
    modalBg:     darkMode ? '#12122a'                : '#ffffff',
    shadow:      darkMode ? '0 24px 60px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.12)',
  };

  const inputStyle = {
    width:'100%', background:t.inputBg, border:`1.5px solid ${t.inputBorder}`,
    borderRadius:10, padding:'10px 14px', color:t.inputText,
    fontSize:13, fontFamily:'Outfit,sans-serif', outline:'none',
  };

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([showAPI.getAll(), movieAPI.getAll(), theatreAPI.getAll()])
      .then(([s,m,th]) => { setShows(s.data); setMovies(m.data); setTheatres(th.data); setLoading(false); })
      .catch(() => { toast.error('Failed to fetch data'); setLoading(false); });
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setSelectedTheatreScreens([]); setShowModal(true); };

  // When theatre selected in form, load its screens
  const handleTheatreChange = (theatreId) => {
    setForm(prev => ({ ...prev, theatre: theatreId, screenNumber: 1, screenName: 'Screen 1' }));
    const th = theatres.find(t => t._id === theatreId);
    if (th?.screenList?.length) {
      setSelectedTheatreScreens(th.screenList);
      const first = th.screenList[0];
      setForm(prev => ({ ...prev, theatre: theatreId, screenNumber: first.number, screenName: first.name }));
    } else {
      setSelectedTheatreScreens([]);
    }
  };
  const openEdit = (s) => {
    const theatreId = s.theatre?._id || s.theatre;
    setForm({
      ...s,
      movie:        s.movie?._id || s.movie,
      theatre:      theatreId,
      date:         s.date?.split('T')[0] || '',
      screenNumber: s.screenNumber || 1,
      screenName:   s.screenName   || 'Screen 1',
    });
    // Load screens for the selected theatre
    const th = theatres.find(t => t._id === theatreId);
    setSelectedTheatreScreens(th?.screenList || []);
    setEditing(s._id);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.movie||!form.theatre||!form.date||!form.time) return toast.error('Fill all required fields');
    setSaving(true);
    try {
      const payload = {...form, totalSeats:Number(form.totalSeats), price:Number(form.price)};
      editing ? await showAPI.update(editing,payload) : await showAPI.create(payload);
      toast.success(editing?'Show updated':'Show added');
      setShowModal(false); fetchAll();
    } catch (err) { toast.error(err.response?.data?.message||'Error saving show'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this show?')) return;
    try { await showAPI.delete(id); toast.success('Show deleted'); fetchAll(); }
    catch { toast.error('Failed to delete show'); }
  };

  const filtered = shows.filter(s => {
    const title   = s.movie?.title?.toLowerCase()  || '';
    const theatre = s.theatre?.name?.toLowerCase() || '';
    return title.includes(search.toLowerCase()) || theatre.includes(search.toLowerCase());
  });

  return (
    <div>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        select option { color:#111111 !important; background:#ffffff !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { filter:${darkMode?'invert(1)':'none'}; }
      `}</style>

      {/* Header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
        <div>
          <h1 style={{fontSize:22, fontWeight:800, color:t.text}}>🎭 Shows</h1>
          <p style={{color:t.sub, fontSize:13, marginTop:4}}>Manage show schedules &amp; seat layouts</p>
        </div>
        {activeTab==='shows' && (
          <button onClick={openCreate} style={{
            display:'flex', alignItems:'center', gap:8,
            background:'linear-gradient(135deg,#e5335d,#be123c)',
            color:'#fff', border:'none', borderRadius:10,
            padding:'10px 18px', fontSize:13, fontWeight:700,
            cursor:'pointer', fontFamily:'Outfit,sans-serif',
            boxShadow:'0 4px 14px rgba(229,51,93,0.35)',
          }}>
            <FiPlus size={15}/> Add Show
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:4, marginBottom:24, borderBottom:`1px solid ${t.border}`}}>
        {[{key:'shows',label:'🎬 All Shows'},{key:'cancellations',label:'❌ Cancellations & Refunds'}].map(tab=>(
          <button key={tab.key} onClick={()=>setActiveTab(tab.key)} style={{
            background:'none', border:'none',
            borderBottom: activeTab===tab.key ? '2px solid #e5335d' : '2px solid transparent',
            color: activeTab===tab.key ? '#e5335d' : t.sub,
            padding:'10px 18px', cursor:'pointer', fontSize:14,
            fontWeight: activeTab===tab.key ? 700 : 400,
            fontFamily:'Outfit,sans-serif', marginBottom:-1, transition:'all 0.2s',
          }}>{tab.label}</button>
        ))}
      </div>

      {activeTab==='shows' && (
        <>
          {/* Filters */}
          <div style={{display:'flex', gap:10, marginBottom:20, flexWrap:'wrap'}}>
            {['All Movies','All Theatres'].map(f=>(
              <select key={f} style={{background:t.filterBg, border:`1px solid ${t.inputBorder}`, borderRadius:8, padding:'8px 14px', color:t.inputText, fontSize:13, fontFamily:'Outfit,sans-serif', outline:'none'}}>
                <option>{f}</option>
                {f==='All Movies'
                  ? movies.map(m=><option key={m._id} value={m._id}>{m.title}</option>)
                  : theatres.map(th=><option key={th._id} value={th._id}>{th.name}</option>)
                }
              </select>
            ))}
            <input type="date" style={{background:t.filterBg, border:`1px solid ${t.inputBorder}`, borderRadius:8, padding:'8px 14px', color:t.inputText, fontSize:13, fontFamily:'Outfit,sans-serif', outline:'none'}}/>
          </div>

          {/* Table */}
          <div style={{background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:14, overflow:'hidden', boxShadow: darkMode?'0 4px 24px rgba(0,0,0,0.3)':'0 2px 12px rgba(0,0,0,0.06)'}}>
            <div style={{padding:'14px 20px', borderBottom:`1px solid ${t.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{fontSize:14, fontWeight:600, color:t.text}}>Shows ({filtered.length})</span>
              <div style={{display:'flex', alignItems:'center', gap:8, background:t.inputBg, border:`1px solid ${t.inputBorder}`, borderRadius:8, padding:'8px 14px', width:240}}>
                <FiSearch size={14} color={t.sub}/>
                <input placeholder="Search shows..." value={search} onChange={e=>setSearch(e.target.value)}
                  style={{background:'none', border:'none', outline:'none', color:t.inputText, fontFamily:'Outfit,sans-serif', fontSize:13, flex:1}}/>
                {search && <button onClick={()=>setSearch('')} style={{background:'none',border:'none',cursor:'pointer',color:t.sub,display:'flex',padding:0}}><FiX size={13}/></button>}
              </div>
            </div>

            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                  <tr style={{background:t.theadBg}}>
                    {['Movie','Theatre','Date','Time','Screen','Seat Layout','Available','Status','Actions'].map(h=>(
                      <th key={h} style={{padding:'10px 16px', fontSize:11, fontWeight:600, color:t.theadText, textAlign:'left', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:`1px solid ${t.border}`}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={9} style={{textAlign:'center',padding:40}}>
                      <div style={{width:32,height:32,border:'3px solid rgba(229,51,93,0.2)',borderTopColor:'#e5335d',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'auto'}}/>
                    </td></tr>
                  ) : filtered.length===0 ? (
                    <tr><td colSpan={9} style={{textAlign:'center',padding:40,color:t.sub}}>No shows found</td></tr>
                  ) : filtered.map(show => (
                    <tr key={show._id}
                      style={{borderTop:`1px solid ${t.border}`, transition:'background 0.15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background=t.rowHover}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                    >
                      <td style={{padding:'12px 16px'}}>
                        <div style={{fontWeight:600,fontSize:13,color:t.text}}>{show.movie?.title}</div>
                        <div style={{fontSize:11,color:t.sub,marginTop:2}}>{show.language} | {show.format}</div>
                      </td>
                      <td style={{padding:'12px 16px'}}>
                        <div style={{fontSize:13,color:t.tdText}}>{show.theatre?.name}</div>
                        <div style={{fontSize:11,color:t.sub}}>{show.theatre?.city}</div>
                      </td>
                      <td style={{padding:'12px 16px',fontSize:13,color:t.sub}}>{moment(show.date).format('DD MMM YYYY')}</td>
                      <td style={{padding:'12px 16px',fontWeight:700,color:'#e5335d'}}>{show.time}</td>
                      <td style={{padding:'12px 16px'}}>
                        {show.screenName
                          ? <span style={{fontSize:11,fontWeight:700,padding:'3px 8px',borderRadius:6,background:'rgba(168,85,247,0.12)',color:'#a855f7',border:'1px solid rgba(168,85,247,0.3)'}}>{show.screenName}</span>
                          : <span style={{fontSize:11,color:t.sub}}>—</span>
                        }
                      </td>

                      {/* Seat layout badges */}
                      <td style={{padding:'12px 16px'}}>
                        {show.seatCategories?.length > 0 ? (
                          <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                            {show.seatCategories.map(cat=>(
                              <span key={cat.name} style={{
                                fontSize:9,fontWeight:700,padding:'2px 6px',borderRadius:4,
                                background:`${cat.color}22`,color:cat.color,border:`1px solid ${cat.color}44`,
                              }}>{cat.name} ₹{cat.price}</span>
                            ))}
                          </div>
                        ) : (
                          <span style={{fontSize:11,color:t.sub}}>Default</span>
                        )}
                      </td>

                      <td style={{padding:'12px 16px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <div style={{flex:1,height:4,borderRadius:2,background:darkMode?'rgba(255,255,255,0.1)':'#eee',overflow:'hidden',width:60}}>
                            <div style={{height:'100%',borderRadius:2,background:show.availableSeats<20?'#e5335d':'#00c853',width:`${(show.availableSeats/show.totalSeats)*100}%`}}/>
                          </div>
                          <span style={{fontSize:12,color:t.sub}}>{show.availableSeats}/{show.totalSeats}</span>
                        </div>
                      </td>

                      <td style={{padding:'12px 16px'}}>
                        <span style={{
                          background:show.status==='Active'?'rgba(0,200,83,0.12)':'rgba(229,51,93,0.12)',
                          color:show.status==='Active'?'#00c853':'#e5335d',
                          padding:'4px 12px',borderRadius:20,fontSize:11,fontWeight:700,
                        }}>{show.status}</span>
                      </td>

                      <td style={{padding:'12px 16px'}}>
                        <div style={{display:'flex',gap:6}}>
                          <button onClick={()=>setSeatModal(show)} title="Manage Seat Layout"
                            style={{background:'rgba(168,85,247,0.1)',border:'1px solid rgba(168,85,247,0.3)',borderRadius:6,padding:'5px 10px',color:'#a855f7',cursor:'pointer'}}>
                            <FiGrid size={13}/>
                          </button>
                          <button onClick={()=>openEdit(show)} title="Edit"
                            style={{background:'rgba(0,176,255,0.1)',border:'1px solid rgba(0,176,255,0.3)',borderRadius:6,padding:'5px 10px',color:'#00b0ff',cursor:'pointer'}}>
                            <FiEdit2 size={13}/>
                          </button>
                          <button onClick={()=>handleDelete(show._id)} title="Delete"
                            style={{background:'rgba(229,51,93,0.1)',border:'1px solid rgba(229,51,93,0.3)',borderRadius:6,padding:'5px 10px',color:'#e5335d',cursor:'pointer'}}>
                            <FiTrash2 size={13}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab==='cancellations' && (
        <div style={{background:t.cardBg,border:`1px solid ${t.border}`,borderRadius:14,overflow:'hidden'}}>
          <CancellationHistory/>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div onClick={()=>setShowModal(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000,padding:20}}>
          <div onClick={e=>e.stopPropagation()} style={{background:t.modalBg,borderRadius:18,padding:28,width:'100%',maxWidth:540,maxHeight:'90vh',overflowY:'auto',border:`1px solid ${t.border}`,boxShadow:t.shadow}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
              <h2 style={{fontSize:18,fontWeight:800,color:t.text,margin:0}}>{editing?'Edit Show':'Add Show'}</h2>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',color:t.sub,cursor:'pointer'}}><FiX size={20}/></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:t.sub,marginBottom:6}}>Movie *</label>
                <select style={inputStyle} value={form.movie} onChange={e=>setForm({...form,movie:e.target.value})}>
                  <option value="">-- Select Movie --</option>
                  {movies.map(m=><option key={m._id} value={m._id}>{m.title}</option>)}
                </select>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:t.sub,marginBottom:6}}>Theatre *</label>
                <select style={inputStyle} value={form.theatre} onChange={e=>handleTheatreChange(e.target.value)}>
                  <option value="">-- Select Theatre --</option>
                  {theatres.map(th=><option key={th._id} value={th._id}>{th.name} - {th.city}</option>)}
                </select>
              </div>

              {/* ✅ Screen selector — shown when theatre has screens */}
              {selectedTheatreScreens.length > 0 && (
                <div style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:t.sub,marginBottom:6}}>Screen *</label>
                  <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                    {selectedTheatreScreens.map((sc, idx) => {
                      const colors = ['#e5335d','#a855f7','#00b0ff','#ffb300','#00c853','#ec4899'];
                      const color  = colors[idx % colors.length];
                      const active = form.screenNumber === sc.number;
                      return (
                        <div key={sc.number}
                          onClick={()=>setForm(prev=>({...prev, screenNumber:sc.number, screenName:sc.name}))}
                          style={{
                            display:'flex', alignItems:'center', gap:8,
                            padding:'8px 14px', borderRadius:10, cursor:'pointer',
                            background: active ? `${color}22` : (darkMode?'rgba(255,255,255,0.04)':'#f5f5f8'),
                            border: `2px solid ${active ? color : (darkMode?'rgba(255,255,255,0.1)':'#e0e0e0')}`,
                            transition:'all 0.15s',
                          }}
                        >
                          <div style={{width:8,height:8,borderRadius:'50%',background:active?color:(darkMode?'#444':'#ccc')}}/>
                          <div>
                            <div style={{fontSize:12,fontWeight:700,color:active?color:t.text}}>{sc.name}</div>
                            <div style={{fontSize:10,color:t.sub}}>{sc.totalSeats} seats &bull; {(sc.format||[]).join('/')}</div>
                          </div>
                          {active && <span style={{fontSize:9,fontWeight:700,color:color,marginLeft:4}}>✓</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[
                  {key:'date',label:'Date *',type:'date'},
                  {key:'time',label:'Time * (HH:MM)',type:'text',placeholder:'14:30'},
                  {key:'totalSeats',label:'Total Seats',type:'number'},
                  {key:'price',label:'Base Price (₹)',type:'number'},
                ].map(({key,label,type,placeholder})=>(
                  <div key={key} style={{marginBottom:14}}>
                    <label style={{display:'block',fontSize:12,fontWeight:600,color:t.sub,marginBottom:6}}>{label}</label>
                    <input type={type} placeholder={placeholder} style={inputStyle}
                      value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/>
                  </div>
                ))}
                <div style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:t.sub,marginBottom:6}}>Format</label>
                  <select style={inputStyle} value={form.format} onChange={e=>setForm({...form,format:e.target.value})}>
                    {['2D','3D','IMAX 2D','4DX','MX4D'].map(f=><option key={f}>{f}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:14}}>
                  <label style={{display:'block',fontSize:12,fontWeight:600,color:t.sub,marginBottom:6}}>Language</label>
                  <select style={inputStyle} value={form.language} onChange={e=>setForm({...form,language:e.target.value})}>
                    {['Hindi','English','Tamil','Telugu','Kannada','Malayalam'].map(l=><option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:20}}>
                <label style={{display:'block',fontSize:12,fontWeight:600,color:t.sub,marginBottom:6}}>Status</label>
                <select style={inputStyle} value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                  <option>Active</option><option>Inactive</option><option>Cancelled</option>
                </select>
              </div>
              {!editing && (
                <div style={{marginBottom:16,padding:'10px 14px',background:'rgba(168,85,247,0.08)',border:'1px solid rgba(168,85,247,0.25)',borderRadius:8,fontSize:12,color:'#a855f7'}}>
                  💡 After creating, click the <strong>🪑 grid icon</strong> to configure seat categories with rows, columns &amp; prices.
                </div>
              )}
              <div style={{display:'flex',gap:10}}>
                <button type="button" onClick={()=>setShowModal(false)}
                  style={{flex:1,padding:'11px',borderRadius:10,border:`1px solid ${t.border}`,background:'transparent',color:t.text,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Outfit,sans-serif'}}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{flex:1,padding:'11px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#e5335d,#be123c)',color:'#fff',fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif',opacity:saving?0.7:1}}>
                  {saving?'Saving…':editing?'Update Show':'Add Show'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Seat Layout Modal */}
      {seatModal && (
        <SeatLayoutModal
          show={seatModal}
          darkMode={darkMode}
          onClose={()=>setSeatModal(null)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
};

export default AdminShows;