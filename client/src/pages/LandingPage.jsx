import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';

const FEATURES = [
  { icon: '🤖', title: 'AI-Generated Questions', desc: 'Live tech news converted into quiz questions by Gemini 2.0 Flash' },
  { icon: '⚡', title: 'Real-Time Multiplayer', desc: 'Compete with friends simultaneously via WebSockets' },
  { icon: '🏷️', title: 'Pick Your Topics', desc: 'AI/ML, Cybersecurity, Cloud, Web Dev, and more' },
  { icon: '🔗', title: 'Share Instantly', desc: 'Invite players via link or 6-char room code' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen animated-bg flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <span className="text-xl font-black font-display gradient-text">QuizRush ⚡</span>
        <Button
          onClick={() => navigate(user ? '/lobby' : '/login')}
          size="sm"
        >
          {user ? 'Go to Lobby' : 'Get Started'}
        </Button>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="space-y-6 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-semibold text-violet-300 border border-violet-500/30">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Powered by Gemini 2.0 Flash + Live RSS
          </div>

          <h1 className="text-5xl md:text-7xl font-black font-display leading-none">
            <span className="gradient-text">Real-Time</span>
            <br />Tech Trivia Wars
          </h1>

          <p className="text-xl text-slate-400 max-w-xl mx-auto leading-relaxed">
            Compete with friends on fresh tech questions generated from today&rsquo;s news.
            No stale databases — just live knowledge battles.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Button size="lg" onClick={() => navigate(user ? '/lobby' : '/login')}>
              🚀 Start Playing
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate('/login')}>
              Learn More
            </Button>
          </div>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-20 max-w-5xl w-full px-4"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="glass rounded-2xl p-5 text-left hover:border-violet-500/30 transition-colors"
              whileHover={{ y: -4 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-white mb-1 font-display">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-snug">{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}
