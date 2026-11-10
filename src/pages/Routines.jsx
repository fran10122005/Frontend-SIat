import { useState, useEffect, useRef, useMemo } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useGlobalContext } from "@/context/GlobalState";
import {
  Play,
  Clock,
  Plus,
  Video,
  Trash2,
  Pencil,
  AlertTriangle,
  ListChecks,
  X,
  Loader2,
  Lock,
  AlertCircle,
} from "lucide-react";

import Topbar from "@/components/layout/Topbar";
import api from "@/api/axios";
import Button from "@/components/ui/Button";
import Fab from "@/components/ui/Fab";
import FilterBar from "@/components/shared/FilterBar";
import TherapySessionPlayer from "@/components/shared/TherapySessionPlayer";
import ActivityBuilderModal from "@/components/shared/ActivityBuilderModal";
import { useSmartwatch } from "@/context/SmartwatchContext";
import { validateRequiredText, focusFirstError } from "@/utils/validators";

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
      // Formato canónico: "1. texto (2 min)"
      const match = line.match(/^\d+[.)]\s*(.*?)\s*\(([^)]+)\)\s*$/);
      // Tolerante: "1. texto" o "- texto"
      const loose = !match ? line.match(/^(?:\d+[.)]|[-•*])\s*(.*)$/) : null;
      const text = (match ? match[1] : loose ? loose[1] : line).trim();
      return {
        text,
        time: parseTimeToSeconds(match ? match[2] : ""),
      };
    })
    .filter((s) => s.text);

// Pasos efectivos: guía parseada o, en su defecto, un paso único con la
// descripción/título para que el reproductor siempre tenga contenido.
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

const DIFFICULTY_STYLES = {
  Baja: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  Media:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  Alta: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
};

// Circunferencia del anillo del cronómetro circular (r = 45 en viewBox 100)
const RING_CIRCUMFERENCE = 2 * Math.PI * 45;

import PageTitle from "../components/ui/PageTitle";

