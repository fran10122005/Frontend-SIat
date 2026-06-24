import { AlertCircle } from 'lucide-react'

export default function IncidentModal({
  showIncidentModal,
  setShowIncidentModal,
  incidentData,
  setIncidentData,
  handleIncidentSubmit
}) {
  if (!showIncidentModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-rose-200 dark:border-rose-900/50 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-rose-100 dark:border-rose-900/30 flex justify-between items-center bg-rose-50 dark:bg-rose-900/10">
          <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Registrar Incidente Conductual
          </h3>
          <button onClick={() => setShowIncidentModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleIncidentSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Tipo de Conducta</label>
              <select 
                value={incidentData.tipo} onChange={e => setIncidentData({...incidentData, tipo: e.target.value})}
                className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
              >
                <option>Berrinche / RABIETA</option>
                <option>Meltdown Sensorial</option>
                <option>Estereotipia Repetitiva</option>
                <option>Agresión hacia otros</option>
                <option>Auto-lesión</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Duración Aprox.</label>
              <select 
                value={incidentData.duracion} onChange={e => setIncidentData({...incidentData, duracion: e.target.value})}
                className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
              >
                <option>{'<'} 1 minuto</option>
                <option>1 a 5 minutos</option>
                <option>5 a 15 minutos</option>
                <option>{'>'} 15 minutos</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Detonante (A-B-C: Antecedente)</label>
            <select 
              value={incidentData.detonante} onChange={e => setIncidentData({...incidentData, detonante: e.target.value})}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-all cursor-pointer"
            >
              <option>Transición / Cambio de actividad</option>
              <option>Demanda clínica (Tarea difícil)</option>
              <option>Estímulo Sensorial: Ruido Fuerte</option>
              <option>Estímulo Sensorial: Luces / Visual</option>
              <option>Estímulo Sensorial: Táctil</option>
              <option>Retiro de objeto preferido</option>
              <option>Desconocido / Espontáneo</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Apoyo o Rutina Aplicada (Consecuencia)</label>
            <input 
              type="text"
              value={incidentData.rutina} onChange={e => setIncidentData({...incidentData, rutina: e.target.value})}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 transition-all"
              placeholder="Ej. Respiración de la tortuga, Presión profunda"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Notas de Observación</label>
            <textarea 
              value={incidentData.observacion} onChange={e => setIncidentData({...incidentData, observacion: e.target.value})}
              className="w-full p-3 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 h-20 resize-none transition-all"
              placeholder="Describe brevemente el comportamiento y cómo se logró la calma."
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={() => setShowIncidentModal(false)} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm flex items-center gap-2">
              Guardar Incidente
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
