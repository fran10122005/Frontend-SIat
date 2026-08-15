import { useState, useMemo, useEffect } from "react";
import { Download, FileText, ChevronDown } from "lucide-react";
import useExpandableRows from "../../hooks/useExpandableRows";
import useMediaQuery from "../../hooks/useMediaQuery";
import FilterBar from "../shared/FilterBar";

const TYPE_BADGES = {
  INFO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  WARN: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  SUCCESS:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  INCIDENTE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  ASIGNACION:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
};

const PAGE_SIZE_DESKTOP = 10;
const PAGE_SIZE_MOBILE = 5;

export default function AdminActivityLog({ userName, logs = [] }) {
  const { expandedId, toggle } = useExpandableRows();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const pageSize = isMobile ? PAGE_SIZE_MOBILE : PAGE_SIZE_DESKTOP;
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("TODOS");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (filterType !== "TODOS" && log.aud_tipo !== filterType) return false;
      if (search && !log.aud_desc.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (dateFrom && new Date(log.aud_time) < new Date(dateFrom)) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(log.aud_time) > end) return false;
      }
      return true;
    });
  }, [logs, search, filterType, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  useEffect(() => {
    if (page >= totalPages && totalPages > 0) setPage(totalPages - 1);
  }, [totalPages, page]);

  const clearFilters = () => {
    setSearch("");
    setFilterType("TODOS");
    setDateFrom("");
    setDateTo("");
    setPage(0);
  };

  const getPageItems = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
    const pages = new Set([0, totalPages - 1, page - 1, page, page + 1]);
    return [...pages]
      .filter((p) => p >= 0 && p < totalPages)
      .sort((a, b) => a - b);
  };

  const filterChips = [
    filterType !== "TODOS" && {
      key: "tipo",
      label: `Tipo: ${filterType}`,
      onRemove: () => setFilterType("TODOS"),
    },
    dateFrom && {
      key: "dateFrom",
      label: `Desde: ${dateFrom}`,
      onRemove: () => setDateFrom(""),
    },
    dateTo && {
      key: "dateTo",
      label: `Hasta: ${dateTo}`,
      onRemove: () => setDateTo(""),
    },
  ].filter(Boolean);

  const exportExcel = () => {
    import("xlsx").then((XLSX) => {
      const data = filtered.map((log) => ({
        Fecha: new Date(log.aud_time).toLocaleString("es-ES"),
        Tipo: log.aud_tipo,
        Descripción: log.aud_desc,
        Actor: log.tm_usuar?.usu_crro || "Sistema",
        IP: log.aud_ip || "-",
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Auditoría");
      XLSX.writeFile(
        wb,
        `auditoria_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
    });
  };

  const exportPDF = async () => {
    const { createStyledPdf } = await import("../../utils/pdfExporter");
    const columns = ["Fecha", "Tipo", "Evento", "Actor / IP"];
    const rows = filtered.map((log) => [
      new Date(log.aud_time).toLocaleString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      { content: log.aud_tipo, styles: { fontStyle: "bold" } },
      log.aud_desc,
      `${log.tm_usuar?.usu_crro || "Sistema"}${log.aud_ip ? ` · ${log.aud_ip}` : ""}`,
    ]);
    await createStyledPdf(
      "Auditoría de Cambios",
      `auditoria_${new Date().toISOString().split("T")[0]}.pdf`,
      columns,
      rows,
      {
        pageTitle: "Bitácora de Auditoría — SIAT",
        pageOrientation: "landscape",
      },
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filters */}
      <FilterBar
        searchValue={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder="Buscar en descripción..."
        activeCount={
          (search ? 1 : 0) +
          (filterType !== "TODOS" ? 1 : 0) +
          (dateFrom ? 1 : 0) +
          (dateTo ? 1 : 0)
        }
        onClearAll={clearFilters}
        chips={filterChips}
      >
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setPage(0);
          }}
          className="w-full sm:w-auto px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="TODOS">Todos los tipos</option>
          <option value="INFO">INFO</option>
          <option value="WARN">WARN</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="INCIDENTE">INCIDENTE</option>
          <option value="ASIGNACION">ASIGNACION</option>
        </select>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 shrink-0">Desde</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(0);
            }}
            className="px-2 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 shrink-0">Hasta</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(0);
            }}
            className="px-2 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 rounded-lg transition-colors shrink-0"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 dark:hover:bg-rose-900/50 rounded-lg transition-colors shrink-0"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
        </div>
      </FilterBar>

      {/* Table */}
      <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-slate-200 dark:border-slate-800/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Bitácora de Auditoría
          </h3>
          <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-3 py-1 rounded-full">
            {filtered.length} registros · Pág. {page + 1} de {totalPages || 1}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse responsive-table">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Tipo</th>
                <th className="px-6 py-3">Evento</th>
                <th className="px-6 py-3">Actor / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paged.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    {logs.length === 0
                      ? "No hay operaciones registradas."
                      : "Ningún registro coincide con los filtros."}
                  </td>
                </tr>
              ) : (
                paged.map((log) => {
                  const badge =
                    TYPE_BADGES[log.aud_tipo] ||
                    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
                  const dateStr = new Date(log.aud_time).toLocaleString(
                    "es-ES",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  );
                  return (
                    <tr
                      key={log.aud_codi}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${expandedId === log.aud_codi ? "mobile-expanded" : ""}`}
                    >
                      <td
                        className="px-6 py-3 text-slate-500 font-mono text-xs whitespace-nowrap mobile-detail"
                        data-label="Fecha"
                      >
                        {dateStr}
                      </td>
                      <td className="px-6 py-3 mobile-detail" data-label="Tipo">
                        <span
                          className={`px-2 py-1 rounded text-[10px] font-bold ${badge}`}
                        >
                          {log.aud_tipo}
                        </span>
                      </td>
                      <td
                        className="px-6 py-3 text-slate-700 dark:text-slate-300 mobile-summary"
                        data-label="Evento"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="line-clamp-2">{log.aud_desc}</span>
                        </div>
                        <span className="mobile-summary-status">
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-bold ${badge}`}
                          >
                            {log.aud_tipo}
                          </span>
                        </span>
                        <button
                          type="button"
                          className="mobile-expand-btn"
                          onClick={() => toggle(log.aud_codi)}
                          aria-label={
                            expandedId === log.aud_codi
                              ? "Ver menos"
                              : "Ver más"
                          }
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </td>
                      <td
                        className="px-6 py-3 text-xs text-slate-500 whitespace-nowrap mobile-detail"
                        data-label="Actor / IP"
                      >
                        {log.tm_usuar?.usu_crro || "Sistema"}
                        {log.aud_ip ? ` · ${log.aud_ip}` : ""}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Anterior
            </button>
            <div className="flex gap-1">
              {getPageItems().map((i, idx, arr) => (
                <span key={i} className="flex items-center gap-1">
                  {idx > 0 && i !== arr[idx - 1] + 1 && (
                    <span className="px-1 text-xs text-slate-400">…</span>
                  )}
                  <button
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${i === page ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                  >
                    {i + 1}
                  </button>
                </span>
              ))}
            </div>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
