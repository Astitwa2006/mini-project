import { motion } from 'framer-motion';

export default function Card({ children, className = '', interactive = false, ...props }) {
  return (
    <motion.div
      className={`glass rounded-2xl p-6 ${className}`}
      whileHover={interactive ? { y: -4, borderColor: 'rgba(124, 58, 237, 0.4)' } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
