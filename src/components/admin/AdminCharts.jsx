import { useMemo } from 'react'
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

const mockChartData = [
  { name: 'Ene', pacientes: 12, horasTerapia: 45 },
  { name: 'Feb', pacientes: 15, horasTerapia: 52 },
  { name: 'Mar', pacientes: 18, horasTerapia: 48 },
  { name: 'Abr', pacientes: 22, horasTerapia: 65 },
  { name: 'May', pacientes: 20, horasTerapia: 58 },
  { name: 'Jun', pacientes: 25, horasTerapia: 72 },
]

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="px-4 py-3 rounded-xl shadow-xl border backdrop-blur-md" style={{ backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)', borderColor: isDark ? '#334155' : '#E2E8F0' }}>
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="font-semibold text-slate-700 dark:text-slate-200">{entry.name}:</span>
          <span className="font-bold text-slate-900 dark:text-white">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminCharts({ metricas, isDark }) {
  const activityData = useMemo(() => {
    const data = metricas?.chartData
    return data && data.length > 0 ? data : mockChartData
  }, [metricas])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[300px] lg:h-[400px] transition-all duration-200 hover:shadow-md">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Carga Clínica y Pacientes</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Evolución de admisiones e ingresos de pacientes</p>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full whitespace-nowrap">+108% anual</span>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPacientes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12}} />
              <Tooltip content={<CustomTooltip isDark={isDark} />} />
              <Area type="monotone" dataKey="pacientes" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPacientes)" name="Pacientes Activos" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[300px] lg:h-[400px] transition-all duration-200 hover:shadow-md">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Productividad Terapéutica</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Horas de terapia impartidas mensualmente</p>
          </div>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full whitespace-nowrap">{activityData.reduce((s, d) => s + d.horasTerapia, 0)}h total</span>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.6}/>
                  <stop offset="100%" stopColor="#10B981" stopOpacity={1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12}} />
              <Tooltip cursor={{fill: isDark ? '#334155' : '#F1F5F9'}} content={<CustomTooltip isDark={isDark} />} />
              <Bar dataKey="horasTerapia" fill="url(#barGrad)" radius={[6, 6, 0, 0]} maxBarSize={42} name="Horas de Terapia" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
