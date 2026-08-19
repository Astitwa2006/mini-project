export default function Badge({ children, color = '#7c3aed', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}
      style={{
        backgroundColor: `${color}22`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {children}
    </span>
  );
}
