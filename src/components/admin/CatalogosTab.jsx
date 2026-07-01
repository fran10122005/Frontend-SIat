export default function CatalogosTab({
  catalogos,
  editingInst,
  setEditingInst,
  loading,
  handleUpdateInstitucion
}) {
  const inst = editingInst || catalogos.instituciones?.[0]

  if (!inst) {
    return (
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 text-center text-slate-500">
        No hay datos de la institución.
      </div>
    )
  }

  const set = (field) => (e) => setEditingInst({ ...inst, [field]: e.target.value })

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Configuración de Mi Fundación</h2>
        </div>
        <form onSubmit={handleUpdateInstitucion} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">RIF / Código Fiscal</label>
              <input required type="text" value={inst.ins_codi || ''} onChange={set('ins_codi')} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nombre de la Fundación</label>
              <input required type="text" value={inst.ins_nomb || ''} onChange={set('ins_nomb')} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Dirección Física</label>
              <input required type="text" value={inst.ins_dire || ''} onChange={set('ins_dire')} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Teléfono Administrativo</label>
              <input required type="text" value={inst.ins_telf || ''} onChange={set('ins_telf')} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Contacto Principal</label>
            <input type="text" value={inst.ins_pers || ''} onChange={set('ins_pers')} className="w-full px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="flex justify-end pt-2">
            <button disabled={loading} type="submit" className="md:w-auto px-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
