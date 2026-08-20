import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AnswerMulti({ options = [], onSelect, selectedOptions, correctAnswer, revealed, disabled }) {
  const [selected, setSelected] = useState([]);
  
  useEffect(() => {
    if (selectedOptions) setSelected(selectedOptions);
  }, [selectedOptions]);

  const toggleOpt = (letter) => {
    if (disabled) return;
    setSelected(prev => prev.includes(letter) ? prev.filter(x => x !== letter) : [...prev, letter]);
  };
  
  return (
    <div className="flex flex-col gap-2 mt-0.5">
      {options.map((opt, i) => {
        const letter = opt.charAt(0);
        const text = opt.slice(3);
        const isSelected = selected.includes(letter);
        const isCorrect = revealed && correctAnswer?.includes(letter);
        const isWrong = revealed && isSelected && !isCorrect;
        
        let containerClass = "flex items-center gap-3 border rounded-[14px] px-4 py-3.5 transition-all cursor-pointer ";
        if (isCorrect) containerClass += "border-accent bg-accent/10 text-white";
        else if (isWrong) containerClass += "border-danger/40 bg-danger/10 text-[#EDEAE3]/70";
        else if (isSelected) containerClass += "border-accent bg-accent/10 text-white";
        else containerClass += "border-white/12 bg-white/5 text-[#EDEAE3]";
        
        return (
          <motion.button
            key={letter}
            onClick={() => toggleOpt(letter)}
            disabled={disabled}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={containerClass + " text-left"}
          >
            <div className={`w-5 h-5 rounded flex items-center justify-center border-2 ${isSelected || isCorrect ? 'border-accent bg-accent text-[#0B0D10]' : 'border-white/30'}`}>
              {(isSelected || isCorrect) && '✓'}
            </div>
            <span className="font-medium flex-1">{text}</span>
          </motion.button>
        );
      })}
      {!disabled && (
        <button onClick={() => onSelect(selected)} disabled={selected.length === 0} className="h-[52px] rounded-xl bg-accent text-[#0B0D10] font-bold mt-2 disabled:opacity-50">
          Submit ({selected.length})
        </button>
      )}
    </div>
  );
}
