import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { movieAPI } from '../utils/api';
import {
  FiFilter, FiChevronRight, FiStar, FiHeart,
  FiLock, FiPlay, FiX,
} from 'react-icons/fi';

const FORMATS   = ['All', '2D', 'IMAX 2D', '4DX', 'MX4D'];
const LANGUAGES = ['All', 'Hindi', 'English', 'Tamil', 'Telugu', 'Kannada'];
const GENRES    = ['All', 'Action', 'Sci-Fi', 'Drama', 'Thriller', 'Comedy', 'Horror', 'Adventure', 'Romance'];

// Extract YouTube video ID from any YouTube URL format
const extractYouTubeId = (url) => {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
};

// Cinematic BG with Ken Burns animation using movie's banner/poster
const CinematicBg = ({ movie, animKey }) => {
  const src = movie?.banner || movie?.poster ||
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400&h=600&fit=crop&q=80';
  return (
    <div key={animKey} style={{ position:'absolute', inset:0, zIndex:1, overflow:'hidden' }}>
      <img src={src} alt=""
        style={{ width:'110%', height:'110%', objectFit:'cover', filter:'brightness(0.42) saturate(1.3)', animation:'kenBurns 8s ease-out forwards', transformOrigin:'center center' }}
        onError={e => { e.target.src = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1400&h=600&fit=crop&q=80'; }}
      />
    </div>
  );
};

// Movie Card
const MovieCard = ({ movie, onBookClick, darkMode }) => {
  const [liked, setLiked]       = useState(false);
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();
  const fallback = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&h=200&fit=crop';

  const statusColor = {
    'Now Showing': { bg:'#e5335d', label:'● LIVE' },
    'Upcoming':    { bg:'#00b0ff', label:'📅 UPCOMING' },
    'Coming Soon': { bg:'#ff9800', label:'🔜 SOON' },
  }[movie.status] || { bg:'#666', label:movie.status };

  return (
    <div
      onClick={() => navigate(`/movie/${movie._id}`)}
      style={{ flexShrink:0, width:210, borderRadius:14, overflow:'hidden', cursor:'pointer', border: darkMode ? '1px solid #2a2a3a' : '1px solid #e0e0e0', background: darkMode ? '#12121a' : '#ffffff', transition:'transform 0.22s, box-shadow 0.22s, background 0.3s', boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.08)' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-5px)'; e.currentTarget.style.boxShadow='0 16px 44px rgba(229,51,93,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
    >
      <div style={{ position:'relative', height:140, overflow:'hidden' }}>
        <img
          src={imgError ? fallback : (movie.poster || fallback)}
          alt={movie.title}
          onError={() => setImgError(true)}
          style={{ width:'100%', height:'100%', objectFit:'cover' }}
        />
        <div style={{ position:'absolute', top:8, left:8, background:statusColor.bg, borderRadius:5, padding:'2px 8px', fontSize:9, fontWeight:800, color:'#fff' }}>{statusColor.label}</div>
        {movie.rating > 0 && (
          <div style={{ position:'absolute', top:8, right:8, background:'rgba(0,0,0,0.82)', borderRadius:6, padding:'3px 8px', display:'flex', alignItems:'center', gap:3, fontSize:11, fontWeight:700, color:'#ffb300' }}>
            <FiStar size={10} fill="#ffb300" color="#ffb300"/> {movie.rating}
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); setLiked(!liked); }} style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.7)', border:'none', borderRadius:'50%', width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
          <FiHeart size={12} color={liked?'#e5335d':'#fff'} fill={liked?'#e5335d':'none'}/>
        </button>
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'50%', background:'linear-gradient(to top,rgba(0,0,0,0.9),transparent)' }}/>
      </div>
      <div style={{ padding:'10px 12px 12px' }}>
        <div style={{ fontWeight:700, fontSize:13, color: darkMode ? '#fff' : '#111', marginBottom:3, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{movie.title}</div>
        <div style={{ fontSize:11, color:'#9999bb', marginBottom:3 }}>{movie.genre?.slice(0,2).join(', ')}</div>
        <div style={{ fontSize:10, color:'#555577', marginBottom:9 }}>{movie.language?.slice(0,2).join(', ')}{movie.format?.length > 0 ? ` • ${movie.format.slice(0,2).join(', ')}` : ''}</div>
        <button
          style={{ width:'100%', background:'linear-gradient(135deg,#e5335d,#ff4d6d)', color:'#fff', border:'none', borderRadius:7, padding:'7px 0', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'Poppins' }}
          onClick={e => { e.stopPropagation(); onBookClick(movie._id); }}
        >Book Tickets</button>
      </div>
    </div>
  );
};

// Feature Modal
const FEATURE_DATA = {
  'Secure Booking':       { icon:'🔒', color:'#e5335d', points:['256-bit SSL encryption on all transactions','PCI-DSS compliant payment processing','No card details stored on our servers','Instant refund on failed transactions','Verified partners: Stripe & Razorpay','100% money-back guarantee on cancellations'], footer:'Your payment is fully protected with bank-level security.' },
  'Instant Confirmation': { icon:'⚡', color:'#f59e0b', points:['Booking confirmed in under 3 seconds','Instant email confirmation with e-ticket','SMS alert sent immediately after booking','QR code ticket ready for entry','No waiting — seats reserved instantly','Real-time seat availability updates'], footer:'Your ticket is generated instantly — no delays, no hassle.' },
  '24/7 Support':         { icon:'🎧', color:'#3b82f6', points:['Live chat support available 24/7','Email: support@bookmyshow.com','Phone: 1800-123-4567 (toll free)','Average response time: under 2 minutes','Dedicated booking issue resolution team','Help available in 10+ regional languages'], footer:'We are always here to help you with any booking issue.' },
  'Exclusive Offers':     { icon:'🎁', color:'#10b981', points:['🎬 FIRST50 — 50% off on your first booking','💳 HDFC20 — 20% off with HDFC credit cards','🎟️ BOGO — Buy 1 Get 1 on weekday shows','👑 PREMIUM15 — 15% off on IMAX & 4DX','🎂 BDAY30 — 30% off on your birthday month','📱 APP10 — Extra 10% off on mobile app'], footer:'Use these codes at checkout to save on your bookings!' },
};

const FeatureModal = ({ title, onClose }) => {
  const c = FEATURE_DATA[title];
  if (!c) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(6px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:20 }}>
      <div onClick={e => e.stopPropagation()} style={{ background:'#12121a',border:'1px solid #2a2a3a',borderRadius:20,padding:32,width:'100%',maxWidth:440,boxShadow:'0 24px 60px rgba(0,0,0,0.8)',animation:'modalIn 0.25s ease' }}>
        <div style={{ display:'flex',alignItems:'center',gap:14,marginBottom:24 }}>
          <div style={{ width:52,height:52,borderRadius:14,background:`${c.color}22`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,flexShrink:0 }}>{c.icon}</div>
          <h2 style={{ fontSize:18,fontWeight:800,color:'#fff',margin:0,flex:1 }}>{title}</h2>
          <button onClick={onClose} style={{ background:'rgba(255,255,255,0.07)',border:'none',borderRadius:8,width:32,height:32,cursor:'pointer',color:'#aaa',display:'flex',alignItems:'center',justifyContent:'center' }}><FiX size={16}/></button>
        </div>
        <div style={{ display:'flex',flexDirection:'column',gap:11,marginBottom:20 }}>
          {c.points.map((pt,i) => (
            <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:10 }}>
              <div style={{ width:20,height:20,borderRadius:'50%',flexShrink:0,background:`${c.color}22`,display:'flex',alignItems:'center',justifyContent:'center',marginTop:1 }}>
                <div style={{ width:6,height:6,borderRadius:'50%',background:c.color }}/>
              </div>
              <span style={{ fontSize:13,color:'#ccc',lineHeight:1.55 }}>{pt}</span>
            </div>
          ))}
        </div>
        <div style={{ background:`${c.color}18`,border:`1px solid ${c.color}40`,borderRadius:10,padding:'12px 16px',fontSize:13,color:c.color,fontWeight:600,textAlign:'center',marginBottom:16 }}>{c.footer}</div>
        <button onClick={onClose} style={{ width:'100%',padding:'12px',background:c.color,color:'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Poppins' }}>Got it!</button>
      </div>
    </div>
  );
};

