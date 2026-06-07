import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/firebase';
import {
  collection, addDoc, onSnapshot, query, where,
  serverTimestamp, doc, deleteDoc,
} from 'firebase/firestore';
import { analyzeScalpImage } from '../services/geminiScalp';
import HelmetTimer from '../components/HelmetTimer';
import {
  Camera, Loader2, AlertTriangle, ChevronDown,
  Plus, X, Activity, ShieldCheck,
} from 'lucide-react';

/* ─── constants ───────────────────────────────────── */
const HELMET_TYPES = ['Full Face', 'Half Face', 'Open Face', 'Modular'];
const inputCls = 'w-full bg-[#1c1c1c] border border-white/[0.06] rounded-[4px] px-4 py-3 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#FF6B00] transition-colors text-sm';
const labelCls = 'block text-[11px] text-[#888] mb-2 uppercase tracking-widest';

/* ─── helpers ─────────────────────────────────────── */
const riskColor = (score) => {
  if (score == null) return '#888888';
  return score < 4 ? '#22c55e' : score < 7 ? '#f59e0b' : '#ef4444';
};

const formatTs = (ts) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );
};

/* ─── sub-components ──────────────────────────────── */

function ScalpUploadZone({ preview, onChange, onClear, analyzing }) {
  const ref = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f?.type.startsWith('image/')) onChange(f);
  };

  const handleChange = (e) => {
    const f = e.target.files?.[0];
    if (f) onChange(f);
    e.target.value = '';
  };

  if (preview) {
    return (
      <div className="relative w-full h-56 rounded-[8px] overflow-hidden border border-white/[0.06]">
        <img src={preview} alt="Scalp scan" className="w-full h-full object-cover" />
        {analyzing && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-3">
            <Loader2 size={32} className="text-[#FF6B00] animate-spin" />
            <span className="font-bebas tracking-[2px] text-white text-[14px]">ANALYZING…</span>
          </div>
        )}
        {!analyzing && (
          <button
            type="button" onClick={onClear}
            className="absolute top-3 right-3 w-8 h-8 bg-black/70 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => ref.current?.click()}
      className="w-full h-56 border-2 border-dashed border-white/[0.10] hover:border-[#FF6B00]/50 rounded-[8px] flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors group"
    >
      <div className="w-16 h-16 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center group-hover:bg-[#FF6B00]/15 transition-colors">
        <Camera size={28} className="text-[#FF6B00]" />
      </div>
      <div className="text-center">
        <p className="font-bebas tracking-widest text-[#F5F5F5] text-[16px]">UPLOAD SCALP PHOTO</p>
        <p className="text-[#555] text-[12px] mt-0.5">or drag and drop</p>
        <p className="text-[#444] text-[11px] mt-1">JPEG · PNG · WebP</p>
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </div>
  );
}

function MetricBar({ label, score }) {
  const color = riskColor(score);
  const pct   = Math.max(0, Math.min(10, score ?? 0)) * 10;
  return (
    <div>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[11px] text-[#888] uppercase tracking-widest">{label}</span>
        <span className="text-[12px] font-medium tabular-nums" style={{ color }}>
          {score}<span className="text-[#555] text-[10px]">/10</span>
        </span>
      </div>
      <div className="h-[3px] bg-[#1c1c1c] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: color, transition: 'width 0.8s ease-out' }}
        />
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  const score  = result?.overall_risk_score;
  const color  = riskColor(score);
  const metrics = [
    { label: 'Redness',      score: result?.redness_score      },
    { label: 'Dryness',      score: result?.dryness_score      },
    { label: 'Oiliness',     score: result?.oiliness_score     },
    { label: 'Dandruff',     score: result?.dandruff_score     },
    { label: 'Inflammation', score: result?.inflammation_score },
    { label: 'Hair Density', score: result?.hair_density_score },
  ];

  if (!result) return null;

  return (
    <div className="space-y-4">
      {/* overall score */}
      <div className="bg-[#111] border border-white/[0.06] rounded-[8px] p-6 text-center">
        <div className="font-bebas text-[5.5rem] leading-none" style={{ color }}>{score}</div>
        <div className="text-[11px] text-[#555] uppercase tracking-widest mt-1 mb-3">OVERALL RISK</div>
        {result.scalp_condition_summary && (
          <p className="text-[#888] text-[13px] leading-relaxed max-w-xs mx-auto">
            {result.scalp_condition_summary}
          </p>
        )}
      </div>

      {/* urgent banner */}
      {result.urgent_attention_needed && (
        <div
          className="flex items-center gap-3 p-4 rounded-[4px]"
          style={{ background: 'rgba(239,68,68,0.10)', borderLeft: '4px solid #ef4444' }}
        >
          <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
          <span className="text-red-400 text-[13px] font-medium">
            URGENT: Seek professional dermatological attention
          </span>
        </div>
      )}

      {/* metrics */}
      <div className="bg-[#111] border border-white/[0.06] rounded-[8px] p-5">
        <h4 className="font-bebas text-[1.1rem] tracking-wider text-[#F5F5F5] mb-4">METRICS</h4>
        <div className="space-y-3.5">
          {metrics.map((m) => <MetricBar key={m.label} label={m.label} score={m.score} />)}
        </div>
        {result.thinning_risk && (
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-[11px] text-[#555] uppercase tracking-widest">Thinning Risk</span>
            <span
              className="text-[12px] font-medium capitalize"
              style={{ color: result.thinning_risk === 'low' ? '#22c55e' : result.thinning_risk === 'moderate' ? '#f59e0b' : '#ef4444' }}
            >
              {result.thinning_risk}
            </span>
          </div>
        )}
      </div>

      {/* observations */}
      {result.observations?.length > 0 && (
        <div className="bg-[#111] border border-white/[0.06] rounded-[8px] p-5">
          <h4 className="font-bebas text-[1.1rem] tracking-wider text-[#F5F5F5] mb-3">OBSERVATIONS</h4>
          <ul className="space-y-2.5">
            {result.observations.map((obs, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[#888] text-[13px] leading-relaxed">
                <span className="text-[#FF6B00] flex-shrink-0 mt-0.5 text-[9px]">▸</span>
                {obs}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* recommendations */}
      {result.recommendations?.length > 0 && (
        <div>
          <h4 className="font-bebas text-[1.1rem] tracking-wider text-[#F5F5F5] mb-3">RECOMMENDATIONS</h4>
          <div className="space-y-2">
            {result.recommendations.map((rec, i) => (
              <div
                key={i}
                className="bg-[#111] rounded-[4px] px-4 py-3 text-[13px] text-[#888] leading-relaxed"
                style={{ border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #FF6B00' }}
              >
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DotRating({ value, onChange, max = 5 }) {
  return (
    <div className="flex gap-2.5">
      {[...Array(max)].map((_, i) => (
        <button
          key={i} type="button" onClick={() => onChange(i + 1)}
          className={`w-9 h-9 rounded-full border-2 transition-all ${
            i < value
              ? 'bg-[#FF6B00] border-[#FF6B00]'
              : 'bg-transparent border-white/[0.15] hover:border-[#FF6B00]/50'
          }`}
        />
      ))}
    </div>
  );
}

function SessionCard({ session, onDelete }) {
  // support both manual-entry schema (duration hrs, condition) and timer schema (durationInMinutes, conditionRating)
  const durationMin  = session.durationInMinutes ?? (session.duration ? Math.round(session.duration * 60) : 0);
  const condition    = session.conditionRating ?? session.condition ?? 0;
  const h            = Math.floor(durationMin / 60);
  const m            = durationMin % 60;
  const displayVal   = h > 0 ? `${h}${m > 0 ? `:${String(m).padStart(2, '0')}` : ''}` : `${durationMin}`;
  const displayUnit  = h > 0 ? 'HRS' : 'MIN';

  const dayName = session.date
    ? new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
    : '';

  return (
    <div
      className="bg-[#111] rounded-[8px] p-4"
      style={{ border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #FF6B00' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="font-bebas text-[1.15rem] text-[#F5F5F5] leading-tight">{dayName}</div>
          <div className="text-[#555] text-[12px]">{session.date}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-end gap-0.5 justify-end">
            <span className="font-bebas text-[2.2rem] text-[#FF6B00] leading-none">{displayVal}</span>
            <span className="font-bebas text-[11px] text-[#FF6B00] mb-1 ml-0.5">{displayUnit}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-[11px] text-[#888] bg-[#1c1c1c] border border-white/[0.06] px-2.5 py-0.5 rounded-full">
          {session.helmetType}
        </span>
        <div className="flex gap-1.5">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i < condition ? 'bg-[#FF6B00]' : 'bg-[#2a2a2a]'}`}
            />
          ))}
        </div>
      </div>

      {session.notes && <p className="text-[#555] text-[12px] leading-relaxed mb-2">{session.notes}</p>}

      <button onClick={onDelete} className="text-[11px] text-[#444] hover:text-red-400 transition-colors mt-1">
        Remove session
      </button>
    </div>
  );
}

/* ─── tab components ──────────────────────────────── */

function ScanTab({ userId }) {
  const [file,      setFile]      = useState(null);
  const [preview,   setPreview]   = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result,    setResult]    = useState(null);
  const [error,     setError]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [saved,     setSaved]     = useState(false);

  const handleAnalyze = async () => {
    if (!file) return;
    setAnalyzing(true);
    setError('');
    setResult(null);
    try {
      const r = await analyzeScalpImage(file);
      setResult(r);
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!result || !userId) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'scalp_scans'), {
        userId,
        result,
        createdAt: serverTimestamp(),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError('');
    setSaved(false);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-bebas text-[2.5rem] leading-none text-[#F5F5F5] tracking-wide">AI SCALP SCAN</h2>
        <p className="text-[#888] text-[13px] mt-1">
          Detect scalp conditions caused by prolonged helmet use
        </p>
      </div>

      {!result && (
        <ScalpUploadZone
          preview={preview}
          onChange={(f) => { setFile(f); setPreview(URL.createObjectURL(f)); setSaved(false); setResult(null); }}
          onClear={handleReset}
          analyzing={analyzing}
        />
      )}

      {file && !analyzing && !result && (
        <button
          onClick={handleAnalyze}
          className="w-full font-bebas tracking-[2px] bg-[#FF6B00] text-black py-3.5 text-[15px] hover:bg-[#e55f00] active:scale-[0.97] transition-all"
        >
          ANALYZE SCALP
        </button>
      )}

      {analyzing && (
        <div className="flex flex-col items-center py-10 gap-3">
          <Loader2 size={32} className="text-[#FF6B00] animate-spin" />
          <p className="font-bebas tracking-[2px] text-[#888] text-[14px]">ANALYZING YOUR SCALP…</p>
          <p className="text-[#555] text-[12px]">This may take a few seconds</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/[0.12] border border-red-800/40 rounded-[4px] px-4 py-3 text-[13px] text-red-400">
          {error}
        </div>
      )}

      {result && (
        <>
          <ResultCard result={result} />

          {!saved ? (
            <button
              onClick={handleSave} disabled={saving}
              className="w-full bg-transparent border border-white/[0.15] text-[#F5F5F5] py-3 text-sm rounded-[4px] hover:border-[#FF6B00] hover:text-[#FF6B00] disabled:opacity-50 transition-colors"
            >
              {saving ? 'SAVING…' : 'SAVE SCAN RESULT'}
            </button>
          ) : (
            <div className="text-center text-[13px] text-[#22c55e] py-1">
              ✓ Scan result saved to history
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full text-[#555] text-[12px] hover:text-[#888] transition-colors py-2"
          >
            ← Scan another photo
          </button>
        </>
      )}
    </div>
  );
}

function SessionsTab({ userId }) {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: '', duration: '', helmetType: 'Full Face', condition: 3, notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'helmet_sessions'), where('userId', '==', userId));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setSessions(data);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [userId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, 'helmet_sessions'), {
        ...form,
        duration: parseFloat(form.duration) || 0,
        userId,
        createdAt: serverTimestamp(),
      });
      setForm({ date: '', duration: '', helmetType: 'Full Face', condition: 3, notes: '' });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => deleteDoc(doc(db, 'helmet_sessions', id));

  const now         = new Date();
  const thisMonth   = sessions.filter((s) => {
    if (!s.date) return false;
    const d = new Date(s.date + 'T00:00:00');
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalMin     = sessions.reduce((a, s) => {
    return a + (s.durationInMinutes ?? (s.duration ? Math.round(s.duration * 60) : 0));
  }, 0);
  const avgDuration  = sessions.length
    ? (totalMin / sessions.length / 60).toFixed(1) : '—';
  const avgCondition = sessions.length
    ? (sessions.reduce((a, s) => a + (s.conditionRating ?? s.condition ?? 0), 0) / sessions.length).toFixed(1) : '—';

  return (
    <div className="space-y-5">
      {/* timer */}
      <HelmetTimer userId={userId} />

      <div>
        <h2 className="font-bebas text-[2rem] leading-none text-[#F5F5F5] tracking-wide">HELMET SESSIONS</h2>
        <p className="text-[#555] text-[13px] mt-0.5">Track your riding sessions</p>
      </div>

      {/* summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'This Month',     value: thisMonth.length   },
          { label: 'Avg Duration',   value: `${avgDuration}h`  },
          { label: 'Avg Condition',  value: avgCondition       },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#111] border border-white/[0.06] rounded-[8px] p-3 text-center">
            <div className="font-bebas text-[1.8rem] text-[#FF6B00] leading-none">{value}</div>
            <div className="text-[10px] text-[#555] uppercase tracking-widest mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-28 w-full" />)}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center bg-[#111] border border-white/[0.06] rounded-[8px]">
          <Activity size={44} className="text-[#333] mb-4" />
          <h3 className="font-bebas text-[1.5rem] tracking-wider text-[#F5F5F5] mb-1">NO SESSIONS YET</h3>
          <p className="text-[#555] text-[13px] mb-5">Start logging your helmet sessions</p>
          <button
            onClick={() => setShowForm(true)}
            className="font-bebas tracking-[2px] bg-[#FF6B00] text-black px-7 py-2.5 text-[13px] hover:bg-[#e55f00] active:scale-[0.97] transition-all"
          >
            ADD SESSION
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div key={s.id} className="card-reveal" style={{ animationDelay: `${i * 0.05}s` }}>
              <SessionCard session={s} onDelete={() => handleDelete(s.id)} />
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-5 w-[52px] h-[52px] bg-[#FF6B00] rounded-full flex items-center justify-center hover:scale-[1.08] active:scale-[0.94] transition-transform z-30"
        style={{ boxShadow: '0 4px 20px rgba(255,107,0,0.4)' }}
      >
        <Plus size={24} className="text-black" />
      </button>

      {/* add session modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-[8px] z-50 flex items-end sm:items-center justify-center p-4">
          <div className="modal-enter bg-[#111] border border-white/[0.08] rounded-[12px] w-full max-w-[480px] max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06] sticky top-0 bg-[#111] z-10">
              <h3 className="font-bebas text-[1.6rem] tracking-wider text-[#F5F5F5]">LOG SESSION</h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#555] hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAdd} className="px-7 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date</label>
                  <input
                    required type="date" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Duration (hrs)</label>
                  <input
                    required type="number" step="0.5" min="0.5" value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className={inputCls} placeholder="2.5"
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Helmet Type</label>
                <select
                  value={form.helmetType}
                  onChange={(e) => setForm({ ...form, helmetType: e.target.value })}
                  className={inputCls}
                >
                  {HELMET_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Scalp Condition After (1–5)</label>
                <DotRating value={form.condition} onChange={(v) => setForm({ ...form, condition: v })} />
                <div className="flex justify-between text-[10px] text-[#555] mt-1.5">
                  <span>Poor</span><span>Excellent</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>Notes (optional)</label>
                <textarea
                  rows={2} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={`${inputCls} resize-none`} placeholder="Any observations after riding…"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-transparent border border-white/[0.15] text-[#F5F5F5] py-3 text-sm rounded-[4px] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 font-bebas tracking-[2px] bg-[#FF6B00] text-black py-3 text-[14px] hover:bg-[#e55f00] active:scale-[0.97] disabled:opacity-50 transition-all">
                  {saving ? 'SAVING…' : 'LOG SESSION'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function HistoryTab({ userId }) {
  const [scans,      setScans]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, 'scalp_scans'), where('userId', '==', userId));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setScans(data);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [userId]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-bebas text-[2rem] leading-none text-[#F5F5F5] tracking-wide">SCAN HISTORY</h2>
        <p className="text-[#555] text-[13px] mt-0.5">
          {scans.length} scan{scans.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 w-full" />)}
        </div>
      ) : scans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 text-center bg-[#111] border border-white/[0.06] rounded-[8px]">
          <Camera size={44} className="text-[#333] mb-4" />
          <h3 className="font-bebas text-[1.5rem] tracking-wider text-[#F5F5F5] mb-1">NO SCANS YET</h3>
          <p className="text-[#555] text-[13px]">Upload a scalp photo on the Scan tab to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan, i) => {
            const score      = scan.result?.overall_risk_score;
            const color      = riskColor(score);
            const isExpanded = expandedId === scan.id;
            const summary    = scan.result?.scalp_condition_summary || '';

            return (
              <div
                key={scan.id}
                className="card-reveal bg-[#111] border border-white/[0.06] rounded-[8px] overflow-hidden"
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : scan.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-[#161616] transition-colors"
                >
                  {/* risk badge */}
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}
                  >
                    <span className="font-bebas text-[1.4rem] leading-none" style={{ color }}>
                      {score ?? '?'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[#F5F5F5] text-[13px] font-medium mb-0.5">
                      {formatTs(scan.createdAt)}
                    </div>
                    {summary && (
                      <p className="text-[#555] text-[11px] truncate">{summary}</p>
                    )}
                  </div>

                  <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown size={16} className="text-[#555]" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-white/[0.06] p-4">
                    <ResultCard result={scan.result} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── main page ───────────────────────────────────── */

export default function HelmetHealth() {
  const { user } = useAuth();
  const [tab, setTab] = useState('SCAN');

  return (
    <div className="pb-28 pt-14 px-5 max-w-2xl mx-auto page-enter">
      <div className="mt-6 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <ShieldCheck size={28} className="text-[#FF6B00]" />
          <h1 className="font-bebas text-[3rem] leading-none text-[#F5F5F5] tracking-wide">
            HELMET HEALTH
          </h1>
        </div>
        <p className="text-[#555] text-[13px]">Track scalp health & helmet usage</p>
      </div>

      {/* tab switcher */}
      <div className="flex gap-1 bg-[#161616] border border-white/[0.06] rounded-[6px] p-1 mb-7">
        {['SCAN', 'SESSIONS', 'HISTORY'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-[4px] font-bebas tracking-widest text-[13px] transition-all ${
              tab === t ? 'bg-[#FF6B00] text-black' : 'text-[#888] hover:text-[#F5F5F5]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'SCAN'     && <ScanTab     userId={user?.uid} />}
      {tab === 'SESSIONS' && <SessionsTab userId={user?.uid} />}
      {tab === 'HISTORY'  && <HistoryTab  userId={user?.uid} />}
    </div>
  );
}
