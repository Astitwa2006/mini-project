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
            <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button className="flex-1 h-[50px] rounded-xl border border-white/15 flex items-center justify-center gap-2 font-medium text-sm text-[#EDEAE3]/85 hover:bg-white/5 transition-colors">
            <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24">
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
            </svg>
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
