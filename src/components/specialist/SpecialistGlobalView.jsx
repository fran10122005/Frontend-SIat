import { useState, useMemo } from 'react'
import { UserCircle2, Clock, CheckCircle2, AlertCircle, CalendarDays, ShieldAlert, Search, X } from 'lucide-react'

export default function SpecialistGlobalView({
  globalStats,
  agendaHoy,
  globalAlertsFeed,
  setSelectedChildId,
  setNomNino,
  handleCompleteCita
}) {
  const [searchAgenda, setSearchAgenda] = useState('')
  const [filterEstado, setFilterEstado] = useState('TODOS')
  const [filterTipo, setFilterTipo] = useState('TODOS')

  const tiposUnicos = useMemo(() => {
    const tipos = [...new Set(agendaHoy.map(c => c.tipo))]
    return tipos
  }, [agendaHoy])

  const agendaFiltrada = useMemo(() => {
    return agendaHoy.filter(cita => {
      const q = searchAgenda.toLowerCase()
      if (searchAgenda && !cita.paciente.toLowerCase().includes(q)) return false
      if (filterEstado !== 'TODOS' && cita.estado !== filterEstado) return false
      if (filterTipo !== 'TODOS' && cita.tipo !== filterTipo) return false
      return true
    })
  }, [agendaHoy, searchAgenda, filterEstado, filterTipo])

  const hasAgendaFilters = searchAgenda || filterEstado !== 'TODOS' || filterTipo !== 'TODOS'

  return (
    <>
      {/* KPIs Globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800/60 relative overflow-hidden flex items-center gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <UserCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Pacientes Activos</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{globalStats.pacientesActivos}</h3>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800/60 relative overflow-hidden flex items-center gap-4">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Citas Hoy</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{globalStats.citasHoy}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800/60 relative overflow-hidden flex items-center gap-4">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cumplimiento PEI (Promedio)</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{globalStats.porcentajeCumplimiento}%</h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-5 shadow-sm border border-rose-500/20 relative overflow-hidden text-white flex items-center gap-4 animate-pulse">
          <div className="p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-rose-100 uppercase tracking-wide">Alertas (24h)</p>
            <h3 className="text-2xl font-bold text-white">{globalStats.alertasPendientes}</h3>
          </div>
        </div>
      </div>

      {/* Global Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Agenda */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[400px]">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
              Agenda Clínica - Hoy
            </h2>
          </div>

          {/* Filtros Agenda */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input type="text" placeholder="Buscar paciente..." value={searchAgenda} onChange={e => setSearchAgenda(e.target.value)} className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
              <option value="TODOS">Todos los estados</option>
              <option value="Completada">Completada</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Pendiente">Pendiente</option>
            </select>
            {tiposUnicos.length > 0 && (
              <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="TODOS">Todos los tipos</option>
                {tiposUnicos.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            {hasAgendaFilters && (
              <button onClick={() => { setSearchAgenda(''); setFilterEstado('TODOS'); setFilterTipo('TODOS') }} className="flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0">
                <X className="w-3 h-3" /> Limpiar
              </button>
            )}
          </div>
          
          {agendaFiltrada.length === 0 && !hasAgendaFilters && agendaHoy.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 dark:text-slate-500 min-h-[150px]">
              <CalendarDays className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No tienes citas agendadas para hoy.</p>
            </div>
          ) : agendaFiltrada.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-slate-400 dark:text-slate-500 min-h-[150px]">
              <Search className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No hay citas que coincidan con los filtros.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {agendaFiltrada.map((cita) => (
                <div key={cita.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors group flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded-md">
                        {cita.hora}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                        cita.estado === 'Completada' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        cita.estado === 'En Progreso' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 animate-pulse' :
                        'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                      }`}>
                        {cita.estado}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white text-base">{cita.paciente}</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{cita.tipo}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        setSelectedChildId(cita.childId);
                        setNomNino(cita.paciente);
                      }}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-sm font-semibold rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      Ir a Paciente
                    </button>
                    {cita.estado !== 'Completada' && (
                      <button 
                        onClick={() => handleCompleteCita(cita.id)}
                        className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-sm font-semibold rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        Completar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas Globales */}
        <div className="lg:col-span-4 bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[400px]">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              Alertas y Novedades
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {globalAlertsFeed.map(al => (
              <div key={al.id} className="p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 relative pl-4 border-l-4 border-l-rose-500">
                <p className="text-xs text-slate-400 mb-1 font-medium">{al.time} • {al.paciente}</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{al.text}</p>
              </div>
            ))}
            {globalAlertsFeed.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 min-h-[150px]">
                <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">No hay alertas recientes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
