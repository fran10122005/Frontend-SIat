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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full ${maxWidth} overflow-hidden border border-slate-200 dark:border-slate-700/80 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 bg-blue-600 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {Icon && (
                <div className="p-2 bg-white/20 rounded-xl">
                  <Icon className="w-5 h-5" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-bold">{title}</h3>
                {subtitle && (
                  <p className="text-blue-100 text-sm mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto min-h-0">{children}</div>
      </div>
    </div>
  );
}
