import { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useGlobalContext } from "../context/GlobalState";
import api from "../api/axios";
import { Users, Cake, Calendar, IdCard } from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import Topbar from "../components/layout/Topbar";
import Pagination from "../components/shared/Pagination";
import RegisterChildModal from "../components/shared/RegisterChildModal";

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
  const [filterEstado, setFilterEstado] = useState("Todos");
  const filteredNinos = useMemo(() => {
    return listaNinos.filter((nino) => {
      const fullName = `${nino.nom_nino} ${nino.ape_nino}`.toLowerCase();
      const matchesSearch =
        fullName.includes(debouncedSearch.toLowerCase()) ||
        nino.nom_nino.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesNivel =
        filterNivel === "Todos" || nino.niv_desa === filterNivel;
      const matchesEstado =
        filterEstado === "Todos" || nino.est_disp === filterEstado;
      return matchesSearch && matchesNivel && matchesEstado;
    });
  }, [listaNinos, debouncedSearch, filterNivel, filterEstado]);

  const PAGE_SIZE = 8;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(filteredNinos.length / PAGE_SIZE);
  const pagedNinos = filteredNinos.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    setPage(0);
  }, [searchTerm, filterNivel, filterEstado]);

  // New States for Clinical Invitation
  const [showRegModal, setShowRegModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [previewNino, setPreviewNino] = useState(null);

  const handleManagePatient = (nino) => {
    setSelectedChildId(nino.id_ninos);
    setNomNino(`${nino.nom_nino} ${nino.ape_nino}`); // Set legacy nomNino for consistency
    navigate("student");
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

  const handleRegistrationSuccess = (invitationUrl) => {
    setGeneratedLink(invitationUrl);
    setShowLinkModal(true);
    fetchNinos();
  };

  // Obtener iniciales
  const getInitials = (nombre, apellido) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
  };

  const nivelesUnicos = [
    "Todos",
    ...new Set(listaNinos.map((n) => n.niv_desa)),
  ];

  return (
    <div className="flex h-[100dvh] w-full bg-[#F4F7F9] dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-200">
      {/* Menú Lateral Izquierdo */}
      <Sidebar />

      {/* Lienzo Derecho (Main Canvas) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar / Header Superior de Utilidad */}
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-6 md:p-8 lg:p-10 flex flex-col gap-8">
            {/* Header del Dashboard ([B] Ind. Empresa y [A] Logo + [D] Botones de Cambio) */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h1
                  data-tour="pm-header"
                  className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors"
                >
                  <Users className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                  Portal Clínico de Especialistas
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Panel de control para el seguimiento de pacientes asignados
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                <div className="relative">
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </span>
                  <input
                    type="text"
                    data-tour="pm-search"
                    placeholder="Buscar paciente por nombre..."
                    className="w-full sm:w-64 pl-4 pr-10 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select
                  data-tour="pm-filter-nivel"
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer"
                  value={filterNivel}
                  onChange={(e) => setFilterNivel(e.target.value)}
                >
                  {nivelesUnicos.map((nivel) => (
                    <option key={nivel} value={nivel}>
                      {nivel}
                    </option>
                  ))}
                </select>
                <select
                  data-tour="pm-filter-estado"
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all cursor-pointer"
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                >
                  <option value="Todos">Todos los estados</option>
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
                {(searchTerm ||
                  filterNivel !== "Todos" ||
                  filterEstado !== "Todos") && (
                  <button
                    data-tour="pm-clear"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterNivel("Todos");
                      setFilterEstado("Todos");
                    }}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              <button
                onClick={() => setShowRegModal(true)}
                data-tour="pm-register"
                className="w-full md:w-auto px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
              >
                <svg
                  className="w-5 h-5"
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
                Registrar Nuevo Niño
              </button>
            </div>

            {/* [C] Objetos (Cuadrícula de Pacientes) */}
            <div
              data-tour="pm-grid"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {pagedNinos.map((nino) => (
                <div
                  key={nino.id_ninos}
                  data-tour="pm-card"
                  onClick={() => setPreviewNino(nino)}
                  className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden cursor-pointer"
                >
                  {/* Decorative background glow on hover */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-100 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:from-slate-700 dark:to-slate-800 pointer-events-none -z-10 blur-xl"></div>

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-brand-500 dark:text-blue-400 text-xl font-bold shadow-sm border border-blue-200 dark:border-blue-800/50">
                      {getInitials(nino.nom_nino, nino.ape_nino)}
                    </div>

                    {/* Hardware State Indicator */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                      <span
                        className={`w-2 h-2 rounded-full ${nino.est_disp === "Online" ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" : "bg-gray-400"}`}
                      ></span>
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                        {nino.est_disp}
                      </span>
                    </div>
                  </div>

                  <div className="mb-5 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1">
                      {nino.nom_nino} {nino.ape_nino}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mb-3 flex items-center gap-1">
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
                          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                        />
                      </svg>
                      {nino.id_ninos}
                    </p>

                    {/* Development Level Badge */}
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50">
                      <svg
                        className="w-3 h-3 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      Clasificación: {nino.niv_desa}
                    </span>
                  </div>

                  <button
                    data-tour="pm-manage"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManagePatient(nino);
                    }}
                    className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 group/btn"
                  >
                    Gestionar Paciente
                    <svg
                      className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </button>
                </div>
              ))}

              {filteredNinos.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-slate-600">
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

      {/* Modal Premium: Registrar Niño & Invitar Representante */}
      <RegisterChildModal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        onSuccess={handleRegistrationSuccess}
      />

      {/* Vista previa del paciente */}
      {previewNino && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-gradient-to-r from-brand-700 to-brand-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {getInitials(previewNino.nom_nino, previewNino.ape_nino)}
                </div>
                <div>
                  <h3 className="text-base font-bold">
                    {previewNino.nom_nino} {previewNino.ape_nino}
                  </h3>
                  <p className="text-xs opacity-90 font-mono">
                    ID: {previewNino.id_ninos}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewNino(null)}
                className="text-white/80 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50">
                  Clasificación: {previewNino.niv_desa}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${previewNino.est_disp === "Online" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50" : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"}`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${previewNino.est_disp === "Online" ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                  ></span>
                  {previewNino.est_disp}
                </span>
              </div>

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
