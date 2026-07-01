import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Sidebar from './Sidebar'
import { useGlobalContext } from '../context/GlobalState'
import { useDebounce } from '../hooks/useDebounce'
import { 
  Wind, VolumeX, Award, Sparkles, Star, Moon, Sun, Puzzle, Plus, Search, RotateCcw,
  MessageSquare, Grid, Activity, Play, Volume2, Trash2, CheckCircle2, AlertTriangle, ShieldCheck,
  ArrowRight, Hourglass, Timer, RefreshCw, PauseCircle, PlayCircle, Brain, Headphones, Eye,
  Bath, Heart, Home, GraduationCap, Users, Apple, Thermometer
} from 'lucide-react'
import Topbar from './Topbar'

const aacCategories = [
  { id: 'needs', title: 'Necesidades', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', items: [
    { label: 'Comer', emoji: '🍽️' },
    { label: 'Beber', emoji: '🥤' },
    { label: 'Baño', emoji: '🚽' },
    { label: 'Dormir', emoji: '🛏️' },
  ]},
  { id: 'emotions', title: 'Emociones', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400', items: [
    { label: 'Feliz', emoji: '😄' },
    { label: 'Triste', emoji: '😢' },
    { label: 'Enojado', emoji: '😠' },
    { label: 'Cansado', emoji: '🥱' },
    { label: 'Asustado', emoji: '😨' },
  ]},
  { id: 'actions', title: 'Acciones', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', items: [
    { label: 'Yo quiero', emoji: '👉' },
    { label: 'Ayuda', emoji: '🤝' },
    { label: 'Jugar', emoji: '🧸' },
    { label: 'No quiero', emoji: '🛑' },
    { label: 'Esperar', emoji: '⏳' },
  ]},
  { id: 'sensations', title: 'Sensaciones Físicas', color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400', items: [
    { label: 'Hambre', emoji: '🍎' },
    { label: 'Sed', emoji: '💧' },
    { label: 'Dolor', emoji: '🤕' },
    { label: 'Frío', emoji: '🥶' },
    { label: 'Calor', emoji: '🥵' },
    { label: 'Cosquilleo', emoji: '🫳' },
    { label: 'Necesito un descanso', emoji: '🛋️' },
  ]},
  { id: 'places', title: 'Lugares', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', items: [
    { label: 'Casa', emoji: '🏠' },
    { label: 'Escuela', emoji: '🏫' },
    { label: 'Parque', emoji: '🌳' },
    { label: 'Consultorio', emoji: '🏥' },
    { label: 'Tienda', emoji: '🏪' },
    { label: 'Terapia', emoji: '🧩' },
  ]},
  { id: 'people', title: 'Personas', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400', items: [
    { label: 'Mamá', emoji: '👩' },
    { label: 'Papá', emoji: '👨' },
    { label: 'Hermano', emoji: '🧑' },
    { label: 'Abuela', emoji: '👵' },
    { label: 'Doctor', emoji: '🥼' },
    { label: 'Maestro', emoji: '👨‍🏫' },
  ]},
]

const sensoryStrategies = [
  { id: 'deep_pressure', label: 'Presión Profunda', emoji: '🫂', desc: 'Abrazo firme o peso en los hombros que ayuda a calmar el sistema nervioso.' },
  { id: 'breathing', label: 'Respiración', emoji: '🌬️', desc: 'Inhalar 4s, sostener 4s, exhalar 4s. Repite 3 veces.' },
  { id: 'swing', label: 'Balanceo', emoji: '🪑', desc: 'Movimiento rítmico suave que organiza el sistema vestibular.' },
  { id: 'weighted', label: 'Manta con Peso', emoji: '🛏️', desc: 'Presión profunda distribuida que genera sensación de seguridad.' },
  { id: 'headphones', label: 'Audífonos', emoji: '🎧', desc: 'Reducción de ruido ambiental para evitar sobrecarga sensorial auditiva.' },
  { id: 'water', label: 'Agua Fría', emoji: '💧', desc: 'Beber o mojar las manos con agua fría para resetear el sistema.' },
  { id: 'jump', label: 'Saltar', emoji: '🦘', desc: '10 saltos para liberar energía y regular el sistema propioceptivo.' },
  { id: 'squeeze', label: 'Apretar', emoji: '🧸', desc: 'Pelota antiestrés o masilla — presión en manos que organiza.' },
  { id: 'massage', label: 'Masaje', emoji: '💆', desc: 'Presión firme en brazos, manos o espalda para relajar.' },
  { id: 'dim_lights', label: 'Luz Tenue', emoji: '🌙', desc: 'Reducir la luz ambiental para disminuir estímulos visuales.' },
  { id: 'rocking', label: 'Mecedora', emoji: '🪑', desc: 'Movimiento suave y repetitivo que calma y organiza.' },
  { id: 'chew', label: 'Masticar', emoji: '🫦', desc: 'Morder un mordedor o snack crujiente — entrada oral propioceptiva.' },
]

