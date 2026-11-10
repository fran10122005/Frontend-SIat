import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useGlobalContext } from "../context/GlobalState";
import api from "../api/axios";
import {
  CheckCircle2,
  NotebookPen,
  Calendar,
  X,
  Moon,
  Utensils,
  AlertTriangle,
  AlertCircle,
  Heart,
  Watch,
  Search,
  Sparkles,
  Pencil,
  Pill,
  Flame,
} from "lucide-react";
import LoadingState from "../components/dashboard/LoadingState";
import Topbar from "../components/layout/Topbar";
import Pagination from "../components/shared/Pagination";
import { useConsentimiento } from "../hooks/useConsentimiento";
import ConsentimientoModal from "../components/shared/ConsentimientoModal";
import { useSmartwatch } from "../context/SmartwatchContext";
import {
  parseCalendarDate,
  toLocalYmd,
  isDateInRange,
  calculateConsecutiveStreak,
} from "../utils/dateRanges";
import {
  toLocalYMD,
  parseLocalYMD,
  sanitizeIntegerInput,
  sanitizeDecimalInput,
  focusFirstError,
} from "../utils/validators";
import { extractFieldErrors, toastError } from "../utils/errorHandler";

import PageTitle from "../components/ui/PageTitle";

const MOOD_OPTIONS = [
  {
    value: "Muy Calmo",
    emoji: "😌",
    label: "Muy Calmo",
    activeClass:
      "bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-600 dark:text-emerald-300 shadow-sm",
  },
  {
    value: "Estable",
    emoji: "😊",
    label: "Estable",
    activeClass:
      "bg-blue-50 border-blue-400 text-blue-700 dark:bg-blue-950/40 dark:border-blue-600 dark:text-blue-300 shadow-sm",
  },
  {
    value: "Irritable",
    emoji: "😠",
    label: "Irritable",
    activeClass:
      "bg-orange-50 border-orange-400 text-orange-700 dark:bg-orange-950/40 dark:border-orange-600 dark:text-orange-300 shadow-sm",
  },
  {
    value: "Ansioso",
    emoji: "😟",
    label: "Ansioso",
    activeClass:
      "bg-amber-50 border-amber-400 text-amber-700 dark:bg-amber-950/40 dark:border-amber-600 dark:text-amber-300 shadow-sm",
  },
  {
    value: "Triste",
    emoji: "😢",
    label: "Triste",
    activeClass:
      "bg-purple-50 border-purple-400 text-purple-700 dark:bg-purple-950/40 dark:border-purple-600 dark:text-purple-300 shadow-sm",
  },
];

const THERAPY_LABELS = {
  si: "Terapia completa",
  parcial: "Terapia parcial",
  no: "Sin terapia",
};

// Helper para parsear fechas sin desfase horario UTC
const parseLocalDate = (dateInput) => {
  return parseCalendarDate(dateInput) || new Date();
};

