import { useState, useEffect, useMemo, useCallback } from 'react'
import Sidebar from './Sidebar'
import { useGlobalContext } from '../context/GlobalState'
import { 
  FileText, AlertCircle, Users, FilePlus
} from 'lucide-react'
import Topbar from './Topbar'
import api from '../api/axios'

// Subcomponents
import SpecialistGlobalView from './specialist/SpecialistGlobalView'
import PatientPeiGoals from './specialist/PatientPeiGoals'
import PatientSensoryChart from './specialist/PatientSensoryChart'
import PatientBehaviorChart from './specialist/PatientBehaviorChart'
import SoapNoteModal from './specialist/SoapNoteModal'
import IncidentModal from './specialist/IncidentModal'
import IndicacionModal from './specialist/IndicacionModal'
import { DashboardSkeleton } from './dashboard/Skeleton'

export default function SpecialistDashboard() {
  const { navigate, userName, listaNinos, selectedChildId, setSelectedChildId, setNomNino, showToast, crearIndicacion, clinicalAlerts = [], globalPeiGoals = [], incrementPeiTrial, isDark } = useGlobalContext()
  const [loading, setLoading] = useState(true)
  
  // Modals state
  const [showSoapModal, setShowSoapModal] = useState(false)
  const [showIncidentModal, setShowIncidentModal] = useState(false)
  const [showIndicacionModal, setShowIndicacionModal] = useState(false)
  const [indicacionText, setIndicacionText] = useState('')
  
  // Form States
  const [soapData, setSoapData] = useState({ s: '', o: '', a: '', p: '' })
  const [incidentData, setIncidentData] = useState({ 
    tipo: 'Berrinche', 
    duracion: '5 min', 
    detonante: 'Ruido', 
    rutina: 'Ninguna',
    observacion: '' 
  })

  // Patient context memoizado
  const activeChild = useMemo(() => {
    return listaNinos.find(n => n.id_ninos === selectedChildId) || null
  }, [listaNinos, selectedChildId])

  // ==== MOCK DATA: GLOBAL ====
  const globalStats = useMemo(() => ({
    pacientesActivos: listaNinos.length || 0,
    citasHoy: 0,
    alertasPendientes: 0,
    porcentajeCumplimiento: 0
  }), [listaNinos.length])

  const [agendaHoy, setAgendaHoy] = useState([])

  const fetchAgenda = useCallback(async () => {
    try {
      const res = await api.get('/citas/agenda-hoy')
      setAgendaHoy(res.data.data)
    } catch (err) {
      console.error('Error fetching agenda:', err)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 700)
    return () => clearTimeout(timer)
  }, [selectedChildId])

  useEffect(() => {
    if (!activeChild) {
      fetchAgenda()
    }
  }, [activeChild, fetchAgenda])

  const handleCompleteCita = async (id) => {
    try {
      await api.patch(`/citas/${id}/estado`, { estado: 'Completada' })
      showToast('✅ Cita completada con éxito')
      fetchAgenda()
    } catch (err) {
      console.error(err)
      showToast('❌ Error al completar cita')
    }
  }

  const globalAlertsFeed = []

  // ==== DATOS DEL PACIENTE (MEMOIZADOS) ====
  
  const peiGoals = useMemo(() => globalPeiGoals.map(g => ({
    id: g.met_codi,
    text: g.met_desc,
    progress: g.met_prog,
    trials: g.met_trial,
    totalTrials: g.met_ttria
  })), [globalPeiGoals]);

  // Historial Conductual (BarChart) - Optimizado para evitar recálculos en re-renders
  const behaviorHistory = useMemo(() => {
    if (!activeChild) return [];
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const histMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      histMap[d.toISOString().substring(0, 10)] = { dia: diasSemana[d.getDay()], Berrinche: 0, Estereotipia: 0, Agresión: 0 };
    }

    clinicalAlerts.forEach(alert => {
      if (!alert.fec_hora) return;
      const dateStr = new Date(alert.fec_hora).toISOString().substring(0, 10);
      if (histMap[dateStr] && histMap[dateStr][alert.est_dete] !== undefined) {
        histMap[dateStr][alert.est_dete] += 1;
      }
    });

    return Object.values(histMap);
  }, [clinicalAlerts, activeChild]);

  // Análisis Sensorial (PieChart) - Optimizado
  const sensoryData = useMemo(() => {
    if (!activeChild) return [];
    const sensoryCount = {};
    clinicalAlerts.forEach(alert => {
      if (alert.est_dete) {
        sensoryCount[alert.est_dete] = (sensoryCount[alert.est_dete] || 0) + 1;
      }
    });

    const colors = ['#3B82F6', '#F59E0B', '#10B981', '#F43F5E', '#8B5CF6'];
    return Object.keys(sensoryCount).length > 0 
      ? Object.keys(sensoryCount).map((key, i) => ({
          name: key,
          value: sensoryCount[key],
          color: colors[i % colors.length]
        }))
      : [{ name: 'Sin eventos', value: 1, color: '#e2e8f0' }];
  }, [clinicalAlerts, activeChild]);

  // ==== HANDLERS ====
  const handleSoapSubmit = async (e) => {
    e.preventDefault()
    if (!activeChild) return
    try {
      await api.post(`/ninos/${activeChild.id_ninos}/soap`, soapData)
      setShowSoapModal(false)
      setSoapData({ s: '', o: '', a: '', p: '' })
      showToast("✅ Nota SOAP registrada en el expediente clínico.")
    } catch (err) {
      showToast("❌ Error al guardar la nota SOAP.")
    }
  }

  const handleIncidentSubmit = async (e) => {
    e.preventDefault()
    if (!activeChild) return
    try {
      await api.post(`/ninos/${activeChild.id_ninos}/incidentes`, incidentData)
      setShowIncidentModal(false)
      setIncidentData({ tipo: 'Berrinche', duracion: '5 min', detonante: 'Ruido', rutina: 'Ninguna', observacion: '' })
      showToast("🚨 Incidente conductual registrado y tabulado.")
    } catch (err) {
      showToast("❌ Error al registrar el incidente.")
    }
  }

  const handleIndicacionSubmit = async (e) => {
    e.preventDefault()
    if (!indicacionText.trim()) return
    try {
      await crearIndicacion(selectedChildId, indicacionText)
      setShowIndicacionModal(false)
      setIndicacionText('')
      showToast("✅ Indicación médica guardada y compartida con el representante.")
    } catch (error) {
      showToast("❌ Error al guardar la indicación.")
    }
  }

  const handleIncrementPeiTrial = async (id) => {
    try {
      await incrementPeiTrial(id, selectedChildId)
    } catch (err) {
      showToast("❌ Error al actualizar progreso de la meta.")
    }
  }

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-6 md:p-8 flex flex-col gap-8 pb-12">
            
            {/* Header Title Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                  <Users className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                  {activeChild ? `Panel Clínico: ${activeChild.nom_nino} ${activeChild.ape_nino}` : 'Panel Global de Especialista'}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {activeChild 
                    ? 'Seguimiento de progreso PEI, registro conductual y detonantes sensoriales.' 
                    : 'Resumen de pacientes, agenda del día y alertas generales.'}
                </p>
              </div>
              
              {activeChild && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowIncidentModal(true)}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 font-bold text-[11px] rounded flex items-center gap-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    Registrar Incidente
                  </button>
                  <button 
                    onClick={() => setShowIndicacionModal(true)}
                    className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-[11px] rounded flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    <FilePlus className="w-3.5 h-3.5" />
                    Anotar Indicación
                  </button>
                  <button 
                    onClick={() => setShowSoapModal(true)}
                    className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-[11px] rounded flex items-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Nota SOAP
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <DashboardSkeleton />
            ) : (
              <>
                {/* ==== VISTA GLOBAL ==== */}
                {!activeChild && (
                  <SpecialistGlobalView 
                    globalStats={globalStats}
                    agendaHoy={agendaHoy}
                    globalAlertsFeed={globalAlertsFeed}
                    setSelectedChildId={setSelectedChildId}
                    setNomNino={setNomNino}
                    handleCompleteCita={handleCompleteCita}
                  />
                )}

                {/* ==== VISTA DE PACIENTE SELECCIONADO ==== */}
                {activeChild && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-8 pt-0 w-full max-w-[1400px] mx-auto animate-in slide-in-from-bottom-5 duration-300 delay-150">
                      <PatientPeiGoals 
                        peiGoals={peiGoals} 
                        incrementPeiTrial={handleIncrementPeiTrial} 
                      />
                      <PatientSensoryChart 
                        sensoryData={sensoryData}
                        isDark={isDark}
                      />
                    </div>

                    <PatientBehaviorChart 
                      behaviorHistory={behaviorHistory}
                      isDark={isDark}
                    />
                  </div>
                )}
              </>
            )}

          </div>
        </div>
      </main>

      {/* ==== MODALS ==== */}
      {showSoapModal && (
        <SoapNoteModal 
          showSoapModal={showSoapModal}
          setShowSoapModal={setShowSoapModal}
          activeChild={activeChild}
          soapData={soapData}
          setSoapData={setSoapData}
          handleSoapSubmit={handleSoapSubmit}
        />
      )}

      {showIncidentModal && (
        <IncidentModal 
          showIncidentModal={showIncidentModal}
          setShowIncidentModal={setShowIncidentModal}
          incidentData={incidentData}
          setIncidentData={setIncidentData}
          handleIncidentSubmit={handleIncidentSubmit}
        />
      )}

      <IndicacionModal 
        showIndicacionModal={showIndicacionModal}
        setShowIndicacionModal={setShowIndicacionModal}
        indicacionText={indicacionText}
        setIndicacionText={setIndicacionText}
        handleIndicacionSubmit={handleIndicacionSubmit}
        activeChild={activeChild}
      />
    </div>
  )
}
