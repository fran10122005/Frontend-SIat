import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useGlobalContext } from '../context/GlobalState'
import { 
  Play, Square, Clock, Activity, FileText, Settings, 
  CheckCircle2, AlertTriangle, Plus, Search, Star, MessageSquare,
  Image as ImageIcon, Video, Link, Trash2, GripVertical, UploadCloud
} from 'lucide-react'
import NotificationBell from './NotificationBell'
import Topbar from './Topbar'
import api from '../api/axios'

export default function Routines() {
  const { nomNino, userRole, userName, showToast, routines, createRoutine, selectedChildId, globalPeiGoals = [], crearPeiGoal } = useGlobalContext()
  const [isDark, setIsDark] = useState(false)


  // Session State
  const [activeSession, setActiveSession] = useState(null)
  const [sessionTime, setSessionTime] = useState(0) // en segundos
  const [isFinishing, setIsFinishing] = useState(false)
  const [cooperation, setCooperation] = useState(0)
  const [notes, setNotes] = useState('')

  // --- Advanced Routine Builder State ---
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
    mediaUrl: '',
    peiGoalDesc: '',
    peiGoalTrials: 20
  })

  // Handlers for Builder
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
    if (formData.peiGoalDesc.trim()) {
      await crearPeiGoal(selectedChildId, formData.peiGoalDesc, formData.peiGoalTrials)
    }
    setActiveTab('general')
  }

  // Theme observer
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) setIsDark(true)
  }, [])

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
    setActiveSession(null)
    setIsFinishing(false)
  }


  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Topbar */}
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8 pb-12">
            
            {/* Si no hay sesión activa: Mostrar lista de rutinas */}
            {!activeSession && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Catálogo de Terapias</h1>
                    <p className="text-sm text-slate-500 mt-1">Selecciona una rutina para iniciar el monitoreo clínico para {nomNino || 'el paciente'}.</p>
                  </div>
                  <button onClick={() => setIsModalOpen(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 text-sm transition-transform hover:scale-105">
                    <Plus className="w-5 h-5" /> Crear Nueva Terapia
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {routines.map(routine => (
                    <div key={routine.id} className="group bg-white dark:bg-[#1E293B] rounded-3xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-default">
                      <div>
                        <div className="flex justify-between items-start mb-5">
                          <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest rounded-lg">
                            {routine.category}
                          </span>
                          <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md flex items-center gap-1"><Clock className="w-3 h-3"/> {routine.durationStr}</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-3 leading-tight">{routine.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed font-medium">{routine.inst}</p>
                      </div>

                      <div className="mt-8">
                        <button 
                          onClick={() => startSession(routine)}
                          className="w-full py-3.5 bg-slate-900 dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                        >
                          <Play className="w-4 h-4 fill-current" /> Iniciar Sesión en Vivo
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Si hay sesión activa: Mostrar Live Monitor */}
            {activeSession && (
              <div className="animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto w-full mt-4">
                {/* Panel de Monitoreo Activo (El código se mantiene intacto y funcional) */}
                <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-blue-200 dark:border-blue-900/50 shadow-2xl shadow-blue-500/10 overflow-hidden relative min-h-[400px] md:min-h-[600px] flex flex-col">
                  
                  {/* Header Flotante */}
                  <div className="px-8 py-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
                    <div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Monitoreo en Curso
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{activeSession.title}</h2>
                    </div>
                    {!isFinishing && (
                      <button onClick={endSession} className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 transition-colors">
                        <Square className="w-4 h-4 fill-current" /> Detener
                      </button>
                    )}
                  </div>

                  {/* Cuerpo Principal del Monitor */}
                  <div className="flex-1 p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center justify-center">
                    {/* Reloj Grande */}
                    <div className="flex flex-col items-center justify-center relative shrink-0">
                      <div className="w-56 h-56 rounded-full border-[14px] border-slate-100 dark:border-slate-800 flex items-center justify-center relative shadow-inner">
                        <div className={`absolute inset-0 rounded-full border-[14px] border-transparent ${!isFinishing ? 'border-t-blue-500 animate-spin' : ''}`} style={{ animationDuration: '3s' }}></div>
                        <span className="text-6xl font-black text-slate-800 dark:text-slate-100 tracking-tighter tabular-nums font-mono">
                          {formatTime(sessionTime)}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-400 mt-6 tracking-widest uppercase">Tiempo Registrado</p>
                    </div>

                    {/* Instrucciones Clínicas */}
                    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-800/30 p-8 rounded-[1.5rem] border border-slate-100 dark:border-slate-700/50 shadow-inner">
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        Paso a paso Clínico
                      </h3>
                      <div className="prose dark:prose-invert prose-sm">
                        <p className="whitespace-pre-line text-slate-600 dark:text-slate-300 font-medium text-base leading-loose">
                          {activeSession.inst}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Formulario de Cierre Flotante */}
                  {isFinishing && (
                    <div className="absolute inset-0 top-[88px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10 flex flex-col justify-start md:justify-center items-center p-8 overflow-y-auto animate-in fade-in slide-in-from-bottom-8">
                      <div className="max-w-md w-full flex flex-col items-center text-center my-auto pb-8">
                        <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6" />
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Sesión Finalizada</h3>
                        <p className="text-base text-slate-500 mb-8 font-medium">Tiempo total registrado: <span className="font-bold text-slate-800 dark:text-slate-200">{formatTime(sessionTime)}</span>. Por favor, evalúa el desempeño.</p>
                        
                        <div className="w-full space-y-8 text-left">
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 block text-center">Nivel de Cooperación del Paciente</label>
                            <div className="flex justify-center gap-2">
                              {[1,2,3,4,5].map(val => (
                                <button key={val} onClick={() => setCooperation(val)} className="focus:outline-none transition-transform hover:scale-125">
                                  <Star className={`w-10 h-10 ${val <= cooperation ? 'fill-amber-400 text-amber-400 drop-shadow-md' : 'text-slate-200 dark:text-slate-700 fill-transparent'}`} />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 block flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" /> Notas u Observaciones (Opcional)
                            </label>
                            <textarea 
                              rows="3" 
                              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl resize-none outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium"
                              placeholder="Ej: El paciente mostró rechazo inicial pero luego completó la actividad sin problemas..."
                              value={notes}
                              onChange={e => setNotes(e.target.value)}
                            ></textarea>
                          </div>
                        </div>

                        <div className="flex gap-4 w-full mt-10">
                          <button onClick={() => setIsFinishing(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            Volver
                          </button>
                          <button onClick={saveSession} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1">
                            Guardar Bitácora
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* Modal / Side Drawer para Constructor Avanzado de Rutinas */}
            {isModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
                <div className="w-full max-w-2xl h-full bg-white dark:bg-[#0F172A] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200 dark:border-slate-800">
                  
                  {/* Drawer Header */}
                  <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#1E293B]">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">Constructor de Terapias</h2>
                      <p className="text-xs text-slate-500 mt-1">Configura los parámetros, pasos y multimedia.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  {/* Tabs Nav */}
                  <div className="flex px-8 pt-4 bg-slate-50 dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-800 gap-6">
                    <button onClick={() => setActiveTab('general')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Detalles Clínicos</button>
                    <button onClick={() => setActiveTab('steps')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'steps' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Paso a Paso</button>
                    <button onClick={() => setActiveTab('media')} className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'media' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>Materiales</button>
                    <button onClick={() => setActiveTab('metas')} className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'metas' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Star className="w-4 h-4"/> Metas PEI</button>
                  </div>
                  
                  {/* Drawer Body */}
                  <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-[#0F172A]">
                    <form id="create-routine-form" onSubmit={handleCreateRoutine} className="space-y-8">
                      
                      {/* TAB 1: General */}
                      {activeTab === 'general' && (
                        <div className="space-y-6 animate-in fade-in">
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Nombre de la Terapia</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all" placeholder="Ej. Terapia Sensorial con Espuma" />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Categoría</label>
                              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all">
                                <option value="Higiene">Higiene</option>
                                <option value="Terapéutico">Terapéutico</option>
                                <option value="Alimentación">Alimentación</option>
                                <option value="Educativo">Educativo</option>
                                <option value="Regulación">Regulación Sensorial</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Duración Estimada</label>
                              <input type="text" required value={formData.durationStr} onChange={e => setFormData({...formData, durationStr: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all" placeholder="Ej. 15 min" />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Dificultad Esperada</label>
                            <div className="flex gap-4">
                              {['Baja', 'Media', 'Alta'].map(diff => (
                                <button type="button" key={diff} onClick={() => setFormData({...formData, difficulty: diff})} className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${formData.difficulty === diff ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400' : 'bg-white border-slate-200 text-slate-500 dark:bg-[#1E293B] dark:border-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                                  {diff}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: Pasos */}
                      {activeTab === 'steps' && (
                        <div className="space-y-6 animate-in fade-in">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">Instrucciones Estructuradas</label>
                            <button type="button" onClick={handleAddStep} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"><Plus className="w-3 h-3"/> Agregar Paso</button>
                          </div>

                          <div className="space-y-4">
                            {formData.steps.map((step, index) => (
                              <div key={step.id} className="group flex items-start gap-4 p-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl">
                                <div className="mt-3 cursor-grab text-slate-400 hover:text-slate-600"><GripVertical className="w-5 h-5" /></div>
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black shrink-0 mt-1">
                                  {index + 1}
                                </div>
                                <div className="flex-1 space-y-3">
                                  <input type="text" placeholder="Instrucción corta (Ej. Colocar el material en la mesa)" value={step.text} onChange={(e) => handleStepChange(step.id, 'text', e.target.value)} className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 px-2 py-2 outline-none focus:border-blue-500 text-sm font-medium text-slate-900 dark:text-white" required />
                                  <div className="flex items-center gap-2 px-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <input type="text" placeholder="Tiempo (Ej. 2 min)" value={step.time} onChange={(e) => handleStepChange(step.id, 'time', e.target.value)} className="bg-transparent text-xs font-semibold text-slate-500 outline-none w-24" />
                                  </div>
                                </div>
                                <button type="button" onClick={() => handleRemoveStep(step.id)} className="mt-3 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TAB 3: Media */}
                      {activeTab === 'media' && (
                        <div className="space-y-8 animate-in fade-in">
                          
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">Materiales Requeridos (Separados por comas)</label>
                            <textarea rows="2" value={formData.materials} onChange={e => setFormData({...formData, materials: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all resize-none" placeholder="Ej. Pelota de yoga, Arena cinética, Fichas de colores..." />
                          </div>

                          <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">Soporte Multimedia (Pictogramas o Video)</label>
                            
                            <div className="flex gap-4">
                              <button type="button" onClick={() => setFormData({...formData, mediaType: 'image'})} className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all ${formData.mediaType === 'image' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1E293B]'}`}>
                                <ImageIcon className="w-6 h-6" />
                                <span className="text-sm font-bold">Imagen / Pictograma</span>
                              </button>
                              <button type="button" onClick={() => setFormData({...formData, mediaType: 'video'})} className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all ${formData.mediaType === 'video' ? 'border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1E293B]'}`}>
                                <Video className="w-6 h-6" />
                                <span className="text-sm font-bold">Video de Referencia</span>
                              </button>
                            </div>

                            {/* Dropzone Imagen */}
                            {formData.mediaType === 'image' && (
                              <div className="mt-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-3xl p-10 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-[#1E293B] hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer group">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                  <UploadCloud className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Arrastra una imagen aquí o haz clic para explorar</p>
                                <p className="text-xs font-medium text-slate-500 mt-2">Soporta PNG, JPG o SVG (Máx 5MB)</p>
                              </div>
                            )}

                            {/* Input de URL Video */}
                            {formData.mediaType === 'video' && (
                              <div className="mt-4 relative animate-in zoom-in-95">
                                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                  <Link className="h-5 w-5 text-slate-400" />
                                </div>
                                <input type="url" placeholder="https://youtube.com/watch?v=..." value={formData.mediaUrl} onChange={e => setFormData({...formData, mediaUrl: e.target.value})} className="w-full pl-12 pr-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all" />
                              </div>
                            )}

                          </div>
                        </div>
                      )}

                      {/* TAB 4: Metas PEI */}
                      {activeTab === 'metas' && (
                        <div className="space-y-6 animate-in fade-in">
                          <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                              <Star className="w-4 h-4" />
                              Asignar Meta Clínica a Paciente
                            </h3>
                            <p className="text-xs text-amber-700 dark:text-amber-500 font-medium">Al crear esta terapia, puedes asignar simultáneamente una Meta PEI para evaluar en múltiples sesiones.</p>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Descripción de la Meta (PEI)</label>
                              <input type="text" value={formData.peiGoalDesc} onChange={e => setFormData({...formData, peiGoalDesc: e.target.value})} className="w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all" placeholder="Ej. Sostener contacto visual (10s)" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500">Criterio de Maestría (Ensayos Exitosos Totales)</label>
                              <input type="number" min="1" max="100" value={formData.peiGoalTrials} onChange={e => setFormData({...formData, peiGoalTrials: parseInt(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all" placeholder="Ej. 20" />
                            </div>
                          </div>

                          <div className="mt-8">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Metas Actuales del Paciente</h4>
                            {globalPeiGoals.length > 0 ? (
                              <div className="space-y-3">
                                {globalPeiGoals.map(g => (
                                  <div key={g.met_codi} className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex justify-between items-center shadow-sm">
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{g.met_desc}</span>
                                    <span className="text-xs font-black text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                                      {g.met_prog}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 italic">No hay metas activas para este paciente.</p>
                            )}
                          </div>
                        </div>
                      )}

                    </form>
                  </div>
                  
                  {/* Drawer Footer */}
                  <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-[1] py-4 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">Cancelar</button>
                    <button type="submit" form="create-routine-form" className="flex-[2] py-4 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl shadow-blue-500/30 transition-all flex justify-center items-center gap-2 hover:-translate-y-1"><Plus className="w-5 h-5"/> Generar Terapia</button>
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
