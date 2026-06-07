import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, updateUserProfile } from '../firebase/auth';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

const inputCls = 'w-full bg-[#1c1c1c] border border-white/[0.06] rounded-[4px] px-4 py-3 text-[#F5F5F5] placeholder-[#555555] focus:outline-none focus:border-[#FF6B00] transition-colors text-sm';

export default function Register() {
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await registerUser(email, password);
      await updateUserProfile(name);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use. Try logging in instead.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-dvh flex">
      {/* ── Left panel – hero image ── */}
      <div className="hidden md:flex md:w-[55%] relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/75" />
        <div className="relative z-10 flex flex-col justify-end p-12 pb-16">
          <h1 className="font-bebas text-[7.5rem] leading-[0.9] text-white tracking-wide">
            RIDE<br />LANKA
          </h1>
          <p className="text-white/40 text-base mt-4 font-light tracking-wide">
            Join Sri Lanka's Premier Biker Community
          </p>
        </div>
      </div>

      {/* ── Right panel – form ── */}
      <div className="w-full md:w-[45%] flex flex-col items-center justify-center bg-[#080808] px-6 sm:px-8 py-12 min-h-screen min-h-dvh">
        <div className="w-full max-w-[340px]">

          {/* mobile logo */}
          <div className="md:hidden text-center mb-10">
            <span className="font-bebas text-5xl">
              <span className="text-[#F5F5F5]">RIDE</span>
              <span className="text-[#FF6B00]">LANKA</span>
            </span>
          </div>

          <h2 className="font-bebas text-[2.5rem] leading-none text-[#F5F5F5] tracking-wider">
            JOIN THE RIDE
          </h2>
          <p className="text-[#555] text-sm mt-1 mb-8 font-light">
            Create your account and connect with riders
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-900/20 border border-red-800/50 text-red-400 rounded-[4px] p-3 mb-5 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] text-[#888] mb-2 uppercase tracking-widest">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className={`${inputCls} pl-10`}
                  placeholder="Your biker name"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#888] mb-2 uppercase tracking-widest">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={`${inputCls} pl-10`}
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[#888] mb-2 uppercase tracking-widest">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#555]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputCls} pl-10`}
                  placeholder="Min. 6 characters"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full font-bebas tracking-[2px] bg-[#FF6B00] text-black py-3.5 text-[15px] hover:bg-[#e55f00] active:scale-[0.97] disabled:opacity-50 transition-all"
              >
                {loading ? 'CREATING ACCOUNT…' : 'CREATE ACCOUNT'}
              </button>
            </div>
          </form>

          <p className="text-center text-[#555] text-sm mt-8">
            Already a member?{' '}
            <Link to="/login" className="text-[#FF6B00] hover:text-[#e55f00] font-medium transition-colors">
              SIGN IN
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
