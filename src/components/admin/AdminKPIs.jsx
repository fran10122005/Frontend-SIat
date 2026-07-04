import { Users, Stethoscope, Clock, ShieldAlert, TrendingUp, TrendingDown } from 'lucide-react';

const kpiConfig = [
  {
    key: 'totalNinos',
    label: 'Pacientes Activos',
    icon: Users,
    gradient: 'from-blue-500/10 to-transparent',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-slate-900 dark:text-white',
    suffix: '',
    trend: '+12%',
    trendDir: 'up',
  },
  {
    key: 'totalEspecialistas',
    label: 'Especialistas (Staff)',
    icon: Stethoscope,
    gradient: 'from-emerald-500/10 to-transparent',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    textColor: 'text-slate-900 dark:text-white',
    suffix: '',
    trend: '+2',
    trendDir: 'up',
  },
  {
    key: 'asignacionesActivas',
    label: 'Casos Asignados',
    icon: Clock,
    gradient: 'from-purple-500/10 to-transparent',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    textColor: 'text-slate-900 dark:text-white',
    suffix: '',
    trend: '85%',
    trendDir: 'up',
  },
  {
    key: 'totalAlertas',
    label: 'Incidentes / Crisis (Mes)',
    icon: ShieldAlert,
    gradient: 'from-amber-500 to-orange-600',
    iconBg: 'bg-white/20',
    iconColor: 'text-white',
    textColor: 'text-white',
    suffix: '',
    trend: null,
    trendDir: null,
  },
]

export default function AdminKPIs({ metricas }) {
  if (!metricas) return null;
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      {kpiConfig.map((cfg, i) => {
        const Icon = cfg.icon
        const value = metricas[cfg.key]
        const isAlert = cfg.key === 'totalAlertas'
        return (
          <div
            key={cfg.key}
            className={`group relative rounded-xl p-3 md:p-5 shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 ${isAlert ? 'bg-gradient-to-br ' + cfg.gradient + ' border-orange-500/20' : 'bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800/60'}`}
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${cfg.gradient} opacity-0 dark:opacity-100`} />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2 md:mb-3">
                <div className={`p-1.5 md:p-2.5 rounded-lg ${cfg.iconBg}`}>
                  <Icon className={`w-4 h-4 md:w-5 md:h-5 ${cfg.iconColor}`} />
                </div>
                {cfg.trend && (
                  <span className={`flex items-center gap-1 text-[10px] md:text-[11px] font-bold px-1.5 md:px-2 py-0.5 md:py-1 rounded-full ${isAlert ? 'bg-white/20 text-white' : cfg.trendDir === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 text-red-600'}`}>
                    {cfg.trendDir === 'up' ? <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3" /> : <TrendingDown className="w-2.5 h-2.5 md:w-3 md:h-3" />}
                    {cfg.trend}
                  </span>
                )}
              </div>
              <span className={`text-[10px] md:text-[11px] font-semibold uppercase tracking-wider ${isAlert ? 'text-orange-100' : 'text-slate-500 dark:text-slate-400'}`}>{cfg.label}</span>
              <div className="mt-1 flex md:mt-1.5 items-baseline gap-1 md:gap-2">
                <span className={`text-xl md:text-3xl font-bold ${cfg.textColor} transition-all duration-300 group-hover:scale-105 inline-block`}>{value}</span>
                {cfg.suffix && <span className={`text-xs md:text-sm font-semibold ${isAlert ? 'text-orange-200' : 'text-slate-400'}`}>{cfg.suffix}</span>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  );
}
