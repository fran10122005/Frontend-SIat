import { Plus } from "lucide-react";

export default function Fab({
  icon: Icon = Plus,
  label = "Agregar",
  onClick,
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-40 w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 active:scale-95 text-white shadow-lg shadow-brand-600/30 flex items-center justify-center transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 dark:focus:ring-offset-slate-900 md:hidden ${className}`}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}
