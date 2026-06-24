export default function CatalogosTab({
  catalogos,
  activeCatalogo,
  setActiveCatalogo,
  newEspCat,
  setNewEspCat,
  editingEspCat,
  setEditingEspCat,
  editingInst,
  setEditingInst,
  loading,
  handleUpdateInstitucion,
  handleCreateEspecialidad,
  handleUpdateEspecialidad,
  handleToggleEspecialidad
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700">
        <button 
          onClick={() => setActiveCatalogo('instituciones')}
          className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${activeCatalogo === 'instituciones' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Mi Fundación
        </button>
        <button 
          onClick={() => setActiveCatalogo('especialidades')}
          className={`pb-3 px-2 text-sm font-semibold transition-colors border-b-2 ${activeCatalogo === 'especialidades' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
        >
          Catálogo de Especialidades
        </button>
      </div>

      {activeCatalogo === 'instituciones' && catalogos.instituciones.length > 0 && (
        <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Configuración de Mi Fundación</h2>
          </div>
          <form onSubmit={handleUpdateInstitucion} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">RIF / Código Fiscal</label>
                <input disabled type="text" value={editingInst?.ins_codi || catalogos.instituciones[0].ins_codi} className="w-full px-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none cursor-not-allowed opacity-70" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nombre de la Fundación</label>
                <input required type="text" value={editingInst?.ins_nomb ?? catalogos.instituciones[0].ins_nomb} onChange={e => setEditingInst({...editingInst, ins_nomb: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Dirección Física</label>
                <input required type="text" value={editingInst?.ins_dire ?? catalogos.instituciones[0].ins_dire} onChange={e => setEditingInst({...editingInst, ins_dire: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Teléfono Administrativo</label>
                <input required type="text" value={editingInst?.ins_telf ?? catalogos.instituciones[0].ins_telf} onChange={e => setEditingInst({...editingInst, ins_telf: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Contacto Principal</label>
              <input type="text" value={editingInst?.ins_pers ?? catalogos.instituciones[0].ins_pers ?? ''} onChange={e => setEditingInst({...editingInst, ins_pers: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="flex justify-end pt-2">
              <button disabled={loading} type="submit" className="md:w-auto px-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {activeCatalogo === 'especialidades' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Definición de Especialidad Médica</h2>
            <form onSubmit={handleCreateEspecialidad} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Código Estándar</label>
                  <input required type="text" value={newEspCat.esc_codi} onChange={e => setNewEspCat({...newEspCat, esc_codi: e.target.value})} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. ESP-NEURO"/>
                </div>
                <div>
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
          </div>

          <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Catálogo de Especialidades</h2>
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
                  {catalogos.especialidades.map(esc => (
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
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${esc.esc_estd !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                              {esc.esc_estd !== false ? 'Activa' : 'Obsoleta'}
                            </span>
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
