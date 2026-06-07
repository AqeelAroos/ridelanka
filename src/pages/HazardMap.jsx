import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/firebase';
import { collection, addDoc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { Plus, X, AlertTriangle, List, Map } from 'lucide-react';

const HAZARD_TYPES = ['Pothole', 'Flood', 'Accident', 'Construction', 'Animal'];
const SEVERITIES   = ['Low', 'Medium', 'High'];

const severityColor = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444' };
const typeColor     = { Pothole: '#ef4444', Flood: '#3b82f6', Accident: '#f97316', Construction: '#eab308', Animal: '#22c55e' };

const severityTextCls = {
  Low:    'text-[#22c55e]',
  Medium: 'text-[#f59e0b]',
  High:   'text-[#ef4444]',
};

function timeAgo(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const s = (Date.now() - d.getTime()) / 1000;
  if (s < 60)    return 'just now';
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const markerIcon = (severity) => L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:${severityColor[severity] || '#FF6B00'};border:2px solid rgba(255,255,255,0.7);border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const defaultForm = { locationName: '', type: 'Pothole', description: '', severity: 'Medium', lat: '', lng: '' };

const inputCls = 'w-full bg-[#1c1c1c] border border-white/[0.06] rounded-[4px] px-4 py-3 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#FF6B00] transition-colors text-sm';
const labelCls = 'block text-[11px] text-[#888] mb-2 uppercase tracking-widest';

export default function HazardMap() {
  const { user } = useAuth();
  const [hazards,   setHazards]  = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [showForm,  setShowForm] = useState(false);
  const [form,      setForm]     = useState(defaultForm);
  const [saving,    setSaving]   = useState(false);
  const [view,      setView]     = useState('map');

  useEffect(() => {
    const q    = query(collection(db, 'hazards'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setHazards(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await addDoc(collection(db, 'hazards'), {
        ...form,
        lat: parseFloat(form.lat) || 7.8731,
        lng: parseFloat(form.lng) || 80.7718,
        reportedBy: user.displayName || user.email,
        reportedByUid: user.uid,
        createdAt: serverTimestamp(),
      });
      setForm(defaultForm);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const mapHazards = hazards.filter((h) => h.lat && h.lng);

  return (
    <div className="pb-28 pt-14 px-4 sm:px-5 max-w-2xl mx-auto page-enter">

      {/* ── header ── */}
      <div className="mt-6 mb-6">
        <h1 className="font-bebas text-[3rem] leading-[0.9] text-[#F5F5F5] tracking-wide">
          HAZARD<br />MAP
        </h1>
        <p className="text-[#555] text-[13px] mt-2">Community road hazard reports</p>
      </div>

      {/* ── view toggle ── */}
      <div className="inline-flex bg-[#161616] border border-white/[0.06] rounded-full p-1 mb-6">
        {[['map', Map, 'Map View'], ['list', List, 'List View']].map(([key, Icon, label]) => (
          <button key={key} onClick={() => setView(key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[12px] transition-all ${
              view === key ? 'bg-[#FF6B00] text-black font-medium' : 'text-[#888] hover:text-[#F5F5F5]'
            }`}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {/* ── map view ── */}
      {view === 'map' && (
        <>
          <div className="rounded-[8px] overflow-hidden border border-white/[0.08] mb-4" style={{ height: '420px' }}>
            <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapHazards.map((h) => (
                <Marker key={h.id} position={[h.lat, h.lng]} icon={markerIcon(h.severity)}>
                  <Popup>
                    <div style={{ padding: '10px 14px', minWidth: 160 }}>
                      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 15, color: '#FF6B00', letterSpacing: '0.08em', marginBottom: 4 }}>
                        {h.type}
                      </div>
                      <div style={{ fontSize: 13, color: '#F5F5F5', marginBottom: 3 }}>{h.locationName}</div>
                      <div style={{ fontSize: 11, color: severityColor[h.severity], marginBottom: 2 }}>
                        ● {h.severity} Severity
                      </div>
                      {h.description && <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{h.description}</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* legend */}
          <div className="bg-[#111] border border-white/[0.06] rounded-[8px] p-4">
            <p className="text-[11px] text-[#555] uppercase tracking-widest mb-3">Severity Legend</p>
            <div className="flex gap-5">
              {SEVERITIES.map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: severityColor[s] }} />
                  <span className="text-[12px] text-[#888]">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── list view ── */}
      {view === 'list' && (
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-24 w-full" style={{ animationDelay: `${i * 0.1}s` }} />
            ))
          ) : hazards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-[#111] border border-white/[0.06] rounded-[8px]">
              <AlertTriangle size={44} className="text-[#333] mb-4" />
              <h3 className="font-bebas text-[1.6rem] tracking-wider text-[#F5F5F5] mb-1">NO HAZARDS REPORTED</h3>
              <p className="text-[#555] text-[13px]">Help keep riders safe by reporting hazards</p>
            </div>
          ) : (
            hazards.map((h, i) => (
              <div
                key={h.id}
                className="card-reveal bg-[#111] rounded-[8px] p-4 hover:-translate-y-0.5 transition-all"
                style={{
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderLeft: `3px solid ${severityColor[h.severity] || '#FF6B00'}`,
                  animationDelay: `${i * 0.06}s`,
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="text-[#F5F5F5] text-[14px] font-medium">{h.locationName}</span>
                      <span
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium text-white"
                        style={{ backgroundColor: typeColor[h.type] || '#FF6B00' }}
                      >
                        {h.type}
                      </span>
                    </div>
                    {h.description && (
                      <p className="text-[#888] text-[13px] mb-2">{h.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-[11px]">
                      <span className={`flex items-center gap-1 font-medium ${severityTextCls[h.severity]}`}>
                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: severityColor[h.severity] }} />
                        {h.severity}
                      </span>
                      <span className="text-[#555]">By {h.reportedBy}</span>
                    </div>
                  </div>
                  <span className="text-[#555] text-[11px] flex-shrink-0">{timeAgo(h.createdAt)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-20 right-5 w-[52px] h-[52px] bg-[#FF6B00] rounded-full flex items-center justify-center hover:scale-[1.08] active:scale-[0.94] transition-transform z-30"
        style={{ boxShadow: '0 4px 20px rgba(255,107,0,0.4)' }}
      >
        <Plus size={24} className="text-black" />
      </button>

      {/* ── Report Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-[8px] z-[1000] flex items-end sm:items-center justify-center p-4">
          <div className="modal-enter bg-[#111] border border-white/[0.08] rounded-[12px] w-full max-w-[480px] max-h-[92vh] overflow-y-auto">

            <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06] sticky top-0 bg-[#111] z-10">
              <h3 className="font-bebas text-[1.6rem] tracking-wider text-[#F5F5F5]">REPORT HAZARD</h3>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#555] hover:text-white hover:bg-white/[0.06] transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
              <div>
                <label className={labelCls}>Location Name</label>
                <input required value={form.locationName} onChange={(e) => setForm({ ...form, locationName: e.target.value })}
                  className={inputCls} placeholder="e.g. A1 near Kadawatha" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Hazard Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
                    {HAZARD_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Severity</label>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className={inputCls}>
                    {SEVERITIES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Latitude</label>
                  <input type="number" step="any" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })}
                    className={inputCls} placeholder="7.8731" />
                </div>
                <div>
                  <label className={labelCls}>Longitude</label>
                  <input type="number" step="any" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })}
                    className={inputCls} placeholder="80.7718" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputCls} resize-none`} placeholder="Describe the hazard…" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-transparent border border-white/[0.15] text-[#F5F5F5] py-3 text-sm rounded-[4px] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 font-bebas tracking-[2px] bg-[#FF6B00] text-black py-3 text-[14px] hover:bg-[#e55f00] active:scale-[0.97] disabled:opacity-50 transition-all">
                  {saving ? 'REPORTING…' : 'REPORT HAZARD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
