import { AlertCircle, X } from "lucide-react";

const TIPOS = [
  "Berrinche / Rabieta",
  "Meltdown Sensorial",
  "Estereotipia Repetitiva",
  "Agresión hacia otros",
  "Auto-lesión",
  "Conducta de escape",
  "Conducta de búsqueda de atención",
];

const DETONANTES = [
  "Transición / Cambio de actividad",
  "Demanda clínica (Tarea difícil)",
  "Estímulo Sensorial: Ruido Fuerte",
  "Estímulo Sensorial: Luces / Visual",
  "Estímulo Sensorial: Táctil",
  "Retiro de objeto preferido",
  "Cansancio / Fatiga",
  "Hambre / Necesidad fisiológica",
  "Enfermedad / Malestar",
  "Desconocido / Espontáneo",
];

const SEVERIDADES = [
  {
    value: "Leve",
    color:
      "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    value: "Moderada",
    color:
      "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    value: "Severa",
    color:
      "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400",
  },
];

const RESULTADOS = [
  "Regulación exitosa sin apoyo",
  "Regulación con apoyo",
  "Regulación parcial / seguimiento en casa",
  "Escalada / requirió retiro",
];

export default function IncidentModal({
  showIncidentModal,
  setShowIncidentModal,
  incidentData,
  setIncidentData,
  handleIncidentSubmit,
}) {
  if (!showIncidentModal) return null;

  const set = (key) => (e) =>
    setIncidentData((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-rose-200 dark:border-rose-900/50 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-rose-100 dark:border-rose-900/30 flex justify-between items-center bg-rose-50 dark:bg-rose-900/10 shrink-0">
          <h3 className="text-base font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Registro de Incidente Conductual (A-B-C)
          </h3>
          <button
            onClick={() => setShowIncidentModal(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleIncidentSubmit}
          className="p-6 space-y-5 overflow-y-auto"
        >
          {/* Tipo + Duración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Tipo de Conducta
              </label>
              <select
                required
                value={incidentData.inc_tipo}
                onChange={set("inc_tipo")}
                className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
              >
                <option value="">Selecciona...</option>
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Duración Aproximada
              </label>
              <select
                required
                value={incidentData.inc_dura}
                onChange={set("inc_dura")}
                className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
              >
                <option value="">Selecciona...</option>
                <option value="< 1 minuto">{"<"} 1 minuto</option>
                <option value="1-5 minutos">1 a 5 minutos</option>
                <option value="5-15 minutos">5 a 15 minutos</option>
                <option value="> 15 minutos">{">"} 15 minutos</option>
              </select>
            </div>
          </div>

          {/* Antecedente A */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Antecedente / Detonante (A)
            </label>
            <select
              required
              value={incidentData.inc_deto}
              onChange={set("inc_deto")}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
            >
              <option value="">Selecciona el detonante...</option>
              {DETONANTES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Severidad */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Severidad del Incidente
            </label>
            <div className="flex gap-2">
              {SEVERIDADES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() =>
                    setIncidentData((prev) => ({ ...prev, inc_seve: s.value }))
                  }
                  className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${incidentData.inc_seve === s.value ? s.color : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"}`}
                >
                  {s.value}
                </button>
              ))}
            </div>
          </div>

          {/* Rutina + Consecuencia */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Rutina Aplicada (Apoyo)
              </label>
              <input
                type="text"
                value={incidentData.inc_ruti || ""}
                onChange={set("inc_ruti")}
                className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                placeholder="Ej. Respiración de la tortuga, Presión profunda"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Resultado Final
              </label>
              <select
                value={incidentData.inc_resu || ""}
                onChange={set("inc_resu")}
                className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
              >
                <option value="">Selecciona...</option>
                {RESULTADOS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Consecuencia + Intervención */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Consecuencia / Qué se Hizo (C)
              </label>
              <textarea
                value={incidentData.inc_conse || ""}
                onChange={set("inc_conse")}
                className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 h-20 resize-none transition-all"
                placeholder="Acciones tomadas inmediatamente después del comportamiento..."
              ></textarea>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Intervención Aplicada
              </label>
              <textarea
                value={incidentData.inc_inter || ""}
                onChange={set("inc_inter")}
                className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 h-20 resize-none transition-all"
                placeholder="Estrategias terapéuticas utilizadas durante el episodio..."
              ></textarea>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Notas de Observación
            </label>
            <textarea
              value={incidentData.inc_obse || ""}
              onChange={set("inc_obse")}
              className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 h-20 resize-none transition-all"
              placeholder="Describe brevemente el comportamiento y cómo se logró la calma."
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowIncidentModal(false)}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              Guardar Incidente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
