import { useState } from "react";
import { createPortal } from "react-dom";
import { CalendarClock, X, Send, Check } from "lucide-react";
import Button from "../ui/Button";

const DESTINATARIOS = [
  { id: "representante", label: "Representante" },
  { id: "admin", label: "Administrador" },
  { id: "especialista", label: "Especialista" },
];

const DIAS = Array.from({ length: 28 }, (_, i) => i + 1);

export default function MonthlyReportScheduler({ showModal, setShowModal }) {
  const [config, setConfig] = useState({
    activo: false,
    diaEnvio: 1,
    destinatarios: ["representante"],
    formato: "PDF",
  });
  const [saving, setSaving] = useState(false);

  if (!showModal) return null;

  const toggleDestinatario = (id) => {
    setConfig((prev) => ({
      ...prev,
      destinatarios: prev.destinatarios.includes(id)
        ? prev.destinatarios.filter((d) => d !== id)
        : [...prev.destinatarios, id],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setShowModal(false);
  };

  const destLabels = config.destinatarios
    .map((id) => DESTINATARIOS.find((d) => d.id === id)?.label)
    .filter(Boolean);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700/80 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 bg-blue-600 text-white shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <CalendarClock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Reporte Mensual Automático</h3>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Activar envío automático
            </label>
            <button
              type="button"
              onClick={() => setConfig((p) => ({ ...p, activo: !p.activo }))}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                config.activo ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  config.activo ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Día de envío
            </label>
            <select
              value={config.diaEnvio}
              onChange={(e) =>
                setConfig((p) => ({ ...p, diaEnvio: parseInt(e.target.value) }))
              }
              className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 cursor-pointer text-slate-800 dark:text-slate-200"
            >
              {DIAS.map((d) => (
                <option key={d} value={d}>
                  Día {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Destinatarios
            </label>
            <div className="space-y-2">
              {DESTINATARIOS.map((dest) => (
                <label
                  key={dest.id}
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center border-2 transition-all ${
                      config.destinatarios.includes(dest.id)
                        ? "bg-blue-600 border-blue-600"
                        : "border-slate-300 dark:border-slate-600"
                    }`}
                  >
                    {config.destinatarios.includes(dest.id) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </span>
                  <input
                    type="checkbox"
                    checked={config.destinatarios.includes(dest.id)}
                    onChange={() => toggleDestinatario(dest.id)}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {dest.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Formato
            </label>
            <div className="flex gap-3">
              {["PDF", "Excel"].map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setConfig((p) => ({ ...p, formato: fmt }))}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                    config.formato === fmt
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-blue-300"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Se enviará el día{" "}
              <strong className="text-slate-900 dark:text-white">
                {config.diaEnvio}
              </strong>{" "}
              de cada mes a{" "}
              {destLabels.length > 0 ? (
                <strong className="text-slate-900 dark:text-white">
                  {destLabels.join(", ")}
                </strong>
              ) : (
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  ningún destinatario
                </span>
              )}{" "}
              en formato{" "}
              <strong className="text-slate-900 dark:text-white">
                {config.formato}
              </strong>
              .
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700/50 flex justify-end gap-3 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="w-4 h-4" />}
            onClick={handleSave}
            loading={saving}
          >
            Guardar Configuración
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
