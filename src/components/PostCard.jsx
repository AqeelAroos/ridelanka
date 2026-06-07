import { useState } from 'react';
import { Heart, MessageCircle, Send, Calendar, MapPin, Users, Tag, Phone } from 'lucide-react';

const categoryStyle = {
  General:    'bg-white/[0.06] text-[#888]',
  Meetup:     'bg-blue-900/30  text-blue-400',
  'For Sale': 'bg-emerald-900/30 text-emerald-400',
  Tips:       'bg-amber-900/30  text-amber-400',
};

const conditionStyle = {
  New:        'bg-emerald-900/30 text-emerald-400',
  'Like New': 'bg-teal-900/30   text-teal-400',
  Good:       'bg-yellow-900/30 text-yellow-400',
  Fair:       'bg-orange-900/30 text-orange-400',
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

function initials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

/* ── gallery for all other post types ── */
function ImageGallery({ urls }) {
  const [active, setActive] = useState(0);
  if (!urls?.length) return null;
  return (
    <div className="mb-3">
      <img src={urls[active]} alt="" className="w-full rounded-[6px] object-cover max-h-[380px] border border-white/[0.06]" />
      {urls.length > 1 && (
        <div className="flex gap-1.5 mt-1.5">
          {urls.map((u, i) => (
            <button key={i} onClick={() => setActive(i)} className="flex-1 max-w-[72px]">
              <img
                src={u} alt=""
                className={`w-full h-12 object-cover rounded-[4px] border-2 transition-colors ${
                  i === active ? 'border-[#FF6B00]' : 'border-white/[0.06]'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── horizontal scroll gallery for For Sale ── */
function HScrollGallery({ urls }) {
  if (!urls?.length) return null;
  return (
    <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {urls.map((u, i) => (
        <img
          key={i} src={u} alt=""
          className="flex-shrink-0 h-36 w-36 object-cover rounded-[6px] border border-white/[0.06]"
        />
      ))}
    </div>
  );
}

/* ── meetup block ── */
function MeetupBlock({ post }) {
  return (
    <div
      className="mb-3 py-2.5 px-3 rounded-[0_4px_4px_0] text-sm space-y-1.5"
      style={{ background: 'rgba(255,107,0,0.06)', borderLeft: '3px solid #FF6B00' }}
    >
      <div className="flex items-center gap-2 text-[13px] text-[#888]">
        <Calendar size={12} className="text-[#FF6B00]" />
        <span>{post.meetupDate}{post.meetupTime && ` at ${post.meetupTime}`}</span>
      </div>
      {post.meetupLocation && (
        <div className="flex items-center gap-2 text-[13px] text-[#888]">
          <MapPin size={12} className="text-[#FF6B00]" />
          <span>{post.meetupLocation}</span>
        </div>
      )}
      {post.maxRiders && (
        <div className="flex items-center gap-2 text-[13px] text-[#888]">
          <Users size={12} className="text-[#FF6B00]" />
          <span>Max {post.maxRiders} riders</span>
        </div>
      )}
    </div>
  );
}

/* ── for-sale block ── */
function SaleBlock({ post }) {
  return (
    <div className="bg-[#161616] border border-white/[0.06] rounded-[6px] p-3 mb-3">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[#F5F5F5] font-medium text-[14px]">{post.itemTitle}</span>
        <span className="font-bebas text-[1.4rem] text-[#FF6B00] leading-none flex-shrink-0">
          LKR {Number(post.price).toLocaleString()}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {post.condition && (
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${conditionStyle[post.condition] || conditionStyle.Good}`}>
            {post.condition}
          </span>
        )}
        {post.saleCategory && (
          <div className="flex items-center gap-1 text-[11px] text-[#555]">
            <Tag size={10} />
            {post.saleCategory}
          </div>
        )}
        {post.contactNumber && (
          <div className="flex items-center gap-1 text-[11px] text-[#555] ml-auto">
            <Phone size={10} />
            {post.contactNumber}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostCard({ post, userId, onLike, onComment, showComments }) {
  const liked        = post.likes?.includes(userId);
  const likeCount    = post.likes?.length || 0;
  const commentCount = post.comments?.length || 0;
  const [showInput,  setShowInput]  = useState(false);
  const [comment,    setComment]    = useState('');
  const [sending,    setSending]    = useState(false);
  const [expanded,   setExpanded]   = useState(false);
  const [bouncing,   setBouncing]   = useState(false);

  // normalise imageUrl (string) and imageUrls (array) into one array
  const images = [
    ...(Array.isArray(post.imageUrls) ? post.imageUrls : []),
    ...(typeof post.imageUrl === 'string' && post.imageUrl && !post.imageUrls?.includes(post.imageUrl)
      ? [post.imageUrl] : []),
  ];

  const handleLike = () => {
    setBouncing(true);
    onLike(post.id, userId);
    setTimeout(() => setBouncing(false), 400);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !onComment) return;
    setSending(true);
    try {
      await onComment(post.id, { text: comment, authorId: userId, addedAt: new Date().toISOString() });
      setComment('');
    } finally {
      setSending(false);
    }
  };

  const longText = (post.text?.length || 0) > 220;

  return (
    <div className="bg-[#111] border border-white/[0.06] rounded-[8px] p-4 hover:border-[#FF6B00]/25 transition-all duration-200">

      {/* header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-[34px] h-[34px] rounded-full bg-[#FF6B00] flex items-center justify-center flex-shrink-0 select-none">
          <span className="text-black text-[11px] font-bold leading-none">
            {initials(post.authorName)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[#F5F5F5] text-[14px] font-medium">{post.authorName}</span>
            {post.category && (
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${categoryStyle[post.category] || categoryStyle.General}`}>
                {post.category}
              </span>
            )}
            {post.category === 'Tips' && post.tipCategory && (
              <span className="text-[11px] text-amber-500">· {post.tipCategory}</span>
            )}
          </div>
          <span className="text-[#555] text-[11px]">{timeAgo(post.createdAt)}</span>
        </div>
      </div>

      {/* category-specific content */}
      {post.category === 'For Sale' ? (
        <>
          <SaleBlock post={post} />
          <HScrollGallery urls={images} />
          {post.text && <p className="text-[#888] text-[13px] leading-[1.7] mb-3">{post.text}</p>}
        </>
      ) : post.category === 'Meetup' ? (
        <>
          <MeetupBlock post={post} />
          {post.text && (
            <div className="mb-3">
              <p className={`text-[#F5F5F5] text-[14px] leading-[1.7] ${expanded ? '' : 'line-clamp-4'}`}>
                {post.text}
              </p>
              {longText && (
                <button onClick={() => setExpanded(!expanded)} className="text-[#FF6B00] text-[12px] mt-1 hover:text-[#e55f00] transition-colors">
                  {expanded ? 'see less' : 'see more'}
                </button>
              )}
            </div>
          )}
          <ImageGallery urls={images} />
        </>
      ) : (
        <>
          {post.text && (
            <div className="mb-3">
              <p className={`text-[#F5F5F5] text-[14px] leading-[1.7] ${expanded ? '' : 'line-clamp-4'}`}>
                {post.text}
              </p>
              {longText && (
                <button onClick={() => setExpanded(!expanded)} className="text-[#FF6B00] text-[12px] mt-1 hover:text-[#e55f00] transition-colors">
                  {expanded ? 'see less' : 'see more'}
                </button>
              )}
            </div>
          )}
          <ImageGallery urls={images} />
        </>
      )}

      {/* actions */}
      <div className="flex items-center gap-5">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-[12px] transition-colors active:scale-[0.9] ${
            liked ? 'text-[#FF6B00]' : 'text-[#555] hover:text-[#FF6B00]'
          }`}
        >
          <Heart
            key={bouncing ? 1 : 0}
            size={14}
            fill={liked ? 'currentColor' : 'none'}
            className={bouncing ? 'like-bounce' : ''}
          />
          <span>{likeCount}</span>
        </button>

        {showComments && (
          <button
            onClick={() => setShowInput(!showInput)}
            className="flex items-center gap-1.5 text-[12px] text-[#555] hover:text-blue-400 transition-colors"
          >
            <MessageCircle size={14} />
            <span>{commentCount}</span>
          </button>
        )}
      </div>

      {/* recent comments */}
      {showComments && post.comments?.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3">
          {post.comments.slice(-3).map((c, i) => (
            <p key={i} className="text-[12px] text-[#888] leading-relaxed">{c.text}</p>
          ))}
        </div>
      )}

      {/* comment input */}
      {showComments && showInput && (
        <form onSubmit={handleComment} className="mt-3 flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 bg-[#1c1c1c] border border-white/[0.06] rounded-[4px] px-3 py-2 text-[#F5F5F5] text-[12px] placeholder-[#555] focus:outline-none focus:border-[#FF6B00] transition-colors"
          />
          <button type="submit" disabled={sending} className="text-[#FF6B00] hover:text-[#e55f00] disabled:opacity-50 transition-colors">
            <Send size={14} />
          </button>
        </form>
      )}
    </div>
  );
}
