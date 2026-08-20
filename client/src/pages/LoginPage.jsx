import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const { signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(false);

  // Already logged in
  if (user) {
    const redirect = params.get('redirect') || '/lobby';
    navigate(redirect, { replace: true });
    return null;
  }

  async function handleGoogleLogin() {
    setLoading(true);
    try { await signInWithGoogle(); }
    catch (err) { console.error(err); setLoading(false); }
  }

  return (
    <div className="min-h-screen box-border px-6 pt-16 pb-12 bg-bg text-text flex flex-col font-sans dark max-w-md mx-auto">
      {/* Top Banner */}
      <div className="flex items-center gap-2.5 overflow-hidden border border-white/10 rounded-lg py-2 px-2.5 bg-white/5">
        <span className="font-mono font-bold text-[9px] tracking-[0.12em] text-[#0B0D10] bg-danger px-1.5 py-1 rounded-[3px] shrink-0">
          LIVE
        </span>
        <span className="font-mono font-normal text-[11px] text-[#EDEAE3]/55 whitespace-nowrap">
          14 new questions minted from today's feed
        </span>
      </div>

      {/* Hero Section */}
      <div className="mt-14 flex flex-col gap-3.5">
        <div className="flex items-center gap-3">
          <div className="w-[46px] h-[46px] rounded-[13px] bg-accent flex items-center justify-center font-bold text-2xl text-[#0B0D10]">
            Q
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-danger"></div>
        </div>
        <h1 className="m-0 font-bold text-[44px] leading-[1.02] tracking-[-0.03em]">
          Quiz<span className="text-accent">Rush</span>
        </h1>
        <p className="m-0 font-normal text-[15px] leading-[1.5] text-[#EDEAE3]/55 max-w-[280px] text-balance">
          Tech trivia written from this morning's news. Ten seconds a question. Bring friends.
        </p>
      </div>

      {/* Auth Form (Dummy email/pass for visual parity, actual login via Google) */}
      <div className="mt-10 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-[#EDEAE3]/40">EMAIL</span>
          <div className="h-[52px] rounded-xl bg-white/5 border border-white/10 flex items-center px-4 font-normal text-base text-[#EDEAE3]/90">
            ada@quizrush.dev
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="font-mono font-medium text-[10px] tracking-[0.1em] text-[#EDEAE3]/40">PASSWORD</span>
          <div className="h-[52px] rounded-xl bg-white/5 border border-accent flex items-center justify-between px-4 font-normal text-base tracking-[0.22em] text-[#EDEAE3]/90">
            <span>••••••••</span>
            <span className="font-mono font-medium text-[11px] tracking-[0.06em] text-accent">SHOW</span>
          </div>
        </div>
        
        <button className="h-[54px] rounded-xl bg-accent flex items-center justify-center font-semibold text-[17px] text-[#0B0D10] mt-1 hover:brightness-110 transition-all">
          Log in
        </button>
        
        <div className="flex gap-2.5 mt-1">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex-1 h-[50px] rounded-xl border border-white/15 flex items-center justify-center gap-2 font-medium text-sm text-[#EDEAE3]/85 hover:bg-white/5 transition-colors"
          >
            <span className="w-4 h-4 rounded-full" style={{ background: 'conic-gradient(#EDEAE3 0 25%, rgba(237,234,227,0.45) 0)' }}></span>
            Google
          </button>
          <button className="flex-1 h-[50px] rounded-xl border border-white/15 flex items-center justify-center gap-2 font-medium text-sm text-[#EDEAE3]/85 hover:bg-white/5 transition-colors">
            <span className="w-4 h-4 rounded-sm bg-[#EDEAE3]/75"></span>
            GitHub
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-[26px]"></div>

      {/* Guest Join */}
      <div className="border-t border-white/10 pt-4 flex flex-col gap-2.5">
        <span className="font-normal text-[13px] text-[#EDEAE3]/45">Someone sent you a room code?</span>
        <button 
          onClick={() => navigate('/join')}
          className="h-[50px] rounded-xl border border-dashed border-accent/50 flex items-center justify-center gap-2.5 font-semibold text-sm text-accent hover:bg-accent/10 transition-colors"
        >
          Play as guest <span className="font-mono font-medium text-[12px] text-[#EDEAE3]/40">no account</span>
        </button>
      </div>
    </div>
  );
}
