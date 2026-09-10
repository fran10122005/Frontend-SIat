import { FilePlus, X, Sparkles } from "lucide-react";
import Button from "../ui/Button";

const TIPOS = [
  { value: "Terapéutica", label: "🩺 Terapéutica" },
  { value: "Conductual", label: "🧠 Conductual" },
  { value: "Médica", label: "💊 Médica" },
  { value: "Familiar", label: "🏠 Familiar" },
];

const PRIORIDADES = [
  {
    value: "Baja",
    label: "Baja",
    color: "bg-emerald-600 text-white border-emerald-600",
  },
  {
    value: "Media",
    label: "Media",
    color: "bg-amber-500 text-white border-amber-500",
  },
  {
    value: "Alta",
    label: "Alta",
    color: "bg-rose-600 text-white border-rose-600",
  },
];

export default function IndicacionModal({
  showIndicacionModal,
  setShowIndicacionModal,
  indicacionText,
  setIndicacionText,
  handleIndicacionSubmit,
  activeChild,
}) {
  if (!showIndicacionModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700/80 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-blue-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Nueva Indicación</h3>
              {activeChild && (
                <p className="text-blue-100 text-xs">
                  Para: {activeChild.nom_nino} {activeChild.ape_nino}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowIndicacionModal(false)}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleIndicacionSubmit}
          className="p-6 space-y-4 overflow-y-auto flex-1"
        >
          {/* Tipo de Indicación */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Tipo de Indicación
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIPOS.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() =>
                    setIndicacionText((prev) => ({
                      ...prev,
                      ind_tipo: t.value,
                    }))
                  }
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-bold text-center transition-all ${
                    (indicacionText.ind_tipo || "Terapéutica") === t.value
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500 font-bold shadow-sm"
                      : "border-slate-200 dark:border-slate-700 hover:border-blue-300 text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Prioridad
            </label>
            <div className="flex gap-2">
              {PRIORIDADES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() =>
                    setIndicacionText((prev) => ({
                      ...prev,
                      ind_prio: p.value,
                    }))
                  }
                  className={`flex-1 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                    (indicacionText.ind_prio || "Media") === p.value
                      ? p.color
                      : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Instrucciones principales */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Instrucción o Tarea para el Representante
            </label>
            <textarea
              required
              rows={4}
              value={indicacionText.ind_desc || ""}
              onChange={(e) =>
                setIndicacionText((prev) => ({
                  ...prev,
                  ind_desc: e.target.value,
                }))
              }
              placeholder="Escribe claramente la indicación, pasos o ejercicios que el representante debe realizar en casa con el niño..."
              className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 resize-none transition-colors"
            />
          </div>

          {/* Detalles opcionales rápidos */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Frecuencia (opcional)
              </label>
              <select
                value={indicacionText.ind_frec || "Diaria"}
                onChange={(e) =>
                  setIndicacionText((prev) => ({
                    ...prev,
                    ind_frec: e.target.value,
                  }))
                }
                className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
              >
                <option value="Diaria">Diaria</option>
                <option value="2 veces por semana">2 veces por semana</option>
                <option value="3 veces por semana">3 veces por semana</option>
                <option value="Semanal">Semanal</option>
                <option value="Solo en sesión">Solo en sesión</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Área (opcional)
              </label>
              <select
                value={indicacionText.ind_area || "General"}
                onChange={(e) =>
                  setIndicacionText((prev) => ({
                    ...prev,
                    ind_area: e.target.value,
                  }))
                }
                className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:border-blue-500 text-slate-700 dark:text-slate-300"
              >
                <option value="General">General</option>
                <option value="Comunicación">Comunicación</option>
                <option value="Conducta">Conducta</option>
                <option value="Sensorial">Sensorial</option>
                <option value="Autonomía">Autonomía / Vida Diaria</option>
                <option value="Regulación Emocional">
                  Regulación Emocional
                </option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-700/50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowIndicacionModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl shadow-sm shadow-blue-500/25 transition-all flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" /> Guardar y Enviar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
