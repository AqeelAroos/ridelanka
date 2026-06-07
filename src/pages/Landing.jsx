import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bike, ChevronDown, ArrowRight, MapPin, AlertTriangle, Wrench, Users } from 'lucide-react';

/* ────────────────────────────────────────
   Hooks
──────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

function CountUp({ to, suffix = '', isActive }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!isActive) return;
    const dur = 1900;
    const t0 = performance.now();
    const run = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setN(Math.floor(eased * to));
      if (p < 1) requestAnimationFrame(run);
      else setN(to);
    };
    requestAnimationFrame(run);
  }, [isActive, to]);
  return <>{n.toLocaleString()}{suffix}</>;
}

/* ────────────────────────────────────────
   Nav
──────────────────────────────────────── */
function LandingNav() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const fn = () => setSolid(window.scrollY > 50);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const navStyle = {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
    height: '64px', display: 'flex', alignItems: 'center',
    padding: '0 clamp(16px, 4vw, 40px)',
    justifyContent: 'space-between',
    transition: 'background 0.35s, border-color 0.35s, backdrop-filter 0.35s',
    background: solid ? 'rgba(10,10,10,0.92)' : 'transparent',
    backdropFilter: solid ? 'blur(14px)' : 'none',
    borderBottom: solid ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
  };

  return (
    <nav style={navStyle}>
      <div className="font-bebas" style={{ display:'flex', alignItems:'center', gap:'9px' }}>
        <Bike size={22} style={{ color:'#FF6B00' }} />
        <span style={{ fontSize:'22px', letterSpacing:'0.06em', color:'#fff' }}>RideLanka</span>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'28px' }}>
        <NavLink to="/login">Log In</NavLink>
        <Link
          to="/register"
          style={{
            background:'#FF6B00', color:'#fff', padding:'8px 22px',
            borderRadius:'8px', fontSize:'13px', fontWeight:600,
            textDecoration:'none', letterSpacing:'0.04em',
            transition:'transform 0.18s, box-shadow 0.18s',
            display:'inline-block',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform='scale(1.03)'; e.currentTarget.style.boxShadow='0 0 28px rgba(255,107,0,0.45)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='scale(1)';   e.currentTarget.style.boxShadow='none'; }}
        >
          SIGN UP
        </Link>
      </div>
    </nav>
  );
}

function NavLink({ to, children }) {
  return (
    <Link to={to} style={{ color:'rgba(255,255,255,0.55)', fontSize:'14px', textDecoration:'none',
      fontFamily:"'DM Sans',sans-serif", fontWeight:400, transition:'color 0.18s' }}
      onMouseEnter={e => e.currentTarget.style.color='#fff'}
      onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.55)'}
    >{children}</Link>
  );
}

/* ────────────────────────────────────────
   Hero
──────────────────────────────────────── */
function HeroSection() {
  return (
    <section style={{
      position:'relative', height:'100dvh', minHeight:'580px',
      display:'flex', flexDirection:'column', justifyContent:'flex-end',
      overflow:'hidden',
    }}>
      {/* background */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:`url('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&q=80')`,
        backgroundSize:'cover', backgroundPosition:'center 40%',
        filter:'brightness(0.25)',
        willChange:'transform',
      }} />
      {/* gradient to black */}
      <div style={{
        position:'absolute', inset:0,
        background:'linear-gradient(to bottom, rgba(10,10,10,0.1) 0%, rgba(10,10,10,0.5) 55%, #0a0a0a 100%)',
      }} />

      {/* content */}
      <div style={{
        position:'relative', zIndex:1,
        padding:'clamp(32px, 6vw, 80px) clamp(20px, 5vw, 80px)',
        maxWidth:'1280px', width:'100%', margin:'0 auto',
        paddingBottom:'clamp(64px, 10vw, 110px)',
      }}>
        {/* eyebrow */}
        <p className="font-dm hero-fadein" style={{
          color:'#FF6B00', letterSpacing:'0.28em', fontSize:'12px',
          fontWeight:500, textTransform:'uppercase', marginBottom:'14px',
          animationDelay:'0.05s',
        }}>
          Sri Lanka Biker Community
        </p>

        {/* giant headline */}
        <h1 className="font-bebas hero-fadein" style={{
          margin:0, lineHeight:0.88, animationDelay:'0.2s',
          fontSize:'clamp(5rem, 14vw, 10rem)',
        }}>
          <span style={{ color:'#fff', display:'block' }}>RIDE</span>
          <span style={{ color:'#FF6B00', display:'block' }}>LANKA</span>
        </h1>

        {/* subtitle */}
        <p className="font-dm hero-fadein" style={{
          color:'rgba(255,255,255,0.52)', lineHeight:1.65,
          fontSize:'clamp(14px, 1.8vw, 18px)', fontWeight:300,
          maxWidth:'500px', margin:'22px 0 38px', animationDelay:'0.4s',
        }}>
          Routes, community &amp; real-time hazard alerts — built for Sri Lankan riders,
          by Sri Lankan riders.
        </p>

        {/* CTA buttons */}
        <div className="hero-fadein" style={{ display:'flex', gap:'14px', flexWrap:'wrap', animationDelay:'0.58s' }}>
          <HeroBtn to="/register" filled>JOIN THE RIDE <ArrowRight size={15} /></HeroBtn>
          <HeroBtn to="/routes">EXPLORE ROUTES</HeroBtn>
        </div>
      </div>

      {/* scroll indicator */}
      <div style={{
        position:'absolute', bottom:'28px', left:'50%',
        animation:'bounceDot 2s ease-in-out infinite',
        display:'flex', flexDirection:'column', alignItems:'center', gap:'6px',
        zIndex:1,
      }}>
        <span className="font-dm" style={{ color:'rgba(255,255,255,0.25)', fontSize:'10px', letterSpacing:'0.22em' }}>
          SCROLL
        </span>
        <ChevronDown size={16} style={{ color:'rgba(255,255,255,0.25)' }} />
      </div>
    </section>
  );
}

