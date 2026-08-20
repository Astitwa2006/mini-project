import { motion } from 'framer-motion';

export default function AnswerOptions({
  options = [], onSelect, selectedOption, correctAnswer, revealed, disabled,
}) {
  return (
    <div className="flex flex-col gap-2.5 mt-0.5">
      {options.map((opt, i) => {
        const letter = opt.charAt(0); // "A", "B", "C", "D"
        const text   = opt.slice(3);  // strip "A. "

        const isSelected = selectedOption === letter;
        const isCorrect  = revealed && letter === correctAnswer;
        const isWrong    = revealed && isSelected && letter !== correctAnswer;

        let containerClass = "flex items-center gap-3.5 border rounded-[14px] px-4 py-4 transition-all duration-200 cursor-pointer ";
        let badgeClass = "w-[26px] h-[26px] rounded-lg flex items-center justify-center font-mono font-bold text-xs ";
        let textClass = "font-medium text-base font-sans ";
        let rightText = null;

        if (isCorrect) {
          // Reveal Correct (Mockup 1e)
          containerClass += "border-accent bg-accent/10 ";
          badgeClass += "bg-accent text-[#0B0D10]";
          textClass += "text-text font-semibold flex-1";
          rightText = <span className="font-mono font-medium text-[11px] text-accent ml-auto">✓</span>;
        } else if (isWrong) {
          // Reveal Incorrect (Mockup 1e)
          containerClass += "border-danger/40 bg-danger/10 opacity-85 ";
          badgeClass += "bg-danger text-[#0B0D10]";
          textClass += "text-text-muted flex-1";
          rightText = <span className="font-mono font-medium text-[11px] text-danger ml-auto">✗</span>;
        } else if (isSelected && !revealed) {
          // Locked in (Mockup 1d)
          containerClass += "border-2 border-accent bg-accent/10 px-[15px] py-[15px] "; // adjust for 2px border
          badgeClass += "bg-accent text-[#0B0D10]";
          textClass += "font-semibold flex-1";
          rightText = <span className="font-mono font-medium text-[10px] text-accent ml-auto">LOCKED</span>;
        } else {
          // Default state (Mockup 1d)
          containerClass += "border-border bg-surface-alt shadow-sm ";
          badgeClass += "bg-surface-inverted/10 dark:bg-white/10 text-text-muted";
          textClass += "flex-1 text-text";
          if (disabled && !revealed) {
            containerClass += "opacity-50 cursor-not-allowed ";
          } else {
            containerClass += "hover:bg-surface-base ";
          }
        }

        return (
          <motion.button
            key={letter}
            onClick={() => !disabled && onSelect(letter)}
            disabled={disabled}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1,  x: 0   }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            whileTap={!disabled ? { scale: 0.98 } : {}}
            className={containerClass + " text-left"}
          >
            <span className={badgeClass}>{letter}</span>
            <span className={textClass}>{text}</span>
            {rightText}
          </motion.button>
        );
      })}
    </div>
  );
}
