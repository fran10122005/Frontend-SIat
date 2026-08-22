import { createPortal } from "react-dom";
import {
  FileText,
  X,
  Trophy,
  TrendingUp,
  Target,
  BarChart3,
} from "lucide-react";
import Button from "../ui/Button";

function getStatusBadge(pct) {
  if (pct >= 100)
    return {
      text: "Completada",
      cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    };
  if (pct >= 70)
    return {
      text: "Avanzada",
      cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400",
    };
  if (pct >= 40)
    return {
      text: "En Progreso",
      cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    };
  return {
    text: "Iniciando",
    cls: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  };
}

export default function PeiReportModal({
  showModal,
  setShowModal,
  peiGoals = [],
  activeChild,
}) {
  if (!showModal) return null;

  const totalGoals = peiGoals.length;
  const completed = peiGoals.filter((g) => g.progress >= 100).length;
  const inProgress = peiGoals.filter(
    (g) => g.progress > 0 && g.progress < 100,
  ).length;
  const avgProgress =
    totalGoals > 0
      ? Math.round(
          peiGoals.reduce((acc, g) => acc + (g.progress || 0), 0) / totalGoals,
        )
      : 0;

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
        <div className="px-6 py-5 bg-blue-600 text-white shrink-0 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="p-2 bg-white/20 rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            Informe de Progreso PEI
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
          <div className="px-6 py-2.5 bg-indigo-50/30 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-slate-700 flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300 shrink-0">
            <Target className="w-3.5 h-3.5" />
            Paciente:{" "}
            <strong>
              {activeChild.nom_nino} {activeChild.ape_nino}
            </strong>
          </div>
        )}

        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Resumen estadístico */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
              <Target className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
              <p className="text-lg font-black text-slate-900 dark:text-white">
                {totalGoals}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Total Metas
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
              <Trophy className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {completed}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Completadas
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
              <TrendingUp className="w-4 h-4 text-amber-500 mx-auto mb-1" />
              <p className="text-lg font-black text-amber-600 dark:text-amber-400">
                {inProgress}
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                En Progreso
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-700 text-center">
              <BarChart3 className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
              <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                {avgProgress}%
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Progreso Promedio
              </p>
            </div>
          </div>

          {/* Tabla de metas */}
          {totalGoals > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">
                      Categoría
                    </th>
                    <th className="text-left py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">
                      Descripción
                    </th>
                    <th className="text-center py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">
                      Progreso
                    </th>
                    <th className="text-center py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">
                      Ensayos
                    </th>
                    <th className="text-center py-2 px-3 text-[10px] font-bold text-slate-500 uppercase">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {peiGoals.map((goal) => {
                    const pct = Math.round(goal.progress || 0);
                    const badge = getStatusBadge(pct);
                    return (
                      <tr
                        key={goal.id}
                        className="border-b border-slate-100 dark:border-slate-800 last:border-0"
                      >
                        <td className="py-2.5 px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {goal.category || "Sin categoría"}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                          {goal.goal}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-rose-400"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center text-xs font-mono text-slate-600 dark:text-slate-300">
                          {goal.trials}/{goal.totalTrials}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}
                          >
                            {badge.text}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                No hay metas PEI registradas para este paciente.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<FileText className="w-4 h-4" />}
          >
            Exportar PDF
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
