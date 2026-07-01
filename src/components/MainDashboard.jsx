import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useGlobalContext } from '../context/GlobalState'
import { 
  Activity, Bell, AlertTriangle, NotebookPen, CheckSquare, Wind, Grid, LayoutDashboard, CalendarPlus 
} from 'lucide-react'
import api from '../api/axios'
import PedirCitaModal from './parent/PedirCitaModal'
import Footer from './Footer'

// Custom Hooks
import { useTelemetry } from '../hooks/useTelemetry'
import { useClinicalData } from '../hooks/useClinicalData'

// Dashboard Components
import RegulationStatusCard from './dashboard/RegulationStatusCard'
import TelemetryChart from './dashboard/TelemetryChart'
import BreathingProtocolModal from './dashboard/BreathingProtocolModal'
import AacBoardDrawer from './dashboard/AacBoardDrawer'

export default function MainDashboard() {
  const { nomNino, navigate, weeklyGoal, isDark } = useGlobalContext()
  const [showTelemetry, setShowTelemetry] = useState(false)
  const [showBreathing, setShowBreathing] = useState(false)
  const [showAac, setShowAac] = useState(false)

  // Custom Hooks data
  const { liveBpm, liveStress, liveMov, isWebSocketActive, telemetryHistory, simulateTelemetry } = useTelemetry()
  const { alertsList, chartDataList } = useClinicalData()

  // Modal Citas
  const [showCitaModal, setShowCitaModal] = useState(false)
  const [citaData, setCitaData] = useState({ esp_codi: '', fecha: '', hora: '', tipo: 'Consulta Regular', notas: '' })
  const [especialistasCita, setEspecialistasCita] = useState([])

  const fetchEspecialistasCita = async () => {
    try {
      const res = await api.get('/citas/especialistas-asignados')
      setEspecialistasCita(res.data.data || [])
      if (res.data.data?.length > 0) {
        setCitaData(prev => ({ ...prev, esp_codi: res.data.data[0].esp_codi }))
      }
    } catch (err) {
      console.error('Error fetching especialistas:', err)
    }
  }

  const handlePedirCita = async (e) => {
    e.preventDefault()
    try {
      await api.post('/citas', {
        esp_codi: citaData.esp_codi,
        cit_fech: citaData.fecha,
        cit_hora: citaData.hora,
        cit_tipo: citaData.tipo,
        cit_nota: citaData.notas
      })
      alert('✅ Solicitud de cita enviada con éxito')
      setShowCitaModal(false)
      setCitaData({ esp_codi: especialistasCita.length > 0 ? especialistasCita[0].esp_codi : '', fecha: '', hora: '', tipo: 'Consulta Regular', notas: '' })
    } catch (err) {
      alert(err.response?.data?.error ? `❌ ${err.response.data.error}` : '❌ Error al solicitar cita')
    }
  }

  // Format alerts
  const finalAlerts = (alertsList || []).map(a => ({
    id: a.ale_codi,
    time: new Date(a.ale_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    type: 'warning',
    message: `Alerta: Crisis de ${a.ale_meto.replace(/_/g, ' ')} registrada para ${a.nin_nomb || 'el niño'}.`,
    icon: AlertTriangle
  }))

  const getAlertColor = (type) => {
    switch(type) {
      case 'warning': return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30'
      case 'success': return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30'
      case 'info': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
      default: return 'text-slate-500 bg-slate-100 dark:bg-slate-800'
    }
  }

  const getRegulationStatus = () => {
    if (liveStress <= 50) {
      return {
        label: 'Calma Basal',
        color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50',
        badge: '🟢 Estado Óptimo',
        description: `${nomNino || 'El paciente'} se encuentra tranquilo, relajado y receptivo a estímulos.`
      }
    } else if (liveStress <= 75) {
      return {
        label: 'Agitación Moderada',
        color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50',
        badge: '🟡 Agitación en curso',
        description: `Se detectan signos iniciales de inquietud motora o estrés leve.`
      }
    } else {
      return {
        label: 'Crisis Sensorial / Sobrecarga',
        color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50',
        badge: '🚨 Crisis Activa',
        description: `¡Alerta de alta sobrecarga sensorial! Iniciar protocolo S.O.S de respiración.`
      }
    }
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-6 md:p-8 flex flex-col gap-8 pb-12">
            
            {/* Header del Dashboard */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                  <LayoutDashboard className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                  Panel Principal
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Paciente: <span className="font-semibold text-slate-700 dark:text-slate-300">{nomNino || 'No Asignado'}</span>
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => {
                    setShowCitaModal(true)
                    fetchEspecialistasCita()
                  }} 
                  className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 text-sm"
                >
                  <CalendarPlus className="w-4 h-4" /> Pedir Cita
                </button>
                <button 
                  onClick={() => navigate('diario_hogar')} 
                  className="px-4 py-2.5 bg-brand-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 text-sm"
                >
                  <NotebookPen className="w-4 h-4" /> Registrar Diario de Hoy
                </button>
              </div>
            </div>

            {/* Contenido Principal */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Columna Izquierda: Regulación y Gráfica */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <RegulationStatusCard 
                      status={getRegulationStatus()} 
                      liveStress={liveStress} 
                      liveBpm={liveBpm} 
                      showTelemetry={showTelemetry} 
                      setShowTelemetry={setShowTelemetry} 
                    />
                    
                    {/* Acceso SOS Crítico */}
                    <div className="bg-gradient-to-br from-[#011C3F] via-[#023A7A] to-[#034EA1] rounded-2xl p-6 border border-blue-800/40 text-white flex flex-col justify-between shadow-xl shadow-blue-900/20">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-black tracking-widest text-rose-400 uppercase">
                          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                          Zona SOS Sensorial
                        </div>
                        <p className="text-xs text-blue-200/80 mt-2 leading-relaxed">
                          Herramientas de auxilio inmediato para calmar el sistema autónomo o restablecer la comunicación no verbal.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-6">
                        <button 
                          onClick={() => setShowBreathing(true)}
                          className="py-3 px-4 bg-rose-500/80 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-2 shadow-md shadow-rose-900/30 border border-rose-400/20 hover:scale-[1.02]"
                        >
                          <Wind className="w-5 h-5 text-white" /> Respiración Tortuga
                        </button>
                        <button 
                          onClick={() => setShowAac(true)}
                          className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all border border-white/15 flex flex-col items-center justify-center gap-2 hover:scale-[1.02]"
                        >
                          <Grid className="w-5 h-5 text-blue-300" /> Tablero AAC Rápido
                        </button>
                      </div>
                    </div>
                  </div>

                  {showTelemetry && <TelemetryChart telemetryHistory={telemetryHistory} isDark={isDark} />}

                  {/* Foco Clínico */}
                  <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1">
                      <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded uppercase tracking-wider">
                        Foco Clínico de la Semana
                      </span>
                      <h4 className="text-base font-bold text-slate-800 dark:text-white tracking-tight mt-2.5">
                        "{weeklyGoal}"
                      </h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Establecido por: <span className="font-semibold text-slate-500">Especialista</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate('agenda')} 
                      className="px-5 py-3 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-2"
                    >
                      <CheckSquare className="w-4 h-4" /> Ver Agenda Visual (Día a Día)
                    </button>
                  </div>
                </div>

                {/* Columna Lateral */}
                <div className="flex flex-col gap-6">
                  {/* Últimos Eventos */}
                  <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[200px] md:h-[280px]">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-slate-400" /> Últimos Eventos
                    </h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 no-scrollbar">
                      {finalAlerts.slice(0, 4).map((alert) => {
                        const IconComponent = alert.icon || AlertTriangle
                        return (
                          <div key={alert.id} className="flex gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <div className={`p-2 rounded-lg shrink-0 h-fit ${getAlertColor(alert.type)}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">{alert.message}</span>
                              <span className="text-[10px] text-slate-400 mt-1">{alert.time}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Estado del Wearable */}
                  <div className="bg-gradient-to-br from-[#0B2545] via-[#134074] to-[#0B2545] rounded-2xl p-6 shadow-xl border border-blue-800/40 text-white flex flex-col justify-between min-h-[180px] md:min-h-[220px]">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xs font-bold uppercase tracking-wider opacity-90 flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" /> Wearable IoT Status
                        </h3>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full ${
                          isWebSocketActive 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {isWebSocketActive ? '● En Línea' : '○ Desconectado'}
                        </span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-white/10">
                          <span className="text-blue-200">Batería:</span>
                          <span className="font-semibold text-emerald-400">85%</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span className="text-blue-200">Señal de Red:</span>
                          <span className="font-semibold text-emerald-400">Excelente (92%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
          <Footer />
        </div>
      </main>

      {/* ==== MODALS & DRAWERS ==== */}
      <BreathingProtocolModal showBreathing={showBreathing} setShowBreathing={setShowBreathing} />
      <AacBoardDrawer showAac={showAac} setShowAac={setShowAac} />
      <PedirCitaModal 
        showModal={showCitaModal}
        setShowModal={setShowCitaModal}
        citaData={citaData}
        setCitaData={setCitaData}
        handleSubmit={handlePedirCita}
        especialistas={especialistasCita}
      />
    </div>
  )
}