const defaultRewards = [
  { id: 1, title: '10 min de iPad', cost: 3, emoji: '📱', type: 'Neutral' },
  { id: 2, title: 'Juego Libre', cost: 5, emoji: '🧩', type: 'Neutral' },
  { id: 3, title: 'Ver película', cost: 10, emoji: '🎬', type: 'Neutral' },
]

const defaultFirstTasks = [
  { label: 'Cepillarse los dientes', emoji: '🪥' },
  { label: 'Vestirse', emoji: '👕' },
  { label: 'Guardar juguetes', emoji: '🧹' },
  { label: 'Comer la comida', emoji: '🥦' },
  { label: 'Tarea escolar', emoji: '📚' },
  { label: 'Bañarse', emoji: '🚿' },
  { label: 'Terapia de lenguaje', emoji: '🗣️' },
  { label: 'Ejercicio de respiración', emoji: '🌬️' },
]

const defaultThenRewards = [
  { label: 'iPad 10 min', emoji: '📱' },
  { label: 'Ver TV', emoji: '📺' },
  { label: 'Jugar afuera', emoji: '🌳' },
  { label: 'Galleta', emoji: '🍪' },
  { label: 'Pintar', emoji: '🎨' },
  { label: 'Pelota', emoji: '⚽' },
  { label: 'Canción favorita', emoji: '🎵' },
]

