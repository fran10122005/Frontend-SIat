import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function TelemetryChart({ telemetryHistory, isDark }) {
  // Custom active dot to render a beautiful pulsating glow at the end of the line
  const CustomActiveDot = (props) => {
    const { cx, cy, stroke } = props;
    return (
      <g>
        <circle cx={cx} cy={cy} r={10} fill={stroke} fillOpacity={0.15} />
        <circle cx={cx} cy={cy} r={6} fill={stroke} stroke="#fff" strokeWidth={2} className="animate-pulse" />
      </g>
    );
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800/60 flex flex-col animate-in slide-in-from-top-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-extrabold text-brand-700 dark:text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            Evolución de Biometría en Tiempo Real
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Visualización interactiva y calibración de los índices de Calma vs Estrés del paciente.
          </p>
        </div>
      </div>
      
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {/* Neon Glow Filter */}
              <filter id="neonGlowCalma" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="neonGlowEstres" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              
              <linearGradient id="colorCalma" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.01}/>
              </linearGradient>
              <linearGradient id="colorEstres" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(51, 65, 85, 0.5)' : '#E2E8F0'} />
            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF', 
                borderRadius: '12px', 
                border: isDark ? '1px solid #1E293B' : '1px solid #E2E8F0', 
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                backdropFilter: 'blur(8px)'
              }}
              itemStyle={{ fontSize: '12px', fontWeight: '600' }}
            />
            <Area 
              type="monotone" 
              dataKey="calma" 
              name="Nivel de Calma" 
              stroke="#10B981" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorCalma)" 
              filter="url(#neonGlowCalma)"
              activeDot={<CustomActiveDot stroke="#10B981" />}
            />
            <Area 
              type="monotone" 
              dataKey="estres" 
              name="Nivel de Estrés" 
              stroke="#F43F5E" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#colorEstres)" 
              filter="url(#neonGlowEstres)"
              activeDot={<CustomActiveDot stroke="#F43F5E" />}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