export default function Routines() {
  const {
    nomNino,
    showToast,
    userRole,
    routines,
    createRoutine,
    updateRoutine,
    deleteRoutine,
    categories,
    isRoutinesLoading,
    createCategory,
    updateCategory,
    deleteCategory,
    selectedChildId,
    activeChild,
    listaNinos = [],
    globalPeiGoals = [],
    crearPeiGoal,
    fetchHistorialCompleto,
  } = useGlobalContext();

  const { setActiveSessionId } = useSmartwatch();

  // Session State
  const [activeSession, setActiveSession] = useState(null);
  const [sessionTime, setSessionTime] = useState(0); // en segundos
  const [isFinishing, setIsFinishing] = useState(false);
  const [cooperation, setCooperation] = useState(0);
  const [notes, setNotes] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [previewRoutine, setPreviewRoutine] = useState(null);
  const [isPaused, setIsPaused] = useState(false);
  const [stepsDone, setStepsDone] = useState(0);
  const [stepElapsed, setStepElapsed] = useState(0); // segundos dentro del paso actual

  // --- Builder Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const isVideoUrl = (url = "") =>
    /youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.m3u8|\.webm|\.mov/i.test(url);

  const isGestion =
    userRole === "ESPECIALISTA" || userRole === "ADMIN_INSTITUCION";

  // --- Search filters ---
  const [filters, setFilters] = useState({
    busqueda: "",
    cat_codi: "",
    dificultad: "",
    estado: "",
    visibilidad: "",
  });

  const filteredRoutines = useMemo(() => {
    const q = filters.busqueda.trim().toLowerCase();
    return routines.filter((r) => {
      if (q) {
        const haystack =
          `${r.title} ${r.description} ${r.inst} ${r.category} ${r.materials}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.cat_codi && r.categoryCode !== filters.cat_codi) return false;
      if (filters.dificultad && r.difficulty !== filters.dificultad)
        return false;
      if (filters.estado && r.status !== filters.estado) return false;
      if (
        filters.visibilidad &&
        (r.visibility || "AMBOS") !== filters.visibilidad
      )
        return false;
      return true;
    });
  }, [routines, filters]);

  const clearFilters = () =>
    setFilters({
      busqueda: "",
      cat_codi: "",
      dificultad: "",
      estado: "",
      visibilidad: "",
    });

  // --- Category management modal ---
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ cat_nomb: "", cat_deta: "" });
  const [editingCat, setEditingCat] = useState(null);
  const [catDeleting, setCatDeleting] = useState(null);
  const [catErrors, setCatErrors] = useState({});
  const [isCatSaving, setIsCatSaving] = useState(false);
  const catFormRef = useRef(null);

  const openCatCreate = () => {
    setEditingCat(null);
    setCatForm({ cat_nomb: "", cat_deta: "" });
    setCatErrors({});
  };

  const openCatEdit = (cat) => {
    setEditingCat(cat);
    setCatForm({ cat_nomb: cat.cat_nomb, cat_deta: cat.cat_deta || "" });
    setCatErrors({});
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (isCatSaving) return;

    const errs = {};
    const nameErr = validateRequiredText(
      catForm.cat_nomb,
      "El nombre de la categoría",
      { min: 3, max: 50 },
    );
    if (nameErr) errs.cat_nomb = nameErr;

    if (String(catForm.cat_deta || "").trim().length > 2000) {
      errs.cat_deta = "La descripción no puede exceder 2000 caracteres";
    }

    if (Object.keys(errs).length > 0) {
      setCatErrors(errs);
      focusFirstError(errs, catFormRef);
      return;
    }

    const name = catForm.cat_nomb.trim();
    const detail = catForm.cat_deta.trim();
    setIsCatSaving(true);
    try {
      const res = editingCat
        ? await updateCategory(editingCat.cat_codi, {
            cat_nomb: name,
            cat_deta: detail || null,
          })
        : await createCategory(name, detail);

      if (res && res.ok === false) {
        if (res.fieldErrors && Object.keys(res.fieldErrors).length > 0) {
          setCatErrors(res.fieldErrors);
          focusFirstError(res.fieldErrors, catFormRef);
        }
        return;
      }
      openCatCreate();
    } finally {
      setIsCatSaving(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!cat) return;
    setCatDeleting(cat.cat_codi);
    await deleteCategory(cat.cat_codi);
    setCatDeleting(null);
  };

  useEffect(() => {
    if (!isCatModalOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsCatModalOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isCatModalOpen]);

  const openCreateModal = () => {
    setEditingRoutine(null);
    setIsModalOpen(true);
  };

  const openEditModal = (routine) => {
    setEditingRoutine(routine);
    setIsModalOpen(true);
  };

  const confirmDeleteRoutine = async () => {
    if (confirmDelete) {
      await deleteRoutine(confirmDelete);
      setConfirmDelete(null);
    }
  };

  // Theme observer
  useEffect(() => {
    // dark mode check removed
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (activeSession && !isFinishing && !isPaused) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
        setStepElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeSession, isFinishing, isPaused]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // --- Guía por pasos del monitor en vivo ---
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

  // Auto-avance por paso: cada paso corre su propio cronómetro; al agotarse
  // avanza al siguiente y, en el último, abre el cierre de sesión. La pausa
  // congela todo y la navegación manual reinicia el conteo del paso destino.
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
    setStepElapsed(0); // cada paso inicia su propio conteo en cero
  };
  const goPrevStep = () => goToStep(currentStep - 1);
  const goNextStep = () => {
    if (currentStep >= sessionSteps.length - 1) {
      endSession();
      return;
    }
    goToStep(currentStep + 1);
  };

  const startSession = async (routine) => {
    const targetChildId =
      selectedChildId ||
      activeChild?.nin_codi ||
      activeChild?.id_ninos ||
      listaNinos?.[0]?.nin_codi ||
      listaNinos?.[0]?.id_ninos;

    if (!targetChildId) {
      showToast("⚠️ Selecciona un paciente para iniciar la terapia.");
      return;
    }

    try {
      const res = await api.post("/sesiones/iniciar", {
        nin_codi: targetChildId,
        act_codi: routine.id,
      });
      const sesion = res.data.data;

      setActiveSession({
        ...routine,
        ses_codi: sesion.ses_codi,
      });
      if (sesion?.ses_codi) {
        setActiveSessionId(sesion.ses_codi);
      }
      setSessionTime(0);
      setCurrentStep(0);
      setStepElapsed(0);
      setIsFinishing(false);
      setIsPaused(false);
      setCooperation(0);
      setNotes("");
    } catch (err) {
      console.error("Error starting session on backend:", err);
      showToast("⚠️ No se pudo iniciar la sesión en el servidor.");

      setActiveSession({
        ...routine,
        ses_codi: "S_FALLBACK_" + Date.now().toString().slice(-4),
      });
      setSessionTime(0);
      setCurrentStep(0);
      setStepElapsed(0);
      setIsFinishing(false);
      setIsPaused(false);
      setCooperation(0);
      setNotes("");
    }
  };

  const endSession = () => {
    setStepsDone(currentStep + 1);
    setIsFinishing(true);
  };

  const saveSession = async ({
    sessionTime,
    cooperation,
    notes,
    stepsDone,
    sessionSteps,
    avgBpm,
    maxBpm,
    proCalm,
  }) => {
    try {
      const sesCodi = activeSession.ses_codi;
      const parsedNota = `[BPM Prom: ${avgBpm || 82} · Max: ${maxBpm || 96} · Calma: ${proCalm ?? 90}% · Cooperación: ${cooperation}/5 · Pasos: ${Math.min(
        stepsDone,
        sessionSteps.length,
      )}/${sessionSteps.length}] ${notes}`;
      await api.put(`/sesiones/${sesCodi}/cerrar`, {
        ses_nota: parsedNota,
        pro_calm: proCalm,
        ses_calm: proCalm,
        avg_bpm: avgBpm,
        max_bpm: maxBpm,
      });

      // Refrescar de inmediato el historial y evolución para que el gráfico de progreso del niño se actualice
      if (selectedChildId && typeof fetchHistorialCompleto === "function") {
        fetchHistorialCompleto(selectedChildId);
      }

      showToast(
        `✅ Sesión guardada. Calma: ${proCalm ?? 90}% · Pulso Prom: ${avgBpm || 82} BPM.`,
      );
    } catch (err) {
      console.error("Error closing session on backend:", err);
      showToast(
        "⚠️ Error al registrar el cierre de la sesión en la base de datos.",
      );
    }
    setActiveSession(null);
    setActiveSessionId(null);
  };

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Topbar */}
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6 pb-12">
            {/* Si no hay sesión activa: Mostrar lista de rutinas */}
            {!activeSession && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div className="flex flex-col gap-1" data-tour="rt-header">
                    <PageTitle icon={ListChecks}>
                      Terapias y Actividades
                    </PageTitle>
                    <p className="hidden sm:block text-sm text-slate-500 mt-1 line-clamp-1">
                      Selecciona una rutina para iniciar el monitoreo clínico
                      para {nomNino || "el paciente"}.
                    </p>
                  </div>
                  {isGestion && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Plus className="w-4 h-4" />}
                      onClick={openCreateModal}
                      className="hidden md:inline-flex"
                    >
                      Crear Nueva Terapia
                    </Button>
                  )}
                </div>

                {/* Toolbar: Categorías + Filtros */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-4">
                  {isGestion && (
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<ListChecks className="w-4 h-4" />}
                      onClick={() => {
                        openCatCreate();
                        setIsCatModalOpen(true);
                      }}
                      title="Gestionar categorías de actividades"
                      className="shrink-0"
                    >
                      Categorías
                    </Button>
                  )}
                  <FilterBar
                    searchValue={filters.busqueda}
                    onSearch={(v) => setFilters({ ...filters, busqueda: v })}
                    searchPlaceholder="Buscar por nombre, descripción o materiales…"
                    activeCount={
                      (filters.busqueda ? 1 : 0) +
                      (filters.cat_codi ? 1 : 0) +
                      (filters.dificultad ? 1 : 0) +
                      (filters.estado ? 1 : 0) +
                      (filters.visibilidad ? 1 : 0)
                    }
                    onClearAll={clearFilters}
                    chips={[
                      filters.cat_codi && {
                        key: "cat_codi",
                        label:
                          categories.find(
                            (c) => c.cat_codi === filters.cat_codi,
                          )?.cat_nomb || filters.cat_codi,
                        onRemove: () =>
                          setFilters({ ...filters, cat_codi: "" }),
                      },
                      filters.dificultad && {
                        key: "dificultad",
                        label: `Dificultad: ${filters.dificultad}`,
                        onRemove: () =>
                          setFilters({ ...filters, dificultad: "" }),
                      },
                      filters.estado && {
                        key: "estado",
                        label: `Estado: ${filters.estado}`,
                        onRemove: () => setFilters({ ...filters, estado: "" }),
                      },
                      filters.visibilidad && {
                        key: "visibilidad",
                        label:
                          filters.visibilidad === "ESPECIALISTA"
                            ? "Solo Especialista"
                            : "Especialista y Representante",
                        onRemove: () =>
                          setFilters({ ...filters, visibilidad: "" }),
                      },
                    ].filter(Boolean)}
                  >
                    <select
                      value={filters.cat_codi}
                      onChange={(e) =>
                        setFilters({ ...filters, cat_codi: e.target.value })
                      }
                      className="w-full sm:w-auto px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Todas las categorías</option>
                      {categories.map((c) => (
                        <option key={c.cat_codi} value={c.cat_codi}>
                          {c.cat_nomb}
                        </option>
                      ))}
                    </select>

                    <select
                      value={filters.dificultad}
                      onChange={(e) =>
                        setFilters({ ...filters, dificultad: e.target.value })
                      }
                      className="w-full sm:w-auto px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Toda dificultad</option>
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                    </select>

                    <select
                      value={filters.estado}
                      onChange={(e) =>
                        setFilters({ ...filters, estado: e.target.value })
                      }
                      className="w-full sm:w-auto px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">Todo estado</option>
                      <option value="Activa">Activas</option>
                      <option value="Inactiva">Inactivas</option>
                    </select>

                    {isGestion && (
                      <select
                        value={filters.visibilidad}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            visibilidad: e.target.value,
                          })
                        }
                        className="w-full sm:w-auto px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      >
                        <option value="">Toda visibilidad</option>
                        <option value="AMBOS">
                          Especialista y Representante
                        </option>
                        <option value="ESPECIALISTA">Solo Especialista</option>
                      </select>
                    )}
                  </FilterBar>
                </div>

                <div
                  data-tour="rt-catalog"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5"
                >
                  {isRoutinesLoading && routines.length === 0 ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="rounded-3xl border border-slate-200 dark:border-slate-800/60 p-6 animate-pulse bg-white dark:bg-[#1E293B]"
                      >
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-md mb-5" />
                        <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-md mb-3" />
                        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-md mb-2" />
                        <div className="h-4 w-2/3 bg-slate-100 dark:bg-slate-800 rounded-md mb-8" />
                        <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded-xl" />
                      </div>
                    ))
                  ) : routines.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                        <ListChecks className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                      </div>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1">
                        Aún no hay terapias
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                        {isGestion
                          ? `Crea la primera terapia o actividad terapéutica para comenzar el monitoreo clínico de ${
                              nomNino || "tu paciente"
                            }.`
                          : `Aún no hay actividades asignadas para ${
                              nomNino || "el paciente"
                            }.`}
                      </p>
                    </div>
                  ) : filteredRoutines.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-5">
                        <X className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                      </div>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1">
                        Sin resultados
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
                        Ninguna terapia coincide con los filtros aplicados.{" "}
                        <button
                          onClick={clearFilters}
                          className="text-blue-600 dark:text-blue-400 font-bold hover:underline"
                        >
                          Limpiar filtros
                        </button>
                        .
                      </p>
                    </div>
                  ) : (
                    filteredRoutines.map((routine) => (
                      <div
                        key={routine.id}
                        role={isGestion ? "button" : undefined}
                        tabIndex={isGestion ? 0 : undefined}
                        aria-label={
                          isGestion
                            ? `Iniciar sesión en vivo: ${routine.title}`
                            : routine.title
                        }
                        onClick={
                          isGestion
                            ? () => setPreviewRoutine(routine)
                            : undefined
                        }
                        onKeyDown={(e) => {
                          if (
                            isGestion &&
                            (e.key === "Enter" || e.key === " ")
                          ) {
                            e.preventDefault();
                            setPreviewRoutine(routine);
                          }
                        }}
                        data-tour="rt-live"
                        className="group bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <div className="flex justify-between items-start mb-2.5 gap-2">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-lg truncate">
                            {routine.category}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {routine.sessionCount > 0 && (
                              <span
                                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-md flex items-center gap-1"
                                title="Sesiones realizadas"
                              >
                                <ListChecks className="w-3 h-3" />{" "}
                                {routine.sessionCount}
                              </span>
                            )}
                            <span className="text-[11px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                              <Clock className="w-3 h-3" />{" "}
                              {routine.durationStr}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 mb-1.5">
                          <h3 className="text-base font-black text-slate-800 dark:text-white leading-tight line-clamp-2 flex-1 min-w-0">
                            {routine.title}
                          </h3>
                          {isGestion &&
                            routine.visibility === "ESPECIALISTA" && (
                              <span
                                title="Visible solo para el especialista (oculta al representante)"
                                className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200/80 dark:border-amber-800/50 px-1.5 py-0.5 rounded-md shrink-0 mt-0.5"
                              >
                                <Lock className="w-2.5 h-2.5" /> Solo Esp.
                              </span>
                            )}
                          {routine.status === "Inactiva" && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md shrink-0 mt-0.5">
                              Inactiva
                            </span>
                          )}
                        </div>

                        {routine.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mb-1 line-clamp-1">
                            {routine.description}
                          </p>
                        )}

                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed font-medium mb-2">
                          {routine.inst || "Sin instrucciones registradas."}
                        </p>

                        {routine.media && !isVideoUrl(routine.media) && (
                          <img
                            src={routine.media}
                            alt={routine.title}
                            loading="lazy"
                            className="w-full h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700 mb-2"
                          />
                        )}
                        {routine.media && isVideoUrl(routine.media) && (
                          <a
                            href={routine.media}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-2 py-1 rounded-lg w-fit mb-2"
                          >
                            <Video className="w-3 h-3" /> Video de referencia
                          </a>
                        )}
                        {routine.materials && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5 mb-3">
                            <ListChecks className="w-3 h-3 mt-0.5 shrink-0" />
                            <span className="line-clamp-1">
                              Materiales: {routine.materials}
                            </span>
                          </p>
                        )}

                        <div className="mt-auto flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                          <span
                            className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border ${DIFFICULTY_STYLES[routine.difficulty] || DIFFICULTY_STYLES.Baja}`}
                          >
                            {routine.difficulty}
                          </span>
                          <div className="flex items-center gap-1">
                            {isGestion && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditModal(routine);
                                }}
                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                title="Editar terapia"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            {isGestion && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDelete(routine.id);
                                }}
                                className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                                title="Eliminar terapia"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {isGestion && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startSession(routine);
                                }}
                                title="Iniciar sesión ahora"
                                className="ml-1 w-9 h-9 rounded-full bg-brand-600 hover:bg-brand-700 text-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all shrink-0"
                              >
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {isGestion && !activeSession && (
              <Fab onClick={openCreateModal} label="Crear Nueva Terapia" />
            )}

            {/* Si hay sesión activa: Live Monitor con TherapySessionPlayer */}
            <TherapySessionPlayer
              activeSession={activeSession}
              onClose={() => setActiveSession(null)}
              onSaveSession={saveSession}
            />

            <ActivityBuilderModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setEditingRoutine(null);
              }}
              editingRoutine={editingRoutine}
              categories={categories}
              selectedChildId={selectedChildId}
              childName={nomNino}
              globalPeiGoals={globalPeiGoals}
              createRoutine={createRoutine}
              updateRoutine={updateRoutine}
              crearPeiGoal={crearPeiGoal}
              showToast={showToast}
            />

            {/* Vista previa de pasos antes de iniciar la sesión */}
            {previewRoutine && (
              <div
                className="fixed inset-0 z-[125] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
                onClick={() => setPreviewRoutine(null)}
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-lg bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col overflow-hidden"
                >
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 shrink-0">
                    <div className="min-w-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">
                        Vista previa de la sesión
                      </span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">
                        {previewRoutine.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                        {previewRoutine.category} •{" "}
                        {previewRoutine.difficulty || "Baja"}
                      </p>
                    </div>
                    <button
                      onClick={() => setPreviewRoutine(null)}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="px-6 py-4 overflow-y-auto flex-1 space-y-4">
                    {previewRoutine.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {previewRoutine.description}
                      </p>
                    )}

                    {previewRoutine.materials && (
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">
                          Materiales necesarios
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {String(previewRoutine.materials)
                            .split(",")
                            .map(
                              (m, i) =>
                                m.trim() && (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
                                  >
                                    {m.trim()}
                                  </span>
                                ),
                            )}
                        </div>
                      </div>
                    )}

                    <ol className="space-y-2">
                      {getEffectiveSteps(previewRoutine).map((s, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40"
                        >
                          <span className="shrink-0 w-6 h-6 rounded-full bg-brand-500 text-white text-[11px] font-black flex items-center justify-center">
                            {i + 1}
                          </span>
                          <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">
                            {s.text}
                          </span>
                          <span className="shrink-0 text-xs font-black text-slate-400 tabular-nums flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(s.time)}
                          </span>
                        </li>
                      ))}
                    </ol>

                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 pt-1">
                      <span>
                        {getEffectiveSteps(previewRoutine).length} pasos
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Duración estimada:{" "}
                        {formatTime(
                          getEffectiveSteps(previewRoutine).reduce(
                            (a, s) => a + Math.max(s.time, 1),
                            0,
                          ),
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
                    <button
                      onClick={() => setPreviewRoutine(null)}
                      className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        const r = previewRoutine;
                        setPreviewRoutine(null);
                        startSession(r);
                      }}
                      className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-blue-600 hover:from-brand-600 hover:to-blue-700 text-white text-sm font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" /> Iniciar Sesión
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de confirmación de eliminación */}
            {confirmDelete && (
              <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
                <div className="w-full max-w-md bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center mb-5 mx-auto">
                    <AlertTriangle className="w-8 h-8 text-rose-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">
                    ¿Eliminar esta terapia?
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium mb-8">
                    Esta acción no se puede deshacer. Si la terapia tiene
                    sesiones registradas, quedará como inactiva.
                  </p>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={confirmDeleteRoutine}
                      className="flex-1 py-3.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/30 transition-all"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal de gestión de categorías */}
            {isCatModalOpen && (
              <div
                className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6"
                onClick={() => setIsCatModalOpen(false)}
              >
                <div
                  className="w-full max-w-lg bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">
                        {editingCat
                          ? "Editar Categoría"
                          : "Gestionar Categorías"}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 font-medium">
                        {editingCat
                          ? "Modifica el nombre o la descripción de la categoría."
                          : "Crea, edita o elimina las categorías de actividades."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsCatModalOpen(false)}
                      className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form
                    ref={catFormRef}
                    noValidate
                    onSubmit={handleSaveCategory}
                    className="mb-6"
                  >
                    <div className="space-y-4">
                      <div className="space-y-2" data-field="cat_nomb">
                        <div className="flex items-center justify-between gap-2">
                          <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">
                            Nombre de la Categoría{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <span
                            className={`text-[10px] font-semibold tabular-nums ${
                              catForm.cat_nomb.length >= 50
                                ? "text-rose-500"
                                : "text-slate-400"
                            }`}
                          >
                            {catForm.cat_nomb.length}/50
                          </span>
                        </div>
                        <input
                          type="text"
                          name="cat_nomb"
                          maxLength={50}
                          value={catForm.cat_nomb}
                          onChange={(e) => {
                            setCatForm({
                              ...catForm,
                              cat_nomb: e.target.value,
                            });
                            if (catErrors.cat_nomb) {
                              setCatErrors((p) => ({ ...p, cat_nomb: "" }));
                            }
                          }}
                          aria-invalid={Boolean(catErrors.cat_nomb)}
                          placeholder="Ej. Sensorial, Motricidad, Cognitiva…"
                          className={`w-full px-5 py-3.5 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all ${
                            catErrors.cat_nomb ? "form-input-invalid" : ""
                          }`}
                        />
                        {catErrors.cat_nomb && (
                          <p role="alert" className="form-error">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{catErrors.cat_nomb}</span>
                          </p>
                        )}
                      </div>
                      <div className="space-y-2" data-field="cat_deta">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">
                          Descripción (Opcional)
                        </label>
                        <textarea
                          rows="2"
                          name="cat_deta"
                          maxLength={2000}
                          value={catForm.cat_deta}
                          onChange={(e) => {
                            setCatForm({
                              ...catForm,
                              cat_deta: e.target.value,
                            });
                            if (catErrors.cat_deta) {
                              setCatErrors((p) => ({ ...p, cat_deta: "" }));
                            }
                          }}
                          aria-invalid={Boolean(catErrors.cat_deta)}
                          placeholder="Breve descripción de la categoría…"
                          className={`w-full px-5 py-3.5 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all resize-none ${
                            catErrors.cat_deta ? "form-input-invalid" : ""
                          }`}
                        />
                        {catErrors.cat_deta && (
                          <p role="alert" className="form-error">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{catErrors.cat_deta}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={isCatSaving}
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                        >
                          {isCatSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />{" "}
                              Guardando...
                            </>
                          ) : editingCat ? (
                            <>
                              <Pencil className="w-4 h-4" /> Guardar Cambios
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" /> Crear Categoría
                            </>
                          )}
                        </button>
                        {editingCat && (
                          <button
                            type="button"
                            onClick={openCatCreate}
                            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </form>

                  <div className="flex-1 overflow-y-auto space-y-2.5">
                    {categories.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-8 font-medium">
                        Aún no hay categorías. Crea la primera.
                      </p>
                    ) : (
                      categories.map((cat) => (
                        <div
                          key={cat.cat_codi}
                          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border ${
                            cat.cat_estd === false
                              ? "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 opacity-70"
                              : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#1E293B]"
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">
                              {cat.cat_nomb}
                              {cat.cat_estd === false && (
                                <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                  Inactiva
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {cat.cat_deta ||
                                `${cat._count?.tm_activ || 0} actividad(es)`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => openCatEdit(cat)}
                              className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                              title="Editar categoría"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={catDeleting === cat.cat_codi}
                              onClick={() => handleDeleteCategory(cat)}
                              className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-50"
                              title="Eliminar (desactivar)"
                            >
                              {catDeleting === cat.cat_codi ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
