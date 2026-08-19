import { motion, AnimatePresence } from 'framer-motion';

export default function AnswerFeedback({ isCorrect, points, show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none flex flex-col items-center justify-center p-8 rounded-full aspect-square w-48 ${
            isCorrect 
              ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/50 shadow-[0_0_60px_rgba(16,185,129,0.4)] backdrop-blur-md'
              : 'bg-red-500/20 text-red-400 border-2 border-red-500/50 shadow-[0_0_60px_rgba(239,68,68,0.4)] backdrop-blur-md'
          }`}
        >
          <div className="text-5xl mb-2">{isCorrect ? '✨' : '💥'}</div>
          <div className="text-2xl font-black font-display uppercase tracking-widest">
            {isCorrect ? 'Correct' : 'Wrong'}
          </div>
          {isCorrect && points > 0 && (
            <div className="text-emerald-300 font-bold mt-1">
              +{points} pts
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
