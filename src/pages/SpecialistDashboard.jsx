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
  Bell,
  Waves,
  Sun,
  Target,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import Topbar from "../components/layout/Topbar";
import api from "../api/axios";
import Footer from "../components/layout/Footer";
import { exportDashboardReport } from "../utils/pdfExporter";
import Button from "../components/ui/Button";
import PageTitle from "../components/ui/PageTitle";
import Card from "../components/ui/Card";

// Subcomponents
import SpecialistGlobalView from "../components/specialist/SpecialistGlobalView";
import NewPeiGoalModal from "../components/specialist/NewPeiGoalModal";
import IncidentModal from "../components/specialist/IncidentModal";
import IndicacionModal from "../components/specialist/IndicacionModal";
import SoapNoteModal from "../components/specialist/SoapNoteModal";
import AlertRulesConfig from "../components/specialist/AlertRulesConfig";
import LoadingState from "../components/dashboard/LoadingState";

// Hooks
import { useTelemetry } from "../hooks/useTelemetry";
import SmartwatchConnectWidget from "../components/shared/SmartwatchConnectWidget";

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
    crearPeiGoal,
    crisisAlerts = [],
    isDark,
    userRole,
    specialistConfig,
    updateSpecialistConfig,
    isQuietHours,
    parentNotes,
    homeHistoricalData,
    reports,
  } = useGlobalContext();
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showIndicacionModal, setShowIndicacionModal] = useState(false);
  const [indicacionText, setIndicacionText] = useState({});
  const [showSoapModal, setShowSoapModal] = useState(false);
  const [showAlertRules, setShowAlertRules] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const moreActionsRef = useRef(null);

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

  // ==== ESTADÍSTICAS GLOBALES DINÁMICAS ====
  const globalStats = useMemo(() => {
    const activeCount = listaNinos?.length || 0;
    const pendingAlerts = (clinicalAlerts || []).filter(
      (a) => !a.resuelta,
    ).length;
    let avgProgress = 0;
    if (globalPeiGoals && globalPeiGoals.length > 0) {
      const sum = globalPeiGoals.reduce(
        (acc, g) => acc + (Number(g.met_prog) || 0),
        0,
      );
      avgProgress = Math.round(sum / globalPeiGoals.length);
    }
    return {
      pacientesActivos: activeCount,
      alertasPendientes: pendingAlerts,
      porcentajeCumplimiento: avgProgress,
    };
  }, [listaNinos, clinicalAlerts, globalPeiGoals]);

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

  // Cierra el menú "Más acciones" al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        moreActionsRef.current &&
        !moreActionsRef.current.contains(e.target)
      ) {
        setShowMoreActions(false);
      }
    };
    if (showMoreActions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMoreActions]);

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
    const base = clinicalAlerts || [];
    if (specialistConfig.alertTypes?.length > 0) {
      return isQuietHours
        ? []
        : filteredAlerts.length > 0
          ? filteredAlerts
          : base;
    }
    return isQuietHours ? [] : base;
  }, [clinicalAlerts, specialistConfig, isQuietHours, filteredAlerts]);

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

  // ==== DATOS DEL PANEL DEL PACIENTE (resumen rápido, estático) ====

  // Últimas 3 alertas recientes formateadas (relativo)
  const recentAlerts = useMemo(() => {
    return [...alertsSource]
      .filter((a) => a.fec_hora)
      .sort((a, b) => new Date(b.fec_hora) - new Date(a.fec_hora))
      .slice(0, 3);
  }, [alertsSource]);

  // Detonantes sensoriales derivados de los eventos recientes
  const sensoryTriggers = useMemo(() => {
    if (!activeChild) return [];
    const count = {};
    alertsSource.forEach((a) => {
      const key = a.est_dete || a.est_deto;
      if (key) count[key] = (count[key] || 0) + 1;
    });
    if (Object.keys(count).length > 0) {
      return Object.keys(count)
        .sort((a, b) => count[b] - count[a])
        .slice(0, 4);
    }
    return [];
  }, [alertsSource, activeChild]);

  // Resumen del día (datos del representante)
  const dailySummary = useMemo(() => {
    if (!parentNotes || parentNotes.length === 0) return null;
    const latest = parentNotes[0];
    const matchSueño = latest.text?.match(/Sueño:\s*([^.]+?)\s*\]/i);
    const matchApetito = latest.text?.match(/Apetito:\s*([^.]+?)\s*\]/i);
    const sueno = matchSueño?.[1]?.trim() || "—";
    const apetito = matchApetito?.[1]?.trim() || "—";

    // Ánimo derivado del nivel de calma registrado hoy (homeHistoricalData)
    const hoy = parentNotes[0]?.dia || "Hoy";
    const hoyData = homeHistoricalData.find((h) => h.dia === hoy);
    const calma = hoyData?.calma;
    let animo = "—";
    if (calma != null) {
      if (calma >= 80) animo = "Estable";
      else if (calma >= 50) animo = "Regulado";
      else if (calma >= 30) animo = "Irritable";
      else animo = "Sobrecarga";
    }

    return { sueno, apetito, animo, texto: latest.text || "" };
  }, [parentNotes, homeHistoricalData]);

  // Notas / indicaciones recientes (de la base de datos de reportes)
  const recentNotes = useMemo(() => {
    return [...reports]
      .sort((a, b) => new Date(b.fec_repo || 0) - new Date(a.fec_repo || 0))
      .slice(0, 2)
      .map((r) => ({
        title: r.com_tend || "Nota clínica",
        date: r.fec_repo
          ? new Date(r.fec_repo).toLocaleDateString("es-ES")
          : "",
      }));
  }, [reports]);

  // Meta PEI actual (primera no completada) para el mini-progreso
  const currentPeiGoal = useMemo(() => {
    const activa =
      peiGoals.find((g) => g.progress < 100) || peiGoals[0] || null;
    return activa;
  }, [peiGoals]);

  // Formatea un timestamp a lenguaje relativo ("Hace 2 días")
  const timeAgo = (fec) => {
    if (!fec) return "";
    const diff = Date.now() - new Date(fec).getTime();
    const mins = Math.round(diff / 60000);
    if (mins < 1) return "Ahora";
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.round(hours / 24);
    if (days === 1) return "Hace 1 día";
    return `Hace ${days} días`;
  };

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

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6 pb-12">
            {/* Header Title Area - Estilo AdminDashboard */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col gap-2 min-w-0">
                <PageTitle icon={Users}>
                  {activeChild
                    ? `Panel del Paciente: ${activeChild.nom_nino} ${activeChild.ape_nino}`
                    : `Bienvenido, ${userName || "Especialista"}`}
                </PageTitle>
                <p className="hidden sm:block text-subtitle-muted mt-1">
                  {activeChild
                    ? "Seguimiento PEI, registro conductual y detonantes sensoriales."
                    : "Resumen de pacientes, metas PEI y alertas."}
                </p>
              </div>

              {activeChild ? (
                <>
                  {/* ==== PC: barra de acciones jerárquica en una sola fila ==== */}
                  <div className="hidden lg:flex lg:flex-row lg:items-center lg:justify-end lg:gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      responsive={false}
                      className="whitespace-nowrap shadow-sm shadow-brand-500/20"
                      leftIcon={<AlertCircle className="w-3.5 h-3.5" />}
                      onClick={() => setShowIncidentModal(true)}
                    >
                      Registrar Incidente
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      responsive={false}
                      className="whitespace-nowrap"
                      leftIcon={<FilePlus className="w-3.5 h-3.5" />}
                      onClick={() => setShowIndicacionModal(true)}
                    >
                      Anotar Indicación
                    </Button>

                    {/* Acciones terciarias: discretas, con iconos pequeños */}
                    <span className="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-700/70 hidden lg:block" />
                    <Button
                      variant="ghost"
                      size="xs"
                      responsive={false}
                      className="whitespace-nowrap"
                      leftIcon={<Download className="w-4 h-4" />}
                      onClick={handleExportDashboard}
                      disabled={exporting}
                    >
                      {exporting ? "..." : "Reporte PDF"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      responsive={false}
                      className="whitespace-nowrap"
                      leftIcon={<FileText className="w-4 h-4" />}
                      onClick={() => setShowSoapModal(true)}
                    >
                      Nota SOAP
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      responsive={false}
                      className="whitespace-nowrap"
                      leftIcon={<TrendingUp className="w-4 h-4" />}
                      onClick={() => navigate("historial")}
                    >
                      Historial
                    </Button>
                  </div>

                  {/* ==== MÓVIL: 2 acciones principales + menú "Más" ==== */}
                  <div className="flex lg:hidden items-center gap-2 flex-wrap">
                    <Button
                      variant="primary"
                      size="sm"
                      responsive={false}
                      className="whitespace-nowrap flex-1 min-w-0"
                      leftIcon={<AlertCircle className="w-3.5 h-3.5" />}
                      onClick={() => setShowIncidentModal(true)}
                    >
                      Registrar Incidente
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      responsive={false}
                      className="whitespace-nowrap flex-1 min-w-0"
                      leftIcon={<FilePlus className="w-3.5 h-3.5" />}
                      onClick={() => setShowIndicacionModal(true)}
                    >
                      Anotar Indicación
                    </Button>

                    <div className="relative" ref={moreActionsRef}>
                      <Button
                        variant="secondary"
                        size="sm"
                        responsive={false}
                        className="whitespace-nowrap"
                        leftIcon={<MoreHorizontal className="w-4 h-4" />}
                        onClick={() => setShowMoreActions((prev) => !prev)}
                        aria-expanded={showMoreActions}
                        aria-haspopup="menu"
                      >
                        Más
                      </Button>

                      {showMoreActions && (
                        <div
                          role="menu"
                          className="absolute right-0 mt-2 w-52 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl z-50 p-1.5 animate-in slide-in-from-top-2 fade-in duration-150"
                        >
                          {[
                            {
                              icon: <Download className="w-4 h-4" />,
                              label: exporting ? "Generando..." : "Reporte PDF",
                              onClick: handleExportDashboard,
                              disabled: exporting,
                            },
                            {
                              icon: <FileText className="w-4 h-4" />,
                              label: "Nota SOAP",
                              onClick: () => setShowSoapModal(true),
                            },
                            {
                              icon: <TrendingUp className="w-4 h-4" />,
                              label: "Historial",
                              onClick: () => navigate("historial"),
                            },
                          ].map((item, i) => (
                            <button
                              key={i}
                              type="button"
                              role="menuitem"
                              disabled={item.disabled}
                              onClick={() => {
                                setShowMoreActions(false);
                                item.onClick();
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-left"
                            >
                              <span className="text-slate-400 dark:text-slate-500">
                                {item.icon}
                              </span>
                              {item.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
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
                  <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-300 delay-150">
                    <SmartwatchConnectWidget />
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                      {/* Resumen del Día (Representante) */}
                      <Card className="sm:col-span-2 xl:col-span-2 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Sun className="w-4 h-4 text-amber-500" />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Resumen del Día
                          </h3>
                        </div>
                        {dailySummary ? (
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              Sueño:
                            </span>{" "}
                            {dailySummary.sueno}
                            <br />
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              Ánimo:
                            </span>{" "}
                            {dailySummary.animo}
                            <br />
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              Apetito:
                            </span>{" "}
                            {dailySummary.apetito}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            No hay datos registrados del representante hoy.
                          </p>
                        )}
                      </Card>

                      {/* Detonantes Sensoriales */}
                      <Card className="xl:col-span-2 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Waves className="w-4 h-4 text-indigo-500" />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Detonantes Sensoriales
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {sensoryTriggers.length > 0 ? (
                            sensoryTriggers.map((tag, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2.5 py-1 text-[11px] font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/40"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                              No hay detonantes sensoriales registrados
                            </p>
                          )}
                        </div>
                      </Card>

                      {/* Alertas Recientes (Históricas) */}
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Bell className="w-4 h-4 text-amber-500" />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Alertas Recientes
                          </h3>
                        </div>
                        {recentAlerts.length === 0 ? (
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            Sin alertas recientes.
                          </p>
                        ) : (
                          <ul className="space-y-1.5">
                            {recentAlerts.map((a, i) => (
                              <li
                                key={i}
                                className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                              >
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate min-w-0">
                                  {a.est_dete || "Crisis"}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                                  {timeAgo(a.fec_hora)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </Card>

                      {/* Notas SOAP / Indicaciones Recientes */}
                      <Card className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <FileText className="w-4 h-4 text-sky-500" />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Notas SOAP
                          </h3>
                        </div>
                        {recentNotes.length === 0 ? (
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            Sin notas registradas aún.
                          </p>
                        ) : (
                          <ul className="space-y-1.5">
                            {recentNotes.map((n, i) => (
                              <li
                                key={i}
                                className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 dark:border-slate-700/50 last:border-0"
                              >
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate min-w-0">
                                  {n.title}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap shrink-0">
                                  {n.date}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </Card>

                      {/* Progreso de Metas PEI */}
                      <Card className="xl:col-span-2 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <Target className="w-4 h-4 text-indigo-500 shrink-0" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              Progreso de Metas PEI
                            </h3>
                          </div>
                          <Button
                            variant={currentPeiGoal ? "outline" : "primary"}
                            size="xs"
                            responsive={false}
                            className="whitespace-nowrap shrink-0"
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => setShowNewGoal(true)}
                          >
                            {currentPeiGoal
                              ? "Nueva Meta"
                              : "Crear primera meta"}
                          </Button>
                        </div>
                        {!currentPeiGoal ? (
                          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                            No hay metas PEI registradas. Crea la primera meta
                            de trabajo para empezar a dar seguimiento.
                          </p>
                        ) : (
                          <div className="mt-3">
                            <div className="flex justify-between items-center mb-1.5">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate min-w-0">
                                {currentPeiGoal.goal}
                              </p>
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0 ml-3">
                                {Math.round(currentPeiGoal.progress)}%
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-700 ${
                                  currentPeiGoal.progress >= 100
                                    ? "bg-emerald-500"
                                    : currentPeiGoal.progress >= 70
                                      ? "bg-emerald-400"
                                      : currentPeiGoal.progress >= 40
                                        ? "bg-amber-400"
                                        : "bg-rose-400"
                                }`}
                                style={{
                                  width: `${currentPeiGoal.progress}%`,
                                }}
                              />
                            </div>
                            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                              {currentPeiGoal.trials} /{" "}
                              {currentPeiGoal.totalTrials} ensayos registrados
                            </p>
                          </div>
                        )}
                      </Card>
                    </div>
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

      <NewPeiGoalModal
        showModal={showNewGoal}
        setShowModal={setShowNewGoal}
        activeChild={activeChild}
        onSave={handleCreatePeiGoal}
      />

      <AlertRulesConfig
        showModal={showAlertRules}
        setShowModal={setShowAlertRules}
        config={specialistConfig}
        onSave={updateSpecialistConfig}
      />
    </div>
  );
}