function HeroBtn({ to, filled, children }) {
  const base = {
    padding:'13px 30px', fontFamily:"'DM Sans',sans-serif",
    fontWeight:600, fontSize:'14px', letterSpacing:'0.06em',
    textDecoration:'none', borderRadius:'8px',
    display:'inline-flex', alignItems:'center', gap:'8px',
    transition:'transform 0.18s, box-shadow 0.18s, background 0.18s, border-color 0.18s',
    cursor:'pointer',
  };
  const on = filled
    ? { transform:'scale(1.03)', boxShadow:'0 0 36px rgba(255,107,0,0.4)' }
    : { transform:'scale(1.03)', borderColor:'#FF6B00', background:'rgba(255,107,0,0.06)' };
  const off = filled
    ? { transform:'scale(1)', boxShadow:'none' }
    : { transform:'scale(1)', borderColor:'rgba(255,255,255,0.3)', background:'transparent' };

  return (
    <Link to={to} style={{
      ...base,
      ...(filled
        ? { background:'#FF6B00', color:'#fff', border:'1px solid #FF6B00' }
        : { background:'transparent', color:'#fff', border:'1px solid rgba(255,255,255,0.3)' }),
    }}
      onMouseEnter={e => Object.assign(e.currentTarget.style, on)}
      onMouseLeave={e => Object.assign(e.currentTarget.style, off)}
    >
      {children}
    </Link>
  );
}

/* ────────────────────────────────────────
   Stats Bar
──────────────────────────────────────── */
const STATS = [
  { to: 47,   suffix: '+',  label: 'Scenic Routes' },
  { to: 1200, suffix: '+',  label: 'Riders' },
  { to: 9,    suffix: '',   label: 'Provinces' },
  { to: null, display:'24/7', label: 'Hazard Alerts' },
];

