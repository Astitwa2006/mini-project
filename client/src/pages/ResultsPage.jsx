import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Button from '../components/ui/Button.jsx';
import FinalResults from '../components/scoreboard/FinalResults.jsx';
import { formatScore, ordinal } from '../utils/helpers.js';

export default function ResultsPage() {
  const { leaderboard, reset } = useGame();
  const { user } = useAuth();
  const navigate = useNavigate();

  const myResult = leaderboard.find((p) => p.id === user?.id);

  function handlePlayAgain() {
    reset();
    navigate('/lobby');
  }

  return (
    <div className="min-h-screen animated-bg flex flex-col items-center justify-center p-4">
      <motion.div
        className="w-full max-w-xl space-y-8 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 180 }}
      >
        {/* Title */}
        <div className="space-y-2">
          <div className="text-6xl">🏆</div>
          <h1 className="text-4xl font-black font-display gradient-text">Game Over!</h1>
          {myResult && (
            <p className="text-slate-400 text-lg">
              You finished <span className="text-white font-bold">{ordinal(myResult.rank)}</span> with{' '}
              <span className="text-violet-400 font-bold">{formatScore(myResult.score)} pts</span>
            </p>
          )}
        </div>

        {/* Results */}
        <FinalResults players={leaderboard} />

        <div className="flex gap-3 justify-center">
          <Button onClick={handlePlayAgain} size="lg">🔄 Play Again</Button>
          <Button variant="secondary" size="lg" onClick={() => navigate('/')}>Home</Button>
        </div>
      </motion.div>
    </div>
  );
}
