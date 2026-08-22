import { AlertTriangle, CheckCircle, X } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  type = "danger",
  confirmLabel,
  cancelLabel = "Cancelar",
}) {
  if (!isOpen) return null;

  const isDanger = type === "danger";
  const btnLabel = confirmLabel || (isDanger ? "Confirmar" : "Activar");

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700/80 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${isDanger ? "bg-rose-100 dark:bg-rose-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"}`}
            >
              {isDanger ? (
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              ) : (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p
          className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: message }}
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-sm ${
              isDanger
                ? "bg-red-600 hover:bg-red-700 shadow-red-600/25"
                : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/25"
            }`}
          >
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
