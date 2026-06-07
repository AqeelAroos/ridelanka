import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Map, Users, Wrench, ShieldCheck } from 'lucide-react';

const navItems = [
  { to: '/dashboard',     icon: LayoutDashboard, label: 'HOME'    },
  { to: '/routes',        icon: Map,             label: 'ROUTES'  },
  { to: '/community',     icon: Users,           label: 'CREW'    },
  { to: '/garage',        icon: Wrench,          label: 'GARAGE'  },
  { to: '/helmet-health', icon: ShieldCheck,     label: 'HEALTH'  },
];

export default function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-xl border-t border-white/[0.05]"
      style={{ height: 60 }}
    >
      <div className="flex items-center justify-around px-2 h-full max-w-2xl mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className="relative flex flex-col items-center gap-0.5 px-3 transition-transform active:scale-[0.92]"
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  className={`transition-colors ${isActive ? 'text-[#FF6B00]' : 'text-[#555]'}`}
                />
                <span
                  className={`font-bebas text-[10px] tracking-widest transition-colors ${
                    isActive ? 'text-[#FF6B00]' : 'text-[#555]'
                  }`}
                >
                  {label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-[#FF6B00]" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
