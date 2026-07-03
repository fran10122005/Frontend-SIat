import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'

const ICONS = {
  CREACION: { icon: '✦', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-400' },
  EDICION: { icon: '✎', bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400', border: 'border-blue-400' },
  ESTADO: { icon: '⬤', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-400' },
  INFO: { icon: 'ℹ', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-400' },
  WARN: { icon: '⚠', bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-400' },
  SUCCESS: { icon: '✓', bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-400' },
  INCIDENTE: { icon: '✕', bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-600 dark:text-red-400', border: 'border-red-400' },
  ASIGNACION: { icon: '⇄', bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400', border: 'border-purple-400' },
}

const DEFAULT_TYPE = { icon: '○', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500', border: 'border-slate-300' }

export default function ActivityTimeline({ events = [], typeKey = 'aud_tipo', dateKey = 'aud_time', descKey = 'aud_desc', actorKey = null, actorLabel = null }) {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('TODOS')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const types = useMemo(() => {
    const set = new Set(events.map(e => e[typeKey]).filter(Boolean))
    return ['TODOS', ...set]
  }, [events, typeKey])

  const filtered = useMemo(() => {
    return events.filter(e => {
      if (filterType !== 'TODOS' && e[typeKey] !== filterType) return false
      if (search) {
        const desc = (e[descKey] || '').toLowerCase()
        if (!desc.includes(search.toLowerCase())) return false
      }
      const d = new Date(e[dateKey])
      if (dateFrom && d < new Date(dateFrom)) return false
      if (dateTo) {
        const end = new Date(dateTo); end.setHours(23, 59, 59, 999)
        if (d > end) return false
      }
      return true
    })
  }, [events, search, filterType, dateFrom, dateTo, typeKey, descKey, dateKey])

  const hasFilters = search || filterType !== 'TODOS' || dateFrom || dateTo

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar en descripción..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-4 pr-9 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
          {types.map(t => <option key={t} value={t}>{t === 'TODOS' ? 'Todos los tipos' : t}</option>)}
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        {hasFilters && (
          <button onClick={() => { setSearch(''); setFilterType('TODOS'); setDateFrom(''); setDateTo('') }} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0">
            <X className="w-3.5 h-3.5" /> Limpiar
          </button>
        )}
      </div>

      {/* Timeline */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-slate-500">No hay eventos registrados.</div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-700" />

          <div className="space-y-0">
            {filtered.map((event, idx) => {
              const evType = event[typeKey] || 'INFO'
              const style = ICONS[evType] || DEFAULT_TYPE
              const date = new Date(event[dateKey])
              const dateStr = date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })
              const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
              const desc = event[descKey] || ''
              const actor = actorKey ? event[actorKey] : null

              return (
                <div key={event.id || idx} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Dot */}
                  <div className={`relative z-10 mt-0.5 w-10 h-10 rounded-full ${style.bg} ${style.text} flex items-center justify-center text-sm font-bold border-2 border-white dark:border-slate-900 shrink-0`}>
                    {style.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${style.bg} ${style.text}`}>{evType}</span>
                      <span className="text-xs text-slate-400">{dateStr}</span>
                      <span className="text-xs text-slate-400">{timeStr}</span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{desc}</p>
                    {actor && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {actorLabel || 'Actor'}: {typeof actor === 'object' ? (actor.usu_crro || actor.nombre || JSON.stringify(actor)) : actor}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