export default function Herramientas() {
  const { nomNino, userRole, showToast } = useGlobalContext()
  const [activeTool, setActiveTool] = useState('aac')

  // --- AAC State ---
  const [sentence, setSentence] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 200)
  const [customPictograms, setCustomPictograms] = useState(() => {
    const saved = localStorage.getItem('siat_custom_pictograms')
    return saved ? JSON.parse(saved) : []
  })
  const [recentPhrases, setRecentPhrases] = useState(() => {
    const saved = localStorage.getItem('siat_recent_phrases')
    return saved ? JSON.parse(saved) : []
  })

  const [newPicLabel, setNewPicLabel] = useState('')
  const [newPicEmoji, setNewPicEmoji] = useState('')
  const [newPicCat, setNewPicCat] = useState('needs')
  const [showAddPicForm, setShowAddPicForm] = useState(false)

  // --- First-Then State ---
  const [ftTask, setFtTask] = useState(defaultFirstTasks[0])
  const [ftReward, setFtReward] = useState(defaultThenRewards[0])
  const [ftCustomTask, setFtCustomTask] = useState('')
  const [ftCustomReward, setFtCustomReward] = useState('')
  const [ftShowCustom, setFtShowCustom] = useState(false)
  const [ftCompleted, setFtCompleted] = useState(false)
  const [ftShowConfetti, setFtShowConfetti] = useState(false)

  // --- Sensory Regulation State ---
  const [activeStrategy, setActiveStrategy] = useState(null)
  const [sensoryTimer, setSensoryTimer] = useState(null)

  // --- Visual Timer State ---
  const [timerMinutes, setTimerMinutes] = useState(1)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerPaused, setTimerPaused] = useState(false)
  const [totalSeconds, setTotalSeconds] = useState(60)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef(null)
  const alarmRef = useRef(null)

  // --- Economy State ---
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem('siat_balance')
    return saved ? parseInt(saved, 10) : 0
  })
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('siat_history')
    return saved ? JSON.parse(saved) : []
  })
  const [rewards, setRewards] = useState(() => {
    const saved = localStorage.getItem('siat_rewards')
    return saved ? JSON.parse(saved) : defaultRewards
  })
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('siat_tasks')
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Cepillarse los dientes', reward: 1, completed: false, emoji: '🪥' },
      { id: 2, title: 'Ordenar sus juguetes', reward: 2, completed: false, emoji: '🧸' },
      { id: 3, title: 'Terminar la tarea escolar', reward: 2, completed: false, emoji: '📚' },
      { id: 4, title: 'Seguir indicaciones a la primera', reward: 1, completed: false, emoji: '👂' },
      { id: 5, title: 'Comer toda su comida', reward: 1, completed: false, emoji: '🥦' }
    ]
  })

  const [newRewardTitle, setNewRewardTitle] = useState('')
  const [newRewardCost, setNewRewardCost] = useState('5')
  const [newRewardEmoji, setNewRewardEmoji] = useState('🎁')
  const [showAddRewardForm, setShowAddRewardForm] = useState(false)

  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskReward, setNewTaskReward] = useState('1')
  const [newTaskEmoji, setNewTaskEmoji] = useState('⭐')
  const [showAddTaskForm, setShowAddTaskForm] = useState(false)

  const [earningHistory, setEarningHistory] = useState(() => {
    const saved = localStorage.getItem('siat_earning_history')
    return saved ? JSON.parse(saved) : []
  })

  useEffect(() => {
    localStorage.setItem('siat_balance', balance)
  }, [balance])

  useEffect(() => {
    localStorage.setItem('siat_history', JSON.stringify(history))
  }, [history])

  useEffect(() => {
    localStorage.setItem('siat_rewards', JSON.stringify(rewards))
  }, [rewards])

  useEffect(() => {
    localStorage.setItem('siat_tasks', JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem('siat_custom_pictograms', JSON.stringify(customPictograms))
  }, [customPictograms])

  useEffect(() => {
    localStorage.setItem('siat_recent_phrases', JSON.stringify(recentPhrases))
  }, [recentPhrases])

  useEffect(() => {
    localStorage.setItem('siat_earning_history', JSON.stringify(earningHistory))
  }, [earningHistory])

  // --- Timer logic ---
  const startTimer = useCallback(() => {
    const total = timerMinutes * 60 + timerSeconds
    if (total <= 0) { showToast('⚠️ Pon un tiempo mayor a 0'); return }
    setTotalSeconds(total)
    setElapsedSeconds(0)
    setTimerRunning(true)
    setTimerPaused(false)
  }, [timerMinutes, timerSeconds, showToast])

  useEffect(() => {
    if (!timerRunning || timerPaused) return
    timerRef.current = setInterval(() => {
      setElapsedSeconds(prev => {
        const next = prev + 1
        if (next >= totalSeconds) {
          clearInterval(timerRef.current)
          setTimerRunning(false)
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = 800
            osc.type = 'sine'
            gain.gain.setValueAtTime(0.3, ctx.currentTime)
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
            osc.start(ctx.currentTime)
            osc.stop(ctx.currentTime + 0.5)
            setTimeout(() => {
              const osc2 = ctx.createOscillator()
              osc2.connect(gain)
              osc2.frequency.value = 1000
              osc2.type = 'sine'
              osc2.start(ctx.currentTime)
              osc2.stop(ctx.currentTime + 0.5)
            }, 600)
          } catch {}
          showToast('⏰ ¡Tiempo terminado!')
          return totalSeconds
        }
        return next
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [timerRunning, timerPaused, totalSeconds, showToast])

  const pauseTimer = () => setTimerPaused(prev => !prev)
  const resetTimer = () => {
    clearInterval(timerRef.current)
    setTimerRunning(false)
    setTimerPaused(false)
    setElapsedSeconds(0)
  }

  const remainingSeconds = totalSeconds - elapsedSeconds
  const timerProgress = totalSeconds > 0 ? (elapsedSeconds / totalSeconds) * 100 : 0
  const timerColor = timerProgress < 50 ? 'bg-green-500' : timerProgress < 80 ? 'bg-amber-500' : 'bg-rose-500'

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // --- AAC Handlers ---
  const addToSentence = (word) => {
    if (sentence.length < 6) setSentence(prev => [...prev, word])
  }

  const clearSentence = () => setSentence([])

  const speakSentence = () => {
    if (sentence.length === 0) return
    const textToSpeak = sentence.map(i => i.label).join('. ') + '.'
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = 'es-ES'
    utterance.rate = 0.85
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)

    setRecentPhrases(prev => {
      const key = sentence.map(i => i.label).join('|')
      const filtered = prev.filter(ph => ph.map(i => i.label).join('|') !== key)
      return [sentence, ...filtered].slice(0, 4)
    })
  }

  const playRecentPhrase = (phrase) => {
    setSentence(phrase)
    const textToSpeak = phrase.map(i => i.label).join('. ') + '.'
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = 'es-ES'
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
  }

  const handleAddPictogram = (e) => {
    e.preventDefault()
    if (!newPicLabel.trim() || !newPicEmoji.trim()) {
      showToast('⚠️ Completa todos los campos')
      return
    }
    setCustomPictograms(prev => [...prev, { label: newPicLabel.trim(), emoji: newPicEmoji.trim(), category: newPicCat }])
    setNewPicLabel(''); setNewPicEmoji(''); setShowAddPicForm(false)
    showToast('🎨 Pictograma añadido')
  }

  const handleDeleteCustomPictogram = (label) => {
    setCustomPictograms(prev => prev.filter(item => item.label !== label))
    showToast('🗑️ Pictograma eliminado')
  }

  // --- First-Then Handlers ---
  const handleFtComplete = () => {
    if (ftCompleted) return
    setFtCompleted(true)
    setFtShowConfetti(true)
    setBalance(prev => prev + 1)
    const today = new Date().toLocaleDateString('es-ES')
    setEarningHistory(prev => {
      const existing = [...prev]
      const idx = existing.findIndex(e => e.date === today)
      if (idx >= 0) existing[idx] = { ...existing[idx], count: existing[idx].count + 1 }
      else existing.push({ date: today, count: 1 })
      return existing
    })
    showToast('⭐ ¡Tarea completada! +1 estrella')
    setTimeout(() => setFtShowConfetti(false), 2000)
  }

  const handleFtReset = () => {
    setFtCompleted(false)
    setFtShowConfetti(false)
  }

  // --- Sensory Regulation Handlers ---
  const startSensoryStrategy = (strategy) => {
    setActiveStrategy(strategy)
    const utterance = new SpeechSynthesisUtterance(`Vamos a hacer: ${strategy.label}. ${strategy.desc}`)
    utterance.lang = 'es-ES'
    utterance.rate = 0.8
    window.speechSynthesis.speak(utterance)
    if (sensoryTimer) clearTimeout(sensoryTimer)
    setSensoryTimer(setTimeout(() => {
      setActiveStrategy(null)
      setSensoryTimer(null)
    }, 30000))
  }

  const stopSensoryStrategy = () => {
    if (sensoryTimer) clearTimeout(sensoryTimer)
    setActiveStrategy(null)
    setSensoryTimer(null)
  }

  // --- Economy Handlers ---
  const earnToken = () => {
    setBalance(prev => prev + 1)
    showToast('⭐ ¡Ficha ganada! Excelente esfuerzo.')
  }

  const redeemReward = (reward) => {
    if (balance >= reward.cost) {
      setBalance(prev => prev - reward.cost)
      const now = new Date()
      const timeStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      setHistory([{ title: reward.title, date: timeStr, emoji: reward.emoji }, ...history])
      showToast(`🎉 ¡Premio canjeado: ${reward.title}!`)
    } else {
      showToast("❌ No hay suficientes fichas aún.")
    }
  }

  const handleAddReward = (e) => {
    e.preventDefault()
    if (!newRewardTitle.trim()) { showToast('⚠️ Ingresa un nombre'); return }
    const costInt = parseInt(newRewardCost, 10)
    if (isNaN(costInt) || costInt <= 0) { showToast('⚠️ Costo debe ser positivo'); return }
    setRewards(prev => [...prev, { id: Date.now(), title: newRewardTitle.trim(), cost: costInt, emoji: newRewardEmoji.trim() || '🎁', type: 'Personalizado' }])
    setNewRewardTitle(''); setNewRewardCost('5'); setNewRewardEmoji('🎁'); setShowAddRewardForm(false)
    showToast('🎉 Recompensa añadida')
  }

  const handleDeleteReward = (id) => {
    setRewards(prev => prev.filter(r => r.id !== id))
    showToast('🗑️ Recompensa eliminada')
  }

  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) { showToast('⚠️ Ingresa el título'); return }
    const rewardInt = parseInt(newTaskReward, 10)
    if (isNaN(rewardInt) || rewardInt <= 0) { showToast('⚠️ Valor debe ser positivo'); return }
    setTasks(prev => [...prev, { id: Date.now(), title: newTaskTitle.trim(), reward: rewardInt, completed: false, emoji: newTaskEmoji.trim() || '⭐' }])
    setNewTaskTitle(''); setNewTaskReward('1'); setNewTaskEmoji('⭐'); setShowAddTaskForm(false)
    showToast('📋 Tarea añadida')
  }

  const handleDeleteTask = (id) => {
    const taskToDelete = tasks.find(t => t.id === id)
    if (taskToDelete?.completed) setBalance(prev => Math.max(0, prev - taskToDelete.reward))
    setTasks(prev => prev.filter(t => t.id !== id))
    showToast('🗑️ Tarea eliminada')
  }

  const handleToggleTask = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      const nextState = !t.completed
      if (nextState) {
        setBalance(b => b + t.reward)
        const today = new Date().toLocaleDateString('es-ES')
        setEarningHistory(prev => {
          const existing = [...prev]
          const idx = existing.findIndex(e => e.date === today)
          if (idx >= 0) existing[idx] = { ...existing[idx], count: existing[idx].count + t.reward }
          else existing.push({ date: today, count: t.reward })
          return existing
        })
        showToast(`⭐ +${t.reward} ${t.reward === 1 ? 'estrella' : 'estrellas'}`)
      } else {
        setBalance(b => Math.max(0, b - t.reward))
        showToast(`ℹ️ -${t.reward}`)
      }
      return { ...t, completed: nextState }
    }))
  }

  const handleResetTasks = () => {
    setTasks(prev => prev.map(t => ({ ...t, completed: false })))
    showToast('🔄 Tareas restablecidas')
  }

  const weekChart = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('es-ES')
      const found = earningHistory.find(e => e.date === key)
      const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' })
      days.push({ label: dayName, count: found?.count || 0, date: key })
    }
    const maxVal = Math.max(...days.map(d => d.count), 1)
    return { days, maxVal }
  }, [earningHistory])

  const tabs = [
    { id: 'aac', label: 'Comunicación (AAC)', icon: MessageSquare, color: 'bg-blue-600' },
    { id: 'firstthen', label: 'Primero-Después', icon: ArrowRight, color: 'bg-emerald-600' },
    { id: 'sensory', label: 'Regulación Sensorial', icon: Brain, color: 'bg-violet-600' },
    { id: 'timer', label: 'Temporizador', icon: Timer, color: 'bg-orange-600' },
    { id: 'economy', label: 'Economía de Fichas', icon: Award, color: 'bg-amber-500' },
  ]

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-4 md:p-6 flex flex-col gap-4 pb-8">

            {/* Header & Tabs */}
            <div className="flex flex-col gap-3">
              <div>
                <h1 className="text-lg md:text-xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 transition-colors">
                  <Puzzle className="w-5 h-5 text-brand-700 dark:text-blue-400" />
                  Herramientas de Apoyo
                </h1>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                  Paciente: {nomNino || 'Paciente'}
                </p>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 flex-nowrap -mx-1 px-1 scrollbar-none">
                {tabs.map(tab => {
                  const Icon = tab.icon
                  const isActive = activeTool === tab.id
                  return (
                    <button key={tab.id} onClick={() => setActiveTool(tab.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${isActive ? `${tab.color} text-white shadow-md` : 'bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'}`}>
                      <Icon className="w-3.5 h-3.5" /> {tab.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ===== AAC ===== */}
            {activeTool === 'aac' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
                <div className="bg-white/85 dark:bg-[#1E293B]/85 backdrop-blur-md rounded-2xl p-4 border border-blue-500/15 dark:border-blue-500/15 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1 min-h-[60px] bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex flex-wrap gap-2 items-center">
                      {sentence.length === 0 ? (
                        <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-brand-500" /> Toca los pictogramas para construir una frase
                        </span>
                      ) : (
                        sentence.map((item, idx) => (
                          <div key={idx} className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-2 animate-in zoom-in-95">
                            <span className="text-xl">{item.emoji}</span>
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{item.label}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={speakSentence} disabled={sentence.length === 0}
                        className="flex-1 sm:flex-none h-[60px] px-6 bg-brand-500 hover:bg-brand-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-md shadow-brand-500/15 transition-transform hover:-translate-y-0.5 active:translate-y-0 flex flex-col items-center justify-center gap-0.5">
                        <Volume2 className="w-5 h-5" /> Hablar
                      </button>
                      <button onClick={clearSentence} disabled={sentence.length === 0}
                        className="flex-1 sm:flex-none h-[60px] px-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-bold rounded-xl border border-rose-200 dark:border-rose-800 transition-colors flex flex-col items-center justify-center gap-0.5 disabled:opacity-50">
                        <Trash2 className="w-4 h-4" /> Borrar
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 items-center">
                  <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Buscar pictograma..." value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#1E293B] border border-slate-200 focus:border-brand-500 dark:border-slate-800 focus:ring-2 focus:ring-brand-500/15 rounded-xl outline-none text-slate-700 dark:text-slate-300 shadow-sm" />
                  </div>
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="px-2.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0">
                      Limpiar
                    </button>
                  )}
                  <button onClick={() => setShowAddPicForm(!showAddPicForm)}
                    className="px-3 py-2 bg-brand-500/10 text-brand-500 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-brand-500/20 dark:hover:bg-blue-900/50 border border-brand-500/20 dark:border-blue-800/50 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap">
                    <Plus className="w-3.5 h-3.5" /> Crear Pictograma
                  </button>
                  {recentPhrases.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Recientes:</span>
                      {recentPhrases.map((ph, idx) => (
                        <button key={idx} onClick={() => playRecentPhrase(ph)}
                          className="bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-all shadow-sm whitespace-nowrap hover:border-brand-500/30">
                          {ph.map(item => item.emoji).join('')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {showAddPicForm && (
                  <form onSubmit={handleAddPictogram} className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase">Crear Pictograma Personalizado</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input required type="text" placeholder="Nombre (ej. Abrazo)" value={newPicLabel} onChange={e => setNewPicLabel(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 rounded-lg outline-none text-slate-800 dark:text-white" />
                      <input required type="text" placeholder="Emoji (ej. 🫂)" value={newPicEmoji} onChange={e => setNewPicEmoji(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 focus:border-brand-500 rounded-lg outline-none text-slate-800 dark:text-white" />
                      <select value={newPicCat} onChange={e => setNewPicCat(e.target.value)}
                        className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 focus:border-brand-500 rounded-lg outline-none cursor-pointer text-slate-800 dark:text-white">
                        <option value="needs">Necesidades</option>
                        <option value="emotions">Emociones</option>
                        <option value="actions">Acciones</option>
                        <option value="sensations">Sensaciones Físicas</option>
                        <option value="places">Lugares</option>
                        <option value="people">Personas</option>
                      </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setShowAddPicForm(false)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold">Cancelar</button>
                      <button type="submit" className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-semibold">Guardar</button>
                    </div>
                  </form>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aacCategories.map(cat => {
                    const customItems = customPictograms.filter(item => item.category === cat.id)
                    const allItems = [...cat.items, ...customItems]
                    const filtered = allItems.filter(item => item.label.toLowerCase().includes(debouncedSearch.toLowerCase()))
                    if (filtered.length === 0 && debouncedSearch) return null
                    return (
                      <div key={cat.id} className="bg-white dark:bg-[#1E293B]/95 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 inline-flex px-2 py-0.5 rounded w-fit ${cat.color}`}>{cat.title}</h3>
                        <div className="grid grid-cols-2 gap-2 flex-1">
                          {filtered.map((item, i) => {
                            const isCustom = customPictograms.some(cp => cp.label === item.label)
                            return (
                              <div key={i} className="relative group/item">
                                <button onClick={() => addToSentence(item)}
                                  className="w-full h-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-brand-500/40 dark:hover:border-blue-500/40 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0">
                                  <span className="text-3xl">{item.emoji}</span>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                                </button>
                                {isCustom && (
                                  <button onClick={() => handleDeleteCustomPictogram(item.label)}
                                    className="absolute top-1.5 right-1.5 w-5 h-5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center border border-rose-200 dark:border-rose-800 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    &times;
                                  </button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ===== FIRST-THEN ===== */}
            {activeTool === 'firstthen' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-12">
                    {/* Primero */}
                    <div className={`w-full md:flex-1 max-w-[260px] p-5 rounded-2xl border-2 transition-all ${ftCompleted ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'}`}>
                      <div className="text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primero</span>
                        <div className="text-5xl my-3">{ftCustomTask ? '📋' : ftTask.emoji}</div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{ftCustomTask || ftTask.label}</p>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center gap-2">
                      <ArrowRight className="w-6 h-6 md:w-8 md:h-8 text-emerald-500 rotate-90 md:rotate-0" />
                      {ftCompleted && <span className="text-2xl">✅</span>}
                    </div>

                    {/* Después */}
                    <div className={`w-full md:flex-1 max-w-[260px] p-5 rounded-2xl border-2 transition-all ${ftCompleted ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50'}`}>
                      <div className="text-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Después</span>
                        <div className="text-5xl my-3">{ftCustomReward ? '🎁' : ftReward.emoji}</div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{ftCustomReward || ftReward.label}</p>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  {ftCompleted ? (
                    <div className="mt-6 flex justify-center">
                      <button onClick={handleFtReset} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-colors flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" /> Nueva Tarea
                      </button>
                    </div>
                  ) : (
                    <div className="mt-6 flex flex-col items-center gap-3">
                      <div className="flex flex-wrap gap-3 justify-center">
                        <select value={ftCustomTask || ftTask.label} onChange={e => { const found = defaultFirstTasks.find(t => t.label === e.target.value); if (found) { setFtTask(found); setFtCustomTask('') } else { setFtCustomTask(e.target.value); setFtTask(null) }}}
                          className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[200px]">
                          {defaultFirstTasks.map(t => <option key={t.label} value={t.label}>{t.emoji} {t.label}</option>)}
                          <option value="__custom__">✏️ Personalizado...</option>
                        </select>
                        {ftTask === null && (
                          <input type="text" placeholder="Escribe la tarea..." value={ftCustomTask} onChange={e => setFtCustomTask(e.target.value)}
                            className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 w-[180px]" />
                        )}
                        <select value={ftCustomReward || ftReward.label} onChange={e => { const found = defaultThenRewards.find(r => r.label === e.target.value); if (found) { setFtReward(found); setFtCustomReward('') } else { setFtCustomReward(e.target.value); setFtReward(null) }}}
                          className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[200px]">
                          {defaultThenRewards.map(r => <option key={r.label} value={r.label}>{r.emoji} {r.label}</option>)}
                          <option value="__custom__">✏️ Personalizado...</option>
                        </select>
                        {ftReward === null && (
                          <input type="text" placeholder="Escribe la recompensa..." value={ftCustomReward} onChange={e => setFtCustomReward(e.target.value)}
                            className="px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 w-[180px]" />
                        )}
                      </div>
                      <button onClick={handleFtComplete}
                        className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-xl shadow-md shadow-emerald-500/20 transition-all hover:-translate-y-0.5 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> ¡Completado!
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-900/50">
                  <p className="text-xs text-amber-800 dark:text-amber-300 font-medium flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span><strong className="font-black">¿Cómo usar?</strong> Muestra al niño "Primero [tarea], luego [premio]". Esto reduce la ansiedad por transiciones y le da predictibilidad. Siempre cumple con el premio al terminar.</span>
                  </p>
                </div>
              </div>
            )}

            {/* ===== SENSORY REGULATION ===== */}
            {activeTool === 'sensory' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
                {activeStrategy && (
                  <div className="bg-violet-50 dark:bg-violet-900/20 rounded-2xl p-6 border border-violet-200 dark:border-violet-900/50 text-center animate-in fade-in zoom-in-95 duration-300">
                    <div className="text-6xl mb-3">{activeStrategy.emoji}</div>
                    <h3 className="text-lg font-black text-violet-800 dark:text-violet-300 mb-2">{activeStrategy.label}</h3>
                    <p className="text-sm text-violet-700 dark:text-violet-400 mb-4 max-w-md mx-auto">{activeStrategy.desc}</p>
                      <div className="w-full bg-violet-200 dark:bg-violet-800 rounded-full h-2 max-w-xs mx-auto mb-4 overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: '100%', animation: 'shrink 30s linear forwards' }}></div>
                      </div>
                    <button onClick={stopSensoryStrategy} className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-lg transition-colors">
                      Terminar
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {sensoryStrategies.map(strategy => (
                    <button key={strategy.id} onClick={() => startSensoryStrategy(strategy)}
                      className={`bg-white dark:bg-[#1E293B] border-2 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 text-center ${activeStrategy?.id === strategy.id ? 'border-violet-500 ring-2 ring-violet-500/30' : 'border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-700'}`}>
                      <span className="text-4xl">{strategy.emoji}</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{strategy.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ===== VISUAL TIMER ===== */}
            {activeTool === 'timer' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center gap-6">
                  {/* Circular Timer */}
                  <div className="relative w-48 h-48">
                    <svg className="w-48 h-48 -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8"
                        className="text-slate-100 dark:text-slate-800" />
                      <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8"
                        className={timerColor} strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 54}`}
                        strokeDashoffset={`${2 * Math.PI * 54 * (1 - timerProgress / 100)}`}
                        style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.5s ease' }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-black tabular-nums text-slate-800 dark:text-white">
                        {timerRunning || elapsedSeconds > 0 ? formatTime(remainingSeconds) : `${timerMinutes}:${timerSeconds.toString().padStart(2, '0')}`}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase mt-1">min:seg</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <button onClick={() => !timerRunning && setTimerMinutes(prev => Math.max(0, prev - 1))} disabled={timerRunning}
                        className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 border border-slate-200 dark:border-slate-700">-</button>
                      <span className="w-12 text-center text-sm font-bold text-slate-800 dark:text-white">{timerMinutes}:{timerSeconds.toString().padStart(2, '0')}</span>
                      <button onClick={() => !timerRunning && setTimerMinutes(prev => prev + 1)} disabled={timerRunning}
                        className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 border border-slate-200 dark:border-slate-700">+</button>
                    </div>
                    <div className="flex gap-2">
                      {!timerRunning ? (
                        <button onClick={startTimer} className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2">
                          <PlayCircle className="w-4 h-4" /> Iniciar
                        </button>
                      ) : (
                        <>
                          <button onClick={pauseTimer} className={`px-5 py-2.5 font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 ${timerPaused ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                            {timerPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                            {timerPaused ? 'Reanudar' : 'Pausa'}
                          </button>
                          <button onClick={resetTimer} className="px-5 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm rounded-xl transition-all flex items-center gap-2">
                            <RefreshCw className="w-4 h-4" /> Reiniciar
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full max-w-md bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div className={`h-full ${timerColor} rounded-full transition-all duration-500`}
                      style={{ width: `${timerProgress}%` }}></div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                    El temporizador cambia de color a medida que se acaba el tiempo. Útil para anticipar transiciones.
                  </p>
                </div>
              </div>
            )}

            {/* ===== TOKEN ECONOMY ===== */}
            {activeTool === 'economy' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-900/50">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                    <strong className="font-black">Protección Clínica Activa:</strong> El catálogo de recompensas ha sido configurado por el especialista para respetar la dieta y sensibilidad del paciente.
                  </p>
                </div>

                {/* Weekly Chart */}
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-500" /> Estrellas esta semana
                  </h3>
                  <div className="flex items-end gap-2 h-24">
                    {weekChart.days.map((day, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400">{day.count}</span>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-md relative" style={{ height: '60px' }}>
                          <div className="absolute bottom-0 w-full bg-amber-400 dark:bg-amber-500 rounded-t-md transition-all duration-500"
                            style={{ height: `${(day.count / weekChart.maxVal) * 100}%` }}></div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">{day.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Col 1: Balance */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center justify-center min-h-[180px] lg:min-h-[250px]">
                      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                        <Star className="w-8 h-8 text-amber-500 fill-amber-500 drop-shadow-md" />
                      </div>
                      <h2 className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{balance}</h2>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 mb-4">Estrellas Acumuladas</p>
                      <button onClick={earnToken} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm rounded-xl shadow-md transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4" /> Otorgar 1 Estrella
                      </button>
                    </div>

                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex-1">
                      <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-3">Historial de Canjes</h3>
                      {history.length === 0 ? (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500">No hay premios canjeados recientemente.</p>
                      ) : (
                        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                          {history.map((h, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                              <div className="flex items-center gap-1.5">
                                <span className="text-base">{h.emoji || '🎁'}</span>
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{h.title}</span>
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono">{h.date}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Tasks */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col min-h-[250px] lg:min-h-[400px]">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                          <CheckCircle2 className="w-4 h-4 text-indigo-500" /> Tareas Diarias
                        </h3>
                        <div className="flex gap-1.5">
                          <button onClick={handleResetTasks} className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-colors" title="Restablecer">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setShowAddTaskForm(!showAddTaskForm)} className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors" title="Añadir tarea">
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {showAddTaskForm && (
                        <form onSubmit={handleAddTask} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 mb-3 space-y-2.5 animate-in slide-in-from-top-2">
                          <input required type="text" placeholder="Título..." value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white" />
                          <div className="grid grid-cols-2 gap-2">
                            <input type="number" min="1" value={newTaskReward} onChange={e => setNewTaskReward(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white" placeholder="Estrellas" />
                            <input type="text" placeholder="Emoji" value={newTaskEmoji} onChange={e => setNewTaskEmoji(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white" />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button type="button" onClick={() => setShowAddTaskForm(false)} className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-bold">Cancelar</button>
                            <button type="submit" className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold">Añadir</button>
                          </div>
                        </form>
                      )}
                      <div className="space-y-2.5 overflow-y-auto max-h-[300px] flex-1 pr-1">
                        {tasks.map(t => (
                          <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl transition-all hover:border-slate-300 dark:hover:border-slate-700 group/task">
                            <div className="flex items-center gap-2.5">
                              <input type="checkbox" checked={t.completed} onChange={() => handleToggleTask(t.id)}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900 cursor-pointer" />
                              <span className="text-lg">{t.emoji}</span>
                              <span className={`text-[11px] font-bold transition-all ${t.completed ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-800 dark:text-slate-200'}`}>{t.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 whitespace-nowrap">+{t.reward} ⭐</span>
                              <button onClick={() => handleDeleteTask(t.id)} className="w-5 h-5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover/task:opacity-100 transition-opacity text-xs">&times;</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Col 3: Rewards */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col min-h-[250px] lg:min-h-[400px]">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                          <Award className="w-4 h-4 text-blue-500" /> Recompensas
                        </h3>
                        <button onClick={() => setShowAddRewardForm(!showAddRewardForm)} className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors" title="Añadir recompensa">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {showAddRewardForm && (
                        <form onSubmit={handleAddReward} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 mb-3 space-y-2.5 animate-in slide-in-from-top-2">
                          <input required type="text" placeholder="Recompensa..." value={newRewardTitle} onChange={e => setNewRewardTitle(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white" />
                          <div className="grid grid-cols-2 gap-2">
                            <input type="number" min="1" value={newRewardCost} onChange={e => setNewRewardCost(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white" placeholder="Costo" />
                            <input type="text" placeholder="Emoji" value={newRewardEmoji} onChange={e => setNewRewardEmoji(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white" />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button type="button" onClick={() => setShowAddRewardForm(false)} className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-bold">Cancelar</button>
                            <button type="submit" className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold">Añadir</button>
                          </div>
                        </form>
                      )}
                      <div className="space-y-2.5 overflow-y-auto max-h-[300px] flex-1 pr-1">
                        {rewards.map(r => (
                          <div key={r.id || r.title} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-blue-400 dark:hover:border-blue-600 transition-colors group/reward">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center text-lg border border-slate-100 dark:border-slate-700">{r.emoji || '🎁'}</div>
                              <div>
                                <h4 className="text-[11px] font-bold text-slate-900 dark:text-white leading-tight">{r.title}</h4>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{r.type || 'Especialista'}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-amber-500 flex items-center gap-0.5 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 text-[10px]">{r.cost} <Star className="w-3 h-3 fill-amber-500 text-amber-500" /></span>
                              <button onClick={() => redeemReward(r)} disabled={balance < r.cost}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white font-bold text-[9px] rounded-lg transition-all">Canjear</button>
                              {r.type === 'Personalizado' && (
                                <button onClick={() => handleDeleteReward(r.id)} className="w-5 h-5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover/reward:opacity-100 transition-opacity text-xs">&times;</button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}
