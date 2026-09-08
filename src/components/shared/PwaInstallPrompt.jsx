import React, { useState, useEffect } from "react";
import { Download, Smartphone, X, Sparkles } from "lucide-react";

export default function PwaInstallPrompt({ variant = "topbar" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Si ya está ejecutándose como app instalada (standalone), no mostrar el botón
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone;
    if (isStandalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  if (!isInstallable || isDismissed) return null;

  // Botón compacto para Topbar
  if (variant === "topbar") {
    return (
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 dark:text-blue-400 bg-brand-50 hover:bg-brand-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-brand-200 dark:border-blue-800/60 rounded-full transition-all duration-200 shadow-sm active:scale-95 group"
        title="Instalar SIAT como aplicación en tu dispositivo"
      >
        <Smartphone className="w-3.5 h-3.5 text-brand-600 dark:text-blue-400 group-hover:bounce" />
        <span className="hidden sm:inline">Instalar App</span>
        <Download className="w-3 h-3 ml-0.5 opacity-70" />
      </button>
    );
  }

  // Banner flotante para pantalla principal / móvil
  return (
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
            Acceso directo y mejor rendimiento en tu pantalla de inicio.
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
  );
}
