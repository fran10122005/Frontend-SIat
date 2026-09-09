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
  QrCode,
  Radio,
  Zap,
} from "lucide-react";

export default function SmartwatchConnectWidget({ embedded = false }) {
  const {
    isSupported,
    isConnected,
    isConnecting,
    connectionStage,
    deviceName,
    batteryLevel,
    lastBpm,
    errorMsg,
    streamToCloud,
    setStreamToCloud,
    connectBluetoothDevice,
    disconnectSmartwatch,
  } = useSmartwatch();

  const { registerConnectedDevice } = useGlobalContext();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideTab, setGuideTab] = useState("pc");
  const [activeFaq, setActiveFaq] = useState(null);

  // Auto-registrar el smartwatch vinculado en la lista de dispositivos del niño
  useEffect(() => {
    if (isConnected && deviceName) {
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

  return (
    <>
      <div
        className={`rounded-2xl border transition-all shadow-sm ${
          isConnected
            ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/60"
            : "bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800"
        } p-4 sm:p-5`}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                isConnected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-4 ring-blue-500/10"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
              }`}
            >
              {isConnected ? (
                <Watch className="w-5 h-5 animate-pulse" />
              ) : (
                <Bluetooth className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                  {isConnected
                    ? deviceName
                    : "Vinculación de Smartwatch / Sensor Físico"}
                </h4>
                <span
                  className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    isConnected
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                      : isConnecting
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 animate-pulse"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {isConnected
                    ? "Conectado y Transmitiendo"
                    : isConnecting
                      ? "Escaneando..."
                      : "Sin Vincular"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isConnected
                  ? `Lectura biométrica activa (${lastBpm ? `${lastBpm} BPM` : "Esperando contacto con la piel..."})`
                  : "Conexión Bluetooth Low Energy directa con pulseras y relojes ópticos (Fitpro, Da Fit, Wearfit, Polar, etc.)"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold transition-all flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm active:scale-95 shrink-0"
              title="Guía de ayuda para vincular tu smartwatch"
              aria-label="Guía de vinculación"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            {isConnected ? (
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
            ) : (
              <button
                type="button"
                disabled={isConnecting || !isSupported}
                onClick={handleConnect}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer active:scale-95"
                title="Abrir selector Bluetooth nativo de Google Chrome / Edge"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Buscando dispositivos BLE...
                  </>
                ) : (
                  <>
                    <BluetoothConnected className="w-4 h-4" />
                    Escanear y Vincular Reloj
                  </>
                )}
              </button>
            )}
          </div>
        </div>

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
                Haz clic aquí para ver cómo solucionar problemas de vinculación
              </button>
            </div>
          </div>
        )}

        {isConnected && (
          <div className="mt-3.5 pt-3.5 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
              <Heart
                className={`w-4 h-4 ${lastBpm ? "text-rose-500 animate-pulse" : "text-slate-400"}`}
              />
              <span>
                Sensor Óptico:{" "}
                {lastBpm ? (
                  <strong className="text-rose-600 dark:text-rose-400 text-sm">
                    {lastBpm} BPM
                  </strong>
                ) : (
                  <span className="text-slate-400 font-normal">
                    Detectando pulso...
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
              <span>Sincronizar telemetría a la nube en tiempo real</span>
            </label>
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
