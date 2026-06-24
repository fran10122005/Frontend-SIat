import { useGlobalContext } from '../../context/GlobalState';

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
  exportEspecialistasToExcel
}) {
  const { userRole } = useGlobalContext();
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
              <input required type="email" value={newEsp.email} onChange={e => setNewEsp({...newEsp, email: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="dr@clinica.com"/>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nombres</label>
              <input required type="text" value={newEsp.nombre} onChange={e => setNewEsp({...newEsp, nombre: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="Ej. Roberto"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Apellidos</label>
              <input required type="text" value={newEsp.apellido} onChange={e => setNewEsp({...newEsp, apellido: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors" placeholder="Ej. Sánchez"/>
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
              {especialistas.map(esp => (
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
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${esp.tm_usuar?.usu_estd ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                          {esp.tm_usuar?.usu_estd ? 'Activo' : 'Inactivo'}
                        </span>
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
    </div>
  );
}
