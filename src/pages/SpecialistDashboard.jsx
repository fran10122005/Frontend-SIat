import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useGlobalContext } from "../context/GlobalState";
import {
  AlertCircle,
  Users,
  FilePlus,
  FileText,
  Waves,
  Sun,
  Target,
  Plus,
  MoreHorizontal,
  Sliders,
  X,
  Calendar,
  Activity,
  CheckCircle2,
  Moon,
  Utensils,
  Watch,
  ArrowLeft,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import pdfIcon from "../assets/pdf.png";
import Topbar from "../components/layout/Topbar";
import api from "../api/axios";
import { toastError } from "../utils/errorHandler";
import { saveSelectedChild } from "../utils/authStorage";
import { parseCalendarDate, toLocalYmd } from "../utils/dateRanges";
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
    setSelectedChildId,
    setNomNino,
    valMini,
    valMaxi,
    updateThresholds,
    showToast,
    crearIndicacion,
    clinicalAlerts = [],
    globalPeiGoals = [],
    crearPeiGoal,
    incrementPeiTrial,
    crisisAlerts = [],
    isDark,
    userRole,
    specialistConfig,
    updateSpecialistConfig,
    activeChild: contextActiveChild,
    isQuietHours,
    clinicalBitacoras = [],
    parentNotes,
    homeHistoricalData,
    reports,
  } = useGlobalContext();
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showIndicacionModal, setShowIndicacionModal] = useState(false);
  const [indicacionText, setIndicacionText] = useState({});
  const [showAlertRules, setShowAlertRules] = useState(false);
  const [showNewGoal, setShowNewGoal] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const moreActionsRef = useRef(null);

  // Incidentes conductuales state
  const [incidentes, setIncidentes] = useState([]);
  const [selectedIncidente, setSelectedIncidente] = useState(null);

  const fetchIncidentes = useCallback(async (childId) => {
    if (!childId) {
      setIncidentes([]);
      return;
    }
    try {
      const res = await api.get(`/especialista/incidentes/${childId}`);
      setIncidentes(res.data?.data || []);
    } catch (err) {
      console.warn("No se pudieron cargar incidentes:", err);
      setIncidentes([]);
    }
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      fetchIncidentes(selectedChildId);
    } else {
      setIncidentes([]);
    }
  }, [selectedChildId, fetchIncidentes]);

  // Form States
  const [incidentData, setIncidentData] = useState({
    inc_tipo: "",
    inc_dura: "1-5 minutos",
    inc_deto: "",
    inc_seve: "Moderada",
    inc_ruti: "",
    inc_conse: "",
    inc_inter: "",
    inc_resu: "",
    inc_obse: "",
  });

  // Patient context memoizado (sin fallback automático: el especialista inicia en Vista Global)
  const activeChild = useMemo(() => {
    if (contextActiveChild) return contextActiveChild;
    if (!selectedChildId) return null;
    return (
      (listaNinos || []).find(
        (n) =>
          String(n.id_ninos) === String(selectedChildId) ||
          String(n.nin_codi) === String(selectedChildId),
      ) || null
    );
  }, [contextActiveChild, listaNinos, selectedChildId]);

  const [globalOverview, setGlobalOverview] = useState({
    stats: {
      pacientesActivos: 0,
      porcentajeCumplimiento: 0,
      alertasPendientes: 0,
    },
    behaviorData: [],
    sensoryData: [],
    alertsFeed: [],
  });

  useEffect(() => {
    if (activeChild) return;
    if (!listaNinos || listaNinos.length === 0) {
      setGlobalOverview({
        stats: {
          pacientesActivos: 0,
          porcentajeCumplimiento: 0,
          alertasPendientes: 0,
        },
        behaviorData: [],
        sensoryData: [],
        alertsFeed: [],
      });
      return;
    }

    let cancelled = false;
    const loadGlobalOverview = async () => {
      const sample = listaNinos.slice(0, 15);
      const [incResults, alertResults, metaResults] = await Promise.all([
        Promise.allSettled(
          sample.map((c) =>
            api.get(`/especialista/incidentes/${c.id_ninos || c.nin_codi}`),
          ),
        ),
        Promise.allSettled(
          sample.map((c) =>
            api.get(`/especialista/alertas/${c.id_ninos || c.nin_codi}`),
          ),
        ),
        Promise.allSettled(
          sample.map((c) => api.get(`/metas/${c.id_ninos || c.nin_codi}`)),
        ),
      ]);

      if (cancelled) return;

      const dayBuckets = [];
      const dayKeyMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - i);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const label = d.toLocaleDateString("es-ES", { weekday: "short" });
        const entry = {
          dia: label.charAt(0).toUpperCase() + label.slice(1, 3),
          Berrinche: 0,
          Estereotipia: 0,
          Agresión: 0,
          Ansiedad: 0,
        };
        dayKeyMap[key] = entry;
        dayBuckets.push(entry);
      }

      const typeCounts = {};
      incResults.forEach((res) => {
        if (res.status !== "fulfilled") return;
        const rows = res.value?.data?.data || [];
        rows.forEach((inc) => {
          const tipoRaw = (inc.inc_tipo || "Otro").trim();
          typeCounts[tipoRaw] = (typeCounts[tipoRaw] || 0) + 1;
          const incDate = inc.inc_time ? new Date(inc.inc_time) : null;
          if (!incDate || Number.isNaN(incDate.getTime())) return;
          const key = `${incDate.getFullYear()}-${String(incDate.getMonth() + 1).padStart(2, "0")}-${String(incDate.getDate()).padStart(2, "0")}`;
          const bucket = dayKeyMap[key];
          if (!bucket) return;
          const lower = tipoRaw.toLowerCase();
          if (lower.includes("berr") || lower.includes("rabiet")) {
            bucket.Berrinche += 1;
          } else if (lower.includes("estereo")) {
            bucket.Estereotipia += 1;
          } else if (lower.includes("agres") || lower.includes("auto")) {
            bucket.Agresión += 1;
          } else {
            bucket.Ansiedad += 1;
          }
        });
      });

      const colors = ["#3B82F6", "#F59E0B", "#10B981", "#F43F5E", "#8B5CF6"];
      const sensoryList =
        Object.keys(typeCounts).length > 0
          ? Object.entries(typeCounts).map(([name, value], idx) => ({
              name,
              value,
              color: colors[idx % colors.length],
            }))
          : [{ name: "Sin eventos", value: 1, color: "#94A3B8" }];

      const nowMs = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      let alertas24h = 0;
      const mergedAlerts = [];
      alertResults.forEach((res, idx) => {
        if (res.status !== "fulfilled") return;
        const child = sample[idx];
        const childFullName =
          `${child?.nom_nino || ""} ${child?.ape_nino || ""}`.trim();
        const rows = res.value?.data?.data || [];
        rows.forEach((al) => {
          const t = al.fec_hora ? new Date(al.fec_hora).getTime() : 0;
          if (t && nowMs - t <= dayMs) alertas24h += 1;
          mergedAlerts.push({
            ...al,
            id: al.id_alert,
            mensaje: [
              childFullName,
              al.bpm_max != null ? `BPM máx ${al.bpm_max}` : null,
              al.mov_max != null ? `Mov ${al.mov_max}G` : null,
              al.stress_index != null ? `Estrés ${al.stress_index}%` : null,
            ]
              .filter(Boolean)
              .join(" • "),
          });
        });
      });
      mergedAlerts.sort(
        (a, b) => new Date(b.fec_hora || 0) - new Date(a.fec_hora || 0),
      );

      let goalSum = 0;
      let goalCount = 0;
      metaResults.forEach((res) => {
        if (res.status !== "fulfilled") return;
        const rows = res.value?.data?.data || [];
        rows.forEach((g) => {
          goalSum += Number(g.met_prog || 0);
          goalCount += 1;
        });
      });

      setGlobalOverview({
        stats: {
          pacientesActivos: listaNinos.length,
          porcentajeCumplimiento:
            goalCount > 0 ? Math.round(goalSum / goalCount) : 0,
          alertasPendientes: alertas24h,
        },
        behaviorData: dayBuckets,
        sensoryData: sensoryList,
        alertsFeed: mergedAlerts.slice(0, 12),
      });
    };

    loadGlobalOverview();
    return () => {
      cancelled = true;
    };
  }, [activeChild, listaNinos]);

  const handleSelectPatientFromGlobal = (child) => {
    if (!child) return;
    const id = child.id_ninos || child.nin_codi;
    setSelectedChildId(id);
    setNomNino(child.nom_nino);
    saveSelectedChild(id, child.nom_nino);
  };

  const handleBackToGlobal = () => {
    setSelectedChildId(null);
    setNomNino(null);
    saveSelectedChild(null, null);
  };

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

  // Shortcuts de teclado
  const handleKeyDown = useCallback((e) => {
    if (e.altKey && !e.ctrlKey && !e.metaKey) {
      switch (e.key.toLowerCase()) {
        case "i":
          e.preventDefault();
          setShowIncidentModal(true);
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

  // ==== DATOS DEL PANEL DEL PACIENTE (resumen rápido) ====

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

  // Resumen del día (datos del representante desde BD + fallback en memoria)
  const dailySummary = useMemo(() => {
    const bitList = Array.isArray(clinicalBitacoras) ? clinicalBitacoras : [];
    if (bitList.length > 0) {
      const todayYmd = toLocalYmd(new Date());
      const sorted = [...bitList].sort((a, b) => {
        const da = parseCalendarDate(a.bit_fech)?.getTime() || 0;
        const db = parseCalendarDate(b.bit_fech)?.getTime() || 0;
        if (db !== da) return db - da;
        return (
          new Date(b.bit_crea || 0).getTime() -
          new Date(a.bit_crea || 0).getTime()
        );
      });
      const latestBit =
        sorted.find((b) => toLocalYmd(b.bit_fech) === todayYmd) || sorted[0];
      const isToday = toLocalYmd(latestBit.bit_fech) === todayYmd;
      const parsedDate = parseCalendarDate(latestBit.bit_fech);
      const fechaLabel = isToday
        ? "Hoy"
        : parsedDate
          ? parsedDate.toLocaleDateString("es-ES", {
              day: "numeric",
              month: "short",
            })
          : "Reciente";

      const suenoHours =
        latestBit.bit_suen !== null && latestBit.bit_suen !== undefined
          ? `${latestBit.bit_suen}h`
          : null;
      const suenoCali = latestBit.bit_cali || null;
      const sueno =
        suenoHours && suenoCali
          ? `${suenoHours} · ${suenoCali}`
          : suenoHours || suenoCali || "—";

      const therapyLabels = {
        si: "Completa",
        parcial: "Parcial",
        no: "No realizada",
      };

      return {
        isToday,
        fechaLabel,
        sueno,
        animo: latestBit.bit_anim || "—",
        apetito: latestBit.bit_apet || "—",
        medi:
          latestBit.bit_medi === true
            ? "Medicación: Sí"
            : latestBit.bit_medi === false
              ? "Medicación: No"
              : null,
        senso: latestBit.bit_senso || null,
        diges: latestBit.bit_diges || null,
        crisis:
          Number(latestBit.bit_crisi) > 0 ? Number(latestBit.bit_crisi) : null,
        terap: latestBit.bit_terap
          ? therapyLabels[latestBit.bit_terap] || latestBit.bit_terap
          : null,
        logro: latestBit.bit_logro || latestBit.bit_algo || null,
        texto: latestBit.bit_obse || latestBit.bit_text || null,
      };
    }

    if (!parentNotes || parentNotes.length === 0) return null;
    const latest = parentNotes[0];
    const matchSueño = latest.text?.match(/Sueño:\s*([^\]]+?)\s*\]/i);
    const matchApetito = latest.text?.match(/Apetito:\s*([^\]]+?)\s*\]/i);
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

    return {
      isToday: true,
      fechaLabel: hoy,
      sueno,
      apetito,
      animo,
      texto: latest.text || "",
    };
  }, [clinicalBitacoras, parentNotes, homeHistoricalData]);

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

  const calculateAge = (fnac) => {
    if (!fnac) return null;
    const birth = new Date(fnac);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age > 0 ? `${age} años` : `${age} año`;
  };

  // ==== HANDLERS ====
  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    const childCodi =
      activeChild?.nin_codi || activeChild?.id_ninos || selectedChildId;
    if (!childCodi) {
      showToast("⚠️ Debes seleccionar un paciente primero.");
      return;
    }
    const inc_tipo = (incidentData.inc_tipo || "").trim();
    const inc_deto = (incidentData.inc_deto || "").trim();
    const inc_dura = (incidentData.inc_dura || "1-5 minutos").trim();
    const inc_seve = (incidentData.inc_seve || "Moderada").trim();

    if (!inc_tipo || !inc_deto) {
      showToast("⚠️ Por favor selecciona el tipo de conducta y el detonante.");
      return;
    }
    try {
      const payload = {
        ...incidentData,
        inc_tipo,
        inc_deto,
        inc_dura,
        inc_seve,
      };
      await api.post(`/especialista/incidentes/${childCodi}`, payload);
      setShowIncidentModal(false);
      setIncidentData({
        inc_tipo: "",
        inc_dura: "1-5 minutos",
        inc_deto: "",
        inc_seve: "Moderada",
        inc_ruti: "",
        inc_conse: "",
        inc_inter: "",
        inc_resu: "",
        inc_obse: "",
      });
      showToast("🚨 Incidente conductual registrado y tabulado.");
      await fetchIncidentes(childCodi);
    } catch (err) {
      console.error("Error al registrar incidente:", err);
      toastError(err, showToast, "Error al registrar el incidente conductual.");
    }
  };

  const handleIndicacionSubmit = async (e) => {
    e.preventDefault();
    const ind_desc = (indicacionText.ind_desc || "").trim();
    if (!ind_desc) {
      showToast(
        "⚠️ Por favor escribe la instrucción o texto de la indicación.",
      );
      return;
    }
    const targetChildId =
      selectedChildId || activeChild?.id_ninos || activeChild?.nin_codi;
    if (!targetChildId) {
      showToast("⚠️ Debes seleccionar un paciente primero.");
      return;
    }
    try {
      await crearIndicacion(targetChildId, {
        ind_tipo: indicacionText.ind_tipo || "Terapéutica",
        ind_area: indicacionText.ind_area || "General",
        ind_frec: indicacionText.ind_frec || "Diaria",
        ind_dura: indicacionText.ind_dura || "1 mes",
        ind_prio: indicacionText.ind_prio || "Media",
        ind_vige:
          indicacionText.ind_vige || new Date().toISOString().split("T")[0],
        ind_desc,
        com_tend: ind_desc,
      });
      setShowIndicacionModal(false);
      setIndicacionText({});
      showToast(
        "✅ Indicación clínica guardada y compartida con el representante.",
      );
    } catch (error) {
      console.error("Error al guardar indicación:", error);
      toastError(error, showToast, "Error al guardar la indicación clínica.");
    }
  };

  const handleCreatePeiGoal = async (goalData) => {
    if (!selectedChildId) {
      showToast(
        "⚠️ Debes seleccionar un paciente antes de registrar una meta.",
      );
      throw new Error("No hay paciente seleccionado");
    }
    try {
      await crearPeiGoal(selectedChildId, goalData);
      showToast("🎯 Meta PEI creada correctamente.");
    } catch (err) {
      console.error("Error al crear la meta PEI:", err);
      toastError(err, showToast, "Error al crear la meta PEI.");
      throw err;
    }
  };

  const handleIncrementPeiTrial = async (goalId) => {
    const targetChildId =
      selectedChildId || activeChild?.id_ninos || activeChild?.nin_codi;
    try {
      if (incrementPeiTrial) {
        await incrementPeiTrial(goalId, targetChildId);
        showToast("✅ Ensayo registrado (+1) en la meta PEI");
      }
    } catch (err) {
      console.error("Error al registrar ensayo:", err);
      toastError(
        err,
        showToast,
        "Error al actualizar progreso de la meta PEI.",
      );
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
              <div className="flex flex-col gap-1.5 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <PageTitle icon={Users} data-tour="sp-header">
                    {activeChild
                      ? `Panel del Paciente: ${activeChild.nom_nino} ${activeChild.ape_nino}`
                      : `Bienvenido, ${userName || "Especialista"}`}
                  </PageTitle>
                </div>
                <p className="hidden sm:block text-subtitle-muted mt-0.5">
                  Seguimiento clínico, metas PEI, registro conductual y
                  telemetría en tiempo real.
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
                      data-tour="sp-incident-btn"
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
                      data-tour="sp-indicacion-btn"
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
                      leftIcon={<Sliders className="w-3.5 h-3.5" />}
                      onClick={() => setShowAlertRules(true)}
                      data-tour="sp-rules-btn"
                    >
                      Reglas Alerta
                    </Button>
                    <Button
                      variant="ghost"
                      size="xs"
                      responsive={false}
                      className="whitespace-nowrap"
                      leftIcon={
                        <img
                          src={pdfIcon}
                          alt="PDF"
                          className="w-4 h-4 object-contain shrink-0"
                        />
                      }
                      onClick={handleExportDashboard}
                      disabled={exporting}
                      data-tour="sp-export-pdf"
                    >
                      {exporting ? "..." : "Reporte PDF"}
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
                              icon: <Sliders className="w-4 h-4" />,
                              label: "Reglas de Alerta",
                              onClick: () => setShowAlertRules(true),
                            },
                            {
                              icon: (
                                <img
                                  src={pdfIcon}
                                  alt="PDF"
                                  className="w-4 h-4 object-contain shrink-0"
                                />
                              ),
                              label: exporting ? "Generando..." : "Reporte PDF",
                              onClick: handleExportDashboard,
                              disabled: exporting,
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
                  {listaNinos && listaNinos.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={
                        <img
                          src={pdfIcon}
                          alt="PDF"
                          className="w-4 h-4 object-contain shrink-0"
                        />
                      }
                      onClick={handleExportDashboard}
                      disabled={exporting}
                      fullWidth={false}
                    >
                      {exporting ? "Generando..." : "Reporte PDF"}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Vistas Dinámicas */}
            {loading ? (
              <LoadingState variant="dashboard" role={userRole} />
            ) : !activeChild ? (
              !listaNinos || listaNinos.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-lg mx-auto my-8 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Sin pacientes asignados
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                      Aún no tienes pacientes asignados en la institución.
                      Contacta a la dirección médica para asociar niños a tu
                      nómina clínica.
                    </p>
                  </div>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("patients")}
                    >
                      Ir a Selección de Pacientes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 md:p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3 mb-3.5">
                      <div>
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          Acceso Rápido a Pacientes
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Selecciona un paciente para abrir su panel clínico
                          individual.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="xs"
                        responsive={false}
                        onClick={() => navigate("patients")}
                      >
                        Ver todos →
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {listaNinos.slice(0, 8).map((child) => (
                        <button
                          key={child.id_ninos}
                          type="button"
                          onClick={() => handleSelectPatientFromGlobal(child)}
                          className="group flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/40 dark:hover:bg-slate-800/80 transition-all text-left"
                        >
                          {child.nin_foto ? (
                            <img
                              src={child.nin_foto}
                              alt={child.nom_nino}
                              className="w-10 h-10 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                              {(child.nom_nino?.[0] || "P") +
                                (child.ape_nino?.[0] || "")}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {child.nom_nino} {child.ape_nino}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {child.niv_desa || "TEA en Seguimiento"}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <SpecialistGlobalView
                    globalStats={globalOverview.stats}
                    globalAlertsFeed={globalOverview.alertsFeed}
                    behaviorData={globalOverview.behaviorData}
                    sensoryData={globalOverview.sensoryData}
                    isDark={isDark}
                  />
                </div>
              )
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-300 delay-150">
                {/* 1. HERO CARD DEL PACIENTE */}
                <div
                  data-tour="sp-hero"
                  className="bg-white dark:bg-[#131d2e] rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 md:p-6 shadow-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                    {/* Datos Principales del Paciente */}
                    <div className="flex items-center gap-4">
                      <div className="relative shrink-0">
                        {activeChild.nin_foto ? (
                          <img
                            src={activeChild.nin_foto}
                            alt={activeChild.nom_nino}
                            className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover ring-2 ring-blue-500/20 shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl md:text-2xl font-black shadow-md shadow-blue-500/20 ring-2 ring-white/10">
                            {(activeChild.nom_nino?.[0] || "P") +
                              (activeChild.ape_nino?.[0] || "")}
                          </div>
                        )}
                        <span
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#131d2e]"
                          title="Paciente en monitoreo activo"
                        />
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {activeChild.nom_nino} {activeChild.ape_nino}
                          </h2>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                            {activeChild.niv_desa ||
                              activeChild.nin_diag ||
                              "TEA en Acompañamiento"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                          {calculateAge(activeChild.nin_fnac) && (
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {calculateAge(activeChild.nin_fnac)}
                            </span>
                          )}
                          {activeChild.nin_gner && (
                            <span className="font-medium">
                              • {activeChild.nin_gner}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800/40">
                            <Activity className="w-3.5 h-3.5" />
                            Basal: {valMini} - {valMaxi} BPM
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones de Contexto del Paciente (sin duplicar barra superior) */}
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        responsive={false}
                        leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                        onClick={handleBackToGlobal}
                      >
                        Vista Global
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        responsive={false}
                        leftIcon={<UserCircle className="w-3.5 h-3.5" />}
                        onClick={() => navigate("student")}
                      >
                        Ver Ficha Clínica
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 2. GRID PRINCIPAL BALANCEADO (7 cols Terapia/Conducta + 5 cols IoT/Hogar/Alertas) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                  {/* === COLUMNA IZQUIERDA (7 COLS): Terapéutica y Conductual === */}
                  <div className="lg:col-span-7 space-y-5">
                    {/* Metas PEI del Paciente */}
                    <Card
                      data-tour="sp-pei-card"
                      className="p-5 shadow-sm border border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                            <Target className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                              Metas PEI del Paciente
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Plan Educativo Individualizado y progreso de
                              ensayos
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {peiGoals.length > 0 && (
                            <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50">
                              {peiGoals.length}{" "}
                              {peiGoals.length === 1 ? "meta" : "metas"}
                            </span>
                          )}
                          <Button
                            variant={
                              peiGoals.length > 0 ? "outline" : "primary"
                            }
                            size="xs"
                            responsive={false}
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => setShowNewGoal(true)}
                          >
                            Nueva Meta
                          </Button>
                        </div>
                      </div>

                      {peiGoals.length === 0 ? (
                        <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                            <Target className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                              Sin metas PEI registradas
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto mt-0.5">
                              Establece metas de autonomía, sensoriales o de
                              comunicación para registrar ensayos logrados.
                            </p>
                          </div>
                          <Button
                            variant="primary"
                            size="xs"
                            leftIcon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() => setShowNewGoal(true)}
                          >
                            Crear primera meta
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {peiGoals.map((g) => {
                            const pct = Math.min(
                              Math.round(g.progress || 0),
                              100,
                            );
                            return (
                              <div
                                key={g.id}
                                className="p-4 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 rounded-xl border border-slate-200/70 dark:border-slate-700/60 transition-colors"
                              >
                                <div className="flex justify-between items-start gap-3 mb-2">
                                  <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                                      {g.category}
                                    </span>
                                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                      {g.goal}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-2.5 shrink-0">
                                    <span className="text-sm font-black text-slate-800 dark:text-white">
                                      {pct}%
                                    </span>
                                    <button
                                      type="button"
                                      disabled={pct >= 100}
                                      onClick={() =>
                                        handleIncrementPeiTrial(g.id)
                                      }
                                      data-tour="sp-pei-trial"
                                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white text-xs font-bold transition-all flex items-center gap-1 shadow-sm active:scale-95 disabled:cursor-not-allowed"
                                      title="Registrar ensayo logrado (+1)"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">
                                        +1 Ensayo
                                      </span>
                                    </button>
                                  </div>
                                </div>

                                {/* Barra de Progreso */}
                                <div className="w-full bg-slate-200/80 dark:bg-slate-700/80 rounded-full h-2.5 overflow-hidden">
                                  <div
                                    className={`h-2.5 rounded-full transition-all duration-500 ${
                                      pct >= 100
                                        ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                        : pct >= 60
                                          ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                                          : pct >= 30
                                            ? "bg-gradient-to-r from-amber-500 to-orange-400"
                                            : "bg-gradient-to-r from-rose-500 to-pink-500"
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>

                                <div className="flex justify-between items-center mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                                  <span className="font-medium">
                                    {g.trials || 0} de {g.totalTrials || 20}{" "}
                                    ensayos completados
                                  </span>
                                  {g.fechas && (
                                    <span className="text-slate-400 dark:text-slate-500">
                                      {g.fechas}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </Card>

                    {/* Registro de Incidentes Conductuales (Modelo ABC) */}
                    <Card
                      data-tour="sp-abc-card"
                      className="p-5 shadow-sm border border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                            <AlertCircle className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                              Incidentes Conductuales (Modelo ABC)
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Antecedente, conducta observable y consecuencia
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {incidentes.length > 0 && (
                            <span className="text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800/50">
                              {incidentes.length}{" "}
                              {incidentes.length === 1 ? "evento" : "eventos"}
                            </span>
                          )}
                        </div>
                      </div>

                      {incidentes.length === 0 ? (
                        <div className="p-5 text-center bg-slate-50/60 dark:bg-slate-800/30 rounded-xl border border-slate-200/60 dark:border-slate-700/40">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            Sin incidentes conductuales reportados
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            El paciente se mantiene en calma sin crisis
                            recientes registradas.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {incidentes.slice(0, 5).map((inc, i) => (
                            <div
                              key={inc.inc_codi || i}
                              onClick={() => setSelectedIncidente(inc)}
                              className="p-3.5 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-700/60 cursor-pointer transition-all hover:shadow-xs group"
                            >
                              <div className="flex items-center justify-between gap-3 mb-1.5">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {inc.inc_tipo}
                                  </span>
                                  {inc.inc_dura && (
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      ({inc.inc_dura})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                      inc.inc_seve === "Severa" ||
                                      inc.inc_seve === "Grave"
                                        ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50"
                                        : inc.inc_seve === "Moderada"
                                          ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50"
                                          : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50"
                                    }`}
                                  >
                                    {inc.inc_seve}
                                  </span>
                                  <span className="text-[10px] text-slate-400">
                                    {timeAgo(inc.inc_time)}
                                  </span>
                                </div>
                              </div>

                              {inc.inc_deto && (
                                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1">
                                  <span className="font-medium text-slate-700 dark:text-slate-200">
                                    Detonante (A):
                                  </span>{" "}
                                  {inc.inc_deto}
                                </p>
                              )}
                              {inc.inc_conse && (
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                                  <span className="font-medium">
                                    Manejo (C):
                                  </span>{" "}
                                  {inc.inc_conse}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>

                  {/* === COLUMNA DERECHA (5 COLS): Telemetría, Hogar y Feed de Alertas === */}
                  <div className="lg:col-span-5 space-y-5">
                    {/* Smartwatch / BLE Connect Widget */}
                    <div data-tour="sp-ble-widget">
                      <SmartwatchConnectWidget />
                    </div>

                    {/* Detonantes Sensoriales Identificados */}
                    <Card
                      data-tour="sp-sensory-triggers"
                      className="p-4 shadow-sm border border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                            <Waves className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Detonantes Sensoriales
                          </h3>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Patrones
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sensoryTriggers.length > 0 ? (
                          sensoryTriggers.map((tag, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/40 shadow-xs"
                            >
                              ⚡ {tag}
                            </span>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic py-1">
                            Sin detonantes sensoriales frecuentes reportados.
                          </p>
                        )}
                      </div>
                    </Card>

                    {/* Resumen Diario del Hogar (Representante) */}
                    <Card
                      data-tour="sp-home-log"
                      className="p-4 shadow-sm border border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                            <Sun className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Bitácora del Hogar
                          </h3>
                        </div>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            dailySummary?.isToday
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {dailySummary?.fechaLabel || "Reporte familiar"}
                        </span>
                      </div>

                      {dailySummary ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50 text-center">
                              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-0.5">
                                <Moon className="w-3 h-3 text-indigo-500" />{" "}
                                Sueño
                              </div>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                {dailySummary.sueno}
                              </span>
                            </div>
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50 text-center">
                              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-0.5">
                                <Sun className="w-3 h-3 text-amber-500" /> Ánimo
                              </div>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                {dailySummary.animo}
                              </span>
                            </div>
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50 text-center">
                              <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-0.5">
                                <Utensils className="w-3 h-3 text-emerald-500" />{" "}
                                Apetito
                              </div>
                              <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                                {dailySummary.apetito}
                              </span>
                            </div>
                          </div>
                          {(dailySummary.medi ||
                            dailySummary.senso ||
                            dailySummary.diges ||
                            dailySummary.crisis ||
                            dailySummary.terap) && (
                            <div className="flex flex-wrap gap-1.5 text-[11px]">
                              {dailySummary.medi && (
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                                  💊 {dailySummary.medi}
                                </span>
                              )}
                              {dailySummary.terap && (
                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-medium">
                                  🧩 Terapia: {dailySummary.terap}
                                </span>
                              )}
                              {dailySummary.senso && (
                                <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                                  🎧 {dailySummary.senso}
                                </span>
                              )}
                              {dailySummary.diges && (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium">
                                  🥗 Digestión: {dailySummary.diges}
                                </span>
                              )}
                              {dailySummary.crisis && (
                                <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold">
                                  🚨 {dailySummary.crisis} crisis
                                </span>
                              )}
                            </div>
                          )}
                          {dailySummary.logro && (
                            <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-200/50 dark:border-emerald-900/40">
                              <span className="font-bold">✨ Logro:</span>{" "}
                              {dailySummary.logro}
                            </p>
                          )}
                          {dailySummary.texto && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-xl border border-amber-200/40 dark:border-amber-900/30">
                              "{dailySummary.texto}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                          No hay notas de bitácora registradas por el
                          representante todavía.
                        </p>
                      )}
                    </Card>

                    {/* Indicaciones Clínicas Prescritas */}
                    <Card
                      data-tour="sp-feed-tabs"
                      className="p-4 shadow-sm border border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                            Indicaciones Clínicas
                          </h3>
                        </div>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {recentNotes.length}
                        </span>
                      </div>

                      {recentNotes.length === 0 ? (
                        <div className="py-4 text-center">
                          <FileText className="w-5 h-5 text-slate-300 dark:text-slate-600 mx-auto mb-1" />
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            Sin indicaciones clínicas activas
                          </p>
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {recentNotes.map((n, i) => (
                            <li
                              key={i}
                              className="p-2.5 bg-slate-50/70 dark:bg-slate-800/40 rounded-xl border border-slate-200/50 dark:border-slate-700/40"
                            >
                              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2">
                                {n.title}
                              </p>
                              <span className="text-[10px] text-slate-400 block mt-1">
                                {n.date}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </Card>
                  </div>
                </div>
              </div>
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
          activeChild={activeChild}
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
        valMini={valMini}
        valMaxi={valMaxi}
        activeChild={activeChild}
        onSave={(newRules) => {
          updateSpecialistConfig(newRules);
          if (newRules.bpmLow && newRules.bpmHigh) {
            updateThresholds(newRules.bpmLow, newRules.bpmHigh);
          }
        }}
        onRecalibrate={() => {
          setShowAlertRules(false);
          navigate("hardware");
        }}
      />

      {/* Modal Detalle de Incidente Conductual */}
      {selectedIncidente && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700/80 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 bg-rose-600 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Detalle del Incidente</h3>
                  <p className="text-rose-100 text-xs">
                    {new Date(selectedIncidente.inc_time).toLocaleString(
                      "es-ES",
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIncidente(null)}
                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-sm text-slate-700 dark:text-slate-300">
              {/* Badges de resumen */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Tipo
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {selectedIncidente.inc_tipo}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Severidad
                  </span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {selectedIncidente.inc_seve}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Duración
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    {selectedIncidente.inc_dura}
                  </span>
                </div>
              </div>

              {/* Modelo A-B-C */}
              <div className="space-y-3 pt-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    A — Antecedente / Detonante
                  </h4>
                  <p className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs leading-relaxed">
                    {selectedIncidente.inc_deto}
                  </p>
                </div>

                {selectedIncidente.inc_ruti && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Rutina o Actividad Afectada
                    </h4>
                    <p className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs leading-relaxed">
                      {selectedIncidente.inc_ruti}
                    </p>
                  </div>
                )}

                {selectedIncidente.inc_conse && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      C — Consecuencia / Conducta Observada
                    </h4>
                    <p className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs leading-relaxed">
                      {selectedIncidente.inc_conse}
                    </p>
                  </div>
                )}

                {selectedIncidente.inc_inter && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Intervención Terapéutica Aplicada
                    </h4>
                    <p className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs leading-relaxed">
                      {selectedIncidente.inc_inter}
                    </p>
                  </div>
                )}

                {selectedIncidente.inc_resu && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Resultado Observado
                    </h4>
                    <p className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs leading-relaxed">
                      {selectedIncidente.inc_resu}
                    </p>
                  </div>
                )}

                {selectedIncidente.inc_obse && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Observaciones Clínicas
                    </h4>
                    <p className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs leading-relaxed">
                      {selectedIncidente.inc_obse}
                    </p>
                  </div>
                )}

                {selectedIncidente.tm_espec && (
                  <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                    <span>Registrado por:</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      {selectedIncidente.tm_espec.esp_nomb}{" "}
                      {selectedIncidente.tm_espec.esp_apel}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700/50 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIncidente(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