// Accent colors for hero slides
const ACCENTS = ['#e5335d','#ff6b35','#a855f7','#00b0ff','#ffb300','#10b981'];

// Home Page
const Home = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [allMovies,    setAllMovies]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [activeFormat, setActiveFormat] = useState('All');
  const [activeLang,   setActiveLang]   = useState('All');
  const [activeGenre,  setActiveGenre]  = useState('All');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [tab,          setTab]          = useState('Now Showing');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [animating,    setAnimating]    = useState(false);
  const [bgKey,        setBgKey]        = useState(0);
  const [showPrompt,   setShowPrompt]   = useState(false);
  const [activeModal,  setActiveModal]  = useState(null);
  const slideTimer = useRef(null);
  const navigate   = useNavigate();
  const { userInfo } = useSelector(state => state.auth);

  // Sync darkMode with Navbar toggle
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      setDarkMode(theme !== 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    // Set initial
    const theme = document.documentElement.getAttribute('data-theme');
    setDarkMode(theme !== 'light');
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    movieAPI.getAll()
      .then(({ data }) => { setAllMovies(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // Use Now Showing movies as hero slides
  const heroMovies = allMovies.filter(m => m.status === 'Now Showing').slice(0, 5);
  // Fallback to first 3 movies if no Now Showing
  const slides = heroMovies.length > 0 ? heroMovies : allMovies.slice(0, 3);

  const startTimer = () => {
    clearInterval(slideTimer.current);
    if (slides.length > 1) {
      slideTimer.current = setInterval(() => changeSlide(s => (s + 1) % slides.length), 7000);
    }
  };

  useEffect(() => {
    if (slides.length > 0) startTimer();
    return () => clearInterval(slideTimer.current);
  }, [slides.length]); // eslint-disable-line

  const changeSlide = (indexOrFn) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrentSlide(prev => {
        const next = typeof indexOrFn === 'function' ? indexOrFn(prev) : indexOrFn;
        return Math.max(0, Math.min(next, slides.length - 1));
      });
      setBgKey(k => k + 1);
      setAnimating(false);
    }, 500);
    startTimer();
  };

  const handleBookClick = (movieId) => {
    if (!userInfo) {
      setShowPrompt(true);
      setTimeout(() => { setShowPrompt(false); navigate('/login', { state: { from:`/movie/${movieId}` } }); }, 2000);
    } else {
      navigate(`/movie/${movieId}`);
    }
  };

  const resetFilters = () => { setActiveGenre('All'); setActiveFormat('All'); setActiveLang('All'); setSearchQuery(''); };

  const nowShowingMovies = allMovies.filter(m => m.status === 'Now Showing');
  const upcomingMovies   = allMovies.filter(m => m.status === 'Upcoming');
  const comingSoonMovies = allMovies.filter(m => m.status === 'Coming Soon');

  const tabSource = tab === 'Now Showing' ? nowShowingMovies : tab === 'Upcoming' ? upcomingMovies : comingSoonMovies;
  const filtered  = tabSource.filter(m => {
    const genreMatch  = activeGenre  === 'All' || m.genre?.includes(activeGenre);
    const formatMatch = activeFormat === 'All' || m.format?.includes(activeFormat);
    const langMatch   = activeLang   === 'All' || m.language?.includes(activeLang);
    const searchMatch = !searchQuery || m.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return genreMatch && formatMatch && langMatch && searchMatch;
  });

  const slide  = slides[Math.min(currentSlide, slides.length - 1)];
  const accent = slide ? (ACCENTS[currentSlide % ACCENTS.length]) : '#e5335d';
  const ytId   = slide ? extractYouTubeId(slide.trailer) : null;

  const FEATURES = [
    { icon:'🔒', title:'Secure Booking',       desc:'100% secure payments' },
    { icon:'⚡', title:'Instant Confirmation', desc:'Get your tickets instantly' },
    { icon:'🎧', title:'24/7 Support',         desc:"We're here to help you" },
    { icon:'🎁', title:'Exclusive Offers',     desc:'Best deals & discounts' },
  ];

  return (
    <div style={{ minHeight:'100vh', background: darkMode ? '#0d0d18' : '#f5f5f8', color: darkMode ? '#fff' : '#111', fontFamily:'Poppins, sans-serif', transition:'background 0.3s, color 0.3s' }}>
      <style>{`
        @keyframes kenBurns { from{transform:scale(1.08)} to{transform:scale(1)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeOut  { from{opacity:1} to{opacity:0;transform:translateY(-14px)} }
        @keyframes progress { from{width:0%} to{width:100%} }
        @keyframes pulse    { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.45);opacity:0.55} }
        @keyframes live     { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes slideDown{ from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn  { from{opacity:0;transform:scale(0.93)} to{opacity:1;transform:scale(1)} }
        @keyframes shimmer  { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .text-in  { animation: fadeUp  0.7s ease 0.1s both; }
        .text-out { animation: fadeOut 0.5s ease both; }
        .hscroll::-webkit-scrollbar { height:4px; }
        .hscroll::-webkit-scrollbar-thumb { background:rgba(229,51,93,0.35); border-radius:2px; }
        .feat-card { transition:transform 0.2s, box-shadow 0.2s, border-color 0.2s; cursor:pointer; }
        .feat-card:hover { transform:translateY(-3px); }
      `}</style>

      <Navbar />

      {/* Login prompt toast */}
      {showPrompt && (
        <div style={{ position:'fixed',top:80,left:'50%',transform:'translateX(-50%)',background:'#1a1a2e',border:'1px solid rgba(229,51,93,0.5)',borderRadius:12,padding:'14px 24px',display:'flex',alignItems:'center',gap:12,zIndex:9999,boxShadow:'0 12px 40px rgba(0,0,0,0.6)',animation:'slideDown 0.3s ease',minWidth:340 }}>
          <div style={{ width:36,height:36,borderRadius:'50%',background:'rgba(229,51,93,0.15)',border:'1px solid rgba(229,51,93,0.4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
            <FiLock size={16} color="#e5335d"/>
          </div>
          <div>
            <div style={{ fontSize:14,fontWeight:700,color:'#fff' }}>Login Required</div>
            <div style={{ fontSize:12,color:'#9999bb',marginTop:2 }}>Please log in to book tickets. Redirecting...</div>
          </div>
        </div>
      )}

      {/* ════════════ HERO SLIDER ════════════ */}
      <div style={{ position:'relative', height:560, overflow:'hidden', background:'#000' }}>

        {/* Cinematic background — uses movie's banner or poster from DB */}
        {slide && <CinematicBg movie={slide} animKey={bgKey}/>}

        {/* Gradients */}
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(to right,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.5) 52%,rgba(0,0,0,0.08) 100%)',zIndex:2 }}/>
        <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(13,13,24,1) 0%,rgba(13,13,24,0.15) 38%,transparent 60%)',zIndex:2 }}/>
        <div style={{ position:'absolute',inset:0,background:`radial-gradient(ellipse 50% 65% at 80% 35%,${accent}20 0%,transparent 65%)`,zIndex:2,transition:'background 0.8s' }}/>
        <div style={{ position:'absolute',inset:0,background:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.05) 3px,rgba(0,0,0,0.05) 4px)',zIndex:3,pointerEvents:'none' }}/>

        {/* Slide dots */}
        {slides.length > 1 && (
          <div style={{ position:'absolute',left:22,top:'50%',transform:'translateY(-50%)',display:'flex',flexDirection:'column',gap:12,zIndex:10 }}>
            {slides.map((_,i) => (
              <div key={i} onClick={() => changeSlide(i)} style={{ width:i===currentSlide?9:6, height:i===currentSlide?9:6, borderRadius:'50%', background:i===currentSlide?accent:'rgba(255,255,255,0.28)', cursor:'pointer', transition:'all 0.3s', boxShadow:i===currentSlide?`0 0 12px ${accent}`:'none', animation:i===currentSlide?'pulse 2s infinite':'none' }}/>
            ))}
          </div>
        )}

        {/* Arrows */}
        {slides.length > 1 && (
          <>
            <button onClick={() => changeSlide(s => (s - 1 + slides.length) % slides.length)}
              style={{ position:'absolute',left:48,top:'50%',transform:'translateY(-50%)',width:40,height:40,borderRadius:'50%',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.18)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',zIndex:10,fontSize:20,transition:'background 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.background=`${accent}66`}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'}
            >‹</button>
            <button onClick={() => changeSlide(s => (s + 1) % slides.length)}
              style={{ position:'absolute',right:24,top:'50%',transform:'translateY(-50%)',width:40,height:40,borderRadius:'50%',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.18)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',zIndex:10,fontSize:20,transition:'background 0.2s' }}
              onMouseEnter={e=>e.currentTarget.style.background=`${accent}66`}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'}
            >›</button>
          </>
        )}

        {/* Hero content */}
        {slide && (
          <div style={{ position:'absolute',inset:0,zIndex:5,maxWidth:1200,margin:'0 auto',width:'100%',padding:'0 70px 0 90px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:40 }}>

            {/* LEFT */}
            <div className={animating?'text-out':'text-in'} style={{ flex:'0 0 auto',maxWidth:530 }}>
              <div style={{ display:'inline-flex',alignItems:'center',gap:6,background:'rgba(229,51,93,0.2)',border:'1px solid rgba(229,51,93,0.55)',borderRadius:20,padding:'5px 14px',fontSize:11,color:'#e5335d',fontWeight:800,marginBottom:16,letterSpacing:1,animation:'live 2s infinite' }}>
                <div style={{ width:6,height:6,borderRadius:'50%',background:'#e5335d' }}/> NOW SHOWING
              </div>

              <h1 style={{ fontSize:52,fontWeight:900,lineHeight:1.06,marginBottom:14,color:'#fff',letterSpacing:-1,textShadow:'0 2px 32px rgba(0,0,0,0.9)' }}>
                {slide.title}
              </h1>

              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:16,flexWrap:'wrap' }}>
                {slide.genre?.slice(0,3).map(g => (
                  <span key={g} style={{ background:'rgba(255,255,255,0.09)',border:'1px solid rgba(255,255,255,0.16)',borderRadius:6,padding:'3px 10px',fontSize:11,color:'rgba(255,255,255,0.85)',fontWeight:600 }}>{g}</span>
                ))}
                {slide.rating > 0 && (
                  <span style={{ display:'flex',alignItems:'center',gap:4,color:'#ffb300',fontWeight:700,fontSize:13 }}>
                    <FiStar size={12} fill="#ffb300"/> {slide.rating}/10
                  </span>
                )}
                {slide.duration > 0 && <span style={{ color:'rgba(255,255,255,0.45)',fontSize:12 }}>⏱ {slide.duration} min</span>}
                {slide.language?.length > 0 && <span style={{ color:'rgba(255,255,255,0.55)',fontSize:12 }}>🌐 {slide.language[0]}</span>}
              </div>

              {slide.description && (
                <p style={{ color:'rgba(255,255,255,0.52)',fontSize:14,lineHeight:1.8,marginBottom:30,maxWidth:460,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden' }}>
                  {slide.description}
                </p>
              )}

              <div style={{ display:'flex',gap:12 }}>
                {/* Watch Trailer — uses movie's trailer URL from DB, opens YouTube in new tab */}
                <button
                  onClick={() => {
                    if (slide.trailer) {
                      window.open(slide.trailer, '_blank');
                    } else {
                      window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(slide.title + ' official trailer')}`, '_blank');
                    }
                  }}
                  style={{ display:'inline-flex',alignItems:'center',gap:8,background:accent,color:'#fff',border:'none',borderRadius:10,padding:'13px 26px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Poppins',boxShadow:`0 8px 28px ${accent}55`,transition:'transform 0.2s,opacity 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.opacity='0.9';}}
                  onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.opacity='1';}}
                >
                  <FiPlay size={16} fill="#fff"/> Watch Trailer
                </button>

                <button
                  onClick={() => handleBookClick(slide._id)}
                  style={{ display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.1)',color:'#fff',border:'1px solid rgba(255,255,255,0.24)',borderRadius:10,padding:'13px 26px',fontSize:14,fontWeight:700,cursor:'pointer',fontFamily:'Poppins',backdropFilter:'blur(8px)',transition:'all 0.2s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background=accent;e.currentTarget.style.borderColor=accent;}}
                  onMouseLeave={e=>{e.currentTarget.style.background='rgba(255,255,255,0.1)';e.currentTarget.style.borderColor='rgba(255,255,255,0.24)';}}
                >
                  🎟 Book Ticket
                </button>
              </div>
            </div>

            {/* RIGHT — poster card + thumbnails */}
            <div style={{ flex:'0 0 auto',display:'flex',flexDirection:'column',alignItems:'flex-end',gap:14 }}>

              {/* Poster with YouTube thumbnail overlay if trailer exists */}
              <div style={{ position:'relative', width:170, height:235 }}>
                <div style={{ width:'100%',height:'100%',borderRadius:18,overflow:'hidden',boxShadow:`0 24px 64px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.08),0 0 30px ${accent}33`,border:`2px solid ${accent}55`,transition:'all 0.4s',animation:animating?'none':'fadeUp 0.7s ease 0.3s both' }}>
                  <img
                                        src={slide.poster || slide.banner || 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=450&fit=crop'}
                    alt={slide.title}
                    style={{ width:'100%',height:'100%',objectFit:'cover' }}
                    onError={e => { e.target.src='https://images.unsplash.com/photo-1635805737707-575885ab0820?w=300&h=450&fit=crop'; }}
                  />
                </div>
                {/* YouTube thumbnail preview on poster if trailer exists */}
                {ytId && (
                  <div
                    onClick={() => window.open(slide.trailer, '_blank')}
                    style={{ position:'absolute',bottom:-10,right:-10,width:80,height:56,borderRadius:10,overflow:'hidden',border:`2px solid ${accent}`,boxShadow:`0 4px 16px rgba(0,0,0,0.6)`,cursor:'pointer' }}
                    title="Watch Trailer"
                  >
                    <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="trailer" style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                    <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                      <div style={{ width:22,height:22,borderRadius:'50%',background:'rgba(229,51,93,0.9)',display:'flex',alignItems:'center',justifyContent:'center' }}>
                        <FiPlay size={10} fill="#fff" color="#fff"/>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Now playing badge */}
              <div style={{ display:'flex',alignItems:'center',gap:8,background:'rgba(0,0,0,0.7)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'9px 14px',backdropFilter:'blur(12px)' }}>
                <div style={{ width:7,height:7,borderRadius:'50%',background:'#e5335d',animation:'pulse 1.5s infinite' }}/>
                <span style={{ fontSize:10,fontWeight:800,color:'#fff',letterSpacing:0.8 }}>NOW PLAYING</span>
                <span style={{ fontSize:10,color:'#9999bb',maxWidth:110,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{slide.title}</span>
              </div>

              {/* Slide thumbnails */}
              {slides.length > 1 && (
                <div style={{ display:'flex',gap:8 }}>
                  {slides.map((s,i) => (
                    <div key={s._id} onClick={() => changeSlide(i)} title={s.title} style={{ width:62,height:40,borderRadius:8,overflow:'hidden',cursor:'pointer',border:`2px solid ${i===currentSlide?accent:'rgba(255,255,255,0.18)'}`,transition:'all 0.3s',transform:i===currentSlide?'scale(1.12)':'scale(1)',opacity:i===currentSlide?1:0.5,boxShadow:i===currentSlide?`0 0 14px ${accent}66`:'none' }}>
                      <img
                        src={s.poster || s.banner || 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=100&h=60&fit=crop'}
                        alt={s.title}
                        style={{ width:'100%',height:'100%',objectFit:'cover' }}
                        onError={e => { e.target.src='https://images.unsplash.com/photo-1635805737707-575885ab0820?w=100&h=60&fit=crop'; }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div style={{ position:'absolute',bottom:0,left:0,right:0,height:3,background:'rgba(255,255,255,0.08)',zIndex:10 }}>
          <div key={bgKey} style={{ height:'100%',background:accent,animation:'progress 7s linear forwards',borderRadius:'0 2px 2px 0' }}/>
        </div>
      </div>

      {/* ════════════ SEARCH + GENRE ════════════ */}
      <div style={{ background: darkMode ? '#0d0d18' : '#ffffff', borderBottom: darkMode ? '1px solid #1a1a2e' : '1px solid #e0e0e0', padding:'18px 40px', transition:'background 0.3s' }}>
        <div style={{ maxWidth:1200,margin:'0 auto' }}>
          <div style={{ marginBottom:14 }}>
            <div style={{ display:'inline-flex',alignItems:'center',gap:8,background: darkMode ? '#1a1a26' : '#fff', border: darkMode ? '1px solid #2a2a3a' : '1px solid #ddd', borderRadius:10, padding:'10px 16px', minWidth:340 }}>
              <span style={{ fontSize:14,color:'#666688' }}>🔍</span>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search movies..." style={{ background:'none', border:'none', outline:'none', color: darkMode ? '#fff' : '#111', fontSize:13, width:'100%', fontFamily:'Poppins' }}/>
              {searchQuery && <button onClick={() => setSearchQuery('')} style={{ background:'none',border:'none',cursor:'pointer',color:'#666688',display:'flex',alignItems:'center' }}><FiX size={14}/></button>}
            </div>
          </div>
          <div style={{ display:'flex',gap:8,flexWrap:'wrap',alignItems:'center' }}>
            {GENRES.map(g => (
              <button key={g} onClick={() => setActiveGenre(g)} style={{ padding:'6px 16px',borderRadius:20,border:'1px solid',borderColor:activeGenre===g?'#e5335d':'#2a2a3a',background:activeGenre===g?'#e5335d':'rgba(255,255,255,0.04)',color:activeGenre===g?'#fff':'#9999bb',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Poppins',transition:'all 0.18s' }}>{g}</button>
            ))}
            <div style={{ width:1,height:22,background:'#2a2a3a',margin:'0 4px' }}/>
            <FiFilter size={14} color="#9999bb"/>
            {FORMATS.map(f => (
              <button key={f} onClick={() => setActiveFormat(f)} style={{ padding:'5px 14px',borderRadius:20,border:'1px solid',borderColor:activeFormat===f?'#e5335d':'#2a2a3a',background:activeFormat===f?'rgba(229,51,93,0.15)':'transparent',color:activeFormat===f?'#e5335d':'#9999bb',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Poppins',transition:'all 0.18s' }}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════ TABS ════════════ */}
      <div style={{ background: darkMode ? '#0d0d18' : '#ffffff', padding:'12px 40px', borderBottom: darkMode ? '1px solid #1a1a2e' : '1px solid #e0e0e0', transition:'background 0.3s' }}>
        <div style={{ maxWidth:1200,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:10 }}>
          <div style={{ display:'flex',gap:6 }}>
            {[{ label:'Now Showing',icon:'▶',count:nowShowingMovies.length },{ label:'Upcoming',icon:'📅',count:upcomingMovies.length },{ label:'Coming Soon',icon:'🕐',count:comingSoonMovies.length }].map(({ label,icon,count }) => (
              <button key={label} onClick={() => { setTab(label); resetFilters(); }} style={{ padding:'9px 20px',borderRadius:10,border:'none',cursor:'pointer',fontFamily:'Poppins',fontSize:13,fontWeight:600,transition:'all 0.2s',background:tab===label?'#e5335d': darkMode ? 'rgba(255,255,255,0.05)' : '#f0f0f5', color:tab===label?'#fff': darkMode ? '#9999bb' : '#555',display:'flex',alignItems:'center',gap:6 }}>
                <span>{icon}</span> {label}
                <span style={{ background:tab===label?'rgba(255,255,255,0.25)':'rgba(255,255,255,0.1)',borderRadius:10,padding:'1px 7px',fontSize:10,fontWeight:800 }}>{count}</span>
              </button>
            ))}
          </div>
          <select value={activeLang} onChange={e => setActiveLang(e.target.value)} style={{ background: darkMode ? '#1a1a2a' : '#f0f0f5', border: darkMode ? '1px solid #2a2a3a' : '1px solid #ddd', borderRadius:20, padding:'7px 16px', color: darkMode ? '#9999bb' : '#555', fontSize:13, fontFamily:'Poppins', cursor:'pointer', outline:'none' }}>
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* ════════════ MOVIE GRID ════════════ */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'28px 24px' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22 }}>
          <h2 style={{ fontSize:18, fontWeight:800, color: darkMode ? '#fff' : '#111', display:'flex', alignItems:'center', gap:8 }}>
            {tab==='Now Showing'?'🎬':tab==='Coming Soon'?'🔜':'🎭'}
            <span>{tab}</span>
            <span style={{ color:'#666688',fontWeight:400 }}>in</span>
            <span style={{ color:'#e5335d' }}>Chennai</span>
          </h2>
          <div style={{ display:'flex',alignItems:'center',gap:10 }}>
            <span style={{ fontSize:12,color:'#555577' }}>{filtered.length} movie{filtered.length !== 1 ? 's' : ''}</span>
            {(activeGenre !== 'All' || activeFormat !== 'All' || activeLang !== 'All' || searchQuery) && (
              <button onClick={resetFilters} style={{ fontSize:11,color:'#e5335d',background:'rgba(229,51,93,0.1)',border:'1px solid rgba(229,51,93,0.3)',borderRadius:6,padding:'3px 10px',cursor:'pointer',fontFamily:'Poppins',fontWeight:600 }}>Clear Filters</button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ display:'flex',gap:16,overflowX:'auto',paddingBottom:8 }}>
            {[...Array(5)].map((_,i) => <div key={i} style={{ flexShrink:0,width:210,height:240,borderRadius:14,background:'linear-gradient(90deg,#1a1a26 25%,#22223a 50%,#1a1a26 75%)',backgroundSize:'200% 100%',animation:'shimmer 1.5s infinite' }}/>)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center',padding:'60px 20px',color:'#666688' }}>
            <div style={{ fontSize:52,marginBottom:16 }}>🎬</div>
            <h3 style={{ fontSize:18,color:'#9999bb',marginBottom:8 }}>No movies found</h3>
            <p style={{ fontSize:13,marginBottom:20 }}>{searchQuery ? `No results for "${searchQuery}".` : 'Try changing your filters.'}</p>
            <button onClick={resetFilters} style={{ padding:'9px 22px',background:'#e5335d',color:'#fff',border:'none',borderRadius:9,cursor:'pointer',fontFamily:'Poppins',fontWeight:700,fontSize:13 }}>Clear Filters</button>
          </div>
        ) : (
          <div className="hscroll" style={{ display:'flex',gap:16,overflowX:'auto',paddingBottom:8 }}>
            {filtered.map(movie => <MovieCard key={movie._id} movie={movie} onBookClick={handleBookClick} darkMode={darkMode}/>)}
          </div>
        )}

        {/* Feature cards */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginTop:52,marginBottom:52 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="feat-card" onClick={() => setActiveModal(f.title)}
              style={{ background: darkMode ? '#12121a' : '#ffffff', border: darkMode ? '1px solid #1e1e2e' : '1px solid #e0e0e0', borderRadius:14, padding:'16px 18px', display:'flex', alignItems:'center', gap:12, boxShadow: darkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.06)' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(229,51,93,0.4)';e.currentTarget.style.boxShadow='0 8px 24px rgba(229,51,93,0.15)';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e1e2e';e.currentTarget.style.boxShadow='none';}}
            >
              <div style={{ width:44,height:44,borderRadius:12,background:'rgba(229,51,93,0.12)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:21,flexShrink:0 }}>{f.icon}</div>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color: darkMode ? '#fff' : '#111', marginBottom:2 }}>{f.title}</div>
                <div style={{ fontSize:11,color:'#9999bb' }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming */}
        {!loading && upcomingMovies.length > 0 && (
          <div>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20 }}>
              <h2 style={{ fontSize:18, fontWeight:800, color: darkMode ? '#fff' : '#111' }}>🎭 Upcoming in Theatres</h2>
              <span onClick={() => { setTab('Upcoming'); resetFilters(); window.scrollTo({ top:600,behavior:'smooth' }); }} style={{ color:'#e5335d',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',gap:4,cursor:'pointer' }}>View All <FiChevronRight size={14}/></span>
            </div>
            <div className="hscroll" style={{ display:'flex',gap:16,overflowX:'auto',paddingBottom:8 }}>
              {upcomingMovies.map(movie => <MovieCard key={movie._id+'up'} movie={movie} onBookClick={handleBookClick} darkMode={darkMode}/>)}
            </div>
          </div>
        )}
      </div>

      <Footer/>
      {activeModal && <FeatureModal title={activeModal} onClose={() => setActiveModal(null)}/>}
    </div>
  );
};

export default Home;