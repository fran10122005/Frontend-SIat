import { useState, useEffect } from 'react'
import { Server, Monitor, Activity, Database, Clock, Wifi } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import api from '../../api/axios'

const defaultHealth = {
  api: { status: 'Operativo', uptime: '99.9%' },
  db: { status: 'Conectada', latency: '12ms' },
  ws: { status: 'Activo', clients: 0 },
  version: '2.1.0',
  latencyHistory: []
}

export default function InfraestructuraTab({ isDark, mockUptimeData }) {
  const [health, setHealth] = useState(defaultHealth)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.get('/admin/health')
      .then(res => { if (!cancelled) setHealth(res.data.data || res.data) })
      .catch(() => { if (!cancelled) setHealth(defaultHealth) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const chartData = health.latencyHistory?.length > 0 ? health.latencyHistory : mockUptimeData

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
            <Server className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">API Core</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{loading ? '...' : health.api?.status || 'Operativo'}</p>
            <p className="text-xs text-slate-400">{health.api?.uptime || '99.9%'} uptime</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Base de Datos</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{loading ? '...' : health.db?.status || 'Conectada'}</p>
            <p className="text-xs text-slate-400">{health.db?.latency || '12ms'} latencia</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Wifi className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">WebSocket</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{loading ? '...' : health.ws?.status || 'Activo'}</p>
            <p className="text-xs text-slate-400">{health.ws?.clients || 0} clientes</p>
          </div>
        </div>
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Versión</p>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{loading ? '...' : health.version || '2.1.0'}</p>
            <p className="text-xs text-slate-400">SIAT Platform</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-sm h-[300px] lg:h-[400px]">
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Latencia de Red (Últimas 24h)</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Tiempo de respuesta en la transmisión de datos biométricos</p>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-2.5 py-1 rounded-full">
            {chartData.length} puntos
          </span>
        </div>
        <ResponsiveContainer width="100%" height="85%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12}} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12}} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, backgroundColor: isDark ? '#0F172A' : '#fff', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '12px' }} 
            />
            <Line type="monotone" dataKey="latencia" stroke="#8B5CF6" strokeWidth={3} dot={{r: 4, fill: '#8B5CF6'}} name="Latencia (ms)" />
            <Line type="monotone" dataKey="uptime" stroke="#10B981" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Uptime (%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
