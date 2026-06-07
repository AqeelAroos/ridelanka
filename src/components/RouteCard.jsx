import { Heart, MapPin, Gauge, User } from 'lucide-react';

const difficultyStyle = {
  Easy:   'text-[#22c55e] bg-[#22c55e]/10 border border-[#22c55e]/20',
  Medium: 'text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/20',
  Hard:   'text-[#ef4444] bg-[#ef4444]/10 border border-[#ef4444]/20',
};

export default function RouteCard({ route, userId, onLike }) {
  const liked     = route.likes?.includes(userId);
  const likeCount = route.likes?.length || 0;

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-[8px] overflow-hidden hover:border-[#FF6B00]/30 hover:-translate-y-0.5 transition-all duration-200 cursor-default">

      {/* cover / placeholder */}
      {route.coverUrl ? (
        <div className="h-[180px] overflow-hidden">
          <img
            src={route.coverUrl}
            alt={route.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className="h-[130px] flex flex-col items-center justify-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#161616 0%,#111 100%)' }}
        >
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'repeating-linear-gradient(45deg,#FF6B00 0px,#FF6B00 1px,transparent 1px,transparent 22px)' }}
          />
          <h3 className="font-bebas text-[1.7rem] text-[#F5F5F5] relative z-10 text-center px-4 leading-tight">
            {route.name}
          </h3>
          <span className="text-[#555] text-[11px] mt-1 relative z-10 uppercase tracking-widest">
            {route.region}
          </span>
        </div>
      )}

      {/* body */}
      <div className="p-4">
        {/* top row */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] text-[#FF6B00] font-bebas tracking-widest uppercase">
            {route.region}
          </span>
          <span className="text-[#333]">·</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${difficultyStyle[route.difficulty] || difficultyStyle.Easy}`}>
            {route.difficulty}
          </span>
        </div>

        {/* route name (only when cover image exists — placeholder shows it) */}
        {route.coverUrl && (
          <h3 className="font-bebas text-[1.4rem] text-[#F5F5F5] leading-tight mb-1">
            {route.name}
          </h3>
        )}

        {route.description && (
          <p className="text-[#888] text-[13px] leading-relaxed mb-3 line-clamp-2">
            {route.description}
          </p>
        )}

        {/* meta */}
        <div className="flex items-center gap-4 text-[12px] text-[#555] mb-3">
          <div className="flex items-center gap-1">
            <Gauge size={11} className="text-[#FF6B00]" />
            <span>{route.distance} km</span>
          </div>
          {route.startPoint && route.endPoint && (
            <span className="truncate flex-1">{route.startPoint} → {route.endPoint}</span>
          )}
        </div>

        {/* bottom row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] text-[#555]">
            <User size={11} />
            <span>{route.createdBy}</span>
          </div>
          <button
            onClick={() => onLike(route.id, userId)}
            className={`flex items-center gap-1.5 text-[12px] transition-colors active:scale-[0.9] ${
              liked ? 'text-[#FF6B00]' : 'text-[#555] hover:text-[#FF6B00]'
            }`}
          >
            <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
            <span>{likeCount}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
