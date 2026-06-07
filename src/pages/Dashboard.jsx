import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRoutes } from '../hooks/useRoutes';
import { usePosts } from '../hooks/usePosts';
import RouteCard from '../components/RouteCard';
import PostCard from '../components/PostCard';
import HelmetTimer from '../components/HelmetTimer';
import { db } from '../firebase/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Map, AlertTriangle, FileText, ShieldCheck, ChevronRight } from 'lucide-react';

const quickActions = [
  { label: 'Add Route',     icon: Map,           path: '/routes'     },
  { label: 'Report Hazard', icon: AlertTriangle, path: '/hazard-map' },
  { label: 'New Post',      icon: FileText,      path: '/community'  },
];

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric',
});

const riskColor = (score) => {
  if (score == null) return '#888888';
  return score < 4 ? '#22c55e' : score < 7 ? '#f59e0b' : '#ef4444';
};

function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

// normalize duration to minutes across both session schemas
function getMinutes(s) {
  return s.durationInMinutes ?? (s.duration ? Math.round(s.duration * 60) : 0);
}
function getCondition(s) {
  return s.conditionRating ?? s.condition ?? 0;
}

export default function Dashboard() {
  const { user }                          = useAuth();
  const { routes, toggleLike: likeRoute } = useRoutes();
  const { posts,  toggleLike: likePost  } = usePosts();
  const navigate                          = useNavigate();

  const [lastScan,  setLastScan]  = useState(undefined); // undefined = loading
  const [sessions,  setSessions]  = useState([]);

  const recentRoutes = routes.slice(0, 3);
  const recentPosts  = posts.slice(0, 3);
  const name         = user?.displayName?.split(' ')[0] || 'Rider';

  // last scalp scan
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'scalp_scans'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setLastScan(data[0] || null);
    }, () => setLastScan(null));
    return unsub;
  }, [user]);

  // helmet sessions for stats
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'helmet_sessions'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => setSessions([]));
    return unsub;
  }, [user]);

  // compute stats
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weeklyMin = sessions
    .filter((s) => (s.createdAt?.toMillis?.() ?? 0) >= weekAgo)
    .reduce((acc, s) => acc + getMinutes(s), 0);
  const weeklyDisplay = weeklyMin >= 60
    ? `${(weeklyMin / 60).toFixed(1)}h`
    : `${weeklyMin}m`;

  const nowDate = new Date();
  const monthCount = sessions.filter((s) => {
    if (!s.date) return false;
    const d = new Date(s.date + 'T00:00:00');
    return d.getMonth() === nowDate.getMonth() && d.getFullYear() === nowDate.getFullYear();
  }).length;

  const conditionVals = sessions.map((s) => getCondition(s)).filter(Boolean);
  const avgCondition  = conditionVals.length
    ? (conditionVals.reduce((a, b) => a + b, 0) / conditionVals.length).toFixed(1)
    : '—';

  return (
    <div className="pb-28 pt-14 px-4 sm:px-5 max-w-2xl mx-auto page-enter">

      {/* ── welcome ── */}
      <div className="mt-6 mb-6">
        <p className="text-[11px] text-[#555] uppercase tracking-widest mb-1">Welcome back</p>
        <h1 className="font-bebas text-[3rem] leading-none text-[#F5F5F5] tracking-wide">{name}</h1>
        <p className="text-[#555] text-[12px] mt-1">{today}</p>
      </div>

      {/* ── ride timer ── */}
      <div className="mb-4">
        <HelmetTimer userId={user?.uid} />
      </div>

      {/* ── session stats row ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'This Week',    value: weeklyDisplay || '0m'  },
          { label: 'This Month',   value: String(monthCount)     },
          { label: 'Avg Cond.',    value: avgCondition           },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#111] border border-white/[0.06] rounded-[8px] p-3 text-center">
            <div className="font-bebas text-[1.6rem] text-[#FF6B00] leading-none">{value}</div>
            <div className="text-[10px] text-[#555] uppercase tracking-widest mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* ── quick actions ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {quickActions.map(({ label, icon: Icon, path }, i) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="bg-[#111] border border-white/[0.06] rounded-[8px] p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-2.5 hover:border-[#FF6B00]/40 hover:bg-[#161616] active:scale-[0.97] transition-all duration-200"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="w-10 h-10 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center">
              <Icon size={18} className="text-[#FF6B00]" />
            </div>
            <span className="text-[#F5F5F5] text-[12px] font-medium text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>

      {/* ── helmet health stat ── */}
      {lastScan !== undefined && (
        <button
          onClick={() => navigate('/helmet-health')}
          className="w-full bg-[#111] border border-white/[0.06] rounded-[8px] p-4 flex items-center gap-4 mb-8 hover:border-[#FF6B00]/40 hover:bg-[#161616] active:scale-[0.98] transition-all duration-200 text-left"
        >
          <div className="w-11 h-11 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center flex-shrink-0">
            <ShieldCheck size={19} className="text-[#FF6B00]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bebas text-[11px] tracking-widest text-[#555] mb-0.5">HELMET HEALTH</div>
            {lastScan ? (
              <div className="flex items-center gap-2">
                <span
                  className="font-bebas text-[1.7rem] leading-none"
                  style={{ color: riskColor(lastScan.result?.overall_risk_score) }}
                >
                  {lastScan.result?.overall_risk_score}
                </span>
                <span className="text-[#555] text-[11px]">
                  RISK · {timeAgo(lastScan.createdAt)}
                </span>
              </div>
            ) : (
              <span className="font-bebas text-[14px] tracking-wider text-[#FF6B00]">SCAN NOW →</span>
            )}
          </div>
          <ChevronRight size={16} className="text-[#555] flex-shrink-0" />
        </button>
      )}

      {/* ── recent routes ── */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bebas text-[1.4rem] tracking-wider text-[#F5F5F5]">RECENT ROUTES</h2>
          <button
            onClick={() => navigate('/routes')}
            className="text-[11px] text-[#FF6B00] hover:text-[#e55f00] tracking-widest uppercase transition-colors"
          >
            VIEW ALL →
          </button>
        </div>

        {recentRoutes.length === 0 ? (
          <EmptyState
            icon={<Map size={40} className="text-[#333]" />}
            title="NO ROUTES YET"
            desc="Be the first to share a route"
            cta="ADD ROUTE"
            onClick={() => navigate('/routes')}
          />
        ) : (
          <div className="space-y-3">
            {recentRoutes.map((route, i) => (
              <div key={route.id} className="card-reveal" style={{ animationDelay: `${i * 0.07}s` }}>
                <RouteCard route={route} userId={user?.uid} onLike={likeRoute} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── community feed ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bebas text-[1.4rem] tracking-wider text-[#F5F5F5]">COMMUNITY FEED</h2>
          <button
            onClick={() => navigate('/community')}
            className="text-[11px] text-[#FF6B00] hover:text-[#e55f00] tracking-widest uppercase transition-colors"
          >
            VIEW ALL →
          </button>
        </div>

        {recentPosts.length === 0 ? (
          <EmptyState
            icon={<FileText size={40} className="text-[#333]" />}
            title="NO POSTS YET"
            desc="Share something with the community"
            cta="POST NOW"
            onClick={() => navigate('/community')}
          />
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post, i) => (
              <div key={post.id} className="card-reveal" style={{ animationDelay: `${i * 0.07}s` }}>
                <PostCard post={post} userId={user?.uid} onLike={likePost} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyState({ icon, title, desc, cta, onClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center bg-[#111] border border-white/[0.06] rounded-[8px]">
      <div className="mb-3">{icon}</div>
      <h3 className="font-bebas text-[1.4rem] tracking-wider text-[#F5F5F5] mb-1">{title}</h3>
      <p className="text-[#555] text-[13px] mb-5">{desc}</p>
      <button
        onClick={onClick}
        className="font-bebas tracking-[2px] bg-[#FF6B00] text-black px-7 py-2.5 text-[13px] hover:bg-[#e55f00] active:scale-[0.97] transition-all"
      >
        {cta}
      </button>
    </div>
  );
}
