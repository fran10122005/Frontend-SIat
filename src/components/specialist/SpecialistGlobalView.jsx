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
  globalAlertsFeed,
  behaviorData = [],
  sensoryData = [],
  isDark = false,
  quickActions = [],
}) {
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 md:p-5 shadow-sm border border-slate-200 dark:border-slate-800/60 relative overflow-hidden flex items-center gap-4">
          <div className="p-2.5 md:p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <UserCircle2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[11px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Pacientes Activos
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {globalStats.pacientesActivos}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 md:p-5 shadow-sm border border-slate-200 dark:border-slate-800/60 relative overflow-hidden flex items-center gap-4">
          <div className="p-2.5 md:p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[11px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Cumplimiento PEI (Promedio)
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {globalStats.porcentajeCumplimiento}%
            </h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-3 md:p-5 shadow-sm border border-rose-500/20 relative overflow-hidden text-white flex items-center gap-4 animate-pulse col-span-2 md:col-span-1">
          <div className="p-2 md:p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[11px] md:text-xs font-semibold text-rose-100 uppercase tracking-wide">
              Alertas (24h)
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-white">
              {globalStats.alertasPendientes}
            </h3>
          </div>
        </div>
      </div>

      {/* Gráficas Globales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
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
      <div className="flex flex-wrap gap-2 animate-in fade-in duration-300">
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
      <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[300px] animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            Alertas y Novedades
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3">
          {globalAlertsFeed.map((al, idx) => (
            <div
              key={al.id || al.alertId || `alert-${idx}`}
              className="p-4 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 relative pl-5 border-l-4 border-l-rose-500"
            >
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                {al.time} • {al.paciente}
              </p>
              <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-line">
                {al.text}
              </p>
            </div>
          ))}
          {globalAlertsFeed.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 min-h-[150px]">
              <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No hay alertas recientes.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
