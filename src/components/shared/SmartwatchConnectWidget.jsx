import { useState, useEffect, useCallback } from "react";
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
  Sparkles,
  ShieldCheck,
  Check,
  ChevronRight,
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
    isSimulating,
    toggleRealisticSimulation,
    stopSimulation,
  } = useSmartwatch();

  const { registerConnectedDevice, unregisterConnectedDevice } =
    useGlobalContext();

  // Estados locales UI
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState("bluetooth"); // 'bluetooth' | 'health_connect' | 'faq'
  const [activeFaq, setActiveFaq] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
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

  const handleDisconnect = async () => {
    try {
      if (typeof unregisterConnectedDevice === "function") {
        unregisterConnectedDevice(deviceName);
      }
      setSyncBatchInfo(null);
      if (typeof stopSimulation === "function") {
        stopSimulation();
      }
      await disconnectSmartwatch();
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
      // Buscar en las últimas 12 horas (720 min) para capturar cualquier sincronización reciente
      const res = await fetchHealthConnectHeartRate(720);
      const newCount = res?.newReadings?.length || 0;
      const last = res?.lastSample;
      if (last && last.bpm) {
        setSyncBatchInfo({
          status: "success",
          newCount,
          lastBpm: last.bpm,
          sampleTime: formatSampleTime(last.timestamp),
          sourceName: last.sourceName || "Google Health",
        });
      } else {
        setSyncBatchInfo({
          status: "empty",
          newCount: 0,
        });
      }
    } catch (e) {
      setSyncBatchInfo({
        status: "error",
        error: e.message || "Error al sincronizar con Google Health.",
      });
    } finally {
      setIsSyncingHc(false);
    }
  };

  // Simulación oculta de desarrollo (exclusiva al pulsar la tecla 's' en teclado)
  const handleSimulateHealthConnect = useCallback(() => {
    setIsSyncingHc(true);
    setSyncBatchInfo({ status: "syncing" });
    setTimeout(() => {
      try {
        const res = simulateHealthConnectBatch(
          [78, 85, 92],
          "Reloj de Prueba (Simulado)",
        );
        setSyncBatchInfo({
          status: "success",
          newCount: res.newReadings.length,
          lastBpm: res.lastSample.bpm,
          sampleTime: formatSampleTime(res.lastSample.timestamp),
          sourceName: "Reloj de Prueba (Simulado)",
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
    }, 400);
  }, [simulateHealthConnectBatch]);

  // Atajos de teclado para demostración / pruebas clínicas:
  // 'S': Simula pulso normal y estado de calma (72 - 88 BPM)
  // 'C': Simula crisis fisiológica / sobrecarga (118 - 144 BPM)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        e.target?.isContentEditable
      ) {
        return;
      }
      if (e.key === "s" || e.key === "S") {
        if (typeof toggleRealisticSimulation === "function") {
          const started = toggleRealisticSimulation("normal");
          if (started) {
            setSyncBatchInfo({
              status: "success",
              newCount: 1,
              lastBpm: 78,
              sampleTime: "En vivo",
              sourceName: "Simulación Normal",
              isSimulated: true,
            });
          } else {
            setSyncBatchInfo(null);
          }
        }
      } else if (e.key === "c" || e.key === "C") {
        if (typeof toggleRealisticSimulation === "function") {
          const started = toggleRealisticSimulation("crisis");
          if (started) {
            setSyncBatchInfo({
              status: "success",
              newCount: 1,
              lastBpm: 128,
              sampleTime: "En vivo",
              sourceName: "Simulación Crisis",
              isSimulated: true,
            });
          } else {
            setSyncBatchInfo(null);
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleRealisticSimulation]);

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
                onClick={handleDisconnect}
                className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <BluetoothOff className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* CUERPO DEL WIDGET: EXPERIENCIA CLARA Y SIMPLE PARA EL USUARIO   */}
        {/* ============================================================== */}
        <div className="px-4 pb-4 sm:px-5 sm:pb-5 space-y-3.5">
          {/* ESTADO 1: DESCONECTADO (DOS OPCIONES CLARAS) */}
          {!isDeviceActive && !isConnecting && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Opción A: Conexión Bluetooth Directa */}
                <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3 transition-all hover:border-blue-400/50">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Bluetooth className="w-4 h-4" />
                      </div>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Conexión Bluetooth en Vivo
                      </h5>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      Mide el pulso segundo a segundo durante la terapia.
                      Requiere tener el Bluetooth y Ubicación activos.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={!isSupported}
                    onClick={handleConnect}
                    className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <BluetoothConnected className="w-3.5 h-3.5" />
                    <span>Vincular por Bluetooth</span>
                  </button>
                </div>

                {/* Opción B: Sincronizar vía Google Health Connect */}
                <div className="p-4 rounded-2xl bg-slate-50/90 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-3 transition-all hover:border-emerald-400/50">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          Google Health (Salud de Android)
                        </h5>
                      </div>

                      {healthConnectAuthorized && (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Conectado</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                      Ideal para relojes Samsung, Xiaomi, Huawei, Da Fit o
                      Amazfit que ya sincronizan con tu teléfono.
                    </p>
                  </div>

                  {!healthConnectAuthorized ? (
                    <button
                      type="button"
                      onClick={requestHealthConnectPermissions}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Conectar con Google Health</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSyncingHc}
                        onClick={handleManualHealthConnectSync}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <RefreshCw
                          className={`w-3.5 h-3.5 ${isSyncingHc ? "animate-spin" : ""}`}
                        />
                        <span>
                          {isSyncingHc ? "Buscando..." : "Actualizar Lecturas"}
                        </span>
                      </button>

                      {!healthConnectPolling ? (
                        <button
                          type="button"
                          onClick={() => startHealthConnectPolling(30)}
                          className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all shrink-0"
                          title="Actualizar periódicamente cada 30 segundos"
                        >
                          Auto
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopHealthConnectPolling}
                          className="px-3 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 text-rose-600 text-xs font-semibold transition-all shrink-0"
                          title="Detener actualización automática"
                        >
                          Detener
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Mensajes Informativos Claros sobre Google Health */}
              {syncBatchInfo?.status === "syncing" && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-xs flex items-center gap-2.5 animate-in fade-in">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-500 shrink-0" />
                  <span>
                    Buscando lecturas recientes de tu smartwatch en Google
                    Health...
                  </span>
                </div>
              )}

              {syncBatchInfo?.status === "success" && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2.5 animate-in fade-in">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      Última lectura sincronizada:{" "}
                      <strong>{syncBatchInfo.lastBpm} BPM</strong>
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-medium shrink-0">
                    {syncBatchInfo.sampleTime}
                  </span>
                </div>
              )}

              {syncBatchInfo?.status === "empty" && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-800 dark:text-amber-300">
                        No se encontraron lecturas de pulso en Google Health en
                        las últimas horas.
                      </p>
                      <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
                        Asegúrate de que la app de tu reloj (como{" "}
                        <strong>Da Fit</strong>, <strong>Samsung Health</strong>{" "}
                        o <strong>Mi Fitness</strong>) esté abierta y tenga
                        permiso para compartir datos con Salud de Android.
                      </p>
                    </div>
                  </div>
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={openHealthConnectSettings}
                      className="px-3 py-1.5 rounded-lg bg-amber-200/80 dark:bg-amber-900/50 hover:bg-amber-300 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-100 text-[11px] font-bold transition-colors"
                    >
                      Abrir Ajustes de Salud de Android
                    </button>
                  </div>
                </div>
              )}

              {syncBatchInfo?.status === "error" && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{syncBatchInfo.error}</span>
                </div>
              )}
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
                  abrió tu sistema.
                </p>
              </div>
            </div>
          )}

          {/* ESTADO 3: CONECTADO (Cockpit Clínico Limpio) */}
          {isDeviceActive && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                      Estado del Sensor
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
                          Esperando muñeca...
                        </span>
                      )}
                    </div>
                  </div>
                  {isBleActive && (
                    <button
                      type="button"
                      onClick={handleTriggerSensor}
                      disabled={isActivating}
                      title="Enviar señal de activación al sensor"
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 transition-all active:scale-95"
                    >
                      <Zap
                        className={`w-3.5 h-3.5 text-amber-500 ${isActivating ? "animate-spin" : ""}`}
                      />
                      <span>{isActivating ? "Activando..." : "Despertar"}</span>
                    </button>
                  )}
                </div>

                {/* Card 3: Método de Transmisión */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Canal de Telemetría
                    </span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {isBleActive
                          ? "Bluetooth (Tiempo Real)"
                          : "Google Health Connect"}
                      </span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 flex items-center justify-center text-blue-500 shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Si está en modo Google Health, ofrecer botón rápido de actualizar */}
              {isHcActive && (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs">
                  <span className="text-slate-600 dark:text-slate-300">
                    Datos obtenidos mediante Google Health.
                  </span>
                  <button
                    type="button"
                    disabled={isSyncingHc}
                    onClick={handleManualHealthConnectSync}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 transition-all text-[11px]"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${isSyncingHc ? "animate-spin" : ""}`}
                    />
                    <span>Actualizar Ahora</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MENSAJE DE ERROR AMIGABLE (SI OCURRE UNO) */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-start justify-between gap-2.5 animate-in fade-in">
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
          {/* DETALLES TÉCNICOS Y DIAGNÓSTICO (DISCRETO Y OPCIONAL)          */}
          {/* ============================================================== */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <button
              type="button"
              onClick={() => setShowAdvanced((prev) => !prev)}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors py-0.5"
            >
              <Settings2 className="w-3 h-3 text-slate-400" />
              <span>
                {showAdvanced
                  ? "Ocultar diagnóstico técnico"
                  : "Ver diagnóstico técnico"}
              </span>
              {showAdvanced ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {/* Consola Técnica Plegable */}
            {showAdvanced && (
              <div className="mt-2.5 p-3 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 font-mono text-[11px] space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-slate-400 font-sans text-xs">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    Dispositivo: <strong>{deviceName || "Ninguno"}</strong>
                  </span>
                  <span>
                    Canales BLE: <strong>{subscribedChars.length}</strong>
                  </span>
                </div>

                <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                  {rawPacketsHistory.length === 0 ? (
                    <p className="text-slate-500 text-center py-2 font-sans text-[11px]">
                      No hay tramas crudas registradas aún.
                    </p>
                  ) : (
                    rawPacketsHistory.slice(0, 8).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2 border-b border-slate-800/60 py-0.5"
                      >
                        <span className="text-slate-500">{p.time}</span>
                        <span className="text-emerald-400 truncate max-w-[170px]">
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
                  <div className="text-[10px] font-sans text-slate-400 flex items-center justify-between border-t border-slate-800/60 pt-1.5">
                    <span>Base local: IndexedDB</span>
                    <span>
                      Sincronizados: {syncStatus.syncedCount} | En cola:{" "}
                      {syncStatus.remainingUnsynced}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL / GUÍA PASO A PASO PARA PADRES Y ESPECIALISTAS           */}
      {/* ============================================================== */}
      {showGuideModal && (
        <div className="fixed inset-0 z-[120] bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header con Estilo Clínico y Cálido */}
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-slate-50 to-transparent dark:from-blue-950/20 dark:via-slate-900/40 dark:to-transparent shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                  <Watch className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Centro de Ayuda y Vinculación
                    </h3>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                      Guía Rápida
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Aprende a conectar cualquier smartwatch fácilmente en
                    simples pasos
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700 dark:text-slate-200">
              {/* Selector de Pestañas Moderno */}
              <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl gap-1">
                <button
                  type="button"
                  onClick={() => setGuideTab("bluetooth")}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    guideTab === "bluetooth"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span>Bluetooth en Vivo</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGuideTab("health_connect")}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    guideTab === "health_connect"
                      ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Google Health</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGuideTab("faq")}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    guideTab === "faq"
                      ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Preguntas & Soluciones</span>
                </button>
              </div>

              {/* CONTENIDO PESTAÑA 1: BLUETOOTH DIRECTO */}
              {guideTab === "bluetooth" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/25 border border-blue-100 dark:border-blue-900/40 flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                      La <strong>Conexión Bluetooth Directa</strong> transmite
                      el pulso segundo a segundo durante la terapia. Asegúrate
                      de tener el reloj encendido cerca.
                    </p>
                  </div>

                  {/* 4 Pasos Visuales para Bluetooth */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                        1
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                          Activa Bluetooth y GPS
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          En tu teléfono Android enciende el{" "}
                          <strong>Bluetooth</strong> y la{" "}
                          <strong>Ubicación (GPS)</strong>. En computadoras, usa
                          Google Chrome o Microsoft Edge.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                        2
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                          Libera la Señal del Reloj
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Si tu reloj está vinculado a otra app (Da Fit, Fitpro,
                          etc.) en otro teléfono, ciérrala temporalmente para
                          que no bloquee el sensor.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                        3
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                          Elige el Dispositivo
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Presiona <em>"Vincular por Bluetooth"</em> y
                          selecciona el nombre de tu reloj. Evita las opciones
                          que digan <em>"Audio"</em> o <em>"Call"</em>.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-rose-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                        4
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                          Contacto con la Muñeca
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Coloca el reloj firme contra la piel del menor. El
                          sensor óptico (luz verde) detectará el pulso y lo
                          mostrará en vivo.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/25 border border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      <strong>
                        ¿Tu reloj usa Da Fit, Samsung o Mi Fitness?
                      </strong>{" "}
                      Si el Bluetooth directo no es compatible con el modelo, te
                      recomendamos usar la pestaña{" "}
                      <strong>Google Health</strong>.
                    </span>
                  </div>
                </div>
              )}

              {/* CONTENIDO PESTAÑA 2: GOOGLE HEALTH CONNECT */}
              {guideTab === "health_connect" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-100 dark:border-emerald-900/40 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                      <strong>Google Health (Salud de Android)</strong> es la
                      forma más fácil y universal para conectar relojes{" "}
                      <strong>Samsung Galaxy Watch</strong>,{" "}
                      <strong>Xiaomi / Mi Band</strong>,{" "}
                      <strong>Amazfit</strong>, <strong>Da Fit</strong> y{" "}
                      <strong>Huawei</strong>.
                    </p>
                  </div>

                  {/* Pasos para Google Health */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                        1
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                          Usa la App de tu Reloj
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Asegúrate de que tu reloj esté vinculado a su app
                          habitual (como <em>Samsung Health</em>,{" "}
                          <em>Da Fit</em>, <em>Mi Fitness</em> o <em>Zepp</em>).
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                        2
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                          Comparte con Health Connect
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          En los ajustes de la app de tu reloj, activa la opción{" "}
                          <em>
                            "Sincronizar con Health Connect / Salud de Android"
                          </em>
                          .
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                        3
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                          Autoriza a SIAT
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          En SIAT presiona el botón verde{" "}
                          <em>"Conectar con Google Health"</em> y concede el
                          permiso de lectura de ritmo cardíaco.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
                        4
                      </div>
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">
                          Actualiza y Listo
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          Presiona <em>"Actualizar Lecturas"</em>. SIAT leerá el
                          último pulso registrado por tu reloj y lo mantendrá
                          sincronizado.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs text-slate-500">
                      ¿Necesitas configurar los permisos de Salud en tu
                      teléfono?
                    </span>
                    <button
                      type="button"
                      onClick={openHealthConnectSettings}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Settings2 className="w-3.5 h-3.5 text-blue-500" />
                      <span>Abrir Ajustes de Salud de Android</span>
                    </button>
                  </div>
                </div>
              )}

              {/* CONTENIDO PESTAÑA 3: PREGUNTAS FRECUENTES Y SOLUCIÓN DE PROBLEMAS */}
              {guideTab === "faq" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
                    {/* FAQ 1 */}
                    <div className="p-3.5">
                      <button
                        type="button"
                        onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)}
                        className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-white cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center text-[10px] shrink-0">
                            ?
                          </span>
                          ¿Por qué mi reloj no aparece en la ventana de
                          Bluetooth?
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === 1 ? "rotate-180" : ""}`}
                        />
                      </button>
                      {activeFaq === 1 && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pl-7 leading-relaxed">
                          Ocurre comúnmente si la{" "}
                          <strong>Ubicación (GPS)</strong> está apagada en tu
                          teléfono (Android la exige para escanear Bluetooth), o
                          si el reloj está enlazado a otra app en segundo plano.
                          Cierra las demás aplicaciones y vuelve a presionar
                          Vincular.
                        </p>
                      )}
                    </div>

                    {/* FAQ 2 */}
                    <div className="p-3.5">
                      <button
                        type="button"
                        onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)}
                        className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-white cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[10px] shrink-0">
                            ?
                          </span>
                          ¿Por qué no carga lecturas en Google Health?
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === 2 ? "rotate-180" : ""}`}
                        />
                      </button>
                      {activeFaq === 2 && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pl-7 leading-relaxed">
                          Para que Google Health tenga datos, la app oficial de
                          tu smartwatch (como Da Fit o Samsung Health) debe
                          haber tomado una medición reciente y tener permiso
                          para transferirla a Salud de Android. Abre la app de
                          tu reloj, verifica tu pulso actual y regresa a SIAT
                          para pulsar <em>"Actualizar Lecturas"</em>.
                        </p>
                      )}
                    </div>

                    {/* FAQ 3 */}
                    <div className="p-3.5">
                      <button
                        type="button"
                        onClick={() => setActiveFaq(activeFaq === 3 ? null : 3)}
                        className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-white cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center text-[10px] shrink-0">
                            ?
                          </span>
                          ¿Qué modelos de smartwatches son compatibles?
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === 3 ? "rotate-180" : ""}`}
                        />
                      </button>
                      {activeFaq === 3 && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pl-7 leading-relaxed">
                          SIAT admite prácticamente cualquier reloj o pulsera
                          del mercado: smartbands económicas (Da Fit, Fitpro,
                          Wearfit, Qwatch, Moyoung), relojes de alta gama
                          (Samsung Galaxy Watch, Google Pixel Watch), pulseras
                          Xiaomi/Amazfit, y bandas de pecho deportivas (Polar,
                          Garmin).
                        </p>
                      )}
                    </div>

                    {/* FAQ 4 */}
                    <div className="p-3.5">
                      <button
                        type="button"
                        onClick={() => setActiveFaq(activeFaq === 4 ? null : 4)}
                        className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-white cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-[10px] shrink-0">
                            ?
                          </span>
                          ¿Se pierden las lecturas si se cae el internet?
                        </span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 transition-transform ${activeFaq === 4 ? "rotate-180" : ""}`}
                        />
                      </button>
                      {activeFaq === 4 && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pl-7 leading-relaxed">
                          <strong>No.</strong> SIAT cuenta con memoria clínica
                          local (IndexedDB). Si la conexión a internet se
                          interrumpe, las constantes vitales se siguen
                          registrando de forma segura en tu dispositivo y se
                          sincronizan automáticamente con el servidor cuando la
                          conexión vuelva.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer con Acciones Claras */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
              >
                Cerrar Guía
              </button>

              {guideTab === "bluetooth" && (
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={() => {
                    setShowGuideModal(false);
                    handleConnect();
                  }}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <BluetoothConnected className="w-4 h-4" />
                  <span>Vincular por Bluetooth</span>
                </button>
              )}

              {guideTab === "health_connect" && (
                <button
                  type="button"
                  onClick={() => {
                    setShowGuideModal(false);
                    if (!healthConnectAuthorized) {
                      requestHealthConnectPermissions();
                    } else {
                      handleManualHealthConnectSync();
                    }
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>
                    {healthConnectAuthorized
                      ? "Actualizar Lecturas"
                      : "Conectar Google Health"}
                  </span>
                </button>
              )}

              {guideTab === "faq" && (
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold cursor-pointer transition-all"
                >
                  <span>Entendido</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
