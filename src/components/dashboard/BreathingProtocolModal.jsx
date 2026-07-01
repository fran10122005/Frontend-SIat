import { useState, useEffect } from 'react'

export default function BreathingProtocolModal({ showBreathing, setShowBreathing }) {
  const [breathActive, setBreathActive] = useState(true)
  const [breathCycle, setBreathCycle] = useState('Inhala')
  const [breathSeconds, setBreathSeconds] = useState(4)

  useEffect(() => {
    let interval = null
    if (showBreathing && breathActive) {
      interval = setInterval(() => {
        setBreathSeconds(prev => {
          if (prev <= 1) {
            setBreathCycle(curr => {
              if (curr === 'Inhala') return 'Retén'
              if (curr === 'Retén') return 'Exhala'
              return 'Inhala'
            })
            return 4
          }
          return prev - 1
        })
      }, 1000)
    } else {
      setBreathSeconds(4)
      setBreathCycle('Inhala')
    }
    return () => clearInterval(interval)
  }, [showBreathing, breathActive])

  if (!showBreathing) return null

  const handleClose = () => {
    setShowBreathing(false)
    setBreathActive(true) // reset para la proxima vez
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center relative overflow-hidden flex flex-col items-center">
        
        {/* Animación de fondo calmante */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div className={`w-72 h-72 bg-blue-500/20 rounded-full blur-3xl motion-safe:transition-transform motion-safe:duration-[4000ms] motion-safe:ease-in-out ${breathActive && breathCycle === 'Inhala' ? 'scale-150' : 'scale-50'}`}></div>
        </div>

        <h3 className="text-xl font-black text-white relative z-10">Respiración de la Tortuga</h3>
        <p className="text-xs text-slate-400 mb-8 max-w-xs relative z-10">Técnica de anclaje para regular el sistema nervioso parasimpático en crisis sensoriales.</p>

        <div className="relative z-10 flex flex-col items-center mb-8">
          <div className={`w-36 h-36 rounded-full border-4 flex items-center justify-center motion-safe:transition-all motion-safe:duration-[4000ms] motion-safe:ease-in-out ${
            breathCycle === 'Inhala' ? 'scale-110 border-emerald-400 bg-emerald-400/25' :
            breathCycle === 'Retén' ? 'scale-110 border-amber-400 bg-amber-400/25' :
            'scale-90 border-blue-400 bg-blue-400/25'
          }`}>
            <span className="text-4xl font-black text-white tabular-nums drop-shadow-md">{breathSeconds}</span>
          </div>
          <h4 className="text-2xl font-black text-white mt-6 drop-shadow-sm uppercase tracking-widest h-8">{breathCycle}</h4>
        </div>

        <div className="flex gap-3 w-full relative z-10 mt-4">
          <button 
            onClick={() => setBreathActive(!breathActive)}
            className={`flex-1 py-3.5 font-bold text-sm rounded-xl transition-all shadow-md ${
              breathActive 
                ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {breathActive ? 'Pausar Ciclo' : 'Reanudar'}
          </button>
          <button 
            onClick={handleClose}
            className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl transition-all"
          >
            Cerrar Protocolo
          </button>
        </div>
      </div>
    </div>
  )
}
