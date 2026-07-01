import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { Activity } from 'lucide-react'

const mockBehavior = [
  { dia: 'Lun', Berrinche: 2, Estereotipia: 4, Agresión: 1 },
  { dia: 'Mar', Berrinche: 1, Estereotipia: 3, Agresión: 0 },
  { dia: 'Mié', Berrinche: 3, Estereotipia: 2, Agresión: 2 },
  { dia: 'Jue', Berrinche: 0, Estereotipia: 5, Agresión: 1 },
  { dia: 'Vie', Berrinche: 2, Estereotipia: 1, Agresión: 0 },
  { dia: 'Sáb', Berrinche: 1, Estereotipia: 3, Agresión: 1 },
  { dia: 'Dom', Berrinche: 0, Estereotipia: 2, Agresión: 0 },
]

export default function PatientBehaviorChart({ behaviorHistory, isDark }) {
  const chartData = useMemo(() => {
    return behaviorHistory && behaviorHistory.length > 0 ? behaviorHistory : mockBehavior
  }, [behaviorHistory])

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 transition-all duration-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-rose-500" />
          Historial Conductual y Crisis (Semana)
        </h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="w-3 h-3 bg-rose-500 rounded-sm"></div> Berrinche
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> Estereotipia
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <div className="w-3 h-3 bg-amber-500 rounded-sm"></div> Agresión
          </div>
        </div>
      </div>
      
      <div className="min-h-[200px] md:h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
            <XAxis dataKey="dia" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={12} tickLine={false} axisLine={false} />
            <RechartsTooltip 
              cursor={{fill: isDark ? '#334155' : '#f1f5f9'}}
              contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '8px' }}
            />
            <Bar dataKey="Berrinche" stackId="a" fill="#F43F5E" radius={[0, 0, 4, 4]} />
            <Bar dataKey="Estereotipia" stackId="a" fill="#6366F1" />
            <Bar dataKey="Agresión" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
