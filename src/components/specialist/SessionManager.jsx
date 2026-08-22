import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  Plus,
  Play,
} from "lucide-react";
import Button from "../ui/Button";

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const STATUS_STYLES = {
  Programada:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "En Curso":
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Completada:
    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

function getWeekDays(baseDate) {
  const d = new Date(baseDate);
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(d);
  monday.setDate(d.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

function isToday(date) {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatHour(hour) {
  return `${String(hour).padStart(2, "0")}:00`;
}

export default function SessionManager({
  sessions = [],
  onStartSession,
  onSelectSession,
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  const baseDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);

  const sessionsByDay = useMemo(() => {
    const map = {};
    weekDays.forEach((d) => {
      map[formatDate(d)] = [];
    });
    sessions.forEach((s) => {
      const key = s.fecha || s.ses_fech;
      if (map[key]) map[key].push(s);
    });
    Object.values(map).forEach((arr) =>
      arr.sort((a, b) =>
        (a.hora || a.ses_hora || "").localeCompare(b.hora || b.ses_hora || ""),
      ),
    );
    return map;
  }, [sessions, weekDays]);

  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const opts = { day: "numeric", month: "short" };
    return `${start.toLocaleDateString("es-VE", opts)} – ${end.toLocaleDateString("es-VE", opts)}, ${end.getFullYear()}`;
  }, [weekDays]);

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden animate-in fade-in duration-300">
      <div className="px-4 md:px-6 py-4 border-b border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <CalendarDays className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Agenda Semanal
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {weekLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => setWeekOffset((o) => o - 1)}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setWeekOffset(0)}
            className="text-xs"
          >
            Hoy
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<ChevronRight className="w-4 h-4" />}
            onClick={() => setWeekOffset((o) => o + 1)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-700/50">
        {weekDays.map((date, idx) => {
          const key = formatDate(date);
          const daySessions = sessionsByDay[key] || [];
          const today = isToday(date);

          return (
            <div
              key={key}
              className={`p-3 min-h-[140px] ${today ? "bg-indigo-50/50 dark:bg-indigo-900/10" : ""}`}
            >
              <div
                className={`text-center mb-3 ${today ? "font-black text-indigo-700 dark:text-indigo-400" : "font-semibold text-slate-600 dark:text-slate-400"}`}
              >
                <p className="text-[10px] uppercase tracking-wider">
                  {DAY_NAMES[idx]}
                </p>
                <p
                  className={`text-lg leading-tight mt-0.5 ${today ? "bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto text-sm" : ""}`}
                >
                  {date.getDate()}
                </p>
              </div>

              <div className="space-y-2">
                {daySessions.map((session, sIdx) => {
                  const status =
                    session.estado || session.ses_esta || "Programada";
                  const nombre =
                    session.paciente || session.nom_nino
                      ? `${session.nom_nino || ""} ${session.ape_nino || ""}`.trim()
                      : session.patientName || "Paciente";
                  const hora = session.hora || session.ses_hora || "";
                  const isInProgress = status === "En Curso";

                  return (
                    <div
                      key={session.id || session.ses_codi || sIdx}
                      className={`rounded-lg p-2 border transition-all cursor-pointer hover:shadow-sm ${
                        isInProgress
                          ? "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
                      }`}
                      onClick={() => onSelectSession?.(session)}
                    >
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                        {nombre}
                      </p>
                      {hora && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-2.5 h-2.5" />{" "}
                          {formatHour(parseInt(hora, 10))}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_STYLES[status] || STATUS_STYLES.Programada}`}
                        >
                          {status}
                        </span>
                        {today && status === "Programada" && (
                          <Button
                            variant="primary"
                            size="xs"
                            leftIcon={<Play className="w-2.5 h-2.5" />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartSession?.(session);
                            }}
                          >
                            Iniciar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}

                {daySessions.length === 0 && (
                  <button
                    className="w-full h-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-500 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-500 transition-colors"
                    onClick={() => onSelectSession?.({ fecha: key })}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
