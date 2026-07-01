import { Maximize2, Heart } from 'lucide-react'

export default function RegulationStatusCard({ status, liveStress, liveBpm, showTelemetry, setShowTelemetry }) {
  // Dynamically calculate heartbeat duration based on live BPM (e.g. 60bpm = 1s per beat, 120bpm = 0.5s)
  const pulseDuration = liveBpm ? `${60 / liveBpm}s` : '0.8s';

  return (
    <div className="relative bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800/60 flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-2xl">
      {/* Inline styles for custom animations */}
      <style>{`
        @keyframes customHeartbeat {
          0% { transform: scale(1); }
          25% { transform: scale(1.15); }
          35% { transform: scale(1.05); }
          45% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-heartbeat {
          animation: customHeartbeat var(--pulse-duration, 0.8s) infinite ease-in-out;
        }
      `}</style>

      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Estado Regulatorio</span>
          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border shadow-sm ${status.color}`}>
            {status.badge}
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-2">
              {status.label}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              {status.description}
            </p>
          </div>
          {/* Dynamic Heart Icon */}
          <div 
            className="flex items-center justify-center p-3 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 shadow-inner"
            style={{ '--pulse-duration': pulseDuration }}
          >
            <Heart className="w-6 h-6 fill-rose-500 animate-heartbeat" />
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 border-t border-slate-100 dark:border-slate-800/60 pt-4">
        <div className="flex flex-col relative group">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estrés en Vivo</span>
          <span className={`text-2xl font-black transition-all flex items-center gap-1.5 ${
            liveStress > 75 ? 'text-rose-500 drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 
            liveStress > 50 ? 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 
            'text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'
          }`}>
            {liveStress}%
          </span>
        </div>
        <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700"></div>
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pulso</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white flex items-baseline gap-1">
            {liveBpm} <span className="text-xs font-semibold text-slate-400">BPM</span>
          </span>
        </div>
        <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-700"></div>
        <button 
          onClick={() => setShowTelemetry(!showTelemetry)} 
          className="ml-auto text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1 bg-slate-50 dark:bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          {showTelemetry ? 'Ocultar Gráfica' : 'Ver Gráfica'}
        </button>
      </div>
    </div>
  )
}
