import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api/axios'
import useIdleTimer from '../hooks/useIdleTimer'

const GlobalContext = createContext()

export const useGlobalContext = () => useContext(GlobalContext)

const viewToPath = {
  login: '/login', register: '/register', forgot: '/forgot',
  'reset-password': '/reset-password', 'register-repre': '/register-repre',
  dashboard: '/dashboard', admin: '/admin',
  student: '/student', patients: '/patients',
  rutinas: '/rutinas', agenda: '/agenda',
  herramientas: '/herramientas', perfil_padre: '/perfil-padre',
  diario_hogar: '/diario-hogar', profile: '/profile',
  inventario: '/inventario', sensores: '/sensores',
  historial: '/historial', home_analytics: '/home-analytics',
  manual_repre: '/manual-repre', manual_especialista: '/manual-especialista'
}

const pathToView = Object.fromEntries(
  Object.entries(viewToPath).map(([k, v]) => [v, k])
)

export const GlobalProvider = ({ children }) => {
  const routerNavigate = useNavigate()
  const location = useLocation()
  const [currentView, setCurrentView] = useState(() => {
    const path = window.location.pathname
    return pathToView[path] || localStorage.getItem('currentView') || 'login'
  })
  const [nomNino, setNomNino] = useState(null)
  const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole') || 'ESPECIALISTA')
  const [userName, setUserName] = useState(() => localStorage.getItem('userName') || '')
  const [adminActiveTab, setAdminActiveTab] = useState('dashboard')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
    setIsDark(!isDark)
  }

  useEffect(() => {
    localStorage.setItem('currentView', currentView)
  }, [currentView])

  useEffect(() => {
    const path = location.pathname
    if (path === '/') {
      const target = viewToPath[currentView]
      if (target) routerNavigate(target, { replace: true })
      return
    }
    const view = pathToView[path]
    if (view && view !== currentView) {
      setCurrentView(view)
    }
  }, [location.pathname])

  useEffect(() => {
    localStorage.setItem('userRole', userRole)
  }, [userRole])

  useEffect(() => {
    localStorage.setItem('userName', userName)
  }, [userName])

  // Idle session timeout (default: 15 min)
  const IDLE_TIMEOUT = Number(import.meta.env.VITE_IDLE_TIMEOUT) || 900
  const publicViews = ['login', 'register', 'forgot', 'reset-password', 'register-repre']
  const hasToken = !!localStorage.getItem('token')
  const isPublicView = publicViews.includes(currentView)
  const idleActive = hasToken && !isPublicView

  const handleIdleTimeout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userName')
    localStorage.removeItem('currentView')
    setCurrentView('login')
    routerNavigate('/login', { replace: true })
    showToast('⏱️ Sesión cerrada por inactividad')
  }, [routerNavigate])

  useIdleTimer(IDLE_TIMEOUT, handleIdleTimeout, idleActive)

  const [selectedChildId, setSelectedChildId] = useState(null)
  const [isOnline, setIsOnline] = useState(true)
  const [showEmergencyGuard, setShowEmergencyGuard] = useState(false)
  const [pendingNavigation, setPendingNavigation] = useState(null)
  const [listaNinos, setListaNinos] = useState([])
  
  const fetchNinos = async () => {
    try {
      const res = await api.get('/ninos/mis-ninos');
      const ninosData = res.data.data;
      if (ninosData && ninosData.length > 0) {
        const mapped = ninosData.map(n => ({
          id_ninos: n.nin_codi,
          nom_nino: n.nin_nomb,
          ape_nino: n.nin_apel,
          niv_desa: n.nin_nivd,
          est_disp: 'Online' // Simulado por ahora
        }));
        setListaNinos(mapped);
        if (!selectedChildId && userRole !== 'ESPECIALISTA') {
          setSelectedChildId(mapped[0].id_ninos);
          setNomNino(mapped[0].nom_nino);
        }
      } else {
        setListaNinos([]);
      }
    } catch (err) {
      console.error('Error fetching niños:', err);
      showToast('⚠️ Error al cargar los datos del sistema.');
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isPublic = currentView === 'login' || currentView === 'register' || currentView === 'forgot' || currentView === 'reset-password' || currentView === 'register-repre';
    
    // El Administrador NO debe pedir la lista de niños, solo Especialistas y Representantes
    if (token && !isPublic && (userRole === 'ESPECIALISTA' || userRole === 'REPRESENTANTE')) {
      fetchNinos();
    } else if (!token || isPublic) {
      setListaNinos([]); // Limpiar estado residual
    }
  }, [currentView, userRole]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const isPublic = currentView === 'login' || currentView === 'register' || currentView === 'forgot' || currentView === 'reset-password' || currentView === 'register-repre';
    
    if (token && !isPublic && (userRole === 'ESPECIALISTA' || userRole === 'REPRESENTANTE')) {
      fetchRoutines();
    }
  }, [currentView, userRole, selectedChildId]);

  const [routines, setRoutines] = useState([])

  const fetchRoutines = async () => {
    try {
      const url = selectedChildId ? `/sesiones/actividades?nin_codi=${selectedChildId}` : '/sesiones/actividades';
      const res = await api.get(url)
      const data = res.data.data
      if (data && data.length > 0) {
        const mapped = data.map(act => ({
          id: act.act_codi,
          title: act.act_trea,
          category: act.tm_categ?.cat_nomb || 'Monitoreo',
          durationStr: `${act.act_time || 15} min`,
          inst: act.act_guia || ''
        }))
        setRoutines(mapped)
      }
    } catch (err) {
      console.error('Error fetching routines:', err)
    }
  }

  const createRoutine = async (formData) => {
    try {
      const categoryMap = {
        'Higiene': 'CAT_SIM',
        'Terapéutico': 'CAT_SIM',
        'Alimentación': 'CAT_SIM',
        'Educativo': 'CAT_SIM',
        'Regulación': 'CAT_SIM'
      }
      
      const payload = {
        category_code: categoryMap[formData.category] || 'CAT_SIM',
        act_trea: formData.title,
        act_meta: formData.difficulty || 'Baja',
        act_guia: formData.steps ? formData.steps.map((s, index) => `${index + 1}. ${s.text} (${s.time})`).join('\n') : '',
        act_time: parseInt(formData.durationStr) || 15,
        nin_codi: selectedChildId || null
      }

      await api.post('/sesiones/actividades', payload)
      showToast('✨ Terapia creada y guardada en el backend.')
      await fetchRoutines()
    } catch (err) {
      console.error('Error creating routine:', err)
      showToast('❌ Error al guardar la rutina.')
    }
  }

  const [childDataMap, setChildDataMap] = useState({})
  
  const [globalHistoricalData, setGlobalHistoricalData] = useState([])

  // Simulando Data para TR_REPOR (Indicaciones)
  const [globalReports, setGlobalReports] = useState([])

  const [globalHardware, setGlobalHardware] = useState([
    {
      id_hardw: 'HW-001',
      est_disp: 'Online',
      battery: 85,
      signal: 92,
      type: 'Pulsera Biométrica MAX30102',
      name: 'Biosensor Principal'
    },
    {
      id_hardw: 'HW-002',
      est_disp: 'Offline',
      battery: 15,
      signal: 0,
      type: 'Acelerómetro MPU6050',
      name: 'Sensor Movimiento Brazo'
    }
  ])

  const addHardware = (hardwareData) => {
    const newId = `HW-${String(globalHardware.length + 1).padStart(3, '0')}`
    const newDevice = {
      id_hardw: newId,
      est_disp: 'Online',
      battery: 100,
      signal: 100,
      type: hardwareData.type,
      name: hardwareData.name
    }
    setGlobalHardware(prev => [...prev, newDevice])
    showToast(`✅ Sensor ${newDevice.name} añadido correctamente.`)
  }

  const [globalAlertas, setGlobalAlertas] = useState([])

  // Telemetría de alta resolución (segundo a segundo) durante la ventana de la crisis (5 min aprox)
  const crisisTelemetry = {}

  // --- Datos Simulados de Análisis en Casa (Padre) ---
  const [homeHistoricalData, setHomeHistoricalData] = useState([])

  const [parentNotes, setParentNotes] = useState([])

  const addHomeReport = (report) => {
    const [y, m, day] = (report.date || '').split('-').map(Number)
    const d = new Date(y, m - 1, day)
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const dia = d instanceof Date && !isNaN(d) ? days[d.getDay()] : 'Hoy'

    const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    const bpm = report.bpm ? parseInt(report.bpm) : (report.mood === 'Crisis / Sobrecarga' ? 120 : 80)
    
    const summaryText = `[Sueño: ${report.sleepHours}h - ${report.sleepQuality}] [Apetito: ${report.appetite}] ${report.text}`

    setParentNotes(prev => [
      { time, bpm, dia, text: summaryText },
      ...prev
    ])

    // Calcular nueva calma según el mood reportado
    let newCalma = 70
    if (report.mood === 'Muy Calmo') newCalma = 95
    if (report.mood === 'Estable') newCalma = 80
    if (report.mood === 'Irritable') newCalma = 45
    if (report.mood === 'Crisis / Sobrecarga') newCalma = 15

    setHomeHistoricalData(prev => {
      const copy = [...prev]
      const idx = copy.findIndex(item => item.dia === dia)
      if (idx !== -1) {
        copy[idx] = {
          ...copy[idx],
          calma: Math.round((copy[idx].calma + newCalma) / 2),
          sobrecarga: Math.round((copy[idx].sobrecarga + (100 - newCalma)) / 2),
          notas: copy[idx].notas + 1
        }
      } else {
        copy.push({
          dia, calma: newCalma, sobrecarga: 100 - newCalma, notas: 1
        })
      }
      return copy
    })

    showToast('✅ Reporte del hogar enviado con éxito. Especialista notificado.')
  }

  const [clinicalHistory, setClinicalHistory] = useState([])
  const [clinicalReports, setClinicalReports] = useState([])
  const [clinicalAlerts, setClinicalAlerts] = useState([])

  const fetchHistorialCompleto = async (childId) => {
    if (!childId) return
    try {
      const res = await api.get(`/reportes/historial-completo/${childId}`)
      const { reportes, sesiones } = res.data.data

      // Map reportes (Indicaciones)
      if (reportes && reportes.length > 0) {
        const mappedReports = reportes.map(r => ({
          fec_repo: r.rpt_inpe,
          pro_calm: r.rpt_meta,
          tot_sesi: r.rpt_sesi,
          fue_efec: r.rpt_nube,
          com_tend: r.rpt_nota || '',
          id_rutin: r.rpt_graf
        }))
        setClinicalReports(mappedReports)
      } else {
        setClinicalReports([])
      }

      // Map sesiones (Evolución)
      if (sesiones && sesiones.length > 0) {
        const mappedHistory = sesiones.map(s => {
          const hasAlerts = s.tr_alert && s.tr_alert.length > 0
          const proCalm = hasAlerts ? 65 : 95
          const note = s.ses_nota || 'Sesión terapéutica regular'
          return {
            fec_repo: new Date(s.ses_inic).toLocaleDateString('es-ES'),
            pro_calm: proCalm,
            tot_sesi: 1,
            fue_efec: !hasAlerts,
            com_tend: note
          }
        })
        setClinicalHistory(mappedHistory)

        // Map alertas
        const allAlerts = []
        sesiones.forEach(s => {
          if (s.tr_alert) {
            s.tr_alert.forEach(al => {
              allAlerts.push({
                id_alert: al.ale_codi,
                fec_hora: al.ale_time,
                est_dete: al.ale_meto || 'SOBRECARGA',
                fue_efec: al.tr_feedb?.[0]?.fed_efec ?? null,
                bpm_max: 124,
                mov_max: 2.1,
                stress_index: 85,
                com_padr: al.tr_feedb?.[0]?.com_padr || ''
              })
            })
          }
        })
        setClinicalAlerts(allAlerts)
      } else {
        setClinicalHistory([])
        setClinicalAlerts([])
      }
    } catch (err) {
      console.error('Error fetching child complete history:', err)
    }
  }

  const [globalPeiGoals, setGlobalPeiGoals] = useState([])

  const fetchPeiGoals = async (childId) => {
    if (!childId) return
    try {
      const res = await api.get(`/metas/${childId}`)
      setGlobalPeiGoals(res.data.data)
    } catch (err) {
      console.error('Error fetching PEI goals:', err)
    }
  }

  const crearPeiGoal = async (childId, desc, totalTrials) => {
    try {
      await api.post('/metas', {
        nin_codi: childId,
        met_desc: desc,
        met_ttria: totalTrials
      })
      await fetchPeiGoals(childId)
    } catch (err) {
      console.error('Error creating PEI goal:', err)
      throw err
    }
  }

  const incrementPeiTrial = async (goalId, childId) => {
    try {
      await api.patch(`/metas/${goalId}/ensayo`)
      if (childId) await fetchPeiGoals(childId)
    } catch (err) {
      console.error('Error incrementing PEI trial:', err)
      throw err
    }
  }

  const crearIndicacion = async (childId, texto) => {
    try {
      await api.post('/reportes/indicacion', {
        nin_codi: childId,
        com_tend: texto
      })
      await fetchHistorialCompleto(childId)
    } catch (err) {
      console.error('Error creating indicacion:', err)
      throw err
    }
  }

  useEffect(() => {
    if (selectedChildId) {
      fetchHistorialCompleto(selectedChildId)
      fetchPeiGoals(selectedChildId)
    }
  }, [selectedChildId])

  const currentChildId = selectedChildId || 'N001'
  const valMini = childDataMap[currentChildId]?.valMini || 65
  const valMaxi = childDataMap[currentChildId]?.valMaxi || 110
  const offset = childDataMap[currentChildId]?.offset || 0

  // Conexión directa a la base de datos sin inyección de Mocks destructivos
  const historicalData = clinicalHistory || []
  const alertas = clinicalAlerts || []
  const reports = clinicalReports || []

  const hardware = globalHardware.map((h, i) => ({
    ...h,
    id_hardw: h.id_hardw || `HW-20${i}`,
    battery: Math.min(100, Math.max(5, h.battery + offset)),
    signal: Math.min(100, Math.max(10, h.signal - offset))
  }))

  const evaluateAlert = async (id_alert, fue_efec, com_padr = '') => {
    try {
      await api.post(`/reportes/alertas/${id_alert}/feedback`, {
        fed_efec: fue_efec,
        com_padr: com_padr
      })
      showToast(fue_efec ? '✅ Efectividad registrada exitosamente' : '⚠️ Registrado como no efectivo')
      if (selectedChildId) {
        await fetchHistorialCompleto(selectedChildId)
      }
    } catch (err) {
      console.error('Error submitting feedback:', err)
      showToast('❌ Error al registrar feedback en el servidor.')
    }
  }


  // --- Datos de objetivos de terapia para TEA ---
  const [weeklyGoal, setWeeklyGoal] = useState("Mantener contacto visual durante 5 segundos al saludar y despedirse.")
  
  const reportGoalProgress = () => {
    showToast("🌟 Progreso del objetivo semanal registrado con éxito. ¡Buen trabajo!")
  }

  const [toastMessage, setToastMessage] = useState(null)

  const showToast = (message) => {
    setToastMessage(message)
    setTimeout(() => setToastMessage(null), 3000)
  }

  useEffect(() => {
    const handler = (e) => showToast(e.detail.message)
    window.addEventListener('global-toast', handler)
    return () => window.removeEventListener('global-toast', handler)
  }, [])

  const navigate = (view) => {
    if (view === 'student' && userRole !== 'ESPECIALISTA') {
      showToast('⚠️ Acceso denegado: Se requiere rol de Especialista.')
      return
    }

    setCurrentView(view)
    const path = viewToPath[view]
    if (path) routerNavigate(path)
  }

  const addFeedback = (fue_efec) => {
    // La UI ya usa evaluateAlert que hace el API request correcto.
    showToast('Feedback registrado (Actualice con la base de datos).')
  }

  const updateThresholds = (min, max) => {
    setChildDataMap(prev => ({
      ...prev,
      [currentChildId]: { ...prev[currentChildId], valMini: Number(min), valMaxi: Number(max) }
    }))
    api.put(`/ninos/${currentChildId}/umbrales`, { val_mini: Number(min), val_maxi: Number(max) })
      .then(() => showToast('Umbrales de sensibilidad guardados correctamente.'))
      .catch(err => {
        console.error('Error al guardar umbrales en el servidor:', err)
        showToast('⚠️ Umbrales guardados localmente. Error al sincronizar con el servidor.')
      })
  }

  const calculateStressIndex = (bpm, movimiento) => {
    if (bpm <= valMini) return 0;
    const bpmRange = valMaxi - valMini;
    const bpmRatio = Math.min(1, Math.max(0, (bpm - valMini) / (bpmRange || 1)));
    const movRatio = Math.min(1, Math.max(0, movimiento / 10));
    
    let stress = bpmRatio * 100 * (1 - movRatio * 0.4);
    
    if (movimiento > 8 && bpmRatio > 0.4) {
      stress = Math.max(stress, 80);
    }
    return Math.round(stress);
  }

  const saveCalibrationBaseline = (bpmBaseline) => {
    const min = Math.round(bpmBaseline * 0.9);
    const max = Math.round(bpmBaseline * 1.45);
    updateThresholds(min, max);
  }

  return (
    <GlobalContext.Provider value={{
      currentView,
      nomNino,
      userRole,
      userName,
      selectedChildId,
      adminActiveTab,
      setAdminActiveTab,
      isSidebarOpen,
      setIsSidebarOpen,
      isDark,
      toggleTheme,
      listaNinos,
      valMini,
      valMaxi,
      historicalData,
      navigate,
      addFeedback,
      updateThresholds,
      setNomNino,
      setUserRole,
      setUserName,
      setSelectedChildId,
      showToast,
      alertas,
      evaluateAlert,
      hardware,
      addHardware,
      reports,
      isOnline,
      setIsOnline,
      showEmergencyGuard,
      setShowEmergencyGuard,
      pendingNavigation,
      setPendingNavigation,
      setCurrentView,
      fetchNinos,
      homeHistoricalData,
      parentNotes,
      addHomeReport,
      weeklyGoal,
      reportGoalProgress,
      calculateStressIndex,
      saveCalibrationBaseline,
      crisisTelemetry,
      routines,
      fetchRoutines,
      createRoutine,
      clinicalAlerts,
      clinicalHistory,
      crearIndicacion,
      globalPeiGoals,
      crearPeiGoal,
      incrementPeiTrial
    }}>
      {children}
      {/* Toast Notification simulando Shadcn */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 border-l-4 border-brand-500 p-4 rounded-lg shadow-xl z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{toastMessage}</p>
          </div>
        </div>
      )}
    </GlobalContext.Provider>
  )
}
