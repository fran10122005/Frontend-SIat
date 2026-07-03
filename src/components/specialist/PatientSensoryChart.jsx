import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { Zap } from 'lucide-react'

const mockSensoryData = [
  { name: 'Berrinche', value: 8, color: '#F43F5E' },
  { name: 'Estereotipia', value: 12, color: '#8B5CF6' },
  { name: 'Agresión', value: 4, color: '#F59E0B' },
  { name: 'Ansiedad', value: 6, color: '#3B82F6' },
  { name: 'Autoestimulación', value: 10, color: '#10B981' },
]

export default function PatientSensoryChart({ sensoryData = [], isDark }) {
  const chartData = useMemo(() => {
    return sensoryData.length > 0 ? sensoryData : mockSensoryData
  }, [sensoryData])
  const totalEventos = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 transition-all duration-200">
      <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-amber-500" />
        Análisis de Sensibilidad Sensorial (Últimos 7 días)
      </h2>
      <div className="w-full relative h-[200px] md:h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <RechartsTooltip 
              contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '8px' }}
              itemStyle={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 'bold' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Centro del dona */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <span className="text-3xl font-black text-slate-900 dark:text-white">{totalEventos}</span>
            <p className="text-[10px] uppercase font-bold text-slate-500">Eventos</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
        Basado en los reportes manuales y notas de terapia recientes.
      </p>
    </div>
  )
}
