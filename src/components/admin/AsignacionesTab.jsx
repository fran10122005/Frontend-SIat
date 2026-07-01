import { useState, useMemo } from 'react'
import { Search, X } from 'lucide-react'
import StatusBadge from '../StatusBadge';

export default function AsignacionesTab({
  asignacion,
  setAsignacion,
  ninos,
  especialistas,
  asignaciones,
  loading,
  handleAssign,
  handleToggleAsignacion,
  exportAsignacionesToPDF,
  exportAsignacionesToExcel,
  onRegisterClick
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('TODOS')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = useMemo(() => {
    return asignaciones.filter(asi => {
      const paciente = `${asi.tm_ninos?.nin_nomb || ''} ${asi.tm_ninos?.nin_apel || ''}`.toLowerCase()
      const especialista = `${asi.tm_espec?.esp_nomb || ''} ${asi.tm_espec?.esp_apel || ''}`.toLowerCase()
      const q = search.toLowerCase()
      if (search && !paciente.includes(q) && !especialista.includes(q)) return false
      if (statusFilter !== 'TODOS' && asi.asi_stdo !== statusFilter) return false
      if (dateFrom && asi.asi_inic && new Date(asi.asi_inic) < new Date(dateFrom)) return false
      if (dateTo && asi.asi_inic) {
        const end = new Date(dateTo); end.setHours(23, 59, 59, 999)
        if (new Date(asi.asi_inic) > end) return false
      }
      return true
    })
  }, [asignaciones, search, statusFilter, dateFrom, dateTo])

  const hasFilters = search || statusFilter !== 'TODOS' || dateFrom || dateTo

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('TODOS')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Asignar Paciente a Especialista</h2>
          {onRegisterClick && (
            <button 
              type="button"
              onClick={onRegisterClick}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5 transform hover:-translate-y-0.5"
            >
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Registrar Nuevo Niño
            </button>
          )}
        </div>
        <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Seleccionar Paciente</label>
            <select required value={asignacion.nin_codi} onChange={e => setAsignacion({...asignacion, nin_codi: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer">
              <option value="" disabled>Buscar paciente...</option>
              {ninos.map(n => (
                <option key={n.nin_codi} value={n.nin_codi}>{n.nin_nomb} {n.nin_apel}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Especialista Tratante</label>
            <select required value={asignacion.esp_codi} onChange={e => setAsignacion({...asignacion, esp_codi: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer">
              <option value="" disabled>Seleccionar médico...</option>
              {especialistas.filter(e => e.tm_usuar?.usu_estd).map(esp => (
                <option key={esp.esp_codi} value={esp.esp_codi}>{esp.esp_gner === 'M' ? 'Dr.' : 'Dra.'} {esp.esp_nomb} {esp.esp_apel}</option>
              ))}
            </select>
          </div>
          <button disabled={loading} type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 h-[42px]">
            Crear Asignación
          </button>
        </form>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" placeholder="Buscar por paciente o especialista..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
          <option value="TODOS">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" title="Fecha ingreso desde" />
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" title="Fecha ingreso hasta" />
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0">
            <X className="w-3.5 h-3.5" /> Limpiar
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Casos Clínicos</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full">{filtered.length} registros</span>
            <div className="flex gap-2">
              <button onClick={exportAsignacionesToPDF} className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg text-xs font-semibold transition-colors">
                PDF
              </button>
              <button onClick={exportAsignacionesToExcel} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-semibold transition-colors">
                Excel
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase">Paciente</th>
                <th className="py-3 px-4 font-semibold uppercase">Especialista</th>
                <th className="py-3 px-4 font-semibold uppercase">Fecha Ingreso</th>
                <th className="py-3 px-4 font-semibold uppercase">Estado</th>
                <th className="py-3 px-4 font-semibold uppercase text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filtered.map(asi => (
                <tr key={asi.asi_codi} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900 dark:text-white">{asi.tm_ninos?.nin_nomb} {asi.tm_ninos?.nin_apel}</div>
                    <div className="text-xs text-slate-500 font-mono">ID: {asi.tm_ninos?.nin_codi}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-700 dark:text-slate-300">{asi.tm_espec?.esp_gner === 'M' ? 'Dr.' : 'Dra.'} {asi.tm_espec?.esp_nomb} {asi.tm_espec?.esp_apel}</div>
                    <div className="text-xs text-slate-500 font-mono">ID: {asi.tm_espec?.esp_codi}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                    {new Date(asi.asi_inic).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge active={asi.asi_stdo === 'Activo'} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleToggleAsignacion(asi.asi_codi, asi.asi_stdo)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${asi.asi_stdo === 'Activo' ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}>
                      {asi.asi_stdo === 'Activo' ? 'Dar de Alta' : 'Reactivar Caso'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
