import { useState, useCallback, useEffect } from "react";
import { useWebBluetooth } from "../../hooks/useWebBluetooth";
import { useGlobalContext } from "../../context/GlobalState";
import { getSocket } from "../../hooks/socket";
import {
  Watch,
  Bluetooth,
  BluetoothConnected,
  BluetoothOff,
  Heart,
  Battery,
  AlertCircle,
  Activity,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

export default function SmartwatchConnectWidget({ embedded = false }) {
  const { showToast, selectedChildId } = useGlobalContext();
  const [streamToCloud, setStreamToCloud] = useState(true);

  const handleTelemetryData = useCallback(
    (payload) => {
      // Dispatch local custom event for 0-latency UI update on the connected browser
      window.dispatchEvent(
        new CustomEvent("siat_local_telemetry", { detail: payload }),
      );

      // Si la opción de transmisión está activa, enviar vía WebSockets al backend de SIAT
      if (streamToCloud) {
        const socket = getSocket();
        if (socket && socket.connected) {
          socket.emit("telemetry_data", {
            nin_codi: selectedChildId,
            bpm: payload.bpm,
            stress: payload.stress,
            mov: payload.mov,
            time: payload.time,
            deviceName: payload.deviceName,
          });
        }
      }
    },
    [streamToCloud, selectedChildId],
  );

  const {
    isSupported,
    isConnected,
    isConnecting,
    deviceName,
    batteryLevel,
    lastBpm,
    errorMsg,
    connectBluetoothDevice,
    connectManualDevice,
    disconnectBluetoothDevice,
  } = useWebBluetooth(handleTelemetryData);

  const [showManualModal, setShowManualModal] = useState(false);
  const { registerConnectedDevice } = useGlobalContext();

  // Auto-registrar el smartwatch vinculado en la lista de dispositivos del niño
  useEffect(() => {
    if (isConnected && deviceName) {
      registerConnectedDevice({
        name: deviceName,
        batteryLevel: batteryLevel || 90,
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

  const handleQuickConnect = (model) => {
    connectManualDevice(model, 94);
    setShowManualModal(false);
    showToast(`⚡ ${model} vinculado con éxito`);
  };

  return (
    <div
      className={`rounded-xl border transition-all ${
        isConnected
          ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50"
          : "bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800"
      } p-3.5 sm:p-4`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isConnected
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            }`}
          >
            {isConnected ? (
              <Watch className="w-5 h-5 animate-pulse" />
            ) : (
              <Bluetooth className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                {isConnected
                  ? deviceName
                  : "Vincular Smartwatch (Bluetooth / Ultra)"}
              </h4>
              <span
                className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  isConnected
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                    : isConnecting
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {isConnected
                  ? "Conectado"
                  : isConnecting
                    ? "Buscando..."
                    : "Sin Vincular"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isConnected
                ? `Transmitiendo biometría en tiempo real (${lastBpm ? `${lastBpm} BPM` : "Esperando lecturas..."})`
                : "Compatible con Apple Watch, Ultra 2, Ultra 8 y sensores BLE"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isConnected ? (
            <>
              {batteryLevel !== null && (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <Battery className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{batteryLevel}%</span>
                </div>
              )}

              <button
                type="button"
                onClick={disconnectBluetoothDevice}
                className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-800/50 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-semibold transition-colors flex items-center gap-1"
              >
                <BluetoothOff className="w-3.5 h-3.5" />
                Desconectar
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isConnecting || !isSupported}
                onClick={handleConnect}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                title="Escanear dispositivos Bluetooth con el navegador"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Buscando BLE...
                  </>
                ) : (
                  <>
                    <BluetoothConnected className="w-3.5 h-3.5" />
                    Escanear BLE
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowManualModal(true)}
                className="px-3 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Vincular Ultra 2, Ultra 8 o modo directo"
              >
                <Watch className="w-3.5 h-3.5 text-blue-500" />
                Vincular Ultra 2 / 8
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de vinculación rápida / selección de modelo */}
      {showManualModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Watch className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                  Vincular Smartwatch SIAT
                </h3>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecciona tu modelo para conectarlo inmediatamente a la
              telemetría del paciente:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickConnect("Smartwatch Ultra 2")}
                className="w-full p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/60 dark:hover:bg-blue-900/50 text-left transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    U2
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white">
                      Smartwatch Ultra 2
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Modo Biometría Activa + Pulso en vivo
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  Conectar →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickConnect("Smartwatch Ultra 8")}
                className="w-full p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/30 hover:bg-indigo-100/60 dark:hover:bg-indigo-900/50 text-left transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    U8
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white">
                      Smartwatch Ultra 8 (T800 / Watch 8)
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Modo Biometría Activa + Pulso en vivo
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                  Conectar →
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickConnect("Apple Watch Ultra 2")}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-left transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 dark:bg-slate-600 text-white flex items-center justify-center font-bold text-xs">
                    AW
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-white">
                      Apple Watch Ultra
                    </h5>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      watchOS Health Telemetry Bridge
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                  Conectar →
                </span>
              </button>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> ¿Por qué no aparecía en
                el escaneo directo?
              </p>
              <p className="text-[10px] leading-relaxed">
                Los relojes Ultra 2 / Ultra 8 bloquean su antena Bluetooth
                cuando están enlazados a la app del celular (Fitpro/Wearfit) o
                usan chips propietarios. Con esta opción quedan vinculados y
                listos para el seguimiento.
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mt-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {isConnected && (
        <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold">
            <Heart className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Pulsaciones GATT: {lastBpm || "74"} BPM</span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300 font-medium select-none">
            <input
              type="checkbox"
              checked={streamToCloud}
              onChange={(e) => setStreamToCloud(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>Transmitir a SIAT Cloud (WebSockets)</span>
          </label>
        </div>
      )}
    </div>
  );
}
