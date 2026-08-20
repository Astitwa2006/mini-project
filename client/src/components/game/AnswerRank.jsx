import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AnswerRank({ options = [], onSelect, selectedOrder, correctAnswer, revealed, disabled }) {
  const [items, setItems] = useState([]);
  
  useEffect(() => {
    if (selectedOrder) setItems(selectedOrder);
    else if (options.length > 0 && items.length === 0) setItems([...options]);
  }, [options, selectedOrder]);

  const moveItem = (index, dir) => {
    if (disabled) return;
    const newItems = [...items];
    const target = index + dir;
    if (target < 0 || target >= newItems.length) return;
    [newItems[index], newItems[target]] = [newItems[target], newItems[index]];
    setItems(newItems);
  };
  
  const displayItems = revealed && correctAnswer ? correctAnswer : items;
  
  return (
    <div className="flex flex-col gap-2 mt-0.5">
      {displayItems.map((text, i) => {
        let bgClass = "bg-white/5 border-white/12";
        if (revealed) {
          bgClass = selectedOrder?.[i] === text ? "bg-accent/20 border-accent" : "bg-danger/20 border-danger/40";
        }
        
        return (
          <div key={text} className={`flex items-center gap-3 border rounded-[14px] px-3 py-2 transition-all ${bgClass}`}>
            <span className="font-mono font-bold text-white/40 w-6 text-center">{i + 1}</span>
            <span className="font-medium flex-1 text-[#EDEAE3] text-sm">{text}</span>
            {!revealed && !disabled && (
              <div className="flex flex-col">
                <button onClick={() => moveItem(i, -1)} className="px-2 py-1 text-white/50 hover:text-white disabled:opacity-20" disabled={i === 0}>▲</button>
                <button onClick={() => moveItem(i, 1)} className="px-2 py-1 text-white/50 hover:text-white disabled:opacity-20" disabled={i === items.length - 1}>▼</button>
              </div>
            )}
          </div>
        );
      })}
      {!disabled && (
        <button onClick={() => onSelect(items)} className="h-[52px] rounded-xl bg-accent text-[#0B0D10] font-bold mt-2">
          Submit Order
        </button>
      )}
    </div>
  );
}
