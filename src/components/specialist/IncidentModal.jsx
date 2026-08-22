import { AlertCircle, X } from "lucide-react";
import Button from "../ui/Button";

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
  { value: "Leve", color: "bg-emerald-500 border-emerald-500 text-white" },
  { value: "Moderada", color: "bg-amber-500 border-amber-500 text-white" },
  { value: "Severa", color: "bg-rose-600 border-rose-600 text-white" },
];

const RESULTADOS = [
  "Regulación exitosa sin apoyo",
  "Regulación con apoyo",
  "Regulación parcial / seguimiento en casa",
  "Escalada / requirió retiro",
];

const inputClass =
  "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer";

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-rose-600 text-white shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">
                Registro de Incidente (A-B-C)
              </h3>
            </div>
            <button
              onClick={() => setShowIncidentModal(false)}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleIncidentSubmit}
          className="p-6 space-y-5 overflow-y-auto flex-1"
        >
          {/* Tipo + Duración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Tipo de Conducta
              </label>
              <select
                required
                value={incidentData.inc_tipo}
                onChange={set("inc_tipo")}
                className={inputClass}
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Duración Aproximada
              </label>
              <select
                required
                value={incidentData.inc_dura}
                onChange={set("inc_dura")}
                className={inputClass}
              >
                <option value="">Selecciona...</option>
                <option value="< 1 minuto">{"<"} 1 minuto</option>
                <option value="1-5 minutos">1 a 5 minutos</option>
                <option value="5-15 minutos">5 a 15 minutos</option>
                <option value="> 15 minutos">{">"} 15 minutos</option>
              </select>
            </div>
          </div>

          {/* Antecedente */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Antecedente / Detonante (A)
            </label>
            <select
              required
              value={incidentData.inc_deto}
              onChange={set("inc_deto")}
              className={inputClass}
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
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
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
                  className={`flex-1 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${incidentData.inc_seve === s.value ? s.color : "border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800"}`}
                >
                  {s.value}
                </button>
              ))}
            </div>
          </div>

          {/* Rutina + Resultado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Rutina Aplicada (Apoyo)
              </label>
              <input
                type="text"
                value={incidentData.inc_ruti || ""}
                onChange={set("inc_ruti")}
                placeholder="Ej. Respiración de la tortuga"
                className={`${inputClass} cursor-text`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Resultado Final
              </label>
              <select
                value={incidentData.inc_resu || ""}
                onChange={set("inc_resu")}
                className={inputClass}
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
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Consecuencia / Qué se Hizo (C)
              </label>
              <textarea
                value={incidentData.inc_conse || ""}
                onChange={set("inc_conse")}
                placeholder="Acciones tomadas después del comportamiento..."
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-blue-500 h-20 resize-none text-slate-800 dark:text-slate-200 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Intervención Aplicada
              </label>
              <textarea
                value={incidentData.inc_inter || ""}
                onChange={set("inc_inter")}
                placeholder="Estrategias terapéuticas utilizadas..."
                className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-blue-500 h-20 resize-none text-slate-800 dark:text-slate-200 transition-colors"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Notas de Observación
            </label>
            <textarea
              value={incidentData.inc_obse || ""}
              onChange={set("inc_obse")}
              placeholder="Describe brevemente el comportamiento y cómo se logró la calma."
              className="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:outline-none focus:border-blue-500 h-20 resize-none text-slate-800 dark:text-slate-200 transition-colors"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowIncidentModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl shadow-sm shadow-rose-500/25 transition-all"
            >
              Guardar Incidente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
