import React, { useEffect, useState, useRef } from 'react';
import { movieAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiImage, FiExternalLink } from 'react-icons/fi';
import { useOutletContext } from 'react-router-dom';

// ── TMDB API key (read-only, safe for browser use) ────────────────────────────
const TMDB_KEY = 'f9d3601b4e5455409d43249a785239b1';

const EMPTY = {
  title: '', description: '', genre: '', language: '',
  duration: '', releaseDate: '', poster: '', banner: '',
  trailer: '', rating: '', status: 'Now Showing', format: ''
};

// ── SafeImage with fallback chain ─────────────────────────────────────────────
const SafeImage = ({ src, alt, style }) => {
  const [srcIndex, setSrcIndex] = useState(0);
  const [loaded,   setLoaded]   = useState(false);

  const sources = (() => {
    if (!src) return [];
    const enc = encodeURIComponent(src);
    return [
      src,
      `https://images.weserv.nl/?url=${enc}&w=200&h=300&fit=cover`,
      `https://wsrv.nl/?url=${enc}&w=200&h=300`,
    ];
  })();

  useEffect(() => { setSrcIndex(0); setLoaded(false); }, [src]);

  if (!src || srcIndex >= sources.length) {
    return (
      <div style={{ ...style, background: 'linear-gradient(135deg,#1e1e3a,#2a1a2e)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <FiImage size={16} color="#e5335d" />
        <span style={{ fontSize: 8, color: '#555', textAlign: 'center', padding: '0 4px' }}>{alt?.substring(0, 12)}</span>
      </div>
    );
  }

  return (
    <div style={{ ...style, position: 'relative', overflow: 'hidden', background: '#1a1a2e' }}>
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg,#1a1a2e 25%,#252545 50%,#1a1a2e 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
      )}
      <img
        src={sources[srcIndex]} alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => { setLoaded(false); setSrcIndex(i => i + 1); }}
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
      />
    </div>
  );
};

// ── Pick best trailer — 7-level priority ─────────────────────────────────────
const pickBestTrailer = (videos = []) => {
  if (!videos.length) return '';
  const checks = [
    v => v.site === 'YouTube' && v.type === 'Trailer'   && v.official === true,
    v => v.site === 'YouTube' && v.type === 'Trailer',
    v => v.site === 'YouTube' && v.type === 'Teaser'    && v.official === true,
    v => v.site === 'YouTube' && v.type === 'Teaser',
    v => v.site === 'YouTube' && v.type === 'Clip',
    v => v.site === 'YouTube' && v.type === 'Featurette',
    v => v.site === 'YouTube',
  ];
  for (const check of checks) {
    const found = videos.find(check);
    if (found) return `https://www.youtube.com/watch?v=${found.key}`;
  }
  return '';
};

