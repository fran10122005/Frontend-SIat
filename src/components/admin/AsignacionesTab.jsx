import { useState, useMemo, useEffect } from "react";
import {
  ChevronDown,
  Archive,
  RotateCcw,
  Plus,
  ShieldCheck,
  Link2,
  User,
  Stethoscope,
  CalendarDays,
} from "lucide-react";
import StatusBadge from "../shared/StatusBadge";
import FilterBar from "../shared/FilterBar";
import Pagination from "../shared/Pagination";
import AdminModal from "../shared/AdminModal";
import useExpandableRows from "../../hooks/useExpandableRows";

export default function AsignacionesTab({
  asignacion,
  setAsignacion,
  ninos,
  especialistas,
  asignaciones,
  loading,
  handleAssign,
  handleToggleAsignacion,
  exportAsignacionesToPDF,
  exportAsignacionesToExcel,
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { expandedId, toggle } = useExpandableRows();
  const [showAsignar, setShowAsignar] = useState(false);
  const todayStr = new Date().toISOString().split("T")[0];

  const filtered = useMemo(() => {
    return asignaciones.filter((asi) => {
      const paciente =
        `${asi.tm_ninos?.nin_nomb || ""} ${asi.tm_ninos?.nin_apel || ""}`.toLowerCase();
      const especialista =
        `${asi.tm_espec?.esp_nomb || ""} ${asi.tm_espec?.esp_apel || ""}`.toLowerCase();
      const q = search.toLowerCase();
      if (search && !paciente.includes(q) && !especialista.includes(q))
        return false;
      if (statusFilter !== "TODOS" && asi.asi_stdo !== statusFilter)
        return false;
      if (
        dateFrom &&
        asi.asi_inic &&
        new Date(asi.asi_inic) < new Date(dateFrom)
      )
        return false;
      if (dateTo && asi.asi_inic) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(asi.asi_inic) > end) return false;
      }
      return true;
    });
  }, [asignaciones, search, statusFilter, dateFrom, dateTo]);

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [search, statusFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("TODOS");
    setDateFrom("");
    setDateTo("");
  };

  const filterChips = [
    statusFilter !== "TODOS" && {
      key: "estado",
      label: `Estado: ${statusFilter}`,
      onRemove: () => setStatusFilter("TODOS"),
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <AdminModal
        open={showAsignar}
        onClose={() => setShowAsignar(false)}
        title="Asignar Paciente a Especialista"
        subtitle="Establecer el vínculo clínico de atención entre el paciente y el profesional"
        maxWidth="max-w-2xl"
        icon={Link2}
      >
        <form
          onSubmit={async (e) => {
            const ok = await handleAssign(e);
            if (ok) setShowAsignar(false);
          }}
          className="space-y-6"
        >
          {/* Datos del Vínculo */}
          <section>
            <div className="form-section-title">
              <Link2 className="form-section-title-icon" />
              <h4 className="form-section-title-text">Datos del Vínculo</h4>
              <span className="form-section-title-line" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">Paciente</label>
                <select
                  required
                  value={asignacion.nin_codi}
                  onChange={(e) =>
                    setAsignacion({ ...asignacion, nin_codi: e.target.value })
                  }
                  className="form-select"
                >
                  <option value="" disabled>
                    Seleccionar paciente...
                  </option>
                  {ninos.map((n) => (
                    <option key={n.nin_codi} value={n.nin_codi}>
                      {n.nin_nomb} {n.nin_apel} — {n.nin_codi}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Especialista Tratante</label>
                <select
                  required
                  value={asignacion.esp_codi}
                  onChange={(e) =>
                    setAsignacion({ ...asignacion, esp_codi: e.target.value })
                  }
                  className="form-select"
                >
                  <option value="" disabled>
                    Seleccionar médico...
                  </option>
                  {especialistas
                    .filter((e) => e.tm_usuar?.usu_estd)
                    .map((esp) => (
                      <option key={esp.esp_codi} value={esp.esp_codi}>
                        {esp.esp_gner === "M" ? "Dr." : "Dra."} {esp.esp_nomb}{" "}
                        {esp.esp_apel}
                        {esp.tm_especi?.esc_nomb
                          ? ` — ${esp.tm_especi.esc_nomb}`
                          : ""}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </section>

          {/* Inicio y Estado */}
          <section>
            <div className="form-section-title">
              <CalendarDays className="form-section-title-icon" />
              <h4 className="form-section-title-text">Inicio y Estado</h4>
              <span className="form-section-title-line" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">
                  Fecha de Inicio de la Atención
                </label>
                <input
                  type="date"
                  max={todayStr}
                  value={asignacion.asi_inic}
                  onChange={(e) =>
                    setAsignacion({ ...asignacion, asi_inic: e.target.value })
                  }
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Estado Inicial</label>
                <div className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2">
                  <StatusBadge active />
                  <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                    Activo
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-1 border-t border-slate-200 dark:border-slate-700">
            <button
              disabled={loading}
              type="submit"
              className="md:w-auto w-full px-8 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Crear Asignación
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Filtros */}
      <FilterBar
        dataTour="admin-asg-filters"
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Buscar por paciente o especialista..."
        activeCount={
          (search ? 1 : 0) +
          (statusFilter !== "TODOS" ? 1 : 0) +
          (dateFrom ? 1 : 0) +
          (dateTo ? 1 : 0)
        }
        onClearAll={clearFilters}
        chips={filterChips}
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex-1 sm:flex-none px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="TODOS">Todos los estados</option>
          <option value="Activo">Activo</option>
          <option value="Inactivo">Inactivo</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="flex-1 sm:flex-none px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          title="Fecha ingreso desde"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="flex-1 sm:flex-none px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          title="Fecha ingreso hasta"
        />
      </FilterBar>

      <div
        data-tour="admin-asg-table"
        className="bg-white dark:bg-[#1E293B] p-4 sm:p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Casos Clínicos
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full">
              {filtered.length} registros
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                data-tour="admin-asg-form-btn"
                onClick={() => setShowAsignar(true)}
                className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Asignar
              </button>
              <button
                onClick={exportAsignacionesToPDF}
                className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg text-xs font-semibold transition-colors"
              >
                PDF
              </button>
              <button
                onClick={exportAsignacionesToExcel}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
              >
                Excel
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm responsive-table">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-3 px-4 font-semibold uppercase">Paciente</th>
                <th className="py-3 px-4 font-semibold uppercase">
                  Especialista
                </th>
                <th className="py-3 px-4 font-semibold uppercase">
                  Fecha Ingreso
                </th>
                <th className="py-3 px-4 font-semibold uppercase">Estado</th>
                <th className="py-3 px-4 font-semibold uppercase text-right">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {paged.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500">
                    No se encontraron asignaciones.
                  </td>
                </tr>
              ) : (
                paged.map((asi) => (
                  <tr
                    key={asi.asi_codi}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${expandedId === asi.asi_codi ? "mobile-expanded" : ""}`}
                  >
                    <td
                      className="py-3 px-4 mobile-summary"
                      data-label="Paciente"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">
                          {asi.tm_ninos?.nin_nomb} {asi.tm_ninos?.nin_apel}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          ID: {asi.tm_ninos?.nin_codi}
                        </div>
                      </div>
                      <span className="mobile-summary-status">
                        <StatusBadge active={asi.asi_stdo === "Activo"} />
                      </span>
                      <button
                        type="button"
                        className="mobile-expand-btn"
                        onClick={() => toggle(asi.asi_codi)}
                        aria-label={
                          expandedId === asi.asi_codi ? "Ver menos" : "Ver más"
                        }
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </td>
                    <td
                      className="py-3 px-4 mobile-detail"
                      data-label="Especialista"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {asi.tm_espec?.esp_gner === "M" ? "Dr." : "Dra."}{" "}
                          {asi.tm_espec?.esp_nomb} {asi.tm_espec?.esp_apel}
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          ID: {asi.tm_espec?.esp_codi}
                        </div>
                      </div>
                    </td>
                    <td
                      className="py-3 px-4 text-slate-600 dark:text-slate-400 hidden sm:table-cell"
                      data-label="Fecha Ingreso"
                    >
                      {new Date(asi.asi_inic).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 mobile-detail" data-label="Estado">
                      <StatusBadge active={asi.asi_stdo === "Activo"} />
                    </td>
                    <td
                      className="py-3 px-4 text-right mobile-detail"
                      data-label="Acción"
                    >
                      <button
                        onClick={() =>
                          handleToggleAsignacion(asi.asi_codi, asi.asi_stdo)
                        }
                        title={
                          asi.asi_stdo === "Activo"
                            ? "Dar de alta"
                            : "Reactivar caso"
                        }
                        className={`action-icon-btn text-slate-500 ${asi.asi_stdo === "Activo" ? "hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30" : "hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"}`}
                      >
                        {asi.asi_stdo === "Activo" ? (
                          <Archive className="w-4 h-4" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
