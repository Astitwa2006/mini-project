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
    <div className="space-y-2">
      <p className="text-slate-400 text-sm">
        Pick up to <span className="text-violet-400 font-semibold">{max}</span> topics
        &nbsp;({selected.length}/{max} selected)
      </p>
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
                  ? 'text-white border-transparent'
                  : 'text-slate-400 border-white/10 hover:border-white/30 disabled:opacity-30 disabled:cursor-not-allowed'}
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
