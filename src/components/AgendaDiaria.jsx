import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useGlobalContext } from '../context/GlobalState'
import { 
  Play, Square, Clock, Activity, FileText, 
  CheckCircle2, AlertTriangle, Plus, Star, MessageSquare,
  GripVertical, CheckSquare, Moon, Sun, Smile, ShieldCheck, Trash2,
  ListTodo, Award
} from 'lucide-react'
import Topbar from './Topbar'
import api from '../api/axios'

export default function AgendaDiaria() {
  const { nomNino, userRole, weeklyGoal, reportGoalProgress, showToast, selectedChildId, routines, createRoutine } = useGlobalContext()
  const [isDark, setIsDark] = useState(false)
  const [goalProgressReported, setGoalProgressReported] = useState(false)

  // 1. Visual Agenda State
  const [agenda, setAgenda] = useState([])


  // 3. Active Session Player States
  const [activeSession, setActiveSession] = useState(null)
  const [sessionTime, setSessionTime] = useState(0) // en segundos
  const [isFinishing, setIsFinishing] = useState(false)
  const [cooperation, setCooperation] = useState(0)
  const [notes, setNotes] = useState('')

  // 4. Advanced Routine Builder Drawer States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('general') // 'general', 'steps', 'media'
  const [formData, setFormData] = useState({ 
    title: '', 
    category: 'Higiene', 
    durationStr: '15 min', 
    difficulty: 'Baja',
    materials: '',
    steps: [{ id: Date.now(), text: '', time: '5 min' }],
    mediaType: 'none',
    mediaUrl: ''
  })

  // Timer Effect
  useEffect(() => {
    let interval = null
    if (activeSession && !isFinishing) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1)
      }, 1000)
    } else {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [activeSession, isFinishing])

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
    const s = (totalSeconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Visual Agenda Handlers
  const toggleAgendaTask = (id) => {
    setAgenda(prev => prev.map(t => {
      if (t.id === id) {
        const nextDone = !t.done
        if (nextDone) {
          showToast(`✨ Actividad "${t.task}" completada. ¡Buen progreso!`)
        }
        return { ...t, done: nextDone }
      }
      return t
    }))
  }

  const handleReportGoalProgress = () => {
    setGoalProgressReported(true)
    reportGoalProgress()
  }

  // Active Session Handlers
  const startSession = async (routine) => {
    try {
      const res = await api.post('/sesiones/iniciar', {
        nin_codi: selectedChildId || 'NIN_1',
        act_codi: routine.id,
        dis_codi: 'D001'
      })
      const sesion = res.data.data

      setActiveSession({
        ...routine,
        ses_codi: sesion.ses_codi
      })
      setSessionTime(0)
      setIsFinishing(false)
      setCooperation(0)
      setNotes('')
    } catch (err) {
      console.error('Error starting session on backend:', err)
      showToast('⚠️ No se pudo iniciar la sesión en el servidor.')
      
      setActiveSession({
        ...routine,
        ses_codi: 'S_FALLBACK_' + Date.now().toString().slice(-4)
      })
      setSessionTime(0)
      setIsFinishing(false)
      setCooperation(0)
      setNotes('')
    }
  }

  const endSession = () => {
    setIsFinishing(true)
  }

  const saveSession = async () => {
    try {
      const sesCodi = activeSession.ses_codi
      const parsedNota = `[Cooperación: ${cooperation}/5] ${notes}`
      await api.put(`/sesiones/${sesCodi}/cerrar`, {
        ses_nota: parsedNota
      })
      showToast(`✅ Sesión guardada en base de datos. Tiempo: ${formatTime(sessionTime)}. Cooperación: ${cooperation}/5.`)
    } catch (err) {
      console.error('Error closing session on backend:', err)
      showToast('⚠️ Error al registrar el cierre de la sesión en la base de datos.')
    }
    
    // Tildar la actividad automáticamente en la agenda si coincide el nombre
    if (activeSession.title.toLowerCase().includes('dientes') || activeSession.title.toLowerCase().includes('higiene')) {
      setAgenda(prev => prev.map(t => t.id === 1 ? { ...t, done: true } : t))
    } else if (activeSession.title.toLowerCase().includes('sensorial') || activeSession.title.toLowerCase().includes('integración')) {
      setAgenda(prev => prev.map(t => t.id === 3 ? { ...t, done: true } : t))
    } else if (activeSession.title.toLowerCase().includes('comer') || activeSession.title.toLowerCase().includes('alimentación')) {
      setAgenda(prev => prev.map(t => t.id === 2 ? { ...t, done: true } : t))
    }

    setActiveSession(null)
    setIsFinishing(false)
  }

  // Builder Drawer Handlers
  const handleAddStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { id: Date.now(), text: '', time: '5 min' }]
    })
  }

  const handleRemoveStep = (idToRemove) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter(s => s.id !== idToRemove)
    })
  }

  const handleStepChange = (id, field, value) => {
    setFormData({
      ...formData,
      steps: formData.steps.map(s => s.id === id ? { ...s, [field]: value } : s)
    })
  }

  const handleCreateRoutine = async (e) => {
    e.preventDefault()
    await createRoutine(formData)
    setIsModalOpen(false)
    setFormData({ 
      title: '', category: 'Higiene', durationStr: '15 min', difficulty: 'Baja', 
      materials: '', steps: [{ id: Date.now(), text: '', time: '5 min' }], mediaType: 'none', mediaUrl: '' 
    })
    setActiveTab('general')
  }

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true)
    }
  }, [])

  const completedTasksCount = agenda.filter(t => t.done).length
  const progressPercent = Math.round((completedTasksCount / agenda.length) * 100)

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-6 md:p-8 flex flex-col gap-6 pb-12">
            
            {/* Si no hay sesión activa, muestra el panel Día a Día completo */}
            {!activeSession && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                
                {/* Header del Módulo */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-[#003366] dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                      <CheckSquare className="w-6 h-6 text-[#003366] dark:text-blue-400" />
                      Día a Día (Agenda y Terapias)
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Gestiona el cronograma de {nomNino || 'el niño'} y lanza las guías clínicas en casa en un solo lugar.
                    </p>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(true)} 
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 text-sm transition-transform hover:scale-102 shrink-0"
                  >
                    <Plus className="w-5 h-5" /> Crear Nueva Terapia
                  </button>
                </div>

                {/* Grid principal de dos columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Columna Izquierda: Agenda y Foco Semanal (5/12) */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    
                    {/* Foco Clínico */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800/60">
                      <span className="text-[9px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">
                        Foco Clínico Semanal
                      </span>
                      <h4 className="text-sm font-bold text-slate-850 dark:text-white tracking-tight mt-2.5 leading-snug">
                        "{weeklyGoal}"
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-1 pb-4">
                        Asignado por: Dra. Elena Ramos
                      </p>
                      
                      <button
                        onClick={handleReportGoalProgress}
                        disabled={goalProgressReported}
                        className={`w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all border ${
                          goalProgressReported 
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/20' 
                            : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {goalProgressReported ? 'Progreso Reportado Hoy' : 'Reportar Avance de Hoy'}
                      </button>
                    </div>

                    {/* Agenda Checklist */}
                    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[350px]">
                      <div className="mb-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                            <ListTodo className="w-4 h-4 text-blue-500" />
                            Agenda Visual de Hoy
                          </h3>
                          <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full">
                            {progressPercent}% listo
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                          <div 
                            className="bg-blue-500 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 no-scrollbar max-h-[350px]">
                        {agenda.map((task) => (
                          <div 
                            key={task.id} 
                            onClick={() => toggleAgendaTask(task.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 hover:border-blue-400/50 hover:bg-blue-50/10 ${
                              task.done 
                                ? 'border-emerald-100 dark:border-emerald-900/20 bg-emerald-50/20 dark:bg-emerald-900/10' 
                                : 'border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg shrink-0 ${
                                task.done 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                {task.icon === 'wash' ? <Smile className="w-4 h-4" /> :
                                 task.icon === 'food' ? <Award className="w-4 h-4" /> :
                                 task.icon === 'puzzle' ? <Activity className="w-4 h-4" /> :
                                 task.icon === 'study' ? <FileText className="w-4 h-4" /> :
                                 task.icon === 'cleanup' ? <ShieldCheck className="w-4 h-4" /> :
                                 <Moon className="w-4 h-4" />}
                              </div>
                              <div className="flex flex-col">
                                <span className={`text-xs font-semibold tracking-wide transition-all ${
                                  task.done 
                                    ? 'line-through text-slate-400 dark:text-slate-500' 
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}>
                                  {task.task}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">{task.time}</span>
                              </div>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              task.done 
                                ? 'border-emerald-500 bg-emerald-500 text-white' 
                                : 'border-slate-300 dark:border-slate-700 bg-transparent'
                            }`}>
                              {task.done && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Columna Derecha: Catálogo de Terapias (7/12) */}
                  <div className="lg:col-span-7 bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[500px]">
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        Catálogo de Terapias y Rutinas
                      </h3>
                      <p className="text-xs text-slate-400 mt-1">
                        Inicia una sesión interactiva guiada para registrar la evolución en vivo.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto no-scrollbar max-h-[460px]">
                      {routines.map(routine => (
                        <div key={routine.id} className="group bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <span className="px-2 py-1 bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-[9px] font-black uppercase tracking-widest rounded border border-slate-200/60 dark:border-slate-750">
                                {routine.category}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3"/> {routine.durationStr}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold text-slate-850 dark:text-white mb-2 leading-tight">{routine.title}</h3>
                            <p className="text-xs text-slate-450 dark:text-slate-400 line-clamp-3 leading-relaxed font-medium">{routine.inst}</p>
                          </div>

                          <div className="mt-5">
                            <button 
                              onClick={() => startSession(routine)}
                              className="w-full py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 text-white font-bold rounded-xl text-xs shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-1.5"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" /> Iniciar Sesión en Vivo
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* Si hay sesión activa: Mostrar Live Monitor */}
            {activeSession && (
              <div className="animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto w-full mt-4">
                <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-blue-200 dark:border-blue-900/50 shadow-2xl shadow-blue-500/10 overflow-hidden relative min-h-[550px] flex flex-col">
                  
                  {/* Header Flotante */}
                  <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                        Guía de Terapia Activa
                      </span>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">{activeSession.title}</h2>
                    </div>
                    {!isFinishing && (
                      <button onClick={endSession} className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-2 transition-colors">
                        <Square className="w-3.5 h-3.5 fill-current" /> Detener
                      </button>
                    )}
                  </div>

                  {/* Cuerpo Principal del Monitor */}
                  <div className="flex-1 p-8 md:p-12 flex flex-col md:flex-row gap-10 items-center justify-center">
                    
                    {/* Reloj Grande */}
                    <div className="flex flex-col items-center justify-center relative shrink-0">
                      <div className="w-48 h-48 rounded-full border-[10px] border-slate-100 dark:border-slate-800 flex items-center justify-center relative shadow-inner">
                        <div className={`absolute inset-0 rounded-full border-[10px] border-transparent ${!isFinishing ? 'border-t-blue-500 animate-spin' : ''}`} style={{ animationDuration: '3s' }}></div>
                        <span className="text-5xl font-black text-slate-850 dark:text-slate-100 tracking-tighter tabular-nums font-mono">
                          {formatTime(sessionTime)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-400 mt-4 tracking-widest uppercase">Tiempo Registrado</p>
                    </div>

                    {/* Instrucciones Clínicas */}
                    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900/30 p-6 md:p-8 rounded-[1.5rem] border border-slate-150 dark:border-slate-800/80 shadow-inner">
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        Paso a paso Clínico
                      </h3>
                      <div className="prose dark:prose-invert prose-sm">
                        <p className="whitespace-pre-line text-slate-650 dark:text-slate-350 font-medium text-sm leading-relaxed">
                          {activeSession.inst}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Formulario de Cierre Flotante */}
                  {isFinishing && (
                    <div className="absolute inset-0 top-[77px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10 flex flex-col justify-start md:justify-center items-center p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-8">
                      <div className="max-w-md w-full flex flex-col items-center text-center my-auto pb-8">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-5" />
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Sesión Finalizada</h3>
                        <p className="text-sm text-slate-500 mb-6 font-medium">Tiempo total registrado: <span className="font-bold text-slate-800 dark:text-slate-200">{formatTime(sessionTime)}</span>. Por favor, evalúa el desempeño.</p>
                        
                        <div className="w-full space-y-6 text-left">
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 block text-center">Nivel de Cooperación del Paciente</label>
                            <div className="flex justify-center gap-2">
                              {[1,2,3,4,5].map(val => (
                                <button key={val} onClick={() => setCooperation(val)} className="focus:outline-none transition-transform hover:scale-125">
                                  <Star className={`w-8 h-8 ${val <= cooperation ? 'fill-amber-400 text-amber-400 drop-shadow-md' : 'text-slate-200 dark:text-slate-700 fill-transparent'}`} />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2 block flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5" /> Notas u Observaciones (Opcional)
                            </label>
                            <textarea 
                              rows="3" 
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-850 rounded-2xl resize-none outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-xs font-medium"
                              placeholder="Ej: El paciente mostró rechazo inicial pero luego completó la actividad sin problemas..."
                              value={notes}
                              onChange={e => setNotes(e.target.value)}
                            ></textarea>
                          </div>
                        </div>

                        <div className="flex gap-4 w-full mt-8">
                          <button onClick={() => setIsFinishing(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors">
                            Volver
                          </button>
                          <button onClick={saveSession} className="flex-1 py-3 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5">
                            Guardar Sesión
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Modal / Drawer para Constructor Avanzado de Rutinas */}
            {isModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
                <div className="w-full max-w-xl h-full bg-white dark:bg-[#0F172A] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200 dark:border-slate-850">
                  
                  {/* Drawer Header */}
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-850 flex justify-between items-center bg-slate-50 dark:bg-[#1E293B]">
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white">Constructor de Terapias</h2>
                      <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">Configura parámetros y pasos terapéuticos.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {/* Tabs Nav */}
                  <div className="flex px-6 pt-3 bg-slate-50 dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-850 gap-4">
                    <button onClick={() => setActiveTab('general')} className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Detalles Clínicos</button>
                    <button onClick={() => setActiveTab('steps')} className={`pb-2.5 text-xs font-bold border-b-2 transition-colors ${activeTab === 'steps' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Paso a Paso</button>
                  </div>
                  
                  {/* Drawer Body */}
                  <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#0F172A]">
                    <form id="create-routine-form" onSubmit={handleCreateRoutine} className="space-y-6">
                      
                      {activeTab === 'general' && (
                        <div className="space-y-5 animate-in fade-in">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nombre de la Terapia</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-750 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-900 dark:text-white" placeholder="Ej. Terapia Sensorial con Espuma" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Categoría</label>
                              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-750 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-900 dark:text-white">
                                <option value="Higiene">Higiene</option>
                                <option value="Terapéutico">Terapéutico</option>
                                <option value="Alimentación">Alimentación</option>
                                <option value="Educativo">Educativo</option>
                                <option value="Regulación">Regulación Sensorial</option>
                              </select>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Duración Estimada</label>
                              <input type="text" required value={formData.durationStr} onChange={e => setFormData({...formData, durationStr: e.target.value})} className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-750 rounded-xl outline-none focus:border-blue-500 text-xs font-semibold text-slate-900 dark:text-white" placeholder="Ej. 15 min" />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Dificultad</label>
                            <div className="flex gap-3">
                              {['Baja', 'Media', 'Alta'].map(diff => (
                                <button type="button" key={diff} onClick={() => setFormData({...formData, difficulty: diff})} className={`flex-1 py-2 rounded-lg border font-bold text-xs transition-all ${formData.difficulty === diff ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30' : 'bg-white border-slate-200 text-slate-550 dark:bg-[#1E293B]'}`}>
                                  {diff}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'steps' && (
                        <div className="space-y-5 animate-in fade-in">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Instrucciones Estructuradas</label>
                            <button type="button" onClick={handleAddStep} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"><Plus className="w-3.5 h-3.5"/> Agregar Paso</button>
                          </div>

                          <div className="space-y-3">
                            {formData.steps.map((step, index) => (
                              <div key={step.id} className="group flex items-start gap-3 p-3 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl">
                                <div className="mt-2.5 cursor-grab text-slate-400"><GripVertical className="w-4 h-4" /></div>
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 text-xs flex items-center justify-center font-black shrink-0 mt-0.5">
                                  {index + 1}
                                </div>
                                <div className="flex-1 space-y-2">
                                  <input type="text" placeholder="Ej. Colocar el material en la mesa" value={step.text} onChange={(e) => handleStepChange(step.id, 'text', e.target.value)} className="w-full bg-transparent border-b border-slate-350 dark:border-slate-650 px-1 py-1 outline-none focus:border-blue-500 text-xs font-semibold text-slate-900 dark:text-white" required />
                                  <div className="flex items-center gap-1.5 px-1">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    <input type="text" placeholder="5 min" value={step.time} onChange={(e) => handleStepChange(step.id, 'time', e.target.value)} className="bg-transparent text-[10px] font-semibold text-slate-500 outline-none w-20" />
                                  </div>
                                </div>
                                <button type="button" onClick={() => handleRemoveStep(step.id)} className="mt-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded opacity-0 group-hover:opacity-100 transition-all">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </form>
                  </div>
                  
                  {/* Drawer Footer */}
                  <div className="p-5 border-t border-slate-100 dark:border-slate-850 bg-white dark:bg-[#0F172A] flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-[1] py-3 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                    <button type="submit" form="create-routine-form" className="flex-[2] py-3 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex justify-center items-center gap-1.5"><Plus className="w-4 h-4"/> Guardar Terapia</button>
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
