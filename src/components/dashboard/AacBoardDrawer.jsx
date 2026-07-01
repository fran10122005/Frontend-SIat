import { useState } from 'react'
import { Volume2, Trash2 } from 'lucide-react'
import { aacQuickWords } from '../../utils/dashboardMocks'

export default function AacBoardDrawer({ showAac, setShowAac }) {
  const [sentence, setSentence] = useState([])

  if (!showAac) return null

  const speakSentence = () => {
    if (sentence.length === 0) return
    const textToSpeak = sentence.map(i => i.label).join(' ')
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = 'es-ES'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  const handleClose = () => {
    setShowAac(false)
    setSentence([])
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl flex flex-col gap-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Comunicación Pictográfica AAC Rápida</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">Toca pictogramas para verbalizar necesidades del niño.</p>
        </div>

        {/* Sentence Builder */}
        <div className="min-h-[70px] bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 flex flex-wrap gap-2 items-center">
          {sentence.length === 0 ? (
            <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Tablero Vacío</span>
          ) : (
            sentence.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 text-xs animate-in zoom-in-95">
                <span>{item.emoji}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{item.label}</span>
              </div>
            ))
          )}
        </div>

        {/* Buttons control */}
        <div className="flex gap-2">
          <button 
            onClick={speakSentence} 
            disabled={sentence.length === 0} 
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <Volume2 className="w-4 h-4" /> Hablar Frase
          </button>
          <button 
            onClick={() => setSentence([])} 
            className="py-3 px-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 hover:bg-rose-100 rounded-xl text-xs font-bold"
          >
            <Trash2 className="w-4 h-4" /> Limpiar
          </button>
        </div>

        {/* Grid of Pictograms */}
        <div className="grid grid-cols-3 gap-3">
          {aacQuickWords.map((word, i) => (
            <button 
              key={i} 
              onClick={() => {
                if (sentence.length < 5) setSentence([...sentence, word])
              }}
              className="bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <span className="text-3xl">{word.emoji}</span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{word.label}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-end border-t border-slate-100 dark:border-slate-800/60 pt-4">
          <button 
            onClick={handleClose} 
            className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all"
          >
            Cerrar Tablero
          </button>
        </div>
      </div>
    </div>
  )
}
