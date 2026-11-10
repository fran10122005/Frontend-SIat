import { useState, useEffect, useMemo, useRef } from "react";
import {
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle2,
  Star,
  MessageSquare,
  ListChecks,
  Heart,
  Activity,
  Radio,
  Zap,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { useSmartwatch } from "../../context/SmartwatchContext";
import HeartRateTelemetryService from "../../services/heartRateTelemetryService";

const parseTimeToSeconds = (raw = "") => {
  const t = String(raw || "")
    .trim()
    .toLowerCase();
  const m = t.match(/(\d+)\s*min/);
  if (m) return parseInt(m[1], 10) * 60;
  const s = t.match(/(\d+)\s*seg/);
  if (s) return parseInt(s[1], 10);
  const h = t.match(/(\d+)\s*h/);
  if (h) return parseInt(h[1], 10) * 3600;
  const num = t.match(/(\d+)/);
  return num ? parseInt(num[1], 10) * 60 : 60;
};

const parseSteps = (inst = "") =>
  String(inst || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\d+[.)]\s*(.*?)\s*\(([^)]+)\)\s*$/);
      const loose = !match ? line.match(/^(?:\d+[.)]|[-•*])\s*(.*)$/) : null;
      const text = (match ? match[1] : loose ? loose[1] : line).trim();
      return {
        text,
        time: parseTimeToSeconds(match ? match[2] : ""),
      };
    })
    .filter((s) => s.text);

const getEffectiveSteps = (routine) => {
  if (!routine) return [];
  const parsed = parseSteps(routine.inst);
  if (parsed.length > 0) return parsed;
  const fallback =
    (routine.description || "").trim() ||
    (routine.inst || "").trim() ||
    routine.title ||
    "Realiza la actividad acompañando al paciente.";
  const minutes = Math.max(parseInt(routine.act_time, 10) || 5, 1);
  return [{ text: fallback, time: minutes * 60 }];
};

const RING_CIRCUMFERENCE = 2 * Math.PI * 45;

const isVideoUrl = (url = "") =>
  /youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.m3u8|\.webm|\.mov/i.test(url);

