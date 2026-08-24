export default function SectionTitle({ children, className = "" }) {
  return (
    <p
      className={`text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 ${className}`}
    >
      {children}
    </p>
  );
}
