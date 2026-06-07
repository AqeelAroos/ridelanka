import { useState, useEffect } from 'react';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { logoutUser } from '../firebase/auth';

export default function Navbar() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const initials = user?.displayName
    ? user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 bg-[#080808]/92 backdrop-blur-xl ${
        scrolled ? 'border-b border-white/[0.08]' : 'border-b border-transparent'
      }`}
    >
      <div className="flex items-center justify-between px-5 h-14 max-w-2xl mx-auto">
        <span className="font-bebas text-[1.6rem] leading-none tracking-wider">
          <span className="text-[#F5F5F5]">RIDE</span>
          <span className="text-[#FF6B00]">LANKA</span>
        </span>

        <div className="flex items-center gap-4">
          <button className="text-[#555] hover:text-[#FF6B00] transition-colors">
            <Bell size={18} />
          </button>
          <div className="w-[28px] h-[28px] rounded-full bg-[#FF6B00] flex items-center justify-center select-none">
            <span className="text-black text-[11px] font-bold leading-none">{initials}</span>
          </div>
          <button
            onClick={logoutUser}
            className="text-[#555] hover:text-[#F5F5F5] transition-colors"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
