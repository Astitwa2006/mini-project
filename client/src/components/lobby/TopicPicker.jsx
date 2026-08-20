import { TOPICS } from '../../utils/constants.js';

export default function TopicPicker({ selected = [], onChange, max = 4 }) {
  function toggle(slug) {
    if (selected.includes(slug)) {
      onChange(selected.filter((s) => s !== slug));
    } else if (selected.length < max) {
      onChange([...selected, slug]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center text-sm">
        <span className="text-text-muted font-mono tracking-widest text-[10px] uppercase">Topics</span>
        <span className="font-medium text-text-muted text-xs">{selected.length}/{max} selected</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(TOPICS).map(([slug, { label, color }]) => {
          const active = selected.includes(slug);
          return (
            <button
              key={slug}
              onClick={() => toggle(slug)}
              disabled={!active && selected.length >= max}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150
                ${active
                  ? 'text-[#0B0D10] border-transparent'
                  : 'text-text-muted border-border hover:border-border-heavy disabled:opacity-30 disabled:cursor-not-allowed'}
              `}
              style={active ? { backgroundColor: color, boxShadow: `0 0 12px ${color}66` } : {}}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
