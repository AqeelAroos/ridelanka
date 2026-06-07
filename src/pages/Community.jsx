import { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePosts } from '../hooks/usePosts';
import PostCard from '../components/PostCard';
import { uploadMultipleImages } from '../services/cloudinaryUpload';
import { Plus, X, Users, ImageIcon } from 'lucide-react';

const CATEGORIES = ['General', 'Meetup', 'For Sale', 'Tips'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair'];
const SALE_CATS  = ['Bike', 'Helmet', 'Gear', 'Parts', 'Accessories'];
const TIP_CATS   = ['Maintenance', 'Safety', 'Routes', 'Gear', 'Legal'];

const emptyForm = {
  text: '', meetupDate: '', meetupTime: '', meetupLocation: '', maxRiders: '',
  itemTitle: '', price: '', condition: 'New', saleCategory: 'Bike',
  contactNumber: '', description: '', tipCategory: 'Maintenance',
};

const inputCls = 'w-full bg-[#1c1c1c] border border-white/[0.06] rounded-[4px] px-4 py-3 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#FF6B00] transition-colors text-sm';
const labelCls = 'block text-[11px] text-[#888] mb-2 uppercase tracking-widest';

const catTabStyle = {
  General:    { active: 'bg-white/[0.1] border-white/20 text-[#F5F5F5]'  },
  Meetup:     { active: 'bg-blue-900/40  border-blue-700/40 text-blue-300' },
  'For Sale': { active: 'bg-emerald-900/40 border-emerald-700/40 text-emerald-300' },
  Tips:       { active: 'bg-amber-900/40  border-amber-700/40 text-amber-300'  },
};

/* ── photo upload sub-component ── */
function PhotoUpload({ previews, onSelect, onRemove, max, multiple = false, label = 'Photo' }) {
  const fileRef = useRef(null);
  return (
    <div>
      <label className={labelCls}>{label}{max > 1 ? ` (up to ${max})` : ''}</label>
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {previews.map((src, i) => (
            <div key={i} className="relative">
              <img src={src} alt="" className="w-20 h-20 object-cover rounded-[4px] border border-white/[0.06]" />
              <button type="button" onClick={() => onRemove(i)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-black/80 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
      {previews.length < max && (
        <button type="button" onClick={() => fileRef.current?.click()}
          className="w-full h-20 border border-dashed border-white/[0.10] hover:border-[#FF6B00]/50 rounded-[4px] flex flex-col items-center justify-center gap-1.5 text-[#555] hover:text-[#FF6B00]/60 transition-colors">
          <ImageIcon size={16} />
          <span className="text-[11px]">{previews.length ? 'Add more' : `Choose ${label.toLowerCase()}`}</span>
          <input ref={fileRef} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={onSelect} />
        </button>
      )}
    </div>
  );
}

export default function Community() {
  const { user } = useAuth();
  const { posts, loading, addPost, toggleLike, addComment } = usePosts();
  const [showForm, setShowForm]           = useState(false);
  const [category, setCategory]           = useState('General');
  const [form, setForm]                   = useState(emptyForm);
  const [photos, setPhotos]               = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [saving, setSaving]               = useState(false);
  const [uploadMsg, setUploadMsg]         = useState('');
  const [errorMsg, setErrorMsg]           = useState('');
  const [filterCat, setFilterCat]         = useState('All');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handlePhotoSelect = (e, max) => {
    const incoming = Array.from(e.target.files);
    setPhotos((prev) => {
      const combined = [...prev, ...incoming].slice(0, max);
      setPhotoPreviews(combined.map((f) => URL.createObjectURL(f)));
      return combined;
    });
    e.target.value = '';
  };

  const removePhoto = (idx) => {
    setPhotos((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      setPhotoPreviews(next.map((f) => URL.createObjectURL(f)));
      return next;
    });
  };

  const uploadPhotos = async () => {
    if (!photos.length) return [];
    setUploadMsg('Uploading images…');
    const urls = await uploadMultipleImages(photos, 'ridelanka/posts');
    setUploadMsg('');
    return urls;
  };

  const resetAndClose = () => {
    setShowForm(false);
    setForm(emptyForm);
    setPhotos([]);
    setPhotoPreviews([]);
    setCategory('General');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      const imageUrls = await uploadPhotos();
      const base = { category, authorName: user.displayName || user.email, authorUid: user.uid, imageUrls };

      if (category === 'General') {
        await addPost({ ...base, text: form.text });
      } else if (category === 'Meetup') {
        await addPost({ ...base, text: form.text, meetupDate: form.meetupDate, meetupTime: form.meetupTime,
          meetupLocation: form.meetupLocation, maxRiders: parseInt(form.maxRiders) || null });
      } else if (category === 'For Sale') {
        await addPost({ ...base, text: form.description, itemTitle: form.itemTitle,
          price: parseFloat(form.price) || 0, condition: form.condition,
          saleCategory: form.saleCategory, contactNumber: form.contactNumber });
      } else if (category === 'Tips') {
        await addPost({ ...base, text: form.text, tipCategory: form.tipCategory });
      }

      resetAndClose();
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
      setUploadMsg('');
    }
  };

  const filtered = filterCat === 'All' ? posts : posts.filter((p) => p.category === filterCat);

  const PillTab = ({ label, active, onClick }) => (
    <button onClick={onClick}
      className={`px-3.5 h-8 rounded-full text-[12px] transition-all whitespace-nowrap border ${
        active
          ? 'bg-[#FF6B00] border-[#FF6B00] text-black font-medium'
          : 'bg-transparent border-white/[0.12] text-[#888] hover:border-[#FF6B00]/60 hover:text-[#FF6B00]'
      }`}>
      {label}
    </button>
  );

  return (
    <div className="pb-28 pt-14 px-5 max-w-2xl mx-auto page-enter">

      {/* ── header ── */}
      <div className="mt-6 mb-6">
        <h1 className="font-bebas text-[3rem] leading-none text-[#F5F5F5] tracking-wide">COMMUNITY</h1>
        <p className="text-[#555] text-[13px] mt-1">Connect with Sri Lanka riders</p>
      </div>

      {/* ── category filter ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-6">
        <PillTab label="All" active={filterCat === 'All'} onClick={() => setFilterCat('All')} />
        {CATEGORIES.map((c) => (
          <PillTab key={c} label={c} active={filterCat === c} onClick={() => setFilterCat(c)} />
        ))}
      </div>

      {/* ── feed ── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-36 w-full" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#111] border border-white/[0.06] rounded-[8px]">
          <Users size={44} className="text-[#333] mb-4" />
          <h3 className="font-bebas text-[1.6rem] tracking-wider text-[#F5F5F5] mb-1">NO POSTS YET</h3>
          <p className="text-[#555] text-[13px] mb-5">Start the conversation!</p>
          <button onClick={() => setShowForm(true)}
            className="font-bebas tracking-[2px] bg-[#FF6B00] text-black px-7 py-2.5 text-[13px] hover:bg-[#e55f00] active:scale-[0.97] transition-all">
            POST NOW
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post, i) => (
            <div key={post.id} className="card-reveal" style={{ animationDelay: `${i * 0.05}s` }}>
              <PostCard post={post} userId={user?.uid} onLike={toggleLike} onComment={addComment} showComments />
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

      {/* ── New Post Modal ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-[8px] z-50 flex items-end sm:items-center justify-center p-4">
          <div className="modal-enter bg-[#111] border border-white/[0.08] rounded-[12px] w-full max-w-[480px] max-h-[92vh] overflow-y-auto">

            <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06] sticky top-0 bg-[#111] z-10">
              <h3 className="font-bebas text-[1.6rem] tracking-wider text-[#F5F5F5]">NEW POST</h3>
              <button onClick={resetAndClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#555] hover:text-white hover:bg-white/[0.06] transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">

              {/* category selector */}
              <div>
                <label className={labelCls}>Category</label>
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map((c) => {
                    const active = category === c;
                    const style  = catTabStyle[c] || catTabStyle.General;
                    return (
                      <button key={c} type="button"
                        onClick={() => { setCategory(c); setPhotos([]); setPhotoPreviews([]); }}
                        className={`px-3.5 h-8 rounded-full text-[12px] border transition-all ${
                          active ? style.active : 'bg-transparent border-white/[0.10] text-[#888]'
                        }`}>
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── GENERAL ── */}
              {category === 'General' && (
                <>
                  <div>
                    <label className={labelCls}>Content</label>
                    <textarea required rows={4} value={form.text} onChange={(e) => set('text', e.target.value)}
                      className={`${inputCls} resize-none`} placeholder="Share with the community…" />
                  </div>
                  <PhotoUpload previews={photoPreviews} onSelect={(e) => handlePhotoSelect(e, 1)}
                    onRemove={removePhoto} max={1} label="Photo (optional)" />
                </>
              )}

              {/* ── MEETUP ── */}
              {category === 'Meetup' && (
                <>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea required rows={3} value={form.text} onChange={(e) => set('text', e.target.value)}
                      className={`${inputCls} resize-none`} placeholder="Describe the meetup…" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Date</label>
                      <input required type="date" value={form.meetupDate} onChange={(e) => set('meetupDate', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Time</label>
                      <input required type="time" value={form.meetupTime} onChange={(e) => set('meetupTime', e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Location</label>
                    <input required value={form.meetupLocation} onChange={(e) => set('meetupLocation', e.target.value)}
                      className={inputCls} placeholder="e.g. Kandy City Center" />
                  </div>
                  <div>
                    <label className={labelCls}>Max Riders</label>
                    <input type="number" min="1" value={form.maxRiders} onChange={(e) => set('maxRiders', e.target.value)}
                      className={inputCls} placeholder="20" />
                  </div>
                  <PhotoUpload previews={photoPreviews} onSelect={(e) => handlePhotoSelect(e, 1)}
                    onRemove={removePhoto} max={1} label="Photo (optional)" />
                </>
              )}

              {/* ── FOR SALE ── */}
              {category === 'For Sale' && (
                <>
                  <div>
                    <label className={labelCls}>Item Title</label>
                    <input required value={form.itemTitle} onChange={(e) => set('itemTitle', e.target.value)}
                      className={inputCls} placeholder="e.g. Honda CBR 2021" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Price (LKR)</label>
                      <input required type="number" min="0" value={form.price} onChange={(e) => set('price', e.target.value)}
                        className={inputCls} placeholder="500000" />
                    </div>
                    <div>
                      <label className={labelCls}>Condition</label>
                      <select value={form.condition} onChange={(e) => set('condition', e.target.value)} className={inputCls}>
                        {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Category</label>
                    <select value={form.saleCategory} onChange={(e) => set('saleCategory', e.target.value)} className={inputCls}>
                      {SALE_CATS.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea rows={3} value={form.description} onChange={(e) => set('description', e.target.value)}
                      className={`${inputCls} resize-none`} placeholder="Describe the item, defects, history…" />
                  </div>
                  <div>
                    <label className={labelCls}>Contact Number</label>
                    <input value={form.contactNumber} onChange={(e) => set('contactNumber', e.target.value)}
                      className={inputCls} placeholder="+94 77 123 4567" />
                  </div>
                  <PhotoUpload previews={photoPreviews} onSelect={(e) => handlePhotoSelect(e, 4)}
                    onRemove={removePhoto} max={4} multiple label="Photos (up to 4)" />
                </>
              )}

              {/* ── TIPS ── */}
              {category === 'Tips' && (
                <>
                  <div>
                    <label className={labelCls}>Tip Category</label>
                    <div className="flex gap-2 flex-wrap">
                      {TIP_CATS.map((tc) => (
                        <button key={tc} type="button" onClick={() => set('tipCategory', tc)}
                          className={`px-3 h-7 rounded-full text-[11px] border transition-all ${
                            form.tipCategory === tc
                              ? 'bg-amber-900/40 border-amber-700/40 text-amber-300'
                              : 'bg-transparent border-white/[0.10] text-[#888]'
                          }`}>
                          {tc}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Content</label>
                    <textarea required rows={4} value={form.text} onChange={(e) => set('text', e.target.value)}
                      className={`${inputCls} resize-none`} placeholder="Share your riding tip…" />
                  </div>
                  <PhotoUpload previews={photoPreviews} onSelect={(e) => handlePhotoSelect(e, 1)}
                    onRemove={removePhoto} max={1} label="Photo (optional)" />
                </>
              )}

              {uploadMsg && <p className="text-[12px] text-[#FF6B00] text-center">{uploadMsg}</p>}
              {errorMsg && (
                <div className="bg-red-900/20 border border-red-800/40 rounded-[4px] px-3 py-2.5 text-[12px] text-red-400 text-center">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={resetAndClose}
                  className="flex-1 bg-transparent border border-white/[0.15] text-[#F5F5F5] py-3 text-sm rounded-[4px] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 font-bebas tracking-[2px] bg-[#FF6B00] text-black py-3 text-[14px] hover:bg-[#e55f00] active:scale-[0.97] disabled:opacity-50 transition-all">
                  {saving ? (uploadMsg || 'POSTING…') : 'POST'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
