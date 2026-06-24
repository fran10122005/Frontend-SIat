import { Maximize2 } from 'lucide-react'

export default function RegulationStatusCard({ status, liveStress, liveBpm, showTelemetry, setShowTelemetry }) {
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-450 dark:text-slate-400">Estado Regulatorio</span>
          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${status.color}`}>
            {status.badge}
          </span>
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2">
          {status.label}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
          {status.description}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-450 uppercase">Estrés en Vivo</span>
          <span className={`text-2xl font-black ${liveStress > 75 ? 'text-rose-500' : liveStress > 50 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {liveStress}%
          </span>
        </div>
        <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700"></div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-450 uppercase">Pulso (BPM)</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {liveBpm} <span className="text-xs font-medium text-slate-400">bpm</span>
          </span>
        </div>
        <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700"></div>
        <button 
          onClick={() => setShowTelemetry(!showTelemetry)} 
          className="ml-auto text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          {showTelemetry ? 'Ocultar Gráfica' : 'Ver Gráfica'}
        </button>
      </div>
    </div>
  )
}
