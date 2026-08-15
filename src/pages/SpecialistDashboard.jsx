import { useState, useEffect, useMemo, useRef } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useGlobalContext } from "../context/GlobalState";
import {
  AlertCircle,
  Users,
  FilePlus,
  FileText,
  TrendingUp,
  Download,
} from "lucide-react";
import Topbar from "../components/layout/Topbar";
import api from "../api/axios";
import Footer from "../components/layout/Footer";
import { exportDashboardReport } from "../utils/pdfExporter";

// Subcomponents
import SpecialistGlobalView from "../components/specialist/SpecialistGlobalView";
import PatientPeiGoals from "../components/specialist/PatientPeiGoals";
import PatientSensoryChart from "../components/specialist/PatientSensoryChart";
import PatientBehaviorChart from "../components/specialist/PatientBehaviorChart";
import IncidentModal from "../components/specialist/IncidentModal";
import IndicacionModal from "../components/specialist/IndicacionModal";
import SoapNoteModal from "../components/specialist/SoapNoteModal";
import PatientCrisisLog from "../components/specialist/PatientCrisisLog";
import LoadingState from "../components/dashboard/LoadingState";

// Hooks
import { useTelemetry } from "../hooks/useTelemetry";

const mockPeiGoals = [
  {
    id: "MOCK1",
    goal: "Mantener contacto visual 5 segundos",
    category: "Social",
    progress: 45,
    trials: 9,
    totalTrials: 20,
  },
  {
    id: "MOCK2",
    goal: "Señalar objetos con el dedo índice",
    category: "Motor",
    progress: 70,
    trials: 14,
    totalTrials: 20,
  },
  {
    id: "MOCK3",
    goal: "Seguir instrucciones de dos pasos",
    category: "Cognitivo",
    progress: 30,
    trials: 6,
    totalTrials: 20,
  },
  {
    id: "MOCK4",
    goal: "Realizar transiciones sin berrinche",
    category: "Conductual",
    progress: 55,
    trials: 11,
    totalTrials: 20,
  },
];

