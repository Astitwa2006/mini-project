import { motion, AnimatePresence } from 'framer-motion';
import { formatScore, ordinal } from '../../utils/helpers.js';

export default function LiveLeaderboard({ leaderboard = [], myId }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Leaderboard</h3>
      <AnimatePresence>
        {leaderboard.slice(0, 8).map((player, index) => {
          const isMe = player.id === myId;
          const medals = ['🥇', '🥈', '🥉'];

          return (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1,  x: 0  }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-xl transition-all
                ${isMe ? 'glass border border-violet-500/40 glow-primary' : 'bg-white/3'}
              `}
            >
              {/* Rank */}
              <span className="w-6 text-center text-sm font-bold">
                {index < 3 ? medals[index] : <span className="text-slate-500">{index + 1}</span>}
              </span>

              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs font-bold overflow-hidden">
                {player.avatarUrl
                  ? <img src={player.avatarUrl} alt={player.username} className="w-full h-full object-cover" />
                  : player.username?.charAt(0).toUpperCase()}
              </div>

              {/* Name */}
              <span className={`flex-1 text-sm font-medium truncate ${isMe ? 'text-violet-300' : 'text-slate-300'}`}>
                {player.username} {isMe && '(you)'}
              </span>

              {/* Score */}
              <motion.span
                key={player.score}
                initial={{ scale: 1.4, color: '#a78bfa' }}
                animate={{ scale: 1,   color: '#f1f5f9' }}
                className="text-sm font-bold tabular-nums"
              >
                {formatScore(player.score)}
              </motion.span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
