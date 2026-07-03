import { Calendar, Filter, RotateCcw, Users } from 'lucide-react'

export default function GlobalFilters({
  dateRange,
  setDateRange,
  pacientes = [],
  selectedPaciente,
  setSelectedPaciente,
  metricType,
  setMetricType,
  showPatientFilter = false
}) {
  const hasFilters = dateRange !== '7days' || selectedPaciente || metricType !== 'TODAS'

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1">
        <Filter className="w-3.5 h-3.5" />
        Filtros
      </div>

      <div className="relative">
        <Calendar className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        <select
          value={dateRange}
          onChange={e => setDateRange(e.target.value)}
          className="pl-3 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
        >
          <option value="today">Hoy</option>
          <option value="7days">Últimos 7 días</option>
          <option value="30days">Últimos 30 días</option>
          <option value="all">Todo el historial</option>
        </select>
      </div>

      {showPatientFilter && pacientes.length > 0 && (
        <div className="relative">
          <Users className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            value={selectedPaciente || ''}
            onChange={e => setSelectedPaciente(e.target.value || null)}
            className="pl-3 pr-7 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none min-w-[140px]"
          >
            <option value="">Todos los pacientes</option>
            {pacientes.map(p => (
              <option key={p.id_ninos || p.nin_codi} value={p.id_ninos || p.nin_codi}>
                {p.nin_nomb} {p.nin_apel || ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="relative">
        <select
          value={metricType}
          onChange={e => setMetricType(e.target.value)}
          className="pl-3 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
        >
          <option value="TODAS">Todas las métricas</option>
          <option value="estres">Estrés</option>
          <option value="bpm">BPM</option>
          <option value="movimiento">Movimiento</option>
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={() => {
            setDateRange('7days')
            setSelectedPaciente && setSelectedPaciente(null)
            setMetricType('TODAS')
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          Limpiar
        </button>
      )}
    </div>
  )
}
