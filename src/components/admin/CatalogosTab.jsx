import { Pencil } from 'lucide-react';
import { useState } from 'react';

export default function CatalogosTab({
  catalogos,
  editingInst,
  setEditingInst,
  loading,
  handleUpdateInstitucion
}) {
  const [isEditing, setIsEditing] = useState(false);
  const inst = editingInst || catalogos.instituciones?.[0]

  if (!inst) {
    return (
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 text-center text-slate-500">
        No hay datos de la institución.
      </div>
    )
  }

  const set = (field) => (e) => setEditingInst({ ...inst, [field]: e.target.value })

  const inputClass = (editable) =>
    `w-full px-4 py-2.5 text-sm border rounded-lg outline-none transition-colors ${
      editable
        ? 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500'
        : 'bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 cursor-default'
    }`

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1E293B] p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Configuración de Mi Fundación</h2>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`p-2 rounded-lg transition-colors ${
              isEditing
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isEditing ? 'Deshabilitar edición' : 'Habilitar edición'}
          >
            <Pencil className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleUpdateInstitucion} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">RIF / Código Fiscal</label>
              <input required type="text" value={inst.ins_codi || ''} onChange={set('ins_codi')} readOnly={!isEditing} className={inputClass(isEditing)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Nombre de la Fundación</label>
              <input required type="text" value={inst.ins_nomb || ''} onChange={set('ins_nomb')} readOnly={!isEditing} className={inputClass(isEditing)} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Dirección Física</label>
              <input required type="text" value={inst.ins_dire || ''} onChange={set('ins_dire')} readOnly={!isEditing} className={inputClass(isEditing)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Teléfono Administrativo</label>
              <input required type="text" value={inst.ins_telf || ''} onChange={set('ins_telf')} readOnly={!isEditing} className={inputClass(isEditing)} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase tracking-wider">Contacto Principal</label>
            <input type="text" value={inst.ins_pers || ''} onChange={set('ins_pers')} readOnly={!isEditing} className={inputClass(isEditing)} />
          </div>

          {isEditing && (
            <div className="flex justify-end pt-2">
              <button disabled={loading} type="submit" className="md:w-auto px-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                Guardar Cambios
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
