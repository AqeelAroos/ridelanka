import { useState } from 'react';
import { Bike, Wrench, ChevronDown, ChevronUp, Plus } from 'lucide-react';

export default function BikeCard({ bike, onAddService }) {
  const [showLog, setShowLog] = useState(false);
  const serviceLog = bike.serviceLog || [];

  return (
    <div
      className="bg-[#111] rounded-[8px] overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ border: '1px solid rgba(255,255,255,0.06)', borderLeft: '3px solid #FF6B00' }}
    >
      {/* cover photo */}
      {bike.photoUrl ? (
        <div className="h-[200px] overflow-hidden">
          <img
            src={bike.photoUrl}
            alt={`${bike.make} ${bike.model}`}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="h-[100px] flex items-center justify-center bg-[#161616]">
          <div className="w-14 h-14 rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/20 flex items-center justify-center">
            <Bike size={28} className="text-[#FF6B00]/60" />
          </div>
        </div>
      )}

      {/* info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="font-bebas text-[1.3rem] text-[#F5F5F5] leading-tight">
            {bike.year} {bike.make} {bike.model}
          </h3>
          <button
            onClick={onAddService}
            className="flex items-center gap-1 bg-transparent border border-white/[0.12] hover:border-[#FF6B00] hover:text-[#FF6B00] text-[#888] text-[11px] px-2.5 py-1.5 rounded-[4px] transition-colors flex-shrink-0"
          >
            <Plus size={11} />
            Service
          </button>
        </div>

        {/* stats grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 py-3 border-t border-white/[0.06] mb-1">
          {bike.mileage > 0 && (
            <div>
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-0.5">Mileage</div>
              <div className="text-[#F5F5F5] text-[13px]">{bike.mileage.toLocaleString()} km</div>
            </div>
          )}
          {bike.year && (
            <div>
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-0.5">Year</div>
              <div className="text-[#F5F5F5] text-[13px]">{bike.year}</div>
            </div>
          )}
          {bike.color && (
            <div>
              <div className="text-[10px] text-[#555] uppercase tracking-widest mb-0.5">Color</div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-white/10 flex-shrink-0"
                  style={{ backgroundColor: bike.color.toLowerCase() }}
                />
                <span className="text-[#F5F5F5] text-[13px] capitalize">{bike.color}</span>
              </div>
            </div>
          )}
          <div>
            <div className="text-[10px] text-[#555] uppercase tracking-widest mb-0.5">Services</div>
            <div className="text-[#F5F5F5] text-[13px]">{serviceLog.length}</div>
          </div>
        </div>

        {/* service log toggle */}
        {serviceLog.length > 0 && (
          <>
            <button
              onClick={() => setShowLog(!showLog)}
              className="w-full flex items-center justify-between pt-3 border-t border-white/[0.06] text-[11px] text-[#555] hover:text-[#F5F5F5] transition-colors mt-1"
            >
              <div className="flex items-center gap-1.5 font-bebas tracking-widest text-[13px]">
                <Wrench size={11} />
                SERVICE LOG
              </div>
              <span className={`transition-transform duration-200 ${showLog ? 'rotate-180' : ''}`}>
                <ChevronDown size={14} />
              </span>
            </button>

            {showLog && (
              <div className="mt-3 space-y-0">
                {[...serviceLog].reverse().map((s, i) => (
                  <div key={i} className="relative flex gap-3 pl-6 pb-4 last:pb-0">
                    {i < serviceLog.length - 1 && (
                      <div className="absolute left-[9px] top-4 bottom-0 w-px bg-white/[0.06]" />
                    )}
                    <div className="absolute left-0 top-1 w-[18px] h-[18px] rounded-full bg-[#FF6B00]/10 border border-[#FF6B00]/30 flex items-center justify-center flex-shrink-0">
                      <div className="w-[6px] h-[6px] rounded-full bg-[#FF6B00]" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[#F5F5F5] text-[12px] font-medium">{s.type}</span>
                        {s.cost > 0 && (
                          <span className="font-bebas text-[13px] text-[#FF6B00] tracking-wider">
                            LKR {s.cost.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className="text-[#555] text-[11px]">{s.date}</span>
                      {s.notes && (
                        <p className="text-[#888] text-[11px] mt-0.5 leading-relaxed">{s.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {serviceLog.length === 0 && (
          <div className="pt-3 border-t border-white/[0.06] text-[11px] text-[#555] text-center mt-1">
            No service records yet
          </div>
        )}
      </div>
    </div>
  );
}
