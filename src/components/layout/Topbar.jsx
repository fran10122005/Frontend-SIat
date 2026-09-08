import React, { useState } from "react";
import { useGlobalContext } from "../../context/GlobalState";
import { useTourContext } from "../../context/TourContext";
import { Sun, Moon, Menu, HelpCircle, Baby } from "lucide-react";
import NotificationBell from "./NotificationBell";
import PwaInstallPrompt from "../shared/PwaInstallPrompt";

export default function Topbar() {
  const {
    userRole,
    userName,
    userFoto,
    currentView,
    setCurrentView,
    isSidebarOpen,
    setIsSidebarOpen,
    isDark,
    toggleTheme,
    listaNinos,
    selectedChildId,
    setSelectedChildId,
  } = useGlobalContext();
  const { startContextualTour } = useTourContext();
  const [fotoError, setFotoError] = useState(false);

  const initials = userName
    ? userName
        .replace("Dra. ", "")
        .replace("Dr. ", "")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : userRole === "ESPECIALISTA"
      ? "ES"
      : userRole === "ADMIN_INSTITUCION"
        ? "AD"
        : "US";

  const showPhoto = !!userFoto && !fotoError;

  const handleStartTour = () => {
    startContextualTour(userRole, currentView);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-[#0F172A]/80 px-4 sm:px-6 pt-[env(safe-area-inset-top)] backdrop-blur-md transition-colors duration-200">
        {/* Botón menú hamburguesa en móvil */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="flex lg:hidden p-2.5 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors min-h-[44px] min-w-[44px] items-center justify-center"
          aria-label="Abrir Menú"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>

        {/* Breadcrumb e Indicador/Selector de Niño */}
        <div className="hidden sm:flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span>SIAT</span>
            <span className="text-slate-300 dark:text-slate-700">/</span>
            <span className="text-slate-600 dark:text-slate-300">
              {userRole === "ADMIN_INSTITUCION" || userRole === "ROL_ADM"
                ? "Gestión de Fundación"
                : "Monitoreo Clínico"}
            </span>
          </div>

          {listaNinos && listaNinos.length > 1 && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700">
              {listaNinos.map((child) => {
                const isActive =
                  selectedChildId === child.id_ninos ||
                  selectedChildId === child.nin_codi;
                return (
                  <button
                    key={child.id_ninos || child.nin_codi}
                    type="button"
                    onClick={() =>
                      setSelectedChildId(child.id_ninos || child.nin_codi)
                    }
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60"
                    }`}
                    title={`Cambiar expediente a ${child.nom_nino}`}
                  >
                    <Baby className="w-3.5 h-3.5" />
                    <span>{child.nom_nino}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Contenedor derecho de acciones */}
        <div className="flex items-center gap-3 ml-auto">
          <PwaInstallPrompt variant="topbar" />
          <NotificationBell />
          <button
            onClick={handleStartTour}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            title="Ver Tutorial"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Toggle Dark Mode"
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          <div
            onClick={() => setCurrentView("profile")}
            className="flex items-center gap-3 cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors pl-4 border-l border-slate-200 dark:border-slate-700"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {userName ||
                  (userRole === "ESPECIALISTA"
                    ? "Especialista"
                    : userRole === "ADMIN_INSTITUCION" || userRole === "ROL_ADM"
                      ? "Administrador"
                      : "Representante")}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {userRole === "ESPECIALISTA"
                  ? "Staff Clínico"
                  : userRole === "ADMIN_INSTITUCION" || userRole === "ROL_ADM"
                    ? "Administración"
                    : "Representante Legal"}
              </span>
            </div>
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm ring-2 ring-white dark:ring-slate-800 overflow-hidden ${userRole === "ESPECIALISTA" ? "bg-indigo-600" : userRole === "ADMIN_INSTITUCION" ? "bg-slate-700" : "bg-blue-600"}`}
            >
              {showPhoto ? (
                <img
                  src={userFoto}
                  alt="Foto de perfil"
                  className="h-full w-full object-cover"
                  onError={() => setFotoError(true)}
                />
              ) : (
                initials
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
