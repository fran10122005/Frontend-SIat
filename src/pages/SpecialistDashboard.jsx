import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useGlobalContext } from "../context/GlobalState";
import {
  AlertCircle,
  Users,
  FilePlus,
  FileText,
  TrendingUp,
  Download,
  HeartPulse,
  Settings,
  Bell,
} from "lucide-react";
import Topbar from "../components/layout/Topbar";
import api from "../api/axios";
import Footer from "../components/layout/Footer";
import { exportDashboardReport } from "../utils/pdfExporter";
import Button from "../components/ui/Button";

// Subcomponents
import SpecialistGlobalView from "../components/specialist/SpecialistGlobalView";
import PatientPeiGoals from "../components/specialist/PatientPeiGoals";
import PatientSensoryChart from "../components/specialist/PatientSensoryChart";
import PatientBehaviorChart from "../components/specialist/PatientBehaviorChart";
import IncidentModal from "../components/specialist/IncidentModal";
import IndicacionModal from "../components/specialist/IndicacionModal";
import SoapNoteModal from "../components/specialist/SoapNoteModal";
import AlertRulesConfig from "../components/specialist/AlertRulesConfig";
import SpecialistSettings from "../components/specialist/SpecialistSettings";
import LoadingState from "../components/dashboard/LoadingState";

