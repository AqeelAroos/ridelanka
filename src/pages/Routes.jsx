import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useRoutes } from '../hooks/useRoutes';
import RouteCard from '../components/RouteCard';
import ImageUploadZone from '../components/ImageUploadZone';
import { uploadImage } from '../services/cloudinaryUpload';
import { Plus, X, MapPin } from 'lucide-react';

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const REGIONS      = ['Kandy', 'Ella', 'Coastal', 'North', 'Hill Country'];

const defaultForm = {
  name: '', description: '', distance: '', difficulty: 'Easy',
  region: 'Kandy', startPoint: '', endPoint: '',
};

const inputCls  = 'w-full bg-[#1c1c1c] border border-white/[0.06] rounded-[4px] px-4 py-3 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#FF6B00] transition-colors text-sm';
const labelCls  = 'block text-[11px] text-[#888] mb-2 uppercase tracking-widest';

export default function Routes() {
  const { user }                    = useAuth();
  const { routes, loading, addRoute, toggleLike } = useRoutes();
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(defaultForm);
  const [coverFile, setCoverFile]   = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [filterDiff,   setFilterDiff]   = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let coverUrl = null;
      if (coverFile) coverUrl = await uploadImage(coverFile, 'ridelanka/routes');
      await addRoute({
        ...form,
        distance: parseFloat(form.distance),
        createdBy: user.displayName || user.email,
        createdByUid: user.uid,
        ...(coverUrl && { coverUrl }),
      });
      setForm(defaultForm);
      setCoverFile(null);
      setCoverPreview(null);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const filtered = routes.filter((r) => {
    if (filterDiff   !== 'All' && r.difficulty !== filterDiff)   return false;
    if (filterRegion !== 'All' && r.region     !== filterRegion) return false;
    return true;
  });

  const PillBtn = ({ label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`px-3.5 h-8 rounded-full text-[12px] transition-all whitespace-nowrap border ${
        active
          ? 'bg-[#FF6B00] border-[#FF6B00] text-black font-medium'
          : 'bg-transparent border-white/[0.12] text-[#888] hover:border-[#FF6B00]/60 hover:text-[#FF6B00]'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="pb-28 pt-14 px-5 max-w-2xl mx-auto page-enter">

      {/* ── hero bar ── */}
      <div className="mt-6 mb-6">
        <h1 className="font-bebas text-[3.5rem] leading-[0.9] text-[#F5F5F5] tracking-wide">
          EXPLORE<br />ROUTES
        </h1>
        <p className="text-[#555] text-[13px] mt-2">Discover Sri Lanka on two wheels</p>
      </div>

      {/* ── filters ── */}
      <div className="space-y-2.5 mb-6">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <PillBtn label="All" active={filterDiff === 'All'} onClick={() => setFilterDiff('All')} />
          {DIFFICULTIES.map((d) => (
            <PillBtn key={d} label={d} active={filterDiff === d} onClick={() => setFilterDiff(d)} />
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <PillBtn label="All Regions" active={filterRegion === 'All'} onClick={() => setFilterRegion('All')} />
          {REGIONS.map((r) => (
            <PillBtn key={r} label={r} active={filterRegion === r} onClick={() => setFilterRegion(r)} />
          ))}
        </div>
      </div>

      {/* ── content ── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-48 w-full" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#111] border border-white/[0.06] rounded-[8px]">
          <MapPin size={44} className="text-[#333] mb-4" />
          <h3 className="font-bebas text-[1.6rem] tracking-wider text-[#F5F5F5] mb-1">NO ROUTES FOUND</h3>
          <p className="text-[#555] text-[13px] mb-6">Be the first to add a route</p>
          <button
            onClick={() => setShowForm(true)}
            className="font-bebas tracking-[2px] bg-[#FF6B00] text-black px-8 py-2.5 text-[13px] hover:bg-[#e55f00] active:scale-[0.97] transition-all"
          >
            ADD ROUTE
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((route, i) => (
            <div key={route.id} className="card-reveal" style={{ animationDelay: `${i * 0.06}s` }}>
              <RouteCard route={route} userId={user?.uid} onLike={toggleLike} />
            </div>
          ))}
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

      {/* ── Add Route Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-[8px] z-50 flex items-end sm:items-center justify-center p-4">
          <div className="modal-enter bg-[#111] border border-white/[0.08] rounded-[12px] w-full max-w-[480px] max-h-[92vh] overflow-y-auto">

            <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06] sticky top-0 bg-[#111] z-10">
              <h3 className="font-bebas text-[1.6rem] tracking-wider text-[#F5F5F5]">ADD NEW ROUTE</h3>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#555] hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
              <div>
                <label className={labelCls}>Route Name</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputCls} placeholder="e.g. Kandy to Ella Scenic Route" />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={`${inputCls} resize-none`} placeholder="Describe this route…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Distance (km)</label>
                  <input type="number" required min="1" value={form.distance}
                    onChange={(e) => setForm({ ...form, distance: e.target.value })}
                    className={inputCls} placeholder="150" />
                </div>
                <div>
                  <label className={labelCls}>Difficulty</label>
                  <select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })} className={inputCls}>
                    {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelCls}>Region</label>
                <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className={inputCls}>
                  {REGIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Start Point</label>
                  <input value={form.startPoint} onChange={(e) => setForm({ ...form, startPoint: e.target.value })}
                    className={inputCls} placeholder="City or landmark" />
                </div>
                <div>
                  <label className={labelCls}>End Point</label>
                  <input value={form.endPoint} onChange={(e) => setForm({ ...form, endPoint: e.target.value })}
                    className={inputCls} placeholder="City or landmark" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Cover Photo (optional)</label>
                <ImageUploadZone
                  preview={coverPreview}
                  onChange={(f) => { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }}
                  onClear={() => { setCoverFile(null); setCoverPreview(null); }}
                  uploading={saving && !!coverFile}
                  disabled={saving}
                  label="Add cover photo"
                  height="h-36"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-transparent border border-white/[0.15] text-[#F5F5F5] py-3 text-sm rounded-[4px] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 font-bebas tracking-[2px] bg-[#FF6B00] text-black py-3 text-[14px] hover:bg-[#e55f00] active:scale-[0.97] disabled:opacity-50 transition-all">
                  {saving ? 'SAVING…' : 'ADD ROUTE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
