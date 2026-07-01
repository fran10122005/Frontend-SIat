import { useState, useMemo } from 'react'
import Sidebar from './Sidebar'
import { useGlobalContext } from '../context/GlobalState'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { TrendingUp, Download, Search, X } from 'lucide-react'
import Topbar from './Topbar'
import { exportHistoryToPDF } from '../utils/pdfGenerator'

export default function HistoryProgress() {
  const { historicalData, userRole, globalPeiGoals } = useGlobalContext()
  const [dateRange, setDateRange] = useState('7days')
  const [searchNotes, setSearchNotes] = useState('')
  const [filterEfectividad, setFilterEfectividad] = useState('TODOS')

  function parseFecRepo(str) {
    if (!str) return null
    const parts = str.split('/')
    if (parts.length === 3) {
      const [day, month, year] = parts
      return new Date(+year, +month - 1, +day)
    }
    const d = new Date(str)
    return isNaN(d.getTime()) ? null : d
  }

  const filteredData = useMemo(() => {
    let data = historicalData || []

    // Fecha range
    if (dateRange !== 'all' && data.length > 0) {
      const now = new Date()
      const limit = dateRange === '7days' ? 7 : 30
      const cutoff = new Date(now.getTime() - limit * 24 * 60 * 60 * 1000)
      data = data.filter(d => {
        const dDate = parseFecRepo(d.fec_repo)
        if (!dDate) return true
        return dDate >= cutoff
      })
    }

    // Búsqueda en notas
    if (searchNotes) {
      const q = searchNotes.toLowerCase()
      data = data.filter(d => (d.com_tend || '').toLowerCase().includes(q))
    }

    // Efectividad
    if (filterEfectividad === 'EFECTIVA') data = data.filter(d => d.fue_efec)
    if (filterEfectividad === 'NO_EFECTIVA') data = data.filter(d => !d.fue_efec)

    return data
  }, [historicalData, dateRange, searchNotes, filterEfectividad])

  const hasFilters = dateRange !== '7days' || searchNotes || filterEfectividad !== 'TODOS'

  const mockChartData = [
    { fec_repo: '01/07/2026', pro_calm: 72, tot_sesi: 3, fue_efec: true },
    { fec_repo: '02/07/2026', pro_calm: 68, tot_sesi: 4, fue_efec: true },
    { fec_repo: '03/07/2026', pro_calm: 82, tot_sesi: 3, fue_efec: true },
    { fec_repo: '04/07/2026', pro_calm: 55, tot_sesi: 2, fue_efec: false },
    { fec_repo: '05/07/2026', pro_calm: 78, tot_sesi: 4, fue_efec: true },
    { fec_repo: '06/07/2026', pro_calm: 90, tot_sesi: 3, fue_efec: true },
    { fec_repo: '07/07/2026', pro_calm: 85, tot_sesi: 4, fue_efec: true },
  ]

  const isEmptyData = !historicalData || historicalData.length === 0

  const kpis = useMemo(() => {
    const data = isEmptyData ? mockChartData : (filteredData || [])
    if (data.length === 0) return { avgCalm: 0, totalSessions: 0, effectivePercentage: 0 }
    const totalSessions = data.reduce((acc, curr) => acc + (curr.tot_sesi || 0), 0)
    const avgCalm = Math.round(data.reduce((acc, curr) => acc + (curr.pro_calm || 0), 0) / data.length)
    const effectiveAlerts = data.filter(d => d.fue_efec).length
    const effectivePercentage = Math.round((effectiveAlerts / data.length) * 100)
    return { avgCalm, totalSessions, effectivePercentage }
  }, [filteredData, isEmptyData])

  const handleExportPDF = () => {
    exportHistoryToPDF(filteredData || [])
  }

  return (
    <div className="flex h-screen w-full bg-[#F4F7F9] dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-6 md:p-8 lg:p-10 flex flex-col gap-8">
            
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                  <TrendingUp className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                  Reportes de Evolución Médica
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Análisis histórico y tendencias de comportamiento
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-gray-800 dark:text-white cursor-pointer shadow-sm transition-colors"
                >
                  <option value="7days">Últimos 7 días</option>
                  <option value="month">Este Mes</option>
                  <option value="all">Todo el historial</option>
                </select>

                <button onClick={handleExportPDF} className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-brand-700 dark:text-blue-300 font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                  <Download className="w-5 h-5 text-brand-500 dark:text-blue-400" />
                  Exportar PDF Médico
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {/* KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-brand-500 dark:text-blue-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Promedio de Calma</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{kpis.avgCalm}%</span>
                    <span className="text-sm font-medium text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded border border-green-100 dark:border-green-800/50">+5% vs sem. pasada</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total de Sesiones</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{kpis.totalSessions}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">sesiones completadas</span>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-[#1E7E34] dark:text-green-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Alertas Efectivas</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">{kpis.effectivePercentage}%</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">tasa de éxito en rutinas</span>
                  </div>
                </div>
              </div>

              {/* Gráfico */}
              <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-500 dark:text-blue-400" />
                  Evolución del Tiempo en Calma (pro_calm)
                </h3>
                <div className="w-full h-[200px] md:h-[300px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={isEmptyData ? mockChartData : (filteredData || [])} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="fec_repo" tick={{ fontSize: 12 }} tickMargin={10} stroke="#9CA3AF" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9CA3AF" tickFormatter={(val) => `${val}%`} />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value) => [`${value}% en calma`, 'Tiempo Promedio']}
                        labelFormatter={(label) => `Fecha: ${label}`}
                      />
                      <Bar dataKey="pro_calm" radius={[4, 4, 0, 0]} maxBarSize={50} animationDuration={1000}>
                        {(isEmptyData ? mockChartData : (filteredData || [])).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pro_calm > 75 ? '#034EA1' : '#94A3B8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Filtros tabla */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" placeholder="Buscar en notas médicas..." value={searchNotes} onChange={e => setSearchNotes(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <select value={filterEfectividad} onChange={e => setFilterEfectividad(e.target.value)} className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                  <option value="TODOS">Todas las efectividades</option>
                  <option value="EFECTIVA">Efectiva</option>
                  <option value="NO_EFECTIVA">No Efectiva</option>
                </select>
                {(hasFilters) && (
                  <button onClick={() => { setSearchNotes(''); setFilterEfectividad('TODOS'); setDateRange('7days') }} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0">
                    <X className="w-3.5 h-3.5" /> Limpiar
                  </button>
                )}
              </div>

              {/* Tabla */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200">Registro Clínico Detallado</h3>
                </div>
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                    <thead className="bg-gray-50/50 dark:bg-slate-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-slate-700">
                      <tr>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Fecha (fec_repo)</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-center">Sesiones (tot_sesi)</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-center">Efectividad (fue_efec)</th>
                        <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Notas Médicas (com_tend)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                      {filteredData.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                            No se encontraron registros con los filtros aplicados.
                          </td>
                        </tr>
                      ) : (filteredData || []).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-200">
                            {row.fec_repo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 font-semibold">
                              {row.tot_sesi}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {row.fue_efec ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#E6F4EA] text-[#1E7E34] dark:bg-green-900/30 dark:text-green-400 border border-[#A8DAB5] dark:border-green-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#1E7E34] dark:bg-green-400"></span>
                                Efectiva
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400"></span>
                                No Efectiva
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-400 min-w-[250px]">
                            {row.com_tend}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Metas PEI - visible para representantes */}
              {globalPeiGoals?.length > 0 && (
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                      Metas PEI
                    </h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {globalPeiGoals.map((g) => {
                      const progress = g.met_prog || (g.met_ttria > 0 ? Math.round((g.met_trial / g.met_ttria) * 100) : 0)
                      return (
                        <div key={g.met_codi} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{g.met_desc}</p>
                            <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-slate-900 px-2 py-1 rounded shadow-sm border border-slate-200 dark:border-slate-700 ml-2">
                              {g.met_trial || 0} / {g.met_ttria || 0}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
