import { motion, AnimatePresence } from 'framer-motion';

const LETTER_COLORS = {
  A: '#6366f1', // violet
  B: '#06b6d4', // cyan
  C: '#f59e0b', // amber
  D: '#10b981', // emerald
};

export default function AnswerOptions({
  options = [], onSelect, selectedOption, correctAnswer, revealed, disabled,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {options.map((opt, i) => {
        const letter = opt.charAt(0); // "A", "B", "C", "D"
        const text   = opt.slice(3);  // strip "A. "
        const color  = LETTER_COLORS[letter];

        const isSelected = selectedOption === letter;
        const isCorrect  = revealed && letter === correctAnswer;
        const isWrong    = revealed && isSelected && letter !== correctAnswer;

        return (
          <motion.button
            key={letter}
            onClick={() => !disabled && onSelect(letter)}
            disabled={disabled}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1,  x: 0   }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 300, damping: 25 }}
            whileHover={!disabled ? { scale: 1.02, x: 4 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={`
              relative flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-200
              border cursor-pointer group
              ${isCorrect ? 'border-emerald-400 bg-emerald-900/30 glow-success' : ''}
              ${isWrong   ? 'border-red-400 bg-red-900/30 glow-danger' : ''}
              ${isSelected && !revealed ? 'border-violet-400 bg-violet-900/30 glow-primary' : ''}
              ${!isSelected && !isCorrect && !isWrong ? 'border-white/10 glass hover:border-white/25' : ''}
              ${disabled && !isCorrect && !isWrong ? 'opacity-50' : ''}
            `}
          >
            {/* Letter badge */}
            <span
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {letter}
            </span>

            <span className="text-sm font-medium text-slate-200 leading-snug">{text}</span>

            {/* Reveal icon */}
            <AnimatePresence>
              {isCorrect && (
                <motion.span
                  className="ml-auto text-emerald-400 text-lg"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                >✓</motion.span>
              )}
              {isWrong && (
                <motion.span
                  className="ml-auto text-red-400 text-lg"
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}
                >✗</motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}
