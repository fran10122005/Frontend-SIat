import { FileText } from 'lucide-react'

export default function SoapNoteModal({
  showSoapModal,
  setShowSoapModal,
  activeChild,
  soapData,
  setSoapData,
  handleSoapSubmit
}) {
  if (!showSoapModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            Registro Clínico (Formato SOAP)
          </h3>
          <button onClick={() => setShowSoapModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        {activeChild && (
          <div className="px-6 py-3 bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900/30 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              {activeChild.nom_nino[0]}{activeChild.ape_nino[0]}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase">Paciente Actual</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{activeChild.nom_nino} {activeChild.ape_nino}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSoapSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">S - Subjetivo (Reporte de padres/observación libre)</label>
            <textarea 
              required 
              value={soapData.s} onChange={e => setSoapData({...soapData, s: e.target.value})}
              className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none transition-all"
              placeholder="El padre indica que el niño tuvo problemas para dormir anoche..."
            ></textarea>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">O - Objetivo (Métricas y observaciones medibles)</label>
            <textarea 
              required 
              value={soapData.o} onChange={e => setSoapData({...soapData, o: e.target.value})}
              className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none transition-all"
              placeholder="Se completaron 3 de 4 ensayos de contacto visual. Se registraron 2 estereotipias motoras de 1 min de duración."
            ></textarea>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">A - Análisis (Evaluación clínica)</label>
            <textarea 
              required 
              value={soapData.a} onChange={e => setSoapData({...soapData, a: e.target.value})}
              className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none transition-all"
              placeholder="Adecuada tolerancia a estímulos táctiles hoy. Progreso notable en metas del PEI."
            ></textarea>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">P - Plan (Próximos pasos y rutinas asignadas)</label>
            <textarea 
              required 
              value={soapData.p} onChange={e => setSoapData({...soapData, p: e.target.value})}
              className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none transition-all"
              placeholder="Mantener plan actual. Asignar rutina visual de lavado de manos para casa."
            ></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => setShowSoapModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm flex items-center gap-2">
              Firmar y Guardar Nota
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
