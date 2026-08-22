import { useState, useEffect, useRef, useMemo } from "react";
import Sidebar from "../components/layout/Sidebar";
import { useGlobalContext } from "../context/GlobalState";
import {
  Play,
  Square,
  Clock,
  FileText,
  CheckCircle2,
  Plus,
  Star,
  MessageSquare,
  Image as ImageIcon,
  Video,
  Link,
  Trash2,
  Pencil,
  GripVertical,
  UploadCloud,
  AlertTriangle,
  ListChecks,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";

import {
  uploadToCloudinary,
  isCloudinaryReady,
  FOLDERS,
} from "../config/cloudinary";

import Topbar from "../components/layout/Topbar";
import api from "../api/axios";
import Button from "../components/ui/Button";
import FilterBar from "../components/shared/FilterBar";

const EMPTY_FORM = {
  title: "",
  category: "",
  durationStr: "15 min",
  difficulty: "Baja",
  description: "",
  materials: "",
  steps: [{ id: Date.now(), text: "", time: "5 min" }],
  mediaType: "none",
  mediaUrl: "",
  peiGoalDesc: "",
  peiGoalTrials: 20,
};

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
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\d+\.\s*(.*?)\s*\(([^)]+)\)\s*$/);
      return {
        text: (match ? match[1] : line.replace(/^\d+\.\s*/, "")).trim(),
        time: parseTimeToSeconds(match ? match[2] : ""),
      };
    })
    .filter((s) => s.text);

const formatMinutes = (seconds) =>
  seconds >= 60 ? `${Math.round(seconds / 60)} min` : `${seconds} seg`;

