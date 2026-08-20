import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { motion } from 'framer-motion';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-bg text-text font-sans flex flex-col">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-12 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[9px] bg-surface-inverted text-accent flex items-center justify-center font-bold text-base">
            Q
          </div>
          <span className="font-bold text-[17px] tracking-tight">QuizRush</span>
        </div>
        <div className="flex items-center gap-7 font-medium text-sm text-text-muted">
          <span className="cursor-pointer hover:text-text">How it works</span>
          <span className="cursor-pointer hover:text-text">Today's feed</span>
          <span className="cursor-pointer hover:text-text">Leaderboards</span>
          <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-full p-1 cursor-pointer">
            <span className="px-3 py-1.5 rounded-full bg-surface-base text-text font-semibold text-xs shadow-sm">Light</span>
            <span className="px-3 py-1.5 font-medium text-xs">Dark</span>
          </div>
          <button 
            onClick={() => navigate(user ? '/lobby' : '/login')}
            className="px-4 py-2.5 rounded-xl bg-surface-inverted text-text-inverted font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            {user ? 'Lobby' : 'Log in'}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-12 pt-12 pb-20 grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 items-start max-w-7xl mx-auto w-full">
        
        {/* Left Column */}
        <div className="flex flex-col gap-6">
          <span className="self-start flex items-center gap-2 font-mono font-medium text-[11px] tracking-[0.12em] text-text-muted border border-border-heavy rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-danger animate-pulse"></span>
            FEED SYNCED 11 MIN AGO
          </span>
          
          <h1 className="m-0 font-bold text-5xl md:text-[58px] leading-[1.02] tracking-[-0.04em] text-balance">
            The tech news,<br />played as a<br />
            <span className="bg-accent text-surface-inverted px-2 rounded-md inline-block mt-1">quiz</span>
          </h1>
          
          <p className="m-0 font-normal text-lg leading-[1.55] text-text-muted max-w-[440px] text-balance">
            Every question is written from an article published today, in whichever format fits it — pick one, rank four, or type the answer. Ten seconds. Up to eight players.
          </p>
          
          <div className="flex gap-3 mt-2">
            <button 
              onClick={() => navigate(user ? '/lobby' : '/login')}
              className="px-6 py-4 rounded-xl bg-surface-inverted text-text-inverted font-semibold text-base hover:opacity-90 transition-opacity"
            >
              Start a room
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-4 rounded-xl border-2 border-border-heavy font-semibold text-base hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Join with a code
            </button>
          </div>
          
          <div className="flex gap-8 mt-3 border-t border-border pt-4">
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[26px]">1,204</span>
              <span className="font-mono font-medium text-[11px] text-text-muted tracking-[0.08em] uppercase">Questions Today</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[26px]">38</span>
              <span className="font-mono font-medium text-[11px] text-text-muted tracking-[0.08em] uppercase">Live Rooms</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-[26px]">5</span>
              <span className="font-mono font-medium text-[11px] text-text-muted tracking-[0.08em] uppercase">Answer Formats</span>
            </div>
          </div>
        </div>

        {/* Right Column (Demo UI) */}
        <div className="flex flex-col gap-3.5 mt-8 lg:mt-0">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-surface-base border border-border rounded-[18px] p-6 shadow-[0_12px_30px_rgba(20,22,26,0.07)] dark:shadow-none flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono font-semibold text-[10px] tracking-[0.14em] text-surface-inverted bg-accent px-2 py-1 rounded-[5px]">
                RANK THESE
              </span>
              <div className="flex-1 h-[5px] rounded-full bg-black/10 dark:bg-white/10 mx-3.5 overflow-hidden">
                <div className="w-[72%] h-full bg-surface-inverted rounded-full"></div>
              </div>
              <span className="font-mono font-bold text-sm">7</span>
            </div>
            
            <span className="font-semibold text-[21px] leading-[1.25] text-balance">
              Order these funding rounds announced this week, largest first.
            </span>
            
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center gap-3 border border-border-heavy rounded-[11px] p-3 bg-surface-alt">
                <span className="font-mono font-bold text-xs text-text-muted">1</span>
                <span className="flex-1 font-medium text-sm">Vector database co.</span>
                <span className="tracking-[2px] text-text-muted">⠿</span>
              </div>
              <div className="flex items-center gap-3 border border-surface-inverted rounded-[11px] p-3 bg-surface-base shadow-[0_4px_12px_rgba(20,22,26,0.1)] dark:shadow-none -my-1 relative z-10 scale-[1.02]">
                <span className="font-mono font-bold text-xs text-surface-inverted">2</span>
                <span className="flex-1 font-medium text-sm font-bold">Robotics startup</span>
                <span className="tracking-[2px] text-surface-inverted">⠿</span>
              </div>
              <div className="flex items-center gap-3 border border-border-heavy rounded-[11px] p-3 bg-surface-alt">
                <span className="font-mono font-bold text-xs text-text-muted">3</span>
                <span className="flex-1 font-medium text-sm">Chip design tool</span>
                <span className="tracking-[2px] text-text-muted">⠿</span>
              </div>
            </div>
          </motion.div>

          <div className="flex gap-2.5">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="flex-1 bg-surface-inverted text-text-inverted rounded-[14px] p-4 flex flex-col gap-1"
            >
              <span className="font-mono font-medium text-[10px] tracking-[0.12em] opacity-60">SPEED BONUS</span>
              <span className="font-bold text-[20px]">+120</span>
            </motion.div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="flex-1 bg-surface-base border border-border rounded-[14px] p-4 flex flex-col gap-1"
            >
              <span className="font-mono font-medium text-[10px] tracking-[0.12em] text-text-muted">STREAK</span>
              <span className="font-bold text-[20px]">×3</span>
            </motion.div>
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 bg-danger text-[#14161A] rounded-[14px] p-4 flex flex-col gap-1"
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
