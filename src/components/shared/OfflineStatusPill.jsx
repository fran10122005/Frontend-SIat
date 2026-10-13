import React from "react";
import { useGlobalContext } from "../../context/GlobalState";
import { WifiOff, ServerCrash, CloudOff, RefreshCw } from "lucide-react";

export default function OfflineStatusPill() {
  const { isOnline, networkStatus, isReconnecting, checkConnectivity } =
    useGlobalContext();

  if (isOnline) return null;

  const isNetworkLoss = networkStatus === "offline_network";

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Estado de conectividad"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[150] max-w-[92vw] sm:max-w-md w-auto"
    >
      <div className="flex items-center gap-2.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-md border border-amber-500/50 shadow-lg shadow-black/20 text-xs animate-in slide-in-from-top-3 duration-300">
        {/* Icono de estado */}
        <div className="shrink-0 flex items-center justify-center">
          {isNetworkLoss ? (
            <WifiOff className="w-4 h-4 text-rose-400" />
          ) : (
            <ServerCrash className="w-4 h-4 text-amber-400" />
          )}
        </div>

        {/* Texto descriptivo */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-semibold text-slate-100 truncate">
            {isNetworkLoss
              ? "Sin conexión a Internet"
              : "Servidor reconectando..."}
          </span>
          <span className="hidden sm:inline text-slate-400 font-normal">
            {isNetworkLoss ? "— Revisa tu red" : "— Modo local activo"}
          </span>
        </div>

        {/* Botón interactivo de reintento */}
        <button
          type="button"
          onClick={() => checkConnectivity && checkConnectivity(true)}
          disabled={isReconnecting}
          className="ml-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-amber-100 font-medium transition-colors border border-amber-500/30 disabled:opacity-50 cursor-pointer shrink-0"
          title="Verificar conexión con el servidor ahora"
        >
          <RefreshCw
            className={`w-3 h-3 ${isReconnecting ? "animate-spin text-amber-400" : ""}`}
          />
          <span>{isReconnecting ? "Comprobando..." : "Reintentar"}</span>
        </button>
      </div>
    </aside>
  );
}
