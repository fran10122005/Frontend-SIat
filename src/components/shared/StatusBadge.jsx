export default function StatusBadge({ active, activeLabel = 'Activo', inactiveLabel = 'Inactivo', className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
        active
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
      } ${className}`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}
