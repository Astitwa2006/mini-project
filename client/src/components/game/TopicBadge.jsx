import { TOPICS } from '../../utils/constants';

export default function TopicBadge({ topicSlug, className = '' }) {
  const meta = TOPICS[topicSlug];
  
  if (!meta) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${className}`}
      style={{
        backgroundColor: `${meta.color}15`,
        color: meta.color,
        border: `1px solid ${meta.color}30`
      }}
    >
      <span 
        className="w-1.5 h-1.5 rounded-full" 
        style={{ backgroundColor: meta.color }}
      />
      {meta.label}
    </div>
  );
}
