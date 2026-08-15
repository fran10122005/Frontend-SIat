import { FilePlus, X, CalendarDays, Clock, Flag, Layers } from "lucide-react";

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
  {
    value: "Alta",
    color:
      "text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800",
  },
  {
    value: "Media",
    color:
      "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
  },
  {
    value: "Baja",
    color:
      "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
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

  const nombre = activeChild?.nom_nino
    ? `${activeChild.nom_nino} ${activeChild.ape_nino}`
    : "su paciente";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-indigo-100 dark:border-slate-700 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/20 shrink-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Nueva Indicación Clínica
          </h3>
          <button
            onClick={() => setShowIndicacionModal(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeChild && (
          <div className="px-6 py-2.5 bg-indigo-50/30 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-slate-700 flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300 shrink-0">
            <Layers className="w-3.5 h-3.5" />
            Paciente:{" "}
            <strong>
              {activeChild.nom_nino} {activeChild.ape_nino}
            </strong>
            <span className="text-slate-400">·</span> Visible de inmediato para
            el representante
          </div>
        )}

        <form
          onSubmit={handleIndicacionSubmit}
          className="p-6 space-y-5 overflow-y-auto"
        >
          {/* Tipo */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
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
                  className={`text-left p-3 rounded-xl border-2 transition-all duration-200 ${(indicacionText.ind_tipo || "") === t.value ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-200 dark:ring-indigo-900" : "border-slate-200 dark:border-slate-700 hover:border-indigo-300"}`}
                >
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {t.value}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                    {t.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Área + Frecuencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Área de Intervención
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
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Frecuencia Recomendada
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
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
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
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
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
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Vigencia (Opcional)
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
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Prioridad */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" /> Prioridad
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
                  className={`px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all ${(indicacionText.ind_prio || "") === p.value ? p.color : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"}`}
                >
                  {p.value}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
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
              placeholder="Describa de forma clara y concreta la indicación, incluyendo pasos a seguir, materiales y criterios de éxito..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 min-h-[110px] resize-none text-slate-800 dark:text-slate-200"
              required
            />
            <p className="text-[10px] text-slate-500 mt-2">
              Esta indicación quedará registrada en el expediente de {nombre} y
              será visible para el representante.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowIndicacionModal(false)}
              className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 font-semibold text-xs bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-2"
            >
              <FilePlus className="w-4 h-4" /> Guardar y Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
