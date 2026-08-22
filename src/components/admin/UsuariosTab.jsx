import { useState, useEffect, useMemo } from "react";
import {
  User,
  Mail,
  Calendar,
  Clock,
  KeyRound,
  ChevronDown,
  Ban,
  CheckCircle2,
} from "lucide-react";
import FilterBar from "../shared/FilterBar";
import StatusBadge from "../shared/StatusBadge";
import Pagination from "../shared/Pagination";
import LoadingState from "../dashboard/LoadingState";
import ConfirmDialog from "../shared/ConfirmDialog";
import useExpandableRows from "../../hooks/useExpandableRows";
import api from "../../api/axios";
import { useGlobalContext } from "../../context/GlobalState";
import { toastError } from "../../utils/errorHandler";

export default function UsuariosTab({
  usuarios,
  loading,
  onRefresh,
  exportUsuariosToPDF,
  exportUsuariosToExcel,
}) {
  const { showToast } = useGlobalContext();
  const { expandedId, toggle } = useExpandableRows();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [filterEstado, setFilterEstado] = useState("TODOS");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [resettingId, setResettingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [confirmState, setConfirmState] = useState({
    isOpen: false,
    user: null,
    activo: false,
  });

  const counts = useMemo(() => {
    const activos = usuarios.filter((u) => u.usu_estd).length;
    return {
      total: usuarios.length,
      activos,
      suspendidos: usuarios.length - activos,
    };
  }, [usuarios]);

  const formatDate = (dateString) => {
    if (!dateString) return "Nunca";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUserName = (user) => {
    if (user.rol_codi === "ROL_ESP" && user.tm_espec) {
      return `${user.tm_espec.esp_gner === "M" ? "Dr." : "Dra."} ${user.tm_espec.esp_nomb} ${user.tm_espec.esp_apel}`;
    }
    if (user.rol_codi === "ROL_REP" && user.tm_repre) {
      return `${user.tm_repre.rep_nomb} ${user.tm_repre.rep_apel}`;
    }
    if (user.rol_codi === "ROL_ADM" && user.tm_admin) {
      return `${user.tm_admin.adm_nomb} ${user.tm_admin.adm_apel}`;
    }
    return "Administrador Global / Director";
  };

  const getRoleBadge = (rolCodi) => {
    let label = "Otro";
    let tone =
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
    if (rolCodi === "ROL_ADM") {
      label = "Administrador";
      tone =
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    } else if (rolCodi === "ROL_ESP") {
      label = "Especialista";
      tone =
        "bg-indigo-50/70 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200/60 dark:border-indigo-900/40";
    } else if (rolCodi === "ROL_REP") {
      label = "Representante";
      tone =
        "bg-sky-50/70 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200/60 dark:border-sky-900/40";
    }
    return (
      <span
        className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${tone}`}
      >
        {label}
      </span>
    );
  };

  const filteredUsers = useMemo(
    () =>
      usuarios.filter((user) => {
        const name = getUserName(user).toLowerCase();
        const email = user.usu_crro.toLowerCase();
        const search = searchTerm.toLowerCase();
        if (searchTerm && !name.includes(search) && !email.includes(search))
          return false;
        if (roleFilter !== "ALL" && user.rol_codi !== roleFilter) return false;
        if (filterEstado === "ACTIVO" && !user.usu_estd) return false;
        if (filterEstado === "INACTIVO" && user.usu_estd) return false;
        if (
          dateFrom &&
          user.usu_crea &&
          new Date(user.usu_crea) < new Date(dateFrom)
        )
          return false;
        if (dateTo && user.usu_crea) {
          const end = new Date(dateTo);
          end.setHours(23, 59, 59, 999);
          if (new Date(user.usu_crea) > end) return false;
        }
        return true;
      }),
    [usuarios, searchTerm, roleFilter, filterEstado, dateFrom, dateTo],
  );

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const pagedUsers = filteredUsers.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [searchTerm, roleFilter, filterEstado, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
    setFilterEstado("TODOS");
    setDateFrom("");
    setDateTo("");
  };

  const roleLabels = {
    ALL: "Todos los roles",
    ROL_ADM: "Administradores",
    ROL_ESP: "Especialistas",
    ROL_REP: "Representantes",
  };

  const filterChips = [
    roleFilter !== "ALL" && {
      key: "role",
      label: roleLabels[roleFilter] || roleFilter,
      onRemove: () => setRoleFilter("ALL"),
    },
    filterEstado !== "TODOS" && {
      key: "estado",
      label: filterEstado === "ACTIVO" ? "Activos" : "Suspendidos",
      onRemove: () => setFilterEstado("TODOS"),
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

  const openConfirmToggle = (user) => {
    setConfirmState({ isOpen: true, user, activo: !user.usu_estd });
  };

  const handleConfirmToggle = async () => {
    const { user, activo } = confirmState;
    if (!user) return;
    setTogglingId(user.usu_codi);
    try {
      await api.patch(`/admin/users/${user.usu_codi}/estado`, { activo });
      showToast(
        `✅ ${user.usu_crro} ${activo ? "activado" : "suspendido"} exitosamente.`,
      );
      if (onRefresh) onRefresh();
    } catch (err) {
      toastError(
        err,
        showToast,
        `Error al ${activo ? "activar" : "suspender"} el usuario.`,
      );
    } finally {
      setTogglingId(null);
      setConfirmState({ isOpen: false, user: null, activo: false });
    }
  };

  const estadoTabs = [
    { key: "TODOS", label: "Todos", count: counts.total },
    { key: "ACTIVO", label: "Activos", count: counts.activos },
    { key: "INACTIVO", label: "Suspendidos", count: counts.suspendidos },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filtros */}
      <FilterBar
        dataTour="admin-usr-filters"
        searchValue={searchTerm}
        onSearch={setSearchTerm}
        searchPlaceholder="Buscar por nombre o correo..."
        activeCount={
          (searchTerm ? 1 : 0) +
          (roleFilter !== "ALL" ? 1 : 0) +
          (filterEstado !== "TODOS" ? 1 : 0) +
          (dateFrom ? 1 : 0) +
          (dateTo ? 1 : 0)
        }
        onClearAll={clearFilters}
        chips={filterChips}
      >
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="flex-1 sm:flex-none px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          <option value="ALL">Todos los Roles</option>
          <option value="ROL_ADM">Administradores</option>
          <option value="ROL_ESP">Especialistas</option>
          <option value="ROL_REP">Representantes</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="flex-1 sm:flex-none px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          title="Creación desde"
        />
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="flex-1 sm:flex-none px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          title="Creación hasta"
        />
      </FilterBar>

      <div
        data-tour="admin-usr-table"
        className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 overflow-hidden"
      >
        {/* Tab bar integrada a la tarjeta */}
        <div
          data-tour="admin-usr-status"
          className="px-3 sm:px-6 pt-3 flex items-center gap-6 border-b border-slate-100 dark:border-slate-800/60 overflow-x-auto"
        >
          {estadoTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilterEstado(tab.key)}
              className={`flex items-center gap-1.5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap ${
                filterEstado === tab.key
                  ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              {tab.label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${
                  filterEstado === tab.key
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Cuentas de Acceso al Sistema
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-900/30">
              {filteredUsers.length}{" "}
              {filteredUsers.length === 1 ? "Usuario" : "Usuarios"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={exportUsuariosToPDF}
                className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg text-xs font-semibold transition-colors"
              >
                PDF
              </button>
              <button
                onClick={exportUsuariosToExcel}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg text-xs font-semibold transition-colors"
              >
                Excel
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingState variant="table" rows={5} role="ADMIN_INSTITUCION" />
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 sm:p-12 text-center text-slate-500 dark:text-slate-400">
            No se encontraron usuarios con los criterios de búsqueda
            establecidos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse responsive-table">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4 hidden md:table-cell">Creación</th>
                  <th className="px-6 py-4 hidden lg:table-cell">
                    Último Acceso
                  </th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {pagedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">
                      No se encontraron usuarios.
                    </td>
                  </tr>
                ) : (
                  pagedUsers.map((user) => {
                    const name = getUserName(user);
                    const isActive = user.usu_estd;
                    const busy =
                      togglingId === user.usu_codi ||
                      resettingId === user.usu_codi;
                    return (
                      <tr
                        key={user.usu_codi}
                        className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors ${expandedId === user.usu_codi ? "mobile-expanded" : ""}`}
                      >
                        <td
                          className="px-6 py-4 mobile-summary"
                          data-label="Usuario"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div
                              className={`p-2.5 rounded-lg flex items-center justify-center ${isActive ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}
                            >
                              <User className="h-4.5 w-4.5" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-white leading-tight truncate">
                                {name}
                              </div>
                              <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1 truncate">
                                <Mail className="h-3 w-3 shrink-0" />{" "}
                                {user.usu_crro}
                              </div>
                            </div>
                          </div>
                          <span className="mobile-summary-status">
                            <StatusBadge active={isActive} />
                          </span>
                          <button
                            type="button"
                            className="mobile-expand-btn"
                            onClick={() => toggle(user.usu_codi)}
                            aria-label={
                              expandedId === user.usu_codi
                                ? "Ver menos"
                                : "Ver más"
                            }
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </td>
                        <td
                          className="px-6 py-4 whitespace-nowrap mobile-detail"
                          data-label="Rol"
                        >
                          {getRoleBadge(user.rol_codi)}
                        </td>
                        <td
                          className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden md:table-cell whitespace-nowrap mobile-detail"
                          data-label="Creación"
                        >
                          <div className="flex items-center gap-1.5 text-xs">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(user.usu_crea)}
                          </div>
                        </td>
                        <td
                          className="px-6 py-4 text-slate-500 dark:text-slate-400 hidden lg:table-cell whitespace-nowrap mobile-detail"
                          data-label="Último Acceso"
                        >
                          <div className="flex items-center gap-1.5 text-xs">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {formatDate(user.usu_logi)}
                          </div>
                        </td>
                        <td
                          className="px-6 py-4 text-center whitespace-nowrap mobile-detail"
                          data-label="Estado"
                        >
                          <button
                            onClick={() => openConfirmToggle(user)}
                            disabled={busy}
                            title={
                              isActive
                                ? "Haz clic para suspender al usuario"
                                : "Haz clic para activar al usuario"
                            }
                            className="transition-transform hover:scale-105 hover:opacity-90 disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
                          >
                            <StatusBadge active={isActive} />
                          </button>
                        </td>
                        <td
                          className="px-6 py-4 text-right whitespace-nowrap mobile-detail"
                          data-label="Acciones"
                        >
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                handleResetPass(user.usu_codi, user.usu_crro)
                              }
                              disabled={busy}
                              title="Restablecer contraseña"
                              className="action-icon-btn text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                            >
                              {resettingId === user.usu_codi ? (
                                <span className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                              ) : (
                                <KeyRound className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => openConfirmToggle(user)}
                              disabled={busy}
                              title={
                                isActive
                                  ? "Suspender usuario"
                                  : "Activar usuario"
                              }
                              className={
                                isActive
                                  ? "action-icon-btn text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                                  : "action-icon-btn text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                              }
                            >
                              {togglingId === user.usu_codi ? (
                                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin inline-block align-middle" />
                              ) : isActive ? (
                                <Ban className="w-4 h-4" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={() =>
          setConfirmState({ isOpen: false, user: null, activo: false })
        }
        onConfirm={handleConfirmToggle}
        title={confirmState.activo ? "Activar Usuario" : "Suspender Usuario"}
        message={
          confirmState.user
            ? `¿Estás seguro de que deseas <b>${confirmState.activo ? "activar" : "suspender"}</b> a <b>${confirmState.user.usu_crro}</b>? El acceso al sistema será ${confirmState.activo ? "restablecido" : "revocado"} inmediatamente.`
            : ""
        }
        type={confirmState.activo ? "success" : "danger"}
        confirmLabel={confirmState.activo ? "Activar" : "Suspender"}
      />
    </div>
  );
}
