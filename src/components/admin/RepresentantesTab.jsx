import { useState, useMemo } from "react";
import {
  Mail,
  Phone,
  UserRound,
  ChevronDown,
  KeyRound,
  Ban,
  CheckCircle2,
  Baby,
  IdCard,
  Cake,
  ShieldCheck,
  Pencil,
  AlertCircle,
} from "lucide-react";
import { useGlobalContext } from "../../context/GlobalState";
import StatusBadge from "../shared/StatusBadge";
import FilterBar from "../shared/FilterBar";
import Pagination from "../shared/Pagination";
import AdminModal from "../shared/AdminModal";
import api from "../../api/axios";
import useExpandableRows from "../../hooks/useExpandableRows";
import { toastError } from "../../utils/errorHandler";

const PAGE_SIZE = 10;

const calcEdad = (fechaNac) => {
  if (!fechaNac) return "Edad no disponible";
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let años = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) años--;
  return `${años} año${años !== 1 ? "s" : ""}`;
};

const VALIDACIONES_TELF = (value) => {
  if (!value) return "";
  return /^(\+58|0058|0)?4\d{2}[- ]?\d{3}[- ]?\d{4}$/.test(String(value).trim())
    ? ""
    : "Formato venezolano: +584121234567";
};

export default function RepresentantesTab({
  representantes,
  loading: parentLoading,
  onRefresh,
  onRegisterClick,
  editingRep,
  setEditingRep,
  handleUpdateRepresentante,
}) {
  const { showToast } = useGlobalContext();
  const { expandedId, toggle } = useExpandableRows();
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("TODOS");
  const [page, setPage] = useState(0);
  const [resettingId, setResettingId] = useState(null);
  const [previewRep, setPreviewRep] = useState(null);
  const [editErrores, setEditErrores] = useState({});

  const validarEditCampo = (campo) => {
    if (campo === "rep_telf") return VALIDACIONES_TELF(editingRep?.rep_telf);
    return "";
  };

  const validarEditTodo = () => {
    const nuevos = {};
    const telf = VALIDACIONES_TELF(editingRep?.rep_telf);
    if (telf) nuevos.rep_telf = telf;
    setEditErrores(nuevos);
    return Object.keys(nuevos).length === 0;
  };

  const filtered = useMemo(() => {
    return representantes.filter((r) => {
      const nombre =
        `${r.rep_nomb || ""} ${r.rep_apel || ""} ${r.usu_crro || ""}`.toLowerCase();
      const q = search.toLowerCase();
      if (search && !nombre.includes(q)) return false;
      if (filterEstado === "ACTIVO" && !r.usu_estd) return false;
      if (filterEstado === "INACTIVO" && r.usu_estd) return false;
      return true;
    });
  }, [representantes, search, filterEstado]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const clearFilters = () => {
    setSearch("");
    setFilterEstado("TODOS");
    setPage(0);
  };

  const filterChips = [
    filterEstado !== "TODOS" && {
      key: "estado",
      label: filterEstado === "ACTIVO" ? "Activos" : "Inactivos",
      onRemove: () => {
        setFilterEstado("TODOS");
        setPage(0);
      },
    },
  ].filter(Boolean);

  const handleResetPass = async (usuCodi, email) => {
    setResettingId(usuCodi);
    try {
      const res = await api.post(`/admin/users/${usuCodi}/password`, {});
      const nuevaClave = res.data?.data?.password_generada;
      showToast(
        nuevaClave
          ? `✅ Contraseña restablecida para ${email}. Nueva: ${nuevaClave}`
          : `✅ Contraseña restablecida para ${email}.`,
      );
    } catch (err) {
      toastError(err, showToast, "Error al restablecer la contraseña.");
    } finally {
      setResettingId(null);
    }
  };

  const handleToggleEstado = async (usuCodi, currentState) => {
    try {
      await api.patch(`/admin/users/${usuCodi}/estado`, {
        activo: !currentState,
      });
      showToast(
        `✅ Representante ${!currentState ? "activado" : "desactivado"} exitosamente.`,
      );
      onRefresh();
    } catch (err) {
      toastError(
        err,
        showToast,
        "Error al cambiar el estado del representante.",
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <FilterBar
        dataTour="admin-rep-search"
        searchValue={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(0);
        }}
        searchPlaceholder="Buscar por nombre o correo..."
        activeCount={(search ? 1 : 0) + (filterEstado !== "TODOS" ? 1 : 0)}
        onClearAll={clearFilters}
        chips={filterChips}
      >
        <select
          value={filterEstado}
          onChange={(e) => {
            setFilterEstado(e.target.value);
            setPage(0);
          }}
          className="w-full sm:w-auto px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="TODOS">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="INACTIVO">Inactivo</option>
        </select>
      </FilterBar>

      <div
        data-tour="admin-rep-table"
        className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Representantes Legales
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full">
              {filtered.length} registros
            </span>
            {onRegisterClick && (
              <button
                type="button"
                onClick={onRegisterClick}
                data-tour="admin-rep-register"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
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
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                Registrar Nuevo Niño
              </button>
            )}
          </div>
        </div>

        {parentLoading ? (
          <div className="p-12 text-center text-slate-400">Cargando...</div>
        ) : paged.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <UserRound className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-semibold">No se encontraron representantes</p>
            <p className="text-xs mt-1">
              Los representantes aparecen aquí cuando son registrados mediante
              invitación clínica.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse responsive-table">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-3">Representante</th>
                    <th className="px-6 py-3">Contacto</th>
                    <th className="px-6 py-3 hidden sm:table-cell">
                      Paciente Asociado
                    </th>
                    <th className="px-6 py-3 text-center">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paged.map((r) => (
                    <tr
                      key={r.usu_codi || r.rep_codi}
                      onClick={() => setPreviewRep(r)}
                      className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${expandedId === (r.usu_codi || r.rep_codi) ? "mobile-expanded" : ""}`}
                    >
                      <td
                        className="px-6 py-4 mobile-summary"
                        data-label="Representante"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold shrink-0 text-sm">
                            {r.rep_nomb?.charAt(0) || "?"}
                            {r.rep_apel?.charAt(0) || ""}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {r.rep_nomb} {r.rep_apel}
                            </div>
                            <div className="text-xs text-slate-400 font-mono">
                              ID: {r.rep_codi || r.usu_codi}
                            </div>
                          </div>
                        </div>
                        <span className="mobile-summary-status">
                          <StatusBadge active={r.usu_estd} />
                        </span>
                        <button
                          type="button"
                          className="mobile-expand-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(r.usu_codi || r.rep_codi);
                          }}
                          aria-label={
                            expandedId === (r.usu_codi || r.rep_codi)
                              ? "Ver menos"
                              : "Ver más"
                          }
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </td>
                      <td
                        className="px-6 py-4 mobile-detail"
                        data-label="Contacto"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="text-xs break-all">
                              {r.usu_crro || "-"}
                            </span>
                          </div>
                          {r.rep_telf && (
                            <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-xs">{r.rep_telf}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td
                        className="px-6 py-4 hidden sm:table-cell mobile-detail"
                        data-label="Paciente"
                      >
                        {r.ninos && r.ninos.length > 0 ? (
                          <div>
                            <span className="text-sm text-slate-600 dark:text-slate-300">
                              {r.ninos
                                .map((n) => `${n.nin_nomb} ${n.nin_apel || ""}`)
                                .join(", ")}
                            </span>
                            {r.ninos.length > 1 && (
                              <span className="ml-2 text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                                {r.ninos.length} niños
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td
                        className="px-6 py-4 text-center mobile-detail"
                        data-label="Estado"
                      >
                        <StatusBadge active={r.usu_estd} />
                      </td>
                      <td
                        className="px-6 py-4 text-right mobile-detail"
                        data-label="Acciones"
                      >
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRep({
                                usu_codi: r.usu_codi,
                                rep_nomb: r.rep_nomb || "",
                                rep_apel: r.rep_apel || "",
                                rep_telf: r.rep_telf || "",
                                rep_rela: r.rep_rela || "",
                              });
                            }}
                            title="Editar"
                            className="action-icon-btn text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetPass(r.usu_codi, r.usu_crro);
                            }}
                            disabled={resettingId === r.usu_codi}
                            title="Restablecer contraseña"
                            className="action-icon-btn text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 disabled:opacity-50"
                          >
                            {resettingId === r.usu_codi ? (
                              <span className="w-4 h-4 border-2 border-purple-300 border-t-purple-600 rounded-full animate-spin" />
                            ) : (
                              <KeyRound className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleEstado(r.usu_codi, r.usu_estd);
                            }}
                            title={r.usu_estd ? "Desactivar" : "Activar"}
                            className={`action-icon-btn text-slate-500 ${r.usu_estd ? "hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30" : "hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"}`}
                          >
                            {r.usu_estd ? (
                              <Ban className="w-4 h-4" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
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

      {/* Modal Editar Representante */}
      <AdminModal
        open={!!editingRep}
        onClose={() => setEditingRep(null)}
        title="Editar Representante"
        subtitle={`${editingRep?.rep_nomb || ""} ${editingRep?.rep_apel || ""}`.trim()}
        maxWidth="max-w-xl"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (!validarEditTodo()) return;
            const ok = await handleUpdateRepresentante(e);
            if (ok) setEditingRep(null);
          }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Nombres</label>
              <input
                required
                maxLength={50}
                type="text"
                value={editingRep?.rep_nomb || ""}
                onChange={(e) =>
                  setEditingRep({ ...editingRep, rep_nomb: e.target.value })
                }
                className="form-input"
                placeholder="Ej. María"
              />
            </div>
            <div>
              <label className="form-label">Apellidos</label>
              <input
                required
                maxLength={50}
                type="text"
                value={editingRep?.rep_apel || ""}
                onChange={(e) =>
                  setEditingRep({ ...editingRep, rep_apel: e.target.value })
                }
                className="form-input"
                placeholder="Ej. Rodríguez"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Teléfono de Contacto</label>
              <input
                maxLength={15}
                type="text"
                value={editingRep?.rep_telf || ""}
                onChange={(e) => {
                  setEditingRep({ ...editingRep, rep_telf: e.target.value });
                  setEditErrores((prev) => ({
                    ...prev,
                    rep_telf: validarEditCampo("rep_telf"),
                  }));
                }}
                className={`form-input ${editErrores.rep_telf ? "form-input-invalid" : ""}`}
                placeholder="+58 412 0000000"
              />
              {editErrores.rep_telf && (
                <p className="form-error">
                  <AlertCircle className="w-3.5 h-3.5" /> {editErrores.rep_telf}
                </p>
              )}
            </div>
            <div>
              <label className="form-label">Vínculo Legal</label>
              <select
                value={editingRep?.rep_rela || ""}
                onChange={(e) =>
                  setEditingRep({ ...editingRep, rep_rela: e.target.value })
                }
                className="form-select"
              >
                <option value="" disabled>
                  Seleccione vínculo...
                </option>
                <option value="Madre">Madre</option>
                <option value="Padre">Padre</option>
                <option value="Tutor">Tutor</option>
                <option value="Abuela">Abuela</option>
                <option value="Abuelo">Abuelo</option>
                <option value="Hermana">Hermana</option>
                <option value="Hermano">Hermano</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-3 pt-1 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setEditingRep(null)}
              className="md:w-auto w-full px-6 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              disabled={parentLoading}
              type="submit"
              className="md:w-auto w-full px-8 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </AdminModal>

      {/* Vista previa del representante y su paciente */}
      {previewRep && (
        <AdminModal
          open={!!previewRep}
          onClose={() => setPreviewRep(null)}
          title="Vista previa del Representante"
          subtitle={`${previewRep.rep_nomb || ""} ${previewRep.rep_apel || ""}`.trim()}
          maxWidth="max-w-xl"
        >
          <div className="space-y-6">
            {/* Ficha del representante */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold text-lg shrink-0">
                {previewRep.rep_nomb?.charAt(0) || "?"}
                {previewRep.rep_apel?.charAt(0) || ""}
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {previewRep.rep_nomb} {previewRep.rep_apel}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  ID: {previewRep.rep_codi || previewRep.usu_codi}
                </div>
                <div className="mt-1.5">
                  <StatusBadge active={previewRep.usu_estd} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <Mail className="w-3.5 h-3.5" /> Correo Electrónico
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 break-all">
                  {previewRep.usu_crro || "-"}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <Phone className="w-3.5 h-3.5" /> Teléfono de Contacto
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {previewRep.rep_telf || "-"}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Vínculo Legal
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {previewRep.rep_rela || "No especificado"}
                </p>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <IdCard className="w-3.5 h-3.5" /> Código de Usuario
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 font-mono">
                  {previewRep.usu_codi || "-"}
                </p>
              </div>
            </div>

            {/* Pacientes asociados */}
            <div>
              <div className="form-section-title">
                <Baby className="form-section-title-icon" />
                <h4 className="form-section-title-text">Pacientes Asociados</h4>
                <span className="form-section-title-line" />
              </div>
              {(previewRep.ninos && previewRep.ninos.length > 0) ||
              previewRep.tm_ninos ? (
                <div className="space-y-3">
                  {(previewRep.ninos && previewRep.ninos.length > 0
                    ? previewRep.ninos
                    : [previewRep.tm_ninos]
                  ).map((nino, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40"
                    >
                      <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-700 dark:text-brand-300 font-bold text-base shrink-0">
                        {nino.nin_nomb?.charAt(0) || "?"}
                        {nino.nin_apel?.charAt(0) || ""}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {nino.nin_nomb} {nino.nin_apel}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                          <span>
                            {nino.nin_gner === "M" ? "Masculino" : "Femenino"}
                          </span>
                          <span>{calcEdad(nino.nin_fnac)}</span>
                          <span>{nino.nin_nivd}</span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Cake className="w-3.5 h-3.5" />
                          {nino.nin_fnac
                            ? new Date(nino.nin_fnac).toLocaleDateString(
                                "es-VE",
                                {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                },
                              )
                            : "Fecha no disponible"}
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-1">
                          ID: {nino.nin_codi}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sin paciente asociado.
                </p>
              )}
            </div>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