// Hooks
import { useTelemetry } from "../hooks/useTelemetry";

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
    isDark,
    userRole,
    specialistConfig,
    updateSpecialistConfig,
    isQuietHours,
  } = useGlobalContext();
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showIndicacionModal, setShowIndicacionModal] = useState(false);
  const [indicacionText, setIndicacionText] = useState({});
  const [showSoapModal, setShowSoapModal] = useState(false);
  const [showAlertRules, setShowAlertRules] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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

  // FASE 5.1: Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "i":
          e.preventDefault();
          setShowIncidentModal(true);
          break;
        case "s":
          e.preventDefault();
          setShowSoapModal(true);
          break;
        case "d":
          e.preventDefault();
          setShowIndicacionModal(true);
          break;
        default:
          break;
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // FASE 4.4: Filter alerts by config
  const filteredAlerts = useMemo(() => {
    const types = specialistConfig.alertTypes || [
      "crisis",
      "indicacion",
      "sos",
    ];
    const now = new Date();
    const filtered = crisisAlerts.filter((a) => {
      if (!types.includes("crisis")) return false;
      if (specialistConfig.bpmHigh && a.bpm_max > specialistConfig.bpmHigh)
        return true;
      if (
        specialistConfig.movementThreshold &&
        a.mov_max * 10 > specialistConfig.movementThreshold
      )
        return true;
      return a.stress_index > 60;
    });
    return isQuietHours ? [] : filtered;
  }, [crisisAlerts, specialistConfig, isQuietHours]);

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
  }, [globalPeiGoals]);

  const alertsSource = useMemo(() => {
    const base = clinicalAlerts.length > 0 ? clinicalAlerts : mockAlerts;
    if (specialistConfig.alertTypes?.length > 0) {
      return isQuietHours
        ? []
        : filteredAlerts.length > 0
          ? filteredAlerts
          : base;
    }
    return isQuietHours ? [] : base;
  }, [
    clinicalAlerts,
    mockAlerts,
    specialistConfig,
    isQuietHours,
    filteredAlerts,
  ]);

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

  // ==== MOCK DATA: GLOBAL (vista global, sin paciente seleccionado) ====
  const globalBehaviorData = useMemo(() => {
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
        Ansiedad: 0,
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
      (sum, d) => sum + d.Berrinche + d.Estereotipia + d.Agresión + d.Ansiedad,
      0,
    );
    return totalCount === 0 ? [] : result;
  }, [alertsSource]);

  const globalSensoryData = useMemo(() => {
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
  }, [alertsSource]);

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
          <div className="max-w-[1400px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6 pb-12">
            {/* Header Title Area - Estilo AdminDashboard */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-brand-700 dark:text-blue-400 flex items-center gap-2 md:gap-3 transition-colors">
                  <Users className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                  {activeChild
                    ? `Panel del Paciente: ${activeChild.nom_nino} ${activeChild.ape_nino}`
                    : `Bienvenido, ${userName || "Especialista"}`}
                </h1>
                <p className="hidden sm:block text-subtitle-muted mt-1">
                  {activeChild
                    ? "Seguimiento PEI, registro conductual y detonantes sensoriales."
                    : "Resumen de pacientes, metas PEI y alertas."}
                </p>
              </div>

              {activeChild ? (
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={handleExportDashboard}
                    disabled={exporting}
                  >
                    {exporting ? "..." : "Reporte PDF"}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    leftIcon={<AlertCircle className="w-3.5 h-3.5" />}
                    onClick={() => setShowIncidentModal(true)}
                  >
                    Registrar Incidente
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<FilePlus className="w-3.5 h-3.5" />}
                    onClick={() => setShowIndicacionModal(true)}
                  >
                    Anotar Indicación
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<FileText className="w-3.5 h-3.5" />}
                    onClick={() => setShowSoapModal(true)}
                  >
                    Nota SOAP
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Bell className="w-3.5 h-3.5" />}
                    onClick={() => setShowAlertRules(true)}
                  >
                    Alertas
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Settings className="w-3.5 h-3.5" />}
                    onClick={() => setShowSettings(true)}
                  >
                    Config
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<TrendingUp className="w-4 h-4" />}
                    onClick={() => navigate("historial")}
                  >
                    Ver Historial Completo
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="success"
                    size="md"
                    leftIcon={<Download className="w-4 h-4" />}
                    onClick={handleExportDashboard}
                    disabled={exporting}
                    fullWidth={false}
                  >
                    {exporting ? "Generando..." : "Generar Reporte"}
                  </Button>
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
                    globalAlertsFeed={alertsSource}
                    behaviorData={globalBehaviorData}
                    sensoryData={globalSensoryData}
                    isDark={isDark}
                    quickActions={[
                      {
                        id: "historial",
                        icon: TrendingUp,
                        label: "Historial de Evolución",
                        description: "Progreso y tendencias del paciente",
                        highlight: true,
                        onClick: () => {
                          if (!listaNinos.length) {
                            showToast("⚠️ No tienes pacientes asignados.");
                            return;
                          }
                          if (!selectedChildId) {
                            showToast(
                              "👆 Selecciona un paciente para continuar",
                            );
                            navigate("patients");
                            return;
                          }
                          navigate("historial");
                        },
                      },
                      {
                        id: "pacientes",
                        icon: Users,
                        label: "Gestionar Pacientes",
                        description: "Accede a tus pacientes asignados",
                        onClick: () => navigate("patients"),
                      },
                      {
                        id: "incident",
                        icon: AlertCircle,
                        label: "Registrar Incidente",
                        description: "Anota un incidente conductual (A-B-C)",
                        onClick: () => {
                          if (!listaNinos.length) {
                            showToast("⚠️ No tienes pacientes asignados.");
                            return;
                          }
                          if (!selectedChildId) {
                            showToast(
                              "👆 Selecciona un paciente para continuar",
                            );
                            navigate("patients");
                            return;
                          }
                          setShowIncidentModal(true);
                        },
                      },
                      {
                        id: "indicacion",
                        icon: FilePlus,
                        label: "Anotar Indicación",
                        description: "Indicación para el representante",
                        onClick: () => {
                          if (!listaNinos.length) {
                            showToast("⚠️ No tienes pacientes asignados.");
                            return;
                          }
                          if (!selectedChildId) {
                            showToast(
                              "👆 Selecciona un paciente para continuar",
                            );
                            navigate("patients");
                            return;
                          }
                          setShowIndicacionModal(true);
                        },
                      },
                      {
                        id: "soap",
                        icon: FileText,
                        label: "Nota SOAP",
                        description: "Registro de sesión clínica",
                        onClick: () => {
                          if (!listaNinos.length) {
                            showToast("⚠️ No tienes pacientes asignados.");
                            return;
                          }
                          if (!selectedChildId) {
                            showToast(
                              "👆 Selecciona un paciente para continuar",
                            );
                            navigate("patients");
                            return;
                          }
                          setShowSoapModal(true);
                        },
                      },
                    ]}
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
                      <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800/60">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <HeartPulse className="w-4 h-4 text-red-500" />
                            Crisis Recientes
                          </h3>
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => navigate("historial")}
                          >
                            Ver todo
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {crisisAlerts.slice(0, 3).map((al) => (
                            <div
                              key={al.id_alert}
                              className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                            >
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {new Date(al.fec_hora).toLocaleTimeString(
                                    "es-ES",
                                    { hour: "2-digit", minute: "2-digit" },
                                  )}
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                    al.est_dete === "SOBRECARGA"
                                      ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  }`}
                                >
                                  {al.est_dete === "SOBRECARGA"
                                    ? "Crisis"
                                    : "Precrisis"}
                                </span>
                              </div>
                              <div className="flex gap-3 text-[10px] text-slate-500 dark:text-slate-400 mt-1">
                                <span>BPM: {al.bpm_max}</span>
                                <span>Estrés: {al.stress_index}%</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
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

      <AlertRulesConfig
        showModal={showAlertRules}
        setShowModal={setShowAlertRules}
        config={specialistConfig}
        onSave={updateSpecialistConfig}
      />

      <SpecialistSettings
        showModal={showSettings}
        setShowModal={setShowSettings}
        settings={specialistConfig}
        onSave={updateSpecialistConfig}
      />
    </div>
  );
}
