import { createPortal } from "react-dom";
import {
  Activity,
  X,
  HeartPulse,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Target,
} from "lucide-react";
import Button from "../ui/Button";

function getTipoBadge(tipo) {
  const map = {
    Berrinche:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    Estereotipia:
      "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    Ansiedad:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Agresión:
      "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    Retiro: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  };
  return (
    map[tipo] ||
    "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
  );
}

export default function CrisisReportModal({
  showModal,
  setShowModal,
  crisisAlerts = [],
  activeChild,
}) {
  if (!showModal) return null;

  const alerts = crisisAlerts || [];
  const totalAlerts = alerts.length;
  const avgStress =
    totalAlerts > 0
      ? Math.round(
          alerts.reduce((acc, a) => acc + (a.stress_index || 0), 0) /
            totalAlerts,
        )
      : 0;

  const tipoCount = {};
  alerts.forEach((a) => {
    const tipo = a.crisis_type || "Sin clasificar";
    tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
  });
  const mostCommonTipo =
    Object.entries(tipoCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 dark:border-slate-700/80 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-rose-600 text-white shrink-0 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="p-2 bg-white/20 rounded-xl">
              <Activity className="w-5 h-5" />
            </span>
            Informe de Crisis IoT
          </h3>
          <button
            onClick={() => setShowModal(false)}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paciente */}
        {activeChild && (
          <div className="px-6 py-2.5 bg-rose-50/30 dark:bg-rose-900/10 border-b border-rose-100 dark:border-slate-700 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 shrink-0">
            <Target className="w-3.5 h-3.5" />
            Paciente:{" "}
            <strong>
              {activeChild.nom_nino} {activeChild.ape_nino}
            </strong>
          </div>
        )}

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Resumen de tendencia */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
              <HeartPulse className="w-4 h-4 text-rose-500 mx-auto mb-1" />
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {totalAlerts}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Total Crisis
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
              <TrendingUp className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                {avgStress}%
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Estrés Promedio
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
              <AlertTriangle className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
              <p className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                {mostCommonTipo}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Tipo Más Frecuente
              </p>
            </div>
          </div>

          {/* Tabla de alertas */}
          {totalAlerts > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">
                      Fecha
                    </th>
                    <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">
                      Tipo
                    </th>
                    <th className="text-center py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">
                      BPM Máx
                    </th>
                    <th className="text-center py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">
                      Índice Estrés
                    </th>
                    <th className="text-center py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">
                      Duración
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => (
                    <tr
                      key={alert.id_alert}
                      className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                    >
                      <td className="py-2.5 px-3 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {alert.fec_hora
                          ? new Date(alert.fec_hora).toLocaleDateString(
                              "es-ES",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )
                          : "N/A"}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getTipoBadge(alert.crisis_type)}`}
                        >
                          {alert.crisis_type || "Sin clasificar"}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                        {alert.bpm_max} BPM
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                        {alert.stress_index}%
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs text-slate-600 dark:text-slate-400">
                        {alert.duration || "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                No hay crisis registradas para este paciente.
              </p>
            </div>
          )}

          {/* Recomendaciones */}
          <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-900/30">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-indigo-500" />
              <h4 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                Recomendaciones Clínicas
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {totalAlerts === 0
                ? "No hay suficientes datos para generar recomendaciones. Se sugiere continuar monitoreando al paciente durante las sesiones."
                : `Se han registrado ${totalAlerts} eventos de crisis con un estrés promedio del ${avgStress}%. El tipo más frecuente es "${mostCommonTipo}". Se recomienda revisar las intervenciones actuales y ajustar las estrategias de regulación emocional según el patrón observado. Considere incrementar las sesiones de trabajo en las áreas más afectadas.`}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Activity className="w-4 h-4" />}
          >
            Exportar PDF
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
