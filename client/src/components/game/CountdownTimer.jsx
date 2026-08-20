import { motion, AnimatePresence } from 'framer-motion';
import { useTimer } from '../../hooks/useTimer.js';

export default function CountdownTimer({ timeLimitMs, running, onExpire }) {
  const { remainingMs, progress } = useTimer(timeLimitMs, running, onExpire);

  const isUrgent = progress < 0.3;
  // Use CSS variable hex values directly for SVG stroke:
  const color    = isUrgent ? '#FF7A66' : '#C8FF4D';
  const radius   = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center w-[74px] h-[74px]">
      {/* SVG ring */}
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
        {/* Track */}
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="12" />
        {/* Progress */}
        <motion.circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transition={{ duration: 0.1 }}
        />
      </svg>
      
      {/* Center Background to hide SVG center if needed (though stroke is on the edge) */}
      <div className="absolute inset-0 m-auto w-[60px] h-[60px] rounded-full bg-[#0B0D10]" />

      {/* Time text */}
      <AnimatePresence mode="wait">
        <motion.span
          key={Math.ceil(remainingMs / 1000)}
          initial={{ scale: 1.3, opacity: 0 }}
          animate={{ scale: 1,   opacity: 1 }}
          exit={{    scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="text-[26px] font-bold font-mono z-10"
          style={{ color }}
        >
          {Math.ceil(remainingMs / 1000)}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
