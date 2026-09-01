/**
 * Título principal de página unificado.
 * Tipografía exacta del header "Gestión de Pacientes":
 * text-lg md:text-xl · font-bold · tracking-tight · brand-700 / blue-400 (dark)
 * El icono hereda el color del texto (currentColor).
 */
export default function PageTitle({
  icon: Icon,
  children,
  className = "",
  title,
  ...props
}) {
  const safeTitle =
    typeof title === "string" || typeof title === "number"
      ? String(title)
      : undefined;
  return (
    <h1
      className={`text-lg md:text-xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center flex-wrap gap-2 transition-colors ${className}`}
      {...(safeTitle ? { title: safeTitle } : {})}
      {...props}
    >
      {Icon && (
        <Icon className="w-5 h-5 shrink-0 text-brand-700 dark:text-blue-400" />
      )}
      {children}
    </h1>
  );
}