const DIFFICULTY_STYLES = {
  Baja: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800",
  Media:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800",
  Alta: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800",
};

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
    globalPeiGoals = [],
    crearPeiGoal,
  } = useGlobalContext();

  // Session State
  const [activeSession, setActiveSession] = useState(null);
  const [sessionTime, setSessionTime] = useState(0); // en segundos
  const [isFinishing, setIsFinishing] = useState(false);
  const [cooperation, setCooperation] = useState(0);
  const [notes, setNotes] = useState("");
  const [currentStep, setCurrentStep] = useState(0);

  // --- Advanced Routine Builder State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("general"); // 'general', 'steps', 'media'
  const [formData, setFormData] = useState(EMPTY_FORM);

  // --- Multimedia upload state ---
  const mediaInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(null); // null = idle
  const [uploadError, setUploadError] = useState("");

  const isVideoUrl = (url = "") =>
    /youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.m3u8|\.webm|\.mov/i.test(url);

  const handleMediaUpload = async (file) => {
    if (!file) return;
    setUploadError("");
    if (!file.type.startsWith("image/")) {
      setUploadError("Solo se permiten imágenes (PNG, JPG, SVG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("La imagen no puede superar los 5 MB.");
      return;
    }
    if (!isCloudinaryReady()) {
      setUploadError("Cloudinary no está configurado.");
      return;
    }
    setUploadProgress(0);
    try {
      const { url } = await uploadToCloudinary(
        file,
        "image",
        FOLDERS.activityMedia,
        setUploadProgress,
      );
      setFormData({ ...formData, mediaType: "image", mediaUrl: url });
    } catch {
      setUploadError("No se pudo subir la imagen. Inténtalo de nuevo.");
    } finally {
      setUploadProgress(null);
    }
  };

  const isGestion =
    userRole === "ESPECIALISTA" || userRole === "ADMIN_INSTITUCION";

  // --- Search filters ---
  const [filters, setFilters] = useState({
    busqueda: "",
    cat_codi: "",
    dificultad: "",
    estado: "",
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
      return true;
    });
  }, [routines, filters]);

  const clearFilters = () =>
    setFilters({ busqueda: "", cat_codi: "", dificultad: "", estado: "" });

  // --- Category management modal ---
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ cat_nomb: "", cat_deta: "" });
  const [editingCat, setEditingCat] = useState(null);
  const [catDeleting, setCatDeleting] = useState(null);

  const openCatCreate = () => {
    setEditingCat(null);
    setCatForm({ cat_nomb: "", cat_deta: "" });
  };

  const openCatEdit = (cat) => {
    setEditingCat(cat);
    setCatForm({ cat_nomb: cat.cat_nomb, cat_deta: cat.cat_deta || "" });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const name = catForm.cat_nomb.trim();
    if (name.length < 3) {
      showToast("⚠️ El nombre debe tener al menos 3 caracteres.");
      return;
    }
    if (editingCat) {
      await updateCategory(editingCat.cat_codi, {
        cat_nomb: name,
        cat_deta: catForm.cat_deta.trim() || null,
      });
    } else {
      await createCategory(name, catForm.cat_deta.trim());
    }
    openCatCreate();
  };

  const handleDeleteCategory = async (cat) => {
    if (!cat) return;
    setCatDeleting(cat.cat_codi);
    await deleteCategory(cat.cat_codi);
    setCatDeleting(null);
  };

  const categoryOptions =
    categories.length > 0
      ? categories.map((c) => c.cat_nomb)
      : ["Higiene", "Terapéutico", "Alimentación", "Educativo", "Regulación"];

  // Handlers for Builder
  const handleAddStep = () => {
    setFormData({
      ...formData,
      steps: [...formData.steps, { id: Date.now(), text: "", time: "5 min" }],
    });
  };

  const handleRemoveStep = (idToRemove) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((s) => s.id !== idToRemove),
    });
  };

  const handleStepChange = (id, field, value) => {
    setFormData({
      ...formData,
      steps: formData.steps.map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      ),
    });
  };

  const handleCreateRoutine = async (e) => {
    e.preventDefault();
    const isEdit = editingId !== null;
    if (isEdit) {
      await updateRoutine(editingId, formData);
    } else {
      await createRoutine(formData);
    }
    setIsModalOpen(false);
    setEditingId(null);
    const peiDesc = formData.peiGoalDesc;
    setFormData({
      ...EMPTY_FORM,
      steps: [{ id: Date.now(), text: "", time: "5 min" }],
    });
    if (!isEdit && peiDesc.trim()) {
      await crearPeiGoal(selectedChildId, {
        met_desc: peiDesc,
        met_ttria: formData.peiGoalTrials || 20,
      });
    }
    setActiveTab("general");
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      ...EMPTY_FORM,
      category: categoryOptions[0] || "Higiene",
      steps: [{ id: Date.now(), text: "", time: "5 min" }],
    });
    setActiveTab("general");
    setIsModalOpen(true);
  };

  const openEditModal = (routine) => {
    setEditingId(routine.id);
    const steps = routine.inst
      ?.split("\n")
      .filter(Boolean)
      .map((line, i) => {
        const match = line.match(/^\d+\.\s*(.*?)\s*\((.*?)\)\s*$/);
        return {
          id: Date.now() + i,
          text: match ? match[1] : line.replace(/^\d+\.\s*/, ""),
          time: match ? match[2] : "5 min",
        };
      }) || [{ id: Date.now(), text: "", time: "5 min" }];
    setFormData({
      title: routine.title,
      category: routine.category || categoryOptions[0] || "Higiene",
      durationStr: routine.act_time ? `${routine.act_time} min` : "15 min",
      difficulty: routine.difficulty || "Baja",
      description: routine.description || "",
      materials: routine.materials || "",
      steps:
        steps.length > 0
          ? steps
          : [{ id: Date.now(), text: "", time: "5 min" }],
      mediaType: routine.media
        ? isVideoUrl(routine.media)
          ? "video"
          : "image"
        : "none",
      mediaUrl: routine.media || "",
      peiGoalDesc: "",
      peiGoalTrials: 20,
    });
    setActiveTab("general");
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
    if (activeSession && !isFinishing) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [activeSession, isFinishing]);

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // --- Guía por pasos del monitor en vivo ---
  const sessionSteps = useMemo(
    () => (activeSession ? parseSteps(activeSession.inst) : []),
    [activeSession],
  );

  const totalDuration = sessionSteps.reduce(
    (acc, s) => acc + Math.max(s.time, 1),
    0,
  );
  const totalProgress =
    totalDuration > 0 ? Math.min(sessionTime / totalDuration, 1) : 0;

  const currentStepInfo = useMemo(() => {
    if (sessionSteps.length === 0) return null;
    const safeIndex = Math.min(currentStep, sessionSteps.length - 1);
    let stepStart = 0;
    for (let i = 0; i < safeIndex; i++)
      stepStart += Math.max(sessionSteps[i].time, 1);
    const stepDuration = Math.max(sessionSteps[safeIndex].time, 1);
    const elapsedInStep = Math.min(
      Math.max(sessionTime - stepStart, 0),
      stepDuration,
    );
    return {
      stepStart,
      stepDuration,
      elapsedInStep,
      remaining: Math.max(stepDuration - elapsedInStep, 0),
    };
  }, [sessionSteps, currentStep, sessionTime]);

  // Auto-avance: el paso actual avanza según el tiempo estimado acumulado.
  // La navegación manual solo adelanta; el tiempo siempre "empuja" hacia adelante.
  useEffect(() => {
    if (!activeSession || sessionSteps.length === 0) return;
    const ends = [];
    let acc = 0;
    for (const s of sessionSteps) {
      acc += Math.max(s.time, 1);
      ends.push(acc);
    }
    let idx = sessionSteps.length - 1;
    for (let i = 0; i < ends.length; i++) {
      if (sessionTime < ends[i]) {
        idx = i;
        break;
      }
    }
    setCurrentStep((prev) => Math.max(prev, idx));
  }, [sessionTime, activeSession, sessionSteps]);

  const goPrevStep = () => setCurrentStep((p) => Math.max(p - 1, 0));
  const goNextStep = () =>
    setCurrentStep((p) =>
      Math.min(p + 1, Math.max(sessionSteps.length - 1, 0)),
    );

  const startSession = async (routine) => {
    try {
      const res = await api.post("/sesiones/iniciar", {
        nin_codi: selectedChildId || "NIN_1",
        act_codi: routine.id,
        dis_codi: "D001",
      });
      const sesion = res.data.data;

      setActiveSession({
        ...routine,
        ses_codi: sesion.ses_codi,
      });
      setSessionTime(0);
      setCurrentStep(0);
      setIsFinishing(false);
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
      setIsFinishing(false);
      setCooperation(0);
      setNotes("");
    }
  };

  const endSession = () => {
    setIsFinishing(true);
  };

  const saveSession = async () => {
    try {
      const sesCodi = activeSession.ses_codi;
      const parsedNota = `[Cooperación: ${cooperation}/5] ${notes}`;
      await api.put(`/sesiones/${sesCodi}/cerrar`, {
        ses_nota: parsedNota,
      });
      showToast(
        `✅ Sesión guardada en base de datos. Tiempo: ${formatTime(sessionTime)}. Cooperación: ${cooperation}/5.`,
      );
    } catch (err) {
      console.error("Error closing session on backend:", err);
      showToast(
        "⚠️ Error al registrar el cierre de la sesión en la base de datos.",
      );
    }
    setActiveSession(null);
    setIsFinishing(false);
    setCurrentStep(0);
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
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                  <div className="flex flex-col gap-2" data-tour="rt-header">
                    <h1 className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2">
                      <ListChecks className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                      Terapias y Actividades
                    </h1>
                    <p className="hidden sm:block text-sm text-slate-500 mt-1">
                      Selecciona una rutina para iniciar el monitoreo clínico
                      para {nomNino || "el paciente"}.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
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
                      >
                        Categorías
                      </Button>
                    )}
                    {isGestion && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={openCreateModal}
                      >
                        Crear Nueva Terapia
                      </Button>
                    )}
                  </div>
                </div>

                {/* Barra de filtros */}
                <FilterBar
                  searchValue={filters.busqueda}
                  onSearch={(v) => setFilters({ ...filters, busqueda: v })}
                  searchPlaceholder="Buscar por nombre, descripción o materiales…"
                  activeCount={
                    (filters.busqueda ? 1 : 0) +
                    (filters.cat_codi ? 1 : 0) +
                    (filters.dificultad ? 1 : 0) +
                    (filters.estado ? 1 : 0)
                  }
                  onClearAll={clearFilters}
                  chips={[
                    filters.cat_codi && {
                      key: "cat_codi",
                      label:
                        categories.find((c) => c.cat_codi === filters.cat_codi)
                          ?.cat_nomb || filters.cat_codi,
                      onRemove: () => setFilters({ ...filters, cat_codi: "" }),
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
                </FilterBar>

                <div
                  data-tour="rt-catalog"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
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
                        className="group bg-white dark:bg-[#1E293B] rounded-3xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-default"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-5">
                            <span className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-black uppercase tracking-widest rounded-lg">
                              {routine.category}
                            </span>
                            <div className="flex items-center gap-2">
                              {routine.sessionCount > 0 && (
                                <span
                                  className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-md flex items-center gap-1"
                                  title="Sesiones realizadas"
                                >
                                  <ListChecks className="w-3 h-3" />{" "}
                                  {routine.sessionCount}
                                </span>
                              )}
                              <span className="text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-2 py-1 rounded-md flex items-center gap-1">
                                <Clock className="w-3 h-3" />{" "}
                                {routine.durationStr}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                              {routine.title}
                            </h3>
                            {routine.status === "Inactiva" && (
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                Inactiva
                              </span>
                            )}
                          </div>

                          {routine.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium mb-2 leading-relaxed">
                              {routine.description}
                            </p>
                          )}

                          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed font-medium">
                            {routine.inst || "Sin instrucciones registradas."}
                          </p>

                          {routine.media && (
                            <div className="mt-3">
                              {isVideoUrl(routine.media) ? (
                                <a
                                  href={routine.media}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-900/30 px-3 py-2 rounded-xl w-fit"
                                >
                                  <Video className="w-3.5 h-3.5" /> Ver video de
                                  referencia
                                </a>
                              ) : (
                                <img
                                  src={routine.media}
                                  alt={routine.title}
                                  loading="lazy"
                                  className="w-full h-32 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                                />
                              )}
                            </div>
                          )}

                          {routine.materials && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 flex items-start gap-1.5">
                              <ListChecks className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                              <span className="line-clamp-2">
                                Materiales: {routine.materials}
                              </span>
                            </p>
                          )}
                        </div>

                        <div className="mt-6 space-y-3">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${DIFFICULTY_STYLES[routine.difficulty] || DIFFICULTY_STYLES.Baja}`}
                            >
                              Dificultad {routine.difficulty}
                            </span>
                            <div className="flex items-center gap-2">
                              {isGestion && (
                                <button
                                  type="button"
                                  onClick={() => openEditModal(routine)}
                                  className="p-2.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 transition-colors"
                                  title="Editar terapia"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                              )}
                              {isGestion && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDelete(routine.id)}
                                  className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 transition-colors"
                                  title="Eliminar terapia"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                          {isGestion && (
                            <button
                              onClick={() => startSession(routine)}
                              data-tour="rt-live"
                              className="w-full py-3.5 bg-slate-900 dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 text-white font-bold rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                            >
                              <Play className="w-4 h-4 fill-current" /> Iniciar
                              Sesión en Vivo
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Si hay sesión activa: Mostrar Live Monitor */}
            {activeSession && (
              <div className="animate-in fade-in zoom-in-95 duration-500 max-w-4xl mx-auto w-full mt-4">
                {/* Panel de Monitoreo Guiado */}
                <div className="bg-white dark:bg-[#1E293B] rounded-[2rem] border border-blue-200 dark:border-blue-900/50 shadow-2xl shadow-blue-500/10 overflow-hidden relative min-h-[420px] flex flex-col">
                  {/* Header Flotante */}
                  <div className="px-6 md:px-8 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 shrink-0">
                    <div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        Monitoreo en Curso
                      </span>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
                        {activeSession.title}
                      </h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">
                        {formatTime(sessionTime)}
                      </span>
                      {!isFinishing && (
                        <button
                          data-tour="rt-live-stop"
                          onClick={endSession}
                          className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl shadow-sm flex items-center gap-2 transition-colors"
                        >
                          <Square className="w-4 h-4 fill-current" /> Detener
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Barra de progreso general de la actividad */}
                  {!isFinishing && (
                    <div className="h-1.5 bg-slate-100 dark:bg-slate-800 shrink-0">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${totalProgress * 100}%` }}
                      />
                    </div>
                  )}

                  {isFinishing ? (
                    /* Formulario de Cierre (vista propia, sin cortes) */
                    <div className="flex-1 overflow-y-auto p-6 md:p-10">
                      <div className="max-w-md w-full mx-auto flex flex-col items-center text-center">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-5" />
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">
                          Sesión Finalizada
                        </h3>
                        <p className="text-sm text-slate-500 mb-6 font-medium">
                          Tiempo total registrado:{" "}
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {formatTime(sessionTime)}
                          </span>
                          . Por favor, evalúa el desempeño.
                        </p>

                        <div className="w-full space-y-6 text-left">
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                            <label
                              data-tour="rt-finish-rating"
                              className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 block text-center"
                            >
                              Nivel de Cooperación del Paciente
                            </label>
                            <div className="flex justify-center gap-2">
                              {[1, 2, 3, 4, 5].map((val) => (
                                <button
                                  key={val}
                                  onClick={() => setCooperation(val)}
                                  className="focus:outline-none transition-transform hover:scale-125"
                                >
                                  <Star
                                    className={`w-9 h-9 ${val <= cooperation ? "fill-amber-400 text-amber-400 drop-shadow-md" : "text-slate-200 dark:text-slate-700 fill-transparent"}`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label
                              data-tour="rt-finish-notes"
                              className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 block flex items-center gap-2"
                            >
                              <MessageSquare className="w-4 h-4" /> Notas u
                              Observaciones (Opcional)
                            </label>
                            <textarea
                              rows="3"
                              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl resize-none outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium"
                              placeholder="Ej: El paciente mostró rechazo inicial pero luego completó la actividad sin problemas..."
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                            ></textarea>
                          </div>
                        </div>

                        <div className="flex gap-3 w-full mt-8">
                          <button
                            onClick={() => setIsFinishing(false)}
                            className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            Volver
                          </button>
                          <button
                            onClick={saveSession}
                            data-tour="rt-finish-save"
                            className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5"
                          >
                            Guardar Bitácora
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Cuerpo Principal: Guía por pasos en vivo */
                    <div className="flex-1 p-6 md:p-8 flex flex-col lg:flex-row gap-6 lg:gap-8 overflow-y-auto">
                      {/* Columna izquierda: reloj + paso actual */}
                      <div className="lg:w-72 shrink-0 flex flex-col items-center gap-6">
                        <div
                          data-tour="rt-live-timer"
                          className="flex flex-col items-center"
                        >
                          <div className="w-44 h-44 md:w-52 md:h-52 rounded-full border-[12px] border-slate-100 dark:border-slate-800 flex items-center justify-center relative shadow-inner">
                            <div
                              className={`absolute inset-0 rounded-full border-[12px] border-transparent ${!isFinishing ? "border-t-blue-500 animate-spin" : ""}`}
                              style={{ animationDuration: "3s" }}
                            ></div>
                            <span className="text-4xl md:text-5xl font-black text-slate-800 dark:text-slate-100 tracking-tighter tabular-nums font-mono">
                              {formatTime(sessionTime)}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-400 mt-4 tracking-widest uppercase">
                            Tiempo Registrado
                          </p>
                        </div>

                        {/* Tarjeta del paso actual */}
                        {sessionSteps.length > 0 && currentStepInfo && (
                          <div className="w-full bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 text-center">
                            <p className="text-xs font-black uppercase tracking-widest text-blue-500 mb-1.5">
                              Paso {currentStep + 1} de {sessionSteps.length}
                            </p>
                            <p className="text-base font-black text-slate-800 dark:text-white leading-snug line-clamp-2">
                              {
                                sessionSteps[
                                  Math.min(currentStep, sessionSteps.length - 1)
                                ].text
                              }
                            </p>
                            <p className="text-sm font-bold text-amber-500 mt-2 tabular-nums">
                              {formatTime(currentStepInfo.remaining)} restantes
                            </p>
                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
                              <div
                                className="h-full bg-amber-400 transition-all duration-500"
                                style={{
                                  width: `${
                                    (currentStepInfo.elapsedInStep /
                                      currentStepInfo.stepDuration) *
                                    100
                                  }%`,
                                }}
                              />
                            </div>
                            <div className="flex gap-2 mt-4">
                              <button
                                type="button"
                                onClick={goPrevStep}
                                disabled={currentStep === 0}
                                className="flex-1 py-2 px-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                ← Anterior
                              </button>
                              <button
                                type="button"
                                onClick={goNextStep}
                                disabled={
                                  currentStep >= sessionSteps.length - 1
                                }
                                className="flex-1 py-2 px-2 text-xs font-bold text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                Siguiente →
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Columna derecha: demostración + pasos */}
                      <div className="flex-1 min-w-0 flex flex-col gap-6">
                        {activeSession.media && (
                          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800/60">
                              <span className="text-xs font-black uppercase tracking-widest text-blue-500 flex items-center gap-2">
                                <Video className="w-3.5 h-3.5" /> Demostración
                              </span>
                              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                Material de apoyo
                              </span>
                            </div>
                            {isVideoUrl(activeSession.media) ? (
                              <video
                                key={activeSession.ses_codi}
                                src={activeSession.media}
                                controls
                                playsInline
                                className="w-full max-h-72 bg-black"
                              />
                            ) : (
                              <img
                                src={activeSession.media}
                                alt={activeSession.title}
                                className="w-full max-h-72 object-cover"
                              />
                            )}
                          </div>
                        )}

                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                          <ListChecks className="w-4 h-4 text-blue-500" /> Guía
                          por Pasos
                        </h3>
                        {sessionSteps.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium max-w-xs">
                              Esta terapia no tiene pasos estructurados. Solo se
                              registra el tiempo transcurrido.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {sessionSteps.map((step, i) => {
                              const isDone = i < currentStep;
                              const isCurrent = i === currentStep;
                              return (
                                <div
                                  key={i}
                                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all duration-300 ${
                                    isCurrent
                                      ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 shadow-md"
                                      : isDone
                                        ? "border-emerald-200 bg-emerald-50/60 dark:bg-emerald-900/10 dark:border-emerald-800 opacity-80"
                                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 opacity-60"
                                  }`}
                                >
                                  <div
                                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-black text-xs mt-0.5 ${
                                      isDone
                                        ? "bg-emerald-500 text-white"
                                        : isCurrent
                                          ? "bg-blue-600 text-white"
                                          : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                                    }`}
                                  >
                                    {isDone ? (
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                    ) : isCurrent ? (
                                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                                    ) : (
                                      <span className="text-xs">{i + 1}</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-sm font-bold truncate ${
                                        isCurrent
                                          ? "text-blue-700 dark:text-blue-300"
                                          : isDone
                                            ? "text-slate-500 dark:text-slate-400 line-through"
                                            : "text-slate-600 dark:text-slate-300"
                                      }`}
                                    >
                                      {step.text}
                                    </p>
                                    <p className="text-[10px] font-semibold text-slate-400 mt-0.5 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" />{" "}
                                      {formatMinutes(step.time)} estimados
                                      {isCurrent && (
                                        <span className="text-blue-500 font-bold">
                                          · en curso
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  {isCurrent && (
                                    <Button
                                      variant="primary"
                                      size="xs"
                                      onClick={goNextStep}
                                    >
                                      Siguiente
                                    </Button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal / Side Drawer para Constructor Avanzado de Rutinas */}
            {isModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/60 backdrop-blur-sm transition-all duration-300">
                <div className="w-full max-w-2xl h-full bg-white dark:bg-[#0F172A] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200 dark:border-slate-800">
                  {/* Drawer Header */}
                  <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-[#1E293B]">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        {editingId
                          ? "Editar Terapia"
                          : "Constructor de Terapias"}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        {editingId
                          ? "Modifica los parámetros, pasos y multimedia."
                          : "Configura los parámetros, pasos y multimedia."}
                      </p>
                    </div>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors"
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

                  {/* Tabs Nav */}
                  <div className="flex px-8 pt-4 bg-slate-50 dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-800 gap-6">
                    <button
                      onClick={() => setActiveTab("general")}
                      className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "general" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                    >
                      Detalles Clínicos
                    </button>
                    <button
                      onClick={() => setActiveTab("steps")}
                      className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "steps" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                    >
                      Paso a Paso
                    </button>
                    <button
                      onClick={() => setActiveTab("media")}
                      className={`pb-3 text-sm font-bold border-b-2 transition-colors ${activeTab === "media" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                    >
                      Materiales
                    </button>
                    <button
                      onClick={() => setActiveTab("metas")}
                      className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === "metas" ? "border-amber-500 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                    >
                      <Star className="w-4 h-4" /> Metas PEI
                    </button>
                  </div>

                  {/* Drawer Body */}
                  <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-[#0F172A]">
                    <form
                      id="create-routine-form"
                      onSubmit={handleCreateRoutine}
                      className="space-y-8"
                    >
                      {/* TAB 1: General */}
                      {activeTab === "general" && (
                        <div className="space-y-6 animate-in fade-in">
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                              Nombre de la Terapia
                            </label>
                            <input
                              type="text"
                              required
                              value={formData.title}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  title: e.target.value,
                                })
                              }
                              className="w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all"
                              placeholder="Ej. Terapia Sensorial con Espuma"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                              Descripción Clínica (Opcional)
                            </label>
                            <textarea
                              rows="2"
                              value={formData.description}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all resize-none"
                              placeholder="Ej. Actividad sensorial orientada a la regulación del sistema propioceptivo mediante texturas."
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                                Categoría
                              </label>
                              <select
                                value={formData.category}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    category: e.target.value,
                                  })
                                }
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all"
                              >
                                {categoryOptions.length === 0 && (
                                  <option value="">Sin categorías</option>
                                )}
                                {categoryOptions.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                                Duración Estimada
                              </label>
                              <input
                                type="text"
                                required
                                value={formData.durationStr}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    durationStr: e.target.value,
                                  })
                                }
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all"
                                placeholder="Ej. 15 min"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                              Dificultad Esperada
                            </label>
                            <div className="flex gap-4">
                              {["Baja", "Media", "Alta"].map((diff) => (
                                <button
                                  type="button"
                                  key={diff}
                                  onClick={() =>
                                    setFormData({
                                      ...formData,
                                      difficulty: diff,
                                    })
                                  }
                                  className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all ${formData.difficulty === diff ? "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-400" : "bg-white border-slate-200 text-slate-500 dark:bg-[#1E293B] dark:border-slate-700 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                                >
                                  {diff}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: Pasos */}
                      {activeTab === "steps" && (
                        <div className="space-y-6 animate-in fade-in">
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                              Instrucciones Estructuradas
                            </label>
                            <button
                              data-tour="rt-build-steps"
                              type="button"
                              onClick={handleAddStep}
                              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Agregar Paso
                            </button>
                          </div>

                          <div className="space-y-4">
                            {formData.steps.map((step, index) => (
                              <div
                                key={step.id}
                                className="group flex items-start gap-4 p-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl"
                              >
                                <div className="mt-3 cursor-grab text-slate-400 hover:text-slate-600">
                                  <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black shrink-0 mt-1">
                                  {index + 1}
                                </div>
                                <div className="flex-1 space-y-3">
                                  <input
                                    type="text"
                                    placeholder="Instrucción corta (Ej. Colocar el material en la mesa)"
                                    value={step.text}
                                    onChange={(e) =>
                                      handleStepChange(
                                        step.id,
                                        "text",
                                        e.target.value,
                                      )
                                    }
                                    className="w-full bg-transparent border-b border-slate-300 dark:border-slate-600 px-2 py-2 outline-none focus:border-blue-500 text-sm font-medium text-slate-900 dark:text-white"
                                    required
                                  />
                                  <div className="flex items-center gap-2 px-2">
                                    <Clock className="w-4 h-4 text-slate-400" />
                                    <input
                                      type="text"
                                      placeholder="Tiempo (Ej. 2 min)"
                                      value={step.time}
                                      onChange={(e) =>
                                        handleStepChange(
                                          step.id,
                                          "time",
                                          e.target.value,
                                        )
                                      }
                                      className="bg-transparent text-xs font-semibold text-slate-500 outline-none w-24"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveStep(step.id)}
                                  className="mt-3 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* TAB 3: Media */}
                      {activeTab === "media" && (
                        <div className="space-y-8 animate-in fade-in">
                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">
                              Materiales Requeridos (Separados por comas)
                            </label>
                            <textarea
                              rows="2"
                              value={formData.materials}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  materials: e.target.value,
                                })
                              }
                              className="w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all resize-none"
                              placeholder="Ej. Pelota de yoga, Arena cinética, Fichas de colores..."
                            />
                          </div>

                          <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">
                              Soporte Multimedia (Pictogramas o Video)
                            </label>

                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    mediaType: "image",
                                  })
                                }
                                className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all ${formData.mediaType === "image" ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1E293B]"}`}
                              >
                                <ImageIcon className="w-6 h-6" />
                                <span className="text-sm font-bold">
                                  Imagen / Pictograma
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    mediaType: "video",
                                  })
                                }
                                className={`flex-1 py-4 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 transition-all ${formData.mediaType === "video" ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-600" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-[#1E293B]"}`}
                              >
                                <Video className="w-6 h-6" />
                                <span className="text-sm font-bold">
                                  Video de Referencia
                                </span>
                              </button>
                            </div>

                            {/* Dropzone Imagen */}
                            {formData.mediaType === "image" && (
                              <div
                                className="mt-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-3xl p-8 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-[#1E293B] hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer group"
                                onClick={() =>
                                  uploadProgress === null &&
                                  mediaInputRef.current?.click()
                                }
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  handleMediaUpload(e.dataTransfer.files?.[0]);
                                }}
                              >
                                {uploadProgress !== null ? (
                                  <>
                                    <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin mb-3" />
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                      Subiendo imagen… {uploadProgress}%
                                    </p>
                                    <div className="w-52 h-2 mt-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-blue-600 transition-all"
                                        style={{ width: `${uploadProgress}%` }}
                                      />
                                    </div>
                                  </>
                                ) : formData.mediaUrl ? (
                                  <div className="flex flex-col items-center gap-3 w-full">
                                    <img
                                      src={formData.mediaUrl}
                                      alt="Pictograma de la actividad"
                                      className="max-h-48 max-w-full rounded-2xl object-contain border border-slate-200 dark:border-slate-700 shadow-sm"
                                    />
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 className="w-4 h-4" />
                                        Imagen adjuntada
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFormData({
                                            ...formData,
                                            mediaType: "none",
                                            mediaUrl: "",
                                          });
                                        }}
                                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors"
                                        title="Quitar imagen"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                      <UploadCloud className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                      Arrastra una imagen aquí o haz clic para
                                      explorar
                                    </p>
                                    <p className="text-xs font-medium text-slate-500 mt-2">
                                      Soporta PNG, JPG, SVG o WebP (Máx 5MB)
                                    </p>
                                  </>
                                )}
                                <input
                                  ref={mediaInputRef}
                                  type="file"
                                  accept="image/png,image/jpeg,image/svg+xml,image/webp,image/jpg"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleMediaUpload(e.target.files?.[0])
                                  }
                                />
                              </div>
                            )}

                            {uploadError && (
                              <p className="mt-2 text-xs text-rose-500 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {uploadError}
                              </p>
                            )}

                            {/* Input de URL Video */}
                            {formData.mediaType === "video" && (
                              <div className="mt-4 animate-in zoom-in-95 space-y-3">
                                <div className="relative">
                                  <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                                    <Link className="h-5 w-5 text-slate-400" />
                                  </div>
                                  <input
                                    type="url"
                                    placeholder="https://youtube.com/watch?v=..."
                                    value={formData.mediaUrl}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        mediaUrl: e.target.value,
                                      })
                                    }
                                    className="w-full pl-5 pr-12 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all"
                                  />
                                </div>
                                {formData.mediaUrl && (
                                  <div className="flex items-center justify-between gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl">
                                    <a
                                      href={formData.mediaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2 truncate hover:underline"
                                    >
                                      <ExternalLink className="w-4 h-4 shrink-0" />
                                      <span className="truncate">
                                        Video adjuntado
                                      </span>
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setFormData({
                                          ...formData,
                                          mediaType: "none",
                                          mediaUrl: "",
                                        })
                                      }
                                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shrink-0"
                                      title="Quitar video"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* TAB 4: Metas PEI */}
                      {activeTab === "metas" && (
                        <div className="space-y-6 animate-in fade-in">
                          <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
                              <Star className="w-4 h-4" />
                              Asignar Meta Clínica a Paciente
                            </h3>
                            <p className="text-xs text-amber-700 dark:text-amber-500 font-medium">
                              Al crear esta terapia, puedes asignar
                              simultáneamente una Meta PEI para evaluar en
                              múltiples sesiones.
                            </p>
                          </div>

                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label
                                data-tour="rt-build-pei"
                                className="text-xs font-black uppercase tracking-widest text-slate-500"
                              >
                                Descripción de la Meta (PEI)
                              </label>
                              <input
                                type="text"
                                value={formData.peiGoalDesc}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    peiGoalDesc: e.target.value,
                                  })
                                }
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all"
                                placeholder="Ej. Sostener contacto visual (10s)"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                                Criterio de Maestría (Ensayos Exitosos Totales)
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={formData.peiGoalTrials}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    peiGoalTrials: parseInt(e.target.value),
                                  })
                                }
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all"
                                placeholder="Ej. 20"
                              />
                            </div>
                          </div>

                          <div className="mt-8">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
                              Metas Actuales del Paciente
                            </h4>
                            {globalPeiGoals.length > 0 ? (
                              <div className="space-y-3">
                                {globalPeiGoals.map((g) => (
                                  <div
                                    key={g.met_codi}
                                    className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex justify-between items-center shadow-sm"
                                  >
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                      {g.met_desc}
                                    </span>
                                    <span className="text-xs font-black text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                                      {g.met_prog}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-slate-500 italic">
                                No hay metas activas para este paciente.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Drawer Footer */}
                  <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-[1] py-4 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      form="create-routine-form"
                      data-tour="rt-build-generate"
                      className="flex-[2] py-4 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-xl shadow-blue-500/30 transition-all flex justify-center items-center gap-2 hover:-translate-y-1"
                    >
                      {editingId ? (
                        <>
                          <Pencil className="w-5 h-5" /> Guardar Cambios
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" /> Generar Terapia
                        </>
                      )}
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
              <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
                <div className="w-full max-w-lg bg-white dark:bg-[#0F172A] rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col">
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
                      onClick={() => setIsCatModalOpen(false)}
                      className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveCategory} className="mb-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">
                          Nombre de la Categoría
                        </label>
                        <input
                          type="text"
                          value={catForm.cat_nomb}
                          onChange={(e) =>
                            setCatForm({
                              ...catForm,
                              cat_nomb: e.target.value,
                            })
                          }
                          placeholder="Ej. Sensorial, Motricidad, Cognitiva…"
                          required
                          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">
                          Descripción (Opcional)
                        </label>
                        <textarea
                          rows="2"
                          value={catForm.cat_deta}
                          onChange={(e) =>
                            setCatForm({
                              ...catForm,
                              cat_deta: e.target.value,
                            })
                          }
                          placeholder="Breve descripción de la categoría…"
                          className="w-full px-5 py-3.5 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all resize-none"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2"
                        >
                          {editingCat ? (
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
