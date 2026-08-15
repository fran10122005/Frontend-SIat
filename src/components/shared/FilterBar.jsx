import { useState, Children } from "react";
import { Search, SlidersHorizontal, ChevronDown, X } from "lucide-react";

export default function FilterBar({
  dataTour,
  searchValue,
  onSearch,
  searchPlaceholder = "Buscar...",
  searchDataTour,
  clearDataTour,
  activeCount = 0,
  onClearAll,
  chips = [],
  children,
  className = "",
  embedded = false,
}) {
  const [open, setOpen] = useState(false);
  const hasActive = activeCount > 0;
  const hasAdvanced = Children.count(children) > 0;

  return (
    <div
      data-tour={dataTour}
      className={
        embedded
          ? `flex flex-col flex-wrap gap-3 ${className}`
          : `bg-white dark:bg-[#1E293B] p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 ${className}`
      }
    >
      <div className="flex flex-row flex-wrap items-center gap-3">
        {searchValue !== undefined && (
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              data-tour={searchDataTour}
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full pl-4 pr-9 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            />
          </div>
        )}

        {hasAdvanced && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            Filtros
            {hasActive && (
              <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white bg-blue-500">
                {activeCount}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>
        )}

        {hasActive && (
          <button
            type="button"
            data-tour={clearDataTour}
            onClick={onClearAll}
            className="flex items-center gap-1 px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
          >
            <X className="w-3.5 h-3.5" /> Limpiar todo
          </button>
        )}
      </div>

      {open && (
        <div className="flex flex-row flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 animate-in slide-in-from-top-1 duration-150">
          {children}
        </div>
      )}

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.onRemove}
                className="p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                aria-label={`Quitar filtro ${chip.label}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
