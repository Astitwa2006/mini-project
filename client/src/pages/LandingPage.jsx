import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDark, setLight, setDark } = useTheme();

  return (
    <div className="min-h-screen bg-bg text-text font-sans flex flex-col">

      {/* ── Navbar ────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-5 md:px-12 py-4 md:py-5 border-b border-border w-full">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-[30px] h-[30px] rounded-[9px] bg-surface-inverted text-accent flex items-center justify-center font-bold text-base">
            Q
          </div>
          <span className="font-bold text-[17px] tracking-[-0.02em]">QuizRush</span>
        </div>

        {/* Right nav */}
        <div className="flex items-center gap-3 md:gap-7 font-medium text-sm text-text-muted">
          <span className="hidden lg:inline cursor-pointer hover:text-text transition-colors">How it works</span>
          <span className="hidden lg:inline cursor-pointer hover:text-text transition-colors">Today&apos;s feed</span>
          <span className="hidden lg:inline cursor-pointer hover:text-text transition-colors">Leaderboards</span>

          {/* Theme toggle */}
          <div className="flex items-center bg-black/[0.07] dark:bg-white/[0.07] rounded-full p-[3px] shrink-0">
            <span
              onClick={setLight}
              className={`px-[9px] md:px-[11px] py-[5px] rounded-full text-[11px] md:text-[12px] transition-all cursor-pointer ${!isDark ? 'bg-surface-base text-text font-semibold shadow-sm' : 'font-medium text-text-muted hover:text-text'}`}
            >
              Light
            </span>
            <span
              onClick={setDark}
              className={`px-[9px] md:px-[11px] py-[5px] rounded-full text-[11px] md:text-[12px] transition-all cursor-pointer ${isDark ? 'bg-surface-base text-text font-semibold shadow-sm' : 'font-medium text-text-muted hover:text-text'}`}
            >
              Dark
            </span>
          </div>

          <button
            onClick={() => navigate(user ? '/lobby' : '/login')}
            className="shrink-0 whitespace-nowrap px-[14px] md:px-[18px] py-[9px] md:py-[10px] rounded-[10px] bg-surface-inverted text-text-inverted font-semibold text-[13px] md:text-[14px] hover:opacity-90 transition-opacity"
          >
            {user ? 'Lobby' : 'Log in'}
          </button>
        </div>
      </nav>

      {/* ── Main Content ──────────────────────────────────────────── */}
      <main className="flex-1 px-5 sm:px-8 md:px-12 pt-[28px] md:pt-[34px] pb-20 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-10 lg:gap-14 items-start max-w-[1280px] mx-auto w-full">

        {/* Left Column */}
        <div className="flex flex-col gap-[22px] min-w-0">

          <span className="self-start flex items-center gap-2 font-mono font-medium text-[11px] tracking-[0.12em] text-text-muted border border-border-heavy rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span>
            FEED SYNCED 11 MIN AGO
          </span>

          <h1 className="m-0 font-bold text-[34px] sm:text-[44px] lg:text-[58px] leading-[1.08] tracking-[-0.02em] lg:tracking-[-0.04em] text-balance">
            The tech news,<br />played as a<br />
            {/* text-[#14161A] is always dark — readable on lime accent in both modes */}
            <span className="bg-accent text-[#14161A] px-2 rounded-[6px]">quiz</span>
          </h1>

          <p className="m-0 font-normal text-[15px] sm:text-[18px] leading-[1.55] text-text-muted max-w-[440px] text-balance">
            Every question is written from an article published today, in whichever format fits it — pick one, rank four, or type the answer. Ten seconds. Up to eight players.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-[6px]">
            <button
              onClick={() => navigate(user ? '/lobby' : '/login')}
              className="w-full sm:w-auto px-[26px] py-[15px] rounded-[12px] bg-surface-inverted text-text-inverted font-semibold text-[16px] hover:opacity-90 transition-opacity"
            >
              Start a room
            </button>
            <button
              onClick={() => navigate('/join')}
              className="w-full sm:w-auto px-[26px] py-[15px] rounded-[12px] border-[1.5px] border-border-heavy font-semibold text-[16px] hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Join with a code
            </button>
          </div>

          <div className="flex gap-5 sm:gap-[34px] mt-3 border-t border-border pt-[14px]">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[22px] sm:text-[26px]">1,204</span>
              <span className="font-mono font-medium text-[10px] sm:text-[11px] text-text-muted tracking-[0.08em] uppercase whitespace-nowrap">Questions Today</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[22px] sm:text-[26px]">38</span>
              <span className="font-mono font-medium text-[10px] sm:text-[11px] text-text-muted tracking-[0.08em] uppercase whitespace-nowrap">Live Rooms</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[22px] sm:text-[26px]">5</span>
              <span className="font-mono font-medium text-[10px] sm:text-[11px] text-text-muted tracking-[0.08em] uppercase whitespace-nowrap">Answer Formats</span>
            </div>
          </div>
        </div>

        {/* Right Column (Demo UI) */}
        <div className="flex flex-col gap-[14px] min-w-0">

          {/* Demo card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-surface-base border border-border rounded-[18px] p-[22px] shadow-[0_12px_30px_rgba(20,22,26,0.07)] dark:shadow-none flex flex-col gap-[14px]"
          >
            <div className="flex items-center justify-between gap-3">
              {/* Badge: always dark text on lime — never inherit theme color */}
              <span className="font-mono font-semibold text-[10px] tracking-[0.14em] text-[#14161A] bg-accent px-2 py-1 rounded-[5px]">
                RANK THESE
              </span>
              <div className="flex-1 h-[5px] rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div className="w-[72%] h-full bg-surface-inverted rounded-full"></div>
              </div>
              <span className="font-mono font-bold text-sm">7</span>
            </div>
            
            <span className="font-semibold text-[17px] sm:text-[21px] leading-[1.25] text-balance">
              Order these funding rounds announced this week, largest first.
            </span>
            
            <div className="flex flex-col gap-[7px]">
              <div className="flex items-center gap-3 border border-border-heavy rounded-[11px] py-3 px-[14px] bg-surface-alt">
                <span className="font-mono font-bold text-xs text-text-muted">1</span>
                <span className="flex-1 font-medium text-sm">Vector database co.</span>
                <span className="tracking-[2px] text-text-muted">⠿</span>
              </div>
              {/* Selected / active row */}
              <div className="flex items-center gap-3 border border-surface-inverted rounded-[11px] py-3 px-[14px] bg-surface-base shadow-[0_4px_12px_rgba(20,22,26,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.35)] -my-1 relative z-10 scale-[1.02]">
                <span className="font-mono font-bold text-xs text-surface-inverted">2</span>
                <span className="flex-1 font-semibold text-sm">Robotics startup</span>
                <span className="tracking-[2px] text-surface-inverted">⠿</span>
              </div>
              <div className="flex items-center gap-3 border border-border-heavy rounded-[11px] py-3 px-[14px] bg-surface-alt">
                <span className="font-mono font-bold text-xs text-text-muted">3</span>
                <span className="flex-1 font-medium text-sm">Chip design tool</span>
                <span className="tracking-[2px] text-text-muted">⠿</span>
              </div>
            </div>
          </motion.div>

          {/* Stat tiles */}
          <div className="flex gap-[10px]">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex-1 bg-surface-inverted text-text-inverted rounded-[14px] p-4 flex flex-col gap-[3px]"
            >
              <span className="font-mono font-medium text-[10px] tracking-[0.12em] opacity-60">SPEED BONUS</span>
              <span className="font-bold text-[20px]">+120</span>
            </motion.div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex-1 bg-surface-base border border-border rounded-[14px] p-4 flex flex-col gap-[3px]"
            >
              <span className="font-mono font-medium text-[10px] tracking-[0.12em] text-text-muted">STREAK</span>
              <span className="font-bold text-[20px]">×3</span>
            </motion.div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 bg-danger text-[#14161A] rounded-[14px] p-4 flex flex-col gap-[3px]"
            >
              <span className="font-mono font-medium text-[10px] tracking-[0.12em] opacity-65">WAGER</span>
              <span className="font-bold text-[20px]">2×</span>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
