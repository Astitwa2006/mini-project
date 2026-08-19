import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40',
  secondary: 'glass text-slate-200 hover:border-violet-500/50',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
  ghost: 'hover:bg-white/5 text-slate-300',
};

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg font-semibold',
};

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false, className = '', ...props
}) {
  return (
    <motion.button
      whileHover={disabled || loading ? {} : { scale: 1.03 }}
      whileTap={disabled || loading ? {}   : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 rounded-xl font-medium
        transition-colors duration-150 cursor-pointer select-none
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      )}
      {children}
    </motion.button>
  );
}
