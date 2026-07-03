import { useState } from 'react'
import Sidebar from '../components/layout/Sidebar'
import Topbar from '../components/layout/Topbar'
import { useGlobalContext } from '../context/GlobalState'
import {
  Activity, Bell, AlertTriangle, NotebookPen, CheckSquare, Wind, Grid, LayoutDashboard, CalendarPlus, Download, Calendar
} from 'lucide-react'
import api from '../api/axios'
import PedirCitaModal from '../components/parent/PedirCitaModal'
import Footer from '../components/layout/Footer'
import CalendarioCitas from '../components/shared/CalendarioCitas'
import { exportDashboardReport } from '../utils/pdfExporter'

import { useTelemetry } from '../hooks/useTelemetry'
import { useClinicalData } from '../hooks/useClinicalData'

import ChildStatusBanner from '../components/dashboard/ChildStatusBanner'
import DaySummary from '../components/dashboard/DaySummary'
import BreathingProtocolModal from '../components/dashboard/BreathingProtocolModal'
import AacBoardDrawer from '../components/dashboard/AacBoardDrawer'

export default function MainDashboard() {
  const { nomNino, navigate, weeklyGoal, isDark, userRole, userName, homeHistoricalData, routines, showToast } = useGlobalContext()
  const [showBreathing, setShowBreathing] = useState(false)
  const [showAac, setShowAac] = useState(false)
  const [showCalendario, setShowCalendario] = useState(false)
  const [exporting, setExporting] = useState(false)

  const { liveBpm, liveStress, liveMov, isWebSocketActive } = useTelemetry()
  const { alertsList } = useClinicalData()

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
      alert('Solicitud de cita enviada con éxito')
      setShowCitaModal(false)
      setCitaData({ esp_codi: especialistasCita.length > 0 ? especialistasCita[0].esp_codi : '', fecha: '', hora: '', tipo: 'Consulta Regular', notas: '' })
    } catch (err) {
      alert(err.response?.data?.error ? err.response.data.error : 'Error al solicitar cita')
    }
  }

  const handleExportDashboard = async () => {
    setExporting(true)
    try {
      const crisisCount = alertsList?.length || 0
      const kpis = [
        { label: 'Estado actual', value: liveStress <= 50 ? 'Calma' : liveStress <= 75 ? 'Inquieto' : 'Crisis' },
        { label: 'Pulso', value: `${liveBpm} BPM` },
        { label: 'Pulsera', value: isWebSocketActive ? 'Conectada' : 'Desconectada' },
        { label: 'Alertas', value: crisisCount.toString() },
      ]
      await exportDashboardReport({
        userName,
        userRole,
        paciente: nomNino || 'No asignado',
        kpis,
        alerts: (alertsList || []).map(a => ({
          time: a.ale_time,
          message: `Alerta: ${(a.ale_meto || '').replace(/_/g, ' ')}`
        })),
        titulo: 'Reporte del Dashboard',
      })
    } catch (err) {
      console.error('Error al exportar:', err)
    } finally {
      setExporting(false)
    }
  }

  const finalAlerts = (alertsList || []).map(a => ({
    id: a.ale_codi,
    time: new Date(a.ale_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    type: 'warning',
    message: `Alerta: ${a.ale_meto.replace(/_/g, ' ')}`,
    icon: AlertTriangle
  }))

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning': return 'text-amber-500 bg-amber-100 dark:bg-amber-900/30'
      case 'success': return 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30'
      case 'info': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30'
      default: return 'text-slate-500 bg-slate-100 dark:bg-slate-800'
    }
  }

  const homeData = homeHistoricalData?.[homeHistoricalData.length - 1]

  const agendaHoy = (routines || []).slice(0, 4)

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1200px] w-full mx-auto p-6 md:p-8 flex flex-col gap-6 pb-12">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2">
                  <LayoutDashboard className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                  Inicio
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Paciente: <span className="font-semibold text-slate-700 dark:text-slate-300">{nomNino || 'No Asignado'}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportDashboard}
                  disabled={exporting}
                  className="px-3 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold rounded-lg border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all flex items-center gap-1.5 text-xs disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" /> {exporting ? 'Generando...' : 'Reporte'}
                </button>
                <button
                  onClick={() => setShowCalendario(!showCalendario)}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-semibold rounded-lg transition-all flex items-center gap-1.5 text-xs"
                >
                  <Calendar className="w-3.5 h-3.5" /> Calendario
                </button>
                <button
                  onClick={() => { setShowCitaModal(true); fetchEspecialistasCita() }}
                  className="px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg transition-all flex items-center gap-1.5 text-xs"
                >
                  <CalendarPlus className="w-3.5 h-3.5" /> Pedir Cita
                </button>
                <button
                  onClick={() => navigate('diario_hogar')}
                  className="px-3 py-2 bg-brand-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-all flex items-center gap-1.5 text-xs"
                >
                  <NotebookPen className="w-3.5 h-3.5" /> Diario de Hoy
                </button>
              </div>
            </div>

            {showCalendario && <CalendarioCitas citas={[]} />}

            {/* Estado del niño */}
            <ChildStatusBanner
              liveBpm={liveBpm}
              liveStress={liveStress}
              liveMov={liveMov}
              isWebSocketActive={isWebSocketActive}
              nomNino={nomNino}
            />

            {/* Cuerpo: dos columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 flex flex-col gap-6">
                <DaySummary
                  homeData={homeData}
                  agenda={agendaHoy}
                  indicacion={weeklyGoal}
                  onNavigate={navigate}
                />

                {/* Foco Clínico */}
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60">
                  <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded uppercase tracking-wider">
                    Foco Clínico de la Semana
                  </span>
                  <h4 className="text-base font-bold text-slate-800 dark:text-white tracking-tight mt-3">
                    "{weeklyGoal}"
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">Establecido por tu especialista</p>
                  <button
                    onClick={() => navigate('agenda')}
                    className="mt-4 px-5 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                  >
                    <CheckSquare className="w-4 h-4" /> Ver Agenda del Día
                  </button>
                </div>
              </div>

              {/* Columna derecha */}
              <div className="flex flex-col gap-6">
                {/* Zona SOS */}
                <div className="bg-gradient-to-br from-[#011C3F] via-[#023A7A] to-[#034EA1] rounded-2xl p-5 border border-blue-800/40 text-white shadow-xl shadow-blue-900/20">
                  <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-rose-400 uppercase">
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                    SOS Sensorial
                  </div>
                  <p className="text-[11px] text-blue-200/80 mt-2 leading-relaxed">
                    Herramientas de auxilio inmediato.
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={() => setShowBreathing(true)}
                      className="py-3 px-3 bg-rose-500/80 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all flex flex-col items-center justify-center gap-1.5 border border-rose-400/20 hover:scale-[1.02]"
                    >
                      <Wind className="w-5 h-5" /> Respiración
                    </button>
                    <button
                      onClick={() => setShowAac(true)}
                      className="py-3 px-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all border border-white/15 flex flex-col items-center justify-center gap-1.5 hover:scale-[1.02]"
                    >
                      <Grid className="w-5 h-5 text-blue-300" /> Tablero AAC
                    </button>
                  </div>
                </div>

                {/* Últimos Eventos */}
                <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col max-h-[260px]">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-slate-400" /> Últimos Eventos
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
                    {finalAlerts.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">Sin eventos recientes</p>
                    ) : (
                      finalAlerts.slice(0, 4).map((alert) => {
                        const IconComponent = alert.icon
                        return (
                          <div key={alert.id} className="flex gap-2 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                            <div className={`p-1.5 rounded-lg shrink-0 h-fit ${getAlertColor(alert.type)}`}>
                              <IconComponent className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">{alert.message}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{alert.time}</span>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Wearable */}
                <div className="bg-gradient-to-br from-[#0B2545] via-[#134074] to-[#0B2545] rounded-2xl p-5 shadow-xl border border-blue-800/40 text-white">
                  <div className="flex justify-between items-center">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider opacity-90 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Pulsera IoT
                    </h3>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full ${isWebSocketActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                      {isWebSocketActive ? 'Conectada' : 'Desconectada'}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-[11px]">
                    <div className="flex justify-between py-1 border-b border-white/10">
                      <span className="text-blue-200">Batería</span>
                      <span className="font-semibold text-emerald-400">85%</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-blue-200">Señal</span>
                      <span className="font-semibold text-emerald-400">Excelente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
          <Footer />
        </div>
      </main>

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
