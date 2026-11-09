import { useState, useMemo, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useGlobalContext } from "../context/GlobalState";
import {
  AreaChart,
  Area,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  ShieldAlert,
  Heart,
  Activity,
  Star,
  Calendar,
  Moon,
  Utensils,
  AlertTriangle,
  NotebookPen,
  Eye,
  CheckCircle2,
  Sparkles,
  Smile,
  Pill,
} from "lucide-react";
import Topbar from "../components/layout/Topbar";
import api from "../api/axios";
import pdfIcon from "../assets/pdf.png";
import { exportHistoryToPDF } from "../utils/pdfExporter";
import Pagination from "../components/shared/Pagination";
import FilterBar from "../components/shared/FilterBar";
import Button from "../components/ui/Button";
import AdminModal from "../components/shared/AdminModal";
import PageTitle from "../components/ui/PageTitle";
import {
  DATE_RANGE_OPTIONS,
  parseCalendarDate,
  isDateInRange,
  formatRangeSubtitle,
} from "../utils/dateRanges";

const THERAPY_STATUS_LABELS = {
  si: "Terapia completa",
  parcial: "Terapia parcial",
  no: "Sin terapia en casa",
};

const moodConfig = {
  "Muy Calmo": {
    emoji: "😊",
    label: "Muy Calmo",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
  },
  Alegre: {
    emoji: "😄",
    label: "Alegre",
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
  },
  Tranquilo: {
    emoji: "😌",
    label: "Tranquilo",
    bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40",
  },
  Estable: {
    emoji: "🙂",
    label: "Estable",
    bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40",
  },
  Ansioso: {
    emoji: "😰",
    label: "Ansioso",
    bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
  },
  Irritable: {
    emoji: "😤",
    label: "Irritable",
    bg: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800/40",
  },
  Triste: {
    emoji: "😢",
    label: "Triste",
    bg: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40",
  },
};

function formatBitacoraDate(str) {
  if (!str) return "—";
  try {
    const parsed = new Date(str);
    if (isNaN(parsed.getTime())) return String(str);
    return parsed.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return String(str);
  }
}