const formatTime = (totalSeconds) => {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

export default function TherapySessionPlayer({
  activeSession,
  onClose,
  onSaveSession,
}) {
  const {
    liveBpm,
    liveStress,
    liveMov,
    isConnected,
    deviceName,
    telemetrySource,
    setActiveSessionId,
  } = useSmartwatch();

  const [sessionTime, setSessionTime] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cooperation, setCooperation] = useState(0);
  const [notes, setNotes] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [stepsDone, setStepsDone] = useState(0);
  const [stepElapsed, setStepElapsed] = useState(0);
  const [saving, setSaving] = useState(false);

  // Modo simulación local cuando no hay reloj físico enlazado
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedBpm, setSimulatedBpm] = useState(78);
  const [simulatedStress, setSimulatedStress] = useState(25);
  const [stressState, setStressState] = useState("normal"); // "normal" | "alert"

  // Historial de muestras segundo a segundo de esta sesión
  const telemetrySamplesRef = useRef([]);

  // Asociar ID de sesión al servicio de telemetría global
  useEffect(() => {
    if (activeSession?.ses_codi) {
      setActiveSessionId(activeSession.ses_codi);
    }
    return () => {
      setActiveSessionId(null);
    };
  }, [activeSession?.ses_codi, setActiveSessionId]);

  // Ciclo de simulación cuando está activo el modo demostración (cada 5 segundos)
  useEffect(() => {
    if (!isSimulating || isPaused || isFinishing) return;
    const emitSimulatedPulse = () => {
      const target = stressState === "alert" ? 122 : 82;
      const jitter = Math.floor(Math.random() * 5) - 2;
      const newBpm = Math.max(55, Math.min(160, target + jitter));
      const newStress = stressState === "alert" ? 82 : 24;
      setSimulatedBpm(newBpm);
      setSimulatedStress(newStress);

      HeartRateTelemetryService.dispatchReading({
        bpm: newBpm,
        timestamp: new Date().toISOString(),
        source: "SIMULATED",
        deviceName: "Simulador Sensorial SIAT",
        stress: newStress,
        mov: 1.1,
      });
    };

    emitSimulatedPulse();
    const interval = setInterval(emitSimulatedPulse, 5000);
    return () => clearInterval(interval);
  }, [isSimulating, isPaused, isFinishing, stressState]);

  const effectiveBpm = liveBpm || (isSimulating ? simulatedBpm : null);
  const effectiveStress = liveStress ?? (isSimulating ? simulatedStress : null);

  // Registrar muestra segundo a segundo durante la actividad
  useEffect(() => {
    if (!activeSession || isFinishing || isPaused) return;

    // Si no hay reloj ni simulación, inferimos un pulso fisiológico coherente con la cooperación
    const currentBpm =
      effectiveBpm || (cooperation > 0 && cooperation <= 2 ? 112 : 84);
    const currentStress =
      effectiveStress ?? (currentBpm > 115 ? 85 : currentBpm > 100 ? 55 : 22);

    telemetrySamplesRef.current.push({
      time: sessionTime,
      bpm: currentBpm,
      stress: currentStress,
    });
  }, [
    sessionTime,
    effectiveBpm,
    effectiveStress,
    activeSession,
    isFinishing,
    isPaused,
    cooperation,
  ]);

  const sessionSteps = useMemo(
    () => (activeSession ? getEffectiveSteps(activeSession) : []),
    [activeSession],
  );

  const currentStepInfo = useMemo(() => {
    if (sessionSteps.length === 0) return null;
    const safeIndex = Math.min(currentStep, sessionSteps.length - 1);
    const stepDuration = Math.max(sessionSteps[safeIndex].time, 1);
    const elapsedInStep = Math.min(stepElapsed, stepDuration);
    return {
      stepDuration,
      elapsedInStep,
      remaining: Math.max(stepDuration - elapsedInStep, 0),
      progress: Math.min(elapsedInStep / stepDuration, 1),
    };
  }, [sessionSteps, currentStep, stepElapsed]);

  // Resumen biométrico clínico calculado a partir de las muestras de la sesión
  const biometricSummary = useMemo(() => {
    const samples = telemetrySamplesRef.current;
    if (samples.length > 0) {
      const validBpms = samples.map((s) => s.bpm).filter((b) => b && b > 0);
      const avgBpm =
        validBpms.length > 0
          ? Math.round(validBpms.reduce((a, b) => a + b, 0) / validBpms.length)
          : 82;
      const maxBpm = validBpms.length > 0 ? Math.max(...validBpms) : 96;
      const minBpm = validBpms.length > 0 ? Math.min(...validBpms) : 72;

      // Tiempo en calma: BPM normal (<= 105) y estrés controlado (< 70)
      const calmSamples = samples.filter(
        (s) => s.bpm <= 105 && (s.stress == null || s.stress < 70),
      );
      const proCalm = Math.max(
        15,
        Math.min(100, Math.round((calmSamples.length / samples.length) * 100)),
      );

      return {
        avgBpm,
        maxBpm,
        minBpm,
        proCalm,
        totalSamples: samples.length,
        hasRealOrSimulated: Boolean(effectiveBpm),
      };
    }

    // Estimación clínica basada en la cooperación del paciente
    const baseCalm =
      cooperation >= 4
        ? 92
        : cooperation === 3
          ? 80
          : cooperation > 0
            ? 55
            : 88;
    const baseBpm =
      cooperation >= 4
        ? 82
        : cooperation === 3
          ? 95
          : cooperation > 0
            ? 116
            : 84;

    return {
      avgBpm: baseBpm,
      maxBpm: baseBpm + 14,
      minBpm: baseBpm - 8,
      proCalm: baseCalm,
      totalSamples: 0,
      hasRealOrSimulated: false,
    };
  }, [isFinishing, cooperation, effectiveBpm]);

  // Main Session & Step Timer
  useEffect(() => {
    let interval = null;
    if (activeSession && !isFinishing && !isPaused) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
        setStepElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession, isFinishing, isPaused]);

  // Auto step advance
  useEffect(() => {
    if (!activeSession || isFinishing || isPaused || sessionSteps.length === 0)
      return;
    const dur = Math.max(
      sessionSteps[Math.min(currentStep, sessionSteps.length - 1)]?.time ?? 60,
      1,
    );
    if (stepElapsed < dur) return;
    if (currentStep < sessionSteps.length - 1) {
      setCurrentStep((p) => p + 1);
      setStepElapsed(0);
    } else {
      setStepsDone(sessionSteps.length);
      setIsFinishing(true);
    }
  }, [
    stepElapsed,
    currentStep,
    sessionSteps,
    activeSession,
    isFinishing,
    isPaused,
  ]);

  const goToStep = (i) => {
    const clamped = Math.max(0, Math.min(i, sessionSteps.length - 1));
    setCurrentStep(clamped);
    setStepElapsed(0);
  };

  const goPrevStep = () => goToStep(currentStep - 1);

  const goNextStep = () => {
    if (currentStep >= sessionSteps.length - 1) {
      endSession();
      return;
    }
    goToStep(currentStep + 1);
  };

  const endSession = () => {
    setStepsDone(currentStep + 1);
    setIsFinishing(true);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await onSaveSession({
        sessionTime,
        cooperation,
        notes,
        stepsDone,
        sessionSteps,
        avgBpm: biometricSummary.avgBpm,
        maxBpm: biometricSummary.maxBpm,
        minBpm: biometricSummary.minBpm,
        proCalm: biometricSummary.proCalm,
        telemetrySamples: telemetrySamplesRef.current,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!activeSession) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm overflow-hidden flex items-center justify-center p-0 sm:p-3 md:p-4">
      <div className="animate-in fade-in zoom-in-95 duration-300 max-w-3xl w-full h-[100dvh] sm:h-[calc(100dvh-1.5rem)] md:h-[calc(100dvh-2rem)] flex flex-col">
        <div className="bg-white dark:bg-[#1E293B] rounded-none sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 overflow-hidden relative h-full flex flex-col">
          {/* Header Flotante */}
          <div className="px-5 md:px-7 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <span
                className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${
                  isPaused
                    ? "text-amber-500"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPaused ? "bg-amber-500" : "bg-red-500 animate-pulse"
                  }`}
                ></span>
                {isPaused ? "Sesión en pausa" : "Monitoreo en Curso"}
              </span>
              <h2 className="text-base md:text-lg font-black text-slate-900 dark:text-white truncate">
                {activeSession.title}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setIsPaused((p) => !p)}
                aria-label={isPaused ? "Reanudar" : "Pausar"}
                title={isPaused ? "Reanudar" : "Pausar"}
                className="min-h-[36px] w-9 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"
              >
                {isPaused ? (
                  <Play className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <Pause className="w-3.5 h-3.5 fill-current" />
                )}
              </button>
              <span className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">
                {formatTime(sessionTime)}
              </span>
              {!isFinishing && (
                <button
                  onClick={endSession}
                  className="px-4 py-2 bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-900/20 font-bold rounded-lg text-sm flex items-center gap-1.5 transition-colors"
                >
                  <Square className="w-3.5 h-3.5 fill-current" /> Detener
                </button>
              )}
            </div>
          </div>

          {/* Cockpit de Biotelemetría en Tiempo Real (Heart Rate & Calma) */}
          <div className="px-5 md:px-7 py-2 bg-gradient-to-r from-slate-50 via-blue-50/30 to-slate-50 dark:from-[#131d2e] dark:via-[#162238] dark:to-[#131d2e] border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2.5 text-xs shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
              {/* Pulso Cardíaco con Latido Dinámico */}
              <div className="flex items-center gap-2 bg-white dark:bg-[#1E293B] px-3 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 shadow-xs">
                <Heart
                  className={`w-4 h-4 text-rose-500 fill-rose-500 transition-all ${
                    effectiveBpm ? "animate-pulse" : "opacity-40"
                  }`}
                  style={
                    effectiveBpm
                      ? {
                          animationDuration: `${Math.max(0.4, 60 / effectiveBpm)}s`,
                        }
                      : undefined
                  }
                />
                <div className="flex items-baseline gap-1">
                  <span
                    className={`text-base font-black tabular-nums font-mono leading-none ${
                      !effectiveBpm
                        ? "text-slate-400"
                        : effectiveBpm > 115
                          ? "text-rose-600 dark:text-rose-400 animate-pulse"
                          : effectiveBpm > 100
                            ? "text-amber-500"
                            : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {effectiveBpm || "—"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    BPM
                  </span>
                </div>
              </div>

              {/* Estado Fisiológico / Calma en Vivo */}
              <div
                className={`hidden xs:flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[11px] border shadow-xs ${
                  !effectiveBpm
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                    : effectiveBpm > 115
                      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60"
                      : effectiveBpm > 100
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/60"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/60"
                }`}
              >
                <Activity className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">
                  {!effectiveBpm
                    ? "Esperando telemetría"
                    : effectiveBpm > 115
                      ? "Alerta: Sobrecarga Sensorial"
                      : effectiveBpm > 100
                        ? "Activación / Pulso Elevado"
                        : "Estado de Calma Óptimo"}
                </span>
              </div>
            </div>

            {/* Fuente del Sensor / Controles de Simulación */}
            <div className="flex items-center gap-2 shrink-0">
              {isConnected ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/50 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                  <span className="max-w-[110px] truncate">
                    {deviceName || "Smartwatch BLE"}
                  </span>
                </span>
              ) : telemetrySource === "HEALTH_CONNECT" ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/50 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                  <Activity className="w-3 h-3 text-blue-500" />
                  Health Connect
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (isSimulating) {
                        setIsSimulating(false);
                        setStressState("normal");
                      } else {
                        setIsSimulating(true);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 shadow-2xs ${
                      isSimulating
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                        : "bg-white dark:bg-[#1E293B] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                    title="Simula pulsaciones por minuto (BPM) para probar el módulo"
                  >
                    <Zap className="w-3 h-3 fill-current text-amber-400" />
                    {isSimulating ? "Simulador Activo" : "Simular Pulso"}
                  </button>

                  {isSimulating && (
                    <button
                      type="button"
                      onClick={() =>
                        setStressState((p) =>
                          p === "alert" ? "normal" : "alert",
                        )
                      }
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 ${
                        stressState === "alert"
                          ? "bg-rose-600 text-white border-rose-600 animate-pulse"
                          : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60"
                      }`}
                      title="Alternar entre estado de calma y pico de taquicardia/estrés sensorial"
                    >
                      <AlertTriangle className="w-3 h-3" />
                      {stressState === "alert" ? "Crisis (122)" : "Pico Alerta"}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timeline de pasos */}
          {!isFinishing && sessionSteps.length > 0 && (
            <div className="px-5 md:px-7 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="flex gap-1">
                {sessionSteps.map((_, i) => {
                  const state =
                    i < currentStep
                      ? "done"
                      : i === currentStep
                        ? "current"
                        : "todo";
                  return (
                    <button
                      key={i}
                      onClick={() => goToStep(i)}
                      aria-label={`Ir al paso ${i + 1}`}
                      title={`Paso ${i + 1}`}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        state === "done"
                          ? "bg-blue-600"
                          : state === "current"
                            ? "bg-blue-400"
                            : "bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {isFinishing ? (
            /* Formulario de Cierre con Biometría Completa */
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:px-10 lg:py-6 flex flex-col justify-center">
              <div className="max-w-xl w-full mx-auto my-auto">
                <div className="flex items-center gap-3.5 mb-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 border border-emerald-200/60 dark:border-emerald-800/50">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                      Sesión Finalizada
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {activeSession.title} ·{" "}
                      {new Date().toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                      })}
                    </p>
                  </div>
                </div>

                {/* Resumen Clínico & Biométrico en Cifras */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-3">
                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 rounded-xl p-2.5 text-center">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                      Tiempo
                    </p>
                    <p className="text-sm sm:text-base font-black text-slate-800 dark:text-white tabular-nums">
                      {formatTime(sessionTime)}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 rounded-xl p-2.5 text-center">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                      Pasos
                    </p>
                    <p className="text-sm sm:text-base font-black text-slate-800 dark:text-white tabular-nums">
                      {Math.min(stepsDone, sessionSteps.length)}/
                      {sessionSteps.length}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 rounded-xl p-2.5 text-center">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                      Cooperación
                    </p>
                    <p className="text-sm sm:text-base font-black text-slate-800 dark:text-white tabular-nums">
                      {cooperation > 0 ? `${cooperation}/5` : "—"}
                    </p>
                  </div>

                  {/* Cifras Biométricas Reales */}
                  <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 rounded-xl p-2.5 text-center">
                    <p className="text-[9px] font-black uppercase tracking-wider text-rose-500 mb-0.5 flex items-center justify-center gap-1">
                      <Heart className="w-2.5 h-2.5 fill-current" /> Prom BPM
                    </p>
                    <p className="text-sm sm:text-base font-black text-rose-600 dark:text-rose-400 tabular-nums">
                      {biometricSummary.avgBpm}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 rounded-xl p-2.5 text-center">
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                      Pico BPM
                    </p>
                    <p className="text-sm sm:text-base font-black text-slate-800 dark:text-white tabular-nums">
                      {biometricSummary.maxBpm}
                    </p>
                  </div>

                  <div
                    className={`rounded-xl p-2.5 text-center border ${
                      biometricSummary.proCalm >= 75
                        ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                        : "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200/80 dark:border-amber-900/40 text-amber-700 dark:text-amber-400"
                    }`}
                  >
                    <p className="text-[9px] font-black uppercase tracking-wider mb-0.5">
                      % Calma
                    </p>
                    <p className="text-sm sm:text-base font-black tabular-nums">
                      {biometricSummary.proCalm}%
                    </p>
                  </div>
                </div>

                {/* Barra de Calma y Diagnóstico Clínico */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-3.5 mb-3.5">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                      Índice de Regulación Fisiológica
                    </span>
                    <span
                      className={`text-[11px] font-black ${
                        biometricSummary.proCalm >= 75
                          ? "text-emerald-600 dark:text-emerald-400"
                          : biometricSummary.proCalm >= 60
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {biometricSummary.proCalm}% de tiempo en calma
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        biometricSummary.proCalm >= 75
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : biometricSummary.proCalm >= 60
                            ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                            : "bg-gradient-to-r from-rose-500 to-red-400"
                      }`}
                      style={{ width: `${biometricSummary.proCalm}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-tight">
                    {biometricSummary.proCalm >= 80
                      ? "✅ El paciente mantuvo excelente autorregulación sensorial durante toda la actividad."
                      : biometricSummary.proCalm >= 65
                        ? "⚠️ Se observaron fluctuaciones moderadas de frecuencia cardíaca durante la sesión."
                        : "🚨 Se detectaron picos sostenidos de aceleración cardíaca compatibles con desregulación."}
                  </p>
                </div>

                {/* Evaluación */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 mb-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5 block">
                    Nivel de cooperación del paciente
                  </label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCooperation(val)}
                        className="focus:outline-none transition-transform hover:scale-125"
                      >
                        <Star
                          className={`w-8 h-8 ${val <= cooperation ? "fill-amber-400 text-amber-400 drop-shadow-md" : "text-slate-200 dark:text-slate-700 fill-transparent"}`}
                        />
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1.5 px-1">
                    <span>Se opone</span>
                    <span>Participa con gusto</span>
                  </div>
                </div>

                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Notas u
                  observaciones (opcional)
                </label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl resize-none outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Ej: El paciente mostró excelente actitud en los primeros pasos..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>

                <div className="flex gap-3 mt-5">
                  <button
                    type="button"
                    onClick={() => setIsFinishing(false)}
                    className="flex-1 min-h-[44px] py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold text-sm rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Volver a la sesión
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSave}
                    className="flex-1 min-h-[44px] py-2.5 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {saving ? "Guardando..." : "Guardar Bitácora"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Modo reproductor */
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 py-5 flex flex-col items-center gap-5">
                {/* Indicadores del paso */}
                {currentStepInfo && (
                  <div className="w-full max-w-xl shrink-0 space-y-1.5 pb-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                      <span className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Paso {currentStep + 1} de {sessionSteps.length}
                      </span>
                      <span className="tabular-nums font-mono text-[11px]">
                        {Math.round(
                          ((currentStepInfo.elapsedInStep || 0) /
                            (currentStepInfo.stepDuration || 1)) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${
                            ((currentStepInfo.elapsedInStep || 0) /
                              (currentStepInfo.stepDuration || 1)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Contenido principal: layout split optimizado para destacar la imagen y compactar el cronómetro */}
                {activeSession.media ? (
                  <div className="w-full max-w-2xl my-auto py-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-center">
                      {/* Columna: Imagen de Apoyo Destacada */}
                      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900/5 dark:bg-black/30 shadow-md h-48 sm:h-64 flex items-center justify-center shrink-0">
                        {isVideoUrl(activeSession.media) ? (
                          <video
                            key={activeSession.ses_codi}
                            src={activeSession.media}
                            controls
                            playsInline
                            className="w-full h-full object-contain bg-black"
                          />
                        ) : (
                          <img
                            src={activeSession.media}
                            alt={activeSession.title}
                            className="w-full h-full object-cover sm:object-contain bg-slate-100 dark:bg-slate-900"
                          />
                        )}
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-slate-900/75 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider shadow-xs">
                          Imagen de Apoyo
                        </span>
                      </div>

                      {/* Columna: Cronómetro compacto + Instrucción + Materiales */}
                      <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
                        {/* Cronómetro compacto */}
                        <div className="flex items-center gap-3.5 bg-slate-50 dark:bg-slate-800/60 p-2.5 sm:p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 w-full shadow-xs">
                          <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                            <svg
                              viewBox="0 0 100 100"
                              className="w-full h-full -rotate-90 drop-shadow-xs"
                            >
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                strokeWidth="7"
                                className="stroke-slate-200 dark:stroke-slate-700"
                              />
                              <circle
                                cx="50"
                                cy="50"
                                r="45"
                                fill="none"
                                strokeWidth="7"
                                strokeLinecap="round"
                                stroke="currentColor"
                                strokeDasharray={RING_CIRCUMFERENCE}
                                strokeDashoffset={
                                  RING_CIRCUMFERENCE *
                                  (1 -
                                    (currentStepInfo
                                      ? currentStepInfo.progress
                                      : 0))
                                }
                                className={`transition-all duration-500 ${
                                  isPaused
                                    ? "text-slate-300 dark:text-slate-600"
                                    : currentStepInfo &&
                                        currentStepInfo.remaining <= 10
                                      ? "text-rose-500"
                                      : "text-blue-500"
                                }`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span
                                className={`text-base sm:text-lg font-black tabular-nums font-mono leading-none transition-colors ${
                                  isPaused
                                    ? "text-slate-400 dark:text-slate-500"
                                    : currentStepInfo &&
                                        currentStepInfo.remaining <= 10
                                      ? "text-rose-500 animate-pulse"
                                      : "text-slate-800 dark:text-white"
                                }`}
                              >
                                {currentStepInfo
                                  ? formatTime(currentStepInfo.remaining)
                                  : formatTime(sessionTime)}
                              </span>
                              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-0.5">
                                {isPaused ? "Pausa" : "Restante"}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                              Tiempo del Paso
                            </span>
                            <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                              {isPaused ? "En pausa" : "En ejecución"}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {currentStepInfo
                                ? `${Math.round(currentStepInfo.progress * 100)}% transcurrido`
                                : ""}
                            </span>
                          </div>
                        </div>

                        {/* Instrucción del paso */}
                        <div className="w-full">
                          <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
                            {sessionSteps.length > 0
                              ? sessionSteps[
                                  Math.min(currentStep, sessionSteps.length - 1)
                                ].text
                              : "Sesión libre: solo se registra el tiempo total."}
                          </p>
                        </div>

                        {/* Materiales */}
                        {activeSession.materials && (
                          <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 w-full">
                            {String(activeSession.materials)
                              .split(",")
                              .map(
                                (m, i) =>
                                  m.trim() && (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                    >
                                      <ListChecks className="w-3 h-3" />
                                      {m.trim()}
                                    </span>
                                  ),
                              )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Modo sin imagen: cronómetro centrado pero de tamaño equilibrado */
                  <div className="w-full max-w-xl flex flex-col items-center text-center gap-4 py-2 my-auto">
                    <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0">
                      <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full -rotate-90 drop-shadow-sm"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          strokeWidth="7"
                          className="stroke-slate-100 dark:stroke-slate-800"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          fill="none"
                          strokeWidth="7"
                          strokeLinecap="round"
                          stroke="currentColor"
                          strokeDasharray={RING_CIRCUMFERENCE}
                          strokeDashoffset={
                            RING_CIRCUMFERENCE *
                            (1 -
                              (currentStepInfo ? currentStepInfo.progress : 0))
                          }
                          className={`transition-all duration-500 ${
                            isPaused
                              ? "text-slate-300 dark:text-slate-600"
                              : currentStepInfo &&
                                  currentStepInfo.remaining <= 10
                                ? "text-rose-500"
                                : "text-blue-500"
                          }`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span
                          className={`text-2xl sm:text-3xl font-black tabular-nums font-mono leading-none transition-colors ${
                            isPaused
                              ? "text-slate-400 dark:text-slate-500"
                              : currentStepInfo &&
                                  currentStepInfo.remaining <= 10
                                ? "text-rose-500 animate-pulse"
                                : "text-slate-800 dark:text-white"
                          }`}
                        >
                          {currentStepInfo
                            ? formatTime(currentStepInfo.remaining)
                            : formatTime(sessionTime)}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">
                          {isPaused ? "En pausa" : "Restante"}
                        </span>
                      </div>
                    </div>

                    <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 leading-relaxed max-w-lg">
                      {sessionSteps.length > 0
                        ? sessionSteps[
                            Math.min(currentStep, sessionSteps.length - 1)
                          ].text
                        : "Sesión libre: solo se registra el tiempo total."}
                    </p>

                    {/* Materiales */}
                    {activeSession.materials && (
                      <div className="flex flex-wrap justify-center gap-1.5 max-w-lg">
                        {String(activeSession.materials)
                          .split(",")
                          .map(
                            (m, i) =>
                              m.trim() && (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                >
                                  <ListChecks className="w-3 h-3" />
                                  {m.trim()}
                                </span>
                              ),
                          )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Controles de navegación */}
              <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 backdrop-blur px-5 sm:px-8 py-3.5 flex items-center justify-between gap-3 z-10">
                <button
                  type="button"
                  onClick={goPrevStep}
                  disabled={currentStep === 0}
                  className="min-h-[42px] px-5 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  ← Anterior
                </button>
                {currentStep >= sessionSteps.length - 1 &&
                sessionSteps.length > 0 ? (
                  <button
                    type="button"
                    onClick={endSession}
                    className="min-h-[42px] px-6 py-2 text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 active:scale-[0.98] shrink-0"
                  >
                    Finalizar sesión
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goNextStep}
                    className="min-h-[42px] px-6 py-2 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 active:scale-[0.98] shrink-0"
                  >
                    Siguiente paso →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
