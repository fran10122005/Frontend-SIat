import { useState, useEffect, useRef } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useGlobalContext } from "../context/GlobalState";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Heart,
  Activity,
  ShieldCheck,
  Zap,
  Battery,
  Wifi,
  AlertTriangle,
  Cpu,
  Brain,
  CheckCircle,
  Moon,
  Sun,
  Watch,
} from "lucide-react";
import { getSocket } from "../hooks/socket";
import { useSmartwatch } from "../context/SmartwatchContext";
import Topbar from "../components/layout/Topbar";
import PageTitle from "../components/ui/PageTitle";
import api from "../api/axios";
import SmartwatchConnectWidget from "../components/shared/SmartwatchConnectWidget";

export default function HardwareInventory() {
  const {
    hardware,
    addHardware,
    navigate,
    userRole,
    saveCalibrationBaseline,
    valMini,
    valMaxi,
    nomNino,
    showToast,
    isOnline,
    calculateStressIndex,
  } = useGlobalContext();

  const {
    isConnected,
    deviceName,
    batteryLevel,
    liveBpm,
    liveStress,
    liveMov,
    sensorStatus,
    telemetryHistory,
    isWebSocketActive,
  } = useSmartwatch();

  const [isDark, setIsDark] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Calibrador en Vivo States (Specialist)
  const [calibStep, setCalibStep] = useState("idle"); // 'idle', 'measuring', 'completed', 'error'
  const [calibCountdown, setCalibCountdown] = useState(15);
  const [calibBpmFeed, setCalibBpmFeed] = useState(null);
  const [calibAvgBpm, setCalibAvgBpm] = useState(null);
  const [calibMin, setCalibMin] = useState(null);
  const [calibMax, setCalibMax] = useState(null);
  const samplesRef = useRef([]);

  // Effect to load theme
  useEffect(() => {
    if (document.documentElement.classList.contains("dark")) {
      setIsDark(true);
    }
  }, []);

  // Specialist Calibration Timer Effect (100% Real Sensor Samples)
  useEffect(() => {
    let timer;
    if (calibStep === "measuring" && calibCountdown > 0) {
      timer = setTimeout(() => {
        setCalibCountdown((prev) => prev - 1);
        if (liveBpm && liveBpm >= 40 && liveBpm <= 220) {
          samplesRef.current.push(liveBpm);
          setCalibBpmFeed(liveBpm);
        } else {
          setCalibBpmFeed(null);
        }
      }, 1000);
    } else if (calibStep === "measuring" && calibCountdown === 0) {
      if (samplesRef.current.length >= 3) {
        const sum = samplesRef.current.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / samplesRef.current.length);
        const minVal = Math.round(avg * 0.9);
        const maxVal = Math.round(avg * 1.45);
        setCalibAvgBpm(avg);
        setCalibMin(minVal);
        setCalibMax(maxVal);
        setCalibStep("completed");
      } else {
        setCalibStep("error");
      }
    }
    return () => clearTimeout(timer);
  }, [calibStep, calibCountdown, liveBpm]);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
    }
    setIsDark(!isDark);
  };

  const openCalibration = (device = null) => {
    if (!isConnected) {
      showToast(
        "⚠️ Debe vincular un smartwatch o sensor por Bluetooth antes de calibrar.",
      );
      return;
    }
    const dev = device ||
      hardware.find((h) => h.est_disp === "Online") ||
      hardware[0] || {
        id_hardw: "BLE-ACTIVE",
        name: deviceName || "Smartwatch BLE",
      };
    setSelectedDevice(dev);
    setCalibStep("idle");
    setCalibCountdown(15);
    setCalibBpmFeed(liveBpm || null);
    samplesRef.current = [];
    setShowModal(true);
  };

  // Representative calculations for display
  const currentBpm = isConnected && liveBpm !== null ? liveBpm : "--";
  const currentMov = isConnected && liveMov !== null ? liveMov : "--";
  const currentStress = isConnected && liveStress !== null ? liveStress : 0;

  const getMovLabel = (g) => {
    const num = Number(g);
    if (isNaN(num) || g === "--") return "Sin lectura";
    if (num < 1.2) return "Reposo / Calma";
    if (num < 2.5) return "Movimiento Normal";
    if (num < 5.0) return "Juego / Activo";
    return "Movimientos Estereotípicos (Stim)";
  };

  const getStressLabel = (s) => {
    if (s > 75) return "Sobrecarga Sensorial (Crisis)";
    if (s > 40) return "Agitación / Alerta Leve";
    return "Nivel de Calma Estable";
  };

  const getStressColorClass = (s) => {
    if (s > 75) return "text-rose-500 dark:text-rose-400";
    if (s > 40) return "text-amber-500 dark:text-amber-400";
    return "text-emerald-500 dark:text-emerald-400";
  };

  const getStressBgClass = (s) => {
    if (s > 75)
      return "bg-rose-500/10 border-rose-200 dark:border-rose-900/30 text-rose-700 dark:text-rose-400";
    if (s > 40)
      return "bg-amber-500/10 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400";
    return "bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400";
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6 md:gap-8 pb-12">
            {userRole !== "ESPECIALISTA" ? (
              // 👪 REPRESENTANTE - COCKPIT DE SEGUIMIENTO EN VIVO
              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header parent */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 md:pb-5">
                  <div>
                    <PageTitle icon={Activity} data-tour="hw-title">
                      Seguimiento en Vivo
                    </PageTitle>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1">
                      Paciente: {nomNino || "Paciente"}
                    </p>
                  </div>
                  <div
                    data-tour="hw-sim"
                    className="flex items-center gap-2 flex-wrap"
                  >
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
                        isWebSocketActive
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                          : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${isWebSocketActive ? "bg-blue-500 animate-pulse" : "bg-amber-500"}`}
                      />
                      {isWebSocketActive
                        ? "WebSocket Activo"
                        : "Reconectando WS"}
                    </span>
                    <span
                      className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
                        isConnected || isOnline
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${isConnected || isOnline ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`}
                      />
                      {isConnected || isOnline
                        ? "Pulsera En Línea"
                        : "Pulsera Desconectada"}
                    </span>
                  </div>
                </div>

                {/* Smartwatch WebBluetooth BLE Integration Widget */}
                <SmartwatchConnectWidget />

                {/* Grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left stats column */}
                  <div className="lg:col-span-1 grid grid-cols-2 lg:grid-cols-1 gap-4 lg:gap-6">
                    {/* Heart Rate Card */}
                    <div
                      data-tour="hw-bpm"
                      className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-center gap-3 md:gap-4 relative overflow-hidden group"
                    >
                      <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Heart className="w-32 h-32 text-rose-500" />
                      </div>
                      <div className="w-11 h-11 md:w-14 md:h-14 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex items-center justify-center border border-rose-100 dark:border-rose-900/40 shrink-0">
                        <Heart className="w-6 h-6 md:w-7 md:h-7 text-rose-500 animate-pulse" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
                          Ritmo Cardíaco
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
                            {currentBpm}
                          </span>
                          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                            BPM
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          Calibrado: {valMini} - {valMaxi} BPM
                        </p>
                      </div>
                    </div>

                    {/* Movement Card */}
                    <div
                      data-tour="hw-mov"
                      className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700/60 flex items-center gap-3 md:gap-4 relative overflow-hidden group"
                    >
                      <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Activity className="w-32 h-32 text-blue-500" />
                      </div>
                      <div className="w-11 h-11 md:w-14 md:h-14 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-900/40 shrink-0">
                        <Activity className="w-6 h-6 md:w-7 md:h-7 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
                          Movimiento (G)
                        </span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white">
                            {currentMov}
                          </span>
                          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                            G
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">
                          Estado: {getMovLabel(currentMov)}
                        </p>
                      </div>
                    </div>

                    {/* Stress Index Card */}
                    <div
                      data-tour="hw-stress"
                      className="bg-white dark:bg-slate-800 rounded-xl p-4 md:p-6 shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col gap-4 relative overflow-hidden col-span-2 lg:col-span-1"
                    >
                      <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-11 h-11 md:w-14 md:h-14 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center border border-indigo-100 dark:border-indigo-900/40 shrink-0">
                          <Brain className="w-6 h-6 md:w-7 md:h-7 text-indigo-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
                            Índice de Estrés
                          </span>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span
                              className={`text-2xl md:text-3xl font-black ${getStressColorClass(currentStress)}`}
                            >
                              {currentStress}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                              currentStress > 75
                                ? "bg-rose-500"
                                : currentStress > 40
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                            style={{ width: `${currentStress}%` }}
                          />
                        </div>
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border inline-block ${getStressBgClass(currentStress)}`}
                        >
                          {getStressLabel(currentStress)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right graph column */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Live Line Chart */}
                    <div
                      data-tour="hw-chart"
                      className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col"
                    >
                      <div className="mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          Señal de Telemetría Continua
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Ventana deslizante de telemetría (muestras cada 10s)
                        </p>
                      </div>

                      <div className="h-[250px] md:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={telemetryHistory}
                            margin={{
                              top: 10,
                              right: 10,
                              left: -20,
                              bottom: 0,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke={isDark ? "#334155" : "#F1F5F9"}
                            />
                            <XAxis
                              dataKey="time"
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fontSize: 10,
                                fill: isDark ? "#94A3B8" : "#64748B",
                              }}
                              dy={10}
                            />
                            <YAxis
                              domain={[0, 150]}
                              axisLine={false}
                              tickLine={false}
                              tick={{
                                fontSize: 10,
                                fill: isDark ? "#94A3B8" : "#64748B",
                              }}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
                                border: "none",
                                borderRadius: "8px",
                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                              }}
                              itemStyle={{
                                fontSize: "12px",
                                fontWeight: "500",
                              }}
                            />
                            <Legend
                              wrapperStyle={{
                                fontSize: "11px",
                                paddingTop: "15px",
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="bpm"
                              name="BPM (MAX30102)"
                              stroke="#F43F5E"
                              strokeWidth={2.5}
                              dot={{ r: 3 }}
                              activeDot={{ r: 5 }}
                            />
                            <Line
                              type="stress"
                              dataKey="stress"
                              name="Estrés %"
                              stroke="#6366F1"
                              strokeWidth={2.5}
                              strokeDasharray="5 5"
                              dot={{ r: 2 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Hardware Diagnosis */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700/60">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
                        Información del Hardware
                      </h3>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                          <Battery className="w-5 h-5 text-emerald-500 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">
                              Batería LiPo
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {isConnected && batteryLevel != null
                                ? `${batteryLevel}%`
                                : isConnected
                                  ? "En línea"
                                  : "Desconectado"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                          <Wifi className="w-5 h-5 text-blue-500 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block uppercase">
                              Antena Bluetooth
                            </span>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {isConnected
                                ? `${deviceName || "Smartwatch BLE"} (Conectado)`
                                : "Desconectado"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // 🩺 ESPECIALISTA - LISTADO Y CALIBRACIÓN DE DISPOSITIVOS CLÍNICOS
              <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Header Specialist */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 md:pb-5">
                  <div>
                    <PageTitle icon={Cpu} data-tour="hw-title">
                      Calibración de Dispositivos
                    </PageTitle>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Gestión y calibración de hardware de biotelemetría
                      asignado a pacientes.
                    </p>
                  </div>

                  <button
                    data-tour="hw-calibrate-header"
                    onClick={() => openCalibration()}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-lg shadow-sm transition-colors text-sm w-full md:w-auto"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Calibrar Línea Base (15s)
                  </button>
                </div>

                {/* Smartwatch WebBluetooth BLE Integration Widget */}
                <SmartwatchConnectWidget />

                {/* Grid de Dispositivos */}
                <div
                  data-tour="hw-grid"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                >
                  {hardware.length === 0 ? (
                    <div className="col-span-full p-8 text-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Watch className="w-6 h-6" />
                      </div>
                      <div className="max-w-md">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                          No hay Smartwatches vinculados
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Haz clic en "Vincular Smartwatch" arriba para conectar
                          tu reloj por Bluetooth LE.
                        </p>
                      </div>
                    </div>
                  ) : (
                    hardware.map((device) => {
                      const hasError =
                        device.est_disp === "Offline" ||
                        device.battery < 20 ||
                        device.signal < 30;

                      return (
                        <div
                          key={device.id_hardw}
                          data-tour="hw-card"
                          className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/60 flex flex-col transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900 group"
                        >
                          {/* Card Header */}
                          <div className="p-5 flex justify-between items-start border-b border-slate-100 dark:border-slate-700">
                            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform">
                              {device.type?.includes("Pulso") ||
                              device.name?.includes("Pulso") ? (
                                <Heart className="w-6 h-6 text-rose-500 animate-pulse" />
                              ) : device.type?.includes("Aceler") ||
                                device.name?.includes("Aceler") ? (
                                <Activity className="w-6 h-6 text-indigo-500" />
                              ) : (
                                <Cpu className="w-6 h-6 text-emerald-500" />
                              )}
                            </div>

                            <span
                              className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                                device.est_disp === "Online"
                                  ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400"
                                  : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400"
                              }`}
                            >
                              {device.est_disp === "Online"
                                ? "● Online"
                                : "○ Offline"}
                            </span>
                          </div>

                          {/* Card Body */}
                          <div className="p-5 flex-1">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-sm">
                              {device.name || device.type}
                            </h3>
                            <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-5 bg-slate-100 dark:bg-slate-700/50 inline-block px-2 py-0.5 rounded">
                              ID: {device.id_hardw}
                            </p>

                            <div className="space-y-4">
                              {/* Batería */}
                              <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                  <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <Battery className="w-3.5 h-3.5" />
                                    Batería
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {device.battery}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${device.battery > 50 ? "bg-green-500" : device.battery > 20 ? "bg-amber-500" : "bg-red-500"}`}
                                    style={{ width: `${device.battery}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Señal */}
                              <div>
                                <div className="flex justify-between text-xs mb-1.5">
                                  <span className="font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <Wifi className="w-3.5 h-3.5" />
                                    Señal
                                  </span>
                                  <span className="font-bold text-slate-800 dark:text-slate-200">
                                    {device.signal}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-500 ${device.signal > 70 ? "bg-blue-500" : device.signal > 30 ? "bg-amber-500" : "bg-slate-400"}`}
                                    style={{ width: `${device.signal}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer (Action) */}
                          <div className="p-4 border-t border-slate-150 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                            <button
                              data-tour="hw-calibrate"
                              onClick={() => openCalibration(device)}
                              className="w-full py-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                            >
                              <ShieldCheck className="w-4 h-4 text-brand-500" />
                              Calibrar Sensor
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal / Dialog (Simulated Calibration Baseline Dialog) */}
      {showModal && selectedDevice && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-850 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-150 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/30">
              <div>
                <h3 className="text-base font-bold text-slate-850 dark:text-white">
                  Calibración de Línea Base
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedDevice?.name || "Smartwatch BLE"} • Paciente:{" "}
                  {nomNino || "Paciente"}
                </p>
              </div>
              <button
                onClick={() => {
                  setCalibStep("idle");
                  setShowModal(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {calibStep === "idle" && (
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Prueba de Pulso en Reposo
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      Determinaremos la firma fisiológica en calma del paciente.
                      Coloque el wearable al niño y pídale que permanezca en
                      reposo por 15 segundos.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs flex justify-around">
                    <div>
                      <span className="text-slate-400 block mb-0.5 font-medium">
                        Umbral Mín
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {valMini} BPM
                      </span>
                    </div>
                    <div className="border-r border-slate-200 dark:border-slate-700 h-6"></div>
                    <div>
                      <span className="text-slate-400 block mb-0.5 font-medium">
                        Umbral Máx
                      </span>
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {valMaxi} BPM
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {calibStep === "measuring" && (
                <div className="space-y-6 text-center py-4">
                  <div className="relative flex justify-center items-center">
                    <span className="animate-ping absolute inline-flex h-16 w-16 rounded-full bg-rose-400 opacity-20"></span>
                    <div className="w-16 h-16 rounded-full bg-rose-500 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-rose-500/30 z-10 animate-pulse">
                      {calibBpmFeed !== null ? calibBpmFeed : "--"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                      {calibBpmFeed !== null
                        ? "Capturando pulso real del sensor..."
                        : "Esperando contacto del sensor con la piel..."}
                    </div>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Muestras válidas:{" "}
                      <span className="font-bold text-slate-700 dark:text-slate-200">
                        {samplesRef.current.length}
                      </span>{" "}
                      • Tiempo restante:{" "}
                      <span className="font-black text-slate-800 dark:text-white font-mono text-sm">
                        {calibCountdown}s
                      </span>
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-1.5 transition-all duration-300"
                      style={{
                        width: `${((15 - calibCountdown) / 15) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {calibStep === "error" && (
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Sin Señal Fisiológica Suficiente
                    </h4>
                    <p className="text-xs text-rose-600 dark:text-rose-400 max-w-xs mx-auto">
                      No se detectaron pulsaciones reales durante los 15
                      segundos. Asegúrese de que el sensor óptico del reloj esté
                      en contacto directo con la muñeca y vuelva a intentarlo.
                    </p>
                  </div>
                </div>
              )}

              {calibStep === "completed" && (
                <div className="space-y-5">
                  <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900/50 p-4 rounded-xl flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wide">
                        Calibración Fisiológica Completada
                      </h4>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1 leading-relaxed">
                        Se procesaron las muestras reales del sensor óptico.
                        Valores fisiológicos determinados:
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-150 dark:border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Reposo Basal
                      </span>
                      <span className="text-sm font-black text-slate-800 dark:text-white mt-1 block">
                        {calibAvgBpm}{" "}
                        <span className="text-[9px] font-medium text-slate-400">
                          BPM
                        </span>
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-150 dark:border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Min (90%)
                      </span>
                      <span className="text-sm font-black text-rose-500 mt-1 block">
                        {calibMin}{" "}
                        <span className="text-[9px] font-medium text-slate-400">
                          BPM
                        </span>
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-150 dark:border-slate-800 text-center">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Max (145%)
                      </span>
                      <span className="text-sm font-black text-indigo-500 mt-1 block">
                        {calibMax}{" "}
                        <span className="text-[9px] font-medium text-slate-400">
                          BPM
                        </span>
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    * Nota: Si el ritmo cardíaco del niño supera los {calibMax}{" "}
                    BPM en reposo sin registrar aceleración en el sensor, se
                    disparará una alerta predictiva en el hogar.
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-150 dark:border-slate-800/60 flex justify-end gap-3">
              {calibStep === "idle" && (
                <>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      samplesRef.current = [];
                      setCalibCountdown(15);
                      setCalibStep("measuring");
                    }}
                    className="px-4 py-2 font-semibold text-xs bg-brand-500 text-white hover:bg-blue-600 rounded-lg shadow-sm transition-colors"
                  >
                    Iniciar Calibración
                  </button>
                </>
              )}

              {calibStep === "measuring" && (
                <button
                  onClick={() => setCalibStep("idle")}
                  className="px-4 py-2 font-semibold text-xs text-rose-600 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors"
                >
                  Cancelar Prueba
                </button>
              )}

              {calibStep === "error" && (
                <>
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      samplesRef.current = [];
                      setCalibCountdown(15);
                      setCalibStep("measuring");
                    }}
                    className="px-4 py-2 font-semibold text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    Reintentar Calibración
                  </button>
                </>
              )}

              {calibStep === "completed" && (
                <>
                  <button
                    onClick={() => {
                      samplesRef.current = [];
                      setCalibStep("idle");
                      setCalibCountdown(15);
                    }}
                    className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    Repetir
                  </button>
                  <button
                    onClick={() => {
                      saveCalibrationBaseline(calibAvgBpm);
                      setShowModal(false);
                    }}
                    className="px-4 py-2 font-semibold text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors"
                  >
                    Guardar y Aplicar Umbrales
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
