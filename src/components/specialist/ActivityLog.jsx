import { useState, useEffect, useRef, useCallback } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ListChecks,
  Flag,
} from "lucide-react";
import Button from "../ui/Button";

const STATUS_OPTIONS = [
  {
    key: "Completada",
    label: "Completada",
    icon: CheckCircle2,
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-300 dark:border-emerald-700",
    ring: "ring-emerald-400",
  },
  {
    key: "Parcial",
    label: "Parcial",
    icon: AlertTriangle,
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-300 dark:border-amber-700",
    ring: "ring-amber-400",
  },
  {
    key: "No realizada",
    label: "No realizada",
    icon: XCircle,
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-300 dark:border-rose-700",
    ring: "ring-rose-400",
  },
];

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ActivityCard({ activity, status, onStatusChange, elapsed }) {
  const nombre =
    activity.act_nomb || activity.name || activity.nombre || "Actividad";
  const descripcion =
    activity.description ||
    activity.act_desc ||
    activity.instrucciones ||
    activity.act_guia ||
    "";
  const pasos = activity.steps || activity.pasos || [];

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
            {nombre}
          </p>
          {descripcion && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed whitespace-pre-line">
              {descripcion}
            </p>
          )}
          {pasos.length > 0 && (
            <ol className="mt-2 space-y-1 list-decimal list-inside text-xs text-slate-600 dark:text-slate-400">
              {pasos.map((paso, i) => (
                <li key={i} className="leading-relaxed">
                  {typeof paso === "string"
                    ? paso
                    : paso.text || paso.descripcion || ""}
                </li>
              ))}
            </ol>
          )}
          {(activity.act_dura || activity.duration) && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1.5">
              <Clock className="w-2.5 h-2.5" />
              Tiempo planificado: {activity.act_dura || activity.duration} min
            </p>
          )}
        </div>
        {elapsed != null && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 shrink-0">
            <Clock className="w-3 h-3" />
            <span className="text-xs font-mono font-bold">
              {formatElapsed(elapsed)}
            </span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = status === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onStatusChange(opt.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border-2 text-xs font-bold transition-all ${
                isActive
                  ? `${opt.bg} ${opt.text} ${opt.border} ring-2 ${opt.ring}/30`
                  : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function ActivityLog({
  activities = [],
  onUpdate,
  sessionActive = false,
  onFinishSession,
}) {
  const [statuses, setStatuses] = useState({});
  const [timers, setTimers] = useState({});
  const intervalRef = useRef(null);

  useEffect(() => {
    if (sessionActive) {
      intervalRef.current = setInterval(() => {
        setTimers((prev) => {
          const next = { ...prev };
          Object.keys(next).forEach((k) => {
            if (next[k].running) next[k].elapsed += 1;
          });
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionActive]);

  const startTimer = useCallback((actId) => {
    setTimers((prev) => ({
      ...prev,
      [actId]: { running: true, elapsed: prev[actId]?.elapsed || 0 },
    }));
  }, []);

  const handleStatusChange = useCallback(
    (actId, newStatus) => {
      setStatuses((prev) => {
        const next = { ...prev, [actId]: newStatus };
        onUpdate?.(actId, newStatus, timers[actId]?.elapsed || 0);
        return next;
      });
      if (newStatus === "Completada" && !timers[actId]?.running) {
        startTimer(actId);
      }
    },
    [onUpdate, timers, startTimer],
  );

  const completedCount = Object.values(statuses).filter(
    (s) => s === "Completada",
  ).length;
  const partialCount = Object.values(statuses).filter(
    (s) => s === "Parcial",
  ).length;
  const notDoneCount = Object.values(statuses).filter(
    (s) => s === "No realizada",
  ).length;

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden animate-in fade-in duration-300">
      <div className="px-4 md:px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <ListChecks className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Registro de Actividades
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activities.length} actividades · {completedCount} completadas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] font-bold">
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> {completedCount}
          </span>
          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> {partialCount}
          </span>
          <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <XCircle className="w-3 h-3" /> {notDoneCount}
          </span>
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-3">
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-8">
            No hay actividades registradas para esta sesión.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activities.map((act, idx) => {
              const actId = act.act_codi || act.id || idx;
              return (
                <ActivityCard
                  key={actId}
                  activity={act}
                  status={statuses[actId]}
                  elapsed={timers[actId]?.elapsed}
                  onStatusChange={(s) => handleStatusChange(actId, s)}
                />
              );
            })}
          </div>
        )}

        {sessionActive && activities.length > 0 && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <Button
              variant="danger"
              size="md"
              leftIcon={<Flag className="w-4 h-4" />}
              onClick={() => onFinishSession?.(statuses, timers)}
            >
              Finalizar Sesión
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
