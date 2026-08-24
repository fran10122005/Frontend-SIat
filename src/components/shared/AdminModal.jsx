import { X } from "lucide-react";

export default function AdminModal({
  open,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  maxWidth = "max-w-3xl",
}) {
  if (!open) return null;

  const widthClass = maxWidth.replace(/^max-w-/, "sm:max-w-");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`bg-[#f8fafc] dark:bg-[#1a2332] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full ${widthClass} overflow-hidden border-t border-slate-200 dark:border-slate-700/80 sm:border animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 max-h-[94dvh] sm:max-h-[92vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative px-4 sm:px-6 py-4 sm:py-5 bg-blue-600 text-white shrink-0">
          <div className="sm:hidden absolute top-1.5 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-white/40" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div className="p-2 bg-white/20 rounded-xl shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-bold truncate">
                  {title}
                </h3>
                {subtitle && (
                  <p
                    title={subtitle}
                    className="text-blue-100 text-sm mt-0.5 line-clamp-1"
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="text-white/70 hover:text-white p-2.5 -m-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-4 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
