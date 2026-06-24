import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useGlobalContext } from '../context/GlobalState'
import { 
  Wind, VolumeX, Award, Sparkles, Star, Moon, Sun, Puzzle, Plus, Search, RotateCcw,
  MessageSquare, Grid, Activity, Play, Volume2, Trash2, CheckCircle2, AlertTriangle, ShieldCheck
} from 'lucide-react'
import NotificationBell from './NotificationBell'
import Topbar from './Topbar'

// --- DUMMY DATA FOR AAC ---
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
  ]},
  { id: 'actions', title: 'Acciones', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', items: [
    { label: 'Yo quiero', emoji: '👉' },
    { label: 'Ayuda', emoji: '🤝' },
    { label: 'Jugar', emoji: '🧸' },
    { label: 'No quiero', emoji: '🛑' },
  ]}
]

// --- DUMMY DATA FOR REWARDS (Configured by Specialist) ---
const defaultRewards = [
  { id: 1, title: '10 min de iPad', cost: 3, emoji: '📱', type: 'Neutral' },
  { id: 2, title: 'Juego Libre', cost: 5, emoji: '🧩', type: 'Neutral' },
  { id: 3, title: 'Ver película', cost: 10, emoji: '🎬', type: 'Neutral' },
]

export default function Herramientas() {
  const { nomNino, userRole, userName, showToast } = useGlobalContext()
  const [isDark, setIsDark] = useState(false)
  
  // Navigation
  const [activeTool, setActiveTool] = useState('aac') // 'aac', 'economy'

  // --- AAC State ---
  const [sentence, setSentence] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [customPictograms, setCustomPictograms] = useState(() => {
    const saved = localStorage.getItem('siat_custom_pictograms')
    return saved ? JSON.parse(saved) : []
  })
  const [recentPhrases, setRecentPhrases] = useState(() => {
    const saved = localStorage.getItem('siat_recent_phrases')
    return saved ? JSON.parse(saved) : []
  })

  // Add custom pictogram form state
  const [newPicLabel, setNewPicLabel] = useState('')
  const [newPicEmoji, setNewPicEmoji] = useState('')
  const [newPicCat, setNewPicCat] = useState('needs')
  const [showAddPicForm, setShowAddPicForm] = useState(false)

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

  // Add Custom Reward Form State
  const [newRewardTitle, setNewRewardTitle] = useState('')
  const [newRewardCost, setNewRewardCost] = useState('5')
  const [newRewardEmoji, setNewRewardEmoji] = useState('🎁')
  const [showAddRewardForm, setShowAddRewardForm] = useState(false)

  // Add Custom Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskReward, setNewTaskReward] = useState('1')
  const [newTaskEmoji, setNewTaskEmoji] = useState('⭐')
  const [showAddTaskForm, setShowAddTaskForm] = useState(false)

  // --- Sync to LocalStorage via effects ---
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

  // --- AAC Handlers ---
  const addToSentence = (word) => {
    if (sentence.length < 5) setSentence([...sentence, word])
  }
  
  const clearSentence = () => setSentence([])

  const speakSentence = () => {
    if (sentence.length === 0) return
    const textToSpeak = sentence.map(i => i.label).join(' ')
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = 'es-ES'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)

    // Save to recent phrases (avoid exact duplicate in history)
    setRecentPhrases(prev => {
      const filtered = prev.filter(ph => {
        if (ph.length !== sentence.length) return true
        return ph.some((item, idx) => item.label !== sentence[idx].label)
      })
      return [sentence, ...filtered].slice(0, 4)
    })
  }

  const playRecentPhrase = (phrase) => {
    setSentence(phrase)
    const textToSpeak = phrase.map(i => i.label).join(' ')
    const utterance = new SpeechSynthesisUtterance(textToSpeak)
    utterance.lang = 'es-ES'
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  const handleAddPictogram = (e) => {
    e.preventDefault()
    if (!newPicLabel.trim() || !newPicEmoji.trim()) {
      showToast('⚠️ Por favor completa todos los campos del pictograma')
      return
    }
    const newPic = {
      label: newPicLabel.trim(),
      emoji: newPicEmoji.trim(),
      category: newPicCat
    }
    setCustomPictograms(prev => [...prev, newPic])
    setNewPicLabel('')
    setNewPicEmoji('')
    setShowAddPicForm(false)
    showToast('🎨 ¡Pictograma personalizado añadido!')
  }

  const handleDeleteCustomPictogram = (label) => {
    setCustomPictograms(prev => prev.filter(item => item.label !== label))
    showToast('🗑️ Pictograma eliminado')
  }

  // --- Economy Handlers ---
  const earnToken = () => {
    setBalance(prev => prev + 1)
    showToast("⭐ ¡Ficha ganada! Excelente esfuerzo.")
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
    if (!newRewardTitle.trim()) {
      showToast('⚠️ Por favor ingresa un nombre para la recompensa')
      return
    }
    const costInt = parseInt(newRewardCost, 10)
    if (isNaN(costInt) || costInt <= 0) {
      showToast('⚠️ El costo debe ser un número positivo')
      return
    }
    const newReward = {
      id: Date.now(),
      title: newRewardTitle.trim(),
      cost: costInt,
      emoji: newRewardEmoji.trim() || '🎁',
      type: 'Personalizado'
    }
    setRewards(prev => [...prev, newReward])
    setNewRewardTitle('')
    setNewRewardCost('5')
    setNewRewardEmoji('🎁')
    setShowAddRewardForm(false)
    showToast('🎉 ¡Recompensa personalizada añadida al catálogo!')
  }

  const handleDeleteReward = (id) => {
    setRewards(prev => prev.filter(r => r.id !== id))
    showToast('🗑️ Recompensa eliminada')
  }

  // --- Task Handlers ---
  const handleAddTask = (e) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) {
      showToast('⚠️ Por favor ingresa el título de la tarea')
      return
    }
    const rewardInt = parseInt(newTaskReward, 10)
    if (isNaN(rewardInt) || rewardInt <= 0) {
      showToast('⚠️ El valor de estrellas debe ser un número positivo')
      return
    }
    const newTask = {
      id: Date.now(),
      title: newTaskTitle.trim(),
      reward: rewardInt,
      completed: false,
      emoji: newTaskEmoji.trim() || '⭐'
    }
    setTasks(prev => [...prev, newTask])
    setNewTaskTitle('')
    setNewTaskReward('1')
    setNewTaskEmoji('⭐')
    setShowAddTaskForm(false)
    showToast('📋 ¡Nueva tarea conductual añadida!')
  }

  const handleDeleteTask = (id) => {
    const taskToDelete = tasks.find(t => t.id === id)
    if (taskToDelete && taskToDelete.completed) {
      setBalance(prev => Math.max(0, prev - taskToDelete.reward))
    }
    setTasks(prev => prev.filter(t => t.id !== id))
    showToast('🗑️ Tarea eliminada')
  }

  const handleToggleTask = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextState = !t.completed
        if (nextState) {
          setBalance(b => b + t.reward)
          showToast(`⭐ ¡Completado! +${t.reward} ${t.reward === 1 ? 'estrella' : 'estrellas'}`)
        } else {
          setBalance(b => Math.max(0, b - t.reward))
          showToast(`ℹ️ Tarea desmarcada. -${t.reward} ${t.reward === 1 ? 'estrella' : 'estrellas'}`)
        }
        return { ...t, completed: nextState }
      }
      return t
    }))
  }

  const handleResetTasks = () => {
    setTasks(prev => prev.map(t => ({ ...t, completed: false })))
    showToast('🔄 Tareas conductuales restablecidas para un nuevo día')
  }

  // Theme observer
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) setIsDark(true)
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
    setIsDark(!isDark)
  }

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] w-full mx-auto p-4 md:p-6 flex flex-col gap-4 pb-8">
            
            {/* Header & Menu Nav unified */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h1 className="text-lg md:text-xl font-bold text-[#034EA1] dark:text-blue-400 tracking-tight flex items-center gap-2 transition-colors">
                  <Puzzle className="w-5 h-5 text-[#034EA1] dark:text-blue-400" />
                  Herramientas de Apoyo
                </h1>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">
                  Paciente: {nomNino || 'Paciente'}
                </p>
              </div>
              <div className="flex bg-white dark:bg-[#1E293B] p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm w-fit gap-1">
                <button 
                  onClick={() => setActiveTool('aac')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${activeTool === 'aac' ? 'bg-[#034EA1] text-white shadow-md shadow-[#034EA1]/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Grid className="w-3.5 h-3.5" /> Tablero de Comunicación (AAC)
                </button>
                <button 
                  onClick={() => setActiveTool('economy')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${activeTool === 'economy' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                  <Award className="w-3.5 h-3.5" /> Economía de Fichas
                </button>
              </div>
            </div>

            {/* --- TOOL 1: AAC --- */}
            {activeTool === 'aac' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
                
                {/* Sentence Builder */}
                <div className="bg-white/85 dark:bg-[#1E293B]/85 backdrop-blur-md rounded-2xl p-4 border border-[#034EA1]/15 dark:border-blue-500/15 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 min-h-[60px] bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex flex-wrap gap-2 items-center">
                      {sentence.length === 0 ? (
                        <span className="text-slate-400 dark:text-slate-655 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-[#034EA1]" /> Toca los pictogramas para construir una frase
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
                    <button 
                      onClick={speakSentence}
                      disabled={sentence.length === 0}
                      className="h-[60px] px-6 bg-[#034EA1] hover:bg-[#023A7A] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded-xl shadow-md shadow-[#034EA1]/15 transition-transform hover:-translate-y-0.5 active:translate-y-0 flex flex-col items-center justify-center gap-0.5"
                    >
                      <Volume2 className="w-5 h-5" /> Hablar
                    </button>
                    <button 
                      onClick={clearSentence}
                      className="h-[60px] px-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900/40 font-bold rounded-xl border border-rose-200 dark:border-rose-800 transition-colors flex flex-col items-center justify-center gap-0.5"
                    >
                      <Trash2 className="w-4 h-4" /> Borrar
                    </button>
                  </div>
                </div>

                {/* Search, Action & Frases Frecuentes Row */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                  {/* Search and Add Pic */}
                  <div className="lg:col-span-5 flex gap-2 w-full">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-450" />
                      <input
                        type="text"
                        placeholder="Buscar pictograma..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#1E293B] border border-slate-200 focus:border-[#034EA1] dark:border-slate-800 focus:ring-2 focus:ring-[#034EA1]/15 rounded-xl outline-none text-slate-700 dark:text-slate-300 shadow-sm"
                      />
                    </div>
                    <button
                      onClick={() => setShowAddPicForm(!showAddPicForm)}
                      className="px-3 py-2 bg-[#034EA1]/10 text-[#034EA1] dark:bg-blue-900/30 dark:text-blue-400 hover:bg-[#034EA1]/20 dark:hover:bg-blue-900/50 border border-[#034EA1]/20 dark:border-blue-800/50 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors shadow-sm whitespace-nowrap"
                    >
                      <Plus className="w-3.5 h-3.5" /> Nuevo
                    </button>
                  </div>

                  {/* Frases Frecuentes */}
                  <div className="lg:col-span-7 flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                    {recentPhrases.length > 0 && (
                      <>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
                          <Activity className="w-3 h-3 text-[#034EA1]" /> Frecuentes:
                        </span>
                        <div className="flex gap-1.5 flex-nowrap">
                          {recentPhrases.map((ph, idx) => (
                            <button
                              key={idx}
                              onClick={() => playRecentPhrase(ph)}
                              className="bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1 transition-all shadow-sm whitespace-nowrap hover:border-[#034EA1]/30"
                            >
                              {ph.map(item => item.emoji).join('')}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Custom Pictogram Add Form (Colapsable) */}
                {showAddPicForm && (
                  <form onSubmit={handleAddPictogram} className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 animate-in slide-in-from-top-2 duration-200">
                    <h4 className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-wider">Crear Pictograma</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Nombre</label>
                        <input
                          required
                          type="text"
                          placeholder="Ej. Abrazo"
                          value={newPicLabel}
                          onChange={(e) => setNewPicLabel(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 focus:border-[#034EA1] focus:ring-2 focus:ring-[#034EA1]/15 rounded-lg outline-none text-slate-800 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Emoji</label>
                        <input
                          required
                          type="text"
                          placeholder="Ej. 🫂"
                          value={newPicEmoji}
                          onChange={(e) => setNewPicEmoji(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 focus:border-[#034EA1] focus:ring-2 focus:ring-[#034EA1]/15 rounded-lg outline-none text-slate-800 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Categoría</label>
                        <select
                          value={newPicCat}
                          onChange={(e) => setNewPicCat(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 focus:border-[#034EA1] rounded-lg outline-none cursor-pointer text-slate-800 dark:text-white"
                        >
                          <option value="needs">Necesidades</option>
                          <option value="emotions">Emociones</option>
                          <option value="actions">Acciones</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button type="button" onClick={() => setShowAddPicForm(false)} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-200">Cancelar</button>
                      <button type="submit" className="px-3 py-1.5 bg-[#034EA1] hover:bg-[#023A7A] text-white rounded-lg text-xs font-semibold">Guardar</button>
                    </div>
                  </form>
                )}

                {/* AAC Grids */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aacCategories.map(cat => {
                    const customItemsForCat = customPictograms.filter(item => item.category === cat.id)
                    const combinedItems = [...cat.items, ...customItemsForCat]
                    const filteredItems = combinedItems.filter(item => 
                      item.label.toLowerCase().includes(searchQuery.toLowerCase())
                    )

                    if (filteredItems.length === 0 && searchQuery) return null

                    return (
                      <div key={cat.id} className="bg-white dark:bg-[#1E293B]/95 rounded-2xl p-4 border border-slate-150 dark:border-slate-800 shadow-sm flex flex-col">
                        <h3 className={`text-[10px] font-black uppercase tracking-widest mb-3 inline-flex px-2 py-0.5 rounded w-fit ${cat.color}`}>{cat.title}</h3>
                        <div className="grid grid-cols-2 gap-2 flex-1">
                          {filteredItems.map((item, i) => {
                            const isCustom = customPictograms.some(cp => cp.label === item.label)
                            return (
                              <div key={i} className="relative group/item">
                                <button 
                                  onClick={() => addToSentence(item)}
                                  className="w-full h-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-[#034EA1]/40 dark:hover:border-blue-500/40 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_16px_rgba(3,78,161,0.06)] hover:-translate-y-0.5 active:translate-y-0 active:scale-97"
                                >
                                  <span className="text-3xl">{item.emoji}</span>
                                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                                </button>
                                {isCustom && (
                                  <button
                                    onClick={() => handleDeleteCustomPictogram(item.label)}
                                    className="absolute top-1.5 right-1.5 w-5 h-5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center border border-rose-200 dark:border-rose-800 opacity-0 group-hover/item:opacity-100 transition-opacity"
                                    title="Eliminar pictograma"
                                  >
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

            {/* --- TOOL 2: TOKEN ECONOMY --- */}
            {activeTool === 'economy' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-4">
                
                <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-900/50">
                  <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <p className="text-xs text-blue-800 dark:text-blue-300 font-medium">
                    <strong className="font-black">Protección Clínica Activa:</strong> El catálogo de recompensas ha sido configurado estrictamente por el Especialista para respetar la dieta y sensibilidad del paciente.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  
                  {/* Columna 1: Saldo y Historial */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center justify-center min-h-[250px]">
                      <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                        <Star className="w-8 h-8 text-amber-500 fill-amber-500 drop-shadow-md" />
                      </div>
                      <h2 className="text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{balance}</h2>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1 mb-4">Estrellas Acumuladas</p>
                      
                      <button 
                        onClick={earnToken}
                        className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-sm rounded-xl shadow-md transition-transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" /> Otorgar 1 Estrella
                      </button>
                    </div>

                    {/* Historial de canjes */}
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

                  {/* Columna 2: Tareas conductuales */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col min-h-[400px]">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                          <CheckCircle2 className="w-4.5 h-4.5 text-indigo-500" /> Tareas Diarias
                        </h3>
                        <div className="flex gap-1.5">
                          <button 
                            onClick={handleResetTasks}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg transition-colors"
                            title="Restablecer tareas para hoy"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => setShowAddTaskForm(!showAddTaskForm)}
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                            title="Añadir tarea"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {showAddTaskForm && (
                        <form onSubmit={handleAddTask} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 mb-3 space-y-2.5 animate-in slide-in-from-top-2">
                          <input
                            required
                            type="text"
                            placeholder="Título de la tarea..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              min="1"
                              value={newTaskReward}
                              onChange={(e) => setNewTaskReward(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white"
                              placeholder="Estrellas"
                            />
                            <input
                              type="text"
                              placeholder="Emoji (ej. 🦷)"
                              value={newTaskEmoji}
                              onChange={(e) => setNewTaskEmoji(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button type="button" onClick={() => setShowAddTaskForm(false)} className="px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-bold">Cancelar</button>
                            <button type="submit" className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold">Añadir</button>
                          </div>
                        </form>
                      )}

                      <div className="space-y-2.5 overflow-y-auto max-h-[300px] flex-1 pr-1">
                        {tasks.map(t => (
                          <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl transition-all hover:border-slate-300 dark:hover:border-slate-650 group/task">
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                checked={t.completed}
                                onChange={() => handleToggleTask(t.id)}
                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 bg-white dark:bg-slate-900 cursor-pointer"
                              />
                              <span className="text-lg">{t.emoji}</span>
                              <span className={`text-[11px] font-bold transition-all ${t.completed ? 'line-through text-slate-400 dark:text-slate-600' : 'text-slate-855 dark:text-slate-200'}`}>
                                {t.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-black text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 whitespace-nowrap">
                                +{t.reward} ⭐
                              </span>
                              <button
                                onClick={() => handleDeleteTask(t.id)}
                                className="w-5 h-5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover/task:opacity-100 transition-opacity text-xs"
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Columna 3: Catálogo de recompensas */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col min-h-[400px]">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wider">
                          <Award className="w-4.5 h-4.5 text-blue-500" /> Recompensas
                        </h3>
                        <button 
                          onClick={() => setShowAddRewardForm(!showAddRewardForm)}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                          title="Añadir recompensa"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {showAddRewardForm && (
                        <form onSubmit={handleAddReward} className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 mb-3 space-y-2.5 animate-in slide-in-from-top-2">
                          <input
                            required
                            type="text"
                            placeholder="Recompensa (ej. 10m iPad)..."
                            value={newRewardTitle}
                            onChange={(e) => setNewRewardTitle(e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              min="1"
                              value={newRewardCost}
                              onChange={(e) => setNewRewardCost(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white"
                              placeholder="Costo Fichas"
                            />
                            <input
                              type="text"
                              placeholder="Emoji (ej. 🧩)"
                              value={newRewardEmoji}
                              onChange={(e) => setNewRewardEmoji(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-800 dark:text-white"
                            />
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
                              <div className="w-8 h-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm flex items-center justify-center text-lg border border-slate-100 dark:border-slate-700">
                                {r.emoji || '🎁'}
                              </div>
                              <div>
                                <h4 className="text-[11px] font-bold text-slate-950 dark:text-white leading-tight">{r.title}</h4>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{r.type || 'Especialista'}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-amber-500 flex items-center gap-0.5 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 text-[10px]">
                                {r.cost} <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                              </span>
                              <button 
                                onClick={() => redeemReward(r)}
                                disabled={balance < r.cost}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-850 text-white font-bold text-[9px] rounded-lg transition-all"
                              >
                                Canjear
                              </button>
                              {r.type === 'Personalizado' && (
                                <button
                                  onClick={() => handleDeleteReward(r.id)}
                                  className="w-5 h-5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-full flex items-center justify-center opacity-0 group-hover/reward:opacity-100 transition-opacity text-xs"
                                >
                                  &times;
                                </button>
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
