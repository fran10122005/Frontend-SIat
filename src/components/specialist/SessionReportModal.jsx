import { createPortal } from "react-dom";
import {
  FileText,
  X,
  Printer,
  Clock,
  CalendarDays,
  UserCircle2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import Button from "../ui/Button";

const STATUS_BADGES = {
  Completada: {
    icon: CheckCircle2,
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  Parcial: {
    icon: AlertTriangle,
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  "No realizada": {
    icon: XCircle,
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-400",
  },
};

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

function formatTime(seconds) {
  if (!seconds && seconds !== 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}min ${s}s`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  return `${h}h ${rm}min`;
}

export default function SessionReportModal({
  showModal,
  setShowModal,
  sessionData = {},
}) {
  if (!showModal) return null;

  const {
    fecha = new Date().toLocaleDateString("es-VE"),
    paciente = "Paciente",
    duracion = null,
    activities = [],
    notas = "",
  } = sessionData;

  const completedCount = activities.filter(
    (a) => a.status === "Completada",
  ).length;
  const partialCount = activities.filter((a) => a.status === "Parcial").length;
  const notDoneCount = activities.filter(
    (a) => a.status === "No realizada",
  ).length;

  const handleExport = () => {
    window.print();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 bg-blue-600 text-white shrink-0 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="p-2 bg-white/20 rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            Informe de Sesión
          </h3>
          <button
            onClick={() => setShowModal(false)}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Resumen */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Fecha
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {fecha}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <UserCircle2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Paciente
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {paciente}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Duración
                  </p>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {formatDuration(duracion)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen de estados */}
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> {completedCount}{" "}
              completadas
            </span>
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> {partialCount} parciales
            </span>
            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> {notDoneCount} no realizadas
            </span>
          </div>

          {/* Tabla de actividades */}
          {activities.length > 0 && (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Actividades
                </p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {activities.map((act, idx) => {
                  const badge =
                    STATUS_BADGES[act.status] || STATUS_BADGES["No realizada"];
                  const BadgeIcon = badge.icon;
                  return (
                    <div
                      key={act.act_codi || act.id || idx}
                      className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {act.name || act.act_nomb || `Actividad ${idx + 1}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.bg} ${badge.text}`}
                        >
                          <BadgeIcon className="w-3 h-3" />
                          {act.status}
                        </span>
                        {act.elapsed != null && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTime(act.elapsed)}
                          </span>
                        )}
                      </div>
                      {act.notes && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 italic sm:max-w-[200px] truncate">
                          {act.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notas generales */}
          {notas && (
            <div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Notas de la Sesión
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 whitespace-pre-wrap">
                {notas}
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50 dark:bg-slate-800/30 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={handleExport}
          >
            Exportar PDF
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
