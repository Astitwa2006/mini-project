import { motion } from 'framer-motion';

export default function AnswerSwipe({ onSelect, selectedOption, correctAnswer, revealed, disabled }) {
  // Swipe is basically True/False
  const options = ['True', 'False'];
  
  return (
    <div className="flex gap-4 mt-2">
      {options.map((opt) => {
        const isSelected = selectedOption === opt;
        const isCorrect  = revealed && opt === correctAnswer;
        const isWrong    = revealed && isSelected && opt !== correctAnswer;
        
        let containerClass = "flex-1 h-[140px] rounded-[18px] border-2 flex flex-col items-center justify-center gap-2 transition-all ";
        if (isCorrect) {
          containerClass += "border-accent bg-accent/10 text-accent";
        } else if (isWrong) {
          containerClass += "border-danger bg-danger/10 text-danger opacity-80";
        } else if (isSelected) {
          containerClass += "border-accent bg-accent/10 text-accent";
        } else {
          containerClass += "border-border-heavy bg-surface-alt text-text hover:bg-surface-base";
          if (disabled && !revealed) containerClass += " opacity-50";
        }

        return (
          <motion.button
            key={opt}
            onClick={() => !disabled && onSelect(opt)}
            disabled={disabled}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={!disabled ? { scale: 0.95 } : {}}
            className={containerClass}
          >
            <span className="text-3xl">{opt === 'True' ? '👍' : '👎'}</span>
            <span className="font-bold text-xl">{opt}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
