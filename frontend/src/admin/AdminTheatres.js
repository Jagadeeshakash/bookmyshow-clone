import React, { useEffect, useState } from 'react';
import { theatreAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiMonitor } from 'react-icons/fi';
import { useOutletContext } from 'react-router-dom';

const EMPTY = {
  name: '', location: '', city: 'Chennai',
  screens: 1, totalSeats: 200, status: 'Active', amenities: '',
};

const FORMAT_OPTIONS = ['2D', '3D', 'IMAX 2D', 'IMAX 3D', '4DX', 'MX4D', 'Dolby Cinema'];

// ── Screen Manager Modal ──────────────────────────────────────────────────────
const ScreenModal = ({ theatre, darkMode, onClose, onSaved }) => {
  const [screenList, setScreenList] = useState(
    theatre.screenList?.length
      ? theatre.screenList.map(s => ({ ...s, format: s.format || ['2D'] }))
      : Array.from({ length: theatre.screens || 1 }, (_, i) => ({
          number:     i + 1,
          name:       `Screen ${i + 1}`,
          totalSeats: Math.floor((theatre.totalSeats || 100) / (theatre.screens || 1)),
          format:     ['2D'],
          status:     'Active',
        }))
  );
  const [saving, setSaving] = useState(false);

  const t = {
    bg:       darkMode ? '#0f0f20' : '#ffffff',
    text:     darkMode ? '#f1f5f9' : '#111111',
    sub:      darkMode ? '#94a3b8' : '#666666',
    border:   darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
    input:    darkMode ? 'rgba(255,255,255,0.06)' : '#f5f5f8',
    inBorder: darkMode ? 'rgba(255,255,255,0.12)' : '#d0d0d0',
    card:     darkMode ? 'rgba(255,255,255,0.03)' : '#f8f8fb',
    rowHover: darkMode ? 'rgba(229,51,93,0.06)'   : 'rgba(229,51,93,0.03)',
  };

  const inp = {
    background: t.input, border: `1.5px solid ${t.inBorder}`,
    borderRadius: 8, padding: '8px 12px', color: t.text,
    fontSize: 13, fontFamily: 'Outfit,sans-serif', outline: 'none',
    width: '100%', boxSizing: 'border-box',
  };

  const updateScreen = (idx, field, value) =>
    setScreenList(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const toggleFormat = (idx, fmt) => {
    const current = screenList[idx].format || [];
    const updated  = current.includes(fmt)
      ? current.filter(f => f !== fmt)
      : [...current, fmt];
    updateScreen(idx, 'format', updated);
  };

  const addScreen = () => {
    const num = screenList.length + 1;
    setScreenList(prev => [...prev, {
      number: num, name: `Screen ${num}`,
      totalSeats: 100, format: ['2D'], status: 'Active',
    }]);
  };

  const removeScreen = (idx) => {
    if (screenList.length === 1) return toast.error('Need at least 1 screen');
    setScreenList(prev => prev.filter((_, i) => i !== idx)
      .map((s, i) => ({ ...s, number: i + 1 }))
    );
  };

  const totalSeats = screenList.reduce((s, sc) => s + (Number(sc.totalSeats) || 0), 0);

  const handleSave = async () => {
    if (screenList.some(s => !s.name.trim())) return toast.error('All screens need a name');
    if (screenList.some(s => !s.totalSeats || s.totalSeats < 1)) return toast.error('All screens need valid seat count');
    setSaving(true);
    try {
      await theatreAPI.update(theatre._id, {
        screenList,
        screens:    screenList.length,
        totalSeats,
      });
      toast.success('✅ Screens saved!');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const screenColors = ['#e5335d','#a855f7','#00b0ff','#ffb300','#00c853','#ec4899','#f97316','#06b6d4'];

  return (
    <div onClick={onClose} style={{
      position:'fixed', top:0, left:0, right:0, bottom:0,
      background:'rgba(0,0,0,0.75)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'flex-start', justifyContent:'center',
      zIndex:9999,
      paddingTop: 70,       // ✅ clears the top navbar
      paddingBottom: 16,
      paddingLeft: 226,     // ✅ clears the left sidebar
      paddingRight: 16,
      overflowY: 'auto',
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        background: t.bg, borderRadius: 20,
        width: '100%', maxWidth: 800,
        border: `1px solid ${t.border}`,
        boxShadow: darkMode ? '0 32px 80px rgba(0,0,0,0.8)' : '0 12px 48px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        marginBottom: 16,
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: `1px solid ${t.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: t.text, margin: 0 }}>
              🎬 Manage Screens — {theatre.name}
            </h2>
            <p style={{ fontSize: 12, color: t.sub, margin: '3px 0 0' }}>
              {theatre.location}, {theatre.city} &bull;&nbsp;
              <strong style={{ color: t.text }}>{screenList.length} screen{screenList.length !== 1 ? 's' : ''}</strong>
              &nbsp;&bull;&nbsp;
              <strong style={{ color: '#00c853' }}>{totalSeats} total seats</strong>
            </p>
          </div>
          <button onClick={onClose} style={{
            background: darkMode ? 'rgba(255,255,255,0.07)' : '#f0f0f5',
            border: 'none', borderRadius: 8, width: 34, height: 34,
            cursor: 'pointer', color: t.sub, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><FiX size={18} /></button>
        </div>

        {/* Screen list */}
        <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>

          {screenList.map((screen, idx) => {
            const color = screenColors[idx % screenColors.length];
            return (
              <div key={idx} style={{
                background: t.card,
                border: `1px solid ${t.border}`,
                borderLeft: `4px solid ${color}`,
                borderRadius: 14, padding: 20, marginBottom: 16,
              }}>
                {/* Screen header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: `${color}20`, border: `1.5px solid ${color}44`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FiMonitor size={16} color={color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: color }}>
                        Screen {screen.number}
                      </div>
                      <div style={{ fontSize: 11, color: t.sub }}>
                        {screen.totalSeats} seats &bull; {(screen.format || []).join(', ')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: screen.status === 'Active' ? 'rgba(0,200,83,0.12)' : 'rgba(229,51,93,0.12)',
                      color: screen.status === 'Active' ? '#00c853' : '#e5335d',
                    }}>{screen.status}</span>
                    {screenList.length > 1 && (
                      <button onClick={() => removeScreen(idx)} style={{
                        background: 'rgba(229,51,93,0.1)', border: '1px solid rgba(229,51,93,0.3)',
                        borderRadius: 6, padding: '5px 8px', color: '#e5335d', cursor: 'pointer',
                      }}><FiTrash2 size={13} /></button>
                    )}
                  </div>
                </div>

                {/* Fields grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {/* Screen name */}
                  <div>
                    <label style={{ fontSize: 11, color: t.sub, display: 'block', marginBottom: 5 }}>Screen Name</label>
                    <input
                      value={screen.name}
                      onChange={e => updateScreen(idx, 'name', e.target.value)}
                      placeholder="e.g. IMAX Screen, Screen 1"
                      style={inp}
                    />
                  </div>

                  {/* Total seats */}
                  <div>
                    <label style={{ fontSize: 11, color: t.sub, display: 'block', marginBottom: 5 }}>Total Seats</label>
                    <input
                      type="number" min={1}
                      value={screen.totalSeats}
                      onChange={e => updateScreen(idx, 'totalSeats', Number(e.target.value))}
                      style={inp}
                    />
                  </div>

                  {/* Status */}
                  <div>
                    <label style={{ fontSize: 11, color: t.sub, display: 'block', marginBottom: 5 }}>Status</label>
                    <select value={screen.status} onChange={e => updateScreen(idx, 'status', e.target.value)} style={inp}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Formats */}
                  <div>
                    <label style={{ fontSize: 11, color: t.sub, display: 'block', marginBottom: 5 }}>
                      Formats Supported
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {FORMAT_OPTIONS.map(fmt => {
                        const active = (screen.format || []).includes(fmt);
                        return (
                          <button
                            key={fmt}
                            type="button"
                            onClick={() => toggleFormat(idx, fmt)}
                            style={{
                              padding: '4px 10px', borderRadius: 6,
                              fontSize: 11, fontWeight: 700, cursor: 'pointer',
                              fontFamily: 'Outfit,sans-serif',
                              background: active ? `${color}22` : 'transparent',
                              border: `1.5px solid ${active ? color : t.inBorder}`,
                              color: active ? color : t.sub,
                              transition: 'all 0.15s',
                            }}
                          >
                            {fmt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add screen */}
          <button onClick={addScreen} style={{
            width: '100%', padding: '12px',
            background: 'transparent',
            border: `2px dashed ${darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
            borderRadius: 12, color: t.sub, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Outfit,sans-serif',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#e5335d'; e.currentTarget.style.color = '#e5335d'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = darkMode?'rgba(255,255,255,0.15)':'rgba(0,0,0,0.15)'; e.currentTarget.style.color = t.sub; }}
          >
            <FiPlus size={15} /> Add Another Screen
          </button>

          {/* Summary */}
          <div style={{
            marginTop: 16, padding: '14px 16px',
            background: darkMode ? 'rgba(0,200,83,0.06)' : 'rgba(0,200,83,0.04)',
            border: '1px solid rgba(0,200,83,0.2)', borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#00c853', marginBottom: 8 }}>📋 Summary</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {screenList.map((s, idx) => (
                <div key={idx} style={{
                  fontSize: 11, color: t.sub, padding: '6px 10px',
                  background: `${screenColors[idx % screenColors.length]}12`,
                  border: `1px solid ${screenColors[idx % screenColors.length]}33`,
                  borderRadius: 8,
                }}>
                  <span style={{ color: screenColors[idx % screenColors.length], fontWeight: 700 }}>
                    {s.name}
                  </span>
                  <br />
                  {s.totalSeats} seats &bull; {(s.format||[]).join('/')}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginTop: 10, paddingTop: 8, borderTop: `1px solid ${t.border}` }}>
              Total: {screenList.length} screens &bull; {totalSeats} seats
            </div>
          </div>

          {/* Save */}
          <button onClick={handleSave} disabled={saving} style={{
            width: '100%', marginTop: 16, padding: '13px',
            background: saving ? '#555' : 'linear-gradient(135deg,#e5335d,#be123c)',
            border: 'none', borderRadius: 12, color: '#fff',
            fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            fontFamily: 'Outfit,sans-serif',
            boxShadow: saving ? 'none' : '0 4px 16px rgba(229,51,93,0.4)',
          }}>
            {saving ? '⏳ Saving...' : `✅ Save ${screenList.length} Screen${screenList.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main AdminTheatres ────────────────────────────────────────────────────────
const AdminTheatres = () => {
  const { darkMode } = useOutletContext();
  const [theatres,     setTheatres]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [screenModal,  setScreenModal]  = useState(null);
  const [editing,      setEditing]      = useState(null);
  const [form,         setForm]         = useState(EMPTY);
  const [saving,       setSaving]       = useState(false);

  const t = {
    text:        darkMode ? '#f1f5f9'                : '#111111',
    sub:         darkMode ? '#94a3b8'                : '#666666',
    cardBg:      darkMode ? 'rgba(255,255,255,0.04)' : '#ffffff',
    border:      darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
    rowHover:    darkMode ? 'rgba(229,51,93,0.06)'   : 'rgba(229,51,93,0.04)',
    theadBg:     darkMode ? 'rgba(255,255,255,0.04)' : '#f8f8fb',
    theadText:   darkMode ? '#94a3b8'                : '#888888',
    inputBg:     darkMode ? 'rgba(255,255,255,0.05)' : '#f5f5f8',
    inputBorder: darkMode ? 'rgba(255,255,255,0.1)'  : '#e0e0e0',
    tdText:      darkMode ? '#cbd5e1'                : '#333333',
    modalBg:     darkMode ? '#12122a'                : '#ffffff',
    shadow:      darkMode ? '0 24px 60px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.12)',
  };

  const inputStyle = {
    width: '100%', background: darkMode ? 'rgba(255,255,255,0.06)' : '#f5f5f8',
    border: `1.5px solid ${t.inputBorder}`, borderRadius: 10,
    padding: '10px 14px', color: t.text, fontSize: 13,
    fontFamily: 'Outfit,sans-serif', outline: 'none',
  };

  const fetchTheatres = () => {
    setLoading(true);
    theatreAPI.getAll()
      .then(({ data }) => { setTheatres(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchTheatres(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setShowModal(true); };
  const openEdit   = (th) => {
    setForm({ ...th, amenities: th.amenities?.join(', ') || '' });
    setEditing(th._id); setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.location) return toast.error('Name and location required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        amenities:  form.amenities.split(',').map(s => s.trim()).filter(Boolean),
        screens:    Number(form.screens),
        totalSeats: Number(form.totalSeats),
      };
      editing
        ? await theatreAPI.update(editing, payload)
        : await theatreAPI.create(payload);
      toast.success(editing ? 'Theatre updated' : 'Theatre added');
      setShowModal(false); fetchTheatres();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this theatre?')) return;
    await theatreAPI.delete(id);
    toast.success('Theatre deleted'); fetchTheatres();
  };

  const filtered = theatres.filter(th =>
    th.name?.toLowerCase().includes(search.toLowerCase()) ||
    th.location?.toLowerCase().includes(search.toLowerCase())
  );

  const screenColors = ['#e5335d','#a855f7','#00b0ff','#ffb300','#00c853','#ec4899','#f97316','#06b6d4'];

  return (
    <div>
      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:t.text }}>🏟️ Theatres</h1>
          <p style={{ color:t.sub, fontSize:13, marginTop:4 }}>Manage theatre locations &amp; screens</p>
        </div>
        <button onClick={openCreate} style={{
          display:'flex', alignItems:'center', gap:8,
          background:'linear-gradient(135deg,#e5335d,#be123c)',
          color:'#fff', border:'none', borderRadius:10,
          padding:'10px 18px', fontSize:13, fontWeight:700,
          cursor:'pointer', fontFamily:'Outfit,sans-serif',
          boxShadow:'0 4px 14px rgba(229,51,93,0.35)',
        }}>
          <FiPlus size={15}/> Add Theatre
        </button>
      </div>

      {/* Table */}
      <div style={{ background:t.cardBg, border:`1px solid ${t.border}`, borderRadius:14, overflow:'hidden', boxShadow: darkMode?'0 4px 24px rgba(0,0,0,0.3)':'0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ padding:'14px 20px', borderBottom:`1px solid ${t.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:14, fontWeight:600, color:t.text }}>Theatres ({filtered.length})</span>
          <div style={{ display:'flex', alignItems:'center', gap:8, background:t.inputBg, border:`1px solid ${t.inputBorder}`, borderRadius:8, padding:'8px 14px', width:240 }}>
            <FiSearch size={14} color={t.sub}/>
            <input placeholder="Search theatres..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{ background:'none', border:'none', outline:'none', color:t.text, fontFamily:'Outfit,sans-serif', fontSize:13, flex:1 }}/>
            {search && <button onClick={()=>setSearch('')} style={{ background:'none',border:'none',cursor:'pointer',color:t.sub,display:'flex',padding:0 }}><FiX size={13}/></button>}
          </div>
        </div>

        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:t.theadBg }}>
                {['Theatre','Location','Screens','Total Seats','Status','Actions'].map(h=>(
                  <th key={h} style={{ padding:'10px 16px', fontSize:11, fontWeight:600, color:t.theadText, textAlign:'left', textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:`1px solid ${t.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign:'center',padding:40 }}>
                  <div style={{ width:32,height:32,border:'3px solid rgba(229,51,93,0.2)',borderTopColor:'#e5335d',borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'auto' }}/>
                </td></tr>
              ) : filtered.length===0 ? (
                <tr><td colSpan={6} style={{ textAlign:'center',padding:40,color:t.sub }}>No theatres found</td></tr>
              ) : filtered.map(th => (
                <tr key={th._id}
                  style={{ borderTop:`1px solid ${t.border}`, transition:'background 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background=t.rowHover}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ fontWeight:600, fontSize:13, color:t.text }}>{th.name}</div>
                    {th.amenities?.length > 0 && (
                      <div style={{ fontSize:10, color:t.sub, marginTop:2 }}>{th.amenities.join(' · ')}</div>
                    )}
                  </td>
                  <td style={{ padding:'12px 16px', color:t.sub, fontSize:13 }}>{th.location}, {th.city}</td>

                  {/* Screens column — show individual screen badges */}
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:4, maxWidth:200 }}>
                      {th.screenList?.length > 0
                        ? th.screenList.map((s, idx) => (
                          <span key={idx} style={{
                            fontSize:10, fontWeight:700,
                            padding:'2px 8px', borderRadius:6,
                            background:`${screenColors[idx%screenColors.length]}18`,
                            border:`1px solid ${screenColors[idx%screenColors.length]}44`,
                            color: screenColors[idx%screenColors.length],
                            whiteSpace:'nowrap',
                          }}>
                            {s.name}
                          </span>
                        ))
                        : <span style={{ fontSize:13, fontWeight:700, color:t.text }}>{th.screens}</span>
                      }
                    </div>
                  </td>

                  <td style={{ padding:'12px 16px', color:t.tdText }}>{th.totalSeats}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{
                      background: th.status==='Active'?'rgba(0,200,83,0.12)':'rgba(229,51,93,0.12)',
                      color: th.status==='Active'?'#00c853':'#e5335d',
                      padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700,
                    }}>{th.status}</span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      {/* Manage screens button */}
                      <button onClick={()=>setScreenModal(th)} title="Manage Screens"
                        style={{ background:'rgba(168,85,247,0.1)', border:'1px solid rgba(168,85,247,0.3)', borderRadius:6, padding:'5px 10px', color:'#a855f7', cursor:'pointer' }}>
                        <FiMonitor size={13}/>
                      </button>
                      <button onClick={()=>openEdit(th)} title="Edit"
                        style={{ background:'rgba(0,176,255,0.1)', border:'1px solid rgba(0,176,255,0.3)', borderRadius:6, padding:'5px 10px', color:'#00b0ff', cursor:'pointer' }}>
                        <FiEdit2 size={13}/>
                      </button>
                      <button onClick={()=>handleDelete(th._id)} title="Delete"
                        style={{ background:'rgba(229,51,93,0.1)', border:'1px solid rgba(229,51,93,0.3)', borderRadius:6, padding:'5px 10px', color:'#e5335d', cursor:'pointer' }}>
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

      {/* Add/Edit Theatre Modal */}
      {showModal && (
        <div onClick={()=>setShowModal(false)} style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.7)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:20 }}>
          <div onClick={e=>e.stopPropagation()} style={{ background:t.modalBg,borderRadius:18,padding:28,width:'100%',maxWidth:460,maxHeight:'90vh',overflowY:'auto',border:`1px solid ${t.border}`,boxShadow:t.shadow, marginLeft:'auto', marginRight:'auto' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22 }}>
              <h2 style={{ fontSize:18,fontWeight:800,color:t.text,margin:0 }}>{editing?'Edit Theatre':'Add Theatre'}</h2>
              <button onClick={()=>setShowModal(false)} style={{ background:'none',border:'none',color:t.sub,cursor:'pointer' }}><FiX size={20}/></button>
            </div>
            <form onSubmit={handleSave}>
              {[
                { key:'name',       label:'Theatre Name *',             placeholder:'PVR Nexus Mall' },
                { key:'location',   label:'Location / Area *',          placeholder:'Anna Nagar' },
                { key:'city',       label:'City',                        placeholder:'Chennai' },
                { key:'screens',    label:'Number of Screens',           placeholder:'4',   type:'number' },
                { key:'totalSeats', label:'Total Seats',                 placeholder:'200', type:'number' },
                { key:'amenities',  label:'Amenities (comma separated)', placeholder:'Dolby Atmos, 4K, IMAX' },
              ].map(({ key, label, placeholder, type='text' }) => (
                <div key={key} style={{ marginBottom:14 }}>
                  <label style={{ display:'block',fontSize:12,fontWeight:600,color:t.sub,marginBottom:6 }}>{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key]||''}
                    onChange={e=>setForm({...form,[key]:e.target.value})} style={inputStyle}/>
                </div>
              ))}
              <div style={{ marginBottom:16, padding:'10px 14px', background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.25)', borderRadius:8, fontSize:12, color:'#a855f7' }}>
                💡 After adding the theatre, click the <strong>🖥 purple monitor icon</strong> to configure individual screens (Screen 1, Screen 2...) with names, seats &amp; formats.
              </div>
              <div style={{ marginBottom:20 }}>
                <label style={{ display:'block',fontSize:12,fontWeight:600,color:t.sub,marginBottom:6 }}>Status</label>
                <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} style={inputStyle}>
                  <option>Active</option><option>Inactive</option>
                </select>
              </div>
              <div style={{ display:'flex',gap:10 }}>
                <button type="button" onClick={()=>setShowModal(false)}
                  style={{ flex:1,padding:'11px',borderRadius:10,border:`1px solid ${t.border}`,background:'transparent',color:t.text,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Outfit,sans-serif' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex:1,padding:'11px',borderRadius:10,border:'none',background:'linear-gradient(135deg,#e5335d,#be123c)',color:'#fff',fontSize:13,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontFamily:'Outfit,sans-serif',opacity:saving?0.7:1 }}>
                  {saving?'Saving…':editing?'Update':'Add Theatre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Screen Manager Modal */}
      {screenModal && (
        <ScreenModal
          theatre={screenModal}
          darkMode={darkMode}
          onClose={()=>setScreenModal(null)}
          onSaved={fetchTheatres}
        />
      )}
    </div>
  );
};

export default AdminTheatres;