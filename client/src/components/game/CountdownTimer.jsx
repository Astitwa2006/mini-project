import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../../hooks/useTimer.js';

export default function CountdownTimer({ timeLimitMs, running, onExpire }) {
  const { remainingMs, progress } = useTimer(timeLimitMs, running, onExpire);

  const isUrgent = progress < 0.3;
  const color    = isUrgent ? '#ef4444' : progress < 0.6 ? '#f59e0b' : '#10b981';
  const radius   = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      {/* SVG ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Track */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        {/* Progress */}
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          transition={{ duration: 0.1 }}
        />
      </svg>

      {/* Time text */}
      <AnimatePresence mode="wait">
        <motion.span
          key={Math.ceil(remainingMs / 1000)}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          exit={{    scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="text-2xl font-black font-display z-10"
          style={{ color }}
        >
          {Math.ceil(remainingMs / 1000)}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
