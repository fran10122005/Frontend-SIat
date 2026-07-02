import { useState, useEffect } from 'react'
import { Heart, Sparkles, Shield, Star, Sun, Brain, Smile } from 'lucide-react'
import logo from '../../Logo.png'

const mensajes = [
  'Preparando un espacio seguro para tu hijo...',
  'Cargando herramientas de apoyo terapéutico...',
  'Conectando con tu equipo de especialistas...',
  'Protegiendo la información clínica...',
  'Un momento, estamos afinando los sensores...',
  'SIAT está listo para acompañarte...',
  'Tus datos están siendo cifrados con cuidado...',
  'Cada niño merece el mejor acompañamiento...',
]

const iconos = [Heart, Sparkles, Shield, Star, Sun, Brain, Smile]

export default function SplashScreen() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % mensajes.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const IconoActual = iconos[index % iconos.length]

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#F4F7F9] to-blue-50 dark:from-slate-900 dark:to-slate-950 flex flex-col items-center justify-center transition-opacity duration-700">
      <div className="w-28 h-28 mb-8 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center animate-pulse">
        <img src={logo} alt="SIAT-TEA" className="w-20 h-20 object-contain" />
      </div>

      <div className="flex gap-1.5 mb-10">
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-3 h-3 bg-blue-600 dark:bg-blue-400 rounded-full animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>

      <div className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-sm">
        <IconoActual className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {mensajes[index]}
        </p>
      </div>
    </div>
  )
}