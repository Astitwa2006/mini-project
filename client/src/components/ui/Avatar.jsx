export default function Avatar({ url, username, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  };

  const bgColors = [
    'bg-violet-600', 'bg-emerald-600', 'bg-blue-600', 'bg-amber-600', 'bg-red-600', 'bg-cyan-600'
  ];
  
  // Pick a consistent color based on username length or char code
  const colorIndex = username ? username.charCodeAt(0) % bgColors.length : 0;
  const bgColor = bgColors[colorIndex];

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 border-2 border-white/10 ${sizes[size]} ${!url ? bgColor : 'bg-surface-2'} ${className}`}
    >
      {url ? (
        <img src={url} alt={username} className="w-full h-full object-cover" />
      ) : (
        <span className="font-bold text-white font-display select-none">
          {getInitials(username)}
        </span>
      )}
    </div>
  );
}
