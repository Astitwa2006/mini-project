import { motion } from 'framer-motion';
import Card from '../ui/Card';

export default function RoomCard({ title, description, icon, onClick, variant = 'primary' }) {
  const colors = {
    primary: 'text-violet-400 group-hover:text-violet-300 border-violet-500/30',
    secondary: 'text-emerald-400 group-hover:text-emerald-300 border-emerald-500/30',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left focus:outline-none group"
    >
      <Card className={`h-full flex flex-col justify-center border ${colors[variant]} transition-colors bg-white/5 hover:bg-white/10`}>
        <div className="flex items-center gap-4 mb-2">
          <div className="text-4xl">{icon}</div>
          <h3 className="text-2xl font-bold font-display text-white">{title}</h3>
        </div>
        <p className="text-slate-400 text-sm ml-14">{description}</p>
      </Card>
    </motion.button>
  );
}
