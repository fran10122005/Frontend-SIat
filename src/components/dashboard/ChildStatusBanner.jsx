import { Heart, Activity, Wifi, WifiOff, Battery } from "lucide-react";

export default function ChildStatusBanner({
  liveBpm,
  liveStress,
  liveMov,
  isWebSocketActive,
  nomNino,
  genero = "masculino",
}) {
  const pulseDuration = liveBpm ? `${60 / liveBpm}s` : "0.8s";
  const esFemenino = genero === "femenino";

  const estado =
    liveStress <= 50
      ? esFemenino
        ? "tranquila"
        : "tranquilo"
      : liveStress <= 75
        ? esFemenino
          ? "inquieta"
          : "inquieto"
        : "en crisis";
  const colorClase =
    liveStress <= 50
      ? "from-emerald-600 to-emerald-700 shadow-emerald-600/20"
      : liveStress <= 75
        ? "from-amber-600 to-amber-700 shadow-amber-600/20"
        : "from-rose-600 to-rose-700 shadow-rose-600/20";
  const dotColor =
    liveStress <= 50
      ? "bg-emerald-400 text-emerald-400"
      : liveStress <= 75
        ? "bg-amber-400 text-amber-400"
        : "bg-rose-400 text-rose-400";
  const statusLabel =
    liveStress <= 50 ? "Estable" : liveStress <= 75 ? "Alerta" : "Crítico";
  const mensaje =
    liveStress <= 50
      ? `No se detectan alertas. Tu${esFemenino ? " hija" : " hijo"} está receptiv${esFemenino ? "a" : "o"} y en calma.`
      : liveStress <= 75
        ? "Se detectan signos de inquietud. Monitorea su entorno."
        : "¡Sobrecarga sensorial detectada! Activa el protocolo SOS.";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClase} p-6 text-white shadow-lg`}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm">
            <div className={`status-dot ${dotColor}`}></div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-lg font-bold leading-tight">
                {nomNino
                  ? `${nomNino} — ${estado}`
                  : "No hay paciente asignado"}
              </h2>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-white/75 max-w-md">{mensaje}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
            {isWebSocketActive ? (
              <Wifi className="w-4 h-4 text-emerald-300" />
            ) : (
              <WifiOff className="w-4 h-4 text-rose-300" />
            )}
            <span className="text-xs font-semibold">
              {isWebSocketActive ? "Conectada" : "Desconectada"}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
            <Heart
              className="w-4 h-4 text-rose-300"
              style={{ animationDuration: pulseDuration }}
            />
            <span className="text-xs font-semibold">{liveBpm} BPM</span>
          </div>
        </div>
      </div>

      <div className="relative mt-3 flex gap-3">
        <div className="flex items-center gap-1.5 text-[10px] text-white/50">
          <Activity className="w-3 h-3" /> Mov: {liveMov}G
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-white/50">
          <Battery className="w-3 h-3" /> 85%
        </div>
        <span className="text-[10px] text-white/35 ml-auto">
          {new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
