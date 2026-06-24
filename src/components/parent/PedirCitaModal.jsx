import { X, CalendarDays, Clock, FileText, UserPlus } from 'lucide-react'

export default function PedirCitaModal({ showModal, setShowModal, citaData, setCitaData, handleSubmit, especialistas }) {
  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-indigo-500" />
            Solicitar Cita Médica
          </h3>
          <button 
            onClick={() => setShowModal(false)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-slate-400" /> Especialista
            </label>
            <select 
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
              value={citaData.esp_codi}
              onChange={e => setCitaData({...citaData, esp_codi: e.target.value})}
              required
            >
              <option value="" disabled>Seleccione un Especialista...</option>
              {especialistas && especialistas.map(esp => (
                <option key={esp.esp_codi} value={esp.esp_codi}>
                  {esp.nombre} {esp.licencia ? `(${esp.licencia})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> Fecha Deseada
              </label>
              <input 
                type="date"
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                value={citaData.fecha}
                onChange={e => setCitaData({...citaData, fecha: e.target.value})}
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Hora Deseada
              </label>
              <input 
                type="time"
                required
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                value={citaData.hora}
                onChange={e => setCitaData({...citaData, hora: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Tipo de Cita
            </label>
            <select 
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
              value={citaData.tipo}
              onChange={e => setCitaData({...citaData, tipo: e.target.value})}
            >
              <option value="Consulta Regular">Consulta Regular</option>
              <option value="Terapia de Lenguaje">Terapia de Lenguaje</option>
              <option value="Terapia Ocupacional">Terapia Ocupacional</option>
              <option value="Psicología">Psicología</option>
              <option value="Revisión de PEI">Revisión de PEI</option>
              <option value="Urgencia">Urgencia Conductual/Sensorial</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Motivo o Notas Adicionales
            </label>
            <textarea 
              rows="3"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none"
              placeholder="Explica brevemente por qué necesitas la cita..."
              value={citaData.notas}
              onChange={e => setCitaData({...citaData, notas: e.target.value})}
            />
          </div>
          
          {/* Footer */}
          <div className="pt-2 flex gap-3">
            <button 
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm shadow-indigo-600/20 transition-all flex justify-center items-center gap-2"
            >
              Solicitar Cita
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
