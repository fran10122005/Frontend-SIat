import { useState, useMemo, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useGlobalContext } from "../context/GlobalState";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Download,
  FileText,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  ShieldAlert,
} from "lucide-react";
import Topbar from "../components/layout/Topbar";
import api from "../api/axios";
import { exportHistoryToPDF } from "../utils/pdfExporter";
import Pagination from "../components/shared/Pagination";
import FilterBar from "../components/shared/FilterBar";
import Button from "../components/ui/Button";

import PageTitle from "../components/ui/PageTitle";

export default function HistoryProgress() {
  const { historicalData, globalPeiGoals, userRole, nomNino, selectedChildId } =
    useGlobalContext();
  const isRepresentante = userRole === "REPRESENTANTE";
  const [activeTab, setActiveTab] = useState("evolucion"); // "evolucion" | "incidentes"
  const [dateRange, setDateRange] = useState("7days");
  const [searchNotes, setSearchNotes] = useState("");
  const [filterEfectividad, setFilterEfectividad] = useState("TODOS");

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
  }, [incidentes, filterSeveridad, filterTipoIncidente, searchIncidente]);

  const INC_PAGE_SIZE = 8;
  const totalIncPages = Math.ceil(filteredIncidentes.length / INC_PAGE_SIZE);
  const pagedIncidentes = filteredIncidentes.slice(
    incidentePage * INC_PAGE_SIZE,
    (incidentePage + 1) * INC_PAGE_SIZE,
  );

  function parseFecRepo(str) {
    if (!str) return null;
    try {
      if (typeof str !== "string") {
        const d = new Date(str);
        return isNaN(d.getTime()) ? null : d;
      }
      const parts = str.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts;
        return new Date(+year, +month - 1, +day);
      }
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d;
    } catch (e) {
      console.error("Error parsing date:", e);
      return null;
    }
  }

  const filteredData = useMemo(() => {
    let data = historicalData || [];

    // Fecha range
    if (dateRange !== "all" && data.length > 0) {
      const now = new Date();
      const limit = dateRange === "7days" ? 7 : 30;
      const cutoff = new Date(now.getTime() - limit * 24 * 60 * 60 * 1000);
      data = data.filter((d) => {
        const dDate = parseFecRepo(d.fec_repo);
        if (!dDate) return true;
        return dDate >= cutoff;
      });
    }

    // Búsqueda en notas
    if (searchNotes) {
      const q = searchNotes.toLowerCase();
      data = data.filter((d) => (d.com_tend || "").toLowerCase().includes(q));
    }

    // Efectividad
    if (filterEfectividad === "EFECTIVA") data = data.filter((d) => d.fue_efec);
    if (filterEfectividad === "NO_EFECTIVA")
      data = data.filter((d) => !d.fue_efec);

    return data;
  }, [historicalData, dateRange, searchNotes, filterEfectividad]);

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
  }, [dateRange, searchNotes, filterEfectividad]);

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

  const handleExportPDF = () => {
    exportHistoryToPDF(filteredData || []);
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
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Tabs de Navegación: Evolución vs Incidentes */}
            {!isRepresentante && (
              <div className="flex border-b border-slate-200 dark:border-slate-700/80 gap-6">
                <button
                  type="button"
                  onClick={() => setActiveTab("evolucion")}
                  className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === "evolucion"
                      ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Evolución y Sesiones
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("incidentes")}
                  className={`pb-3 text-sm font-bold transition-colors border-b-2 flex items-center gap-2 ${
                    activeTab === "incidentes"
                      ? "border-rose-600 text-rose-600 dark:border-rose-400 dark:text-rose-400"
                      : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  Incidentes Conductuales (Bitácora A-B-C)
                  {incidentes.length > 0 && (
                    <span className="text-[10px] font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded-full">
                      {incidentes.length}
                    </span>
                  )}
                </button>
              </div>
            )}

            {activeTab === "evolucion" ? (
              <div className="flex flex-col gap-6">
                {/* KPIs */}
                <div
                  data-tour="hp-kpis"
                  className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
                >
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-brand-500 dark:text-blue-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                      </div>
                      <span className="text-[11px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Promedio de Calma
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                        {kpis.avgCalm}%
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {filteredData?.length > 0
                          ? "en período activo"
                          : "sin registros"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                          />
                        </svg>
                      </div>
                      <span className="text-[11px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Sesiones Totales
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                        {kpis.totalSessions}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        sesiones
                      </span>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-5 shadow-sm border border-gray-100 dark:border-slate-700 col-span-2 md:col-span-1 flex flex-col justify-center min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <span className="text-[11px] md:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Alertas Efectivas
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl md:text-3xl font-semibold tracking-tight text-gray-900 dark:text-white">
                        {kpis.effectivePercentage}%
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        efectividad
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gráfico */}
                <div
                  data-tour="hp-chart"
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col min-h-[300px] lg:h-[400px]"
                >
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-brand-500 dark:text-blue-400" />
                    Evolución del Tiempo en Calma (pro_calm)
                  </h3>
                  <div className="flex-1 w-full min-h-0">
                    {filteredData && filteredData.length > 0 ? (
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                        minWidth={0}
                        minHeight={0}
                      >
                        <BarChart
                          data={filteredData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#E5E7EB"
                          />
                          <XAxis
                            dataKey="fec_repo"
                            tick={{ fontSize: 12 }}
                            tickMargin={10}
                            stroke="#9CA3AF"
                          />
                          <YAxis
                            domain={[0, 100]}
                            tick={{ fontSize: 12 }}
                            stroke="#9CA3AF"
                            tickFormatter={(val) => `${val}%`}
                          />
                          <Tooltip
                            cursor={{ fill: "rgba(0,0,0,0.05)" }}
                            contentStyle={{
                              borderRadius: "8px",
                              border: "none",
                              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                            formatter={(value) => [
                              `${value}% en calma`,
                              "Tiempo Promedio",
                            ]}
                            labelFormatter={(label) => `Fecha: ${label}`}
                          />
                          <Bar
                            dataKey="pro_calm"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                            animationDuration={1000}
                          >
                            {filteredData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.pro_calm > 75 ? "#034EA1" : "#94A3B8"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 py-12">
                        <TrendingUp className="w-12 h-12 mb-3 opacity-30 stroke-1" />
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          Sin registros históricos disponibles
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm text-center">
                          Las sesiones registradas por el especialista o el
                          representante aparecerán graficadas aquí.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Filtros */}
                <div data-tour="hp-filters">
                  <FilterBar
                    searchPlaceholder="Buscar por notas de sesión..."
                    searchValue={searchNotes}
                    onSearchChange={setSearchNotes}
                    filters={[
                      {
                        key: "rango",
                        label: "Rango",
                        value: dateRange,
                        onChange: setDateRange,
                        options: [
                          { value: "7days", label: "Últimos 7 días" },
                          { value: "month", label: "Este Mes" },
                          { value: "all", label: "Todo el historial" },
                        ],
                      },
                      {
                        key: "efectividad",
                        label: "Efectividad",
                        value: filterEfectividad,
                        onChange: setFilterEfectividad,
                        options: [
                          { value: "TODOS", label: "Todas" },
                          { value: "EFECTIVA", label: "Efectiva" },
                          { value: "NO_EFECTIVA", label: "No Efectiva" },
                        ],
                      },
                    ]}
                    resultsCount={filteredData.length}
                    totalCount={historicalData?.length || 0}
                    onClearFilters={() => {
                      setSearchNotes("");
                      setDateRange("7days");
                      setFilterEfectividad("TODOS");
                    }}
                  />
                </div>

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
                              Tiempo Calma
                            </th>
                            <th className="px-4 py-3 font-medium">Sesiones</th>
                            <th className="px-4 py-3 font-medium">Efectiva</th>
                            <th className="px-4 py-3 font-medium">Notas</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                          {pagedData.length === 0 ? (
                            <tr>
                              <td
                                colSpan={5}
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
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                                  {row.fec_repo}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                                      {row.pro_calm != null
                                        ? `${row.pro_calm}%`
                                        : "—"}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">{row.tot_sesi}</td>
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
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">
                                    {row.com_tend || "Sin notas"}
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
                                    <div>
                                      <span className="text-gray-500 dark:text-gray-400 font-medium">
                                        Sesiones
                                      </span>
                                      <p className="text-gray-900 dark:text-gray-100 mt-0.5 font-semibold">
                                        {row.tot_sesi}
                                      </p>
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
            ) : (
              /* TAB: BITÁCORA DE INCIDENTES CONDUCTUALES (MODELO ABC) */
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
                  onSearchChange={setSearchIncidente}
                  filters={[
                    {
                      key: "severidad",
                      label: "Severidad",
                      value: filterSeveridad,
                      onChange: setFilterSeveridad,
                      options: [
                        { value: "TODAS", label: "Todas" },
                        { value: "Leve", label: "Leve" },
                        { value: "Moderada", label: "Moderada" },
                        { value: "Severa", label: "Severa / Grave" },
                      ],
                    },
                    {
                      key: "tipo",
                      label: "Tipo",
                      value: filterTipoIncidente,
                      onChange: setFilterTipoIncidente,
                      options: [
                        { value: "TODOS", label: "Todos los tipos" },
                        { value: "Berrinche", label: "Berrinche" },
                        {
                          value: "Crisis Sensorial",
                          label: "Crisis Sensorial",
                        },
                        { value: "Agresión", label: "Agresión" },
                        { value: "Autoagresión", label: "Autoagresión" },
                        {
                          value: "Bloqueo / Shutdown",
                          label: "Bloqueo / Shutdown",
                        },
                        { value: "Desregulación", label: "Desregulación" },
                      ],
                    },
                  ]}
                  resultsCount={filteredIncidentes.length}
                  totalCount={incidentes.length}
                  onClearFilters={() => {
                    setSearchIncidente("");
                    setFilterSeveridad("TODAS");
                    setFilterTipoIncidente("TODOS");
                  }}
                />

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
                      currentPage={incidentePage + 1}
                      totalPages={totalIncPages}
                      onPageChange={(p) => setIncidentePage(p - 1)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
