import { useState, useMemo } from "react";
import {
  Download,
  FileText,
  Activity,
  AlertTriangle,
  Heart,
  Calendar,
  ShieldCheck,
  User,
  Users,
  ChevronDown,
  Eye,
  X,
  NotebookPen,
  Smile,
  Moon,
  Utensils,
  CheckCircle2,
} from "lucide-react";
import { useGlobalContext } from "../../context/GlobalState";
import Pagination from "../shared/Pagination";
import FilterBar from "../shared/FilterBar";
import * as XLSX from "xlsx";
import useExpandableRows from "../../hooks/useExpandableRows";

const PAGE_SIZE = 10;

function calculateAge(birthDateStr) {
  if (!birthDateStr) return "-";
  try {
    const dob = new Date(birthDateStr);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    const age = Math.abs(ageDt.getUTCFullYear() - 1970);
    return `${age} años`;
  } catch {
    return "-";
  }
}

export default function HistorialClinicoTab({
  incidentesData = [],
  bitacorasData = [],
  ninosData = [],
  especialistasData = [],
  loading = false,
}) {
  const { showToast } = useGlobalContext();
  const { expandedId, toggle } = useExpandableRows();
  const [subTab, setSubTab] = useState("incidentes"); // "incidentes" | "bitacoras" | "pacientes"

  // Filtros de Incidentes
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("TODOS");
  const [filterSeveridad, setFilterSeveridad] = useState("TODAS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Filtros de Bitácoras
  const [bitSearch, setBitSearch] = useState("");
  const [bitMood, setBitMood] = useState("TODOS");
  const [bitCrisis, setBitCrisis] = useState("TODAS");
  const [bitStartDate, setBitStartDate] = useState("");
  const [bitEndDate, setBitEndDate] = useState("");
  const [bitPage, setBitPage] = useState(0);
  const [selectedBitacora, setSelectedBitacora] = useState(null);

  // Filtros de Pacientes
  const [patientSearch, setPatientSearch] = useState("");
  const [patientPage, setPatientPage] = useState(0);

  // Normalización de Incidentes (soporta estructura inc_* del backend y standard)
  const normalizedIncidents = useMemo(() => {
    const list = Array.isArray(incidentesData) ? incidentesData : [];
    const ninosMap = Object.fromEntries(
      (ninosData || []).map((n) => [n.nin_codi, n]),
    );
    const espMap = Object.fromEntries(
      (especialistasData || []).map((e) => [e.esp_codi, e]),
    );

    return list.map((item, index) => {
      const child = item.nin_codi ? ninosMap[item.nin_codi] : null;
      const childName =
        item.nin_nomb ||
        (child ? `${child.nin_nomb} ${child.nin_apel || ""}`.trim() : null) ||
        `Paciente #${item.nin_codi || index + 1}`;

      const esp = item.esp_codi ? espMap[item.esp_codi] : null;
      const espName =
        item.esp_nomb ||
        (esp ? `${esp.esp_nomb} ${esp.esp_apel || ""}`.trim() : null) ||
        "Especialista Staff";

      return {
        id: item.inc_codi || item.id || `inc-${index + 1}`,
        nin_codi: item.nin_codi,
        nin_nomb: childName,
        esp_nomb: espName,
        tipo: (item.inc_tipo || item.tipo || "CRISIS").toUpperCase(),
        severidad: (
          item.inc_seve ||
          item.severidad ||
          "MODERADA"
        ).toUpperCase(),
        bpm_max: item.inc_bpm || item.bpm_max || null,
        duracion_min: item.inc_dura || item.duracion_min || 0,
        fecha:
          item.inc_time ||
          item.inc_fech ||
          item.fecha ||
          item.created_at ||
          new Date().toISOString(),
        descripcion:
          item.inc_deto ||
          item.descripcion ||
          item.inc_obse ||
          "Sin descripción",
        intervencion:
          item.inc_inter ||
          item.intervencion ||
          "Estrategia de autorregulación aplicada",
        estado: item.inc_resu || item.estado || "RESUELTO",
        observaciones: item.inc_obse || item.observaciones || "",
      };
    });
  }, [incidentesData, ninosData, especialistasData]);

  // Normalización de Bitácoras del Hogar
  const normalizedBitacoras = useMemo(() => {
    const list = Array.isArray(bitacorasData) ? bitacorasData : [];
    const ninosMap = Object.fromEntries(
      (ninosData || []).map((n) => [n.nin_codi, n]),
    );

    return list.map((b, idx) => {
      const child = b.nin_codi ? ninosMap[b.nin_codi] : null;
      const childName =
        b.nin_nomb ||
        (child ? `${child.nin_nomb} ${child.nin_apel || ""}`.trim() : null) ||
        `Paciente #${b.nin_codi || idx + 1}`;

      const mood = b.bit_anim || b.bit_anmo || "Estable";
      const dateStr =
        b.bit_fech || b.bit_crea || b.fecha || new Date().toISOString();

      return {
        id: b.bit_codi || b.id || `bit-${idx + 1}`,
        nin_codi: b.nin_codi,
        nin_nomb: childName,
        fecha: dateStr,
        animo: mood,
        sueno: b.bit_suen || b.bit_sueñ || 0,
        calidadSueno: b.bit_cali || "Normal",
        apetito: b.bit_apet || "Normal",
        crisis: Number(b.bit_crisi || b.bit_cris) || 0,
        observaciones:
          b.bit_obse || b.observaciones || "Sin observaciones registradas",
        desencadenantes: b.bit_dese || b.desencadenantes || "No reportados",
        sensibilidad: b.bit_senso || b.sensibilidad || "Normal",
      };
    });
  }, [bitacorasData, ninosData]);

  // Normalización de Directorio de Pacientes
  const normalizedPatients = useMemo(() => {
    const list = Array.isArray(ninosData) ? ninosData : [];
    const espMap = Object.fromEntries(
      (especialistasData || []).map((e) => [e.esp_codi, e]),
    );

    const incCountMap = {};
    normalizedIncidents.forEach((inc) => {
      if (inc.nin_codi) {
        incCountMap[inc.nin_codi] = (incCountMap[inc.nin_codi] || 0) + 1;
      }
    });

    const bitCountMap = {};
    normalizedBitacoras.forEach((b) => {
      if (b.nin_codi) {
        bitCountMap[b.nin_codi] = (bitCountMap[b.nin_codi] || 0) + 1;
      }
    });

    return list.map((child) => {
      const esp = child.esp_codi ? espMap[child.esp_codi] : null;
      return {
        id: child.nin_codi,
        nombre: `${child.nin_nomb} ${child.nin_apel || ""}`.trim(),
        edad:
          child.nin_edad ||
          (child.nin_fecn ? calculateAge(child.nin_fecn) : "-"),
        diagnostico: child.nin_diag || "Condición del Neurodesarrollo",
        especialista: esp
          ? `${esp.esp_nomb} ${esp.esp_apel || ""}`.trim()
          : "No asignado",
        totalIncidentes: incCountMap[child.nin_codi] || 0,
        totalBitacoras: bitCountMap[child.nin_codi] || 0,
        estado: child.nin_stdo || "Activo",
      };
    });
  }, [ninosData, especialistasData, normalizedIncidents, normalizedBitacoras]);

  // Filtrado de Incidentes
  const filteredIncidents = useMemo(() => {
    return normalizedIncidents.filter((item) => {
      const q = search.toLowerCase();
      const searchMatch =
        !search ||
        (item.nin_nomb || "").toLowerCase().includes(q) ||
        (item.esp_nomb || "").toLowerCase().includes(q) ||
        (item.descripcion || "").toLowerCase().includes(q);

      const tipoMatch = filterTipo === "TODOS" || item.tipo === filterTipo;
      const severidadMatch =
        filterSeveridad === "TODAS" || item.severidad === filterSeveridad;

      let dateMatch = true;
      if (startDate) {
        dateMatch = dateMatch && new Date(item.fecha) >= new Date(startDate);
      }
      if (endDate) {
        dateMatch =
          dateMatch && new Date(item.fecha) <= new Date(`${endDate}T23:59:59`);
      }

      return searchMatch && tipoMatch && severidadMatch && dateMatch;
    });
  }, [
    normalizedIncidents,
    search,
    filterTipo,
    filterSeveridad,
    startDate,
    endDate,
  ]);

  // Filtrado de Bitácoras
  const filteredBitacoras = useMemo(() => {
    return normalizedBitacoras.filter((item) => {
      const q = bitSearch.toLowerCase();
      const searchMatch =
        !bitSearch ||
        (item.nin_nomb || "").toLowerCase().includes(q) ||
        (item.observaciones || "").toLowerCase().includes(q) ||
        (item.desencadenantes || "").toLowerCase().includes(q);

      const moodMatch = bitMood === "TODOS" || item.animo === bitMood;
      const crisisMatch =
        bitCrisis === "TODAS" ||
        (bitCrisis === "CON_CRISIS" && item.crisis > 0) ||
        (bitCrisis === "SIN_CRISIS" && item.crisis === 0);

      let dateMatch = true;
      if (bitStartDate) {
        dateMatch = dateMatch && new Date(item.fecha) >= new Date(bitStartDate);
      }
      if (bitEndDate) {
        dateMatch =
          dateMatch &&
          new Date(item.fecha) <= new Date(`${bitEndDate}T23:59:59`);
      }

      return searchMatch && moodMatch && crisisMatch && dateMatch;
    });
  }, [
    normalizedBitacoras,
    bitSearch,
    bitMood,
    bitCrisis,
    bitStartDate,
    bitEndDate,
  ]);

  // Filtrado de Pacientes
  const filteredPatients = useMemo(() => {
    return normalizedPatients.filter((p) => {
      if (!patientSearch) return true;
      const q = patientSearch.toLowerCase();
      return (
        p.nombre.toLowerCase().includes(q) ||
        p.especialista.toLowerCase().includes(q) ||
        p.diagnostico.toLowerCase().includes(q)
      );
    });
  }, [normalizedPatients, patientSearch]);

  // Paginaciones
  const totalIncPages = Math.ceil(filteredIncidents.length / PAGE_SIZE);
  const pagedIncidents = filteredIncidents.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  const totalBitPages = Math.ceil(filteredBitacoras.length / PAGE_SIZE);
  const pagedBitacoras = filteredBitacoras.slice(
    bitPage * PAGE_SIZE,
    (bitPage + 1) * PAGE_SIZE,
  );

  const totalPatPages = Math.ceil(filteredPatients.length / PAGE_SIZE);
  const pagedPatients = filteredPatients.slice(
    patientPage * PAGE_SIZE,
    (patientPage + 1) * PAGE_SIZE,
  );

  // KPIs de Incidentes
  const totalSeveras = filteredIncidents.filter(
    (i) => i.severidad === "SEVERA",
  ).length;
  const totalResueltos = filteredIncidents.filter(
    (i) => i.estado === "RESUELTO" || i.estado === "COMPLETADO",
  ).length;
  const tasaEfectividad =
    filteredIncidents.length > 0
      ? Math.round((totalResueltos / filteredIncidents.length) * 100)
      : 100;
  const peakBpm = Math.max(...filteredIncidents.map((i) => i.bpm_max || 0), 0);

  // KPIs de Bitácoras
  const totalBitacoras = normalizedBitacoras.length;
  const activePatientsWithBitacora = new Set(
    normalizedBitacoras.map((b) => b.nin_codi).filter(Boolean),
  ).size;
  const adherenceRate =
    ninosData.length > 0
      ? Math.round((activePatientsWithBitacora / ninosData.length) * 100)
      : 0;
  const calmCount = normalizedBitacoras.filter(
    (b) => b.animo === "Muy Calmo" || b.animo === "Estable",
  ).length;
  const calmPercentage =
    totalBitacoras > 0 ? Math.round((calmCount / totalBitacoras) * 100) : 0;
  const totalHomeCrisis = normalizedBitacoras.reduce(
    (acc, b) => acc + (b.crisis || 0),
    0,
  );

  // Exportaciones de Incidentes
  const exportExcel = () => {
    const data = filteredIncidents.map((item) => ({
      "ID Evento": item.id,
      Paciente: item.nin_nomb,
      Especialista: item.esp_nomb,
      "Tipo de Registro": item.tipo,
      Severidad: item.severidad,
      "BPM Máximo": item.bpm_max || "N/A",
      "Duración (min)": item.duracion_min || 0,
      "Fecha y Hora": new Date(item.fecha).toLocaleString("es-ES"),
      "Descripción / Disparador": item.descripcion,
      "Intervención Clínica": item.intervencion || "-",
      Estado: item.estado,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historial_Clinico");
    XLSX.writeFile(
      workbook,
      `historial_clinico_siat_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    showToast("✅ Historial clínico exportado a Excel exitosamente");
  };

  const exportPDF = async () => {
    try {
      const { createStyledPdf } = await import("../../utils/pdfExporter");
      const columns = [
        "Paciente",
        "Especialista",
        "Tipo",
        "Severidad",
        "BPM",
        "Fecha",
        "Estado",
      ];
      const rows = filteredIncidents.map((i) => [
        i.nin_nomb,
        i.esp_nomb,
        i.tipo,
        i.severidad,
        i.bpm_max ? `${i.bpm_max} BPM` : "-",
        new Date(i.fecha).toLocaleDateString("es-ES"),
        i.estado,
      ]);
      await createStyledPdf(
        "Historial Clínico Global — SIAT",
        "historial_clinico_siat.pdf",
        columns,
        rows,
        {
          pageTitle: "Registro Unificado de Incidentes y Evolución Clínica",
        },
      );
      showToast("✅ Reporte PDF del historial clínico generado");
    } catch (err) {
      console.error(err);
      showToast("❌ Error al exportar PDF del historial clínico");
    }
  };

  // Exportaciones de Bitácoras
  const exportBitacorasExcel = () => {
    const data = filteredBitacoras.map((b) => ({
      ID: b.id,
      Paciente: b.nin_nomb,
      Fecha: new Date(b.fecha).toLocaleDateString("es-ES"),
      "Estado de Ánimo": b.animo,
      "Sueño (horas)": b.sueno,
      "Calidad de Sueño": b.calidadSueno,
      Apetito: b.apetito,
      "Crisis Reportadas": b.crisis,
      Observaciones: b.observaciones,
      Desencadenantes: b.desencadenantes,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bitacoras_Hogar");
    XLSX.writeFile(
      workbook,
      `bitacoras_hogar_siat_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
    showToast("✅ Bitácoras del hogar exportadas a Excel exitosamente");
  };

  const exportBitacorasPDF = async () => {
    try {
      const { createStyledPdf } = await import("../../utils/pdfExporter");
      const columns = [
        "Paciente",
        "Fecha",
        "Ánimo",
        "Sueño",
        "Apetito",
        "Crisis",
        "Observaciones",
      ];
      const rows = filteredBitacoras.map((b) => [
        b.nin_nomb,
        new Date(b.fecha).toLocaleDateString("es-ES"),
        b.animo,
        `${b.sueno} hrs`,
        b.apetito,
        b.crisis > 0 ? `${b.crisis} crisis` : "Sin crisis",
        b.observaciones.slice(0, 40) +
          (b.observaciones.length > 40 ? "..." : ""),
      ]);
      await createStyledPdf(
        "Auditoría de Bitácoras Familiares — SIAT",
        "bitacoras_familiares_siat.pdf",
        columns,
        rows,
        {
          pageTitle: "Supervisión Institucional de Registros del Hogar",
        },
      );
      showToast("✅ Reporte PDF de bitácoras generado exitosamente");
    } catch (err) {
      console.error(err);
      showToast("❌ Error al exportar PDF de bitácoras");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Selector de Sub-vistas Moderno */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setSubTab("incidentes");
            setPage(0);
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            subTab === "incidentes"
              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          <span>Incidentes y Crisis</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 font-bold">
            {normalizedIncidents.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubTab("bitacoras");
            setBitPage(0);
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            subTab === "bitacoras"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
          }`}
        >
          <NotebookPen className="w-4 h-4 text-emerald-500" />
          <span>Bitácoras del Hogar</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 font-bold">
            {normalizedBitacoras.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubTab("pacientes");
            setPatientPage(0);
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
            subTab === "pacientes"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50"
          }`}
        >
          <Users className="w-4 h-4 text-blue-500" />
          <span>Directorio de Pacientes</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/50 font-bold">
            {normalizedPatients.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VISTA 1: INCIDENTES Y CRISIS CONDUCTUALES                */}
      {/* ======================================================== */}
      {subTab === "incidentes" && (
        <div className="space-y-4">
          {/* Metric Summaries */}
          <div
            data-tour="admin-hc-kpis"
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Total Eventos
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {filteredIncidents.length}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Crisis Severas
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {totalSeveras}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Efectividad Intervención
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {tasaEfectividad}%
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Picos Cardíacos
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {peakBpm} <span className="text-xs font-normal">BPM</span>
                </p>
              </div>
            </div>
          </div>

          {/* Filters Bar */}
          <FilterBar
            dataTour="admin-hc-filters"
            searchValue={search}
            onSearch={(v) => {
              setSearch(v);
              setPage(0);
            }}
            searchPlaceholder="Buscar por paciente, especialista o síntoma..."
            activeCount={
              (search ? 1 : 0) +
              (filterTipo !== "TODOS" ? 1 : 0) +
              (filterSeveridad !== "TODAS" ? 1 : 0) +
              (startDate ? 1 : 0) +
              (endDate ? 1 : 0)
            }
            onClearAll={() => {
              setSearch("");
              setFilterTipo("TODOS");
              setFilterSeveridad("TODAS");
              setStartDate("");
              setEndDate("");
              setPage(0);
            }}
          >
            <select
              value={filterTipo}
              onChange={(e) => {
                setFilterTipo(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="TODOS">Todos los tipos</option>
              <option value="CRISIS">Crisis de Sobrecarga</option>
              <option value="INCIDENTE">Incidente Conductual</option>
              <option value="BERRINCHE">Berrinche / Desregulación</option>
              <option value="MELTDOWN SENSORIAL">Meltdown Sensorial</option>
              <option value="ESTEREOTIPIA">Estereotipia</option>
              <option value="AGRESIÓN">Agresión</option>
              <option value="AUTO-LESIÓN">Auto-lesión</option>
            </select>

            <select
              value={filterSeveridad}
              onChange={(e) => {
                setFilterSeveridad(e.target.value);
                setPage(0);
              }}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="TODAS">Todas las severidades</option>
              <option value="LEVE">Leve</option>
              <option value="MODERADA">Moderada</option>
              <option value="SEVERA">Severa / Crítica</option>
            </select>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400">a</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </FilterBar>

          {/* Main Table */}
          <div
            data-tour="admin-hc-table"
            className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Registro Clínico de Incidentes
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full whitespace-nowrap">
                  {filteredIncidents.length} registros
                </span>
                <button
                  type="button"
                  onClick={exportPDF}
                  aria-label="Exportar a PDF"
                  title="Exportar a PDF"
                  className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={exportExcel}
                  aria-label="Exportar a Excel"
                  title="Exportar a Excel"
                  className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">
                Cargando datos clínicos...
              </div>
            ) : pagedIncidents.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold">
                  No se encontraron eventos clínicos
                </p>
                <p className="text-xs mt-1">
                  Intenta ajustar los filtros de búsqueda o fechas.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse responsive-table">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3">Paciente</th>
                        <th className="px-6 py-3">Tipo / Severidad</th>
                        <th className="px-6 py-3 hidden md:table-cell">
                          Especialista / Origen
                        </th>
                        <th className="px-6 py-3 text-center">BPM Peak</th>
                        <th className="px-6 py-3">Fecha y Hora</th>
                        <th className="px-6 py-3 text-right">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {pagedIncidents.map((item) => (
                        <tr
                          key={item.id}
                          className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${expandedId === item.id ? "mobile-expanded" : ""}`}
                        >
                          <td
                            className="px-6 py-4 mobile-summary"
                            data-label="Paciente"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-900 dark:text-white truncate">
                                {item.nin_nomb}
                              </div>
                              <div className="text-xs text-slate-400 font-mono">
                                ID: {item.id}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="mobile-expand-btn"
                              onClick={() => toggle(item.id)}
                              aria-label={
                                expandedId === item.id ? "Ver menos" : "Ver más"
                              }
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          </td>
                          <td
                            className="px-6 py-4 mobile-detail"
                            data-label="Tipo / Severidad"
                          >
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                                  item.tipo.includes("CRISIS") ||
                                  item.tipo.includes("MELTDOWN")
                                    ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    : item.tipo.includes("BERRINCHE")
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                }`}
                              >
                                {item.tipo}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  item.severidad === "SEVERA" ||
                                  item.severidad === "GRAVE"
                                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                                    : item.severidad === "MODERADA"
                                      ? "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400"
                                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                {item.severidad}
                              </span>
                            </div>
                          </td>
                          <td
                            className="px-6 py-4 hidden md:table-cell mobile-detail"
                            data-label="Especialista"
                          >
                            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                              <User className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-xs">{item.esp_nomb}</span>
                            </div>
                          </td>
                          <td
                            className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300 mobile-detail"
                            data-label="BPM"
                          >
                            {item.bpm_max ? `${item.bpm_max} BPM` : "-"}
                          </td>
                          <td
                            className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 mobile-detail"
                            data-label="Fecha"
                          >
                            {new Date(item.fecha).toLocaleString("es-ES", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}
                          </td>
                          <td
                            className="px-6 py-4 text-right mobile-detail"
                            data-label="Detalle"
                          >
                            <button
                              onClick={() => setSelectedIncident(item)}
                              title="Ver ficha"
                              className="action-icon-btn text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 ml-auto"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={page}
                  totalPages={totalIncPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 2: AUDITORÍA DE BITÁCORAS DEL HOGAR (CUMPLIMIENTO) */}
      {/* ======================================================== */}
      {subTab === "bitacoras" && (
        <div className="space-y-4">
          {/* Bitácoras KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <NotebookPen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Total Bitácoras
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {filteredBitacoras.length}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Adherencia Familiar
                </p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {adherenceRate}%
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                <Smile className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Clima de Calma
                </p>
                <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                  {calmPercentage}%
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Crisis en el Hogar
                </p>
                <p className="text-lg font-bold text-rose-600 dark:text-rose-400">
                  {totalHomeCrisis}
                </p>
              </div>
            </div>
          </div>

          {/* Filters Bar Bitacoras */}
          <FilterBar
            searchValue={bitSearch}
            onSearch={(v) => {
              setBitSearch(v);
              setBitPage(0);
            }}
            searchPlaceholder="Buscar por paciente, observación, detonante..."
            activeCount={
              (bitSearch ? 1 : 0) +
              (bitMood !== "TODOS" ? 1 : 0) +
              (bitCrisis !== "TODAS" ? 1 : 0) +
              (bitStartDate ? 1 : 0) +
              (bitEndDate ? 1 : 0)
            }
            onClearAll={() => {
              setBitSearch("");
              setBitMood("TODOS");
              setBitCrisis("TODAS");
              setBitStartDate("");
              setBitEndDate("");
              setBitPage(0);
            }}
          >
            <select
              value={bitMood}
              onChange={(e) => {
                setBitMood(e.target.value);
                setBitPage(0);
              }}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="TODOS">Todos los estados de ánimo</option>
              <option value="Muy Calmo">😊 Muy Calmo</option>
              <option value="Estable">🙂 Estable</option>
              <option value="Irritable">😤 Irritable</option>
              <option value="Crisis / Sobrecarga">
                💥 Crisis / Sobrecarga
              </option>
              <option value="Ansioso">😰 Ansioso</option>
            </select>

            <select
              value={bitCrisis}
              onChange={(e) => {
                setBitCrisis(e.target.value);
                setBitPage(0);
              }}
              className="px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="TODAS">Todos los reportes</option>
              <option value="CON_CRISIS">⚠️ Con Crisis Reportada</option>
              <option value="SIN_CRISIS">✅ Sin Crisis</option>
            </select>

            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="date"
                value={bitStartDate}
                onChange={(e) => setBitStartDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-400">a</span>
              <input
                type="date"
                value={bitEndDate}
                onChange={(e) => setBitEndDate(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </FilterBar>

          {/* Main Table Bitacoras */}
          <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Supervisión de Registros del Hogar
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full whitespace-nowrap">
                  {filteredBitacoras.length} bitácoras
                </span>
                <button
                  type="button"
                  onClick={exportBitacorasPDF}
                  aria-label="Exportar a PDF"
                  title="Exportar a PDF"
                  className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
                >
                  <FileText className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={exportBitacorasExcel}
                  aria-label="Exportar a Excel"
                  title="Exportar a Excel"
                  className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">
                Cargando bitácoras familiares...
              </div>
            ) : pagedBitacoras.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <NotebookPen className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold">
                  No se encontraron bitácoras familiares
                </p>
                <p className="text-xs mt-1">
                  Los registros ingresados por los representantes aparecerán
                  aquí.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse responsive-table">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3">Paciente</th>
                        <th className="px-6 py-3">Fecha</th>
                        <th className="px-6 py-3">Estado de Ánimo</th>
                        <th className="px-6 py-3">Sueño</th>
                        <th className="px-6 py-3">Apetito</th>
                        <th className="px-6 py-3">Crisis</th>
                        <th className="px-6 py-3 text-right">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {pagedBitacoras.map((b) => (
                        <tr
                          key={b.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {b.nin_nomb}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {new Date(b.fecha).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                                b.animo === "Muy Calmo"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40"
                                  : b.animo === "Estable"
                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/40"
                                    : b.animo === "Irritable"
                                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40"
                                      : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40"
                              }`}
                            >
                              {b.animo}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Moon className="w-3.5 h-3.5 text-indigo-500" />
                              {b.sueno} hrs
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <Utensils className="w-3.5 h-3.5 text-amber-500" />
                              {b.apetito}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {b.crisis > 0 ? (
                              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/50">
                                {b.crisis} crisis
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">
                                Sin crisis
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => setSelectedBitacora(b)}
                              title="Ver detalle del reporte"
                              className="action-icon-btn text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 ml-auto"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={bitPage}
                  totalPages={totalBitPages}
                  onPageChange={setBitPage}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VISTA 3: DIRECTORIO DE PACIENTES Y EVOLUCIÓN             */}
      {/* ======================================================== */}
      {subTab === "pacientes" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Total de Pacientes
                </p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {normalizedPatients.length}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Con Especialista Asignado
                </p>
                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {
                    normalizedPatients.filter(
                      (p) => p.especialista !== "No asignado",
                    ).length
                  }
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Con Incidentes Registrados
                </p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                  {
                    normalizedPatients.filter((p) => p.totalIncidentes > 0)
                      .length
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Directorio y Monitoreo de Casos
              </h2>
              <div className="w-full sm:w-64">
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setPatientPage(0);
                  }}
                  placeholder="Buscar paciente o diagnóstico..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">
                Cargando directorio de pacientes...
              </div>
            ) : pagedPatients.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold">No se encontraron pacientes</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse responsive-table">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-6 py-3">Paciente</th>
                        <th className="px-6 py-3">Edad</th>
                        <th className="px-6 py-3">Diagnóstico</th>
                        <th className="px-6 py-3">Especialista Asignado</th>
                        <th className="px-6 py-3 text-center">Incidentes</th>
                        <th className="px-6 py-3 text-center">Bitácoras</th>
                        <th className="px-6 py-3 text-right">Estatus</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {pagedPatients.map((p) => (
                        <tr
                          key={p.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            {p.nombre}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                            {p.edad}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                            {p.diagnostico}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                            {p.especialista}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {p.totalIncidentes > 0 ? (
                              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full">
                                {p.totalIncidentes}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {p.totalBitacoras > 0 ? (
                              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                {p.totalBitacoras}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">0</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                              {p.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  currentPage={patientPage}
                  totalPages={totalPatPages}
                  onPageChange={setPatientPage}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETALLE DE INCIDENTE                               */}
      {/* ======================================================== */}
      {selectedIncident && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700/80 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-slate-700/60 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl shrink-0 border border-blue-400/20">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Ficha de Evento Clínico
                  </h3>
                  <p className="text-slate-300 text-sm mt-0.5">
                    {selectedIncident.id} — {selectedIncident.nin_nomb}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">
                    Tipo de Evento
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedIncident.tipo}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">
                    Severidad
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedIncident.severidad}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">
                    Duración
                  </span>
                  <span className="font-semibold">
                    {selectedIncident.duracion_min || 0} minutos
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">
                    Frecuencia Cardíaca
                  </span>
                  <span className="font-semibold text-rose-500">
                    {selectedIncident.bpm_max || "-"} BPM
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Descripción / Observación
                </span>
                <p className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs leading-relaxed">
                  {selectedIncident.descripcion}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Intervención Terapéutica
                </span>
                <p className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs leading-relaxed text-emerald-600 dark:text-emerald-400">
                  {selectedIncident.intervencion ||
                    "Sin intervención especificada."}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DETALLE DE BITÁCORA DEL HOGAR                      */}
      {/* ======================================================== */}
      {selectedBitacora && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700/80 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white border-b border-emerald-700/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl shrink-0 border border-emerald-400/20">
                  <NotebookPen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Registro del Diario de Hogar
                  </h3>
                  <p className="text-emerald-200 text-sm mt-0.5">
                    {selectedBitacora.nin_nomb} —{" "}
                    {new Date(selectedBitacora.fecha).toLocaleDateString(
                      "es-ES",
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBitacora(null)}
                className="text-slate-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">
                    Estado de Ánimo
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedBitacora.animo}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">
                    Horas de Sueño
                  </span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {selectedBitacora.sueno} hrs (
                    {selectedBitacora.calidadSueno})
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-semibold uppercase">
                    Apetito
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedBitacora.apetito}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Desencadenantes / Sensibilidad
                </span>
                <p className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs leading-relaxed">
                  {selectedBitacora.desencadenantes}
                </p>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Observaciones de la Familia
                </span>
                <p className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs leading-relaxed">
                  {selectedBitacora.observaciones}
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedBitacora(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
