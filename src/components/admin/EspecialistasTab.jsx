import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useGlobalContext } from '../../context/GlobalState';
import api from '../../api/axios';
import StatusBadge from '../StatusBadge';

export default function EspecialistasTab({
  especialistas,
  catalogos,
  newEsp,
  setNewEsp,
  editingEsp,
  setEditingEsp,
  loading,
  handleCreateEspecialista,
  handleUpdateEsp,
  handleToggleActivo,
  exportEspecialistasToPDF,
  exportEspecialistasToExcel,
  newEspCat,
  setNewEspCat,
  editingEspCat,
  setEditingEspCat,
  handleCreateEspecialidad,
  handleUpdateEspecialidad,
  handleToggleEspecialidad
}) {
  const { userRole, setAdminActiveTab } = useGlobalContext();
  const [subView, setSubView] = useState('especialistas');
  const [searchEsp, setSearchEsp] = useState('')
  const [filterEspecialidad, setFilterEspecialidad] = useState('TODAS')
  const [filterEstado, setFilterEstado] = useState('TODOS')
  const [filterGenero, setFilterGenero] = useState('TODOS')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [searchEspCat, setSearchEspCat] = useState('')
  const [filterEspCatEstado, setFilterEspCatEstado] = useState('TODOS')

  const filteredEspecialistas = useMemo(() => {
    return especialistas.filter(esp => {
      const nombre = `${esp.esp_nomb} ${esp.esp_apel} ${esp.tm_usuar?.usu_crro || ''}`.toLowerCase()
      const q = searchEsp.toLowerCase()
      if (searchEsp && !nombre.includes(q)) return false
      if (filterEspecialidad !== 'TODAS' && esp.tm_especi?.esc_codi !== filterEspecialidad) return false
      if (filterEstado === 'ACTIVO' && !esp.tm_usuar?.usu_estd) return false
      if (filterEstado === 'INACTIVO' && esp.tm_usuar?.usu_estd) return false
      if (filterGenero !== 'TODOS' && esp.esp_gner !== filterGenero) return false
      if (dateFrom && esp.tm_usuar?.usu_crea && new Date(esp.tm_usuar.usu_crea) < new Date(dateFrom)) return false
      if (dateTo && esp.tm_usuar?.usu_crea) {
        const end = new Date(dateTo); end.setHours(23, 59, 59, 999)
        if (new Date(esp.tm_usuar.usu_crea) > end) return false
      }
      return true
    })
  }, [especialistas, searchEsp, filterEspecialidad, filterEstado, filterGenero, dateFrom, dateTo])

  const filteredEspecialidades = useMemo(() => {
    return catalogos.especialidades.filter(esc => {
      const q = searchEspCat.toLowerCase()
      if (searchEspCat && !esc.esc_nomb.toLowerCase().includes(q) && !esc.esc_codi.toLowerCase().includes(q)) return false
      if (filterEspCatEstado === 'ACTIVA' && esc.esc_estd === false) return false
      if (filterEspCatEstado === 'INACTIVA' && esc.esc_estd !== false) return false
      return true
    })
  }, [catalogos.especialidades, searchEspCat, filterEspCatEstado])

  const hasEspFilters = searchEsp || filterEspecialidad !== 'TODAS' || filterEstado !== 'TODOS' || filterGenero !== 'TODOS' || dateFrom || dateTo
  const hasEspCatFilters = searchEspCat || filterEspCatEstado !== 'TODOS'

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Sub-navegación */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
        <button onClick={() => setSubView('especialistas')} className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${subView === 'especialistas' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          Especialistas
        </button>
        <button onClick={() => setSubView('especialidades')} className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${subView === 'especialidades' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
          Especialidades
        </button>
      </div>

      {subView === 'especialistas' && (
        <>
          {/* Formulario Alta */}
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Acreditación de Nuevo Especialista</h2>
            <form onSubmit={handleCreateEspecialista} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Cédula / Documento de Identidad (ID)</label>
                  <input required type="text" value={newEsp.esp_codi} onChange={e => setNewEsp({...newEsp, esp_codi: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="Ej. 12345678"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Correo Electrónico Corporativo</label>
                  <input required type="email" value={newEsp.usu_crro} onChange={e => setNewEsp({...newEsp, usu_crro: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="dr@clinica.com"/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nombres</label>
                  <input required type="text" value={newEsp.esp_nomb} onChange={e => setNewEsp({...newEsp, esp_nomb: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="Ej. Roberto"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Apellidos</label>
                  <input required type="text" value={newEsp.esp_apel} onChange={e => setNewEsp({...newEsp, esp_apel: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="Ej. Sánchez"/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Teléfono de Contacto</label>
                  <input type="text" value={newEsp.esp_telf} onChange={e => setNewEsp({...newEsp, esp_telf: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="+58 412 0000000"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Licencia Médica / CM</label>
                  <input type="text" value={newEsp.esp_licencia} onChange={e => setNewEsp({...newEsp, esp_licencia: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="Ej. CM-90800"/>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Especialidad</label>
                  <select required value={newEsp.esc_codi} onChange={e => setNewEsp({...newEsp, esc_codi: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer">
                    <option value="" disabled>Seleccione especialidad...</option>
                    {catalogos.especialidades.map(es => (
                      <option key={es.esc_codi} value={es.esc_codi}>{es.esc_nomb}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Institución de Adscripción</label>
                  <select disabled={userRole === 'ADMIN_INSTITUCION'} required value={newEsp.ins_codi} onChange={e => setNewEsp({...newEsp, ins_codi: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed">
                    <option value="" disabled>Seleccione institución...</option>
                    {catalogos.instituciones.map(ins => (
                      <option key={ins.ins_codi} value={ins.ins_codi}>{ins.ins_nomb}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Sexo</label>
                  <select required value={newEsp.esp_gner} onChange={e => setNewEsp({...newEsp, esp_gner: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors cursor-pointer">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button disabled={loading} type="submit" className="md:w-auto px-8 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  Registrar Especialista
                </button>
              </div>
            </form>
          </div>

          {/* Directorio de Especialistas */}
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Nómina Médica / Especialistas</h2>
              <div className="flex gap-2">
                <button onClick={exportEspecialistasToPDF} className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg text-xs font-semibold transition-colors">
                  PDF
                </button>
                <button onClick={exportEspecialistasToExcel} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-semibold transition-colors">
                  Excel
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar por nombre o correo..." value={searchEsp} onChange={e => setSearchEsp(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={filterEspecialidad} onChange={e => setFilterEspecialidad(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="TODAS">Todas las especialidades</option>
                {catalogos.especialidades.map(es => (
                  <option key={es.esc_codi} value={es.esc_codi}>{es.esc_nomb}</option>
                ))}
              </select>
              <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
              </select>
              <select value={filterGenero} onChange={e => setFilterGenero(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="TODOS">Todos los géneros</option>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" title="Fecha desde" />
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" title="Fecha hasta" />
              {hasEspFilters && (
                <button onClick={() => { setSearchEsp(''); setFilterEspecialidad('TODAS'); setFilterEstado('TODOS'); setFilterGenero('TODOS'); setDateFrom(''); setDateTo('') }} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" /> Limpiar
                </button>
              )}
            </div>
            
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold uppercase">Profesional Clínico</th>
                    <th className="py-3 px-4 font-semibold uppercase">Información</th>
                    <th className="py-3 px-4 font-semibold uppercase">Estado</th>
                    <th className="py-3 px-4 font-semibold uppercase text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredEspecialistas.map(esp => (
                    <tr key={esp.esp_codi} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                      {editingEsp?.esp_codi === esp.esp_codi ? (
                        <td colSpan="4" className="py-3 px-4">
                          <form onSubmit={handleUpdateEsp} className="flex gap-2 items-center w-full bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                            <input required type="text" value={editingEsp.esp_nomb} onChange={e => setEditingEsp({...editingEsp, esp_nomb: e.target.value})} className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 w-1/4 outline-none focus:border-blue-500" placeholder="Nombre" />
                            <input required type="text" value={editingEsp.esp_apel} onChange={e => setEditingEsp({...editingEsp, esp_apel: e.target.value})} className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 w-1/4 outline-none focus:border-blue-500" placeholder="Apellido" />
                            <input required type="email" value={editingEsp.usu_crro} onChange={e => setEditingEsp({...editingEsp, usu_crro: e.target.value})} className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 w-1/3 outline-none focus:border-blue-500" placeholder="Correo" />
                            <div className="flex gap-2 ml-auto">
                              <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm font-semibold transition-colors">Guardar</button>
                              <button type="button" onClick={() => setEditingEsp(null)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-semibold transition-colors">Cancelar</button>
                            </div>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold shrink-0 text-sm shadow-sm">
                                {esp.esp_nomb.charAt(0)}{esp.esp_apel.charAt(0)}
                              </div>
                              <div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">{esp.esp_gner === 'M' ? 'Dr.' : 'Dra.'} {esp.esp_nomb} {esp.esp_apel}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">{esp.tm_usuar?.usu_crro}</div>
                                <div className="text-xs font-mono text-slate-400 mt-0.5">ID: {esp.esp_codi}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-slate-700 dark:text-slate-300 font-medium">{esp.tm_especi?.esc_nomb}</div>
                            <div className="text-xs text-slate-500">{esp.tm_insti?.ins_nomb}</div>
                            {(esp.esp_licencia || esp.esp_telf) && (
                              <div className="text-xs text-slate-500 mt-1 flex gap-2">
                                {esp.esp_licencia && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono">Lic: {esp.esp_licencia}</span>}
                                {esp.esp_telf && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">Tel: {esp.esp_telf}</span>}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge active={esp.tm_usuar?.usu_estd} />
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingEsp({ esp_codi: esp.esp_codi, esp_nomb: esp.esp_nomb, esp_apel: esp.esp_apel, usu_crro: esp.tm_usuar?.usu_crro || '' })} className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-sm font-semibold transition-colors">Editar</button>
                              <button onClick={() => handleToggleActivo(esp.esp_codi, esp.tm_usuar?.usu_estd)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${esp.tm_usuar?.usu_estd ? 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}>
                                {esp.tm_usuar?.usu_estd ? 'Desactivar' : 'Activar'}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {subView === 'especialidades' && (
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Definición de Especialidad Médica</h2>
          <form onSubmit={handleCreateEspecialidad} className="space-y-5 mb-8 pb-8 border-b border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Denominación</label>
                <input required type="text" value={newEspCat.esc_nomb} onChange={e => setNewEspCat({...newEspCat, esc_nomb: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Psicología Infantil"/>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Competencias y Perfil Clínico</label>
              <textarea value={newEspCat.esc_desc} onChange={e => setNewEspCat({...newEspCat, esc_desc: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-24" placeholder="Evaluación diagnóstica y terapias conductuales especializadas en TEA..."/>
            </div>

            <div className="flex justify-end">
              <button disabled={loading} type="submit" className="md:w-auto px-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                Añadir al Catálogo Base
              </button>
            </div>
          </form>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Catálogo de Especialidades</h3>
              <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full">{filteredEspecialidades.length} de {catalogos.especialidades.length} registradas</span>
            </div>

            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Buscar especialidad..." value={searchEspCat} onChange={e => setSearchEspCat(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <select value={filterEspCatEstado} onChange={e => setFilterEspCatEstado(e.target.value)} className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVA">Activa</option>
                <option value="INACTIVA">Inactivo</option>
              </select>
              {hasEspCatFilters && (
                <button onClick={() => { setSearchEspCat(''); setFilterEspCatEstado('TODOS') }} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0">
                  <X className="w-3.5 h-3.5" /> Limpiar
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-semibold uppercase">Especialidad</th>
                    <th className="py-3 px-4 font-semibold uppercase">Descripción Técnica</th>
                    <th className="py-3 px-4 font-semibold uppercase">Estado</th>
                    <th className="py-3 px-4 font-semibold uppercase text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredEspecialidades.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-8 text-center text-slate-500 dark:text-slate-400">No se encontraron especialidades con los filtros aplicados.</td>
                    </tr>
                  ) : filteredEspecialidades.map(esc => (
                    <tr key={esc.esc_codi} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 group">
                      {editingEspCat?.esc_codi === esc.esc_codi ? (
                        <td colSpan="4" className="py-3 px-4">
                          <form onSubmit={handleUpdateEspecialidad} className="flex gap-3 w-full bg-slate-50 dark:bg-slate-900 p-2 rounded-lg">
                            <input required type="text" value={editingEspCat.esc_nomb} onChange={e => setEditingEspCat({...editingEspCat, esc_nomb: e.target.value})} className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 w-1/3" placeholder="Nombre" />
                            <input type="text" value={editingEspCat.esc_desc || ''} onChange={e => setEditingEspCat({...editingEspCat, esc_desc: e.target.value})} className="px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 w-1/2" placeholder="Descripción" />
                            <div className="flex gap-2 ml-auto">
                              <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-md text-sm font-semibold">Guardar</button>
                              <button type="button" onClick={() => setEditingEspCat(null)} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-sm font-semibold">Cancelar</button>
                            </div>
                          </form>
                        </td>
                      ) : (
                        <>
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{esc.esc_nomb}</div>
                            <div className="text-xs text-slate-500 font-mono mt-0.5">ID: {esc.esc_codi}</div>
                          </td>
                          <td className="py-4 px-4 text-slate-600 dark:text-slate-400">
                            {esc.esc_desc || '-'}
                          </td>
                          <td className="py-4 px-4">
                            <StatusBadge active={esc.esc_estd !== false} activeLabel="Activa" inactiveLabel="Inactivo" />
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingEspCat(esc)} className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-sm font-semibold transition-colors">Editar</button>
                              <button onClick={() => handleToggleEspecialidad(esc.esc_codi, esc.esc_estd)} className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${esc.esc_estd !== false ? 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'}`}>
                                {esc.esc_estd !== false ? 'Archivar' : 'Restaurar'}
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