export default function HistoryProgress({ initialTab = "evolucion" }) {
  const {
    historicalData,
    clinicalBitacoras,
    userRole,
    nomNino,
    selectedChildId,
    showToast,
    userName,
    isDark,
  } = useGlobalContext();
  const isRepresentante = userRole === "REPRESENTANTE";
  const [activeTab, setActiveTab] = useState(initialTab || "evolucion"); // "evolucion" | "bitacoras" | "incidentes"
  const [dateRange, setDateRange] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [searchNotes, setSearchNotes] = useState("");
  const [filterEfectividad, setFilterEfectividad] = useState("TODOS");

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Modales de detalle clínico
  const [selectedSessionDetail, setSelectedSessionDetail] = useState(null);
  const [selectedBitacoraDetail, setSelectedBitacoraDetail] = useState(null);
  const [selectedIncidenteDetail, setSelectedIncidenteDetail] = useState(null);

  // Bitácoras de hogar state y filtros
  const [bitacoraPage, setBitacoraPage] = useState(0);
  const [searchBitacora, setSearchBitacora] = useState("");
  const [filterMood, setFilterMood] = useState("TODOS");
  const [filterCrisis, setFilterCrisis] = useState("TODAS");

  // Incidentes conductuales state
  const [incidentes, setIncidentes] = useState([]);
  const [loadingIncidentes, setLoadingIncidentes] = useState(false);
  const [searchIncidente, setSearchIncidente] = useState("");
  const [filterSeveridad, setFilterSeveridad] = useState("TODAS");
  const [filterTipoIncidente, setFilterTipoIncidente] = useState("TODOS");
  const [incidentePage, setIncidentePage] = useState(0);
  const [expandedIncidente, setExpandedIncidente] = useState(null);

  useEffect(() => {
    if (!selectedChildId) {
      setIncidentes([]);
      return;
    }
    const fetchInc = async () => {
      setLoadingIncidentes(true);
      try {
        const res = await api.get(
          `/especialista/incidentes/${selectedChildId}`,
        );
        setIncidentes(res.data?.data || []);
      } catch (e) {
        console.warn("No se pudieron cargar incidentes:", e);
        setIncidentes([]);
      } finally {
        setLoadingIncidentes(false);
      }
    };
    fetchInc();
  }, [selectedChildId]);

  const filteredIncidentes = useMemo(() => {
    return incidentes.filter((inc) => {
      if (
        !isDateInRange(inc.inc_time, dateRange, customStartDate, customEndDate)
      )
        return false;
      if (filterSeveridad !== "TODAS" && inc.inc_seve !== filterSeveridad)
        return false;
      if (
        filterTipoIncidente !== "TODOS" &&
        inc.inc_tipo !== filterTipoIncidente
      )
        return false;
      if (searchIncidente) {
        const q = searchIncidente.toLowerCase();
        const match =
          inc.inc_tipo?.toLowerCase().includes(q) ||
          inc.inc_deto?.toLowerCase().includes(q) ||
          inc.inc_conse?.toLowerCase().includes(q) ||
          inc.inc_inter?.toLowerCase().includes(q) ||
          inc.inc_ruti?.toLowerCase().includes(q) ||
          inc.inc_resu?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    incidentes,
    dateRange,
    customStartDate,
    customEndDate,
    filterSeveridad,
    filterTipoIncidente,
    searchIncidente,
  ]);

  useEffect(() => {
    setIncidentePage(0);
  }, [
    dateRange,
    customStartDate,
    customEndDate,
    filterSeveridad,
    filterTipoIncidente,
    searchIncidente,
  ]);

  const INC_PAGE_SIZE = 8;
  const totalIncPages = Math.ceil(filteredIncidentes.length / INC_PAGE_SIZE);
  const pagedIncidentes = filteredIncidentes.slice(
    incidentePage * INC_PAGE_SIZE,
    (incidentePage + 1) * INC_PAGE_SIZE,
  );

  // Bitácoras de hogar: filtrado y KPIs
  const filteredBitacoras = useMemo(() => {
    let list = Array.isArray(clinicalBitacoras) ? clinicalBitacoras : [];
    list = list.filter((b) =>
      isDateInRange(
        b.bit_fech || b.bit_crea,
        dateRange,
        customStartDate,
        customEndDate,
      ),
    );
    if (filterMood !== "TODOS") {
      list = list.filter((b) => (b.bit_anim || b.bit_anmo) === filterMood);
    }
    if (filterCrisis === "CON_CRISIS") {
      list = list.filter((b) => Number(b.bit_crisi || b.bit_cris) > 0);
    }
    if (filterCrisis === "SIN_CRISIS") {
      list = list.filter((b) => !Number(b.bit_crisi || b.bit_cris));
    }
    if (searchBitacora) {
      const q = searchBitacora.toLowerCase();
      list = list.filter((b) =>
        [
          b.bit_obse,
          b.bit_deto,
          b.bit_dese,
          b.bit_algo,
          b.bit_logro,
          b.bit_terap,
          b.bit_senso,
          b.bit_diges,
          b.bit_text,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
    }
    return list;
  }, [
    clinicalBitacoras,
    dateRange,
    customStartDate,
    customEndDate,
    filterMood,
    filterCrisis,
    searchBitacora,
  ]);

  useEffect(() => {
    setBitacoraPage(0);
  }, [
    dateRange,
    customStartDate,
    customEndDate,
    filterMood,
    filterCrisis,
    searchBitacora,
  ]);

  const bitacoraKpis = useMemo(() => {
    const list = filteredBitacoras;
    const totalReports = list.length;
    const totalCrisis = list.reduce(
      (sum, b) => sum + (Number(b.bit_crisi || b.bit_cris) || 0),
      0,
    );
    const validSleepHours = list
      .map((b) => Number(b.bit_suen || b.bit_sueñ))
      .filter((h) => !isNaN(h) && h > 0);
    const avgSleep =
      validSleepHours.length > 0
        ? (
            validSleepHours.reduce((a, b) => a + b, 0) / validSleepHours.length
          ).toFixed(1)
        : "—";
    const stableCount = list.filter(
      (b) =>
        (b.bit_anim || b.bit_anmo) === "Estable" ||
        (b.bit_anim || b.bit_anmo) === "Muy Calmo",
    ).length;
    const stablePct =
      totalReports > 0 ? Math.round((stableCount / totalReports) * 100) : 0;
    return { totalReports, totalCrisis, avgSleep, stablePct };
  }, [filteredBitacoras]);

  const BIT_PAGE_SIZE = 8;
  const totalBitPages = Math.ceil(filteredBitacoras.length / BIT_PAGE_SIZE);
  const pagedBitacoras = filteredBitacoras.slice(
    bitacoraPage * BIT_PAGE_SIZE,
    (bitacoraPage + 1) * BIT_PAGE_SIZE,
  );

  function parseFecRepo(str) {
    return parseCalendarDate(str);
  }

  const filteredData = useMemo(() => {
    let data = historicalData || [];

    if (dateRange !== "all" && data.length > 0) {
      data = data.filter((d) =>
        isDateInRange(
          d.raw_date || d.fec_repo,
          dateRange,
          customStartDate,
          customEndDate,
        ),
      );
    }

    // Búsqueda en notas o actividad
    if (searchNotes) {
      const q = searchNotes.toLowerCase();
      data = data.filter(
        (d) =>
          (d.com_tend || "").toLowerCase().includes(q) ||
          (d.activityTitle || "").toLowerCase().includes(q),
      );
    }

    // Efectividad
    if (filterEfectividad === "EFECTIVA") data = data.filter((d) => d.fue_efec);
    if (filterEfectividad === "NO_EFECTIVA")
      data = data.filter((d) => !d.fue_efec);

    return data;
  }, [
    historicalData,
    dateRange,
    customStartDate,
    customEndDate,
    searchNotes,
    filterEfectividad,
  ]);

  // Datos ordenados cronológicamente (antiguo -> reciente) con etiquetas amigables no repetidas
  const chartChronologicalData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    const sorted = [...filteredData].sort((a, b) => {
      const dateA = a.raw_date
        ? new Date(a.raw_date).getTime()
        : parseFecRepo(a.fec_repo)?.getTime() || 0;
      const dateB = b.raw_date
        ? new Date(b.raw_date).getTime()
        : parseFecRepo(b.fec_repo)?.getTime() || 0;
      return dateA - dateB;
    });

    // Controlar fechas duplicadas para generar etiquetas claras ("05 Nov (S1)", "05 Nov (S2)")
    const dateCounts = {};
    sorted.forEach((item) => {
      const d = item.raw_date
        ? new Date(item.raw_date)
        : parseFecRepo(item.fec_repo);
      const dateKey =
        d && !isNaN(d.getTime())
          ? d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
          : item.fec_repo || "Sesión";
      dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1;
    });

    const dateIndices = {};
    return sorted.map((item, idx) => {
      const d = item.raw_date
        ? new Date(item.raw_date)
        : parseFecRepo(item.fec_repo);
      const dateKey =
        d && !isNaN(d.getTime())
          ? d.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
          : item.fec_repo || `S-${idx + 1}`;

      let label = dateKey;
      if (dateCounts[dateKey] > 1) {
        dateIndices[dateKey] = (dateIndices[dateKey] || 0) + 1;
        label = `${dateKey} (S${dateIndices[dateKey]})`;
      }

      return {
        ...item,
        chartLabel: label,
        fullFormattedDate:
          d && !isNaN(d.getTime())
            ? d.toLocaleDateString("es-ES", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : item.fec_repo,
      };
    });
  }, [filteredData]);

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(0);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const pagedData = filteredData.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  const toggleRow = (index) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  useEffect(() => {
    setPage(0);
    setExpandedRows(new Set());
  }, [
    dateRange,
    customStartDate,
    customEndDate,
    searchNotes,
    filterEfectividad,
  ]);

  const kpis = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { avgCalm: 0, totalSessions: 0, effectivePercentage: 0 };
    }
    const totalSessions = filteredData.reduce(
      (acc, curr) => acc + (curr.tot_sesi || 0),
      0,
    );
    const validCalm = filteredData.filter((d) => d.pro_calm != null);
    const avgCalm =
      validCalm.length > 0
        ? Math.round(
            validCalm.reduce((acc, curr) => acc + curr.pro_calm, 0) /
              validCalm.length,
          )
        : 0;
    const effectiveAlerts = filteredData.filter((d) => d.fue_efec).length;
    const effectivePercentage =
      filteredData.length > 0
        ? Math.round((effectiveAlerts / filteredData.length) * 100)
        : 0;
    return { avgCalm, totalSessions, effectivePercentage };
  }, [filteredData]);

  const homeWeeklyChartData = useMemo(() => {
    const list = Array.isArray(clinicalBitacoras) ? clinicalBitacoras : [];
    if (list.length === 0) return [];
    const grouped = {};
    list.forEach((bit) => {
      if (
        !isDateInRange(
          bit.bit_fech || bit.bit_crea,
          dateRange,
          customStartDate,
          customEndDate,
        )
      ) {
        return;
      }
      const localDate = parseCalendarDate(bit.bit_fech || bit.bit_crea);
      if (!localDate || isNaN(localDate.getTime())) return;
      const diaSemana = localDate.toLocaleDateString("es-ES", {
        weekday: "short",
      });
      const diaFormato = localDate.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
      });
      const key = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${diaFormato}`;
      let calma = 70;
      const anim = bit.bit_anim || bit.bit_anmo;
      if (anim === "Muy Calmo") calma = 95;
      else if (anim === "Estable") calma = 80;
      else if (anim === "Irritable") calma = 45;
      else if (anim === "Triste") calma = 35;
      else if (anim === "Crisis / Sobrecarga" || anim === "Ansioso") calma = 25;
      if (!grouped[key]) {
        grouped[key] = {
          dia: key,
          rawDate: localDate.getTime(),
          calma,
          sobrecarga: 100 - calma,
          count: 1,
        };
      } else {
        grouped[key].calma += calma;
        grouped[key].sobrecarga += 100 - calma;
        grouped[key].count += 1;
      }
    });
    const sorted = Object.values(grouped)
      .map((g) => ({
        dia: g.dia,
        rawDate: g.rawDate,
        calma: Math.round(g.calma / g.count),
        sobrecarga: Math.round(g.sobrecarga / g.count),
      }))
      .sort((a, b) => a.rawDate - b.rawDate);
    return dateRange === "all" ? sorted.slice(-30) : sorted;
  }, [clinicalBitacoras, dateRange, customStartDate, customEndDate]);

  const dateRangeChipLabel = useMemo(() => {
    if (dateRange === "all") return null;
    if (dateRange === "custom") {
      return `Período: ${customStartDate || "..."} a ${customEndDate || "..."}`;
    }
    const opt = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange);
    return opt ? `Período: ${opt.label}` : null;
  }, [dateRange, customStartDate, customEndDate]);

  const clearDateRange = () => {
    setDateRange("all");
    setCustomStartDate("");
    setCustomEndDate("");
  };

  const tab1FilterChips = useMemo(() => {
    const chips = [];
    if (dateRangeChipLabel) {
      chips.push({
        key: "dateRange",
        label: dateRangeChipLabel,
        onRemove: clearDateRange,
      });
    }
    if (filterEfectividad !== "TODOS") {
      chips.push({
        key: "efectividad",
        label:
          filterEfectividad === "EFECTIVA" ? "Solo efectivas" : "No efectivas",
        onRemove: () => setFilterEfectividad("TODOS"),
      });
    }
    if (searchNotes) {
      chips.push({
        key: "search",
        label: `Búsqueda: "${searchNotes}"`,
        onRemove: () => setSearchNotes(""),
      });
    }
    return chips;
  }, [dateRangeChipLabel, filterEfectividad, searchNotes]);

  const tab2FilterChips = useMemo(() => {
    const chips = [];
    if (dateRangeChipLabel) {
      chips.push({
        key: "dateRange",
        label: dateRangeChipLabel,
        onRemove: clearDateRange,
      });
    }
    if (filterMood !== "TODOS") {
      chips.push({
        key: "mood",
        label: `Ánimo: ${filterMood}`,
        onRemove: () => setFilterMood("TODOS"),
      });
    }
    if (filterCrisis !== "TODAS") {
      chips.push({
        key: "crisis",
        label: filterCrisis === "CON_CRISIS" ? "Con crisis" : "Sin crisis",
        onRemove: () => setFilterCrisis("TODAS"),
      });
    }
    if (searchBitacora) {
      chips.push({
        key: "search",
        label: `Búsqueda: "${searchBitacora}"`,
        onRemove: () => setSearchBitacora(""),
      });
    }
    return chips;
  }, [dateRangeChipLabel, filterMood, filterCrisis, searchBitacora]);

  const tab3FilterChips = useMemo(() => {
    const chips = [];
    if (dateRangeChipLabel) {
      chips.push({
        key: "dateRange",
        label: dateRangeChipLabel,
        onRemove: clearDateRange,
      });
    }
    if (filterSeveridad !== "TODAS") {
      chips.push({
        key: "severidad",
        label: `Severidad: ${filterSeveridad}`,
        onRemove: () => setFilterSeveridad("TODAS"),
      });
    }
    if (filterTipoIncidente !== "TODOS") {
      chips.push({
        key: "tipo",
        label: `Tipo: ${filterTipoIncidente}`,
        onRemove: () => setFilterTipoIncidente("TODOS"),
      });
    }
    if (searchIncidente) {
      chips.push({
        key: "search",
        label: `Búsqueda: "${searchIncidente}"`,
        onRemove: () => setSearchIncidente(""),
      });
    }
    return chips;
  }, [
    dateRangeChipLabel,
    filterSeveridad,
    filterTipoIncidente,
    searchIncidente,
  ]);

  const handleExportPDF = async () => {
    if (activeTab === "bitacoras") {
      try {
        const { exportHomeWeeklyToPDF } = await import("../utils/pdfExporter");
        const list = Array.isArray(clinicalBitacoras) ? clinicalBitacoras : [];
        const mappedNotes = list.map((bit) => {
          const d = new Date(bit.bit_fech || bit.bit_crea);
          const localDate = new Date(
            d.getTime() + d.getTimezoneOffset() * 60000,
          );
          const diaSemana = localDate.toLocaleDateString("es-ES", {
            weekday: "short",
          });
          const diaFormato = localDate.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "short",
          });
          const dia = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${diaFormato}`;
          return {
            dia,
            time: new Date(bit.bit_crea || bit.bit_fech).toLocaleTimeString(
              "es-ES",
              { hour: "2-digit", minute: "2-digit" },
            ),
            bpm: bit.bit_bpm,
            anim: bit.bit_anim || "Estable",
            suen: `${bit.bit_suen || bit.bit_sueñ || 0}h`,
            apet: bit.bit_apet || "Normal",
            crisi: Number(bit.bit_crisi || bit.bit_cris) || 0,
            obse: bit.bit_obse,
            summaryText: `Sueño: ${bit.bit_suen || bit.bit_sueñ || 0}h | Ánimo: ${bit.bit_anim || "Estable"} | Apetito: ${bit.bit_apet || "Normal"}`,
          };
        });

        await exportHomeWeeklyToPDF({
          paciente: nomNino || "Paciente",
          generadoPor: userName || "Especialista SIAT",
          resumenDiario: homeWeeklyChartData,
          notas: mappedNotes,
        });
        showToast("✅ Reporte del hogar exportado en PDF exitosamente");
      } catch (err) {
        console.error(err);
        showToast("❌ Error al exportar el reporte del hogar");
      }
    } else {
      exportHistoryToPDF(filteredData || []);
    }
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <PageTitle icon={TrendingUp} data-tour="hp-header">
                  {isRepresentante
                    ? `Progreso de ${nomNino || "tu niño"}`
                    : "Historial de Evolución"}
                </PageTitle>
                <p className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                  {isRepresentante
                    ? "Evolución y avance terapéutico registrado por el especialista"
                    : "Análisis histórico y tendencias de comportamiento"}
                </p>
              </div>

              {!isRepresentante && (
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    aria-label="Exportar a PDF"
                    title="Exportar a PDF"
                    className="p-2.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 transition-colors flex items-center justify-center min-w-[38px] min-h-[38px]"
                  >
                    <img
                      src={pdfIcon}
                      alt="PDF"
                      className="w-4 h-4 object-contain shrink-0"
                    />
                  </button>
                </div>
              )}
            </div>

            {/* Tabs de Navegación: Evolución vs Bitácoras vs Incidentes */}
            <div className="flex border-b border-slate-200 dark:border-slate-700/80 gap-3 sm:gap-6 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("evolucion")}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "evolucion"
                    ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                {isRepresentante
                  ? "Evolución y Terapias"
                  : "Evolución y Sesiones"}
                {filteredData?.length > 0 && (
                  <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">
                    {filteredData.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("bitacoras")}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "bitacoras"
                    ? "border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <NotebookPen className="w-4 h-4" />
                {isRepresentante
                  ? "Bitácoras del Hogar"
                  : "Bitácoras de Hogar (Diario)"}
                {clinicalBitacoras?.length > 0 && (
                  <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">
                    {clinicalBitacoras.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("incidentes")}
                className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "incidentes"
                    ? "border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                {isRepresentante
                  ? "Registro de Episodios"
                  : "Incidentes Conductuales (A-B-C)"}
                {incidentes.length > 0 && (
                  <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded-full">
                    {incidentes.length}
                  </span>
                )}
              </button>
            </div>

            {/* TAB 1: EVOLUCIÓN Y SESIONES */}
            {activeTab === "evolucion" && (
              <div className="flex flex-col gap-6">
                {/* KPIs Rediseñados */}
                <div
                  data-tour="hp-kpis"
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4"
                >
                  {/* Card 1: Promedio de Calma */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                          <TrendingUp className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Promedio de Calma
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          kpis.avgCalm >= 75
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                        }`}
                      >
                        {kpis.avgCalm >= 80
                          ? "Óptimo"
                          : kpis.avgCalm >= 65
                            ? "Estable"
                            : "En Progreso"}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {kpis.avgCalm}%
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        en terapias
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {kpis.avgCalm >= 80
                        ? "Excelente autorregulación del paciente"
                        : "Comportamiento en rango de estabilidad"}
                    </p>
                  </div>

                  {/* Card 2: Sesiones Totales */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          <Activity className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Sesiones Realizadas
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                        Al Día
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        {kpis.totalSessions}
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        completadas
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      Con el equipo multidisciplinario
                    </p>
                  </div>

                  {/* Card 3: Alertas / Efectividad */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 dark:border-slate-700/80 relative overflow-hidden flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Efectividad Terapéutica
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {kpis.effectivePercentage === 100
                          ? "100% Éxito"
                          : "Controlado"}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                        {kpis.effectivePercentage}%
                      </span>
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        sin sobrecarga
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                      Sesiones finalizadas en calma sin desregulación
                    </p>
                  </div>
                </div>

                {/* Gráfico de Tendencia de Calma */}
                <div
                  data-tour="hp-chart"
                  className="bg-white dark:bg-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80 dark:border-slate-700 flex flex-col min-w-0 h-auto lg:h-[440px]"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        Evolución de Autorregulación y Calma en Terapias
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {formatRangeSubtitle(
                          dateRange,
                          customStartDate,
                          customEndDate,
                          filteredData.length,
                          "sesión",
                          "sesiones",
                        )}
                      </p>
                    </div>

                    {/* Selector de Período Histórico (Point 6) */}
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/70 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <select
                          aria-label="Seleccionar período de la gráfica"
                          value={dateRange}
                          onChange={(e) => setDateRange(e.target.value)}
                          className="text-xs font-bold bg-transparent text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                        >
                          {DATE_RANGE_OPTIONS.map((opt) => (
                            <option
                              key={opt.value}
                              value={opt.value}
                              className="bg-white dark:bg-slate-900"
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {dateRange === "custom" && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            aria-label="Fecha desde"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="h-8 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs text-slate-400">a</span>
                          <input
                            type="date"
                            aria-label="Fecha hasta"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="h-8 px-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Leyenda de Zonas de Estabilidad */}
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold mb-3 px-1">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Zona Óptima (≥ 75%)
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      En Adaptación (55% - 74%)
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 ml-auto text-[11px] font-normal">
                      Cronología: Pasado → Presente
                    </span>
                  </div>

                  <div className="w-full h-[250px] sm:h-[290px] lg:flex-1 lg:h-auto lg:min-h-[240px]">
                    {chartChronologicalData &&
                    chartChronologicalData.length > 0 ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                        minWidth={0}
                        minHeight={220}
                      >
                        <AreaChart
                          data={chartChronologicalData}
                          margin={{
                            top: 10,
                            right: 15,
                            left: -20,
                            bottom: 0,
                          }}
                        >
                          <defs>
                            <linearGradient
                              id="calmAreaGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#3B82F6"
                                stopOpacity={0.4}
                              />
                              <stop
                                offset="95%"
                                stopColor="#3B82F6"
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke={isDark ? "#334155" : "#E2E8F0"}
                          />
                          <XAxis
                            dataKey="chartLabel"
                            tick={{
                              fontSize: 11,
                              fill: isDark ? "#94A3B8" : "#64748B",
                            }}
                            tickMargin={10}
                            stroke={isDark ? "#475569" : "#CBD5E1"}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{
                              fontSize: 11,
                              fill: isDark ? "#94A3B8" : "#64748B",
                            }}
                            stroke={isDark ? "#475569" : "#CBD5E1"}
                            tickFormatter={(val) => `${val}%`}
                          />
                          <ReferenceLine
                            y={75}
                            stroke="#10B981"
                            strokeDasharray="4 4"
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                const val = data.pro_calm ?? 0;
                                const isOptimal = val >= 75;
                                const isModerate = val >= 55 && val < 75;

                                return (
                                  <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 text-xs min-w-[210px]">
                                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                                      <span className="font-bold text-slate-900 dark:text-white capitalize">
                                        {data.fullFormattedDate ||
                                          data.chartLabel}
                                      </span>
                                      <span
                                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                          isOptimal
                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                                            : isModerate
                                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                                              : "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                                        }`}
                                      >
                                        {isOptimal
                                          ? "Óptimo"
                                          : isModerate
                                            ? "En Progreso"
                                            : "Requiere Apoyo"}
                                      </span>
                                    </div>

                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-slate-500 dark:text-slate-400">
                                          Autorregulación:
                                        </span>
                                        <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                                          {val}% en calma
                                        </span>
                                      </div>

                                      {data.activityTitle && (
                                        <div className="flex items-center justify-between gap-2">
                                          <span className="text-slate-500 dark:text-slate-400 truncate max-w-[90px]">
                                            Actividad:
                                          </span>
                                          <span
                                            className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]"
                                            title={data.activityTitle}
                                          >
                                            {data.activityTitle}
                                          </span>
                                        </div>
                                      )}

                                      {data.avg_bpm && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-slate-500 dark:text-slate-400">
                                            Pulso Cardíaco:
                                          </span>
                                          <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                                            <Heart className="w-3 h-3 fill-current" />
                                            {data.avg_bpm} BPM
                                          </span>
                                        </div>
                                      )}

                                      {data.cooperation && (
                                        <div className="flex items-center justify-between">
                                          <span className="text-slate-500 dark:text-slate-400">
                                            Cooperación:
                                          </span>
                                          <div className="flex items-center gap-0.5">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <Star
                                                key={star}
                                                className={`w-3 h-3 ${
                                                  star <= data.cooperation
                                                    ? "fill-amber-400 text-amber-400"
                                                    : "text-slate-200 dark:text-slate-700"
                                                }`}
                                              />
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="pro_calm"
                            stroke="#2563EB"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#calmAreaGradient)"
                            activeDot={{
                              r: 6,
                              fill: "#2563EB",
                              stroke: "#fff",
                              strokeWidth: 2,
                            }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
                        <TrendingUp className="w-12 h-12 mb-3 opacity-30 stroke-1" />
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          Sin registros históricos disponibles para este período
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm text-center">
                          Prueba seleccionando otro rango de fechas o revisa los
                          filtros activos.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Filtros */}
                <FilterBar
                  dataTour="hp-filters"
                  searchPlaceholder="Buscar por notas de sesión o actividad..."
                  searchValue={searchNotes}
                  onSearch={setSearchNotes}
                  activeCount={tab1FilterChips.length}
                  chips={tab1FilterChips}
                  onClearAll={() => {
                    setSearchNotes("");
                    clearDateRange();
                    setFilterEfectividad("TODOS");
                  }}
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Período
                    </label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                    >
                      {DATE_RANGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {dateRange === "custom" && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Desde
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Hasta
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Efectividad
                    </label>
                    <select
                      value={filterEfectividad}
                      onChange={(e) => setFilterEfectividad(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                    >
                      <option value="TODOS">Todas</option>
                      <option value="EFECTIVA">Efectiva</option>
                      <option value="NO_EFECTIVA">No Efectiva</option>
                    </select>
                  </div>
                </FilterBar>

                {/* Tabla de Sesiones */}
                <div
                  data-tour="hp-table"
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden"
                >
                  <div className="p-4 md:p-6">
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-50 dark:bg-slate-700/50">
                          <tr>
                            <th className="px-4 py-3 font-medium">Fecha</th>
                            <th className="px-4 py-3 font-medium">
                              Terapia / Actividad
                            </th>
                            <th className="px-4 py-3 font-medium">
                              Tiempo Calma
                            </th>
                            <th className="px-4 py-3 font-medium">
                              Cooperación
                            </th>
                            <th className="px-4 py-3 font-medium">Efectiva</th>
                            <th className="px-4 py-3 font-medium">Notas</th>
                            <th className="px-4 py-3 font-medium text-right">
                              Bitácora
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {pagedData.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-4 py-8 text-center text-gray-400"
                              >
                                No se encontraron registros de evolución.
                              </td>
                            </tr>
                          ) : (
                            pagedData.map((row, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-gray-50/50 dark:hover:bg-slate-750 transition-colors"
                              >
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                  {row.fec_repo}
                                </td>
                                <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">
                                  <div className="flex items-center gap-1.5">
                                    <Activity className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                    <span
                                      className="truncate max-w-[180px]"
                                      title={row.activityTitle}
                                    >
                                      {row.activityTitle ||
                                        "Sesión Terapéutica"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                      {row.pro_calm != null
                                        ? `${row.pro_calm}%`
                                        : "—"}
                                    </span>
                                    {row.avg_bpm && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200/60 dark:border-rose-900/40">
                                        <Heart className="w-2.5 h-2.5 fill-current text-rose-500" />
                                        {row.avg_bpm} bpm
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div
                                    className="flex items-center gap-0.5"
                                    title={`Cooperación: ${row.cooperation || 4}/5`}
                                  >
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`w-3.5 h-3.5 ${
                                          star <= (row.cooperation || 4)
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-slate-200 dark:text-slate-700"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${row.fue_efec ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}
                                  >
                                    {row.fue_efec ? "Efectiva" : "No Efectiva"}
                                  </span>
                                </td>
                                <td
                                  className="px-4 py-3 max-w-xs truncate"
                                  title={row.com_tend}
                                >
                                  {row.com_tend || "Sin notas"}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedSessionDetail(row)
                                    }
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors"
                                    title="Ver bitácora detallada de sesión"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Ver Ficha</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-700 -mx-4 -my-4">
                      {pagedData.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">
                          No se encontraron registros de evolución.
                        </div>
                      ) : (
                        pagedData.map((row, idx) => {
                          const isExpanded = expandedRows.has(idx);
                          return (
                            <div key={idx} className="transition-colors">
                              <button
                                type="button"
                                onClick={() => toggleRow(idx)}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800/50 active:bg-gray-100 dark:active:bg-slate-700/50"
                              >
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {row.fec_repo}
                                    </span>
                                    {row.pro_calm != null && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                                        {row.pro_calm}% calma
                                      </span>
                                    )}
                                    {row.avg_bpm && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 flex items-center gap-0.5 border border-rose-200/60 dark:border-rose-900/40">
                                        <Heart className="w-2.5 h-2.5 fill-current text-rose-500" />
                                        {row.avg_bpm} bpm
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">
                                    {row.activityTitle ||
                                      row.com_tend ||
                                      "Sesión Terapéutica"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <span
                                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${row.fue_efec ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"}`}
                                  >
                                    {row.fue_efec ? "Efectiva" : "No Efectiva"}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                              </button>
                              {isExpanded && (
                                <div className="px-4 pb-4 pt-1 bg-gray-50/50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-slate-700/50">
                                  <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="col-span-2">
                                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                                        Actividad Terapéutica
                                      </span>
                                      <p className="text-gray-900 dark:text-gray-100 mt-0.5 font-bold flex items-center gap-1.5">
                                        <Activity className="w-3.5 h-3.5 text-blue-500" />
                                        {row.activityTitle ||
                                          "Sesión Terapéutica Regular"}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                                        Cooperación
                                      </span>
                                      <div className="flex items-center gap-0.5 mt-0.5">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                          <Star
                                            key={s}
                                            className={`w-3.5 h-3.5 ${
                                              s <= (row.cooperation || 4)
                                                ? "fill-amber-400 text-amber-400"
                                                : "text-slate-300 dark:text-slate-600"
                                            }`}
                                          />
                                        ))}
                                      </div>
                                    </div>
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                                        Calma
                                      </span>
                                      <p className="text-gray-900 dark:text-gray-100 mt-0.5 font-semibold">
                                        {row.pro_calm != null
                                          ? `${row.pro_calm}%`
                                          : "—"}
                                      </p>
                                    </div>
                                    {row.avg_bpm && (
                                      <div className="col-span-2">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">
                                          Biometría Cardíaca
                                        </span>
                                        <p className="text-rose-600 dark:text-rose-400 mt-0.5 font-bold flex items-center gap-1.5">
                                          <Heart className="w-3.5 h-3.5 fill-current" />
                                          {row.avg_bpm} BPM Promedio
                                          {row.max_bpm
                                            ? ` · Pico Máx: ${row.max_bpm} BPM`
                                            : ""}
                                        </p>
                                      </div>
                                    )}
                                    {row.com_tend && (
                                      <div className="col-span-2">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">
                                          Notas
                                        </span>
                                        <p className="text-gray-900 dark:text-gray-100 mt-0.5 leading-relaxed">
                                          {row.com_tend}
                                        </p>
                                      </div>
                                    )}
                                    <div className="col-span-2 pt-2">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedSessionDetail(row)
                                        }
                                        className="w-full py-2 px-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                                      >
                                        <Eye className="w-4 h-4" />
                                        Ver Bitácora Completa de Sesión
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
                <div data-tour="hp-pagination">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: BITÁCORAS DE HOGAR (DIARIO FAMILIAR) */}
            {activeTab === "bitacoras" && (
              <div className="flex flex-col gap-6">
                {/* KPIs de Bitácoras de Hogar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <NotebookPen className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Reportes de Hogar
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                        {bitacoraKpis.totalReports}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        registros
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Smile className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Clima Emocional
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl md:text-3xl font-semibold tracking-tight text-blue-600 dark:text-blue-400">
                        {bitacoraKpis.stablePct}%
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        calmo / estable
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <Moon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Sueño Promedio
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                        {bitacoraKpis.avgSleep}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        horas / noche
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Crisis en Casa
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl md:text-3xl font-semibold tracking-tight text-rose-600 dark:text-rose-400">
                        {bitacoraKpis.totalCrisis}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        reportadas
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gráfica de Tendencia de Calma y Sobrecarga del Hogar */}
                {homeWeeklyChartData.length > 0 && (
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-sm flex flex-col min-w-0">
                    <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          Balance Emocional en Casa
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {formatRangeSubtitle(
                            dateRange,
                            customStartDate,
                            customEndDate,
                            homeWeeklyChartData.length,
                            "día",
                            "días",
                          )}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          Calma (%)
                        </span>
                        <span className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                          Sobrecarga (%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-[220px] sm:h-[250px]">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                        minWidth={0}
                        minHeight={200}
                      >
                        <AreaChart
                          data={homeWeeklyChartData}
                          margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="homeCalmGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#3B82F6"
                                stopOpacity={0.35}
                              />
                              <stop
                                offset="95%"
                                stopColor="#3B82F6"
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                            <linearGradient
                              id="homeOverloadGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#F43F5E"
                                stopOpacity={0.28}
                              />
                              <stop
                                offset="95%"
                                stopColor="#F43F5E"
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke={isDark ? "#334155" : "#E2E8F0"}
                          />
                          <XAxis
                            dataKey="dia"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: isDark ? "#94A3B8" : "#64748B",
                              fontSize: 11,
                            }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{
                              fill: isDark ? "#94A3B8" : "#64748B",
                              fontSize: 11,
                            }}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "8px",
                              border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
                              backgroundColor: isDark ? "#0F172A" : "#fff",
                              color: isDark ? "#f8fafc" : "#0f172a",
                              fontSize: "12px",
                            }}
                            formatter={(value, name) => [
                              `${value}%`,
                              name === "calma" ? "Calma" : "Sobrecarga",
                            ]}
                          />
                          <Area
                            type="monotone"
                            dataKey="calma"
                            stroke="#3B82F6"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#homeCalmGrad)"
                          />
                          <Area
                            type="monotone"
                            dataKey="sobrecarga"
                            stroke="#F43F5E"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#homeOverloadGrad)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Filtros de Bitácora */}
                <FilterBar
                  searchPlaceholder="Buscar por observación, logro, detonante, terapia..."
                  searchValue={searchBitacora}
                  onSearch={setSearchBitacora}
                  activeCount={tab2FilterChips.length}
                  chips={tab2FilterChips}
                  onClearAll={() => {
                    setSearchBitacora("");
                    clearDateRange();
                    setFilterMood("TODOS");
                    setFilterCrisis("TODAS");
                  }}
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Período
                    </label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                    >
                      {DATE_RANGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {dateRange === "custom" && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Desde
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Hasta
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Estado de Ánimo
                    </label>
                    <select
                      value={filterMood}
                      onChange={(e) => setFilterMood(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                    >
                      <option value="TODOS">Todos los estados</option>
                      <option value="Muy Calmo">😊 Muy Calmo</option>
                      <option value="Estable">🙂 Estable</option>
                      <option value="Irritable">😤 Irritable</option>
                      <option value="Ansioso">😰 Ansioso</option>
                      <option value="Triste">😢 Triste</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Episodios / Crisis
                    </label>
                    <select
                      value={filterCrisis}
                      onChange={(e) => setFilterCrisis(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                    >
                      <option value="TODAS">Todas las bitácoras</option>
                      <option value="CON_CRISIS">⚠️ Con Crisis</option>
                      <option value="SIN_CRISIS">✅ Sin Crisis</option>
                    </select>
                  </div>
                </FilterBar>

                {/* Tabla y cards de bitácoras de hogar */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                  <div className="p-4 md:p-6">
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-50 dark:bg-slate-700/50">
                          <tr>
                            <th className="px-4 py-3 font-medium">Fecha</th>
                            <th className="px-4 py-3 font-medium">
                              Estado de Ánimo
                            </th>
                            <th className="px-4 py-3 font-medium">Sueño</th>
                            <th className="px-4 py-3 font-medium">Apetito</th>
                            <th className="px-4 py-3 font-medium">Crisis</th>
                            <th className="px-4 py-3 font-medium">
                              Resumen / Lo Positivo
                            </th>
                            <th className="px-4 py-3 font-medium text-right">
                              Acción
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {pagedBitacoras.length === 0 ? (
                            <tr>
                              <td
                                colSpan={7}
                                className="px-4 py-10 text-center text-gray-400"
                              >
                                <NotebookPen className="w-8 h-8 opacity-30 mx-auto mb-2" />
                                No se encontraron registros de bitácora
                                familiar.
                              </td>
                            </tr>
                          ) : (
                            pagedBitacoras.map((b, idx) => {
                              const mood =
                                b.bit_anim || b.bit_anmo || "Estable";
                              const cfg =
                                moodConfig[mood] || moodConfig["Estable"];
                              const crisisCount =
                                Number(b.bit_crisi || b.bit_cris) || 0;
                              const positiveNoteText =
                                b.bit_logro || b.bit_algo;
                              return (
                                <tr
                                  key={b.bit_codi || idx}
                                  className="hover:bg-gray-50/50 dark:hover:bg-slate-750 transition-colors"
                                >
                                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                    {formatBitacoraDate(b.bit_fech)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${cfg.bg}`}
                                    >
                                      <span>{cfg.emoji}</span>
                                      <span>{mood}</span>
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                                      <Moon className="w-3.5 h-3.5 text-indigo-500" />
                                      <span>
                                        {b.bit_suen || b.bit_sueñ || "—"} hrs
                                        {b.bit_cali && b.bit_cali !== "Normal"
                                          ? ` (${b.bit_cali})`
                                          : ""}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-1 text-slate-700 dark:text-slate-200">
                                      <Utensils className="w-3.5 h-3.5 text-amber-500" />
                                      <span>{b.bit_apet || "Normal"}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    {crisisCount > 0 ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                                        <AlertTriangle className="w-3 h-3" />
                                        {crisisCount} crisis
                                      </span>
                                    ) : (
                                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                                        Sin crisis
                                      </span>
                                    )}
                                  </td>
                                  <td
                                    className="px-4 py-3 max-w-xs"
                                    title={
                                      positiveNoteText ||
                                      b.bit_obse ||
                                      b.bit_text
                                    }
                                  >
                                    {positiveNoteText ? (
                                      <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 shrink-0" />
                                        <span className="truncate">
                                          {positiveNoteText}
                                        </span>
                                      </span>
                                    ) : (
                                      <span className="block truncate">
                                        {b.bit_obse ||
                                          b.bit_text ||
                                          "Sin observaciones"}
                                      </span>
                                    )}
                                    {(b.bit_terap ||
                                      (b.bit_medi !== null &&
                                        b.bit_medi !== undefined)) && (
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {b.bit_terap && (
                                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                                            {THERAPY_STATUS_LABELS[
                                              b.bit_terap
                                            ] || b.bit_terap}
                                          </span>
                                        )}
                                        {b.bit_medi !== null &&
                                          b.bit_medi !== undefined && (
                                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
                                              Med: {b.bit_medi ? "Sí" : "No"}
                                            </span>
                                          )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setSelectedBitacoraDetail(b)
                                      }
                                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors"
                                      title="Ver detalle del reporte de hogar"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Ver Ficha</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile cards para bitácoras */}
                    <div className="md:hidden divide-y divide-gray-100 dark:divide-slate-700 -mx-4 -my-4">
                      {pagedBitacoras.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 text-sm">
                          No se encontraron registros de bitácora familiar.
                        </div>
                      ) : (
                        pagedBitacoras.map((b, idx) => {
                          const mood = b.bit_anim || b.bit_anmo || "Estable";
                          const cfg = moodConfig[mood] || moodConfig["Estable"];
                          const crisisCount =
                            Number(b.bit_crisi || b.bit_cris) || 0;
                          const positiveNoteText = b.bit_logro || b.bit_algo;
                          return (
                            <div
                              key={b.bit_codi || idx}
                              className="p-4 space-y-3 hover:bg-gray-50/50 dark:hover:bg-slate-750 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                  {formatBitacoraDate(b.bit_fech)}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.bg}`}
                                >
                                  <span>{cfg.emoji}</span>
                                  <span>{mood}</span>
                                </span>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50 text-center">
                                  <span className="text-[10px] text-gray-400 block">
                                    Sueño
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {b.bit_suen || b.bit_sueñ || "—"} hrs
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50 text-center">
                                  <span className="text-[10px] text-gray-400 block">
                                    Apetito
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {b.bit_apet || "Normal"}
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-slate-50 dark:bg-slate-700/50 text-center">
                                  <span className="text-[10px] text-gray-400 block">
                                    Crisis
                                  </span>
                                  <span
                                    className={`font-bold ${crisisCount > 0 ? "text-rose-600" : "text-emerald-600"}`}
                                  >
                                    {crisisCount > 0
                                      ? `${crisisCount} crisis`
                                      : "Sin crisis"}
                                  </span>
                                </div>
                              </div>

                              {positiveNoteText && (
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 p-2 rounded-lg flex items-start gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                  <span>{positiveNoteText}</span>
                                </p>
                              )}

                              {(b.bit_terap ||
                                (b.bit_medi !== null &&
                                  b.bit_medi !== undefined)) && (
                                <div className="flex flex-wrap gap-1.5 text-[11px]">
                                  {b.bit_terap && (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-semibold">
                                      {THERAPY_STATUS_LABELS[b.bit_terap] ||
                                        b.bit_terap}
                                    </span>
                                  )}
                                  {b.bit_medi !== null &&
                                    b.bit_medi !== undefined && (
                                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-semibold">
                                        Medicación: {b.bit_medi ? "Sí" : "No"}
                                      </span>
                                    )}
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => setSelectedBitacoraDetail(b)}
                                className="w-full py-2 px-3 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                Ver Ficha Completa del Hogar
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Paginación de Bitácoras */}
                {totalBitPages > 1 && (
                  <div className="pt-2">
                    <Pagination
                      currentPage={bitacoraPage}
                      totalPages={totalBitPages}
                      onPageChange={setBitacoraPage}
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: REGISTRO DE INCIDENTES CONDUCTUALES (MODELO ABC) */}
            {activeTab === "incidentes" && (
              <div className="flex flex-col gap-6">
                {/* KPIs de Incidentes */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-500 dark:text-rose-400">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Total Incidentes
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                        {incidentes.length}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        registrados
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-500 dark:text-amber-400">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Incidentes Severos
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl md:text-3xl font-semibold tracking-tight text-rose-600 dark:text-rose-400">
                        {
                          incidentes.filter(
                            (i) =>
                              i.inc_seve === "Severa" || i.inc_seve === "Grave",
                          ).length
                        }
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        alta prioridad
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-slate-700 col-span-2 md:col-span-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500 dark:text-blue-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Frecuente
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-base md:text-lg font-bold truncate text-slate-800 dark:text-slate-100">
                        {incidentes.length > 0
                          ? incidentes[0].inc_tipo
                          : "Sin registros"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Filtros de Incidentes */}
                <FilterBar
                  searchPlaceholder="Buscar por tipo, detonante, consecuencia..."
                  searchValue={searchIncidente}
                  onSearch={setSearchIncidente}
                  activeCount={tab3FilterChips.length}
                  chips={tab3FilterChips}
                  onClearAll={() => {
                    setSearchIncidente("");
                    clearDateRange();
                    setFilterSeveridad("TODAS");
                    setFilterTipoIncidente("TODOS");
                  }}
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Período
                    </label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                    >
                      {DATE_RANGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {dateRange === "custom" && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Desde
                        </label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Hasta
                        </label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full h-10 px-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                        />
                      </div>
                    </>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Severidad
                    </label>
                    <select
                      value={filterSeveridad}
                      onChange={(e) => setFilterSeveridad(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                    >
                      <option value="TODAS">Todas</option>
                      <option value="Leve">Leve</option>
                      <option value="Moderada">Moderada</option>
                      <option value="Severa">Severa / Grave</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Tipo
                    </label>
                    <select
                      value={filterTipoIncidente}
                      onChange={(e) => setFilterTipoIncidente(e.target.value)}
                      className="w-full h-10 px-3 text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-200"
                    >
                      <option value="TODOS">Todos los tipos</option>
                      <option value="Berrinche">Berrinche</option>
                      <option value="Crisis Sensorial">Crisis Sensorial</option>
                      <option value="Agresión">Agresión</option>
                      <option value="Autoagresión">Autoagresión</option>
                      <option value="Bloqueo / Shutdown">
                        Bloqueo / Shutdown
                      </option>
                      <option value="Desregulación">Desregulación</option>
                    </select>
                  </div>
                </FilterBar>

                {/* Tabla y Acordeón de Incidentes */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
                  <div className="divide-y divide-gray-100 dark:divide-slate-700">
                    {loadingIncidentes ? (
                      <div className="p-8 text-center text-slate-400 text-sm">
                        Cargando incidentes conductuales...
                      </div>
                    ) : pagedIncidentes.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 text-sm flex flex-col items-center justify-center gap-2">
                        <AlertCircle className="w-8 h-8 opacity-30 text-rose-500" />
                        <p className="font-semibold text-slate-600 dark:text-slate-300">
                          No se encontraron incidentes conductuales
                        </p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Los incidentes registrados mediante el formulario
                          A-B-C en el Panel del Paciente se listarán aquí.
                        </p>
                      </div>
                    ) : (
                      pagedIncidentes.map((inc) => {
                        const isExp = expandedIncidente === inc.inc_codi;
                        return (
                          <div key={inc.inc_codi} className="transition-colors">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedIncidente(
                                  isExp ? null : inc.inc_codi,
                                )
                              }
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 shrink-0">
                                  <AlertCircle className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                                      {inc.inc_tipo}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                        inc.inc_seve === "Severa" ||
                                        inc.inc_seve === "Grave"
                                          ? "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400"
                                          : inc.inc_seve === "Moderada"
                                            ? "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                                            : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                      }`}
                                    >
                                      {inc.inc_seve}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[280px] sm:max-w-md">
                                    <strong className="text-slate-700 dark:text-slate-300">
                                      Detonante:
                                    </strong>{" "}
                                    {inc.inc_deto}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0 ml-2">
                                <div className="text-right hidden sm:block">
                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
                                    Duración: {inc.inc_dura}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(inc.inc_time).toLocaleDateString(
                                      "es-ES",
                                    )}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedIncidenteDetail(inc);
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 transition-colors flex items-center gap-1"
                                  title="Ver Ficha Clínica A-B-C"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">
                                    Ver Ficha
                                  </span>
                                </button>
                                {isExp ? (
                                  <ChevronUp className="w-5 h-5 text-slate-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-slate-400" />
                                )}
                              </div>
                            </button>

                            {/* Desglose ABC expandido */}
                            {isExp && (
                              <div className="px-6 pb-6 pt-2 bg-slate-50/70 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                      A — Antecedente / Detonante
                                    </span>
                                    <p className="leading-relaxed">
                                      {inc.inc_deto}
                                    </p>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                      C — Consecuencia / Conducta Observada
                                    </span>
                                    <p className="leading-relaxed">
                                      {inc.inc_conse || "—"}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                      Intervención Aplicada
                                    </span>
                                    <p className="leading-relaxed">
                                      {inc.inc_inter || "—"}
                                    </p>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                      Resultado Observado
                                    </span>
                                    <p className="leading-relaxed">
                                      {inc.inc_resu || "—"}
                                    </p>
                                  </div>
                                </div>

                                {inc.inc_obse && (
                                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                      Observaciones Clínicas
                                    </span>
                                    <p className="leading-relaxed">
                                      {inc.inc_obse}
                                    </p>
                                  </div>
                                )}

                                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
                                  <span>
                                    Fecha y hora exacta:{" "}
                                    <strong className="text-slate-600 dark:text-slate-300">
                                      {new Date(inc.inc_time).toLocaleString(
                                        "es-ES",
                                      )}
                                    </strong>
                                  </span>
                                  {inc.tm_espec && (
                                    <span>
                                      Especialista:{" "}
                                      <strong className="text-slate-600 dark:text-slate-300">
                                        {inc.tm_espec.esp_nomb}{" "}
                                        {inc.tm_espec.esp_apel}
                                      </strong>
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Paginación de Incidentes */}
                {totalIncPages > 1 && (
                  <div className="pt-2">
                    <Pagination
                      currentPage={incidentePage}
                      totalPages={totalIncPages}
                      onPageChange={setIncidentePage}
                    />
                  </div>
                )}
              </div>
            )}

            {/* MODAL 1: DETALLE CLÍNICO DE SESIÓN TERAPÉUTICA */}
            {selectedSessionDetail && (
              <AdminModal
                open={!!selectedSessionDetail}
                isOpen={!!selectedSessionDetail}
                onClose={() => setSelectedSessionDetail(null)}
                title="Bitácora de Sesión Terapéutica"
                subtitle={`${selectedSessionDetail.activityTitle || "Actividad Terapéutica"} · Fecha: ${selectedSessionDetail.fec_repo}`}
                maxWidth="max-w-2xl"
              >
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate text-base">
                          {selectedSessionDetail.activityTitle ||
                            "Sesión Terapéutica"}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Registrado en el historial clínico del paciente
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                        selectedSessionDetail.fue_efec
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                      }`}
                    >
                      {selectedSessionDetail.fue_efec
                        ? "Sesión Efectiva"
                        : "Requiere Ajuste"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                      <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide block mb-1">
                        Tiempo en Calma
                      </span>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">
                        {selectedSessionDetail.pro_calm != null
                          ? `${selectedSessionDetail.pro_calm}%`
                          : "—"}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                      <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide block mb-1">
                        Biometría Cardíaca
                      </span>
                      <p className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        <Heart className="w-4 h-4 text-rose-500 fill-current" />
                        {selectedSessionDetail.avg_bpm
                          ? `${selectedSessionDetail.avg_bpm} BPM`
                          : "—"}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide block mb-1">
                        Cooperación
                      </span>
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= (selectedSessionDetail.cooperation || 4)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 dark:text-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide block mb-1">
                        Progreso
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {selectedSessionDetail.stepsDone != null &&
                        selectedSessionDetail.stepsTotal != null
                          ? `${selectedSessionDetail.stepsDone}/${selectedSessionDetail.stepsTotal} pasos`
                          : "Completada"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <NotebookPen className="w-4 h-4 text-blue-500" />
                      Notas y Observaciones Clínicas
                    </h5>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {selectedSessionDetail.cleanNote ||
                        selectedSessionDetail.com_tend ||
                        "Sin notas adicionales registradas para esta sesión."}
                    </p>
                  </div>

                  {selectedSessionDetail.rawSession?.tr_alert?.length > 0 && (
                    <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2">
                      <h5 className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Alertas Sensoriales Detectadas (
                        {selectedSessionDetail.rawSession.tr_alert.length})
                      </h5>
                      <div className="space-y-1.5">
                        {selectedSessionDetail.rawSession.tr_alert.map(
                          (al, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between"
                            >
                              <span>
                                • {al.ale_meto || "Sobrecarga Sensorial"}
                              </span>
                              <span className="text-[11px] text-rose-500">
                                {new Date(al.ale_time).toLocaleTimeString(
                                  "es-ES",
                                  { hour: "2-digit", minute: "2-digit" },
                                )}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedSessionDetail(null)}
                    >
                      Cerrar Bitácora
                    </Button>
                  </div>
                </div>
              </AdminModal>
            )}

            {/* MODAL 2: FICHA DE BITÁCORA DEL HOGAR */}
            {selectedBitacoraDetail && (
              <AdminModal
                open={!!selectedBitacoraDetail}
                isOpen={!!selectedBitacoraDetail}
                onClose={() => setSelectedBitacoraDetail(null)}
                title="Ficha de Bitácora del Hogar"
                subtitle={`Reporte familiar del paciente · Fecha: ${formatBitacoraDate(selectedBitacoraDetail.bit_fech)}`}
                maxWidth="max-w-2xl"
              >
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">
                        {moodConfig[
                          selectedBitacoraDetail.bit_anim ||
                            selectedBitacoraDetail.bit_anmo
                        ]?.emoji || "🙂"}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">
                          Estado de Ánimo:{" "}
                          {selectedBitacoraDetail.bit_anim ||
                            selectedBitacoraDetail.bit_anmo ||
                            "Estable"}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Registrado por el representante en el Diario Familiar
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                        Number(
                          selectedBitacoraDetail.bit_crisi ||
                            selectedBitacoraDetail.bit_cris,
                        ) > 0
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      }`}
                    >
                      {Number(
                        selectedBitacoraDetail.bit_crisi ||
                          selectedBitacoraDetail.bit_cris,
                      ) > 0
                        ? `${selectedBitacoraDetail.bit_crisi || selectedBitacoraDetail.bit_cris} crisis reportada(s)`
                        : "Jornada sin crisis"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide block mb-1 flex items-center gap-1">
                        <Moon className="w-3.5 h-3.5" /> Horas de Sueño
                      </span>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">
                        {selectedBitacoraDetail.bit_suen ||
                          selectedBitacoraDetail.bit_sueñ ||
                          "—"}{" "}
                        hrs
                      </p>
                      {selectedBitacoraDetail.bit_cali && (
                        <span className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 font-medium">
                          Calidad: {selectedBitacoraDetail.bit_cali}
                        </span>
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide block mb-1 flex items-center gap-1">
                        <Utensils className="w-3.5 h-3.5" /> Apetito
                      </span>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {selectedBitacoraDetail.bit_apet || "Normal"}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                      <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wide block mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Crisis /
                        Episodios
                      </span>
                      <p className="text-xl font-bold text-slate-900 dark:text-white">
                        {selectedBitacoraDetail.bit_crisi ||
                          selectedBitacoraDetail.bit_cris ||
                          0}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide block mb-1 flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" /> Pulso Reposo
                      </span>
                      <p className="text-base font-bold text-slate-900 dark:text-white mt-1">
                        {selectedBitacoraDetail.bit_bpm
                          ? `${selectedBitacoraDetail.bit_bpm} BPM`
                          : "No medido"}
                      </p>
                    </div>
                  </div>

                  {(selectedBitacoraDetail.bit_medi !== null &&
                    selectedBitacoraDetail.bit_medi !== undefined) ||
                  selectedBitacoraDetail.bit_terap ||
                  selectedBitacoraDetail.bit_diges ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {selectedBitacoraDetail.bit_medi !== null &&
                        selectedBitacoraDetail.bit_medi !== undefined && (
                          <div className="p-3 rounded-xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                              <Pill className="w-3.5 h-3.5" /> Medicación
                            </span>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              {selectedBitacoraDetail.bit_medi
                                ? "Administrada"
                                : "No administrada"}
                            </p>
                          </div>
                        )}
                      {selectedBitacoraDetail.bit_terap && (
                        <div className="p-3 rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30">
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                            Terapia en Casa
                          </span>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {THERAPY_STATUS_LABELS[
                              selectedBitacoraDetail.bit_terap
                            ] || selectedBitacoraDetail.bit_terap}
                          </p>
                        </div>
                      )}
                      {selectedBitacoraDetail.bit_diges && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80">
                          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                            Digestión
                          </span>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {selectedBitacoraDetail.bit_diges}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {(selectedBitacoraDetail.bit_logro ||
                    selectedBitacoraDetail.bit_algo) && (
                    <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1.5">
                      <h5 className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        Lo Positivo del Día / Logro Destacado
                      </h5>
                      <p className="text-sm text-emerald-900 dark:text-emerald-100 leading-relaxed">
                        {selectedBitacoraDetail.bit_logro ||
                          selectedBitacoraDetail.bit_algo}
                      </p>
                    </div>
                  )}

                  {selectedBitacoraDetail.bit_senso && (
                    <div className="p-4 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-1.5">
                      <h5 className="text-xs font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                        Sensibilidad Sensorial Observada
                      </h5>
                      <p className="text-sm text-purple-900 dark:text-purple-100 leading-relaxed">
                        {selectedBitacoraDetail.bit_senso}
                      </p>
                    </div>
                  )}

                  {(selectedBitacoraDetail.bit_deto ||
                    selectedBitacoraDetail.bit_dese) && (
                    <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-1.5">
                      <h5 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        Detonante o Desencadenante Observado en Casa
                      </h5>
                      <p className="text-sm text-amber-900 dark:text-amber-100 leading-relaxed">
                        {selectedBitacoraDetail.bit_deto ||
                          selectedBitacoraDetail.bit_dese}
                      </p>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1.5">
                    <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <NotebookPen className="w-4 h-4 text-blue-500" />
                      Observaciones y Comentarios de la Familia
                    </h5>
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {selectedBitacoraDetail.bit_obse ||
                        selectedBitacoraDetail.bit_text ||
                        "Sin observaciones adicionales reportadas."}
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedBitacoraDetail(null)}
                    >
                      Cerrar Detalle
                    </Button>
                  </div>
                </div>
              </AdminModal>
            )}

            {/* MODAL 3: AUDITORÍA DE INCIDENTE CONDUCTUAL A-B-C */}
            {selectedIncidenteDetail && (
              <AdminModal
                open={!!selectedIncidenteDetail}
                isOpen={!!selectedIncidenteDetail}
                onClose={() => setSelectedIncidenteDetail(null)}
                title="Auditoría de Incidente Conductual (Modelo A-B-C)"
                subtitle={`${selectedIncidenteDetail.inc_tipo} · Registrado el ${new Date(selectedIncidenteDetail.inc_time).toLocaleString("es-ES")}`}
                maxWidth="max-w-2xl"
              >
                <div className="space-y-5">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-base">
                          {selectedIncidenteDetail.inc_tipo}
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Duración estimada:{" "}
                          {selectedIncidenteDetail.inc_dura ||
                            "No especificada"}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                        selectedIncidenteDetail.inc_seve === "Severa" ||
                        selectedIncidenteDetail.inc_seve === "Grave"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
                          : selectedIncidenteDetail.inc_seve === "Moderada"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                            : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                      }`}
                    >
                      Severidad {selectedIncidenteDetail.inc_seve}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-1">
                        A — Antecedente / Detonante
                      </span>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        {selectedIncidenteDetail.inc_deto || "No especificado"}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block mb-1">
                        B & C — Conducta Observada y Consecuencia
                      </span>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        {selectedIncidenteDetail.inc_conse || "No especificado"}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-1">
                          Intervención Aplicada
                        </span>
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                          {selectedIncidenteDetail.inc_inter ||
                            "No especificada"}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                          Resultado Obtenido
                        </span>
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                          {selectedIncidenteDetail.inc_resu ||
                            "No especificado"}
                        </p>
                      </div>
                    </div>

                    {selectedIncidenteDetail.inc_obse && (
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Observaciones Clínicas del Especialista
                        </span>
                        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                          {selectedIncidenteDetail.inc_obse}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedIncidenteDetail.tm_espec && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                      Especialista que documentó:{" "}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {selectedIncidenteDetail.tm_espec.esp_nomb}{" "}
                        {selectedIncidenteDetail.tm_espec.esp_apel}
                      </strong>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      variant="secondary"
                      onClick={() => setSelectedIncidenteDetail(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              </AdminModal>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
