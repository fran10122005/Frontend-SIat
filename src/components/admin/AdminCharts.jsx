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

export default function AdminCharts({ metricas, isDark }) {
  const activityData = useMemo(() => {
    const data = metricas?.chartData
    return data && data.length > 0 ? data : mockChartData
  }, [metricas])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[300px] lg:h-[400px]">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Carga Clínica y Pacientes</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Evolución de admisiones e ingresos de pacientes</p>
          </div>
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
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, backgroundColor: isDark ? '#0F172A' : '#fff', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '12px' }} 
              />
              <Area type="monotone" dataKey="pacientes" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorPacientes)" name="Pacientes Activos" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[300px] lg:h-[400px]">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Productividad Terapéutica</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Horas de terapia impartidas mensualmente</p>
          </div>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12}} />
              <Tooltip 
                cursor={{fill: isDark ? '#334155' : '#F1F5F9'}}
                contentStyle={{ borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, backgroundColor: isDark ? '#0F172A' : '#fff', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '12px' }} 
              />
              <Bar dataKey="horasTerapia" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} name="Horas de Terapia" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