export default function SpecialistDashboard() {
  const {
    navigate,
    userName,
    listaNinos,
    selectedChildId,
    showToast,
    crearIndicacion,
    clinicalAlerts = [],
    globalPeiGoals = [],
    incrementPeiTrial,
    crearPeiGoal,
    crisisAlerts = [],
    crisisTelemetryMap = {},
    isDark,
    userRole,
  } = useGlobalContext();
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showIndicacionModal, setShowIndicacionModal] = useState(false);
  const [indicacionText, setIndicacionText] = useState({});
  const [showSoapModal, setShowSoapModal] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  // Local state for mock PEI goals (editable)
  const [localMockPeiGoals, setLocalMockPeiGoals] = useState(mockPeiGoals);

  // Form States
  const [incidentData, setIncidentData] = useState({
    inc_tipo: "",
    inc_dura: "",
    inc_deto: "",
    inc_seve: "",
    inc_ruti: "",
    inc_conse: "",
    inc_inter: "",
    inc_resu: "",
    inc_obse: "",
  });

  // Patient context memoizado
  const activeChild = useMemo(() => {
    return listaNinos.find((n) => n.id_ninos === selectedChildId) || null;
  }, [listaNinos, selectedChildId]);

  // ==== MOCK DATA: GLOBAL ====
  const globalStats = useMemo(
    () => ({
      pacientesActivos: listaNinos.length || 0,
      alertasPendientes: 0,
      porcentajeCumplimiento: 0,
    }),
    [listaNinos.length],
  );

  // Telemetry for testing
  const { isWebSocketActive } = useTelemetry();

  // View state
  const [exporting, setExporting] = useState(false);
  const loadingTimerRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    loadingTimerRef.current = setTimeout(() => setLoading(false), 700);
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [selectedChildId]);

  const globalAlertsFeed = [];

  const mockAlerts = [
    {
      fec_hora: new Date(Date.now() - 86400000),
      est_dete: "Berrinche",
      bpm_max: 130,
      mov_max: 8,
      stress_index: 85,
    },
    {
      fec_hora: new Date(Date.now() - 172800000),
      est_dete: "Estereotipia",
      bpm_max: 100,
      mov_max: 6,
      stress_index: 45,
    },
    {
      fec_hora: new Date(Date.now() - 259200000),
      est_dete: "Agresión",
      bpm_max: 120,
      mov_max: 9,
      stress_index: 78,
    },
    {
      fec_hora: new Date(Date.now() - 345600000),
      est_dete: "Estereotipia",
      bpm_max: 95,
      mov_max: 5,
      stress_index: 40,
    },
    {
      fec_hora: new Date(Date.now() - 432000000),
      est_dete: "Berrinche",
      bpm_max: 125,
      mov_max: 7,
      stress_index: 72,
    },
    {
      fec_hora: new Date(Date.now() - 518400000),
      est_dete: "Ansiedad",
      bpm_max: 110,
      mov_max: 3,
      stress_index: 60,
    },
    {
      fec_hora: new Date(Date.now() - 604800000),
      est_dete: "Estereotipia",
      bpm_max: 92,
      mov_max: 4,
      stress_index: 35,
    },
  ];

  // ==== DATOS DEL PACIENTE (MEMOIZADOS) ====

  const peiGoals = useMemo(() => {
    if (globalPeiGoals.length > 0) {
      return globalPeiGoals.map((g) => ({
        id: g.met_codi,
        goal: g.met_desc,
        category: g.met_categ || "General",
        progress: g.met_prog,
        trials: g.met_trial,
        totalTrials: g.met_ttria,
        criterio: g.met_crit || null,
        fechas: g.met_fini
          ? `${g.met_fini?.substring?.(0, 10) || new Date(g.met_fini).toISOString().substring(0, 10)} → ${g.met_ffin ? g.met_ffin?.substring?.(0, 10) || new Date(g.met_ffin).toISOString().substring(0, 10) : "Sin límite"}`
          : null,
      }));
    }
    return activeChild ? localMockPeiGoals : [];
  }, [globalPeiGoals, activeChild, localMockPeiGoals]);

  const alertsSource = clinicalAlerts.length > 0 ? clinicalAlerts : mockAlerts;

  // Historial Conductual (BarChart) - Optimizado para evitar recálculos en re-renders
  const behaviorHistory = useMemo(() => {
    if (!activeChild) return [];
    const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const histMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      histMap[d.toISOString().substring(0, 10)] = {
        dia: diasSemana[d.getDay()],
        Berrinche: 0,
        Estereotipia: 0,
        Agresión: 0,
      };
    }

    alertsSource.forEach((alert) => {
      if (!alert.fec_hora) return;
      const dateStr = new Date(alert.fec_hora).toISOString().substring(0, 10);
      if (histMap[dateStr] && histMap[dateStr][alert.est_dete] !== undefined) {
        histMap[dateStr][alert.est_dete] += 1;
      }
    });

    const result = Object.values(histMap);
    const totalCount = result.reduce(
      (sum, d) => sum + d.Berrinche + d.Estereotipia + d.Agresión,
      0,
    );
    return totalCount === 0 ? [] : result;
  }, [alertsSource, activeChild]);

  // Análisis Sensorial (PieChart) - Optimizado
  const sensoryData = useMemo(() => {
    if (!activeChild) return [];
    const sensoryCount = {};
    alertsSource.forEach((alert) => {
      if (alert.est_dete) {
        sensoryCount[alert.est_dete] = (sensoryCount[alert.est_dete] || 0) + 1;
      }
    });

    const colors = ["#3B82F6", "#F59E0B", "#10B981", "#F43F5E", "#8B5CF6"];
    return Object.keys(sensoryCount).length > 0
      ? Object.keys(sensoryCount).map((key, i) => ({
          name: key,
          value: sensoryCount[key],
          color: colors[i % colors.length],
        }))
      : [{ name: "Sin eventos", value: 1, color: "#e2e8f0" }];
  }, [alertsSource, activeChild]);

  // ==== HANDLERS ====
  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    if (!activeChild) return;
    if (
      !incidentData.inc_tipo ||
      !incidentData.inc_dura ||
      !incidentData.inc_deto ||
      !incidentData.inc_seve
    ) {
      showToast("⚠️ Completa tipo, duración, detonante y severidad.");
      return;
    }
    try {
      await api.post(
        `/especialista/incidentes/${activeChild.id_ninos}`,
        incidentData,
      );
      setShowIncidentModal(false);
      setIncidentData({
        inc_tipo: "",
        inc_dura: "",
        inc_deto: "",
        inc_seve: "",
        inc_ruti: "",
        inc_conse: "",
        inc_inter: "",
        inc_resu: "",
        inc_obse: "",
      });
      showToast("🚨 Incidente conductual registrado y tabulado.");
    } catch (err) {
      showToast("❌ Error al registrar el incidente.");
    }
  };

  const handleIndicacionSubmit = async (e) => {
    e.preventDefault();
    const ind_desc = (indicacionText.ind_desc || "").trim();
    if (!ind_desc || !indicacionText.ind_tipo) {
      showToast("⚠️ Completa el tipo y la descripción de la indicación.");
      return;
    }
    try {
      await crearIndicacion(selectedChildId, {
        ind_tipo: indicacionText.ind_tipo,
        ind_area: indicacionText.ind_area || "General",
        ind_frec: indicacionText.ind_frec || "Solo en sesión",
        ind_dura: indicacionText.ind_dura || null,
        ind_prio: indicacionText.ind_prio || "Media",
        ind_vige: indicacionText.ind_vige || null,
        ind_desc,
      });
      setShowIndicacionModal(false);
      setIndicacionText({});
      showToast(
        "✅ Indicación clínica guardada y compartida con el representante.",
      );
    } catch (error) {
      showToast("❌ Error al guardar la indicación.");
    }
  };

  const handleSoapSave = async (soapData) => {
    try {
      await api.post("/especialista/soap", {
        nin_codi: selectedChildId,
        ...soapData,
      });
      showToast("📋 Nota clínica SOAP guardada en el expediente.");
    } catch (err) {
      showToast("❌ Error al guardar la nota SOAP.");
      throw err;
    }
  };

  const handleCreatePeiGoal = async (goalData) => {
    try {
      await crearPeiGoal(selectedChildId, goalData);
      showToast("🎯 Meta PEI creada correctamente.");
    } catch (err) {
      showToast("❌ Error al crear la meta PEI.");
      throw err;
    }
  };

  const handleExportDashboard = async () => {
    setExporting(true);
    try {
      const kpis = [
        { label: "Pacientes activos", value: listaNinos.length.toString() },
        { label: "Metas PEI", value: peiGoals.length.toString() },
        { label: "Alertas", value: alertsSource.length.toString() },
        {
          label: "WebSocket",
          value: isWebSocketActive ? "Conectado" : "Desconectado",
        },
      ];
      await exportDashboardReport({
        userName,
        userRole,
        paciente: activeChild
          ? `${activeChild.nom_nino} ${activeChild.ape_nino}`
          : "Vista global",
        kpis,
        alerts: clinicalAlerts,
        titulo: "Reporte del Dashboard — Especialista",
        fechaInicio: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error("Error al exportar:", err);
    } finally {
      setExporting(false);
    }
  };

  const handleIncrementPeiTrial = async (id) => {
    if (id.toString().startsWith("MOCK")) {
      setLocalMockPeiGoals((prev) =>
        prev.map((g) =>
          g.id === id
            ? {
                ...g,
                trials: Math.min(g.totalTrials, g.trials + 1),
                progress: Math.min(
                  100,
                  Math.round(((g.trials + 1) / g.totalTrials) * 100),
                ),
              }
            : g,
        ),
      );
      return;
    }
    try {
      await incrementPeiTrial(id, selectedChildId);
    } catch (err) {
      showToast("❌ Error al actualizar progreso de la meta.");
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-6 md:p-8 flex flex-col gap-8 pb-12">
            {/* Header Title Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2 md:gap-3 transition-colors">
                  <Users className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                  {activeChild
                    ? `Panel Clínico: ${activeChild.nom_nino} ${activeChild.ape_nino}`
                    : `Bienvenido, ${userName || "Especialista"}`}
                </h1>
                <p className="text-subtitle-muted mt-1">
                  {activeChild
                    ? "Seguimiento de progreso PEI, registro conductual y detonantes sensoriales."
                    : "Resumen de pacientes, metas PEI y alertas generales."}
                </p>
              </div>

              {activeChild ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportDashboard}
                    disabled={exporting}
                    className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] rounded flex items-center gap-1.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />{" "}
                    {exporting ? "..." : "Reporte PDF"}
                  </button>
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
                    className="px-3 py-1.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 font-bold text-[11px] rounded flex items-center gap-1.5 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Nota SOAP
                  </button>
                  <button
                    onClick={() => navigate("historial")}
                    className="px-4 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold text-xs rounded shadow flex items-center gap-2 transition-colors"
                  >
                    <TrendingUp className="w-4 h-4" />
                    Ver Historial Completo
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportDashboard}
                    disabled={exporting}
                    className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold rounded-lg shadow-sm border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />{" "}
                    {exporting ? "Generando..." : "Generar Reporte"}
                  </button>
                </div>
              )}
            </div>

            {/* Vistas Dinámicas */}
            {loading ? (
              <LoadingState variant="dashboard" role={userRole} />
            ) : (
              <>
                {/* ==== VISTA GLOBAL ==== */}
                {!activeChild && (
                  <SpecialistGlobalView
                    globalStats={globalStats}
                    globalAlertsFeed={globalAlertsFeed}
                  />
                )}

                {/* ==== VISTA DE PACIENTE SELECCIONADO ==== */}
                {activeChild && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-bottom-5 duration-300 delay-150">
                      <PatientPeiGoals
                        peiGoals={peiGoals}
                        incrementPeiTrial={handleIncrementPeiTrial}
                        onCreateGoal={handleCreatePeiGoal}
                        activeChild={activeChild}
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

                    {crisisAlerts.length > 0 && (
                      <PatientCrisisLog
                        alertas={crisisAlerts}
                        crisisTelemetry={crisisTelemetryMap}
                        selectedAlertId={selectedAlertId}
                        setSelectedAlertId={setSelectedAlertId}
                        valMini={65}
                        valMaxi={110}
                        isDark={isDark}
                      />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <Footer />
        </div>
      </main>

      {/* ==== MODALS ==== */}
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

      <SoapNoteModal
        showSoapModal={showSoapModal}
        setShowSoapModal={setShowSoapModal}
        activeChild={activeChild}
        onSave={handleSoapSave}
      />
    </div>
  );
}
