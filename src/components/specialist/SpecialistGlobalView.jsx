import { useState } from "react";
import {
  UserCircle2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function SpecialistGlobalView({
  globalStats,
  globalAlertsFeed = [],
  behaviorData = [],
  sensoryData = [],
  isDark = false,
  quickActions = [],
}) {
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const tooltipStyle = {
    borderRadius: "8px",
    border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
    backgroundColor: isDark ? "#0F172A" : "#fff",
    color: isDark ? "#f8fafc" : "#0f172a",
    fontSize: "12px",
  };
  const axisTick = { fill: isDark ? "#94A3B8" : "#64748B", fontSize: 11 };

  return (
    <>
      {/* KPIs Globales */}
      <div
        data-tour="sp-global-kpis"
        className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 animate-in fade-in duration-300"
      >
        <div className="bg-gradient-to-br from-blue-50/80 via-slate-50/70 to-blue-50/20 dark:bg-none dark:bg-[#162032] rounded-xl p-4 md:p-5 shadow-sm border border-blue-200/80 dark:border-slate-800/80 relative overflow-hidden flex items-center gap-4 group">
          <div className="p-2.5 md:p-3 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200/50 dark:border-blue-900/50 group-hover:scale-105 transition-transform">
            <UserCircle2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[11px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Pacientes Activos
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {globalStats.pacientesActivos}
            </h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-indigo-50/80 via-slate-50/70 to-indigo-50/20 dark:bg-none dark:bg-[#162032] rounded-xl p-4 md:p-5 shadow-sm border border-indigo-200/80 dark:border-slate-800/80 relative overflow-hidden flex items-center gap-4 group">
          <div className="p-2.5 md:p-3 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200/50 dark:border-indigo-900/50 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[11px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Cumplimiento PEI (Promedio)
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {globalStats.porcentajeCumplimiento}%
            </h3>
          </div>
        </div>

        <div
          className={`rounded-xl p-3 md:p-5 shadow-sm border relative overflow-hidden flex items-center gap-4 col-span-2 md:col-span-1 transition-all ${
            Number(globalStats.alertasPendientes) > 0
              ? "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 animate-pulse"
              : "bg-gradient-to-br from-slate-50/80 via-white to-slate-50/30 dark:bg-none dark:bg-[#162032] border-slate-200/80 dark:border-slate-800/80 text-slate-900 dark:text-white"
          }`}
        >
          <div
            className={`p-2 md:p-3 rounded-xl border ${
              Number(globalStats.alertasPendientes) > 0
                ? "bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 border-rose-200 dark:border-rose-700/60"
                : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/50"
            }`}
          >
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[11px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Alertas (24h)
            </p>
            <div className="flex items-center gap-2">
              <h3
                className={`text-xl md:text-2xl font-bold ${
                  Number(globalStats.alertasPendientes) > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-slate-900 dark:text-white"
                }`}
              >
                {globalStats.alertasPendientes}
              </h3>
              {Number(globalStats.alertasPendientes) === 0 && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/40">
                  Todo en orden
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gráficas Globales */}
      <div
        data-tour="sp-global-charts"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        {/* Incidentes conductuales últimos 7 días */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800/60 shadow-sm flex flex-col h-[280px] lg:h-[350px]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-1">
            Incidentes Conductuales (7 días)
          </h2>
          <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mb-3">
            Distribución de eventos por tipo en la última semana
          </p>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <BarChart
                data={behaviorData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={isDark ? "#334155" : "#E2E8F0"}
                />
                <XAxis
                  dataKey="dia"
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={axisTick}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: isDark ? "#1E293B" : "#F1F5F9" }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11 }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar
                  dataKey="Berrinche"
                  stackId="a"
                  fill="#F43F5E"
                  maxBarSize={28}
                />
                <Bar
                  dataKey="Estereotipia"
                  stackId="a"
                  fill="#8B5CF6"
                  maxBarSize={28}
                />
                <Bar
                  dataKey="Agresión"
                  stackId="a"
                  fill="#F59E0B"
                  maxBarSize={28}
                />
                <Bar
                  dataKey="Ansiedad"
                  stackId="a"
                  fill="#3B82F6"
                  maxBarSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribución por tipo */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 border border-slate-200 dark:border-slate-800/60 shadow-sm flex flex-col h-[280px] lg:h-[350px]">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-1">
            Distribución por Tipo de Incidente
          </h2>
          <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mb-3">
            Proporción de eventos registrados
          </p>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              minHeight={0}
            >
              <PieChart>
                <Pie
                  data={sensoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {sensoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11 }}
                  iconType="circle"
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Accesos rápidos compactos */}
      <div
        data-tour="sp-global-actions"
        className="flex flex-wrap gap-2 animate-in fade-in duration-300"
      >
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                action.highlight
                  ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white border-blue-500/30 hover:shadow-md"
                  : "bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-brand-300 dark:hover:border-brand-700"
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {action.label}
            </button>
          );
        })}
      </div>

      {/* Alertas Globales */}
      <div
        data-tour="sp-global-alerts"
        className="bg-white dark:bg-[#1E293B] rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[300px] animate-in fade-in slide-in-from-bottom-4 duration-300"
      >
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            Alertas y Novedades
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div
            className={
              showAllAlerts
                ? "space-y-2"
                : "space-y-2 [mask-image:linear-gradient(to_bottom,black_70%,transparent)]"
            }
          >
            {globalAlertsFeed
              .slice(0, showAllAlerts ? undefined : 4)
              .map((al, idx) => {
                const rawDate = al.fec_hora || al.fecha || al.created_at;
                const d = rawDate ? new Date(rawDate) : null;
                const fecha =
                  al.time ||
                  (d && !isNaN(d)
                    ? d.toLocaleString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "");
                const tipo = al.tipo || al.est_dete || "Evento";
                const detalle =
                  al.text ||
                  al.mensaje ||
                  [
                    al.bpm_max != null && `BPM máx ${al.bpm_max}`,
                    al.mov_max != null && `Movimiento ${al.mov_max}G`,
                    al.stress_index != null && `Estrés ${al.stress_index}%`,
                    al.descripcion,
                  ]
                    .filter(Boolean)
                    .join(" • ") ||
                  "Sin detalles adicionales.";
                const esCrisis =
                  String(tipo).toUpperCase().includes("SOBRECARGA") ||
                  al.severity === "crisis";
                return (
                  <div
                    key={al.id || al.alertId || `alert-${idx}`}
                    className={`px-3 py-2.5 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 border-l-4 ${
                      esCrisis ? "border-l-rose-500" : "border-l-amber-400"
                    }`}
                  >
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-0.5">
                      {fecha}
                      {fecha && " • "}
                      <span className="text-slate-500 dark:text-slate-400 uppercase">
                        {tipo}
                      </span>
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug line-clamp-2">
                      {detalle}
                    </p>
                  </div>
                );
              })}
            {globalAlertsFeed.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 min-h-[150px]">
                <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No hay alertas recientes.</p>
              </div>
            )}
          </div>
          {globalAlertsFeed.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllAlerts((v) => !v)}
              className="mt-3 w-full py-2 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {showAllAlerts
                ? "Ver menos"
                : `Ver todas (${globalAlertsFeed.length})`}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
