import { motion } from 'framer-motion';
import Avatar from '../ui/Avatar';
import Card from '../ui/Card';
import { formatScore } from '../../utils/helpers';

export default function FinalResults({ players }) {
  // Sort by score
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const podium = sorted.slice(0, 3);
  const others = sorted.slice(3);

  // Reorder podium to [2nd, 1st, 3rd] for visual layout
  const visualPodium = [
    podium[1] || null, // 2nd
    podium[0] || null, // 1st
    podium[2] || null, // 3rd
  ];

  const heights = {
    1: 'h-48 md:h-56',
    0: 'h-64 md:h-72',
    2: 'h-40 md:h-48'
  };

  const colors = {
    1: 'from-slate-400/20 to-slate-400/5 border-slate-400/30 text-slate-300', // Silver
    0: 'from-amber-400/20 to-amber-400/5 border-amber-400/30 text-amber-300', // Gold
    2: 'from-amber-700/20 to-amber-700/5 border-amber-700/30 text-amber-600', // Bronze
  };

  const labels = { 1: '2nd', 0: '1st', 2: '3rd' };
  const delays = { 1: 0.6, 0: 0.9, 2: 0.3 };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12">
      {/* Podium */}
      <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-8 h-80">
        {visualPodium.map((p, i) => {
          if (!p) return <div key={i} className={`w-24 sm:w-32 ${heights[i]}`} />;
          
          return (
            <div key={p.id} className="flex flex-col items-center w-24 sm:w-32">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: delays[i] - 0.2 }}
                className="mb-4 text-center z-10"
              >
                <Avatar url={p.avatarUrl} username={p.username} size="lg" className="shadow-2xl shadow-black/50" />
                <div className="mt-2 font-bold text-white truncate w-full px-1">{p.username}</div>
                <div className={`font-bold ${colors[i].split(' ').pop()}`}>{formatScore(p.score)} pts</div>
              </motion.div>
              
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ delay: delays[i], type: 'spring', damping: 20, stiffness: 100 }}
                className={`w-full rounded-t-2xl border-t-4 border-l border-r bg-gradient-to-b ${heights[i]} ${colors[i]} relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity" />
                <div className="absolute top-4 w-full text-center font-black font-display text-4xl opacity-50">
                  {labels[i]}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Other Players */}
      {others.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="grid gap-3"
        >
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Other Players</h3>
          {others.map((p, i) => (
            <Card key={p.id} className="flex items-center justify-between p-4 bg-white/5 border-transparent">
              <div className="flex items-center gap-4">
                <span className="text-slate-500 font-bold font-display w-6 text-right">
                  {i + 4}
                </span>
                <Avatar url={p.avatarUrl} username={p.username} size="sm" />
                <span className="font-bold text-white">{p.username}</span>
              </div>
              <div className="font-semibold text-slate-300">
                {formatScore(p.score)} pts
              </div>
            </Card>
          ))}
        </motion.div>
      )}
    </div>
  );
}
