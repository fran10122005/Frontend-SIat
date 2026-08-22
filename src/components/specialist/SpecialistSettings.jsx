import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Settings,
  Monitor,
  Moon,
  Sun,
  Bell,
  Download,
  LayoutGrid,
  X,
  Save,
} from "lucide-react";
import Button from "../ui/Button";

const DEFAULT_SETTINGS = {
  theme: "system",
  pushNotifications: true,
  emailNotifications: false,
  autoExport: false,
  defaultView: "global",
  compactMode: false,
  showHints: true,
};

export default function SpecialistSettings({
  showModal,
  setShowModal,
  settings,
  onSave,
}) {
  const [prefs, setPrefs] = useState({ ...DEFAULT_SETTINGS, ...settings });

  const set = (key) => (e) => {
    const val =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setPrefs((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    onSave?.(prefs);
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
                <Settings className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Preferencias</h3>
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
              Apariencia
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "light", icon: Sun, label: "Claro" },
                { value: "system", icon: Monitor, label: "Sistema" },
                { value: "dark", icon: Moon, label: "Oscuro" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, theme: opt.value }))}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-semibold ${
                    prefs.theme === opt.value
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300"
                      : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                  }`}
                >
                  <opt.icon className="w-5 h-5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              Notificaciones
            </p>
            <div className="space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Notificaciones push
                </span>
                <input
                  type="checkbox"
                  checked={prefs.pushNotifications}
                  onChange={set("pushNotifications")}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Notificaciones por email
                </span>
                <input
                  type="checkbox"
                  checked={prefs.emailNotifications}
                  onChange={set("emailNotifications")}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Exportación
            </p>
            <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Exportación automática de reportes
              </span>
              <input
                type="checkbox"
                checked={prefs.autoExport}
                onChange={set("autoExport")}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
            </label>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" />
              Interfaz
            </p>
            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                  Vista por defecto
                </label>
                <select
                  value={prefs.defaultView}
                  onChange={set("defaultView")}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                >
                  <option value="global">Vista Global</option>
                  <option value="patient">Panel del Paciente</option>
                  <option value="history">Historial</option>
                </select>
              </div>
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Modo compacto
                </span>
                <input
                  type="checkbox"
                  checked={prefs.compactMode}
                  onChange={set("compactMode")}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Mostrar pistas de uso
                </span>
                <input
                  type="checkbox"
                  checked={prefs.showHints}
                  onChange={set("showHints")}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </label>
            </div>
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
            Guardar Preferencias
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
