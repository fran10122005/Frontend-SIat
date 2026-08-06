import { useState, useMemo } from "react";
import {
  Search,
  X,
  Download,
  FileText,
  Activity,
  AlertTriangle,
  Heart,
  Calendar,
  ShieldCheck,
  User,
  ChevronDown,
} from "lucide-react";
import { useGlobalContext } from "../../context/GlobalState";
import Pagination from "../shared/Pagination";
import * as XLSX from "xlsx";
import useExpandableRows from "../../hooks/useExpandableRows";

const PAGE_SIZE = 10;

const MOCK_INCIDENTES = [
  {
    id: "INC-001",
    nin_nomb: "Mateo Pérez",
    esp_nomb: "Dra. María Fernández",
    tipo: "CRISIS",
    severidad: "SEVERA",
    duracion_min: 15,
    bpm_max: 142,
    fecha: "2026-08-03T14:30:00Z",
    descripcion:
      "Sobrecarga sensorial provocada por ruido ambiental elevado. Disparador: sirena de ambulancia.",
    intervencion:
      "Se aplicó protocolo de respiración de 3 minutos con audio sensorial. Regulación exitosa.",
    estado: "RESUELTO",
  },
  {
    id: "INC-002",
    nin_nomb: "Sofia Gómez",
    esp_nomb: "Dr. Carlos Mendoza",
    tipo: "INCIDENTE",
    severidad: "MODERADA",
    duracion_min: 8,
    bpm_max: 118,
    fecha: "2026-08-02T10:15:00Z",
    descripcion:
      "Resistencia a transición de actividad durante sesión ocupacional.",
    intervencion:
      "Uso de pictogramas en tablero CAA para secuenciación visual de tareas.",
    estado: "RESUELTO",
  },
  {
    id: "INC-003",
    nin_nomb: "Lucas Rodríguez",
    esp_nomb: "Dra. Ana Silva",
    tipo: "DIARIO_HOGAR",
    severidad: "LEVE",
    duracion_min: 5,
    bpm_max: 95,
    fecha: "2026-08-01T19:45:00Z",
    descripcion:
      "Dificultad para conciliación del sueño reportada por el representante.",
    intervencion:
      "Indicación de rutina de baja estimulación táctil previo a acostarse.",
    estado: "EN_SEGUIMIENTO",
  },
  {
    id: "INC-004",
    nin_nomb: "Mateo Pérez",
    esp_nomb: "Dra. María Fernández",
    tipo: "CRISIS",
    severidad: "MODERADA",
    duracion_min: 12,
    bpm_max: 130,
    fecha: "2026-07-30T11:20:00Z",
    descripcion: "Episodio de agitación motora durante terapia del lenguaje.",
    intervencion: "Pausa activa con compresión profunda en articulaciones.",
    estado: "RESUELTO",
  },
  {
    id: "INC-005",
    nin_nomb: "Valentina Martínez",
    esp_nomb: "Dr. Carlos Mendoza",
    tipo: "EVALUACION",
    severidad: "LEVE",
    duracion_min: 0,
    bpm_max: 82,
    fecha: "2026-07-28T09:00:00Z",
    descripcion:
      "Evaluación trimestral de metas PEI completada con progreso favorable.",
    intervencion:
      "Actualización de objetivos de autorregulación para el siguiente trimestre.",
    estado: "COMPLETADO",
  },
];

export default function HistorialClinicoTab({ incidentesData = [], loading }) {
  const { showToast } = useGlobalContext();
  const { expandedId, toggle } = useExpandableRows();
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState("TODOS");
  const [filterSeveridad, setFilterSeveridad] = useState("TODAS");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(0);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const items = useMemo(() => {
    return incidentesData.length > 0 ? incidentesData : MOCK_INCIDENTES;
  }, [incidentesData]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
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
  }, [items, search, filterTipo, filterSeveridad, startDate, endDate]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const hasFilters =
    search ||
    filterTipo !== "TODOS" ||
    filterSeveridad !== "TODAS" ||
    startDate ||
    endDate;

  const clearFilters = () => {
    setSearch("");
    setFilterTipo("TODOS");
    setFilterSeveridad("TODAS");
    setStartDate("");
    setEndDate("");
    setPage(0);
  };

  // Analytics KPIs from filtered dataset
  const totalSeveras = filtered.filter((i) => i.severidad === "SEVERA").length;
  const totalResueltos = filtered.filter(
    (i) => i.estado === "RESUELTO" || i.estado === "COMPLETADO",
  ).length;
  const tasaEfectividad =
    filtered.length > 0
      ? Math.round((totalResueltos / filtered.length) * 100)
      : 100;

  const exportExcel = () => {
    const data = filtered.map((item) => ({
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
      const rows = filtered.map((i) => [
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
              {filtered.length}
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
              {Math.max(...filtered.map((i) => i.bpm_max || 0), 0)}{" "}
              <span className="text-xs font-normal">BPM</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        data-tour="admin-hc-filters"
        className="bg-white dark:bg-[#1E293B] p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 space-y-3"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por paciente, especialista o síntoma..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
            <option value="DIARIO_HOGAR">Reporte del Hogar</option>
            <option value="EVALUACION">Evaluación PEI</option>
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
            <option value="SEVERA">Severa</option>
          </select>
        </div>

        {/* Date Filter & Export Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 w-full sm:w-auto">
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

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors ml-2"
              >
                <X className="w-3.5 h-3.5" /> Limpiar
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={exportPDF}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" /> Exportar PDF
            </button>
            <button
              onClick={exportExcel}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100 transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Exportar Excel
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div
        data-tour="admin-hc-table"
        className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Registro Clínico e Incidentes
          </h2>
          <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full">
            {filtered.length} registros
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            Cargando datos clínicos...
          </div>
        ) : paged.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Activity className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold">No se encontraron eventos clínicos</p>
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
                  {paged.map((item) => (
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
                        <span className="mobile-summary-status">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                              item.tipo === "CRISIS"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : item.tipo === "INCIDENTE"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {item.tipo}
                          </span>
                        </span>
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
                              item.tipo === "CRISIS"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : item.tipo === "INCIDENTE"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}
                          >
                            {item.tipo}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              item.severidad === "SEVERA"
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
                          className="px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-colors flex items-center gap-1 ml-auto"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Ver Ficha</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Modal Detail View */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#034EA1] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Ficha de Evento Clínico</h3>
                <p className="text-xs opacity-80">
                  {selectedIncident.id} — {selectedIncident.nin_nomb}
                </p>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                &times;
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
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
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