// ── TMDB Search — calls TMDB directly from browser (bypasses blocked backend) ─
const TMDBSearch = ({ darkMode, onSelect, t }) => {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open,    setOpen]    = useState(false);
  const debounceRef = useRef(null);

  const search = (val) => {
    setQuery(val);
    if (!val.trim()) { setResults([]); setOpen(false); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        // ✅ Direct browser → TMDB (backend network is blocked, browser is not)
        const res = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_KEY}&query=${encodeURIComponent(val)}&include_adult=false&language=en-US&page=1`,
          { headers: { accept: 'application/json' } }
        );
        if (!res.ok) throw new Error(`TMDB ${res.status}`);
        const data = await res.json();
        setResults((data.results || []).slice(0, 8));
        setOpen(true);
      } catch (err) {
        toast.error('TMDB search failed — check your internet connection');
        console.error('TMDB search:', err.message);
      }
      setLoading(false);
    }, 400);
  };

  const pick = async (movie) => {
    setOpen(false);
    setQuery('');
    setLoading(true);
    try {
      // ✅ Two parallel calls: details + all videos (catches regional trailers)
      const [detailsRes, videosRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_KEY}&append_to_response=videos,credits&language=en-US`, { headers: { accept: 'application/json' } }),
        fetch(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${TMDB_KEY}`, { headers: { accept: 'application/json' } }),
      ]);
      if (!detailsRes.ok) throw new Error(`TMDB ${detailsRes.status}`);

      const data       = await detailsRes.json();
      const videosData = videosRes.ok ? await videosRes.json() : { results: [] };

      // Merge + deduplicate all videos from both calls
      const allVideos = [
        ...(data.videos?.results || []),
        ...(videosData.results   || []),
      ].filter((v, i, arr) => arr.findIndex(x => x.key === v.key) === i);

      // Find best trailer using 7-level priority
      let trailerUrl = pickBestTrailer(allVideos);

      // If TMDB has zero videos → fallback to YouTube search link
      if (!trailerUrl) {
        const ytQ = encodeURIComponent(`${data.title || movie.title} official trailer`);
        trailerUrl = `https://www.youtube.com/results?search_query=${ytQ}`;
      }

      const genres    = data.genres?.map(g => g.name) || [];
      const languages = data.spoken_languages?.map(l => l.english_name) || [];

      onSelect({
        tmdbId:      data.id,
        title:       data.title      || '',
        description: data.overview   || '',
        poster:      data.poster_path   ? `https://image.tmdb.org/t/p/w500${data.poster_path}`       : '',
        banner:      data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : '',
        trailer:     trailerUrl,
        genre:       genres,
        language:    languages.length > 0 ? languages : ['English'],
        duration:    data.runtime      || 0,
        rating:      data.vote_average ? parseFloat(data.vote_average.toFixed(1)) : 0,
        releaseDate: data.release_date || '',
      });

      if (trailerUrl.includes('results?search_query')) {
        toast.success(`✅ "${data.title}" filled! No trailer on TMDB — YouTube search link added.`);
      } else {
        toast.success(`✅ "${data.title}" auto-filled including trailer!`);
      }
    } catch (err) {
      toast.error('Failed to load TMDB details');
      console.error('TMDB details:', err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ marginBottom: 20, position: 'relative' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#ffb300', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        🎬 Auto-fill from TMDB
        <span style={{ fontSize: 10, color: t.sub, fontWeight: 400 }}>— search and all fields fill automatically</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: darkMode ? 'rgba(255,179,0,0.07)' : 'rgba(255,179,0,0.06)', border: `1.5px solid ${open ? '#ffb300' : 'rgba(255,179,0,0.35)'}`, borderRadius: 10, padding: '10px 14px', transition: 'border-color 0.2s' }}>
        {loading
          ? <div style={{ width: 14, height: 14, border: '2px solid rgba(255,179,0,0.3)', borderTopColor: '#ffb300', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
          : <FiSearch size={14} color="#ffb300" style={{ flexShrink: 0 }} />
        }
        <input
          placeholder="Search TMDB — e.g. Interstellar, RRR, Kumki 2..."
          value={query}
          onChange={e => search(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          style={{ background: 'none', border: 'none', outline: 'none', color: t.text, fontFamily: 'Outfit, sans-serif', fontSize: 13, flex: 1 }}
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults([]); setOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.sub, display: 'flex', padding: 0 }}>
            <FiX size={13} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 999, background: darkMode ? '#1a1a2e' : '#ffffff', border: `1px solid ${darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: 12, marginTop: 4, boxShadow: '0 12px 40px rgba(0,0,0,0.25)', maxHeight: 340, overflowY: 'auto' }}>
          {results.map(r => (
            <div key={r.id} onClick={() => pick(r)}
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = darkMode ? 'rgba(255,179,0,0.08)' : 'rgba(255,179,0,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: 36, height: 50, borderRadius: 6, overflow: 'hidden', flexShrink: 0, background: '#1a1a2e' }}>
                {r.poster_path
                  ? <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} alt={r.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiImage size={14} color="#555" /></div>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>
                  {r.release_date ? r.release_date.substring(0, 4) : 'N/A'}
                  {r.vote_average > 0 && <span style={{ marginLeft: 8, color: '#ffb300' }}>⭐ {r.vote_average.toFixed(1)}</span>}
                </div>
              </div>
              <span style={{ fontSize: 10, color: '#ffb300', fontWeight: 700, flexShrink: 0 }}>SELECT →</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AdminMovies = () => {
  const { darkMode } = useOutletContext();
  const [movies,        setMovies]        = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [tab,           setTab]           = useState('Now Showing');
  const [showModal,     setShowModal]     = useState(false);
  const [editing,       setEditing]       = useState(null);
  const [form,          setForm]          = useState(EMPTY);
  const [saving,        setSaving]        = useState(false);
  const [posterPreview, setPosterPreview] = useState('');
  const [tmdbFilled,    setTmdbFilled]    = useState(false);

  const t = {
    text:        darkMode ? '#f1f5f9'                : '#111111',
    sub:         darkMode ? '#94a3b8'                : '#666666',
    cardBg:      darkMode ? 'rgba(255,255,255,0.04)' : '#ffffff',
    border:      darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)',
    rowHover:    darkMode ? 'rgba(229,51,93,0.06)'   : 'rgba(229,51,93,0.04)',
    theadBg:     darkMode ? 'rgba(255,255,255,0.04)' : '#f8f8fb',
    theadText:   darkMode ? '#94a3b8'                : '#888888',
    inputBg:     darkMode ? 'rgba(255,255,255,0.06)' : '#f5f5f8',
    inputBorder: darkMode ? 'rgba(255,255,255,0.1)'  : '#e0e0e0',
    inputText:   darkMode ? '#f1f5f9'                : '#111111',
    tabInactive: darkMode ? 'rgba(255,255,255,0.05)' : '#f0f0f5',
    tabText:     darkMode ? '#94a3b8'                : '#555555',
    tdText:      darkMode ? '#cbd5e1'                : '#333333',
    modalBg:     darkMode ? '#12122a'                : '#ffffff',
    shadow:      darkMode ? '0 24px 60px rgba(0,0,0,0.6)' : '0 8px 32px rgba(0,0,0,0.12)',
    previewBg:   darkMode ? 'rgba(255,255,255,0.03)' : '#f8f8fb',
    summaryBg:   darkMode ? 'rgba(229,51,93,0.06)'  : 'rgba(229,51,93,0.04)',
  };

  const inputStyle = {
    width: '100%',
    background: t.inputBg,
    border: `1.5px solid ${t.inputBorder}`,
    borderRadius: 10, padding: '10px 14px',
    color: t.inputText, fontSize: 13,
    fontFamily: 'Outfit, sans-serif', outline: 'none',
    transition: 'border-color 0.2s', boxSizing: 'border-box',
  };

  const fetchMovies = () => {
    setLoading(true);
    movieAPI.getAll()
      .then(({ data }) => { setMovies(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchMovies(); }, []);

  const openCreate = () => {
    setForm(EMPTY); setEditing(null);
    setPosterPreview(''); setTmdbFilled(false);
    setShowModal(true);
  };

  const openEdit = (m) => {
    setForm({
      title:       m.title                                              || '',
      description: m.description                                        || '',
      poster:      m.poster                                             || '',
      banner:      m.banner                                             || '',
      trailer:     m.trailer                                            || '',
      genre:       Array.isArray(m.genre)    ? m.genre.join(', ')      : (m.genre    || ''),
      language:    Array.isArray(m.language) ? m.language.join(', ')   : (m.language || ''),
      format:      Array.isArray(m.format)   ? m.format.join(', ')     : (m.format   || ''),
      duration:    m.duration  != null ? String(m.duration)            : '',
      rating:      m.rating    != null ? String(m.rating)              : '',
      releaseDate: m.releaseDate ? m.releaseDate.split('T')[0]         : '',
      status:      m.status                                             || 'Now Showing',
    });
    setPosterPreview(m.poster || m.banner || '');
    setEditing(m._id); setTmdbFilled(false);
    setShowModal(true);
  };

  const handleTMDBSelect = (tmdbData) => {
    const release = tmdbData.releaseDate ? new Date(tmdbData.releaseDate) : null;
    const today   = new Date();
    let status    = 'Now Showing';
    if (release) {
      const diff = (release - today) / (1000 * 60 * 60 * 24);
      if (diff > 30) status = 'Coming Soon';
      else if (diff > 0) status = 'Upcoming';
    }
    setForm({
      title:       tmdbData.title       || '',
      description: tmdbData.description || '',
      poster:      tmdbData.poster      || '',
      banner:      tmdbData.banner      || '',
      trailer:     tmdbData.trailer     || '',
      genre:       Array.isArray(tmdbData.genre)    ? tmdbData.genre.join(', ')    : '',
      language:    Array.isArray(tmdbData.language) ? tmdbData.language.join(', ') : '',
      format:      '2D, IMAX 2D',
      duration:    String(tmdbData.duration || ''),
      rating:      String(tmdbData.rating   || ''),
      releaseDate: tmdbData.releaseDate || '',
      status,
    });
    setPosterPreview(tmdbData.poster || tmdbData.banner || '');
    setTmdbFilled(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Movie title is required');
    setSaving(true);
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim(),
        poster:      form.poster.trim(),
        banner:      form.banner.trim(),
        trailer:     form.trailer.trim(),
        genre:       form.genre.split(',').map(s => s.trim()).filter(Boolean),
        language:    form.language.split(',').map(s => s.trim()).filter(Boolean),
        format:      form.format.split(',').map(s => s.trim()).filter(Boolean),
        duration:    Number(form.duration)  || 0,
        rating:      Number(form.rating)    || 0,
        releaseDate: form.releaseDate       || null,
        status:      form.status,
      };
      if (editing) {
        await movieAPI.update(editing, payload);
        toast.success('✅ Movie updated successfully!');
      } else {
        await movieAPI.create(payload);
        toast.success('✅ Movie added — now visible to users!');
      }
      setShowModal(false); fetchMovies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving movie');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this movie? This cannot be undone.')) return;
    try { await movieAPI.delete(id); toast.success('Movie deleted'); fetchMovies(); }
    catch { toast.error('Failed to delete movie'); }
  };

  const TABS     = ['Now Showing', 'Upcoming', 'Coming Soon'];
  const filtered = movies.filter(m =>
    m.status === tab && m.title?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = {
    'Now Showing': { color: '#00c853', bg: 'rgba(0,200,83,0.12)'  },
    'Upcoming':    { color: '#00b0ff', bg: 'rgba(0,176,255,0.12)' },
    'Coming Soon': { color: '#ff9800', bg: 'rgba(255,152,0,0.12)' },
  };

  const FIELDS = [
    { key: 'title',       label: 'Movie Title *',              placeholder: 'e.g. Avengers: Endgame' },
    { key: 'poster',      label: '🖼 Poster URL',              placeholder: 'https://image.tmdb.org/t/p/w500/...' },
    { key: 'banner',      label: '🎞 Banner URL (wide image)', placeholder: 'https://image.tmdb.org/t/p/original/...' },
    { key: 'trailer',     label: '🎬 Trailer URL (YouTube)',   placeholder: 'https://www.youtube.com/watch?v=...' },
    { key: 'genre',       label: 'Genre (comma separated)',    placeholder: 'Action, Drama, Sci-Fi' },
    { key: 'language',    label: 'Language (comma separated)', placeholder: 'Hindi, English, Tamil' },
    { key: 'format',      label: 'Format (comma separated)',   placeholder: '2D, IMAX 2D, 4DX' },
    { key: 'duration',    label: 'Duration (minutes)',         placeholder: '180', type: 'number' },
    { key: 'rating',      label: 'Rating (0-10)',              placeholder: '8.5', type: 'number' },
    { key: 'releaseDate', label: 'Release Date',               type: 'date' },
  ];

  // ── Is trailer a real YouTube watch URL? ─────────────────────────────────
  const isRealTrailer = (url) => url && url.includes('youtube.com/watch?v=');
  const isSearchFallback = (url) => url && url.includes('results?search_query');

  return (
    <div>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.96) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .adm-input:focus { border-color: rgba(229,51,93,0.6) !important; box-shadow: 0 0 0 3px rgba(229,51,93,0.1) !important; }
        select option { color: #111 !important; background: #fff !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: t.text }}>🎬 Movies</h1>
          <p style={{ color: t.sub, fontSize: 13, marginTop: 4 }}>Manage movies — {movies.length} total</p>
        </div>
        <button onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#e5335d,#be123c)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', boxShadow: '0 4px 14px rgba(229,51,93,0.4)', transition: 'transform 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <FiPlus size={15} /> Add Movie
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, background: t.tabInactive, borderRadius: 10, padding: 4, marginBottom: 20, width: 'fit-content', border: `1px solid ${t.border}` }}>
        {TABS.map(tp => (
          <button key={tp} onClick={() => setTab(tp)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', background: tab === tp ? '#e5335d' : 'transparent', color: tab === tp ? '#fff' : t.tabText }}>{tp}</button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: darkMode ? '0 4px 24px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${t.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Movies ({filtered.length})</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: t.inputBg, border: `1px solid ${t.inputBorder}`, borderRadius: 8, padding: '8px 14px', width: 260 }}>
            <FiSearch size={14} color={t.sub} />
            <input placeholder="Search movie..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'none', border: 'none', outline: 'none', color: t.inputText, fontFamily: 'Outfit, sans-serif', fontSize: 13, flex: 1 }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.sub, display: 'flex', padding: 0 }}><FiX size={13} /></button>}
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: t.theadBg }}>
                {['Movie', 'Release Date', 'Language', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 600, color: t.theadText, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: `1px solid ${t.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48 }}>
                  <div style={{ width: 32, height: 32, border: '3px solid rgba(229,51,93,0.2)', borderTopColor: '#e5335d', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: 'auto' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48 }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🎬</div>
                  <div style={{ color: t.sub, fontSize: 14 }}>No movies found in "{tab}"</div>
                </td></tr>
              ) : filtered.map(movie => {
                const sc   = statusColors[movie.status] || { color: '#888', bg: 'rgba(0,0,0,0.1)' };
                const ytId = movie.trailer?.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/)?.[1];
                return (
                  <tr key={movie._id} style={{ borderTop: `1px solid ${t.border}`, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = t.rowHover}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                          <SafeImage src={movie.poster || movie.banner} alt={movie.title} style={{ width: 44, height: 58, borderRadius: 8 }} />
                          {ytId && (
                            <div onClick={e => { e.stopPropagation(); window.open(movie.trailer, '_blank'); }}
                              style={{ position: 'absolute', bottom: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#e5335d', border: '2px solid #0d0d18', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}>
                              <div style={{ width: 0, height: 0, borderTop: '3px solid transparent', borderBottom: '3px solid transparent', borderLeft: '5px solid #fff', marginLeft: 1 }} />
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, color: t.text }}>{movie.title}</div>
                          <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>{movie.genre?.join(', ')}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                            {movie.poster  && <span style={{ fontSize: 9, fontWeight: 700, color: '#00b0ff', background: 'rgba(0,176,255,0.1)', borderRadius: 4, padding: '1px 5px' }}>🖼 IMG</span>}
                            {ytId          && <span style={{ fontSize: 9, fontWeight: 700, color: '#e5335d', background: 'rgba(229,51,93,0.1)', borderRadius: 4, padding: '1px 5px' }}>🎬 TRAILER</span>}
                            {movie.rating > 0 && <span style={{ fontSize: 9, fontWeight: 700, color: '#ffb300', background: 'rgba(255,179,0,0.1)', borderRadius: 4, padding: '1px 5px' }}>⭐ {movie.rating}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: t.sub }}>{movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString('en-IN') : 'TBA'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: t.tdText }}>{movie.language?.join(', ')}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: sc.bg, color: sc.color, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{movie.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(movie)} style={{ background: 'rgba(0,176,255,0.1)', border: '1px solid rgba(0,176,255,0.3)', borderRadius: 6, padding: '6px 10px', color: '#00b0ff', cursor: 'pointer' }}><FiEdit2 size={13} /></button>
                        {ytId && <button onClick={() => window.open(movie.trailer, '_blank')} style={{ background: 'rgba(229,51,93,0.1)', border: '1px solid rgba(229,51,93,0.3)', borderRadius: 6, padding: '6px 10px', color: '#e5335d', cursor: 'pointer' }}><FiExternalLink size={13} /></button>}
                        <button onClick={() => handleDelete(movie._id)} style={{ background: 'rgba(229,51,93,0.1)', border: '1px solid rgba(229,51,93,0.3)', borderRadius: 6, padding: '6px 10px', color: '#e5335d', cursor: 'pointer' }}><FiTrash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: t.modalBg, borderRadius: 18, padding: '28px 28px 24px', width: '100%', maxWidth: 560, maxHeight: '92vh', overflowY: 'auto', border: `1px solid ${t.border}`, boxShadow: t.shadow, animation: 'modalIn 0.25s ease' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: t.text, margin: 0 }}>{editing ? '✏️ Edit Movie' : '➕ Add New Movie'}</h2>
                <div style={{ fontSize: 11, color: t.sub, marginTop: 3 }}>{editing ? 'Update movie details below' : 'Search TMDB to auto-fill all fields instantly'}</div>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: darkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', color: t.sub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FiX size={18} />
              </button>
            </div>

            {!editing && (
              <>
                <TMDBSearch darkMode={darkMode} onSelect={handleTMDBSelect} t={t} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
                  <div style={{ flex: 1, height: 1, background: t.border }} />
                  <span style={{ fontSize: 11, color: t.sub, fontWeight: 600 }}>or fill manually</span>
                  <div style={{ flex: 1, height: 1, background: t.border }} />
                </div>
              </>
            )}

            {tmdbFilled && (
              <div style={{ marginBottom: 14, padding: '8px 14px', background: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 8, fontSize: 12, color: '#00c853', fontWeight: 600 }}>
                ✅ All fields auto-filled from TMDB — review and save, or edit any field below
              </div>
            )}

            {posterPreview && (
              <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14, background: t.previewBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: 12 }}>
                <SafeImage src={posterPreview} alt="Poster preview" style={{ width: 48, height: 64, borderRadius: 8, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 2 }}>🖼 Poster Preview</div>
                  <div style={{ fontSize: 10, color: t.sub, wordBreak: 'break-all', lineHeight: 1.4 }}>
                    {posterPreview.length > 70 ? posterPreview.substring(0, 70) + '...' : posterPreview}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSave}>
              {FIELDS.map(({ key, label, placeholder, type = 'text' }) => (
                <div key={key} style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.sub, marginBottom: 6 }}>{label}</label>
                  <input className="adm-input" type={type} placeholder={placeholder} value={form[key] || ''}
                    onChange={e => { const val = e.target.value; setForm(prev => ({ ...prev, [key]: val })); if (key === 'poster') setPosterPreview(val); }}
                    style={inputStyle}
                  />

                  {key === 'poster'  && form.poster  && <div style={{ marginTop: 4, fontSize: 10, color: '#00b0ff' }}>🖼 Poster URL saved ✓</div>}
                  {key === 'banner'  && form.banner  && <div style={{ marginTop: 4, fontSize: 10, color: '#00b0ff' }}>🎞 Banner URL saved ✓</div>}

                  {/* ── Trailer status indicator ── */}
                  {key === 'trailer' && form.trailer && (
                    <div style={{ marginTop: 6 }}>
                      {isSearchFallback(form.trailer) ? (
                        <div style={{ background: 'rgba(255,152,0,0.1)', border: '1px solid rgba(255,152,0,0.3)', borderRadius: 6, padding: '8px 10px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                          <span style={{ fontSize: 14, flexShrink: 0 }}>⚠️</span>
                          <div>
                            <div style={{ fontSize: 10, fontWeight: 700, color: '#ff9800', marginBottom: 2 }}>No trailer found on TMDB — YouTube search link added</div>
                            <div style={{ fontSize: 10, color: '#aaa', marginBottom: 6 }}>Click below → find the correct trailer → copy its URL → paste it in the field above</div>
                            <button type="button" onClick={() => window.open(form.trailer, '_blank')}
                              style={{ background: 'rgba(255,152,0,0.15)', border: '1px solid rgba(255,152,0,0.3)', borderRadius: 4, padding: '4px 10px', color: '#ff9800', fontSize: 10, fontWeight: 700, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <FiExternalLink size={10} /> Search YouTube for trailer
                            </button>
                          </div>
                        </div>
                      ) : isRealTrailer(form.trailer) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 10, color: '#00c853' }}>✅ YouTube trailer URL saved</span>
                          <button type="button" onClick={() => window.open(form.trailer, '_blank')}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e5335d', fontSize: 10, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'Outfit, sans-serif', padding: 0 }}>
                            <FiExternalLink size={10} /> Preview
                          </button>
                        </div>
                      ) : (
                        <div style={{ fontSize: 10, color: '#00b0ff' }}>🎬 Trailer URL saved ✓</div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.sub, marginBottom: 6 }}>Description</label>
                <textarea rows={3} placeholder="Brief description of the movie..." value={form.description || ''}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="adm-input" style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: t.sub, marginBottom: 6 }}>Status</label>
                <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))} className="adm-input" style={inputStyle}>
                  <option>Now Showing</option>
                  <option>Upcoming</option>
                  <option>Coming Soon</option>
                </select>
              </div>

              {/* Summary */}
              <div style={{ background: t.summaryBg, border: '1px solid rgba(229,51,93,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#e5335d', marginBottom: 8 }}>📋 Data to be saved:</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
                  {[
                    ['🎬 Title',   form.title   ? '✅ ' + form.title.substring(0, 20)       : '❌ Not set'],
                    ['🖼 Poster',  form.poster  ? '✅ URL set'                              : '⚠️ Not set'],
                    ['🎞 Banner',  form.banner  ? '✅ URL set'                              : '⚠️ Not set'],
                    ['📹 Trailer', isRealTrailer(form.trailer)     ? '✅ YouTube URL'
                                : isSearchFallback(form.trailer)  ? '⚠️ Search link (replace)'
                                : form.trailer                     ? '✅ URL set'
                                :                                    '⚠️ Not set'],
                    ['🎭 Genre',   form.genre   ? '✅ ' + form.genre.substring(0, 20)       : '❌ Not set'],
                    ['⭐ Rating',  form.rating  ? '✅ ' + form.rating + '/10'               : '⚠️ Not set'],
                  ].map(([lbl, val]) => (
                    <div key={lbl} style={{ fontSize: 10, color: val.startsWith('✅') ? '#00c853' : val.startsWith('❌') ? '#e5335d' : '#ffb300', marginBottom: 2 }}>
                      <span style={{ color: t.sub }}>{lbl}: </span>{val}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: `1px solid ${t.border}`, background: 'transparent', color: t.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving || !form.title.trim()}
                  style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: saving ? '#666' : 'linear-gradient(135deg,#e5335d,#be123c)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: (saving || !form.title.trim()) ? 'not-allowed' : 'pointer', fontFamily: 'Outfit, sans-serif', opacity: !form.title.trim() ? 0.6 : 1, boxShadow: saving ? 'none' : '0 4px 14px rgba(229,51,93,0.35)' }}>
                  {saving ? '⏳ Saving...' : editing ? '✅ Update Movie' : '➕ Add Movie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMovies;