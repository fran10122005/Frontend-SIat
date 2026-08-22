import { useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Clock, X, Save } from "lucide-react";
import Button from "../ui/Button";

const DEFAULT_RULES = {
  bpmHigh: 120,
  bpmLow: 60,
  movementThreshold: 80,
  noiseThreshold: 70,
  alertTypes: ["crisis", "indicacion", "sos"],
  quietHoursEnabled: false,
  quietStart: "22:00",
  quietEnd: "07:00",
};

export default function AlertRulesConfig({
  showModal,
  setShowModal,
  config,
  onSave,
}) {
  const [rules, setRules] = useState({ ...DEFAULT_RULES, ...config });

  const set = (key) => (e) => {
    const val =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setRules((prev) => ({ ...prev, [key]: val }));
  };

  const toggleAlertType = (type) => {
    setRules((prev) => ({
      ...prev,
      alertTypes: prev.alertTypes.includes(type)
        ? prev.alertTypes.filter((t) => t !== type)
        : [...prev.alertTypes, type],
    }));
  };

  const handleSave = () => {
    onSave?.(rules);
    setShowModal(false);
  };

  if (!showModal) return null;

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
                <Bell className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Reglas de Alertas</h3>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Umbrales biométricos
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  BPM máximo
                </label>
                <input
                  type="number"
                  value={rules.bpmHigh}
                  onChange={set("bpmHigh")}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  BPM mínimo
                </label>
                <input
                  type="number"
                  value={rules.bpmLow}
                  onChange={set("bpmLow")}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Movimiento (%)
                </label>
                <input
                  type="number"
                  value={rules.movementThreshold}
                  onChange={set("movementThreshold")}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">
                  Ruido (dB)
                </label>
                <input
                  type="number"
                  value={rules.noiseThreshold}
                  onChange={set("noiseThreshold")}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Tipos de alerta activos
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: "crisis", label: "Crisis IoT" },
                { id: "indicacion", label: "Indicaciones" },
                { id: "sos", label: "Emergencia SOS" },
                { id: "comportamiento", label: "Comportamiento" },
                { id: "sesion", label: "Sesiones" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleAlertType(t.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    rules.alertTypes.includes(t.id)
                      ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-700"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Horario silencioso
            </p>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={rules.quietHoursEnabled}
                onChange={set("quietHoursEnabled")}
                className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Activar horario silencioso
              </span>
            </label>
            {rules.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-3 pl-7">
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Desde
                  </label>
                  <input
                    type="time"
                    value={rules.quietStart}
                    onChange={set("quietStart")}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                    Hasta
                  </label>
                  <input
                    type="time"
                    value={rules.quietEnd}
                    onChange={set("quietEnd")}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/30 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Save className="w-4 h-4" />}
            onClick={handleSave}
          >
            Guardar Reglas
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
