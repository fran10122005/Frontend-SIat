import { Heart, Activity, Wifi, WifiOff, Battery, Watch } from "lucide-react";
import { useSmartwatch } from "../../context/SmartwatchContext";
import { useGlobalContext } from "../../context/GlobalState";

export default function ChildStatusBanner({
  liveBpm,
  liveStress,
  liveMov,
  isWebSocketActive,
  nomNino,
  genero = "masculino",
}) {
  const {
    isConnected,
    batteryLevel,
    telemetrySource,
    lastReadingTimestamp,
    telemetryHistory,
  } = useSmartwatch();
  const { navigate } = useGlobalContext();

  // Obtener lectura en vivo o la más reciente del historial
  const latestTelemetry =
    telemetryHistory && telemetryHistory.length > 0
      ? telemetryHistory[telemetryHistory.length - 1]
      : null;

  const activeBpm =
    liveBpm !== null && liveBpm !== undefined
      ? liveBpm
      : (latestTelemetry?.bpm ?? null);

  const activeStress =
    liveStress !== null && liveStress !== undefined
      ? liveStress
      : (latestTelemetry?.stress ?? null);

  const activeMov =
    liveMov !== null && liveMov !== undefined
      ? liveMov
      : (latestTelemetry?.mov ?? null);

  const pulseDuration = activeBpm ? `${60 / activeBpm}s` : "1.2s";
  const esFemenino = genero === "femenino";

  const isTransmitting = activeBpm !== null && activeBpm > 0;
  const isWaitingSensor = isConnected && activeBpm === null;
  const isBleDirect = telemetrySource === "BLE_DIRECT";
  const isHealthConnect = telemetrySource === "HEALTH_CONNECT";

  let estado = "Sin telemetría activa";
  let statusLabel = "Desconectado";
  let colorClase = "from-slate-700 to-slate-800 shadow-slate-800/20";
  let dotColor = "bg-slate-400 text-slate-400";
  let mensaje =
    "No hay un smartwatch transmitiendo datos biométricos en este momento.";

  if (isTransmitting) {
    const stress = activeStress !== null ? activeStress : 0;
    if (stress <= 50) {
      estado = esFemenino ? "tranquila" : "tranquilo";
      statusLabel = "Estable";
      colorClase = "from-emerald-600 to-emerald-700 shadow-emerald-600/20";
      dotColor = "bg-emerald-400 text-emerald-400";
      mensaje = `No se detectan alertas. Tu${esFemenino ? " hija" : " hijo"} está receptiv${esFemenino ? "a" : "o"} y en calma.`;
    } else if (stress <= 75) {
      estado = esFemenino ? "inquieta" : "inquieto";
      statusLabel = "Alerta";
      colorClase = "from-amber-600 to-amber-700 shadow-amber-600/20";
      dotColor = "bg-amber-400 text-amber-400";
      mensaje =
        "Se detectan signos de inquietud o incremento del pulso. Monitorea su entorno.";
    } else {
      estado = "en crisis";
      statusLabel = "Crítico";
      colorClase = "from-rose-600 to-rose-700 shadow-rose-600/20";
      dotColor = "bg-rose-400 text-rose-400";
      mensaje = "¡Sobrecarga sensorial detectada! Activa el protocolo SOS.";
    }
  } else if (isWaitingSensor) {
    estado = "esperando lectura";
    statusLabel = "En Espera";
    colorClase = "from-blue-600 to-blue-700 shadow-blue-600/20";
    dotColor = "bg-blue-400 text-blue-400";
    mensaje =
      "Smartwatch vinculado. Esperando que el sensor óptico detecte el pulso en contacto con la piel.";
  }

  const formattedLastSync = lastReadingTimestamp
    ? new Date(lastReadingTimestamp).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${colorClase} p-4 text-white shadow-md transition-all duration-300`}
    >
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/15">
            <div className={`status-dot ${dotColor}`}></div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <h2 className="text-base font-bold leading-tight">
                {nomNino
                  ? `${nomNino} — ${estado}`
                  : "No hay paciente asignado"}
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                {statusLabel}
              </span>
              {/* Badge distintivo del canal activo de telemetría */}
              {isTransmitting && (
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    isBleDirect
                      ? "bg-emerald-400/20 border-emerald-300/40 text-emerald-200"
                      : isHealthConnect
                        ? "bg-sky-400/20 border-sky-300/40 text-sky-200"
                        : "bg-white/20 border-white/30 text-white"
                  }`}
                >
                  {isBleDirect
                    ? "Tiempo Real (BLE)"
                    : isHealthConnect
                      ? "Sincronización (Health Connect)"
                      : "Telemetría Nube"}
                </span>
              )}
            </div>
            <p className="text-xs text-white/75 max-w-md">{mensaje}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10">
            {isBleDirect ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                <span className="text-[11px] font-semibold">
                  BLE Directo (1s)
                </span>
              </>
            ) : isHealthConnect ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-sky-300" />
                <span className="text-[11px] font-semibold">
                  Health Connect
                </span>
              </>
            ) : isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-[11px] font-semibold">
                  Smartwatch Conectado
                </span>
              </>
            ) : isTransmitting ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-[11px] font-semibold">
                  Telemetría Nube
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-slate-300" />
                <span className="text-[11px] font-semibold">Desconectada</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10">
            <Heart
              className={`w-3.5 h-3.5 ${activeBpm !== null ? "text-rose-300 animate-pulse" : "text-slate-300"}`}
              style={
                activeBpm ? { animationDuration: pulseDuration } : undefined
              }
            />
            <span className="text-[11px] font-semibold">
              {activeBpm !== null ? `${activeBpm} BPM` : "-- BPM"}
            </span>
          </div>

          {!isTransmitting && (
            <button
              onClick={() => navigate("sensores")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer ml-1"
            >
              <Watch className="w-3.5 h-3.5" />
              <span>Vincular Reloj</span>
            </button>
          )}
        </div>
      </div>

      <div className="relative mt-2 flex gap-3 items-center flex-wrap">
        <div className="flex items-center gap-1.5 text-[10px] text-white/60">
          <Activity className="w-3 h-3" /> Mov:{" "}
          {liveMov !== null && liveMov !== undefined ? `${liveMov}G` : "--G"}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-white/60">
          <Battery className="w-3 h-3" />{" "}
          {batteryLevel !== null && batteryLevel !== undefined
            ? `${batteryLevel}%`
            : "--%"}
        </div>
        <span className="text-[10px] text-white/50 ml-auto">
          {formattedLastSync
            ? `Última lectura: ${formattedLastSync}`
            : new Date().toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
              })}
        </span>
      </div>
    </div>
  );
}
