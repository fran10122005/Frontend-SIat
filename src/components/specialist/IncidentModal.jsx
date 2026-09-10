import { AlertCircle, X, ShieldAlert } from "lucide-react";
import Button from "../ui/Button";

const TIPOS = [
  "Crisis / Meltdown Sensorial",
  "Berrinche / Desregulación",
  "Agresión física o verbal",
  "Auto-lesión",
  "Conducta de escape / Fuga",
  "Otro",
];

const SEVERIDADES = [
  {
    value: "Leve",
    label: "Leve",
    color: "bg-emerald-600 text-white border-emerald-600",
  },
  {
    value: "Moderada",
    label: "Moderada",
    color: "bg-amber-500 text-white border-amber-500",
  },
  {
    value: "Severa",
    label: "Severa",
    color: "bg-rose-600 text-white border-rose-600",
  },
];

const DETONANTES_RAPIDOS = [
  "Ruido fuerte / Estímulo sensorial",
  "Cambio de rutina / Transición",
  "Demanda o tarea difícil",
  "Cansancio o hambre",
  "Frustración / Negativa",
  "Desconocido / Espontáneo",
];

export default function IncidentModal({
  showIncidentModal,
  setShowIncidentModal,
  incidentData,
  setIncidentData,
  handleIncidentSubmit,
  activeChild,
}) {
  if (!showIncidentModal) return null;

  const set = (key) => (e) =>
    setIncidentData((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700/80 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-rose-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Registrar Incidente Conductual
              </h3>
              {activeChild && (
                <p className="text-rose-100 text-xs">
                  Paciente: {activeChild.nom_nino} {activeChild.ape_nino}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowIncidentModal(false)}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form
          onSubmit={handleIncidentSubmit}
          className="p-6 space-y-4 overflow-y-auto flex-1"
        >
          {/* Tipo de Conducta */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Tipo de Conducta / Evento
            </label>
            <select
              required
              value={incidentData.inc_tipo || ""}
              onChange={set("inc_tipo")}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-rose-500 text-slate-800 dark:text-slate-200"
            >
              <option value="">Selecciona tipo de evento...</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Severidad y Duración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Severidad
              </label>
              <div className="flex gap-1.5">
                {SEVERIDADES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() =>
                      setIncidentData((prev) => ({
                        ...prev,
                        inc_seve: s.value,
                      }))
                    }
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      (incidentData.inc_seve || "Moderada") === s.value
                        ? s.color
                        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Duración Aprox.
              </label>
              <select
                value={incidentData.inc_dura || "1-5 minutos"}
                onChange={set("inc_dura")}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-rose-500 text-slate-800 dark:text-slate-200"
              >
                <option value="< 1 minuto">Menos de 1 minuto</option>
                <option value="1-5 minutos">1 a 5 minutos</option>
                <option value="5-15 minutos">5 a 15 minutos</option>
                <option value="> 15 minutos">Más de 15 minutos</option>
              </select>
            </div>
          </div>

          {/* Detonante */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Causa / Detonante Identificado
            </label>
            <select
              required
              value={incidentData.inc_deto || ""}
              onChange={set("inc_deto")}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-rose-500 text-slate-800 dark:text-slate-200"
            >
              <option value="">Selecciona el detonante...</option>
              {DETONANTES_RAPIDOS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Intervención y Calma */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Estrategia Aplicada y Observaciones
            </label>
            <textarea
              rows={3}
              value={incidentData.inc_inter || incidentData.inc_obse || ""}
              onChange={(e) =>
                setIncidentData((prev) => ({
                  ...prev,
                  inc_inter: e.target.value,
                  inc_obse: e.target.value,
                }))
              }
              placeholder="¿Qué estrategia o rutina se utilizó para calmarlo? (Ej. tiempo fuera, respiración, objeto de confort)..."
              className="w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-rose-500 text-slate-800 dark:text-slate-200 resize-none transition-colors"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-700/50">
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
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl shadow-sm shadow-rose-500/25 transition-all flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4" /> Registrar Incidente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
