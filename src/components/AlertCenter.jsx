import { useState, useEffect } from 'react'
import { useGlobalContext } from '../context/GlobalState'
import { HeartPulse, Activity, Zap } from 'lucide-react'

export default function AlertCenter() {
  const { alertas, evaluateAlert } = useGlobalContext()
  const [isDark, setIsDark] = useState(false)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true)
    }
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
    setIsDark(!isDark)
  }

  // Formatting date for display
  const formatDate = (isoString) => {
    const d = new Date(isoString)
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const formatTime = (isoString) => {
    const d = new Date(isoString)
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  // Filtering
  const filteredAlerts = alertas.filter(alert => {
    let matchDate = true
    if (dateFilter) {
      matchDate = alert.fec_hora.startsWith(dateFilter)
    }

    let matchStatus = true
    if (statusFilter === 'Efectivas') matchStatus = alert.fue_efec === true
    else if (statusFilter === 'No Efectivas') matchStatus = alert.fue_efec === false
    else if (statusFilter === 'Pendientes') matchStatus = alert.fue_efec === null

    return matchDate && matchStatus
  })

  // Group by date for the timeline
  const groupedAlerts = filteredAlerts.reduce((groups, alert) => {
    const date = alert.fec_hora.split('T')[0]
    if (!groups[date]) groups[date] = []
    groups[date].push(alert)
    return groups
  }, {})

  const sortedDates = Object.keys(groupedAlerts).sort((a, b) => new Date(b) - new Date(a))

  return (
    <div className="w-full">
      <div className="max-w-5xl w-full mx-auto p-6 md:p-8 flex flex-col gap-6">

        {/* [D] Controles y Filtros */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex w-full sm:w-auto items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 mr-2">Filtros:</span>
            
            <input 
              type="date" 
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
          >
            <option value="Todos">Todos los Estados</option>
            <option value="Pendientes">Acción Pendiente</option>
            <option value="Efectivas">Intervenciones Efectivas</option>
            <option value="No Efectivas">Intervenciones No Efectivas</option>
          </select>
          {(dateFilter || statusFilter !== 'Todos') && (
            <button onClick={() => { setDateFilter(''); setStatusFilter('Todos') }} className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0">
              Limpiar
            </button>
          )}
        </div>

        {/* [C] Timeline / Feed de Alertas */}
        <div className="relative mt-4">
          
          {sortedDates.length === 0 ? (
            <div className="py-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 mb-4 text-gray-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">No hay alertas registradas</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">No se encontraron incidentes para los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-slate-700 before:to-transparent">
              {sortedDates.map((date) => (
                <div key={date} className="relative">
                  {/* Date Separator */}
                  <div className="flex items-center justify-start mb-8 relative z-10 ml-1">
                    <span className="bg-white dark:bg-slate-800 text-brand-700 dark:text-blue-400 font-semibold text-sm px-4 py-1.5 rounded-full border border-gray-200 dark:border-slate-600 shadow-sm">
                      {formatDate(date)}
                    </span>
                  </div>

                  <div className="space-y-8">
                    {groupedAlerts[date].map((alert, index) => (
                      <div key={alert.id_alert} className="relative flex items-start gap-6 group is-active">
                        
                        {/* Icon Marker */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 bg-amber-100 text-amber-500 shadow shrink-0 z-10 mt-1">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>

                        {/* Card Body */}
                        <div className="w-full p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md">
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white">
                              {formatTime(alert.fec_hora)}
                            </span>
                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border uppercase tracking-wide ${
                              alert.est_dete === 'SOBRECARGA'
                                ? 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800 dark:text-rose-400'
                                : 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400'
                            }`}>
                              {alert.est_dete === 'SOBRECARGA' ? 'Crisis' : 'Precrisis'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Se ha detectado una anomalía en los patrones de estrés/movimiento. ID del evento: <span className="font-mono text-xs bg-gray-100 dark:bg-slate-700 px-1 rounded">{alert.id_alert}</span>
                          </p>
                          <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                            <span className="flex items-center gap-1.5"><HeartPulse className="w-3.5 h-3.5 text-red-500"/> Pulso Pico: {alert.bpm_max || 115} BPM</span>
                            <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-indigo-500"/> Movimiento Pico: {alert.mov_max || 2.4} G</span>
                            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-500"/> Estrés: {alert.stress_index || 75}%</span>
                          </div>

                          <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                            
                            {alert.fue_efec === null ? (
                              <div className="w-full">
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 text-center sm:text-left">¿Fue efectiva la intervención manual?</p>
                                <div className="flex gap-2">
                                  <button 
                                    onClick={() => evaluateAlert(alert.id_alert, true)}
                                    className="flex-1 bg-[#1E7E34] hover:bg-green-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors shadow-sm"
                                  >
                                    👍 Sí, fue efectiva
                                  </button>
                                  <button 
                                    onClick={() => evaluateAlert(alert.id_alert, false)}
                                    className="flex-1 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-semibold py-2 px-3 rounded-lg transition-colors"
                                  >
                                    👎 No fue efectiva
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={`w-full flex items-center justify-center sm:justify-start gap-2 py-2 px-3 rounded-lg border ${
                                alert.fue_efec 
                                  ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
                                  : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                              }`}>
                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  {alert.fue_efec 
                                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  }
                                </svg>
                                <span className="text-sm font-semibold">
                                  {alert.fue_efec ? 'Intervención Exitosa' : 'Intervención No Efectiva'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
