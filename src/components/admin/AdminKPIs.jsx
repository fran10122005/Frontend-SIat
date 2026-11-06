import {
  Users,
  Stethoscope,
  Clock,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const kpiConfig = [
  {
    key: "totalNinos",
    label: "Pacientes Activos",
    icon: Users,
    glowGradient: "from-blue-500/15 via-blue-500/5 to-transparent",
    iconBg:
      "bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    cardBg:
      "bg-gradient-to-br from-blue-50/70 via-slate-50/70 to-blue-50/20 dark:bg-none dark:bg-[#162032] border-blue-200/70 dark:border-slate-800/70",
    suffix: "",
    trend: null,
    trendDir: null,
  },
  {
    key: "totalEspecialistas",
    label: "Especialistas (Staff)",
    icon: Stethoscope,
    glowGradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
    iconBg:
      "bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-900/50",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    cardBg:
      "bg-gradient-to-br from-emerald-50/70 via-slate-50/70 to-emerald-50/20 dark:bg-none dark:bg-[#162032] border-emerald-200/70 dark:border-slate-800/70",
    suffix: "",
    trend: null,
    trendDir: null,
  },
  {
    key: "asignacionesActivas",
    label: "Casos Asignados",
    icon: Clock,
    glowGradient: "from-purple-500/15 via-purple-500/5 to-transparent",
    iconBg:
      "bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-900/50",
    iconColor: "text-purple-600 dark:text-purple-400",
    cardBg:
      "bg-gradient-to-br from-purple-50/70 via-slate-50/70 to-purple-50/20 dark:bg-none dark:bg-[#162032] border-purple-200/70 dark:border-slate-800/70",
    suffix: "",
    trend: null,
    trendDir: null,
  },
  {
    key: "totalAlertas",
    label: "Incidentes / Crisis (Mes)",
    icon: ShieldAlert,
    glowGradient: "from-rose-500/15 via-rose-500/5 to-transparent",
    iconBg:
      "bg-rose-50 dark:bg-rose-950/60 border border-rose-200/60 dark:border-rose-900/50",
    iconColor: "text-rose-600 dark:text-rose-400",
    cardBg:
      "bg-gradient-to-br from-rose-50/60 via-slate-50/70 to-rose-50/20 dark:bg-none dark:bg-[#162032] border-rose-200/70 dark:border-slate-800/70",
    suffix: "",
    trend: null,
    trendDir: null,
  },
];

export default function AdminKPIs({ metricas }) {
  if (!metricas) return null;
  return (
    <div
      id="tour-admin-kpis"
      className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
    >
      {kpiConfig.map((cfg, i) => {
        const rawValue = metricas[cfg.key];
        const value = rawValue ?? 0;
        const isAlert = cfg.key === "totalAlertas";
        const hasActiveAlerts = isAlert && Number(value) > 0;
        const Icon = isAlert && !hasActiveAlerts ? ShieldCheck : cfg.icon;

        // Estilos específicos para la tarjeta de alertas cuando hay o no hay crisis
        const cardStyle = isAlert
          ? hasActiveAlerts
            ? "bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent dark:bg-none dark:bg-rose-950/30 border-rose-300 dark:border-rose-800/60 ring-1 ring-rose-500/20"
            : cfg.cardBg
          : cfg.cardBg;

        const iconBoxStyle = isAlert
          ? hasActiveAlerts
            ? "bg-rose-100 dark:bg-rose-900/60 border border-rose-200 dark:border-rose-700/60 text-rose-600 dark:text-rose-300 animate-pulse"
            : "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400"
          : `${cfg.iconBg} ${cfg.iconColor}`;

        const valueColor =
          isAlert && hasActiveAlerts
            ? "text-rose-600 dark:text-rose-400"
            : "text-slate-900 dark:text-white";

        return (
          <div
            key={cfg.key}
            className={`group relative rounded-xl p-3 md:p-5 shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${cardStyle}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            {/* Gradiente ambiental suave en modo oscuro (no invasivo, con contraste perfecto) */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${cfg.glowGradient} opacity-30 dark:opacity-20 pointer-events-none`}
            />

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <div
                  className={`p-2 md:p-2.5 rounded-xl transition-transform duration-200 group-hover:scale-105 ${iconBoxStyle}`}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5" />
                </div>

                {isAlert ? (
                  <span
                    className={`flex items-center gap-1 text-[10px] md:text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      hasActiveAlerts
                        ? "bg-rose-100 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 animate-pulse"
                        : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {hasActiveAlerts ? "¡Atención!" : "Bajo control"}
                  </span>
                ) : cfg.trend ? (
                  <span
                    className={`flex items-center gap-1 text-[10px] md:text-[11px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ${
                      cfg.trendDir === "up"
                        ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400"
                        : "bg-red-50 dark:bg-rose-950/50 text-red-600 dark:text-rose-400"
                    }`}
                  >
                    {cfg.trendDir === "up" ? (
                      <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    ) : (
                      <TrendingDown className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    )}
                    {cfg.trend}
                  </span>
                ) : null}
              </div>

              <span className="text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                {cfg.label}
              </span>

              <div className="flex items-baseline gap-1 md:gap-2">
                <span
                  className={`text-xl md:text-3xl font-extrabold tracking-tight ${valueColor} transition-all duration-300 group-hover:scale-105 inline-block`}
                >
                  {value}
                </span>
                {cfg.suffix && (
                  <span className="text-xs md:text-sm font-semibold text-slate-400 dark:text-slate-500">
                    {cfg.suffix}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
