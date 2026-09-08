import React, { useState, useEffect } from "react";
import {
  Download,
  Smartphone,
  X,
  Sparkles,
  Share,
  PlusSquare,
  Monitor,
  CheckCircle,
} from "lucide-react";

export default function PwaInstallPrompt({ variant = "topbar" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    const isStandaloneDisplay =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      window.matchMedia("(display-mode: minimal-ui)").matches ||
      !!window.navigator.standalone ||
      (typeof document !== "undefined" &&
        document.referrer.includes("android-app://"));
    const isInstalledStorage =
      localStorage.getItem("siat_pwa_installed") === "true";
    return isStandaloneDisplay || isInstalledStorage;
  });
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    async function checkInstallation() {
      // 1. Verificar si corre en modo ventana propia (standalone / fullscreen / minimal-ui)
      const isStandaloneMode =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.matchMedia("(display-mode: minimal-ui)").matches ||
        window.navigator.standalone ||
        document.referrer.includes("android-app://");

      if (isStandaloneMode) {
        setIsStandalone(true);
        localStorage.setItem("siat_pwa_installed", "true");
        return;
      }

      // 2. Verificar marca persistente en localStorage de instalación previa
      if (localStorage.getItem("siat_pwa_installed") === "true") {
        setIsStandalone(true);
        return;
      }

      // 3. API nativa del navegador para consultar si la App está instalada en el SO
      if ("getInstalledRelatedApps" in navigator) {
        try {
          const relatedApps = await navigator.getInstalledRelatedApps();
          if (relatedApps && relatedApps.length > 0) {
            setIsStandalone(true);
            localStorage.setItem("siat_pwa_installed", "true");
            return;
          }
        } catch (err) {
          // Ignorar si el navegador restringe el permiso
        }
      }
    }

    checkInstallation();

    // Detectar si es dispositivo iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsStandalone(true);
      localStorage.setItem("siat_pwa_installed", "true");
      setDeferredPrompt(null);
    };

    // Listener para cambios de modo de pantalla en tiempo real
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const handleMediaChange = (e) => {
      if (e.matches) {
        setIsStandalone(true);
        localStorage.setItem("siat_pwa_installed", "true");
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMediaChange);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      }
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const markAsInstalled = () => {
    setIsStandalone(true);
    localStorage.setItem("siat_pwa_installed", "true");
    localStorage.setItem("siat_pwa_dismissed", "true");
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        markAsInstalled();
      }
      setDeferredPrompt(null);
    } else {
      // Si no hay evento nativo disponible (iOS o Chrome ya ofreció), mostrar instrucciones
      setShowInstructionsModal(true);
    }
  };

  const isInstalledOrDismissed =
    isStandalone ||
    localStorage.getItem("siat_pwa_installed") === "true" ||
    localStorage.getItem("siat_pwa_dismissed") === "true";

  // Si ya está instalada como app o el usuario la marcó como instalada/descartada, no mostrar absolutamente nada
  if (isInstalledOrDismissed) return null;

  // En la barra superior (topbar): no mostrar el botón si no hay un prompt de instalación pendiente y no es iOS
  if (variant === "topbar" && !deferredPrompt && !isIOS) return null;

  return (
    <>
      {/* Botón Topbar */}
      {variant === "topbar" && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:text-blue-400 bg-brand-50 hover:bg-brand-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-brand-200 dark:border-blue-800/60 rounded-full transition-all duration-200 shadow-sm active:scale-95 group"
          title="Instalar SIAT como aplicación en tu dispositivo"
        >
          <Smartphone className="w-3.5 h-3.5 text-brand-600 dark:text-blue-400 group-hover:bounce" />
          <span className="hidden sm:inline">Instalar App</span>
          <Download className="w-3 h-3 ml-0.5 opacity-70" />
        </button>
      )}

      {/* Banner flotante en pantalla principal */}
      {(variant === "floating" || variant === "banner") && !isDismissed && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100%-2rem)] bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-2xl border border-brand-200 dark:border-blue-900/40 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center text-white shrink-0 shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                Instalar App SIAT
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Acceso directo y mejor rendimiento en tu pantalla.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-brand-700 hover:bg-brand-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              aria-label="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal Guiado de Instalación */}
      {showInstructionsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            <button
              onClick={() => setShowInstructionsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Instalar SIAT en tu dispositivo
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sigue estos sencillos pasos según tu navegador:
                </p>
              </div>
            </div>

            {isIOS ? (
              <div className="space-y-3 my-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <h4 className="text-xs font-bold text-brand-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Share className="w-4 h-4" /> Para iPhone / iPad (Safari):
                </h4>
                <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal pl-4">
                  <li>
                    Presiona el botón <strong>Compartir</strong>{" "}
                    <Share className="w-3.5 h-3.5 inline text-blue-500" /> en la
                    parte inferior de Safari.
                  </li>
                  <li>
                    Desplázate hacia abajo y selecciona{" "}
                    <strong>"Agregar a inicio"</strong>{" "}
                    <PlusSquare className="w-3.5 h-3.5 inline text-slate-600 dark:text-slate-300" />
                    .
                  </li>
                  <li>
                    Presiona <strong>"Agregar"</strong> en la esquina superior
                    derecha.
                  </li>
                </ol>
              </div>
            ) : (
              <div className="space-y-3 my-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <h4 className="text-xs font-bold text-brand-600 dark:text-blue-400 flex items-center gap-1.5">
                  <Monitor className="w-4 h-4" /> Para Chrome / Edge / Android:
                </h4>
                <ol className="text-xs text-slate-700 dark:text-slate-300 space-y-2 list-decimal pl-4">
                  <li>
                    En la barra de dirección arriba 👆, busca el ícono de
                    instalación{" "}
                    <Download className="w-3.5 h-3.5 inline text-brand-600 dark:text-blue-400" />{" "}
                    (pantalla con flecha).
                  </li>
                  <li>
                    O abre el <strong>Menú (3 puntos ⋮)</strong> arriba a la
                    derecha.
                  </li>
                  <li>
                    Selecciona <strong>"Instalar SIAT"</strong> o{" "}
                    <strong>"Agregar a la pantalla principal"</strong>.
                  </li>
                </ol>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  markAsInstalled();
                  setShowInstructionsModal(false);
                }}
                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
              >
                Ya la tengo instalada / No volver a mostrar
              </button>
              <button
                onClick={() => {
                  markAsInstalled();
                  setShowInstructionsModal(false);
                }}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
