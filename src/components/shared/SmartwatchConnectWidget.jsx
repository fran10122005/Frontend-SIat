import { useState, useEffect } from "react";
import { useSmartwatch } from "../../context/SmartwatchContext";
import { useGlobalContext } from "../../context/GlobalState";
import {
  Watch,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Heart,
  Battery,
  AlertCircle,
  RefreshCw,
  HelpCircle,
  Smartphone,
  CheckCircle2,
  Info,
  X,
  Radio,
  Zap,
  ChevronDown,
  ChevronUp,
  Activity,
  Cpu,
  Terminal,
  FlaskConical,
  Clock,
  Settings2,
  Sliders,
} from "lucide-react";

// Formateador amigable de hora relativa para padres (ej: "Hace 3 min")
function formatSampleTime(isoString) {
  if (!isoString) return "--";
  try {
    const date = new Date(isoString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / (60 * 1000)));
    const timeClock = date.toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (diffMins === 0) return `Hace instantes (${timeClock})`;
    if (diffMins === 1) return `Hace 1 min (${timeClock})`;
    if (diffMins < 60) return `Hace ${diffMins} min (${timeClock})`;
    return timeClock;
  } catch {
    return "--";
  }
}

export default function SmartwatchConnectWidget({ embedded = false }) {
  const {
    isSupported,
    isConnected,
    isConnecting,
    connectionStage,
    sensorStatus,
    deviceName,
    connectedDeviceId,
    batteryLevel,
    lastBpm,
    rawPacketsHistory,
    subscribedChars,
    triggerSensorActivation,
    errorMsg,
    streamToCloud,
    setStreamToCloud,
    connectBluetoothDevice,
    disconnectSmartwatch,
    telemetrySource,
    healthConnectAvailable,
    healthConnectAuthorized,
    healthConnectPolling,
    requestHealthConnectPermissions,
    startHealthConnectPolling,
    stopHealthConnectPolling,
    fetchHealthConnectHeartRate,
    openHealthConnectSettings,
    simulateHealthConnectBatch,
  } = useSmartwatch();

  const { registerConnectedDevice } = useGlobalContext();

  // Estados locales UI
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState("pc");
  const [activeFaq, setActiveFaq] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedTab, setAdvancedTab] = useState("health_connect"); // 'health_connect' | 'diagnostics'
  const [isActivating, setIsActivating] = useState(false);
  const [isSyncingHc, setIsSyncingHc] = useState(false);
  const [syncBatchInfo, setSyncBatchInfo] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);

  // Auto-registrar dispositivo conectado en GlobalContext
  useEffect(() => {
    if (
      isConnected &&
      deviceName &&
      typeof registerConnectedDevice === "function"
    ) {
      registerConnectedDevice({
        name: deviceName,
        batteryLevel: batteryLevel || 100,
      });
    }
  }, [isConnected, deviceName, batteryLevel, registerConnectedDevice]);

  // Escuchar estado de sincronización offline con IndexedDB
  useEffect(() => {
    const handleSyncStatus = (e) => {
      if (e.detail) setSyncStatus(e.detail);
    };
    window.addEventListener("siat:telemetry-sync-status", handleSyncStatus);
    return () => {
      window.removeEventListener(
        "siat:telemetry-sync-status",
        handleSyncStatus,
      );
    };
  }, []);

  const handleConnect = async () => {
    try {
      await connectBluetoothDevice();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerSensor = async () => {
    setIsActivating(true);
    try {
      if (typeof triggerSensorActivation === "function") {
        await triggerSensorActivation();
      }
    } catch (e) {
      console.warn("Error activando sensor:", e);
    } finally {
      setTimeout(() => setIsActivating(false), 1200);
    }
  };

  const handleManualHealthConnectSync = async () => {
    setIsSyncingHc(true);
    setSyncBatchInfo({ status: "syncing" });
    try {
      const res = await fetchHealthConnectHeartRate(30);
      const newCount = res?.newReadings?.length || 0;
      const last = res?.lastSample;
      if (newCount > 0 && last) {
        setSyncBatchInfo({
          status: "success",
          newCount,
          lastBpm: last.bpm,
          sampleTime: formatSampleTime(last.timestamp),
          sourceName: last.sourceName || "Health Connect (Smartwatch)",
        });
      } else if (res?.totalSamplesFound > 0 && last) {
        setSyncBatchInfo({
          status: "success",
          newCount: 0,
          lastBpm: last.bpm,
          sampleTime: formatSampleTime(last.timestamp),
          sourceName: last.sourceName || "Health Connect (Smartwatch)",
          alreadySynced: true,
        });
      } else {
        setSyncBatchInfo({ status: "empty", newCount: 0 });
      }
    } catch (e) {
      setSyncBatchInfo({
        status: "error",
        error: e.message || "Error al sincronizar con Health Connect.",
      });
    } finally {
      setTimeout(() => setIsSyncingHc(false), 600);
    }
  };

  const handleSimulateHealthConnect = () => {
    setIsSyncingHc(true);
    setSyncBatchInfo({ status: "syncing" });
    setTimeout(() => {
      try {
        const res = simulateHealthConnectBatch(
          [78, 85, 92],
          "Samsung Galaxy Watch (Simulado)",
        );
        setSyncBatchInfo({
          status: "success",
          newCount: res.newReadings.length,
          lastBpm: res.lastSample.bpm,
          sampleTime: formatSampleTime(res.lastSample.timestamp),
          sourceName: "Samsung Galaxy Watch (Simulado)",
          isSimulated: true,
        });
      } catch (e) {
        setSyncBatchInfo({
          status: "error",
          error: e.message || "Error en la simulación.",
        });
      } finally {
        setIsSyncingHc(false);
      }
    }, 450);
  };

  const isBleActive = telemetrySource === "BLE_DIRECT" || isConnected;
  const isHcActive = telemetrySource === "HEALTH_CONNECT";
  const isDeviceActive = isBleActive || isHcActive;

  // Mensaje amigable de etapa de conexión
  const getConnectingLabel = () => {
    if (connectionStage === "connecting_gatt")
      return "Estableciendo conexión con el reloj...";
    if (connectionStage === "discovering_services")
      return "Verificando canales de pulso...";
    if (connectionStage === "activating_sensor")
      return "Iniciando sensor óptico...";
    return "Buscando reloj cercano...";
  };

  return (
    <>
      <div
        className={`rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden ${
          isDeviceActive
            ? "bg-gradient-to-r from-emerald-500/[0.04] via-blue-500/[0.03] to-transparent border-emerald-500/30 dark:border-emerald-500/20"
            : isConnecting
              ? "bg-amber-500/[0.03] border-amber-500/30 dark:border-amber-500/20"
              : "bg-white dark:bg-[#1E293B] border-slate-200/80 dark:border-slate-800"
        }`}
      >
        {/* ============================================================== */}
        {/* CABECERA PRINCIPAL: LIMPIA, COMPACTA Y CLARA                   */}
        {/* ============================================================== */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Ícono dinámico */}
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                isDeviceActive
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-4 ring-emerald-500/10"
                  : isConnecting
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-4 ring-amber-500/10 animate-pulse"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {isDeviceActive ? (
                <Watch className="w-5 h-5 animate-pulse" />
              ) : isConnecting ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Bluetooth className="w-5 h-5" />
              )}
            </div>

            {/* Identidad del dispositivo & Estado */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {isDeviceActive
                    ? deviceName || "Smartwatch Vinculado"
                    : "Reloj Inteligente del Paciente"}
                </h4>

                {/* Badge de Estado Simple y Humano */}
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                    isDeviceActive
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : isConnecting
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isDeviceActive
                        ? "bg-emerald-500 animate-pulse"
                        : isConnecting
                          ? "bg-amber-500 animate-ping"
                          : "bg-slate-400"
                    }`}
                  />
                  {isDeviceActive
                    ? isBleActive
                      ? "En Línea (Tiempo Real)"
                      : "Sincronizado"
                    : isConnecting
                      ? "Conectando..."
                      : "Sin Vincular"}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {isDeviceActive
                  ? lastBpm
                    ? `Monitoreando constantes vitales en vivo (${lastBpm} BPM)`
                    : "Esperando contacto del sensor con la muñeca..."
                  : isConnecting
                    ? getConnectingLabel()
                    : "Sincroniza el smartwatch para detectar estados de alteración y sobrecarga sensorial."}
              </p>
            </div>
          </div>

          {/* Acciones principales de la cabecera */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Nivel de Batería (si está conectado) */}
            {isDeviceActive && batteryLevel !== null && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-sm">
                <Battery className="w-3.5 h-3.5 text-emerald-500" />
                <span>{batteryLevel}%</span>
              </div>
            )}

            {/* Botón de Guía de Ayuda para Padres */}
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 text-xs font-semibold transition-all flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700 shadow-sm active:scale-95"
              title="Guía rápida para vincular"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Guía de ayuda</span>
            </button>

            {/* Botón de Desconectar (solo si está conectado) */}
            {isDeviceActive && (
              <button
                type="button"
                onClick={disconnectSmartwatch}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <BluetoothOff className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* CUERPO DEL WIDGET: EXPERIENCIA LIMPIA POR ESTADO               */}
        {/* ============================================================== */}
        <div className="px-4 pb-4 sm:px-5 sm:pb-5">
          {/* ESTADO 1: DESCONECTADO (Llamado a la acción claro y elegante) */}
          {!isDeviceActive && !isConnecting && (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  ¿Listo para comenzar la sesión?
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                  Asegúrate de que el reloj esté encendido y colocado en la
                  muñeca del menor.
                </p>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={!isSupported}
                  onClick={handleConnect}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <BluetoothConnected className="w-4 h-4" />
                  <span>Vincular Reloj Bluetooth</span>
                </button>
              </div>
            </div>
          )}

          {/* ESTADO 2: CONECTANDO (Animación relajante y mensaje comprensible) */}
          {isConnecting && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center text-center gap-3 animate-in fade-in">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {getConnectingLabel()}
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Selecciona el nombre de tu reloj en la ventana emergente que
                  abrió tu navegador.
                </p>
              </div>
            </div>
          )}

          {/* ESTADO 3: CONECTADO (Cockpit Clínico Limpio) */}
          {isDeviceActive && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Card 1: Pulso en Vivo */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Ritmo Cardíaco
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                      {lastBpm || "--"}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      BPM
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 flex items-center justify-center text-rose-500 shrink-0">
                  <Heart
                    className={`w-5 h-5 ${lastBpm ? "animate-pulse" : ""}`}
                  />
                </div>
              </div>

              {/* Card 2: Estado del Sensor */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Estado Fisiológico
                  </span>
                  <div className="mt-1">
                    {lastBpm ? (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Lectura Estable
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        Ajustando a la piel...
                      </span>
                    )}
                  </div>
                </div>
                {/* Botón rápido de forzar activación si el sensor está en reposo */}
                <button
                  type="button"
                  onClick={handleTriggerSensor}
                  disabled={isActivating}
                  title="Enviar pulso de activación al sensor"
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-all active:scale-95"
                >
                  <Zap
                    className={`w-3.5 h-3.5 text-amber-500 ${isActivating ? "animate-spin" : ""}`}
                  />
                  <span>{isActivating ? "Enviando..." : "Despertar"}</span>
                </button>
              </div>

              {/* Card 3: Transmisión y Nube */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Telemetría Cloud
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={streamToCloud}
                        onChange={(e) => setStreamToCloud(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>En vivo</span>
                    </label>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-500 shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

          {/* MENSAJE DE ERROR AMIGABLE (SI OCURRE UNO) */}
          {errorMsg && (
            <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-start justify-between gap-2.5 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
                <p className="font-semibold">{errorMsg}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="underline font-bold text-rose-600 dark:text-rose-400 shrink-0 hover:opacity-80"
              >
                Ver solución
              </button>
            </div>
          )}

          {/* ============================================================== */}
          {/* PANEL PLEGABLE: AJUSTES Y HERRAMIENTAS AVANZADAS (TÉCNICO)    */}
          {/* ============================================================== */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors py-1 group"
            >
              <span className="flex items-center gap-1.5 font-medium">
                <Settings2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
                <span>
                  Opciones avanzadas y métodos alternativos (Health Connect /
                  Diagnóstico)
                </span>
              </span>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                <span>{showAdvanced ? "Ocultar" : "Mostrar"}</span>
                {showAdvanced ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </button>

            {/* Contenido Avanzado Plegable */}
            {showAdvanced && (
              <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
                {/* Selector de sub-panel avanzado */}
                <div className="flex p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setAdvancedTab("health_connect")}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      advancedTab === "health_connect"
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Android Health Connect</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAdvancedTab("diagnostics")}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      advancedTab === "diagnostics"
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Diagnóstico BLE & Paquetes</span>
                  </button>
                </div>

                {/* Sub-panel 1: Health Connect */}
                {advancedTab === "health_connect" && (
                  <div className="space-y-3 animate-in fade-in">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Útil para relojes vinculados a sus apps oficiales (Samsung
                      Health, Mi Fitness, Zepp, Da Fit).
                    </p>

                    <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2
                          className={`w-4 h-4 ${healthConnectAuthorized ? "text-emerald-500" : "text-amber-500"}`}
                        />
                        <span>
                          Permisos de lectura:{" "}
                          <strong>
                            {healthConnectAuthorized
                              ? "Autorizado"
                              : "No autorizado"}
                          </strong>
                        </span>
                      </span>

                      {!healthConnectAuthorized ? (
                        <button
                          type="button"
                          onClick={requestHealthConnectPermissions}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                        >
                          Solicitar Permiso
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isSyncingHc}
                            onClick={handleManualHealthConnectSync}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold flex items-center gap-1.5"
                          >
                            <RefreshCw
                              className={`w-3 h-3 ${isSyncingHc ? "animate-spin" : ""}`}
                            />
                            <span>Sincronizar Lote</span>
                          </button>

                          {!healthConnectPolling ? (
                            <button
                              type="button"
                              onClick={() => startHealthConnectPolling(25)}
                              className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold"
                            >
                              Activar Auto (25s)
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={stopHealthConnectPolling}
                              className="px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-800 text-rose-600 text-[11px] font-semibold"
                            >
                              Detener Auto
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Botón de prueba simulada */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] text-slate-500">
                        Pruebas en desarrollo / demostración:
                      </span>
                      <button
                        type="button"
                        onClick={handleSimulateHealthConnect}
                        disabled={isSyncingHc}
                        className="px-3 py-1.5 rounded-lg border border-purple-300 dark:border-purple-800/80 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[11px] font-bold flex items-center gap-1.5"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>Simular Lectura de Prueba</span>
                      </button>
                    </div>

                    {/* Resumen de última sincronización */}
                    {syncBatchInfo?.status === "success" && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                        <span>
                          Último pulso Health Connect:{" "}
                          <strong>{syncBatchInfo.lastBpm} BPM</strong>
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {syncBatchInfo.sampleTime}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-panel 2: Diagnóstico BLE */}
                {advancedTab === "diagnostics" && (
                  <div className="space-y-3 font-mono text-[11px] animate-in fade-in">
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-sans">
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-blue-500" />
                        Dispositivo: <strong>{deviceName || "Ninguno"}</strong>
                      </span>
                      <span>
                        Canales suscritos:{" "}
                        <strong>{subscribedChars.length}</strong>
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 max-h-36 overflow-y-auto space-y-1">
                      {rawPacketsHistory.length === 0 ? (
                        <p className="text-slate-500 text-center py-2 font-sans text-xs">
                          No hay paquetes recientes en el búfer.
                        </p>
                      ) : (
                        rawPacketsHistory.slice(0, 10).map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between gap-2 border-b border-slate-800/50 py-0.5"
                          >
                            <span className="text-slate-500">{p.time}</span>
                            <span className="text-emerald-400 truncate max-w-[180px]">
                              [{p.hex}]
                            </span>
                            {p.parsedBpm && (
                              <span className="text-rose-400 font-bold bg-rose-950/60 px-1 rounded">
                                {p.parsedBpm} BPM
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {syncStatus && (
                      <div className="text-[11px] font-sans text-slate-500 flex items-center justify-between">
                        <span>Persistencia local: IndexedDB</span>
                        <span>
                          Sincronizados: {syncStatus.syncedCount} | En cola:{" "}
                          {syncStatus.remainingUnsynced}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL / GUÍA PASO A PASO PARA PADRES                          */}
      {/* ============================================================== */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Watch className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Guía Rápida de Vinculación
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pasos sencillos para conectar cualquier reloj inteligente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-200">
              {/* Selector de Dispositivo: PC vs Celular */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setGuideTab("pc")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    guideTab === "pc"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Radio className="w-3.5 h-3.5" />
                  Desde Computadora / Laptop
                </button>
                <button
                  type="button"
                  onClick={() => setGuideTab("mobile")}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    guideTab === "mobile"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Desde Teléfono Celular / Tablet
                </button>
              </div>

              {/* 4 Pasos Visuales */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                      {guideTab === "pc"
                        ? "Desconectar del Celular"
                        : "Cerrar App Oficial"}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {guideTab === "pc"
                        ? "Apaga el Bluetooth de tu teléfono temporalmente para que el reloj quede libre y visible para tu computadora."
                        : "Cierra o minimiza la app oficial de tu reloj (Da Fit, Fitpro, etc.) para que no monopolice el sensor."}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                      {guideTab === "pc"
                        ? "Bluetooth Activo"
                        : "Bluetooth y Ubicación"}
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {guideTab === "pc"
                        ? "Verifica que el Bluetooth de tu PC esté encendido y que uses Google Chrome o Microsoft Edge."
                        : "En Android, activa el Bluetooth y la Ubicación/GPS para permitir el escaneo de sensores."}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                      Seleccionar en la Lista
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      En el aviso emergente, elige el nombre de tu reloj o
                      pulsera. Evita las opciones que digan <em>"Audio"</em> o{" "}
                      <em>"Call"</em>.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                      Colocar en la Muñeca
                    </h5>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      El sensor óptico trasero (luz verde) detectará el pulso
                      una vez colocado firmemente en contacto con la piel.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preguntas Frecuentes Desplegables */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  Preguntas Frecuentes
                </h4>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
                  <div className="p-3.5">
                    <button
                      type="button"
                      onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)}
                      className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-white"
                    >
                      <span>
                        ¿Por qué algunos nombres dicen "Dispositivo no
                        compatible"?
                      </span>
                      <span className="text-slate-400 text-sm">
                        {activeFaq === 1 ? "−" : "+"}
                      </span>
                    </button>
                    {activeFaq === 1 && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Los relojes emiten dos señales: una de llamadas/audio
                        (que Chrome descarta) y otra de sensores biológicos
                        (BLE). Debes seleccionar la señal de sensores.
                      </p>
                    )}
                  </div>

                  <div className="p-3.5">
                    <button
                      type="button"
                      onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)}
                      className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-white"
                    >
                      <span>¿Qué marcas y modelos son compatibles?</span>
                      <span className="text-slate-400 text-sm">
                        {activeFaq === 2 ? "−" : "+"}
                      </span>
                    </button>
                    {activeFaq === 2 && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Cualquier reloj o pulsera con sensor óptico BLE:
                        Smartbands económicas (Da Fit, Fitpro, Wearfit,
                        VeryFit), bandas deportivas (Polar, Garmin) y relojes
                        Samsung o Wear OS vía Health Connect.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Cerrar
              </button>
              <button
                type="button"
                disabled={isConnecting}
                onClick={() => {
                  setShowGuideModal(false);
                  handleConnect();
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                <BluetoothConnected className="w-4 h-4" />
                Vincular Reloj Ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
