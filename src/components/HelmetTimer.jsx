import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ShieldCheck, X } from 'lucide-react';

const HELMET_TYPES = ['Full Face', 'Half Face', 'Open Face', 'Modular'];
const LS_STATE   = 'rl_timer_state';
const LS_START   = 'rl_timer_start';
const LS_ELAPSED = 'rl_timer_elapsed';

const inputCls = 'w-full bg-[#1c1c1c] border border-white/[0.06] rounded-[4px] px-4 py-3 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#FF6B00] transition-colors text-sm';
const labelCls = 'block text-[11px] text-[#888] mb-2 uppercase tracking-widest';

function formatHMS(ms) {
  const s   = Math.floor(ms / 1000);
  const h   = Math.floor(s / 3600);
  const m   = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function formatDurationLabel(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
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

export default function HelmetTimer({ userId }) {
  const [timerState, setTimerState] = useState('idle');
  const [elapsed,    setElapsed]    = useState(0);
  const [showSave,   setShowSave]   = useState(false);
  const [form,       setForm]       = useState({ helmetType: 'Full Face', conditionRating: 3, notes: '' });
  const [saving,     setSaving]     = useState(false);

  const intervalRef = useRef(null);
  const startRef    = useRef(null);

  useEffect(() => {
    const state  = localStorage.getItem(LS_STATE) || 'idle';
    const start  = parseFloat(localStorage.getItem(LS_START)   || '0');
    const paused = parseFloat(localStorage.getItem(LS_ELAPSED) || '0');
    if (state === 'running' && start) {
      startRef.current = start;
      setElapsed(Date.now() - start);
      setTimerState('running');
      tick();
    } else if (state === 'paused') {
      setElapsed(paused);
      setTimerState('paused');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => clearInterval(intervalRef.current), []);

  function tick() {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 500);
  }

  function handleStart() {
    const start = Date.now() - elapsed;
    startRef.current = start;
    localStorage.setItem(LS_STATE, 'running');
    localStorage.setItem(LS_START, String(start));
    localStorage.removeItem(LS_ELAPSED);
    setTimerState('running');
    tick();
  }

  function handlePause() {
    clearInterval(intervalRef.current);
    const cur = Date.now() - startRef.current;
    localStorage.setItem(LS_STATE,   'paused');
    localStorage.setItem(LS_ELAPSED, String(cur));
    setElapsed(cur);
    setTimerState('paused');
  }

  function handleStop() {
    clearInterval(intervalRef.current);
    if (timerState === 'running') setElapsed(Date.now() - startRef.current);
    setShowSave(true);
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    try {
      await addDoc(collection(db, 'helmet_sessions'), {
        userId,
        durationInMinutes: Math.max(1, Math.floor(elapsed / 60000)),
        helmetType:        form.helmetType,
        conditionRating:   form.conditionRating,
        notes:             form.notes,
        date:              new Date().toISOString().slice(0, 10),
        createdAt:         serverTimestamp(),
      });
      discard();
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    clearInterval(intervalRef.current);
    localStorage.removeItem(LS_STATE);
    localStorage.removeItem(LS_START);
    localStorage.removeItem(LS_ELAPSED);
    setTimerState('idle');
    setElapsed(0);
    setShowSave(false);
    setForm({ helmetType: 'Full Face', conditionRating: 3, notes: '' });
  }

  const isRunning = timerState === 'running';
  const isPaused  = timerState === 'paused';
  const isIdle    = timerState === 'idle';

  return (
    <>
      {/* ── card ── */}
      <div className="bg-[#111] border border-white/[0.08] rounded-[10px] overflow-hidden select-none">

        {/* orange top accent strip — visible only when active */}
        {!isIdle && (
          <div className="h-[3px] w-full bg-[#FF6B00]" />
        )}

        {/* ── IDLE STATE: explain purpose, invite action ── */}
        {isIdle && (
          <div className="flex flex-col items-center px-6 py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center mb-4">
              <ShieldCheck size={26} className="text-[#FF6B00]" />
            </div>
            <h3 className="font-bebas text-[1.5rem] tracking-wider text-[#F5F5F5] mb-1">
              HELMET WEAR TIMER
            </h3>
            <p className="text-[#555] text-[12px] leading-relaxed mb-6 max-w-[240px]">
              Put your helmet on, then tap START to track how long you wear it each ride
            </p>
            <button
              onClick={handleStart}
              className="font-bebas tracking-[3px] bg-[#FF6B00] text-black px-10 py-3 text-[14px] rounded-[4px] hover:bg-[#e55f00] active:scale-[0.97] transition-all"
              style={{ boxShadow: '0 4px 16px rgba(255,107,0,0.3)' }}
            >
              START SESSION
            </button>
          </div>
        )}

        {/* ── ACTIVE / PAUSED STATE: show live timer ── */}
        {!isIdle && (
          <div className="flex flex-col items-center px-6 py-6">
            {/* status badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-[#FF6B00] animate-pulse' : 'bg-[#555]'}`} />
              <span
                className="font-bebas text-[11px] tracking-[3px]"
                style={{ color: isRunning ? '#FF6B00' : '#888' }}
              >
                {isRunning ? 'TRACKING WEAR TIME' : 'SESSION PAUSED'}
              </span>
            </div>

            {/* timer digits */}
            <div
              className="font-bebas leading-none tabular-nums mb-6"
              style={{ fontSize: '4.5rem', color: '#FF6B00', letterSpacing: '0.04em' }}
            >
              {formatHMS(elapsed)}
            </div>

            {/* buttons */}
            <div className="flex gap-3 w-full max-w-[300px]">
              {isRunning && (
                <>
                  <button
                    onClick={handlePause}
                    className="flex-1 font-bebas tracking-[2px] bg-transparent border border-white/[0.15] text-[#F5F5F5] py-2.5 text-[13px] rounded-[4px] hover:border-white/40 active:scale-[0.97] transition-all"
                  >
                    PAUSE
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex-1 font-bebas tracking-[2px] bg-transparent border border-red-800/50 text-red-400 py-2.5 text-[13px] rounded-[4px] hover:border-red-500 active:scale-[0.97] transition-all"
                  >
                    STOP &amp; SAVE
                  </button>
                </>
              )}
              {isPaused && (
                <>
                  <button
                    onClick={handleStart}
                    className="flex-1 font-bebas tracking-[2px] bg-[#FF6B00] text-black py-2.5 text-[13px] rounded-[4px] hover:bg-[#e55f00] active:scale-[0.97] transition-all"
                  >
                    RESUME
                  </button>
                  <button
                    onClick={handleStop}
                    className="flex-1 font-bebas tracking-[2px] bg-transparent border border-red-800/50 text-red-400 py-2.5 text-[13px] rounded-[4px] hover:border-red-500 active:scale-[0.97] transition-all"
                  >
                    STOP &amp; SAVE
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── save modal ── */}
      {showSave && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-[8px] z-50 flex items-end sm:items-center justify-center p-4">
          <div className="modal-enter bg-[#111] border border-white/[0.08] rounded-[12px] w-full max-w-[440px]">
            <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06]">
              <div>
                <h3 className="font-bebas text-[1.6rem] tracking-wider text-[#F5F5F5] leading-none">
                  SESSION COMPLETE
                </h3>
                <p className="text-[#555] text-[11px] mt-0.5">Save this ride to your history</p>
              </div>
              <button
                onClick={discard}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#555] hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-7 py-6 space-y-5">
              {/* duration */}
              <div
                className="rounded-[6px] p-4 text-center"
                style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.15)' }}
              >
                <p className="text-[#888] text-[11px] uppercase tracking-widest mb-1">You rode for</p>
                <p className="font-bebas text-[3rem] text-[#FF6B00] leading-none">
                  {formatDurationLabel(elapsed)}
                </p>
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
                <label className={labelCls}>How was your scalp after? (1–5)</label>
                <DotRating
                  value={form.conditionRating}
                  onChange={(v) => setForm({ ...form, conditionRating: v })}
                />
                <div className="flex justify-between text-[10px] text-[#555] mt-1.5">
                  <span>Very uncomfortable</span><span>Felt great</span>
                </div>
              </div>

              <div>
                <label className={labelCls}>Notes (optional)</label>
                <textarea
                  rows={2} value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className={`${inputCls} resize-none`}
                  placeholder="Any observations after riding…"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button" onClick={discard}
                  className="flex-1 font-bebas tracking-[2px] bg-transparent border border-white/[0.15] text-[#888] py-3 text-[13px] rounded-[4px] hover:border-white/30 hover:text-[#F5F5F5] transition-colors"
                >
                  DISCARD
                </button>
                <button
                  type="button" onClick={handleSave} disabled={saving || !userId}
                  className="flex-1 font-bebas tracking-[2px] bg-[#FF6B00] text-black py-3 text-[14px] rounded-[4px] hover:bg-[#e55f00] active:scale-[0.97] disabled:opacity-50 transition-all"
                >
                  {saving ? 'SAVING…' : 'SAVE SESSION'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
