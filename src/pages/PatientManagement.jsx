import { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useGlobalContext } from "../context/GlobalState";
import { Users, Cake, Calendar, ChevronRight, Eye, IdCard } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import Topbar from "../components/layout/Topbar";
import Pagination from "../components/shared/Pagination";
import RegisterChildModal from "../components/shared/RegisterChildModal";
import FilterBar from "../components/shared/FilterBar";
import Fab from "../components/ui/Fab";
import PageTitle from "../components/ui/PageTitle";

const getNivelBadgeClass = (nivel) => {
  const niv = (nivel || "").toLowerCase();
  if (niv.includes("1")) {
    return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800/50";
  }
  if (niv.includes("2")) {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50";
  }
  if (niv.includes("3")) {
    return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/50";
  }
  return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/50";
};

const formatFecha = (fechaStr) => {
  if (!fechaStr) return null;
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return null;
  }
};

export default function PatientManagement() {
  const {
    listaNinos,
    setSelectedChildId,
    setNomNino,
    navigate,
    fetchNinos,
    showToast,
  } = useGlobalContext();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 300);
  const [filterNivel, setFilterNivel] = useState("Todos");
  const [filterAsign, setFilterAsign] = useState("Todos");
  const [filterGenero, setFilterGenero] = useState("Todos");
  const [sortBy, setSortBy] = useState("nombre");
  const [sortDir, setSortDir] = useState("asc");

  const sortedNinos = useMemo(() => {
    const arr = [...listaNinos];
    const dir = sortDir === "asc" ? 1 : -1;
    if (sortBy === "edad") {
      arr.sort((a, b) => {
        const ea = a.nin_fnac ? new Date(a.nin_fnac).getTime() : 0;
        const eb = b.nin_fnac ? new Date(b.nin_fnac).getTime() : 0;
        return (ea - eb) * dir;
      });
    } else if (sortBy === "ingreso") {
      arr.sort((a, b) => {
        const ia = a.nin_ingr ? new Date(a.nin_ingr).getTime() : 0;
        const ib = b.nin_ingr ? new Date(b.nin_ingr).getTime() : 0;
        return (ib - ia) * dir;
      });
    } else {
      arr.sort(
        (a, b) =>
          `${a.nom_nino} ${a.ape_nino}`.localeCompare(
            `${b.nom_nino} ${b.ape_nino}`,
          ) * dir,
      );
    }
    return arr;
  }, [listaNinos, sortBy, sortDir]);

  const filteredNinos = useMemo(() => {
    return sortedNinos.filter((nino) => {
      const fullName = `${nino.nom_nino} ${nino.ape_nino}`.toLowerCase();
      const matchesSearch =
        fullName.includes(debouncedSearch.toLowerCase()) ||
        nino.nom_nino.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesNivel =
        filterNivel === "Todos" || nino.niv_desa === filterNivel;
      const matchesAsign =
        filterAsign === "Todos" || nino.est_asign === filterAsign;
      const matchesGenero =
        filterGenero === "Todos" || nino.nin_gner === filterGenero;
      return matchesSearch && matchesNivel && matchesAsign && matchesGenero;
    });
  }, [sortedNinos, debouncedSearch, filterNivel, filterAsign, filterGenero]);

  const PAGE_SIZE = 9;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(filteredNinos.length / PAGE_SIZE);
  const pagedNinos = filteredNinos.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [searchTerm, filterNivel, filterAsign, filterGenero, sortBy, sortDir]);

  // States for Registration Modal
  const [showRegModal, setShowRegModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [previewNino, setPreviewNino] = useState(null);

  const handleManagePatient = (nino) => {
    setSelectedChildId(nino.id_ninos);
    setNomNino(`${nino.nom_nino} ${nino.ape_nino}`);
    navigate("dashboard");
  };

  const calcEdad = (fechaNac) => {
    if (!fechaNac) return "Edad no disponible";
    const hoy = new Date();
    const nac = new Date(fechaNac);
    let años = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) años--;
    return `${años} año${años !== 1 ? "s" : ""}`;
  };

  const handleRegistrationSuccess = (data = {}) => {
    if (data.reutilizado) {
      fetchNinos();
      return;
    }
    setGeneratedLink(data.invitationUrl || "");
    setShowLinkModal(true);
    fetchNinos();
  };

  // Obtener iniciales
  const getInitials = (nombre, apellido) => {
    const n = nombre ? nombre.charAt(0) : "";
    const a = apellido ? apellido.charAt(0) : "";
    return `${n}${a}`.toUpperCase() || "N";
  };

  // Avatar con foto o iniciales como fallback
  const Avatar = ({ nino, className = "" }) => {
    if (nino.nin_foto) {
      return (
        <img
          src={nino.nin_foto}
          alt={`${nino.nom_nino} ${nino.ape_nino}`}
          className={`object-cover rounded-full border border-blue-200 dark:border-blue-800/50 ${className}`}
        />
      );
    }
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold shadow-xs border border-blue-200 dark:border-blue-800/50 ${className}`}
      >
        {getInitials(nino.nom_nino, nino.ape_nino)}
      </div>
    );
  };

  const nivelesUnicos = [
    "Todos",
    ...new Set(listaNinos.map((n) => n.niv_desa).filter(Boolean)),
  ];

  return (
    <div className="flex h-[100dvh] w-full bg-[#F4F7F9] dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-200">
      {/* Menú Lateral Izquierdo */}
      <Sidebar />

      {/* Lienzo Derecho (Main Canvas) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar / Header Superior */}
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-4 md:p-6 flex flex-col gap-5 md:gap-8">
            {/* Header del Directorio de Pacientes */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <PageTitle icon={Users} data-tour="pm-header">
                  Gestión de Pacientes
                </PageTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Directorio de pacientes asignados al especialista
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  title={`Mostrando ${filteredNinos.length} de ${listaNinos.length} pacientes registrados`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs"
                >
                  <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  {filteredNinos.length}{" "}
                  {filteredNinos.length === 1 ? "paciente" : "pacientes"}
                </span>
                {listaNinos.some((n) => n.est_asign === "Activo") && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {
                      listaNinos.filter((n) => n.est_asign === "Activo").length
                    }{" "}
                    con especialista
                  </span>
                )}
              </div>
            </div>

            {/* Toolbar con Filtros y Botón de Registro */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <FilterBar
                dataTour="pm-filters"
                searchDataTour="pm-search"
                clearDataTour="pm-clear"
                searchValue={searchTerm}
                onSearch={setSearchTerm}
                searchPlaceholder="Buscar paciente por nombre..."
                activeCount={
                  (searchTerm ? 1 : 0) +
                  (filterNivel !== "Todos" ? 1 : 0) +
                  (filterAsign !== "Todos" ? 1 : 0) +
                  (filterGenero !== "Todos" ? 1 : 0) +
                  (sortBy !== "nombre" || sortDir !== "asc" ? 1 : 0)
                }
                onClearAll={() => {
                  setSearchTerm("");
                  setFilterNivel("Todos");
                  setFilterAsign("Todos");
                  setFilterGenero("Todos");
                  setSortBy("nombre");
                  setSortDir("asc");
                }}
                chips={[
                  filterNivel !== "Todos" && {
                    key: "nivel",
                    label: `Nivel: ${filterNivel}`,
                    onRemove: () => setFilterNivel("Todos"),
                  },
                  filterAsign !== "Todos" && {
                    key: "asign",
                    label:
                      filterAsign === "Activo"
                        ? "Asignación: Con especialista"
                        : "Asignación: Sin especialista",
                    onRemove: () => setFilterAsign("Todos"),
                  },
                  filterGenero !== "Todos" && {
                    key: "genero",
                    label:
                      filterGenero === "M"
                        ? "Género: Masculino"
                        : "Género: Femenino",
                    onRemove: () => setFilterGenero("Todos"),
                  },
                  (sortBy !== "nombre" || sortDir !== "asc") && {
                    key: "orden",
                    label: `Orden: ${sortBy === "edad" ? "Edad" : sortBy === "ingreso" ? "Ingreso" : "Nombre"} (${sortDir === "asc" ? "A-Z" : "Z-A"})`,
                    onRemove: () => {
                      setSortBy("nombre");
                      setSortDir("asc");
                    },
                  },
                ].filter(Boolean)}
                className="flex-1"
              >
                <select
                  data-tour="pm-filter-nivel"
                  className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  value={filterNivel}
                  onChange={(e) => setFilterNivel(e.target.value)}
                >
                  {nivelesUnicos.map((nivel) => (
                    <option key={nivel} value={nivel}>
                      {nivel === "Todos" ? "Todos los niveles" : nivel}
                    </option>
                  ))}
                </select>
                <select
                  data-tour="pm-filter-genero"
                  className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  value={filterGenero}
                  onChange={(e) => setFilterGenero(e.target.value)}
                >
                  <option value="Todos">Todos los géneros</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
                <select
                  data-tour="pm-filter-asign"
                  className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  value={filterAsign}
                  onChange={(e) => setFilterAsign(e.target.value)}
                >
                  <option value="Todos">Todas las asignaciones</option>
                  <option value="Activo">Con especialista</option>
                  <option value="Sin asignar">Sin especialista</option>
                </select>
                <select
                  data-tour="pm-sort"
                  className="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                  value={`${sortBy}:${sortDir}`}
                  onChange={(e) => {
                    const [by, dir] = e.target.value.split(":");
                    setSortBy(by);
                    setSortDir(dir);
                  }}
                >
                  <option value="nombre:asc">Nombre (A-Z)</option>
                  <option value="nombre:desc">Nombre (Z-A)</option>
                  <option value="edad:asc">Edad (menor a mayor)</option>
                  <option value="edad:desc">Edad (mayor a menor)</option>
                  <option value="ingreso:desc">Ingreso (recientes)</option>
                  <option value="ingreso:asc">Ingreso (antiguos)</option>
                </select>
              </FilterBar>

              <button
                onClick={() => setShowRegModal(true)}
                data-tour="pm-register"
                className="hidden md:inline-flex w-full md:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all items-center justify-center gap-2 shrink-0"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Registrar Nuevo Paciente
              </button>
            </div>

            <Fab
              onClick={() => setShowRegModal(true)}
              label="Registrar Nuevo Paciente"
            />

            {/* Cuadrícula de Pacientes */}
            <div
              data-tour="pm-grid"
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
            >
              {pagedNinos.map((nino) => (
                <div
                  key={nino.id_ninos}
                  data-tour="pm-card"
                  role="button"
                  tabIndex={0}
                  aria-label={`Abrir detalle clínico de ${nino.nom_nino} ${nino.ape_nino}`}
                  onClick={() => handleManagePatient(nino)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleManagePatient(nino);
                    }
                  }}
                  className="group flex flex-col justify-between bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-200 relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <div>
                    {/* Header: Avatar + Nombre Completo + Diagnóstico + Chevron */}
                    <div className="flex items-start gap-3.5 mb-3">
                      <Avatar
                        nino={nino}
                        className="h-12 w-12 text-lg shrink-0 mt-0.5 shadow-sm"
                      />

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug break-words group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {nino.nom_nino} {nino.ape_nino}
                        </h3>
                        {nino.nin_diag && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                            {nino.nin_diag}
                          </p>
                        )}
                        <div className="flex items-center flex-wrap gap-2 mt-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50 text-[11px] font-semibold whitespace-nowrap">
                            <Cake className="w-3 h-3" />
                            {calcEdad(nino.nin_fnac)}
                          </span>
                          {nino.nin_gner && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 text-[11px] font-medium">
                              {nino.nin_gner === "M"
                                ? "Masculino"
                                : nino.nin_gner === "F"
                                  ? "Femenino"
                                  : nino.nin_gner}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewNino(nino);
                          }}
                          title="Ficha rápida del paciente"
                          aria-label={`Ver ficha rápida de ${nino.nom_nino}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 dark:hover:text-blue-400 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <div className="p-1 rounded-lg text-slate-300 dark:text-slate-600 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer: Nivel TEA + Estado Asignación + Fecha Ingreso */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2 text-[11px] mt-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md font-semibold border ${getNivelBadgeClass(nino.niv_desa)}`}
                      >
                        {nino.niv_desa
                          ? nino.niv_desa.toLowerCase().startsWith("nivel")
                            ? nino.niv_desa
                            : `Nv. ${nino.niv_desa}`
                          : "Sin nivel"}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold border ${
                          nino.est_asign === "Activo"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50"
                            : "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            nino.est_asign === "Activo"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />
                        {nino.est_asign === "Activo"
                          ? "Asignado"
                          : "Sin asignar"}
                      </span>
                    </div>

                    {nino.nin_ingr && (
                      <span
                        className="text-slate-400 dark:text-slate-500 text-[10px] hidden sm:inline-flex items-center gap-1 shrink-0"
                        title={`Fecha de ingreso: ${formatFecha(nino.nin_ingr)}`}
                      >
                        <Calendar className="w-3 h-3" />
                        {formatFecha(nino.nin_ingr)}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {filteredNinos.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                  <svg
                    className="w-16 h-16 mb-4 opacity-50"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-lg font-medium">
                    No se encontraron pacientes
                  </p>
                  <p className="text-sm">
                    Ajusta los filtros o intenta con otro nombre.
                  </p>
                </div>
              )}
            </div>
            <div data-tour="pm-pagination">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Modal: Registrar Niño & Invitar Representante */}
      <RegisterChildModal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        onSuccess={handleRegistrationSuccess}
      />

      {/* Vista previa del paciente */}
      {previewNino && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="relative p-6 bg-gradient-to-r from-brand-700 to-brand-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar
                  nino={previewNino}
                  className="w-20 h-20 text-2xl shrink-0 border-4 border-white/30 shadow-lg"
                />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold leading-tight">
                    {previewNino.nom_nino} {previewNino.ape_nino}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/20 text-white border border-white/30">
                      Clasificación: {previewNino.niv_desa}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        previewNino.est_asign === "Activo"
                          ? "bg-white/20 text-white border-white/30"
                          : "bg-black/20 text-white/90 border-white/20"
                      }`}
                      title={
                        previewNino.est_asign === "Activo"
                          ? "Paciente con especialista asignado"
                          : "Paciente sin especialista asignado"
                      }
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          previewNino.est_asign === "Activo"
                            ? "bg-green-300"
                            : "bg-white/60"
                        }`}
                      ></span>
                      {previewNino.est_asign === "Activo"
                        ? "Con especialista"
                        : "Sin especialista"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPreviewNino(null)}
                className="text-white/80 hover:text-white text-2xl font-bold shrink-0"
                aria-label="Cerrar vista previa"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              {previewNino.nin_diag && (
                <div className="p-4 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20">
                  <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-300 text-xs font-bold uppercase tracking-wider mb-1">
                    <IdCard className="w-3.5 h-3.5" /> Diagnóstico
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {previewNino.nin_diag}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Cake className="w-3.5 h-3.5" /> Fecha de Nacimiento
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {previewNino.nin_fnac
                      ? new Date(previewNino.nin_fnac).toLocaleDateString(
                          "es-VE",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )
                      : "-"}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Users className="w-3.5 h-3.5" /> Edad
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {calcEdad(previewNino.nin_fnac)}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <IdCard className="w-3.5 h-3.5" /> Género
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {previewNino.nin_gner === "M" ? "Masculino" : "Femenino"}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Fecha de Ingreso
                  </div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                    {previewNino.nin_ingr
                      ? new Date(previewNino.nin_ingr).toLocaleDateString(
                          "es-VE",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )
                      : "-"}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={() => {
                    const nino = previewNino;
                    setPreviewNino(null);
                    handleManagePatient(nino);
                  }}
                  className="flex-1 px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Gestionar Paciente
                </button>
                <button
                  onClick={() => setPreviewNino(null)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Enlace Generado */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                ¡Invitación Clínica Creada!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Se ha generado el token de activación clínico. Copie el
                siguiente enlace y envíelo al representante para que configure
                su cuenta:
              </p>

              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs select-all break-all text-left max-h-[80px] overflow-y-auto">
                {generatedLink}
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink);
                    showToast("📋 Enlace copiado al portapapeles");
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold"
                >
                  Copiar Enlace
                </button>
                <button
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg text-sm font-semibold"
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