function StatsBar() {
  const [ref, inView] = useInView(0.25);
  return (
    <section style={{
      borderTop:'1px solid rgba(255,255,255,0.08)',
      borderBottom:'1px solid rgba(255,255,255,0.08)',
      background:'#0d0d0d',
    }}>
      <div ref={ref} className="l-stats-grid" style={{ maxWidth:'1280px', margin:'0 auto' }}>
        {STATS.map((s, i) => (
          <div key={i} style={{
            padding:'clamp(28px, 5vw, 52px) 24px',
            textAlign:'center',
            borderRight: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none',
          }}>
            <div className="font-bebas" style={{
              fontSize:'clamp(3rem, 6vw, 5rem)', color:'#FF6B00',
              lineHeight:1, marginBottom:'10px',
            }}>
              {s.to !== null
                ? <CountUp to={s.to} suffix={s.suffix} isActive={inView} />
                : s.display}
            </div>
            <div className="font-dm" style={{
              color:'rgba(255,255,255,0.38)', fontSize:'11px',
              letterSpacing:'0.22em', textTransform:'uppercase', fontWeight:500,
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────
   Features
──────────────────────────────────────── */
const FEATURES = [
  {
    num:'01', Icon:MapPin, title:'ROUTE EXPLORER',
    desc:'Discover and share scenic rides from Ella to the coast. Filter by difficulty, region, and distance. Every road rated by a real rider.',
  },
  {
    num:'02', Icon:AlertTriangle, title:'HAZARD MAP',
    desc:'Real-time road condition alerts reported by the community. Potholes, floods, animals and construction — always know what\'s ahead.',
  },
  {
    num:'03', Icon:Wrench, title:'MY GARAGE',
    desc:'Track your bikes, service history and maintenance reminders. Your entire fleet — from the daily rider to the weekend machine.',
  },
  {
    num:'04', Icon:Users, title:'COMMUNITY',
    desc:'Connect with riders, plan meetups, buy and sell gear. The full Sri Lanka biker network in your pocket.',
  },
];

function FeatureCell({ f, i, inView }) {
  const [vis, setVis] = useState(false);
  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setVis(true), i * 110);
    return () => clearTimeout(t);
  }, [inView, i]);

  return (
    <div className="l-feature-cell" style={{
      padding:'clamp(32px, 4vw, 52px) clamp(24px, 4vw, 44px)',
      opacity: vis ? 1 : 0,
      transform: vis ? 'translateY(0)' : 'translateY(38px)',
      transition:'opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'22px' }}>
        <span className="font-bebas" style={{ fontSize:'13px', color:'#FF6B00', letterSpacing:'0.2em' }}>
          {f.num}
        </span>
        <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.08)' }} />
        <f.Icon size={18} style={{ color:'#FF6B00' }} />
      </div>
      <h3 className="font-bebas" style={{
        fontSize:'clamp(1.7rem, 3vw, 2.3rem)', color:'#fff',
        margin:'0 0 14px', letterSpacing:'0.03em', lineHeight:1,
      }}>
        {f.title}
      </h3>
      <p className="font-dm" style={{
        color:'rgba(255,255,255,0.42)', fontSize:'15px',
        lineHeight:1.72, fontWeight:300, margin:0,
      }}>
        {f.desc}
      </p>
    </div>
  );
}

function FeaturesSection() {
  const [ref, inView] = useInView(0.08);
  return (
    <section style={{ padding:'clamp(64px, 8vw, 120px) 0 0', background:'#0a0a0a' }}>
      <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'0 clamp(20px, 5vw, 40px)' }}>
        <p className="font-dm" style={{
          color:'#FF6B00', fontSize:'11px', letterSpacing:'0.28em',
          textTransform:'uppercase', marginBottom:'14px', fontWeight:500,
        }}>
          Built for riders
        </p>
        <h2 className="font-bebas" style={{
          fontSize:'clamp(2.2rem, 5vw, 4rem)', color:'#fff',
          margin:'0 0 clamp(48px, 7vw, 88px)', letterSpacing:'0.02em',
          maxWidth:'720px', lineHeight:1.0,
        }}>
          EVERYTHING A LANKAN<br />RIDER NEEDS
        </h2>
      </div>
      <div ref={ref} className="l-features-grid" style={{ maxWidth:'1280px', margin:'0 auto' }}>
        {FEATURES.map((f, i) => <FeatureCell key={i} f={f} i={i} inView={inView} />)}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────
   Marquee Strip
──────────────────────────────────────── */
const TICK = 'ELLA ROAD  •  KANDY HILLS  •  COASTAL HIGHWAY  •  KNUCKLES RANGE  •  HORTON PLAINS  •  MIRISSA COAST  •  ';

function MarqueeStrip() {
  return (
    <section style={{
      background:'#111',
      borderTop:'1px solid rgba(255,255,255,0.06)',
      borderBottom:'1px solid rgba(255,255,255,0.06)',
      overflow:'hidden', padding:'0', userSelect:'none',
    }}>
      {/* two copies — animate translateX(-50%) to scroll exactly one copy's width */}
      <div style={{
        display:'inline-flex', whiteSpace:'nowrap',
        animation:'marqueeTicker 28s linear infinite',
        padding:'clamp(18px, 3vw, 30px) 0',
      }}>
        {[0, 1].map((k) => (
          <span key={k} className="font-bebas" style={{
            color:'#FF6B00', fontSize:'clamp(2rem, 4vw, 3.4rem)',
            letterSpacing:'0.07em', flexShrink:0, paddingRight:0,
          }}>
            {TICK}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────
   Split Section
──────────────────────────────────────── */
function SplitSection() {
  const [ref, inView] = useInView(0.15);
  const transition = (delay) => `opacity 0.8s ease ${delay}s, transform 0.8s cubic-bezier(0.16,1,0.3,1) ${delay}s`;

  return (
    <section ref={ref} className="l-split" style={{ minHeight:'600px', background:'#0a0a0a' }}>
      {/* image */}
      <div className="l-split-img" style={{ flex:1, overflow:'hidden', minHeight:'420px' }}>
        <img
          src="https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?w=1200&q=80"
          alt="Motorcycle on Sri Lanka road"
          style={{
            width:'100%', height:'100%', objectFit:'cover',
            filter:'brightness(0.75) contrast(1.05)',
            transform: inView ? 'scale(1)' : 'scale(1.07)',
            transition:'transform 1.4s cubic-bezier(0.16,1,0.3,1)',
            display:'block',
          }}
        />
      </div>

      {/* text */}
      <div style={{
        flex:1,
        padding:'clamp(48px, 7vw, 96px) clamp(28px, 6vw, 80px)',
        display:'flex', flexDirection:'column', justifyContent:'center',
        background:'#0f0f0f',
        borderLeft:'1px solid rgba(255,255,255,0.06)',
      }}>
        <p className="font-dm" style={{
          color:'#FF6B00', fontSize:'11px', letterSpacing:'0.28em',
          textTransform:'uppercase', marginBottom:'18px', fontWeight:500,
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(18px)',
          transition: transition(0.15),
        }}>
          For the community
        </p>
        <h2 className="font-bebas" style={{
          fontSize:'clamp(2.4rem, 4.5vw, 3.8rem)', color:'#fff',
          margin:'0 0 22px', lineHeight:0.96, letterSpacing:'0.02em',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(22px)',
          transition: transition(0.3),
        }}>
          FIND YOUR NEXT<br />FAVOURITE ROAD
        </h2>
        <p className="font-dm" style={{
          color:'rgba(255,255,255,0.44)', fontSize:'15px', lineHeight:1.78,
          fontWeight:300, marginBottom:'38px', maxWidth:'400px',
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(22px)',
          transition: transition(0.46),
        }}>
          Every route on RideLanka was shared by a real rider who has been there.
          Discover hidden coastal roads, misty hill country trails, and everything in between —
          all rated and verified by the community.
        </p>
        <div style={{
          opacity: inView ? 1 : 0,
          transform: inView ? 'translateY(0)' : 'translateY(22px)',
          transition: transition(0.6),
        }}>
          <Link to="/register" style={{
            background:'#FF6B00', color:'#fff',
            padding:'13px 30px', fontWeight:600, fontSize:'14px',
            letterSpacing:'0.06em', textDecoration:'none', borderRadius:'8px',
            display:'inline-flex', alignItems:'center', gap:'8px',
            fontFamily:"'DM Sans',sans-serif",
            transition:'transform 0.18s, box-shadow 0.18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform='scale(1.03)'; e.currentTarget.style.boxShadow='0 0 32px rgba(255,107,0,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='scale(1)';   e.currentTarget.style.boxShadow='none'; }}
          >
            START RIDING <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────
   Footer
──────────────────────────────────────── */
function LandingFooter() {
  return (
    <footer style={{
      borderTop:'1px solid rgba(255,255,255,0.07)',
      background:'#0a0a0a',
    }}>
      <div style={{
        maxWidth:'1280px', margin:'0 auto',
        padding:'clamp(32px, 5vw, 52px) clamp(20px, 5vw, 40px)',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        flexWrap:'wrap', gap:'24px',
      }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
            <Bike size={18} style={{ color:'#FF6B00' }} />
            <span className="font-bebas" style={{ fontSize:'19px', letterSpacing:'0.06em', color:'#fff' }}>
              RideLanka
            </span>
          </div>
          <p className="font-dm" style={{
            color:'rgba(255,255,255,0.25)', fontSize:'13px', margin:0, fontWeight:300,
          }}>
            Sri Lanka's biker community platform.
          </p>
        </div>
        <div style={{ display:'flex', gap:'32px' }}>
          {[{ to:'/login', label:'Log In' }, { to:'/register', label:'Sign Up' }].map(({ to, label }) => (
            <Link key={to} to={to} style={{
              color:'rgba(255,255,255,0.35)', fontSize:'14px',
              textDecoration:'none', fontFamily:"'DM Sans',sans-serif",
              transition:'color 0.18s',
            }}
              onMouseEnter={e => e.currentTarget.style.color='#fff'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.35)'}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
      <div style={{
        borderTop:'1px solid rgba(255,255,255,0.05)',
        textAlign:'center', padding:'18px 24px',
      }}>
        <p className="font-dm" style={{ color:'rgba(255,255,255,0.18)', fontSize:'12px', margin:0, fontWeight:300 }}>
          © 2026 RideLanka. Ride safe.
        </p>
      </div>
    </footer>
  );
}

/* ────────────────────────────────────────
   Page export
──────────────────────────────────────── */
export default function Landing() {
  return (
    <div style={{ background:'#0a0a0a', color:'#fff', overflowX:'hidden' }}>
      <LandingNav />
      <HeroSection />
      <StatsBar />
      <FeaturesSection />
      <MarqueeStrip />
      <SplitSection />
      <LandingFooter />
    </div>
  );
}
