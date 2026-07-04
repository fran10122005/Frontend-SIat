import { useState, useMemo } from 'react'
import { Search, X, Mail, Phone, UserRound } from 'lucide-react'
import { useGlobalContext } from '../../context/GlobalState'
import StatusBadge from '../shared/StatusBadge'
import Pagination from '../shared/Pagination'
import api from '../../api/axios'

const PAGE_SIZE = 10

export default function RepresentantesTab({ representantes, loading: parentLoading, onRefresh }) {
  const { showToast } = useGlobalContext()
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('TODOS')
  const [page, setPage] = useState(0)
  const [resettingId, setResettingId] = useState(null)

  const filtered = useMemo(() => {
    return representantes.filter(r => {
      const nombre = `${r.rep_nomb || ''} ${r.rep_apel || ''} ${r.usu_crro || ''}`.toLowerCase()
      const q = search.toLowerCase()
      if (search && !nombre.includes(q)) return false
      if (filterEstado === 'ACTIVO' && !r.usu_estd) return false
      if (filterEstado === 'INACTIVO' && r.usu_estd) return false
      return true
    })
  }, [representantes, search, filterEstado])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const hasFilters = search || filterEstado !== 'TODOS'

  const clearFilters = () => { setSearch(''); setFilterEstado('TODOS'); setPage(0) }

  const handleResetPass = async (usuCodi, email) => {
    setResettingId(usuCodi)
    try {
      await api.post(`/admin/usuarios/${usuCodi}/password`, {})
      showToast(`✅ Contraseña restablecida para ${email}. Nueva: SiatDoc2026*`)
    } catch {
      showToast(`❌ Error al restablecer contraseña.`)
    } finally {
      setResettingId(null)
    }
  }

  const handleToggleEstado = async (usuCodi, currentState) => {
    try {
      await api.patch(`/admin/users/${usuCodi}/estado`, { activo: !currentState })
      showToast(`✅ Representante ${!currentState ? 'activado' : 'desactivado'} exitosamente.`)
      onRefresh()
    } catch (err) {
      showToast(`❌ Error: ${err.response?.data?.error || err.message}`)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1E293B] p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Buscar por nombre o correo..." value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterEstado} onChange={e => { setFilterEstado(e.target.value); setPage(0) }} className="w-full sm:w-auto px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0">
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Representantes Legales</h2>
          <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full">{filtered.length} registros</span>
        </div>

        {parentLoading ? (
          <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : paged.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserRound className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold">No se encontraron representantes</p>
            <p className="text-xs mt-1">Los representantes aparecen aquí cuando son registrados mediante invitación clínica.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Representante</th>
                    <th className="px-6 py-3">Contacto</th>
                    <th className="px-6 py-3 hidden sm:table-cell">Paciente Asociado</th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paged.map(r => (
                    <tr key={r.usu_codi || r.rep_codi} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shrink-0 text-sm">
                            {(r.rep_nomb?.charAt(0) || '?')}{(r.rep_apel?.charAt(0) || '')}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{r.rep_nomb} {r.rep_apel}</div>
                            <div className="text-xs text-slate-400 font-mono">ID: {r.rep_codi || r.usu_codi}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs">{r.usu_crro || '-'}</span>
                        </div>
                        {r.rep_telf && (
                          <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs">{r.rep_telf}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-sm text-slate-600 dark:text-slate-300">
                          {r.tm_ninos?.nin_nomb ? `${r.tm_ninos.nin_nomb} ${r.tm_ninos.nin_apel || ''}` : 'Sin asignar'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge active={r.usu_estd} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleResetPass(r.usu_codi, r.usu_crro)} disabled={resettingId === r.usu_codi} className="px-2.5 py-1.5 text-purple-600/70 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50">
                            Reset Pass
                          </button>
                          <button onClick={() => handleToggleEstado(r.usu_codi, r.usu_estd)} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${r.usu_estd ? 'text-rose-600/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20' : 'text-emerald-600/70 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}>
                            {r.usu_estd ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  )
}
