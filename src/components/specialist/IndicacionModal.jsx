import { FilePlus, X } from "lucide-react";
import Button from "../ui/Button";

const TIPOS = [
  {
    value: "Terapéutica",
    desc: "Actividades y ejercicios de intervención directa.",
  },
  {
    value: "Conductual",
    desc: "Estrategias de manejo y modificación de conducta.",
  },
  { value: "Médica", desc: "Recomendaciones clínicas y seguimiento de salud." },
  { value: "Académica", desc: "Ajustes y apoyos para el ámbito escolar." },
  { value: "Familiar", desc: "Pautas para el hogar y rutinas en casa." },
];

const AREAS = [
  "Comunicación",
  "Lenguaje",
  "Socialización",
  "Conducta",
  "Sensorial",
  "Motricidad Fina",
  "Motricidad Gruesa",
  "Autonomía / Vida Diaria",
  "Atención y Concentración",
  "Regulación Emocional",
  "Cognición",
  "Juego",
];

const FRECUENCIAS = [
  "Diaria",
  "3 veces por semana",
  "2 veces por semana",
  "Semanal",
  "Quincenal",
  "Mensual",
  "Solo en sesión",
];

const PRIORIDADES = [
  { value: "Alta", color: "bg-rose-600 border-rose-600 text-white" },
  { value: "Media", color: "bg-amber-500 border-amber-500 text-white" },
  { value: "Baja", color: "bg-emerald-500 border-emerald-500 text-white" },
];

const inputClass =
  "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer";

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
      <div className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-blue-600 text-white shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <FilePlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Nueva Indicación Clínica</h3>
                {activeChild && (
                  <p className="text-blue-100 text-sm mt-0.5">
                    {activeChild.nom_nino} {activeChild.ape_nino}
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
        </div>

        <form
          onSubmit={handleIndicacionSubmit}
          className="p-6 space-y-5 overflow-y-auto flex-1"
        >
          {/* Tipo */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Tipo de Indicación
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
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
                  className={`text-left p-3 rounded-xl border-2 transition-all ${(indicacionText.ind_tipo || "") === t.value ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-slate-200 dark:border-slate-600 hover:border-blue-300 bg-white dark:bg-slate-800"}`}
                >
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {t.value}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Área + Frecuencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Área de Intervención
              </label>
              <select
                value={indicacionText.ind_area || ""}
                onChange={(e) =>
                  setIndicacionText((prev) => ({
                    ...prev,
                    ind_area: e.target.value,
                  }))
                }
                required
                className={inputClass}
              >
                <option value="">Selecciona el área...</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Frecuencia Recomendada
              </label>
              <select
                value={indicacionText.ind_frec || ""}
                onChange={(e) =>
                  setIndicacionText((prev) => ({
                    ...prev,
                    ind_frec: e.target.value,
                  }))
                }
                required
                className={inputClass}
              >
                <option value="">Selecciona frecuencia...</option>
                {FRECUENCIAS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Duración + Vigencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Duración Estimada
              </label>
              <input
                type="text"
                value={indicacionText.ind_dura || ""}
                onChange={(e) =>
                  setIndicacionText((prev) => ({
                    ...prev,
                    ind_dura: e.target.value,
                  }))
                }
                placeholder="Ej. 15 min por sesión"
                className={`${inputClass} cursor-text`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Vigencia (Opcional)
              </label>
              <input
                type="date"
                value={indicacionText.ind_vige || ""}
                onChange={(e) =>
                  setIndicacionText((prev) => ({
                    ...prev,
                    ind_vige: e.target.value,
                  }))
                }
                className={inputClass}
              />
            </div>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                  className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${(indicacionText.ind_prio || "") === p.value ? p.color : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800"}`}
                >
                  {p.value}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Instrucciones y Recomendaciones
            </label>
            <textarea
              value={indicacionText.ind_desc || ""}
              onChange={(e) =>
                setIndicacionText((prev) => ({
                  ...prev,
                  ind_desc: e.target.value,
                }))
              }
              placeholder="Describa la indicación, pasos a seguir, materiales y criterios de éxito..."
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-blue-500 min-h-[110px] resize-none text-slate-800 dark:text-slate-200 transition-colors"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50">
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
