import { useState, useEffect } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useGlobalContext } from "../context/GlobalState";
import api from "../api/axios";
import AlertCenter from "../components/shared/AlertCenter";
import Indicaciones from "../components/shared/Indicaciones";
import {
  UserCircle,
  Calendar,
  AlertTriangle,
  MessageSquareText,
  RefreshCw,
  User,
  Hash,
  Brain,
  Stethoscope,
  ShieldAlert,
  Building2,
  Phone,
  ClipboardList,
} from "lucide-react";
import Topbar from "../components/layout/Topbar";
import LoadingState from "../components/dashboard/LoadingState";
import { useConsentimiento } from "../hooks/useConsentimiento";
import ConsentimientoModal from "../components/shared/ConsentimientoModal";

export default function ParentProfile() {
  const { userRole, navigate, showToast, selectedChildId } = useGlobalContext();
  const [activeTab, setActiveTab] = useState("perfil");

  // API Integration States
  const [childProfile, setChildProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const { consentimientoOk, loadingConsentimiento, aceptarConsentimiento } =
    useConsentimiento(selectedChildId);
  const [isAcceptingConsent, setIsAcceptingConsent] = useState(false);

  const handleAcceptConsent = async (version) => {
    setIsAcceptingConsent(true);
    await aceptarConsentimiento(version);
    setIsAcceptingConsent(false);
  };

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
      const res = await api.get("/ninos/mi-expediente");
      setChildProfile(res.data.data);
    } catch (err) {
      console.error(err);
      showToast("⚠️ No se pudo cargar el expediente clínico del niño");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (userRole === "REPRESENTANTE") {
      fetchProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRole, selectedChildId]);

  const getTeaLevelBadge = (level) => {
    const lvl = String(level || "").toLowerCase();
    if (lvl.includes("1") || lvl === "nivel-1")
      return "Nivel 1 - Necesita Ayuda";
    if (lvl.includes("2") || lvl === "nivel-2")
      return "Nivel 2 - Necesita Ayuda Notable";
    if (lvl.includes("3") || lvl === "nivel-3")
      return "Nivel 3 - Necesita Ayuda Muy Notable";
    return level || "No especificado";
  };

  const getTeaLevelColor = (level) => {
    const lvl = String(level || "").toLowerCase();
    if (lvl.includes("1") || lvl === "nivel-1")
      return "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800";
    if (lvl.includes("2") || lvl === "nivel-2")
      return "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800";
    if (lvl.includes("3") || lvl === "nivel-3")
      return "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800";
    return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  };

  const formatIngreso = (val) => {
    if (!val) return "";
    return new Date(val).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Security Guard
  if (userRole !== "REPRESENTANTE") {
    return (
      <div className="flex h-[100dvh] w-full bg-slate-50 dark:bg-slate-900 items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="text-red-500 mb-4">
            <ShieldAlert className="w-16 h-16 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Acceso Denegado
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Módulo exclusivo para Representantes (Padres).
          </p>
          <button
            onClick={() => navigate("dashboard")}
            className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[#F4F7F9] dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      {/* Lienzo Derecho */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {!consentimientoOk && !loadingConsentimiento && (
          <ConsentimientoModal
            onAccept={handleAcceptConsent}
            loading={isAcceptingConsent}
          />
        )}

        {/* Topbar */}
        <Topbar />

        {/* Content Container with Tabs */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header & Tabs */}
          <div className="pt-4 md:pt-5 px-6 md:px-8 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shrink-0">
            <div className="max-w-[1400px] mx-auto">
              <h1
                data-tour="pp-header"
                className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors mb-4"
              >
                <UserCircle className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                Expediente Clínico
              </h1>

              <div
                data-tour="pp-tabs"
                className="flex gap-6 overflow-x-auto no-scrollbar"
              >
                <button
                  onClick={() => setActiveTab("perfil")}
                  className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "perfil" ? "border-brand-500 text-brand-500" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
                >
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Información del Perfil
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("alertas")}
                  className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "alertas" ? "border-brand-500 text-brand-500" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
                >
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Registro de Alertas
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("indicaciones")}
                  className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === "indicaciones" ? "border-brand-500 text-brand-500" : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"}`}
                >
                  <span className="flex items-center gap-2">
                    <MessageSquareText className="w-4 h-4" />
                    Indicaciones Clínicas
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Content */}
          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
            {activeTab === "perfil" && (
              <div className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-10">
                <div
                  data-tour="pp-perfil"
                  className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors duration-200"
                >
                  <div className="p-6 md:p-8">
                    <h3 className="text-sm font-semibold text-brand-700 dark:text-blue-300 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700 pb-2 mb-6 transition-colors">
                      Datos Clínicos Registrados
                    </h3>

                    {loadingProfile ? (
                      <div className="py-4">
                        <LoadingState variant="profile" />
                      </div>
                    ) : !childProfile ? (
                      <div className="text-center py-12 space-y-4">
                        <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">
                          No se encontró información de expediente para el niño
                          asociado.
                        </p>
                        <button
                          onClick={fetchProfile}
                          className="px-4 py-2 text-sm font-medium text-brand-500 hover:text-brand-600 border border-brand-200 dark:border-brand-800 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors inline-flex items-center gap-2"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Intentar de
                          nuevo
                        </button>
                      </div>
                    ) : (
                      <>
                        <div
                          data-tour="pp-profile-card"
                          className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 mb-6 border-b border-gray-100 dark:border-slate-700"
                        >
                          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-gray-200 dark:border-slate-600 flex items-center justify-center overflow-hidden shrink-0 bg-gray-50 dark:bg-slate-900">
                            {childProfile.nin_foto ? (
                              <img
                                src={childProfile.nin_foto}
                                alt={`${childProfile.nin_nomb} ${childProfile.nin_apel}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserCircle className="w-14 h-14 text-gray-300 dark:text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1 text-center sm:text-left min-w-0">
                            <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                              {childProfile.nin_nomb} {childProfile.nin_apel}
                            </h3>
                            <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                              {childProfile.nin_edad && (
                                <span className="text-xs font-semibold bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                                  {childProfile.nin_edad}
                                </span>
                              )}
                              {childProfile.nin_gner && (
                                <span className="text-xs font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-800">
                                  {childProfile.nin_gner === "M"
                                    ? "Masculino"
                                    : "Femenino"}
                                </span>
                              )}
                              {childProfile.nin_nivd && (
                                <span
                                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getTeaLevelColor(childProfile.nin_nivd)}`}
                                >
                                  {getTeaLevelBadge(childProfile.nin_nivd)}
                                </span>
                              )}
                            </div>
                            {childProfile.nin_ingr && (
                              <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                                Ingreso al sistema:{" "}
                                {formatIngreso(childProfile.nin_ingr)}
                              </p>
                            )}
                          </div>
                        </div>

                        {childProfile.nin_diag && (
                          <div
                            data-tour="pp-diagnosis"
                            className="flex items-start gap-3 mb-6 bg-slate-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-700 rounded-lg p-4"
                          >
                            <ClipboardList className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                Diagnóstico Clínico
                              </p>
                              <p className="text-md text-gray-800 dark:text-gray-200 mt-1">
                                {childProfile.nin_diag}
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div className="flex items-start gap-3">
                              <User className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                  Nombre Completo
                                </p>
                                <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                                  {childProfile.nin_nomb}{" "}
                                  {childProfile.nin_apel}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Hash className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                  Código de Sistema (ID)
                                </p>
                                <p className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700/50 inline-block px-2 py-1 rounded mt-1">
                                  {childProfile.nin_codi}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Calendar className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                  Fecha de Nacimiento
                                </p>
                                <p className="text-md text-gray-800 dark:text-gray-200 mt-1 flex items-center gap-2">
                                  {childProfile.nin_fnac
                                    ? new Date(
                                        childProfile.nin_fnac,
                                      ).toLocaleDateString("es-ES", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric",
                                      })
                                    : ""}
                                  {childProfile.nin_edad && (
                                    <span className="text-xs font-semibold bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                                      {childProfile.nin_edad}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-6">
                            <div className="flex items-start gap-3">
                              <Brain className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                  Nivel de Desarrollo (TEA)
                                </p>
                                <div
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 mt-1 rounded-lg font-medium text-sm border ${getTeaLevelColor(childProfile.nin_nivd)}`}
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full ${childProfile.nin_nivd?.includes("3") ? "bg-rose-500" : childProfile.nin_nivd?.includes("2") ? "bg-amber-500" : "bg-blue-500"}`}
                                  />
                                  {getTeaLevelBadge(childProfile.nin_nivd)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Brain className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                  Perfil Sensorial Principal
                                </p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 mt-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg font-medium text-sm">
                                  <Brain className="w-4 h-4" />
                                  {childProfile.perfil_sensorial ||
                                    "Sensorial Mixto"}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Stethoscope className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                  Especialista Asignado
                                </p>
                                <p className="text-md text-gray-800 dark:text-gray-200 mt-1 flex items-center gap-2">
                                  <User className="w-4 h-4 text-brand-500" />
                                  {childProfile.especialista || "No asignado"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Building2 className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
                              <div>
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                  Institución
                                </p>
                                <p className="text-md text-gray-800 dark:text-gray-200 mt-1">
                                  {childProfile.institucion?.ins_nomb ||
                                    "No registrada"}
                                </p>
                                {childProfile.institucion?.ins_telf && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                                    <Phone className="w-3.5 h-3.5" />
                                    {childProfile.institucion.ins_telf}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="px-6 md:px-8 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 flex justify-end">
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Cualquier modificación debe ser solicitada al especialista
                      médico.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "alertas" && (
              <div className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-10">
                <AlertCenter />
              </div>
            )}
            {activeTab === "indicaciones" && (
              <div className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-10">
                <Indicaciones />
              </div>
            )}

            {/* Bitacora tab is removed - handled by DiarioHogar component */}
          </div>
        </div>
      </main>
    </div>
  );
}
