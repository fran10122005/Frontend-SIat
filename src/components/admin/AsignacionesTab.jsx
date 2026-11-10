import { useState, useMemo, useEffect, useRef } from "react";
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
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import pdfIcon from "../../assets/pdf.png";
import excelIcon from "../../assets/excel.png";
import StatusBadge from "../shared/StatusBadge";
import FilterBar from "../shared/FilterBar";
import Pagination from "../shared/Pagination";
import AdminModal from "../shared/AdminModal";
import useExpandableRows from "../../hooks/useExpandableRows";
import { toLocalYMD, focusFirstError } from "../../utils/validators";

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
  const [asigErrors, setAsigErrors] = useState({});
  const asigFormRef = useRef(null);
  const todayStr = toLocalYMD();

  const existingPair = useMemo(() => {
    if (!asignacion?.nin_codi || !asignacion?.esp_codi) return null;
    return (asignaciones || []).find(
      (a) =>
        String(a.nin_codi || a.tm_ninos?.nin_codi) ===
          String(asignacion.nin_codi) &&
        String(a.esp_codi || a.tm_espec?.esp_codi) ===
          String(asignacion.esp_codi),
    );
  }, [asignaciones, asignacion?.nin_codi, asignacion?.esp_codi]);

  const validateAssign = () => {
    const errs = {};
    if (!asignacion?.nin_codi) {
      errs.nin_codi = "Selecciona un paciente";
    }
    if (!asignacion?.esp_codi) {
      errs.esp_codi = "Selecciona un especialista";
    }
    if (asignacion?.asi_inic && asignacion.asi_inic > todayStr) {
      errs.asi_inic = "La fecha de inicio no puede ser futura";
    }
    setAsigErrors(errs);
    if (Object.keys(errs).length > 0) {
      requestAnimationFrame(() => focusFirstError(errs, asigFormRef));
      return false;
    }
    return true;
  };

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
    <div className="space-y-3.5 sm:space-y-4 animate-in fade-in duration-300">
      <AdminModal
        open={showAsignar}
        onClose={() => {
          setShowAsignar(false);
          setAsigErrors({});
        }}
        title="Asignar Paciente a Especialista"
        maxWidth="max-w-xl"
        icon={Link2}
      >
        <form
          ref={asigFormRef}
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            if (!validateAssign()) return;
            const res = await handleAssign(e);
            const ok = res === true || res?.ok === true;
            if (ok) {
              setAsigErrors({});
              setShowAsignar(false);
            }
          }}
          className="space-y-6"
        >
          {existingPair && (
            <div
              role="status"
              className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                {existingPair.asi_stdo === "Activo"
                  ? "Este paciente ya tiene una asignación activa con este especialista."
                  : "Ya existe un vínculo histórico (Inactivo) entre este paciente y especialista; puedes reactivarlo desde la tabla."}
              </span>
            </div>
          )}

          {/* Datos del Vínculo */}
          <section>
            <div className="form-section-title">
              <Link2 className="form-section-title-icon" />
              <h4 className="form-section-title-text">Datos del Vínculo</h4>
              <span className="form-section-title-line" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="form-label">
                  Paciente <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  data-field="nin_codi"
                  name="nin_codi"
                  value={asignacion.nin_codi}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAsignacion({ ...asignacion, nin_codi: val });
                    if (asigErrors.nin_codi) {
                      setAsigErrors((prev) => ({
                        ...prev,
                        nin_codi: val ? "" : "Selecciona un paciente",
                      }));
                    }
                  }}
                  aria-invalid={Boolean(asigErrors.nin_codi)}
                  className={`form-select ${asigErrors.nin_codi ? "form-input-invalid" : ""}`}
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
                {asigErrors.nin_codi && (
                  <p className="form-error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />{" "}
                    {asigErrors.nin_codi}
                  </p>
                )}
              </div>
              <div>
                <label className="form-label">
                  Especialista Tratante <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  data-field="esp_codi"
                  name="esp_codi"
                  value={asignacion.esp_codi}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAsignacion({ ...asignacion, esp_codi: val });
                    if (asigErrors.esp_codi) {
                      setAsigErrors((prev) => ({
                        ...prev,
                        esp_codi: val ? "" : "Selecciona un especialista",
                      }));
                    }
                  }}
                  aria-invalid={Boolean(asigErrors.esp_codi)}
                  className={`form-select ${asigErrors.esp_codi ? "form-input-invalid" : ""}`}
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
                {asigErrors.esp_codi && (
                  <p className="form-error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />{" "}
                    {asigErrors.esp_codi}
                  </p>
                )}
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
                  data-field="asi_inic"
                  name="asi_inic"
                  max={todayStr}
                  value={asignacion.asi_inic}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAsignacion({ ...asignacion, asi_inic: val });
                    setAsigErrors((prev) => ({
                      ...prev,
                      asi_inic:
                        val && val > todayStr
                          ? "La fecha de inicio no puede ser futura"
                          : "",
                    }));
                  }}
                  aria-invalid={Boolean(asigErrors.asi_inic)}
                  className={`form-input ${asigErrors.asi_inic ? "form-input-invalid" : ""}`}
                />
                {asigErrors.asi_inic && (
                  <p className="form-error" role="alert">
                    <AlertCircle className="w-3.5 h-3.5" />{" "}
                    {asigErrors.asi_inic}
                  </p>
                )}
              </div>
              <div>
                <label className="form-label">Estado Inicial</label>
                <div className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center">
                  <StatusBadge active />
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-1 border-t border-slate-200 dark:border-slate-700">
            <button
              disabled={loading || Boolean(existingPair)}
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
                onClick={() => {
                  setAsigErrors({});
                  setShowAsignar(true);
                }}
                className="px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Asignar
              </button>
              <button
                type="button"
                onClick={exportAsignacionesToPDF}
                aria-label="Exportar a PDF"
                title="Exportar a PDF"
                className="p-2 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
              >
                <img
                  src={pdfIcon}
                  alt="PDF"
                  className="w-4 h-4 object-contain shrink-0"
                />
              </button>
              <button
                type="button"
                onClick={exportAsignacionesToExcel}
                aria-label="Exportar a Excel"
                title="Exportar a Excel"
                className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
              >
                <img
                  src={excelIcon}
                  alt="Excel"
                  className="w-4 h-4 object-contain shrink-0"
                />
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
