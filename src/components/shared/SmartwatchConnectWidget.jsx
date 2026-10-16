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
  Sparkles,
} from "lucide-react";

// Formateador amigable de hora relativa para padres (ej: "Hace 3 min - 10:42 AM")
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
    lastRawPacket,
    rawPacketsHistory,
    discoveredServices,
    subscribedChars,
    triggerSensorActivation,
    sendManualBleCommand,
    errorMsg,
    streamToCloud,
    setStreamToCloud,
    connectBluetoothDevice,
    disconnectSmartwatch,
    telemetrySource,
    lastReadingTimestamp,
    healthConnectAvailable,
    healthConnectAuthorized,
    healthConnectPolling,
    requestHealthConnectPermissions,
    checkHealthConnectAvailability,
    startHealthConnectPolling,
    stopHealthConnectPolling,
    fetchHealthConnectHeartRate,
    openHealthConnectSettings,
    simulateHealthConnectBatch,
  } = useSmartwatch();

  const { registerConnectedDevice } = useGlobalContext();
  const [selectedSourceTab, setSelectedSourceTab] = useState("ble"); // 'ble' | 'health_connect'
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState("pc");
  const [activeFaq, setActiveFaq] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isSyncingHc, setIsSyncingHc] = useState(false);
  const [syncBatchInfo, setSyncBatchInfo] = useState(null); // { status, newCount, lastBpm, sampleTime, sourceName, isSimulated, alreadySynced }

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
          isSimulated: false,
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
        setSyncBatchInfo({
          status: "empty",
          newCount: 0,
        });
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
          "Samsung Galaxy Watch (Health Connect)",
        );
        setSyncBatchInfo({
          status: "success",
          newCount: res.newReadings.length,
          lastBpm: res.lastSample.bpm,
          sampleTime: formatSampleTime(res.lastSample.timestamp),
          sourceName: "Samsung Galaxy Watch (Health Connect)",
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

  const handleRequestHcPermissions = async () => {
    try {
      const granted = await requestHealthConnectPermissions();
      if (granted) {
        setSyncBatchInfo({
          status: "success",
          newCount: 0,
          lastBpm: lastBpm || 80,
          sampleTime: "Recién autorizado",
          sourceName: "Health Connect",
          alreadySynced: true,
        });
      } else {
        setSyncBatchInfo({
          status: "error",
          error:
            "El permiso fue denegado. Puedes activarlo manualmente en los Ajustes de Health Connect.",
        });
      }
    } catch (e) {
      setSyncBatchInfo({
        status: "error",
        error: e.message || "No se pudo solicitar permisos de Health Connect.",
      });
    }
  };

  // Escuchar estado de sincronización offline con IndexedDB
  useEffect(() => {
    const handleSyncStatus = (e) => {
      if (e.detail) {
        setSyncStatus(e.detail);
      }
    };
    window.addEventListener("siat:telemetry-sync-status", handleSyncStatus);
    return () => {
      window.removeEventListener(
        "siat:telemetry-sync-status",
        handleSyncStatus,
      );
    };
  }, []);

  // Auto-registrar el smartwatch vinculado en la lista de dispositivos del niño si existe la función
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

  const handleConnect = async () => {
    try {
      await connectBluetoothDevice();
    } catch (err) {
      console.error(err);
    }
  };

  const isBleActive = telemetrySource === "BLE_DIRECT" || isConnected;
  const isHcActive = telemetrySource === "HEALTH_CONNECT";

  return (
    <>
      <div
        className={`rounded-2xl border transition-all shadow-sm ${
          isBleActive || isHcActive
            ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60"
            : "bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800"
        } p-4 sm:p-5`}
      >
        {/* Cabecera Principal */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                isBleActive
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/25 ring-4 ring-emerald-500/10"
                  : isHcActive
                    ? "bg-sky-600 text-white shadow-md shadow-sky-500/25 ring-4 ring-sky-500/10"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {isBleActive ? (
                <Watch className="w-5 h-5 animate-pulse" />
              ) : isHcActive ? (
                <Activity className="w-5 h-5 animate-pulse" />
              ) : (
                <Bluetooth className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  {isBleActive
                    ? deviceName || "Smartwatch BLE Directo"
                    : isHcActive
                      ? deviceName || "Health Connect Sincronizado"
                      : "Vincular Reloj / Fuente de Monitoreo"}
                </h4>

                {/* Badge de Estado Global */}
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                    isBleActive
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : isHcActive
                        ? "bg-sky-500/10 border-sky-500/30 text-sky-600 dark:text-sky-400"
                        : isConnecting
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 animate-pulse"
                          : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {isBleActive ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                      Tiempo Real (BLE)
                    </>
                  ) : isHcActive ? (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      Sincronización (Health Connect)
                    </>
                  ) : isConnecting ? (
                    connectionStage === "connecting_gatt" ? (
                      "Conectando GATT..."
                    ) : connectionStage === "discovering_services" ? (
                      "Buscando canales BLE..."
                    ) : connectionStage === "activating_sensor" ? (
                      "Activando sensor..."
                    ) : (
                      "Escaneando..."
                    )
                  ) : (
                    "Sin Vincular"
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isBleActive
                  ? `Lectura en vivo activa (${lastBpm ? `${lastBpm} BPM` : "Esperando contacto con la piel..."})`
                  : isHcActive
                    ? `Monitoreo vía app oficial del reloj (${lastBpm ? `${lastBpm} BPM` : "Sincronizando..."})`
                    : "Captura de frecuencia cardíaca para cualquier marca (Samsung, Xiaomi, Huawei, Aiwa, genéricos)."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold transition-all flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 shrink-0"
              title="Guía de ayuda para padres"
              aria-label="Guía de ayuda"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {isBleActive && (
              <>
                {batteryLevel !== null && (
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
                    <Battery className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{batteryLevel}%</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={disconnectSmartwatch}
                  className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800/60 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <BluetoothOff className="w-3.5 h-3.5" />
                  Desconectar
                </button>
              </>
            )}

            {isHcActive && healthConnectPolling && (
              <button
                type="button"
                onClick={stopHealthConnectPolling}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
              >
                Pausar Sincronización
              </button>
            )}
          </div>
        </div>

        {/* SELECTOR DE MODO PARA PADRES (TABS) */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl gap-1 mt-4">
          <button
            type="button"
            onClick={() => setSelectedSourceTab("ble")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
              selectedSourceTab === "ble"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Opción 1: Bluetooth Directo</span>
            {isBleActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setSelectedSourceTab("health_connect")}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${
              selectedSourceTab === "health_connect"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Opción 2: Health Connect</span>
            {isHcActive && (
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            )}
          </button>
        </div>

        {/* CONTENIDO SEGÚN LA OPCIÓN SELECCIONADA */}
        {selectedSourceTab === "ble" ? (
          /* ============================================================== */
          /* PESTAÑA 1: MODO TIEMPO REAL POR BLUETOOTH DIRECTO             */
          /* ============================================================== */
          <div className="mt-3.5 space-y-3 animate-in fade-in">
            {/* Aviso especial para relojes Aiwa y OEM */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-[11px] leading-relaxed">
                <strong>💡 Aviso para relojes Aiwa o genéricos:</strong> Si usas
                un reloj Aiwa o genérico, cierra primero su app oficial en tu
                teléfono (ej. <em>Aiwa Wear</em>, <em>Da Fit</em>,{" "}
                <em>Fitpro</em>) para permitir la conexión directa a SIAT, o
                activa <strong>"Transmitir FC"</strong> en los ajustes de tu
                reloj.
              </p>
            </div>

            {!isConnected ? (
              <div className="flex items-center justify-between flex-wrap gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Escaneo directo de canales estándar GATT (UUID 0x180D)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Permite recibir las pulsaciones segundo a segundo sin pasar
                    por servidores externos.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isConnecting || !isSupported}
                  onClick={handleConnect}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  {isConnecting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Buscando relojes...
                    </>
                  ) : (
                    <>
                      <BluetoothConnected className="w-4 h-4" />
                      Escanear y Conectar Reloj
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
                    <Heart
                      className={`w-4 h-4 ${lastBpm ? "text-rose-500 animate-pulse" : "text-amber-500 animate-spin"}`}
                    />
                    <span>
                      Sensor Óptico:{" "}
                      {lastBpm ? (
                        <strong className="text-rose-600 dark:text-rose-400 text-sm">
                          {lastBpm} BPM
                        </strong>
                      ) : (
                        <span className="text-amber-600 dark:text-amber-400 font-bold">
                          {sensorStatus === "waiting_skin"
                            ? "Esperando pulso en la muñeca..."
                            : "Detectando señal biométrica..."}
                        </span>
                      )}
                    </span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 font-semibold select-none">
                    <input
                      type="checkbox"
                      checked={streamToCloud}
                      onChange={(e) => setStreamToCloud(e.target.checked)}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Sincronizar a la nube</span>
                  </label>
                </div>

                {/* Botones de acción rápida BLE */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleTriggerSensor}
                    disabled={isActivating}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-sm ${
                      isActivating
                        ? "bg-amber-500 text-white animate-pulse"
                        : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
                    }`}
                  >
                    <Zap
                      className={`w-3.5 h-3.5 ${isActivating ? "animate-spin" : ""}`}
                    />
                    {isActivating
                      ? "Enviando pulso..."
                      : "Probar Activación de Sensor"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDiagnostics((prev) => !prev)}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Terminal className="w-3.5 h-3.5 text-blue-500" />
                    <span>Diagnóstico BLE en Vivo</span>
                    {showDiagnostics ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Panel de diagnóstico BLE */}
                {showDiagnostics && (
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 border border-slate-800 space-y-3 font-mono text-[11px] animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-white">
                          Dispositivo: {deviceName}
                        </span>
                        {connectedDeviceId && (
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                            {connectedDeviceId}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                        {subscribedChars.length} canales
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-emerald-400" />
                          Tráfico de Paquetes BLE ({rawPacketsHistory.length})
                        </span>
                      </div>

                      {rawPacketsHistory.length === 0 ? (
                        <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800 text-slate-400 text-center font-sans text-xs">
                          Aún no se reciben paquetes. Toca la pantalla de "Ritmo
                          Cardíaco" en el reloj.
                        </div>
                      ) : (
                        <div className="space-y-1 max-h-32 overflow-y-auto p-2 rounded-xl bg-black/60 border border-slate-800 font-mono text-[10px]">
                          {rawPacketsHistory.map((p) => (
                            <div
                              key={p.id}
                              className="flex items-center justify-between gap-2 py-0.5 border-b border-slate-800/40"
                            >
                              <span className="text-slate-400">{p.time}</span>
                              <span className="text-emerald-400 font-semibold truncate max-w-[200px]">
                                [{p.hex}]
                              </span>
                              {p.parsedBpm && (
                                <span className="text-rose-400 font-bold bg-rose-950/60 px-1.5 py-0.2 rounded shrink-0">
                                  {p.parsedBpm} BPM
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ============================================================== */
          /* PESTAÑA 2: MODO PUENTE UNIVERSAL VÍA HEALTH CONNECT           */
          /* ============================================================== */
          <div className="mt-3.5 space-y-3.5 animate-in fade-in">
            {/* Tarjeta descriptiva para padres */}
            <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/60 text-xs text-sky-900 dark:text-sky-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-sky-800 dark:text-sky-300">
                <Smartphone className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>
                  Compatible con Samsung, Huawei, Xiaomi, Zepp, Da Fit
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                Si tu reloj está vinculado a su app oficial (Samsung Health, Mi
                Fitness, Zepp Life, Da Fit o VeryFit), Android Health Connect
                almacena las pulsaciones en tu teléfono y SIAT las lee
                automáticamente sin desconectar el reloj de su app.
              </p>
            </div>

            {/* Estado de disponibilidad del SDK de Health Connect */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/70 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <CheckCircle2
                    className={`w-4 h-4 ${healthConnectAvailable ? "text-emerald-500" : "text-amber-500"}`}
                  />
                  <span>
                    Health Connect en el teléfono:{" "}
                    <strong>
                      {healthConnectAvailable
                        ? "Instalado y Disponible"
                        : "No detectado / Requiere descarga"}
                    </strong>
                  </span>
                </span>

                {!healthConnectAvailable && (
                  <button
                    type="button"
                    onClick={openHealthConnectSettings}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Abrir / Instalar en Google Play</span>
                  </button>
                )}
              </div>

              {/* Permisos de lectura */}
              <div className="flex items-center justify-between flex-wrap gap-2 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  <span>
                    Permiso de FC:{" "}
                    <strong
                      className={
                        healthConnectAuthorized
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-amber-600 dark:text-amber-400"
                      }
                    >
                      {healthConnectAuthorized
                        ? "Autorizado para SIAT"
                        : "Pendiente de Autorización"}
                    </strong>
                  </span>
                </span>

                {!healthConnectAuthorized ? (
                  <button
                    type="button"
                    onClick={handleRequestHcPermissions}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Solicitar Permisos de Frecuencia Cardíaca</span>
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    Lectura habilitada
                  </span>
                )}
              </div>

              {/* Botón de sincronizar ahora, auto-polling y simulador de pruebas */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    disabled={isSyncingHc}
                    onClick={handleManualHealthConnectSync}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black transition-all shadow-sm flex items-center gap-2 active:scale-95"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isSyncingHc ? "animate-spin" : ""}`}
                    />
                    <span>
                      {isSyncingHc
                        ? "Consultando Health Connect..."
                        : "Sincronizar Datos Ahora"}
                    </span>
                  </button>

                  {!healthConnectPolling ? (
                    <button
                      type="button"
                      onClick={() => startHealthConnectPolling(25)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                    >
                      Activar Auto-Sincronización (25s)
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Auto-Sincronización Activa
                    </span>
                  )}
                </div>

                {/* BOTÓN MODO SIMULADOR DE PRUEBAS (SOLO DESARROLLO / TEST) */}
                <button
                  type="button"
                  onClick={handleSimulateHealthConnect}
                  disabled={isSyncingHc}
                  className="px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                  title="Inyecta 3 lecturas de prueba (78, 85, 92 BPM) sin requerir reloj físico"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Simular Lote de Health Connect (Test)</span>
                </button>
              </div>
            </div>

            {/* 1. ESTADO "SINCRONIZANDO..." */}
            {isSyncingHc && (
              <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 flex items-center gap-3.5 animate-in fade-in">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
                <div>
                  <h5 className="text-xs font-black text-blue-900 dark:text-blue-100">
                    Sincronizando con Health Connect...
                  </h5>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                    Extrayendo y procesando los registros de frecuencia cardíaca
                    de tu reloj...
                  </p>
                </div>
              </div>
            )}

            {/* 2. RESULTADO CON DATOS ENCONTRADOS */}
            {!isSyncingHc && syncBatchInfo?.status === "success" && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-sky-500/5 to-transparent border border-emerald-500/30 dark:border-emerald-500/20 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300">
                      Lote Sincronizado Exitosamente
                    </span>
                  </div>
                  {syncBatchInfo.isSimulated && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Simulador de Pruebas
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Tarjeta Último BPM */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Último BPM Registrado
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                          {syncBatchInfo.lastBpm || "--"}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          BPM
                        </span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shrink-0">
                      <Heart className="w-5 h-5 animate-pulse" />
                    </div>
                  </div>

                  {/* Tarjeta Muestras Nuevas */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Muestras Nuevas
                      </span>
                      <div className="mt-0.5">
                        {syncBatchInfo.newCount > 0 ? (
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                            +{syncBatchInfo.newCount} lecturas nuevas
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            Al día (0 lecturas duplicadas)
                          </span>
                        )}
                        <p className="text-[10px] text-slate-400">
                          Enviadas al monitoreo y persistidas
                        </p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Detalles de origen y hora */}
                <div className="flex items-center justify-between flex-wrap gap-2 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-800/80 text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-3.5 h-3.5 text-sky-500" />
                    Hora de la muestra:{" "}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {syncBatchInfo.sampleTime}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1.5 font-medium">
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                    Origen:{" "}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {syncBatchInfo.sourceName || "Health Connect"}
                    </strong>
                  </span>
                </div>
              </div>
            )}

            {/* 3. RESULTADO CUANDO NO HAY LECTURAS NUEVAS */}
            {!isSyncingHc && syncBatchInfo?.status === "empty" && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="font-bold text-amber-950 dark:text-amber-100">
                    No se encontraron lecturas nuevas recientes
                  </h5>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                    Asegúrate de que el reloj esté puesto y que la app de tu
                    reloj (Samsung Health, Mi Fitness, Zepp Life, Da Fit, etc.)
                    tenga activada la sincronización con Health Connect.
                  </p>
                </div>
              </div>
            )}

            {/* Error en la sincronización */}
            {!isSyncingHc && syncBatchInfo?.status === "error" && (
              <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200 animate-in fade-in">
                <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold">Error de sincronización</h5>
                  <p className="text-[11px] mt-0.5">{syncBatchInfo.error}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mensaje de error general si existe */}
        {errorMsg && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
            <div className="flex-1">
              <p className="font-bold">{errorMsg}</p>
              <button
                type="button"
                onClick={() => setShowGuideModal(true)}
                className="underline font-bold mt-1 text-rose-600 dark:text-rose-400 hover:opacity-80 block"
              >
                Haz clic aquí para ver la guía de ayuda
              </button>
            </div>
          </div>
        )}

        {/* Resumen de telemetría y sincronización al pie de la tarjeta */}
        {(isBleActive || isHcActive) && (
          <div className="mt-3.5 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Telemetría activa (
              {isBleActive ? "Tiempo Real BLE" : "Health Connect"})
            </span>
            {syncStatus && (
              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-medium">
                Sincronizados: {syncStatus.syncedCount} | Pendientes:{" "}
                {syncStatus.remainingUnsynced}
              </span>
            )}
          </div>
        )}
      </div>

      {/* MODAL / ASISTENTE VISUAL DE VINCULACIÓN PASO A PASO */}
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
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Guía de Vinculación de Smartwatch
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sigue estos sencillos pasos para conectar cualquier pulsera
                    o reloj inteligente
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
                  className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
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
                  className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    guideTab === "mobile"
                      ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Desde Teléfono Celular / Tablet
                </button>
              </div>

              {/* 4 Pasos Visuales - Dinámicos según PC o Celular */}
              {guideTab === "pc" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-in fade-in">
                  {/* Paso 1 PC */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                        Desconectar del Celular
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Apaga el Bluetooth de tu teléfono temporalmente. Los
                        relojes solo permiten <strong>1 conexión activa</strong>{" "}
                        y se ocultan si están emparejados al móvil.
                      </p>
                    </div>
                  </div>

                  {/* Paso 2 PC */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-blue-500" />
                        Encender Bluetooth en PC
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Verifica que el Bluetooth de tu computadora esté activo
                        y que uses <strong>Google Chrome</strong> o{" "}
                        <strong>Microsoft Edge</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Paso 3 PC */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Elegir Señal de Sensores
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        En la ventana del navegador, selecciona el nombre del
                        reloj que <strong>NO</strong> diga <em>"Audio"</em> o{" "}
                        <em>"Call"</em> (ej: <code>Fitpro</code>,{" "}
                        <code>Watch</code>, <code>T500</code>).
                      </p>
                    </div>
                  </div>

                  {/* Paso 4 PC */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        Colocar en la Muñeca
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        El sensor óptico trasero (luz verde) empezará a medir el
                        pulso una vez colocado firmemente en la muñeca del
                        paciente.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-in fade-in">
                  {/* Paso 1 Celular */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-amber-500" />
                        Cerrar App de Fábrica
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Cierra o desvincula la app del fabricante (ej:{" "}
                        <em>Fitpro</em>, <em>Da Fit</em>, <em>Wearfit</em>) en
                        tu celular para que no bloquee el sensor en segundo
                        plano.
                      </p>
                    </div>
                  </div>

                  {/* Paso 2 Celular */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-blue-500" />
                        Activar Bluetooth y Ubicación
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        En Android, el sistema requiere tener{" "}
                        <strong>Bluetooth</strong> y{" "}
                        <strong>Ubicación/GPS</strong> encendidos para escanear
                        sensores en Google Chrome.
                      </p>
                    </div>
                  </div>

                  {/* Paso 3 Celular */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Elegir Señal de Sensores
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        En la ventana emergente de Chrome, selecciona el
                        smartwatch (ej: <code>Fitpro</code>, <code>Watch</code>,{" "}
                        <code>T500</code>). Evita las opciones de audio.
                      </p>
                    </div>
                  </div>

                  {/* Paso 4 Celular */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-rose-500" />
                        Colocar en la Muñeca
                      </h5>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        Coloca el reloj en el paciente y mantén la pantalla de
                        SIAT abierta para transmitir la telemetría en vivo a la
                        nube.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Preguntas Frecuentes / Dudas habituales */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-500" />
                  Preguntas frecuentes sobre la vinculación
                </h4>

                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden bg-slate-50/50 dark:bg-slate-900/30">
                  {/* FAQ 1 */}
                  <div className="p-3.5">
                    <button
                      type="button"
                      onClick={() => setActiveFaq(activeFaq === 1 ? null : 1)}
                      className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-white"
                    >
                      <span>
                        ❓ ¿Por qué algunos nombres dicen "Dispositivo no
                        compatible"?
                      </span>
                      <span className="text-slate-400 text-sm font-black">
                        {activeFaq === 1 ? "−" : "+"}
                      </span>
                    </button>
                    {activeFaq === 1 && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Los smartwatches emiten dos señales Bluetooth: una de{" "}
                        <strong>llamadas/audio</strong> (que no sirve para
                        telemetría y Chrome la marca como no compatible) y otra
                        de <strong>sensores biológicos (BLE)</strong>. Debes
                        elegir la señal de sensores del reloj en la lista.
                      </p>
                    )}
                  </div>

                  {/* FAQ 2 */}
                  <div className="p-3.5">
                    <button
                      type="button"
                      onClick={() => setActiveFaq(activeFaq === 2 ? null : 2)}
                      className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-white"
                    >
                      <span>
                        📱 ¿Por qué no se vincula mediante el Código QR del
                        reloj?
                      </span>
                      <span className="text-slate-400 text-sm font-black">
                        {activeFaq === 2 ? "−" : "+"}
                      </span>
                    </button>
                    {activeFaq === 2 && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        El código QR de los relojes sólo contiene el enlace para
                        descargar la app en Google Play / App Store. Por
                        protocolos internacionales de seguridad web (W3C
                        WebBluetooth), el navegador requiere que selecciones tu
                        dispositivo en el cuadro oficial de Chrome/Edge para
                        autorizar la conexión.
                      </p>
                    )}
                  </div>

                  {/* FAQ 3 */}
                  <div className="p-3.5">
                    <button
                      type="button"
                      onClick={() => setActiveFaq(activeFaq === 3 ? null : 3)}
                      className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-white"
                    >
                      <span>🔌 ¿Qué marcas y modelos son compatibles?</span>
                      <span className="text-slate-400 text-sm font-black">
                        {activeFaq === 3 ? "−" : "+"}
                      </span>
                    </button>
                    {activeFaq === 3 && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        Cualquier dispositivo con sensor óptico BLE:
                        Smartwatches económicos compatibles con Fitpro / HryFine
                        / Wearfit / Da Fit (T500, Y68, D20, etc.), bandas de
                        frecuencia cardíaca (Polar H10, Garmin, CooSpo) y
                        smartbands estándar GATT.
                      </p>
                    )}
                  </div>

                  {/* FAQ 4 */}
                  <div className="p-3.5">
                    <button
                      type="button"
                      onClick={() => setActiveFaq(activeFaq === 4 ? null : 4)}
                      className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-white"
                    >
                      <span>
                        ❓ ¿Por qué al reloj no le llega ninguna notificación o
                        solicitud de permiso?
                      </span>
                      <span className="text-slate-400 text-sm font-black">
                        {activeFaq === 4 ? "−" : "+"}
                      </span>
                    </button>
                    {activeFaq === 4 && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        En WebBluetooth (Chrome/Edge), la autorización de
                        vinculación la otorgas tú en el cuadro emergente del
                        navegador. Los relojes no reciben notificaciones de
                        pantalla para vincularse; en su lugar, para que el
                        sensor óptico encienda la luz verde trasera debes:
                        <br />
                        <br />
                        <strong>1. Desconectar el reloj del celular:</strong> Si
                        el reloj está enlazado a su app en el celular (Fitpro,
                        Da Fit, Wearfit), el canal Bluetooth está ocupado y
                        rechazará la telemetría del PC. Apaga el Bluetooth del
                        teléfono unos momentos.
                        <br />
                        <br />
                        <strong>2. Abrir Ritmo Cardíaco en el reloj:</strong> En
                        la pantalla del smartwatch, toca la opción de medición o
                        haz clic en el botón{" "}
                        <em>"⚡ Forzar Activación de Sensor"</em> en SIAT.
                      </p>
                    )}
                  </div>

                  {/* FAQ 5 */}
                  <div className="p-3.5">
                    <button
                      type="button"
                      onClick={() => setActiveFaq(activeFaq === 5 ? null : 5)}
                      className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-800 dark:text-white"
                    >
                      <span>
                        💾 ¿Qué ocurre si se corta la conexión o el servidor
                        está ocupado?
                      </span>
                      <span className="text-slate-400 text-sm font-black">
                        {activeFaq === 5 ? "−" : "+"}
                      </span>
                    </button>
                    {activeFaq === 5 && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        SIAT cuenta con persistencia{" "}
                        <strong>IndexedDB local</strong>. Cada latido registrado
                        se almacena localmente en tu navegador de forma segura.
                        Cuando la conexión se restablece, el sincronizador
                        automático envía los registros pendientes al backend sin
                        perder información clínica de la sesión.
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
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors"
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
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition-all shadow-md shadow-blue-500/20 flex items-center gap-2"
              >
                <BluetoothConnected className="w-4 h-4" />
                Abrir Escáner Bluetooth Ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
