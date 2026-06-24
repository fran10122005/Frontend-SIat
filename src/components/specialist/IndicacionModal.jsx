import { FilePlus } from 'lucide-react'

export default function IndicacionModal({ 
  showIndicacionModal, 
  setShowIndicacionModal, 
  indicacionText, 
  setIndicacionText, 
  handleIndicacionSubmit, 
  activeChild 
}) {
  if (!showIndicacionModal) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
        <div className="px-6 py-5 border-b border-slate-150 dark:border-slate-700 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/20">
          <h3 className="text-base font-bold text-slate-850 dark:text-white flex items-center gap-2">
            <FilePlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Nueva Indicación Médica
          </h3>
          <button onClick={() => setShowIndicacionModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <form onSubmit={handleIndicacionSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">Instrucciones o Recomendaciones</label>
            <textarea 
              value={indicacionText}
              onChange={(e) => setIndicacionText(e.target.value)}
              placeholder="Escriba aquí las indicaciones que verá el representante en su panel..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none text-slate-800 dark:text-slate-200"
              required
            />
            <p className="text-[10px] text-slate-500 mt-2">Esta nota será visible inmediatamente para el representante de {activeChild?.nin_nomb || 'su paciente'}.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => setShowIndicacionModal(false)} className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 font-semibold text-xs bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm">
              Guardar y Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
