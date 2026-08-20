import { useState } from 'react';
import { motion } from 'framer-motion';

export default function AnswerTypeIn({ onSelect, selectedOption, correctAnswer, revealed, disabled }) {
  const [val, setVal] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!disabled && val.trim()) onSelect(val.trim());
  };
  
  const isCorrect = revealed && selectedOption?.toLowerCase() === correctAnswer?.toLowerCase();
  
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <input 
          type="text"
          value={selectedOption !== undefined ? selectedOption : val}
          onChange={(e) => setVal(e.target.value)}
          disabled={disabled}
          placeholder="Type your answer..."
          className={`w-full h-[64px] rounded-2xl bg-white/5 border-2 px-6 font-semibold text-lg transition-all focus:outline-none ${revealed ? (isCorrect ? 'border-accent text-accent' : 'border-danger text-danger') : (selectedOption ? 'border-accent text-accent' : 'border-white/15 focus:border-white/30 text-[#EDEAE3]')}`}
        />
        {revealed && (
          <div className="mt-2 text-sm text-[#EDEAE3]/60">
            Correct answer: <span className="text-accent font-bold">{correctAnswer}</span>
          </div>
        )}
      </motion.div>
      {!disabled && (
        <button type="submit" disabled={!val.trim()} className="h-[52px] rounded-xl bg-accent text-[#0B0D10] font-bold mt-2 disabled:opacity-50">
          Submit
        </button>
      )}
    </form>
  );
}
