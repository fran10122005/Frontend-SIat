import React from "react";
import { useSmartwatch } from "../../context/SmartwatchContext";
import { useGlobalContext } from "../../context/GlobalState";
import { getValidSession } from "../../utils/authStorage";
import { Activity, AlertTriangle, Square, Clock } from "lucide-react";

export default function SimulationBanner() {
  const {
    isSimulating,
    simulationMode,
    simulationRemainingSec,
    stopSimulation,
    liveBpm,
    deviceName,
  } = useSmartwatch();

  const { userRole, nomNino, unregisterConnectedDevice } = useGlobalContext();

  const session = getValidSession();
  const effectiveRole = session.role || userRole;
  const isClinical =
    effectiveRole === "ESPECIALISTA" || effectiveRole === "REPRESENTANTE";

  if (!isSimulating || !session.isValid || !isClinical) {
    return null;
  }

  const isCrisis = simulationMode === "crisis";
  const remaining = Math.max(0, Number(simulationRemainingSec) || 0);
  const mins = String(Math.floor(remaining / 60)).padStart(2, "0");
  const secs = String(remaining % 60).padStart(2, "0");

  const handleStop = () => {
    if (typeof unregisterConnectedDevice === "function") {
      unregisterConnectedDevice(deviceName);
    }
    if (typeof stopSimulation === "function") {
      stopSimulation();
    }
  };

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-label="Simulación de pulso activa"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[140] max-w-[calc(100vw-2rem)]"
    >
      <div
        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl shadow-2xl border backdrop-blur-md text-xs transition-all animate-in slide-in-from-bottom-4 duration-300 ${
          isCrisis
            ? "bg-rose-950/95 text-rose-50 border-rose-500/60 shadow-rose-950/40"
            : "bg-slate-900/95 text-slate-100 border-emerald-500/50 shadow-black/30"
        }`}
      >
        <span
          className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 ${
            isCrisis
              ? "bg-rose-500/20 text-rose-300"
              : "bg-emerald-500/20 text-emerald-300"
          }`}
        >
          {isCrisis ? (
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          ) : (
            <Activity className="w-4 h-4 animate-pulse" />
          )}
        </span>

        <div className="min-w-0">
          <div className="flex items-center gap-2 font-bold leading-tight">
            <span className="truncate">
              {isCrisis ? "Simulación Crisis" : "Simulación Pulso"}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                isCrisis
                  ? "bg-rose-500/25 text-rose-200"
                  : "bg-emerald-500/20 text-emerald-200"
              }`}
            >
              {liveBpm ? `${liveBpm} BPM` : "Activo"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] opacity-80 mt-0.5">
            {nomNino && (
              <span className="truncate max-w-[130px]">{nomNino}</span>
            )}
            <span className="inline-flex items-center gap-1 font-mono shrink-0">
              <Clock className="w-3 h-3" />
              {mins}:{secs}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleStop}
          aria-label="Detener simulación"
          className={`ml-1 flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors shrink-0 cursor-pointer ${
            isCrisis
              ? "bg-rose-500 hover:bg-rose-400 text-white"
              : "bg-emerald-600 hover:bg-emerald-500 text-white"
          }`}
        >
          <Square className="w-3 h-3 fill-current" />
          <span>Detener</span>
        </button>
      </div>
    </aside>
  );
}
