import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function TelemetryChart({ telemetryHistory, isDark }) {
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col animate-in slide-in-from-top-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Gráfica de Evolución Técnica</h3>
          <p className="text-[11px] text-slate-500 mt-1">Comparativa de Calma vs Estrés basándose en datos del biosensor en las últimas horas</p>
        </div>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCalma" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorEstres" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#94A3B8' : '#64748B' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isDark ? '#94A3B8' : '#64748B' }} />
            <Tooltip 
              contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              itemStyle={{ fontSize: '13px', fontWeight: '500' }}
            />
            <Area type="monotone" dataKey="calma" name="Calma" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorCalma)" />
            <Area type="monotone" dataKey="estres" name="Estrés" stroke="#F43F5E" strokeWidth={3} fillOpacity={1} fill="url(#colorEstres)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
