import { motion } from 'framer-motion';

export default function Loader({ fullScreen = false, size = 'md' }) {
  const sizes = { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-16 h-16' };

  const spinner = (
    <div className="flex flex-col items-center gap-4">
      <motion.div
        className={`${sizes[size]} rounded-full border-4 border-violet-900 border-t-violet-400`}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
      />
      {fullScreen && (
        <p className="text-slate-400 text-sm font-medium">Loading...</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[var(--color-bg)] flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
