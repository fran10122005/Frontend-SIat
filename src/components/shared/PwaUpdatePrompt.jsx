import React from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Sparkles, RefreshCw, X } from "lucide-react";

export default function PwaUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        console.log("Service Worker registrado correctamente.");
      }
    },
    onRegisterError(error) {
      console.error("Error registrando Service Worker:", error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[160] bg-slate-900/95 border border-blue-500/40 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col gap-3 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shrink-0 text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              Nueva versión disponible
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              Hay mejoras listas para SIAT. ¿Deseas actualizar ahora o continuar
              con tu sesión clínica?
            </p>
          </div>
        </div>
        <button
          onClick={() => setNeedRefresh(false)}
          className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
          aria-label="Cerrar aviso"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
        <button
          onClick={() => setNeedRefresh(false)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white rounded-lg transition-colors"
        >
          Después
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Actualizar
        </button>
      </div>
    </div>
  );
}
