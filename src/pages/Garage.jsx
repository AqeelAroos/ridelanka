import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../firebase/firebase';
import {
  collection, addDoc, onSnapshot, query, where,
  serverTimestamp, doc, updateDoc, arrayUnion
} from 'firebase/firestore';
import BikeCard from '../components/BikeCard';
import ImageUploadZone from '../components/ImageUploadZone';
import { uploadImage } from '../services/cloudinaryUpload';
import { Plus, X, Wrench } from 'lucide-react';

const defaultBike    = { make: '', model: '', year: '', color: '', mileage: '' };
const defaultService = { date: '', type: '', cost: '', notes: '' };
const SERVICE_TYPES  = ['Oil Change', 'Tire Change', 'Chain Lube', 'Brake Service', 'General Service', 'Other'];

const inputCls = 'w-full bg-[#1c1c1c] border border-white/[0.06] rounded-[4px] px-4 py-3 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#FF6B00] transition-colors text-sm';
const labelCls = 'block text-[11px] text-[#888] mb-2 uppercase tracking-widest';

export default function Garage() {
  const { user } = useAuth();
  const [bikes,         setBikes]        = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [showBikeForm,  setShowBikeForm] = useState(false);
  const [showSvcForm,   setShowSvcForm]  = useState(null);
  const [bikeForm,      setBikeForm]     = useState(defaultBike);
  const [serviceForm,   setServiceForm]  = useState(defaultService);
  const [bikePhoto,     setBikePhoto]    = useState(null);
  const [bikePhotoPreview, setBikePhotoPreview] = useState(null);
  const [saving,        setSaving]       = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'bikes'), where('ownerUid', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0));
      setBikes(data);
      setLoading(false);
    }, () => setLoading(false));
    return unsub;
  }, [user]);

  const handleAddBike = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let photoUrl = null;
      if (bikePhoto) photoUrl = await uploadImage(bikePhoto, 'ridelanka/bikes');
      await addDoc(collection(db, 'bikes'), {
        ...bikeForm,
        year:     parseInt(bikeForm.year),
        mileage:  parseInt(bikeForm.mileage),
        ownerUid: user.uid,
        ownerName: user.displayName || user.email,
        createdAt: serverTimestamp(),
        serviceLog: [],
        ...(photoUrl && { photoUrl }),
      });
      setBikeForm(defaultBike);
      setBikePhoto(null);
      setBikePhotoPreview(null);
      setShowBikeForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateDoc(doc(db, 'bikes', showSvcForm), {
        serviceLog: arrayUnion({
          ...serviceForm,
          cost: parseFloat(serviceForm.cost) || 0,
          addedAt: new Date().toISOString(),
        }),
      });
      setServiceForm(defaultService);
      setShowSvcForm(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-28 pt-14 px-5 max-w-2xl mx-auto page-enter">

      {/* ── header ── */}
      <div className="mt-6 mb-6">
        <h1 className="font-bebas text-[3rem] leading-none text-[#F5F5F5] tracking-wide">MY GARAGE</h1>
        <p className="text-[#555] text-[13px] mt-1">
          {loading ? '…' : `${bikes.length} bike${bikes.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* ── bikes ── */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="skeleton h-52 w-full" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : bikes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-[#111] border border-white/[0.06] rounded-[8px]">
          <Wrench size={44} className="text-[#333] mb-4" />
          <h3 className="font-bebas text-[1.6rem] tracking-wider text-[#F5F5F5] mb-1">NO BIKES YET</h3>
          <p className="text-[#555] text-[13px] mb-5">Add your first ride to the garage</p>
          <button onClick={() => setShowBikeForm(true)}
            className="font-bebas tracking-[2px] bg-[#FF6B00] text-black px-7 py-2.5 text-[13px] hover:bg-[#e55f00] active:scale-[0.97] transition-all">
            ADD BIKE
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bikes.map((bike, i) => (
            <div key={bike.id} className="card-reveal" style={{ animationDelay: `${i * 0.07}s` }}>
              <BikeCard bike={bike} onAddService={() => setShowSvcForm(bike.id)} />
            </div>
          ))}
        </div>
      )}

      {/* ── FAB ── */}
      <button
        onClick={() => setShowBikeForm(true)}
        className="fixed bottom-20 right-5 w-[52px] h-[52px] bg-[#FF6B00] rounded-full flex items-center justify-center hover:scale-[1.08] active:scale-[0.94] transition-transform z-30"
        style={{ boxShadow: '0 4px 20px rgba(255,107,0,0.4)' }}
      >
        <Plus size={24} className="text-black" />
      </button>

      {/* ── Add Bike Modal ── */}
      {showBikeForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-[8px] z-50 flex items-end sm:items-center justify-center p-4">
          <div className="modal-enter bg-[#111] border border-white/[0.08] rounded-[12px] w-full max-w-[480px] max-h-[92vh] overflow-y-auto">

            <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06] sticky top-0 bg-[#111] z-10">
              <h3 className="font-bebas text-[1.6rem] tracking-wider text-[#F5F5F5]">ADD BIKE</h3>
              <button onClick={() => setShowBikeForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#555] hover:text-white hover:bg-white/[0.06] transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddBike} className="px-7 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Make</label>
                  <input required value={bikeForm.make} onChange={(e) => setBikeForm({ ...bikeForm, make: e.target.value })}
                    className={inputCls} placeholder="Honda" />
                </div>
                <div>
                  <label className={labelCls}>Model</label>
                  <input required value={bikeForm.model} onChange={(e) => setBikeForm({ ...bikeForm, model: e.target.value })}
                    className={inputCls} placeholder="CB500F" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Year</label>
                  <input type="number" required min="1980" max="2030" value={bikeForm.year}
                    onChange={(e) => setBikeForm({ ...bikeForm, year: e.target.value })}
                    className={inputCls} placeholder="2022" />
                </div>
                <div>
                  <label className={labelCls}>Color</label>
                  <input value={bikeForm.color} onChange={(e) => setBikeForm({ ...bikeForm, color: e.target.value })}
                    className={inputCls} placeholder="Black" />
                </div>
                <div>
                  <label className={labelCls}>Mileage km</label>
                  <input type="number" min="0" value={bikeForm.mileage}
                    onChange={(e) => setBikeForm({ ...bikeForm, mileage: e.target.value })}
                    className={inputCls} placeholder="5000" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Bike Photo (optional)</label>
                <ImageUploadZone
                  preview={bikePhotoPreview}
                  onChange={(f) => { setBikePhoto(f); setBikePhotoPreview(URL.createObjectURL(f)); }}
                  onClear={() => { setBikePhoto(null); setBikePhotoPreview(null); }}
                  uploading={saving && !!bikePhoto}
                  disabled={saving}
                  label="Add bike photo"
                  height="h-36"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowBikeForm(false)}
                  className="flex-1 bg-transparent border border-white/[0.15] text-[#F5F5F5] py-3 text-sm rounded-[4px] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 font-bebas tracking-[2px] bg-[#FF6B00] text-black py-3 text-[14px] hover:bg-[#e55f00] active:scale-[0.97] disabled:opacity-50 transition-all">
                  {saving ? 'SAVING…' : 'ADD BIKE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Log Service Modal ── */}
      {showSvcForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-[8px] z-50 flex items-end sm:items-center justify-center p-4">
          <div className="modal-enter bg-[#111] border border-white/[0.08] rounded-[12px] w-full max-w-[480px]">

            <div className="flex items-center justify-between px-7 py-5 border-b border-white/[0.06]">
              <h3 className="font-bebas text-[1.6rem] tracking-wider text-[#F5F5F5]">LOG SERVICE</h3>
              <button onClick={() => setShowSvcForm(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[#555] hover:text-white hover:bg-white/[0.06] transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddService} className="px-7 py-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Date</label>
                  <input type="date" required value={serviceForm.date}
                    onChange={(e) => setServiceForm({ ...serviceForm, date: e.target.value })}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Cost (LKR)</label>
                  <input type="number" min="0" value={serviceForm.cost}
                    onChange={(e) => setServiceForm({ ...serviceForm, cost: e.target.value })}
                    className={inputCls} placeholder="5000" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Service Type</label>
                <select value={serviceForm.type} onChange={(e) => setServiceForm({ ...serviceForm, type: e.target.value })} className={inputCls}>
                  {SERVICE_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Notes</label>
                <textarea rows={2} value={serviceForm.notes}
                  onChange={(e) => setServiceForm({ ...serviceForm, notes: e.target.value })}
                  className={`${inputCls} resize-none`} placeholder="Any notes…" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowSvcForm(null)}
                  className="flex-1 bg-transparent border border-white/[0.15] text-[#F5F5F5] py-3 text-sm rounded-[4px] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 font-bebas tracking-[2px] bg-[#FF6B00] text-black py-3 text-[14px] hover:bg-[#e55f00] active:scale-[0.97] disabled:opacity-50 transition-all">
                  {saving ? 'SAVING…' : 'LOG SERVICE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
