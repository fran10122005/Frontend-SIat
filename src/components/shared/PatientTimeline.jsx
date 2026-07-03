import { useState, useMemo } from 'react'
import { AlertTriangle, FileText, Target, MessageSquare, Calendar, Activity, Circle } from 'lucide-react'

const tipoConfig = {
  alerta: { icon: AlertTriangle, color: 'text-rose-500 bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400', label: 'Alerta' },
  sesion: { icon: Activity, color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', label: 'Sesión' },
  indicacion: { icon: MessageSquare, color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400', label: 'Indicación' },
  meta: { icon: Target, color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Meta PEI' },
  cita: { icon: Calendar, color: 'text-amber-500 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400', label: 'Cita' },
  reporte: { icon: FileText, color: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400', label: 'Reporte' }
}

export default function PatientTimeline({
  eventos = [],
  paciente = ''
}) {
  const [filter, setFilter] = useState('TODOS')

  const tiposUnicos = useMemo(() => {
    return [...new Set(eventos.map(e => e.tipo).filter(Boolean))]
  }, [eventos])

  const eventosFiltrados = useMemo(() => {
    const items = filter === 'TODOS' ? eventos : eventos.filter(e => e.tipo === filter)
    return [...items].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  }, [eventos, filter])

  const agrupadosPorFecha = useMemo(() => {
    const grupos = {}
    eventosFiltrados.forEach(e => {
      const key = e.fecha.split('T')[0]
      if (!grupos[key]) grupos[key] = []
      grupos[key].push(e)
    })
    return Object.entries(grupos).sort(([a], [b]) => new Date(b) - new Date(a))
  }, [eventosFiltrados])

  const formatearFecha = (fechaStr) => {
    const d = new Date(fechaStr + 'T12:00:00')
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatearHora = (fechaStr) => {
    const d = new Date(fechaStr)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60">
      <div className="p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" />
            Línea de Tiempo del Paciente
          </h2>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter('TODOS')}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-colors ${filter === 'TODOS' ? 'bg-slate-900 text-white dark:bg-slate-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              Todos
            </button>
            {tiposUnicos.map(t => {
              const cfg = tipoConfig[t] || tipoConfig.reporte
              return (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-2.5 py-1 text-[10px] font-semibold rounded-lg transition-colors flex items-center gap-1 ${filter === t ? cfg.color + ' ring-1 ring-current' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  <cfg.icon className="w-3 h-3" />
                  {cfg.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="p-4 max-h-[600px] overflow-y-auto">
        {agrupadosPorFecha.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
            <Activity className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-semibold">No hay eventos registrados</p>
            <p className="text-xs mt-1">Los eventos aparecerán aquí a medida que se registren sesiones, alertas e indicaciones.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700"></div>
            {agrupadosPorFecha.map(([fecha, items]) => (
              <div key={fecha} className="mb-6 last:mb-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 border-2 border-white dark:border-slate-800 flex items-center justify-center shrink-0 relative z-10">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {formatearFecha(fecha)}
                  </span>
                </div>
                <div className="ml-12 space-y-2">
                  {items.map((ev, ei) => {
                    const cfg = tipoConfig[ev.tipo] || tipoConfig.reporte
                    const Icono = cfg.icon
                    return (
                      <div
                        key={`${fecha}-${ei}`}
                        className="p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors animate-in fade-in slide-in-from-bottom-2 duration-300"
                        style={{ animationDelay: `${ei * 80}ms`, animationFillMode: 'backwards' }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1.5 rounded-lg ${cfg.color} shrink-0`}>
                            <Icono className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold ${cfg.color.split(' ')[0]}`}>
                                {cfg.label}
                              </span>
                              {ev.hora && (
                                <span className="text-[10px] text-slate-400">{ev.hora}</span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                              {ev.titulo}
                            </p>
                            {ev.descripcion && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                                {ev.descripcion}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
