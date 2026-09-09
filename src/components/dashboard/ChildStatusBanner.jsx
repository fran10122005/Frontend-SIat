import { Heart, Activity, Wifi, WifiOff, Battery } from "lucide-react";
import { useSmartwatch } from "../../context/SmartwatchContext";

export default function ChildStatusBanner({
  liveBpm,
  liveStress,
  liveMov,
  isWebSocketActive,
  nomNino,
  genero = "masculino",
}) {
  const { isConnected, batteryLevel } = useSmartwatch();
  const pulseDuration = liveBpm ? `${60 / liveBpm}s` : "1.2s";
  const esFemenino = genero === "femenino";

  const isTransmitting = (isConnected || isWebSocketActive) && liveBpm !== null;
  const isWaitingSensor =
    (isConnected || isWebSocketActive) && liveBpm === null;

  let estado = "Sin telemetría activa";
  let statusLabel = "Desconectado";
  let colorClase = "from-slate-700 to-slate-800 shadow-slate-800/20";
  let dotColor = "bg-slate-400 text-slate-400";
  let mensaje =
    "No hay un smartwatch transmitiendo datos biométricos en este momento.";

  if (isTransmitting) {
    const stress = liveStress !== null ? liveStress : 0;
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
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-base font-bold leading-tight">
                {nomNino
                  ? `${nomNino} — ${estado}`
                  : "No hay paciente asignado"}
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                {statusLabel}
              </span>
            </div>
            <p className="text-xs text-white/75 max-w-md">{mensaje}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10">
            {isConnected || isWebSocketActive ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-300" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-slate-300" />
            )}
            <span className="text-[11px] font-semibold">
              {isConnected || isWebSocketActive ? "Conectada" : "Desconectada"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10">
            <Heart
              className={`w-3.5 h-3.5 ${liveBpm !== null ? "text-rose-300 animate-pulse" : "text-slate-300"}`}
              style={liveBpm ? { animationDuration: pulseDuration } : undefined}
            />
            <span className="text-[11px] font-semibold">
              {liveBpm !== null ? `${liveBpm} BPM` : "-- BPM"}
            </span>
          </div>
        </div>
      </div>

      <div className="relative mt-2 flex gap-3">
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
        <span className="text-[10px] text-white/40 ml-auto">
          {new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