export default function DiarioHogar() {
  const {
    userRole,
    selectedChildId,
    navigate,
    showToast,
    listaNinos,
    fetchHistorialCompleto,
  } = useGlobalContext();
  const { liveBpm, isConnected } = useSmartwatch();

  const genero = useMemo(() => {
    const nino = listaNinos.find(
      (n) => (n.id_ninos || n.nin_codi) === selectedChildId,
    );
    return nino?.nin_gner === "F" ? "femenino" : "masculino";
  }, [listaNinos, selectedChildId]);

  const art = genero === "femenino" ? "la" : "el";
  const ninoLabel = genero === "femenino" ? "niña" : "niño";

  // API Integration States
  const [bitacorasList, setBitacorasList] = useState([]);
  const [loadingBitacoras, setLoadingBitacoras] = useState(true);

  const { consentimientoOk, loadingConsentimiento, aceptarConsentimiento } =
    useConsentimiento(selectedChildId);
  const [isAcceptingConsent, setIsAcceptingConsent] = useState(false);

  const handleAcceptConsent = async (version) => {
    setIsAcceptingConsent(true);
    await aceptarConsentimiento(version);
    setIsAcceptingConsent(false);
  };

  // Form states for Bitácora
  const diarioFormRef = useRef(null);
  const localDate = toLocalYMD();
  const [editingBitacoraId, setEditingBitacoraId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportDate, setReportDate] = useState(localDate);
  const [mood, setMood] = useState("Estable");
  const [crisisCount, setCrisisCount] = useState("0");
  const [bpmValue, setBpmValue] = useState(liveBpm ? String(liveBpm) : "");
  const [sleepHours, setSleepHours] = useState("8");
  const [sleepQuality, setSleepQuality] = useState("");
  const [appetite, setAppetite] = useState("");
  const [medicationTaken, setMedicationTaken] = useState("");
  const [sensoryIssues, setSensoryIssues] = useState("");
  const [digestion, setDigestion] = useState("");
  const [notes, setNotes] = useState("");
  const [triggers, setTriggers] = useState("");
  const [positiveNote, setPositiveNote] = useState("");
  const [therapyDone, setTherapyDone] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const clearFieldError = useCallback((field) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const existingEntryForDate = useMemo(() => {
    if (!reportDate || !Array.isArray(bitacorasList)) return null;
    return (
      bitacorasList.find((b) => toLocalYmd(b.bit_fech) === reportDate) || null
    );
  }, [bitacorasList, reportDate]);

  const resetForm = useCallback(() => {
    setEditingBitacoraId(null);
    setCrisisCount("0");
    setBpmValue(liveBpm ? String(liveBpm) : "");
    setMood("Estable");
    setNotes("");
    setTriggers("");
    setAppetite("");
    setSleepQuality("");
    setMedicationTaken("");
    setSensoryIssues("");
    setDigestion("");
    setPositiveNote("");
    setTherapyDone("");
    setSleepHours("8");
    setShowExtra(false);
    setFormErrors({});
  }, [liveBpm]);

  const loadBitacoraIntoForm = useCallback(
    (bitacora) => {
      if (!bitacora) return;
      setEditingBitacoraId(bitacora.bit_codi);
      setReportDate(toLocalYmd(bitacora.bit_fech) || localDate);
      setMood(bitacora.bit_anim || "Estable");
      setCrisisCount(String(Number(bitacora.bit_crisi) || 0));
      setBpmValue(
        bitacora.bit_bpm !== undefined && bitacora.bit_bpm !== null
          ? String(bitacora.bit_bpm)
          : liveBpm
            ? String(liveBpm)
            : "",
      );
      setSleepHours(
        bitacora.bit_suen !== undefined && bitacora.bit_suen !== null
          ? String(bitacora.bit_suen)
          : "8",
      );
      setSleepQuality(
        bitacora.bit_cali && bitacora.bit_cali !== "Normal"
          ? bitacora.bit_cali
          : "",
      );
      setAppetite(
        bitacora.bit_apet && bitacora.bit_apet !== "Normal"
          ? bitacora.bit_apet
          : "",
      );
      setMedicationTaken(
        bitacora.bit_medi === true
          ? "SI"
          : bitacora.bit_medi === false
            ? "NO"
            : "",
      );
      setSensoryIssues(bitacora.bit_senso || "");
      setDigestion(bitacora.bit_diges || "");
      setNotes(bitacora.bit_obse || "");
      setTriggers(bitacora.bit_dese || "");
      setPositiveNote(
        bitacora.bit_logro || bitacora.positiveNote || bitacora.bit_algo || "",
      );
      setTherapyDone(bitacora.bit_terap || "");
      setFormErrors({});
      if (
        bitacora.bit_terap ||
        bitacora.bit_dese ||
        bitacora.bit_senso ||
        bitacora.bit_diges
      ) {
        setShowExtra(true);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [liveBpm, localDate],
  );

  // Sincronizar automáticamente pulso live del reloj
  useEffect(() => {
    if (liveBpm) {
      setBpmValue(String(liveBpm));
    }
  }, [liveBpm]);

  // Listener para auto-incrementar crisis y actualizar pulso cuando el smartwatch detecte una sobrecarga
  useEffect(() => {
    const handleLocalCrisis = (e) => {
      if (!selectedChildId) return;
      if (
        e.detail?.nin_codi &&
        String(e.detail.nin_codi) !== String(selectedChildId)
      ) {
        return;
      }
      setCrisisCount((prev) => String(Math.min(50, (Number(prev) || 0) + 1)));
      if (e.detail?.bpm_max) {
        setBpmValue(String(e.detail.bpm_max));
      }
      showToast(
        "🚨 Crisis detectada por el sensor. Se ha sumado al reporte de hoy.",
      );
    };
    window.addEventListener("siat:crisis_alert", handleLocalCrisis);
    return () =>
      window.removeEventListener("siat:crisis_alert", handleLocalCrisis);
  }, [showToast, selectedChildId]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMood, setFilterMood] = useState("TODOS");
  const [filterCrisis, setFilterCrisis] = useState("TODOS");
  const [filterDateRange, setFilterDateRange] = useState("TODOS");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const filteredBitacoras = useMemo(() => {
    let data = bitacorasList;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      data = data.filter(
        (b) =>
          (b.bit_text && b.bit_text.toLowerCase().includes(q)) ||
          (b.bit_algo && b.bit_algo.toLowerCase().includes(q)) ||
          (b.bit_logro && b.bit_logro.toLowerCase().includes(q)) ||
          (b.bit_terap && b.bit_terap.toLowerCase().includes(q)) ||
          (b.bit_dese && b.bit_dese.toLowerCase().includes(q)) ||
          (b.bit_senso && b.bit_senso.toLowerCase().includes(q)) ||
          (b.bit_diges && b.bit_diges.toLowerCase().includes(q)) ||
          (b.bit_anim && b.bit_anim.toLowerCase().includes(q)) ||
          (b.bit_obse && b.bit_obse.toLowerCase().includes(q)),
      );
    }

    if (filterMood !== "TODOS") {
      data = data.filter((b) => b.bit_anim === filterMood);
    }

    if (filterCrisis === "CON_CRISIS") {
      data = data.filter((b) => (b.bit_crisi || 0) > 0);
    } else if (filterCrisis === "SIN_CRISIS") {
      data = data.filter((b) => !b.bit_crisi || b.bit_crisi === 0);
    }

    if (filterDateRange === "HOY") {
      const todayYmd = toLocalYmd(new Date());
      data = data.filter((b) => toLocalYmd(b.bit_fech) === todayYmd);
    } else if (filterDateRange !== "TODOS") {
      const rangeMap = {
        "7DIAS": "7days",
        "30DIAS": "30days",
        CUSTOM: "custom",
      };
      const mappedKey = rangeMap[filterDateRange] || filterDateRange;
      data = data.filter((b) =>
        isDateInRange(b.bit_fech, mappedKey, filterDateFrom, filterDateTo),
      );
    }

    return data;
  }, [
    bitacorasList,
    searchTerm,
    filterMood,
    filterCrisis,
    filterDateRange,
    filterDateFrom,
    filterDateTo,
  ]);

  const activeChips = useMemo(() => {
    const chips = [];
    if (searchTerm) {
      chips.push({
        key: "search",
        label: `Búsqueda: "${searchTerm}"`,
        onRemove: () => setSearchTerm(""),
      });
    }
    if (filterMood !== "TODOS") {
      chips.push({
        key: "mood",
        label: `Ánimo: ${filterMood}`,
        onRemove: () => setFilterMood("TODOS"),
      });
    }
    if (filterCrisis !== "TODOS") {
      chips.push({
        key: "crisis",
        label: filterCrisis === "CON_CRISIS" ? "Con crisis" : "Sin crisis",
        onRemove: () => setFilterCrisis("TODOS"),
      });
    }
    if (filterDateRange !== "TODOS") {
      const labels = {
        HOY: "Hoy",
        this_week: "Esta semana",
        last_week: "Semana pasada",
        this_month: "Este mes",
        last_month: "Mes pasado",
        "7DIAS": "Últimos 7 días",
        "30DIAS": "Últimos 30 días",
        CUSTOM: `Rango: ${filterDateFrom || "..."} - ${filterDateTo || "..."}`,
      };
      chips.push({
        key: "dateRange",
        label: labels[filterDateRange] || "Rango de fechas",
        onRemove: () => {
          setFilterDateRange("TODOS");
          setFilterDateFrom("");
          setFilterDateTo("");
        },
      });
    }
    return chips;
  }, [
    searchTerm,
    filterMood,
    filterCrisis,
    filterDateRange,
    filterDateFrom,
    filterDateTo,
  ]);

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(filteredBitacoras.length / PAGE_SIZE);
  const pagedBitacoras = filteredBitacoras.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [
    searchTerm,
    filterMood,
    filterCrisis,
    filterDateRange,
    filterDateFrom,
    filterDateTo,
  ]);

  const fetchBitacoras = useCallback(async () => {
    try {
      setLoadingBitacoras(true);
      const endpoint =
        userRole === "ESPECIALISTA" && selectedChildId
          ? `/ninos/${selectedChildId}/bitacora`
          : selectedChildId
            ? `/ninos/bitacora?nin_codi=${selectedChildId}`
            : "/ninos/bitacora";
      const res = await api.get(endpoint);
      setBitacorasList(res.data.data || []);
    } catch (err) {
      console.error(err);
      setBitacorasList([]);
    } finally {
      setLoadingBitacoras(false);
    }
  }, [userRole, selectedChildId]);

  const validateDiarioForm = () => {
    const errs = {};
    const todayYmd = toLocalYMD();

    if (!reportDate) {
      errs.reportDate = "La fecha del reporte es obligatoria";
    } else if (!parseLocalYMD(reportDate)) {
      errs.reportDate = "La fecha ingresada no es válida";
    } else if (reportDate > todayYmd) {
      errs.reportDate = "La fecha del reporte no puede ser futura";
    }

    if (
      crisisCount === "" ||
      crisisCount === null ||
      crisisCount === undefined
    ) {
      errs.crisisCount = "Indica la cantidad de crisis (0 si no hubo)";
    } else {
      const c = Number(crisisCount);
      if (!Number.isInteger(c) || c < 0 || c > 50) {
        errs.crisisCount = "La cantidad debe estar entre 0 y 50";
      }
    }

    if (bpmValue !== "" && bpmValue !== null && bpmValue !== undefined) {
      const bpm = Number(bpmValue);
      if (Number.isNaN(bpm) || bpm < 30 || bpm > 240) {
        errs.bpmValue = "El pulso debe estar entre 30 y 240 BPM";
      }
    }

    if (sleepHours !== "" && sleepHours !== null && sleepHours !== undefined) {
      const sh = Number(sleepHours);
      if (Number.isNaN(sh) || sh < 0 || sh > 24) {
        errs.sleepHours = "Las horas de sueño deben estar entre 0 y 24";
      }
    }

    if (positiveNote.trim().length > 255) {
      errs.positiveNote = "Máximo 255 caracteres";
    }
    if (notes.trim().length > 1000) {
      errs.notes = "Máximo 1000 caracteres";
    }
    if (triggers.trim().length > 255) {
      errs.triggers = "Máximo 255 caracteres";
    }
    if (sensoryIssues.trim().length > 50) {
      errs.sensoryIssues = "Máximo 50 caracteres";
    }

    return errs;
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!selectedChildId) {
      showToast(
        "⚠️ Selecciona primero al niño o niña para guardar el reporte.",
      );
      return;
    }

    const errs = validateDiarioForm();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      if (errs.triggers || errs.sensoryIssues) {
        setShowExtra(true);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => focusFirstError(errs, diarioFormRef)),
        );
      } else {
        focusFirstError(errs, diarioFormRef);
      }
      return;
    }

    setFormErrors({});
    try {
      setIsSubmitting(true);
      const bpmToSave =
        bpmValue !== "" && bpmValue !== null
          ? Number(bpmValue)
          : liveBpm
            ? Number(liveBpm)
            : null;
      const payload = {
        nin_codi: selectedChildId,
        date: reportDate,
        mood,
        crisisCount: Number(crisisCount) || 0,
        sleepHours:
          sleepHours !== "" && sleepHours !== null
            ? parseFloat(sleepHours)
            : null,
        sleepQuality: sleepQuality || null,
        appetite: appetite || null,
        medicationTaken:
          medicationTaken === "SI"
            ? true
            : medicationTaken === "NO"
              ? false
              : null,
        sensoryIssues: sensoryIssues.trim() || null,
        digestion: digestion || null,
        text: notes.trim() || null,
        triggers: triggers.trim() || null,
        positiveNote: positiveNote.trim() || null,
        therapyDone: therapyDone || null,
        bpm: bpmToSave,
      };
      if (editingBitacoraId) {
        await api.put(`/ninos/bitacora/${editingBitacoraId}`, payload);
        showToast("✅ Reporte actualizado correctamente");
      } else {
        await api.post("/ninos/bitacora", payload);
        showToast("✅ Reporte guardado");
      }
      resetForm();
      await fetchBitacoras();
      if (selectedChildId && fetchHistorialCompleto) {
        await fetchHistorialCompleto(selectedChildId);
      }
    } catch (err) {
      console.error(err);
      const apiErrs = extractFieldErrors(err, {
        date: "reportDate",
        crisisCount: "crisisCount",
        bpm: "bpmValue",
        sleepHours: "sleepHours",
        positiveNote: "positiveNote",
        text: "notes",
        triggers: "triggers",
        sensoryIssues: "sensoryIssues",
      });
      if (Object.keys(apiErrs).length > 0) {
        setFormErrors((prev) => ({ ...prev, ...apiErrs }));
        if (apiErrs.triggers || apiErrs.sensoryIssues) {
          setShowExtra(true);
          requestAnimationFrame(() =>
            requestAnimationFrame(() =>
              focusFirstError(apiErrs, diarioFormRef),
            ),
          );
        } else {
          focusFirstError(apiErrs, diarioFormRef);
        }
      }
      toastError(err, showToast, "Error al registrar la bitácora.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (userRole === "REPRESENTANTE") {
      fetchBitacoras();
    }
  }, [userRole, fetchBitacoras, selectedChildId]);

  const streakDays = useMemo(
    () => calculateConsecutiveStreak(bitacorasList),
    [bitacorasList],
  );

  // Security Guard
  if (userRole !== "REPRESENTANTE") {
    return (
      <div className="flex h-[100dvh] w-full bg-slate-50 dark:bg-slate-900 items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Módulo exclusivo para Representantes (Padres).
          </p>
          <button
            onClick={() => navigate("dashboard")}
            className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  const list = Array.isArray(bitacorasList) ? bitacorasList : [];
  const totalReports = list.length;
  const totalCrisis = list.reduce(
    (sum, b) => sum + (Number(b?.bit_crisi) || 0),
    0,
  );
  const lastMood = list.length > 0 ? list[0]?.bit_anim || "—" : "—";

  return (
    <div className="flex h-[100dvh] w-full bg-[#F4F7F9] dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#F4F7F9] dark:bg-slate-900">
        {!consentimientoOk && !loadingConsentimiento && (
          <ConsentimientoModal
            onAccept={handleAcceptConsent}
            loading={isAcceptingConsent}
          />
        )}

        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-300 pb-20">
            {/* Header del Módulo */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 md:gap-4">
              <div>
                <PageTitle icon={NotebookPen} data-tour="dh-header">
                  Diario de Hogar
                </PageTitle>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Registro diario del estado y evolución de {art} {ninoLabel}
                </p>
              </div>
            </div>

            {/* Stats Summary */}
            <div
              data-tour="dh-stats"
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4"
            >
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3 md:p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3 md:gap-4">
                <div className="p-2.5 md:p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <NotebookPen className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Reportes
                  </p>
                  <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                    {totalReports}
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3 md:p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3 md:gap-4">
                <div className="p-2.5 md:p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Último Ánimo
                  </p>
                  <p className="text-sm md:text-xl font-bold text-slate-900 dark:text-white truncate">
                    {lastMood}
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3 md:p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3 md:gap-4">
                <div className="p-2.5 md:p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Crisis (Total)
                  </p>
                  <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                    {totalCrisis}
                  </p>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-3 md:p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3 md:gap-4">
                <div className="p-2.5 md:p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Flame className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Racha Actual
                  </p>
                  <p className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                    {streakDays > 0
                      ? `${streakDays} ${streakDays === 1 ? "día" : "días"}`
                      : "0 días"}
                  </p>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div
              data-tour="dh-form"
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-6 md:mb-8"
            >
              <div className="p-5 md:p-8 border-b border-gray-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <NotebookPen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  {editingBitacoraId
                    ? "Editando Reporte Diario"
                    : "Registrar Nuevo Reporte Diario"}
                </h3>
                {editingBitacoraId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancelar edición
                  </button>
                )}
              </div>

              {existingEntryForDate && !editingBitacoraId && (
                <div className="mx-5 md:mx-8 mt-5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
                  <span>
                    Ya existe una bitácora registrada para el{" "}
                    <strong>
                      {parseLocalDate(
                        existingEntryForDate.bit_fech,
                      ).toLocaleDateString("es-ES")}
                    </strong>{" "}
                    (Ánimo: {existingEntryForDate.bit_anim}).
                  </span>
                  <button
                    type="button"
                    onClick={() => loadBitacoraIntoForm(existingEntryForDate)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold transition-colors shrink-0"
                  >
                    <Pencil className="w-3 h-3" />
                    Cargar para editar
                  </button>
                </div>
              )}

              <form
                ref={diarioFormRef}
                noValidate
                onSubmit={handleReportSubmit}
                className="p-5 md:p-8 space-y-5"
              >
                {/* Fila 1: Fecha, Crisis y Pulso */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5" data-field="reportDate">
                    <label
                      htmlFor="dh-reportDate"
                      className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-1"
                    >
                      <span>Fecha</span>
                      <span
                        className="text-rose-500 font-bold"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </label>
                    <input
                      id="dh-reportDate"
                      name="reportDate"
                      type="date"
                      max={localDate}
                      data-tour="dh-date"
                      value={reportDate}
                      onChange={(e) => {
                        setReportDate(e.target.value);
                        clearFieldError("reportDate");
                      }}
                      className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-800 dark:text-white ${
                        formErrors.reportDate ? "form-input-invalid" : ""
                      }`}
                    />
                    {formErrors.reportDate && (
                      <p role="alert" className="form-error">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.reportDate}</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5" data-field="crisisCount">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="dh-crisisCount"
                        className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                      >
                        Crisis hoy
                      </label>
                      <span className="text-[9px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                        <Watch className="w-3 h-3" /> IoT
                      </span>
                    </div>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setCrisisCount((prev) =>
                            String(Math.max(0, (parseInt(prev, 10) || 0) - 1)),
                          );
                          clearFieldError("crisisCount");
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-l-lg border border-r-0 border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-600 dark:text-slate-300 transition-colors"
                        title="Restar crisis"
                      >
                        −
                      </button>
                      <input
                        id="dh-crisisCount"
                        name="crisisCount"
                        type="text"
                        inputMode="numeric"
                        maxLength={2}
                        data-tour="dh-crisis"
                        value={crisisCount}
                        onChange={(e) => {
                          setCrisisCount(
                            sanitizeIntegerInput(e.target.value, 2),
                          );
                          clearFieldError("crisisCount");
                        }}
                        className={`w-full text-center bg-slate-50 dark:bg-slate-900 border-y border-slate-200 dark:border-slate-700 py-2 text-sm font-bold text-rose-600 dark:text-rose-400 outline-none ${
                          formErrors.crisisCount ? "form-input-invalid" : ""
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCrisisCount((prev) =>
                            String(Math.min(50, (parseInt(prev, 10) || 0) + 1)),
                          );
                          clearFieldError("crisisCount");
                        }}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-r-lg border border-l-0 border-slate-200 dark:border-slate-700 text-sm font-bold text-rose-600 dark:text-rose-400 transition-colors"
                        title="Sumar crisis"
                      >
                        +
                      </button>
                    </div>
                    {formErrors.crisisCount && (
                      <p role="alert" className="form-error">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.crisisCount}</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5" data-field="bpmValue">
                    <div className="flex items-center justify-between">
                      <label
                        htmlFor="dh-bpmValue"
                        className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                      >
                        Pulso (BPM)
                      </label>
                      {liveBpm ? (
                        <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5 fill-emerald-500 animate-pulse text-emerald-500" />{" "}
                          En vivo
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-medium">
                          Smartwatch / Manual
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        id="dh-bpmValue"
                        name="bpmValue"
                        type="text"
                        inputMode="numeric"
                        maxLength={3}
                        placeholder={liveBpm ? String(liveBpm) : "Ej. 78"}
                        value={bpmValue}
                        onChange={(e) => {
                          setBpmValue(sanitizeIntegerInput(e.target.value, 3));
                          clearFieldError("bpmValue");
                        }}
                        className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold text-slate-800 dark:text-white ${
                          formErrors.bpmValue ? "form-input-invalid" : ""
                        }`}
                      />
                      <Heart className="w-4 h-4 text-rose-500 absolute right-3 top-2.5 pointer-events-none fill-rose-500/20" />
                    </div>
                    {formErrors.bpmValue && (
                      <p role="alert" className="form-error">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.bpmValue}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Fila 2: Selector visual de Ánimo */}
                <div className="space-y-2" data-tour="dh-mood">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 block">
                    Ánimo de {art} {ninoLabel}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {MOOD_OPTIONS.map((opt) => {
                      const active = mood === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMood(opt.value)}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            active
                              ? opt.activeClass
                              : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          <span className="text-base">{opt.emoji}</span>
                          <span className="truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Fila 3: Sueño, Calidad de Sueño, Apetito y Medicación (visibles por defecto) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-700/70">
                  <div className="space-y-1.5" data-field="sleepHours">
                    <label
                      htmlFor="dh-sleepHours"
                      className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    >
                      Horas de sueño
                    </label>
                    <input
                      id="dh-sleepHours"
                      name="sleepHours"
                      type="text"
                      inputMode="decimal"
                      maxLength={4}
                      placeholder="Ej. 8"
                      value={sleepHours}
                      onChange={(e) => {
                        setSleepHours(sanitizeDecimalInput(e.target.value, 4));
                        clearFieldError("sleepHours");
                      }}
                      className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-white ${
                        formErrors.sleepHours ? "form-input-invalid" : ""
                      }`}
                    />
                    {formErrors.sleepHours && (
                      <p role="alert" className="form-error">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{formErrors.sleepHours}</span>
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="dh-sleepQuality"
                      className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    >
                      Calidad del sueño
                    </label>
                    <select
                      id="dh-sleepQuality"
                      value={sleepQuality}
                      onChange={(e) => setSleepQuality(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-white"
                    >
                      <option value="">Normal</option>
                      <option value="Profundo / Reparador">
                        Profundo / Reparador
                      </option>
                      <option value="Intermitente">Intermitente</option>
                      <option value="Inquieto">Inquieto</option>
                      <option value="Insomnio">Dificultad / Insomnio</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="dh-appetite"
                      className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    >
                      Apetito
                    </label>
                    <select
                      id="dh-appetite"
                      value={appetite}
                      onChange={(e) => setAppetite(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-white"
                    >
                      <option value="">Normal</option>
                      <option value="Bueno">Bueno</option>
                      <option value="Regular">Regular</option>
                      <option value="Selectivo">Selectivo</option>
                      <option value="Rechazó alimentos">
                        Rechazó alimentos
                      </option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 block">
                      Medicación hoy
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { val: "SI", label: "Sí" },
                        { val: "NO", label: "No" },
                        { val: "", label: "N/A" },
                      ].map((item) => (
                        <button
                          key={item.val || "na"}
                          type="button"
                          onClick={() => setMedicationTaken(item.val)}
                          className={`py-2 rounded-lg text-xs font-bold border transition-all ${
                            medicationTaken === item.val
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5" data-field="positiveNote">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="dh-positiveNote"
                      className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    >
                      Algo positivo de hoy / Logro destacado
                    </label>
                    <span
                      className={`text-[10px] font-semibold tabular-nums ${
                        positiveNote.length >= 255
                          ? "text-rose-500"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {positiveNote.length}/255
                    </span>
                  </div>
                  <input
                    id="dh-positiveNote"
                    name="positiveNote"
                    type="text"
                    maxLength={255}
                    data-tour="dh-positive"
                    placeholder={
                      genero === "femenino"
                        ? "Ej: Hoy logró comer sola, se vistió sola..."
                        : "Ej: Hoy logró comer solo, se vistió solo..."
                    }
                    value={positiveNote}
                    onChange={(e) => {
                      setPositiveNote(e.target.value);
                      clearFieldError("positiveNote");
                    }}
                    className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-white ${
                      formErrors.positiveNote ? "form-input-invalid" : ""
                    }`}
                  />
                  {formErrors.positiveNote && (
                    <p role="alert" className="form-error">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formErrors.positiveNote}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5" data-field="notes">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="dh-notes"
                      className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                    >
                      Notas del día (opcional)
                    </label>
                    <span
                      className={`text-[10px] font-semibold tabular-nums ${
                        notes.length >= 1000
                          ? "text-rose-500"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      {notes.length}/1000
                    </span>
                  </div>
                  <textarea
                    id="dh-notes"
                    name="notes"
                    rows="2"
                    maxLength={1000}
                    placeholder="Cómo fue el día, eventos importantes..."
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      clearFieldError("notes");
                    }}
                    className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none text-slate-800 dark:text-white ${
                      formErrors.notes ? "form-input-invalid" : ""
                    }`}
                  ></textarea>
                  {formErrors.notes && (
                    <p role="alert" className="form-error">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{formErrors.notes}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <button
                    type="button"
                    data-tour="dh-extra"
                    onClick={() => setShowExtra(!showExtra)}
                    className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                  >
                    {showExtra ? "− Ocultar" : "+ Más detalles"} (terapia,
                    desencadenantes, sensorial, digestión)
                  </button>

                  {showExtra && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="dh-therapyDone"
                          className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                        >
                          Terapia en casa hoy
                        </label>
                        <select
                          id="dh-therapyDone"
                          value={therapyDone}
                          onChange={(e) => setTherapyDone(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-white"
                        >
                          <option value="">—</option>
                          <option value="si">Sí, completa</option>
                          <option value="parcial">Sí, parcial</option>
                          <option value="no">No se realizó</option>
                        </select>
                      </div>
                      <div className="space-y-1.5" data-field="triggers">
                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor="dh-triggers"
                            className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                          >
                            Desencadenantes
                          </label>
                          <span
                            className={`text-[10px] font-semibold tabular-nums ${
                              triggers.length >= 255
                                ? "text-rose-500"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            {triggers.length}/255
                          </span>
                        </div>
                        <input
                          id="dh-triggers"
                          name="triggers"
                          type="text"
                          maxLength={255}
                          placeholder="Ej: Ruido, cambio de rutina"
                          value={triggers}
                          onChange={(e) => {
                            setTriggers(e.target.value);
                            clearFieldError("triggers");
                          }}
                          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-white ${
                            formErrors.triggers ? "form-input-invalid" : ""
                          }`}
                        />
                        {formErrors.triggers && (
                          <p role="alert" className="form-error">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{formErrors.triggers}</span>
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5" data-field="sensoryIssues">
                        <div className="flex items-center justify-between gap-2">
                          <label
                            htmlFor="dh-sensoryIssues"
                            className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                          >
                            Sensibilidad sensorial
                          </label>
                          <span
                            className={`text-[10px] font-semibold tabular-nums ${
                              sensoryIssues.length >= 50
                                ? "text-rose-500"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            {sensoryIssues.length}/50
                          </span>
                        </div>
                        <input
                          id="dh-sensoryIssues"
                          name="sensoryIssues"
                          type="text"
                          maxLength={50}
                          placeholder="Ej: Luces fuertes, texturas"
                          value={sensoryIssues}
                          onChange={(e) => {
                            setSensoryIssues(e.target.value);
                            clearFieldError("sensoryIssues");
                          }}
                          className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-white ${
                            formErrors.sensoryIssues ? "form-input-invalid" : ""
                          }`}
                        />
                        {formErrors.sensoryIssues && (
                          <p role="alert" className="form-error">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{formErrors.sensoryIssues}</span>
                          </p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="dh-digestion"
                          className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400"
                        >
                          Digestión
                        </label>
                        <select
                          id="dh-digestion"
                          value={digestion}
                          onChange={(e) => setDigestion(e.target.value)}
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-white"
                        >
                          <option value="">Normal / Sin novedades</option>
                          <option value="Normal">Normal</option>
                          <option value="Estreñimiento">Estreñimiento</option>
                          <option value="Malestar estomacal">
                            Malestar estomacal
                          </option>
                          <option value="Reflujo">Reflujo</option>
                          <option value="Diarrea">Diarrea</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {(isConnected || liveBpm) && liveBpm && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-700 dark:text-emerald-300">
                    <Heart className="w-3.5 h-3.5 fill-emerald-500 shrink-0" />
                    <span>
                      Smartwatch vinculado en tiempo real: Se adjuntarán{" "}
                      <strong>{liveBpm} BPM</strong> al reporte del día.
                    </span>
                  </div>
                )}

                {Object.keys(formErrors).length > 0 && (
                  <div
                    role="alert"
                    className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2 text-xs font-medium text-rose-700 dark:text-rose-300"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>
                      Revisa los campos marcados en rojo antes de guardar el
                      reporte.
                    </span>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    data-tour="dh-save"
                    className="w-full sm:w-auto px-5 py-2.5 bg-brand-500 hover:bg-blue-600 disabled:opacity-60 text-white font-bold rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSubmitting
                      ? "Guardando..."
                      : editingBitacoraId
                        ? "Actualizar Reporte"
                        : "Guardar Reporte"}
                  </button>
                </div>
              </form>
            </div>

            {/* Historial */}
            <div
              data-tour="dh-history"
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="p-5 md:p-8 border-b border-gray-100 dark:border-slate-700">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  Historial de Diario
                </h3>
              </div>
              <div className="p-4 md:p-8 pt-4">
                {/* Filtros en una sola fila */}
                <div
                  data-tour="dh-filters"
                  className="bg-white dark:bg-[#1E293B] p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col gap-2.5"
                >
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 w-full">
                    {/* Buscador */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar en notas, logros o detonantes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-3.5 pr-9 py-2 h-10 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      />
                    </div>

                    {/* Desplegables en la misma fila */}
                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
                      <select
                        value={filterMood}
                        onChange={(e) => setFilterMood(e.target.value)}
                        className="h-10 px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        title="Filtrar por estado de ánimo"
                      >
                        <option value="TODOS">Todos los ánimos</option>
                        <option value="Muy Calmo">Muy Calmo 😌</option>
                        <option value="Estable">Estable 😊</option>
                        <option value="Irritable">Irritable 😠</option>
                        <option value="Ansioso">Ansioso 😟</option>
                        <option value="Triste">Triste 😢</option>
                      </select>

                      <select
                        value={filterCrisis}
                        onChange={(e) => setFilterCrisis(e.target.value)}
                        className="h-10 px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        title="Filtrar por eventos de crisis"
                      >
                        <option value="TODOS">Todas las entradas</option>
                        <option value="CON_CRISIS">Solo con crisis 🚨</option>
                        <option value="SIN_CRISIS">Sin crisis 🟢</option>
                      </select>

                      <select
                        value={filterDateRange}
                        onChange={(e) => setFilterDateRange(e.target.value)}
                        className="h-10 px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        title="Filtrar por rango de fechas"
                      >
                        <option value="TODOS">Todo el historial</option>
                        <option value="HOY">Hoy</option>
                        <option value="this_week">Esta semana</option>
                        <option value="last_week">Semana pasada</option>
                        <option value="this_month">Este mes</option>
                        <option value="last_month">Mes pasado</option>
                        <option value="7DIAS">Últimos 7 días</option>
                        <option value="30DIAS">Últimos 30 días</option>
                        <option value="CUSTOM">Rango personalizado...</option>
                      </select>

                      {filterDateRange === "CUSTOM" && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input
                            type="date"
                            value={filterDateFrom}
                            max={filterDateTo || localDate}
                            onChange={(e) => setFilterDateFrom(e.target.value)}
                            className="h-10 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            title="Fecha desde"
                          />
                          <span className="text-xs text-slate-400">a</span>
                          <input
                            type="date"
                            value={filterDateTo}
                            min={filterDateFrom || undefined}
                            max={localDate}
                            onChange={(e) => setFilterDateTo(e.target.value)}
                            className="h-10 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            title="Fecha hasta"
                          />
                        </div>
                      )}

                      {activeChips.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm("");
                            setFilterMood("TODOS");
                            setFilterCrisis("TODOS");
                            setFilterDateRange("TODOS");
                            setFilterDateFrom("");
                            setFilterDateTo("");
                          }}
                          className="h-10 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
                          title="Limpiar filtros"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Limpiar</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Chips activos si hay filtros */}
                  {activeChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      {activeChips.map((chip) => (
                        <span
                          key={chip.key}
                          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-0.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full border border-blue-200 dark:border-blue-800"
                        >
                          {chip.label}
                          <button
                            type="button"
                            onClick={chip.onRemove}
                            className="p-0.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                            aria-label={`Quitar filtro ${chip.label}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-4">
                  {loadingBitacoras ? (
                    <LoadingState variant="table" rows={4} />
                  ) : filteredBitacoras.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                      <Calendar className="w-8 h-8 opacity-50" />
                      <span className="text-sm font-medium">
                        Aún no hay reportes registrados
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {pagedBitacoras.map((bitacora, idx) => {
                        const dateObj = parseLocalDate(bitacora.bit_fech);
                        const diaSemana = dateObj.toLocaleDateString("es-ES", {
                          weekday: "short",
                        });
                        const diaFormato = dateObj.toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                        });
                        const fechaTexto = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${diaFormato}`;
                        const animoIconos = {
                          "Muy Calmo": "😌",
                          Estable: "😊",
                          Irritable: "😠",
                          Ansioso: "😟",
                          Triste: "😢",
                        };
                        const crisisColor =
                          (bitacora.bit_crisi || 0) > 0
                            ? "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/30"
                            : "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30";
                        const positiveText =
                          bitacora.bit_logro ||
                          bitacora.positiveNote ||
                          bitacora.bit_algo;

                        return (
                          <div
                            key={bitacora.bit_codi || idx}
                            className="px-3.5 py-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800/60 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
                                  {fechaTexto}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {bitacora.bit_bpm && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
                                    <Heart className="w-2.5 h-2.5 fill-current text-rose-500" />
                                    {bitacora.bit_bpm} BPM
                                  </span>
                                )}
                                <span
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap shrink-0 ${crisisColor}`}
                                >
                                  <AlertTriangle className="w-3 h-3" />{" "}
                                  {bitacora.bit_crisi || 0} crisis
                                </span>
                                {bitacora.bit_codi && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      loadBitacoraIntoForm(bitacora)
                                    }
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition-colors"
                                    title="Editar este reporte"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              <div
                                className="flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 min-w-0 overflow-hidden"
                                title={`Ánimo: ${bitacora.bit_anim || "—"}`}
                              >
                                <span className="text-sm shrink-0">
                                  {animoIconos[bitacora.bit_anim] || "😐"}
                                </span>
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {bitacora.bit_anim}
                                </span>
                              </div>
                              <div
                                className="flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 min-w-0 overflow-hidden"
                                title={
                                  bitacora.bit_bpm
                                    ? `Pulso registrado: ${bitacora.bit_bpm} BPM`
                                    : "Sin registro de pulso"
                                }
                              >
                                <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20 shrink-0" />
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {bitacora.bit_bpm
                                    ? `${bitacora.bit_bpm} BPM`
                                    : "—"}
                                </span>
                              </div>
                              <div
                                className="flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 min-w-0 overflow-hidden"
                                title={
                                  bitacora.bit_suen
                                    ? `Sueño: ${bitacora.bit_suen}h${bitacora.bit_cali ? ` (${bitacora.bit_cali})` : ""}`
                                    : "—"
                                }
                              >
                                <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {bitacora.bit_suen
                                    ? `${bitacora.bit_suen}h${bitacora.bit_cali && bitacora.bit_cali !== "Normal" ? ` · ${bitacora.bit_cali}` : ""}`
                                    : "—"}
                                </span>
                              </div>
                              <div
                                className="flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-md bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 min-w-0 overflow-hidden"
                                title={`Apetito: ${bitacora.bit_apet || "—"}`}
                              >
                                <Utensils className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                                  {bitacora.bit_apet || "—"}
                                </span>
                              </div>
                            </div>

                            {positiveText && (
                              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{positiveText}</span>
                              </p>
                            )}

                            {(bitacora.bit_medi !== null &&
                              bitacora.bit_medi !== undefined) ||
                            bitacora.bit_terap ||
                            bitacora.bit_diges ||
                            bitacora.bit_senso ? (
                              <div className="flex flex-wrap gap-1.5 text-[10px]">
                                {bitacora.bit_medi !== null &&
                                  bitacora.bit_medi !== undefined && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold">
                                      <Pill className="w-2.5 h-2.5" />
                                      Medicación:{" "}
                                      {bitacora.bit_medi ? "Sí" : "No"}
                                    </span>
                                  )}
                                {bitacora.bit_terap && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold">
                                    ✓{" "}
                                    {THERAPY_LABELS[bitacora.bit_terap] ||
                                      bitacora.bit_terap}
                                  </span>
                                )}
                                {bitacora.bit_diges && (
                                  <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-medium">
                                    Digestión: {bitacora.bit_diges}
                                  </span>
                                )}
                                {bitacora.bit_senso && (
                                  <span className="inline-flex px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 font-medium">
                                    Sensorial: {bitacora.bit_senso}
                                  </span>
                                )}
                              </div>
                            ) : null}

                            {(bitacora.bit_dese || bitacora.bit_obse) && (
                              <div className="space-y-0.5 pt-0.5">
                                {bitacora.bit_dese && (
                                  <p className="text-[11px] text-amber-700 dark:text-amber-300 truncate">
                                    🧩 {bitacora.bit_dese}
                                  </p>
                                )}
                                {bitacora.bit_obse && (
                                  <p className="text-[11px] text-blue-700 dark:text-blue-300">
                                    💬 {bitacora.bit_obse}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
