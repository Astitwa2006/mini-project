import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../ui/Avatar';

export default function PlayerList({ players, hostId }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <AnimatePresence>
        {players.map((player) => {
          const isHost = player.id === hostId;
          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, filter: 'blur(10px)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="glass rounded-2xl p-4 flex flex-col items-center text-center gap-3 relative"
            >
              {isHost && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg">
                  Host
                </div>
              )}
              
              <Avatar
                url={player.avatarUrl}
                username={player.username}
                size="lg"
                className={isHost ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-transparent' : ''}
              />
              
              <div>
                <p className="font-bold text-white text-sm truncate w-24">
                  {player.username}
                </p>
                <p className="text-xs text-slate-400 mt-1">Ready to play</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
