import { useState, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle2,
  Star,
  MessageSquare,
  ListChecks,
} from "lucide-react";

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
  const [sessionTime, setSessionTime] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [cooperation, setCooperation] = useState(0);
  const [notes, setNotes] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [stepsDone, setStepsDone] = useState(0);
  const [stepElapsed, setStepElapsed] = useState(0);
  const [saving, setSaving] = useState(false);

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
          <div className="px-5 md:px-7 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
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

          {/* Timeline de pasos */}
          {!isFinishing && sessionSteps.length > 0 && (
            <div className="px-5 md:px-7 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
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
            /* Formulario de Cierre */
            <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:px-10 lg:py-6 flex flex-col justify-center">
              <div className="max-w-xl w-full mx-auto my-auto">
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
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

                {/* Resumen en cifras */}
                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                      Tiempo
                    </p>
                    <p className="text-base sm:text-lg font-black text-slate-800 dark:text-white tabular-nums">
                      {formatTime(sessionTime)}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                      Pasos
                    </p>
                    <p className="text-base sm:text-lg font-black text-slate-800 dark:text-white tabular-nums">
                      {Math.min(stepsDone, sessionSteps.length)}/
                      {sessionSteps.length}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl p-3 text-center">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">
                      Cooperación
                    </p>
                    <p className="text-base sm:text-lg font-black text-slate-800 dark:text-white tabular-nums">
                      {cooperation > 0 ? `${cooperation}/5` : "—"}
                    </p>
                  </div>
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
              <div className="flex-1 min-h-0 overflow-y-auto px-6 sm:px-10 py-4 flex flex-col items-center justify-between">
                {/* Indicadores del paso */}
                {currentStepInfo && (
                  <div className="w-full max-w-xl shrink-0">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span className="text-[11px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        Paso {currentStep + 1} de {sessionSteps.length}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{
                          width: `${
                            (currentStepInfo.elapsedInStep /
                              currentStepInfo.stepDuration) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Cronómetro circular + instrucción */}
                <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center py-2 w-full my-auto">
                  <div className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 shrink-0">
                    <svg
                      viewBox="0 0 100 100"
                      className="w-full h-full -rotate-90"
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
                          (1 - (currentStepInfo ? currentStepInfo.progress : 0))
                        }
                        className={`transition-all duration-500 ${
                          isPaused
                            ? "text-slate-300 dark:text-slate-600"
                            : currentStepInfo && currentStepInfo.remaining <= 10
                              ? "text-rose-500"
                              : "text-blue-500"
                        }`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span
                        className={`text-3xl sm:text-4xl md:text-5xl font-black tabular-nums font-mono leading-none transition-colors ${
                          isPaused
                            ? "text-slate-400 dark:text-slate-500"
                            : currentStepInfo && currentStepInfo.remaining <= 10
                              ? "text-rose-500 animate-pulse"
                              : "text-slate-800 dark:text-white"
                        }`}
                      >
                        {currentStepInfo
                          ? formatTime(currentStepInfo.remaining)
                          : formatTime(sessionTime)}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1.5">
                        {isPaused ? "En pausa" : "Restante"}
                      </span>
                    </div>
                  </div>

                  <p className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl font-bold text-slate-700 dark:text-slate-200 leading-relaxed max-w-lg">
                    {sessionSteps.length > 0
                      ? sessionSteps[
                          Math.min(currentStep, sessionSteps.length - 1)
                        ].text
                      : "Sesión libre: solo se registra el tiempo total."}
                  </p>

                  {/* Materiales */}
                  {activeSession.materials && (
                    <div className="flex flex-wrap justify-center gap-1.5 mt-3 max-w-lg">
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

                  {/* Multimedia */}
                  {activeSession.media && (
                    <div className="w-full max-w-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 mt-3 max-h-40 sm:max-h-48">
                      {isVideoUrl(activeSession.media) ? (
                        <video
                          key={activeSession.ses_codi}
                          src={activeSession.media}
                          controls
                          playsInline
                          className="w-full h-full max-h-40 sm:max-h-48 bg-black object-contain"
                        />
                      ) : (
                        <img
                          src={activeSession.media}
                          alt={activeSession.title}
                          className="w-full h-full max-h-40 sm:max-h-48 object-cover"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Controles de navegación */}
              <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 backdrop-blur px-4 sm:px-8 py-3 [padding-bottom:max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={goPrevStep}
                  disabled={currentStep === 0}
                  className="min-h-[44px] px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  ← Anterior
                </button>
                {currentStep >= sessionSteps.length - 1 &&
                sessionSteps.length > 0 ? (
                  <button
                    type="button"
                    onClick={endSession}
                    className="min-h-[44px] px-6 py-2.5 text-sm font-bold rounded-xl bg-brand-700 hover:bg-brand-800 text-white border border-brand-800/40 shadow-sm transition-colors flex items-center gap-2 active:scale-[0.98]"
                  >
                    Finalizar sesión
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={goNextStep}
                    className="min-h-[44px] px-6 py-2.5 text-sm font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors flex items-center gap-2 active:scale-[0.98]"
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
