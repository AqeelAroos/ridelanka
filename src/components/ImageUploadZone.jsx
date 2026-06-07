import { useRef } from 'react';
import { Upload, X, Loader2, ImageIcon } from 'lucide-react';

/**
 * Single-image upload zone.
 * Props:
 *   preview    – object URL string (or null)
 *   onChange   – (File) => void   called when a file is picked
 *   onClear    – ()    => void   called when the × is clicked
 *   uploading  – bool  show spinner overlay on the preview
 *   disabled   – bool  disable the whole zone
 *   label      – string
 *   height     – tailwind height class, default 'h-40'
 */
export default function ImageUploadZone({
  preview,
  onChange,
  onClear,
  uploading = false,
  disabled = false,
  label = 'Add photo',
  height = 'h-40',
}) {
  const ref = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onChange(file);
    e.target.value = '';
  };

  /* ── preview state ── */
  if (preview) {
    return (
      <div className={`relative w-full ${height} rounded-xl overflow-hidden border border-[#2a2a2a]`}>
        <img src={preview} alt="" className="w-full h-full object-cover" />

        {/* uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
            <Loader2 size={24} className="text-[#FF6B00] animate-spin" />
            <span className="text-xs text-white/70">Uploading…</span>
          </div>
        )}

        {/* clear button */}
        {!uploading && !disabled && (
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 rounded-full p-1.5 text-white transition-colors"
          >
            <X size={13} />
          </button>
        )}
      </div>
    );
  }

  /* ── empty state ── */
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => ref.current?.click()}
      className={`w-full ${height} border border-dashed border-[#3a3a3a] hover:border-[#FF6B00] rounded-xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-[#FF6B00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {uploading ? (
        <Loader2 size={22} className="text-[#FF6B00] animate-spin" />
      ) : (
        <>
          <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center">
            <ImageIcon size={18} />
          </div>
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-gray-600">JPEG · PNG · WebP</span>
        </>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleChange} />
    </button>
  );
}
