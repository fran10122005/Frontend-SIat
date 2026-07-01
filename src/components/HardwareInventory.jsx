import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useGlobalContext } from '../context/GlobalState'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend
} from 'recharts'
import { 
  Heart, Activity, ShieldCheck, Zap, Battery, Wifi, 
  AlertTriangle, Cpu, Brain, CheckCircle, Moon, Sun
} from 'lucide-react'
import { getSocket } from '../hooks/socket'
import { useTelemetry } from '../hooks/useTelemetry'
import Topbar from './Topbar'
import api from '../api/axios'

export default function HardwareInventory() {
  const { 
    hardware, addHardware, navigate, userRole, saveCalibrationBaseline, 
    valMini, valMaxi, nomNino, showToast, isOnline, calculateStressIndex 
  } = useGlobalContext()

  const [isDark, setIsDark] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [showModal, setShowModal] = useState(false)
  
  const [showNewSensorModal, setShowNewSensorModal] = useState(false)
  const [newSensorForm, setNewSensorForm] = useState({ name: '', type: 'Pulsera Biométrica MAX30102' })

  // Calibrador en Vivo States (Specialist)
  const [calibStep, setCalibStep] = useState('idle') // 'idle', 'measuring', 'completed'
  const [calibCountdown, setCalibCountdown] = useState(15)
  const [calibBpmFeed, setCalibBpmFeed] = useState(72)
  const [calibAvgBpm, setCalibAvgBpm] = useState(75)
  const [calibMin, setCalibMin] = useState(67)
  const [calibMax, setCalibMax] = useState(108)

  // Use global telemetry hook instead of duplicating state
  const { telemetryHistory, simulateTelemetry, isWebSocketActive } = useTelemetry()
  
  const [backendSimulationCrisis, setBackendSimulationCrisis] = useState(false)

  // Effect to load theme
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true)
    }
    // Set initial representative telemetry data
    if (userRole !== 'ESPECIALISTA') {
      // Obtener el estado inicial de simulación del backend
      api.get('/monitoreo/simular-estado')
        .then(res => {
          setBackendSimulationCrisis(res.data.data.simulatedCrisisMode)
        })
        .catch(err => console.error('Error al obtener estado inicial de simulación:', err))
    }
  }, [userRole])

  const handleSimulationToggle = async (shouldCrisis) => {
    if (isWebSocketActive) {
      // WebSocket activo: alternar simulación en el backend
      try {
        const nuevoEstado = shouldCrisis ? 'CRISIS' : 'CALMA'
        const res = await api.post('/monitoreo/simular-estado', { estado: nuevoEstado })
        setBackendSimulationCrisis(res.data.data.simulatedCrisisMode)
        showToast(
          shouldCrisis
            ? '🚨 Simulación de crisis activada en el backend por WebSocket.'
            : '🟢 Simulación de crisis desactivada en el backend por WebSocket.'
        )
      } catch (err) {
        console.error(err)
        showToast('❌ Error al cambiar el estado del simulador en el backend.')
      }
    } else {
      // Fallback a simulación visual directa usando simulateTelemetry
      simulateTelemetry()
      showToast('🟢 Se inyectó un pulso de telemetría local.')
    }
  }

  // Teclas de Simulación del Frontend [S] y [C]
  useEffect(() => {
    if (userRole === 'ESPECIALISTA') return;

    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }
      
      const key = e.key.toLowerCase();
      if (key === 's') {
        handleSimulationToggle(true);
      } else if (key === 'c') {
        handleSimulationToggle(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isWebSocketActive, backendSimulationCrisis, userRole]);

  // Specialist Calibration Timer Effect
  useEffect(() => {
    let timer;
    if (calibStep === 'measuring' && calibCountdown > 0) {
      timer = setTimeout(() => {
        setCalibCountdown(prev => prev - 1)
        setCalibBpmFeed(Math.floor(Math.random() * (79 - 71 + 1) + 71))
      }, 1000)
    } else if (calibStep === 'measuring' && calibCountdown === 0) {
      const avg = 74;
      const minVal = Math.round(avg * 0.9);
      const maxVal = Math.round(avg * 1.45);
      setCalibAvgBpm(avg)
      setCalibMin(minVal)
      setCalibMax(maxVal)
      setCalibStep('completed')
    }
    return () => clearTimeout(timer)
  }, [calibStep, calibCountdown])



  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
    setIsDark(!isDark)
  }

  const openCalibration = (device) => {
    setSelectedDevice(device)
    setCalibStep('idle')
    setCalibCountdown(15)
    setCalibBpmFeed(72)
    setShowModal(true)
  }

  // Representative calculations for display
  const lastReading = telemetryHistory[telemetryHistory.length - 1] || { bpm: 72, mov: 1.2, stress: 15 }
  const currentBpm = lastReading.bpm
  const currentMov = lastReading.mov
  const currentStress = lastReading.stress

  const getMovLabel = (g) => {
    if (g < 1.2) return 'Reposo / Calma'
    if (g < 2.5) return 'Movimiento Normal'
    if (g < 5.0) return 'Juego / Activo'
    return 'Movimientos Estereotípicos (Stim)'
  }

  const getStressLabel = (s) => {
    if (s > 75) return 'Sobrecarga Sensorial (Crisis)'
    if (s > 40) return 'Agitación / Alerta Leve'
    return 'Nivel de Calma Estable'
  }

  const getStressColorClass = (s) => {
    if (s > 75) return 'text-rose-500 dark:text-rose-400'
    if (s > 40) return 'text-amber-500 dark:text-amber-400'
    return 'text-emerald-500 dark:text-emerald-400'
  }

  const getStressBgClass = (s) => {
    if (s > 75) return 'bg-rose-500/10 border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400'
    if (s > 40) return 'bg-amber-500/10 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400'
    return 'bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400'
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-6 md:p-8 flex flex-col gap-8 pb-12">

            {userRole !== 'ESPECIALISTA' ? (
              // 👪 REPRESENTANTE - COCKPIT DE SEGUIMIENTO EN VIVO
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header parent */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                      <Activity className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                      Seguimiento en Vivo
                    </h1>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
                      Paciente: {nomNino || 'Paciente'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
                      isWebSocketActive 
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isWebSocketActive ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'}`} />
                      {isWebSocketActive ? 'Simulador IoT (WebSocket)' : 'Simulador Local (Mesa)'}
                    </span>
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
                      isOnline 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                      {isOnline ? 'Pulsera En Línea' : 'Pulsera Desconectada'}
                    </span>
                    <button 
                      onClick={() => handleSimulationToggle(true)} 
                      className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full shadow-sm transition-all flex items-center gap-2 text-xs"
                    >
                      <Activity className="w-3.5 h-3.5" /> Simular Telemetría
                    </button>
                  </div>
                </div>

                {/* Grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left stats column */}
                  <div className="lg:col-span-1 space-y-6">
                    
                    {/* Heart Rate Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-center gap-4 relative overflow-hidden group">
                      <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Heart className="w-32 h-32 text-rose-500" />
                      </div>
                      <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex items-center justify-center border border-rose-100 dark:border-rose-900/40 shrink-0">
                        <Heart className="w-7 h-7 text-rose-500 animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Ritmo Cardíaco</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-3xl font-black text-slate-800 dark:text-white">{currentBpm}</span>
                          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">BPM</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Calibrado: {valMini} - {valMaxi} BPM
                        </p>
                      </div>
                    </div>

                    {/* Movement Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-center gap-4 relative overflow-hidden group">
                      <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Activity className="w-32 h-32 text-blue-500" />
                      </div>
                      <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shrink-0">
                        <Activity className="w-7 h-7 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Movimiento (G)</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-3xl font-black text-slate-800 dark:text-white">{currentMov}</span>
                          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">G</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">
                          Estado: {getMovLabel(currentMov)}
                        </p>
                      </div>
                    </div>

                    {/* Stress Index Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col gap-4 relative overflow-hidden">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 shrink-0">
                          <Brain className="w-7 h-7 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Índice de Estrés</span>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className={`text-3xl font-black ${getStressColorClass(currentStress)}`}>{currentStress}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                          <div 
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                              currentStress > 75 ? 'bg-rose-500' : currentStress > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${currentStress}%` }}
                          />
                        </div>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border inline-block ${getStressBgClass(currentStress)}`}>
                          {getStressLabel(currentStress)}
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Right graph column */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Live Line Chart */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col">
                      <div className="mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Señal de Telemetría Continua</h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Ventana deslizante de telemetría (muestras cada 10s)</p>
                      </div>

                      <div className="h-[250px] md:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#F1F5F9'} />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }} dy={10} />
                            <YAxis domain={[0, 150]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#64748B' }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1E293B' : '#FFFFFF', 
                                border: 'none', 
                                borderRadius: '8px', 
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' 
                              }}
                              itemStyle={{ fontSize: '12px', fontWeight: '500' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />
                            <Line type="monotone" dataKey="bpm" name="BPM (MAX30102)" stroke="#F43F5E" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                            <Line type="stress" dataKey="stress" name="Estrés %" stroke="#6366F1" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 2 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Hardware Diagnosis */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/60">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">Información del Hardware</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                          <Battery className="w-5 h-5 text-emerald-500 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Batería LiPo</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">85% (Autonomía de 12h)</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                          <Wifi className="w-5 h-5 text-blue-500 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">Antena Bluetooth</span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">92% (Excelente)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            ) : (
              // 🩺 ESPECIALISTA - LISTADO Y CALIBRACIÓN DE DISPOSITIVOS CLÍNICOS
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header Specialist */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                  <div>
                    <h1 className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                      <Cpu className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                      Calibración de Dispositivos
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Gestión y calibración de hardware de biotelemetría asignado a pacientes.
                    </p>
                  </div>

                  <button 
                    onClick={() => setShowNewSensorModal(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg shadow-sm transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Nuevo Sensor
                  </button>
                </div>

                {/* Grid de Dispositivos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {hardware.map((device) => {
                    const hasError = device.est_disp === 'Offline' || device.battery < 20 || device.signal < 30;

                    return (
                      <div key={device.id_hardw} className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 group">

                        {/* Card Header */}
                        <div className="p-5 flex justify-between items-start border-b border-slate-100 dark:border-slate-700">
                          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform">
                            {device.type?.includes('Pulso') || device.name?.includes('Pulso') ? (
                              <Heart className="w-6 h-6 text-rose-500 animate-pulse" />
                            ) : device.type?.includes('Aceler') || device.name?.includes('Aceler') ? (
                              <Activity className="w-6 h-6 text-indigo-500" />
                            ) : (
                              <Cpu className="w-6 h-6 text-emerald-500" />
                            )}
                          </div>

                          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${device.est_disp === 'Online'
                              ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400'
                              : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'
                            }`}>
                            {device.est_disp === 'Online' ? '● Online' : '○ Offline'}
                          </span>
                        </div>

                        {/* Card Body */}
                        <div className="p-5 flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-sm">{device.name || device.type}</h3>
                          <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-5 bg-slate-100 dark:bg-slate-700/50 inline-block px-2 py-0.5 rounded">
                            ID: {device.id_hardw}
                          </p>

                          <div className="space-y-4">
                            {/* Batería */}
                            <div>
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                  <Battery className="w-3.5 h-3.5" />
                                  Batería
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{device.battery}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div className={`h-2 rounded-full transition-all duration-500 ${device.battery > 50 ? 'bg-green-500' : device.battery > 20 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${device.battery}%` }}></div>
                              </div>
                            </div>

                            {/* Señal */}
                            <div>
                              <div className="flex justify-between text-xs mb-1.5">
                                <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                  <Wifi className="w-3.5 h-3.5" />
                                  Señal
                                </span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{device.signal}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                <div className={`h-2 rounded-full transition-all duration-500 ${device.signal > 70 ? 'bg-blue-500' : device.signal > 30 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${device.signal}%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer (Action) */}
                        <div className="p-4 border-t border-slate-150 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                          <button
                            onClick={() => openCalibration(device)}
                            className="w-full py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                          >
                            <ShieldCheck className="w-4 h-4 text-brand-500" />
                            Calibrar Sensor
                          </button>
                        </div>

                      </div>
                    )
                  })}
                </div>

              </div>
            )}

          </div>
        </div>
      </main>

      {/* Modal / Dialog (Simulated Calibration Baseline Dialog) */}
      {showModal && selectedDevice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            
            <div className="px-6 py-5 border-b border-slate-150 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <h3 className="text-base font-bold text-slate-850 dark:text-white">Calibración de Línea Base</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">MAX30102 + MPU6050 • ID: {selectedDevice.id_hardw}</p>
              </div>
              <button 
                onClick={() => {
                  setCalibStep('idle')
                  setShowModal(false)
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {calibStep === 'idle' && (
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Prueba de Pulso en Reposo</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      Determinaremos la firma fisiológica en calma del paciente. Coloque el wearable al niño y pídale que permanezca en reposo por 15 segundos.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs flex justify-around">
                    <div>
                      <span className="text-slate-400 block mb-0.5 font-medium">Umbral Mín</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{valMini} BPM</span>
                    </div>
                    <div className="border-r border-slate-200 dark:border-slate-700 h-6"></div>
                    <div>
                      <span className="text-slate-400 block mb-0.5 font-medium">Umbral Máx</span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">{valMaxi} BPM</span>
                    </div>
                  </div>
                </div>
              )}

              {calibStep === 'measuring' && (
                <div className="space-y-6 text-center py-4">
                  <div className="relative flex justify-center items-center">
                    <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-rose-400 opacity-20"></span>
                    <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-rose-500/30 z-10 animate-pulse">
                      {calibBpmFeed}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      Leyendo sensor fisiológico...
                    </div>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Tiempo restante: <span className="font-black text-slate-800 dark:text-white font-mono text-sm">{calibCountdown}s</span>
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-blue-600 h-1.5 transition-all duration-300" style={{ width: `${((15 - calibCountdown) / 15) * 100}%` }}></div>
                  </div>
                </div>
              )}

              {calibStep === 'completed' && (
                <div className="space-y-5">
                  <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 p-4 rounded-xl flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">Calibración Exitosa</h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                        Se ha procesado la telemetría en reposo. El algoritmo determinó los siguientes valores óptimos para este niño:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-150 dark:border-slate-805 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Reposo Basal</span>
                      <span className="text-sm font-black text-slate-800 dark:text-white mt-1 block">{calibAvgBpm} <span className="text-[9px] font-medium text-slate-400">BPM</span></span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-150 dark:border-slate-805 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Min (90%)</span>
                      <span className="text-sm font-black text-rose-500 mt-1 block">{calibMin} <span className="text-[9px] font-medium text-slate-400">BPM</span></span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-150 dark:border-slate-805 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">Max (145%)</span>
                      <span className="text-sm font-black text-indigo-500 mt-1 block">{calibMax} <span className="text-[9px] font-medium text-slate-400">BPM</span></span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    * Nota: Si el ritmo cardíaco del niño supera los {calibMax} BPM en reposo sin registrar aceleración en el MPU6050, se disparará una alerta predictiva en el hogar.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-150 dark:border-slate-800/60 flex justify-end gap-3">
              {calibStep === 'idle' && (
                <>
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      setCalibCountdown(15)
                      setCalibStep('measuring')
                    }} 
                    className="px-4 py-2 font-semibold text-xs bg-brand-500 text-white hover:bg-blue-600 rounded-lg shadow-sm transition-colors"
                  >
                    Iniciar Calibración
                  </button>
                </>
              )}

              {calibStep === 'measuring' && (
                <button 
                  onClick={() => setCalibStep('idle')} 
                  className="px-4 py-2 font-semibold text-xs text-rose-600 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                >
                  Cancelar Prueba
                </button>
              )}

              {calibStep === 'completed' && (
                <>
                  <button 
                    onClick={() => {
                      setCalibStep('idle')
                      setCalibCountdown(15)
                    }} 
                    className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Repetir
                  </button>
                  <button 
                    onClick={() => {
                      saveCalibrationBaseline(calibAvgBpm)
                      setShowModal(false)
                    }} 
                    className="px-4 py-2 font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    Guardar y Aplicar Umbrales
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Modal / Dialog (New Sensor) */}
      {showNewSensorModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-150 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <h3 className="text-base font-bold text-slate-850 dark:text-white">Añadir Nuevo Sensor</h3>
              <button 
                onClick={() => setShowNewSensorModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Nombre del Sensor</label>
                <input 
                  type="text" 
                  value={newSensorForm.name}
                  onChange={(e) => setNewSensorForm({...newSensorForm, name: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-200 transition-all"
                  placeholder="Ej: Sensor Movimiento Brazo"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Tipo de Dispositivo</label>
                <select 
                  value={newSensorForm.type}
                  onChange={(e) => setNewSensorForm({...newSensorForm, type: e.target.value})}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 dark:text-slate-200 transition-all"
                >
                  <option value="Pulsera Biométrica MAX30102">Pulsera Biométrica (Pulso/O2)</option>
                  <option value="Acelerómetro MPU6050">Acelerómetro MPU6050 (Movimiento)</option>
                  <option value="Sensor Temperatura MLX90614">Sensor Temperatura</option>
                  <option value="Módulo EEG Base">Casco EEG Básico</option>
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-150 dark:border-slate-800/60 flex justify-end gap-3">
              <button 
                onClick={() => setShowNewSensorModal(false)} 
                className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if(!newSensorForm.name.trim()) {
                    showToast('⚠️ Debes ingresar un nombre para el sensor');
                    return;
                  }
                  addHardware(newSensorForm);
                  setShowNewSensorModal(false);
                  setNewSensorForm({ name: '', type: 'Pulsera Biométrica MAX30102' });
                }} 
                className="px-4 py-2 font-semibold text-xs bg-brand-500 hover:bg-blue-600 text-white rounded-lg shadow-sm transition-colors"
              >
                Crear Sensor
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
