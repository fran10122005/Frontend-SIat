import { useState, useEffect, useRef, useMemo } from "react";
import Sidebar from "@/components/layout/Sidebar";
import { useGlobalContext } from "@/context/GlobalState";
import {
  Play,
  Pause,
  Square,
  Clock,
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
  Lock,
  Users,
  AlertCircle,
} from "lucide-react";

import {
  uploadToCloudinary,
  isCloudinaryReady,
  FOLDERS,
} from "@/config/cloudinary";

import Topbar from "@/components/layout/Topbar";
import api from "@/api/axios";
import Button from "@/components/ui/Button";
import Fab from "@/components/ui/Fab";
import FilterBar from "@/components/shared/FilterBar";
import TherapySessionPlayer from "@/components/shared/TherapySessionPlayer";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { useSmartwatch } from "@/context/SmartwatchContext";
import {
  validateRequiredText,
  validateUrl,
  sanitizeIntegerInput,
  focusFirstError,
} from "@/utils/validators";

const EMPTY_FORM = {
  title: "",
  category: "",
  durationStr: "15 min",
  difficulty: "Baja",
  visibility: "AMBOS",
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

  // --- Advanced Routine Builder State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [activeTab, setActiveTab] = useState("general"); // 'general', 'steps', 'media', 'metas'
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [routineErrors, setRoutineErrors] = useState({});
  const [isRoutineSaving, setIsRoutineSaving] = useState(false);
  const [showDiscardRoutineConfirm, setShowDiscardRoutineConfirm] =
    useState(false);
  const routineFormRef = useRef(null);
  const routineInitialRef = useRef(null);

  const normalizeRoutineSnapshot = (data) =>
    JSON.stringify({
      title: String(data?.title || ""),
      category: String(data?.category || ""),
      durationStr: String(data?.durationStr || ""),
      difficulty: String(data?.difficulty || "Baja"),
      visibility: String(data?.visibility || "AMBOS"),
      description: String(data?.description || ""),
      materials: String(data?.materials || ""),
      steps: (data?.steps || []).map((s) => ({
        text: String(s?.text || ""),
        time: String(s?.time || ""),
      })),
      mediaType: String(data?.mediaType || "none"),
      mediaUrl: String(data?.mediaUrl || ""),
      peiGoalDesc: String(data?.peiGoalDesc || ""),
      peiGoalTrials: String(data?.peiGoalTrials ?? 20),
    });

  const isRoutineDirty = useMemo(() => {
    if (!isModalOpen || !routineInitialRef.current) return false;
    return normalizeRoutineSnapshot(formData) !== routineInitialRef.current;
  }, [isModalOpen, formData]);

  const ROUTINE_TAB_ORDER = ["general", "steps", "media", "metas"];
  const getRoutineFieldTab = (key) => {
    if (key === "steps" || key.startsWith("step_")) return "steps";
    if (key === "materials" || key === "mediaUrl") return "media";
    if (key === "peiGoalDesc" || key === "peiGoalTrials") return "metas";
    return "general";
  };

  const tabErrorCounts = useMemo(() => {
    const counts = { general: 0, steps: 0, media: 0, metas: 0 };
    Object.entries(routineErrors).forEach(([k, v]) => {
      if (v) counts[getRoutineFieldTab(k)] += 1;
    });
    return counts;
  }, [routineErrors]);

  const totalRoutineErrors = useMemo(
    () => Object.values(routineErrors).filter(Boolean).length,
    [routineErrors],
  );

  const clearRoutineError = (field) => {
    setRoutineErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateRoutineData = (data) => {
    const errs = {};
    const titleErr = validateRequiredText(
      data.title,
      "El nombre de la terapia",
      {
        min: 3,
        max: 60,
      },
    );
    if (titleErr) errs.title = titleErr;

    const descText = String(data.description || "").trim();
    if (descText.length > 2000) {
      errs.description = "La descripción no puede exceder 2000 caracteres";
    }

    if (!String(data.category || "").trim()) {
      errs.category = "Selecciona una categoría";
    }

    const durRaw = String(data.durationStr || "").trim();
    const durMatch = durRaw.match(/\d+/);
    const durNum = durMatch ? parseInt(durMatch[0], 10) : NaN;
    if (!durRaw) {
      errs.durationStr = "La duración estimada es obligatoria";
    } else if (Number.isNaN(durNum) || durNum < 1 || durNum > 600) {
      errs.durationStr =
        "Ingresa una duración entre 1 y 600 minutos (Ej. 15 min)";
    }

    if (!Array.isArray(data.steps) || data.steps.length === 0) {
      errs.steps = "Agrega al menos 1 paso estructurado";
    } else {
      data.steps.forEach((step, idx) => {
        const txt = String(step?.text || "").trim();
        if (!txt) {
          errs[`step_${idx}`] = `El paso ${idx + 1} no puede estar vacío`;
        } else if (txt.length < 2) {
          errs[`step_${idx}`] =
            `El paso ${idx + 1} debe tener al menos 2 caracteres`;
        }
      });
    }

    if (String(data.materials || "").length > 2000) {
      errs.materials = "Los materiales no pueden exceder 2000 caracteres";
    }

    if (data.mediaType === "video") {
      const urlErr = validateUrl(data.mediaUrl, { required: true });
      if (urlErr) errs.mediaUrl = urlErr;
    }

    const peiDesc = String(data.peiGoalDesc || "").trim();
    if (peiDesc) {
      const peiErr = validateRequiredText(
        peiDesc,
        "La descripción de la meta PEI",
        {
          min: 3,
          max: 500,
        },
      );
      if (peiErr) errs.peiGoalDesc = peiErr;
    }

    const trialsRaw = String(data.peiGoalTrials ?? "").trim();
    if (peiDesc || trialsRaw !== "") {
      const tNum = parseInt(trialsRaw, 10);
      if (!trialsRaw || Number.isNaN(tNum) || tNum < 1 || tNum > 100) {
        errs.peiGoalTrials = "Ingresa entre 1 y 100 ensayos";
      }
    }

    return errs;
  };

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

  const categoryOptions =
    categories.length > 0
      ? categories.map((c) => c.cat_nomb)
      : ["Higiene", "Terapéutico", "Alimentación", "Educativo", "Regulación"];

  // Handlers for Builder
  const handleAddStep = () => {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { id: Date.now(), text: "", time: "5 min" }],
    }));
    clearRoutineError("steps");
  };

  const handleRemoveStep = (idToRemove) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== idToRemove),
    }));
    setRoutineErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k === "steps" || k.startsWith("step_")) delete next[k];
      });
      return next;
    });
  };

  const handleStepChange = (id, field, value, index) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      ),
    }));
    if (field === "text" && index !== undefined) {
      clearRoutineError(`step_${index}`);
    }
    clearRoutineError("steps");
  };

  const handleDirectCloseRoutine = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setRoutineErrors({});
    setUploadError("");
    setShowDiscardRoutineConfirm(false);
    setActiveTab("general");
  };

  const handleAttemptCloseRoutine = () => {
    if (isRoutineSaving) return;
    if (isRoutineDirty) {
      setShowDiscardRoutineConfirm(true);
    } else {
      handleDirectCloseRoutine();
    }
  };

  useEffect(() => {
    if (!isModalOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (showDiscardRoutineConfirm) {
          setShowDiscardRoutineConfirm(false);
        } else {
          handleAttemptCloseRoutine();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

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

  const handleCreateRoutine = async (e) => {
    e.preventDefault();
    if (isRoutineSaving) return;
    if (uploadProgress !== null) {
      showToast("⏳ Espera a que termine de subir la imagen.");
      return;
    }

    const errs = validateRoutineData(formData);
    if (Object.keys(errs).length > 0) {
      setRoutineErrors(errs);
      const firstInvalidTab =
        ROUTINE_TAB_ORDER.find((tab) =>
          Object.keys(errs).some(
            (k) => errs[k] && getRoutineFieldTab(k) === tab,
          ),
        ) || "general";
      setActiveTab(firstInvalidTab);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          focusFirstError(errs, routineFormRef);
        });
      });
      return;
    }

    const isEdit = editingId !== null;
    const peiDesc = formData.peiGoalDesc.trim();
    const peiTrials = parseInt(formData.peiGoalTrials, 10) || 20;

    setIsRoutineSaving(true);
    try {
      const res = isEdit
        ? await updateRoutine(editingId, formData)
        : await createRoutine(formData);

      if (res && res.ok === false) {
        const srvErrors = res.fieldErrors || {};
        if (Object.keys(srvErrors).length > 0) {
          setRoutineErrors(srvErrors);
          const firstServerTab =
            ROUTINE_TAB_ORDER.find((tab) =>
              Object.keys(srvErrors).some(
                (k) => srvErrors[k] && getRoutineFieldTab(k) === tab,
              ),
            ) || activeTab;
          setActiveTab(firstServerTab);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              focusFirstError(srvErrors, routineFormRef);
            });
          });
        }
        return;
      }

      if (!isEdit && peiDesc && selectedChildId) {
        try {
          await crearPeiGoal(selectedChildId, {
            met_desc: peiDesc,
            met_ttria: peiTrials,
          });
        } catch (peiErr) {
          console.error("Error al crear meta PEI asociada:", peiErr);
          showToast(
            "⚠️ Terapia creada, pero no se pudo asociar la meta PEI automática.",
          );
        }
      }

      setIsModalOpen(false);
      setEditingId(null);
      setRoutineErrors({});
      setUploadError("");
      setFormData({
        ...EMPTY_FORM,
        steps: [{ id: Date.now(), text: "", time: "5 min" }],
      });
      setActiveTab("general");
    } finally {
      setIsRoutineSaving(false);
    }
  };

  const openCreateModal = () => {
    const initial = {
      ...EMPTY_FORM,
      category: categoryOptions[0] || "Higiene",
      steps: [{ id: Date.now(), text: "", time: "5 min" }],
    };
    setEditingId(null);
    setFormData(initial);
    routineInitialRef.current = normalizeRoutineSnapshot(initial);
    setRoutineErrors({});
    setUploadError("");
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
    const initial = {
      title: routine.title,
      category: routine.category || categoryOptions[0] || "Higiene",
      durationStr: routine.act_time ? `${routine.act_time} min` : "15 min",
      difficulty: routine.difficulty || "Baja",
      visibility: routine.visibility || "AMBOS",
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
    };
    setFormData(initial);
    routineInitialRef.current = normalizeRoutineSnapshot(initial);
    setRoutineErrors({});
    setUploadError("");
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

            {/* Modal / Side Drawer para Constructor Avanzado de Rutinas */}
            {isModalOpen && (
              <div
                className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/60 backdrop-blur-sm transition-all duration-300"
                onClick={handleAttemptCloseRoutine}
              >
                <div
                  className="w-full max-w-2xl h-full bg-white dark:bg-[#0F172A] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-200 dark:border-slate-800"
                  onClick={(e) => e.stopPropagation()}
                >
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
                      type="button"
                      onClick={handleAttemptCloseRoutine}
                      className="p-2 bg-white dark:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors"
                      aria-label="Cerrar constructor de terapias"
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
                  <div className="flex px-8 pt-4 bg-slate-50 dark:bg-[#1E293B] border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto no-scrollbar">
                    {[
                      { id: "general", label: "Detalles Clínicos" },
                      { id: "steps", label: "Paso a Paso" },
                      { id: "media", label: "Materiales" },
                      { id: "metas", label: "Metas PEI", isStar: true },
                    ].map((tab) => {
                      const errCount = tabErrorCounts[tab.id] || 0;
                      const isActive = activeTab === tab.id;
                      const activeBorder =
                        tab.id === "metas"
                          ? "border-amber-500 text-amber-600"
                          : "border-blue-600 text-blue-600";
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
                            isActive
                              ? activeBorder
                              : errCount > 0
                                ? "border-transparent text-rose-600 dark:text-rose-400"
                                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                          }`}
                        >
                          {tab.isStar && <Star className="w-4 h-4" />}
                          <span>{tab.label}</span>
                          {errCount > 0 && (
                            <span
                              className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black leading-none"
                              title={`${errCount} campo(s) por corregir en esta pestaña`}
                            >
                              {errCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Drawer Body */}
                  <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-[#0F172A]">
                    <form
                      id="create-routine-form"
                      ref={routineFormRef}
                      noValidate
                      onSubmit={handleCreateRoutine}
                      className="space-y-8"
                    >
                      {totalRoutineErrors > 0 && (
                        <div
                          role="alert"
                          className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300"
                        >
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>
                            Revisa {totalRoutineErrors}{" "}
                            {totalRoutineErrors === 1
                              ? "campo requerido o con formato inválido"
                              : "campos requeridos o con formato inválido"}{" "}
                            antes de guardar.
                          </span>
                        </div>
                      )}

                      {/* TAB 1: General */}
                      {activeTab === "general" && (
                        <div className="space-y-6 animate-in fade-in">
                          <div className="space-y-2" data-field="title">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                                Nombre de la Terapia{" "}
                                <span className="text-rose-500">*</span>
                              </label>
                              <span
                                className={`text-[10px] font-semibold tabular-nums ${
                                  formData.title.length >= 60
                                    ? "text-rose-500"
                                    : "text-slate-400"
                                }`}
                              >
                                {formData.title.length}/60
                              </span>
                            </div>
                            <input
                              type="text"
                              name="title"
                              maxLength={60}
                              value={formData.title}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  title: e.target.value,
                                });
                                clearRoutineError("title");
                              }}
                              aria-invalid={Boolean(routineErrors.title)}
                              className={`w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all ${
                                routineErrors.title ? "form-input-invalid" : ""
                              }`}
                              placeholder="Ej. Terapia Sensorial con Espuma"
                            />
                            {routineErrors.title && (
                              <p role="alert" className="form-error">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{routineErrors.title}</span>
                              </p>
                            )}
                          </div>

                          <div className="space-y-2" data-field="description">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                                Descripción Clínica (Opcional)
                              </label>
                              <span className="text-[10px] font-semibold tabular-nums text-slate-400">
                                {formData.description.length}/2000
                              </span>
                            </div>
                            <textarea
                              rows="2"
                              name="description"
                              maxLength={2000}
                              value={formData.description}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  description: e.target.value,
                                });
                                clearRoutineError("description");
                              }}
                              aria-invalid={Boolean(routineErrors.description)}
                              className={`w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all resize-none ${
                                routineErrors.description
                                  ? "form-input-invalid"
                                  : ""
                              }`}
                              placeholder="Ej. Actividad sensorial orientada a la regulación del sistema propioceptivo mediante texturas."
                            />
                            {routineErrors.description && (
                              <p role="alert" className="form-error">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{routineErrors.description}</span>
                              </p>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2" data-field="category">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">
                                Categoría{" "}
                                <span className="text-rose-500">*</span>
                              </label>
                              <select
                                name="category"
                                value={formData.category}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    category: e.target.value,
                                  });
                                  clearRoutineError("category");
                                }}
                                aria-invalid={Boolean(routineErrors.category)}
                                className={`w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all ${
                                  routineErrors.category
                                    ? "form-input-invalid"
                                    : ""
                                }`}
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
                              {routineErrors.category && (
                                <p role="alert" className="form-error">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{routineErrors.category}</span>
                                </p>
                              )}
                            </div>
                            <div className="space-y-2" data-field="durationStr">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">
                                Duración Estimada{" "}
                                <span className="text-rose-500">*</span>
                              </label>
                              <input
                                type="text"
                                name="durationStr"
                                maxLength={20}
                                value={formData.durationStr}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    durationStr: e.target.value,
                                  });
                                  clearRoutineError("durationStr");
                                }}
                                aria-invalid={Boolean(
                                  routineErrors.durationStr,
                                )}
                                className={`w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all ${
                                  routineErrors.durationStr
                                    ? "form-input-invalid"
                                    : ""
                                }`}
                                placeholder="Ej. 15 min"
                              />
                              {routineErrors.durationStr && (
                                <p role="alert" className="form-error">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{routineErrors.durationStr}</span>
                                </p>
                              )}
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

                          <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                              Destinatario / Visibilidad
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {[
                                {
                                  id: "ESPECIALISTA",
                                  title: "Solo Especialista",
                                  desc: "Uso interno en consulta; oculta para el representante.",
                                  icon: Lock,
                                },
                                {
                                  id: "AMBOS",
                                  title: "Especialista y Representante",
                                  desc: "Disponible en consulta y en el portal Día a Día.",
                                  icon: Users,
                                },
                              ].map((opt) => {
                                const Icon = opt.icon;
                                const active =
                                  (formData.visibility || "AMBOS") === opt.id;
                                return (
                                  <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() =>
                                      setFormData({
                                        ...formData,
                                        visibility: opt.id,
                                      })
                                    }
                                    className={`text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                                      active
                                        ? "bg-blue-50/90 border-blue-500 text-blue-900 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-200 ring-2 ring-blue-500/15"
                                        : "bg-white border-slate-200 text-slate-600 dark:bg-[#1E293B] dark:border-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    }`}
                                  >
                                    <div
                                      className={`p-2 rounded-xl shrink-0 ${
                                        active
                                          ? "bg-blue-600 text-white"
                                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                      }`}
                                    >
                                      <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-black leading-tight">
                                        {opt.title}
                                      </p>
                                      <p className="text-[11px] opacity-75 mt-1 leading-snug">
                                        {opt.desc}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TAB 2: Pasos */}
                      {activeTab === "steps" && (
                        <div
                          className="space-y-6 animate-in fade-in"
                          data-field="steps"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                              Instrucciones Estructuradas{" "}
                              <span className="text-rose-500">*</span>
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

                          {routineErrors.steps && (
                            <p role="alert" className="form-error">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{routineErrors.steps}</span>
                            </p>
                          )}

                          <div className="space-y-4">
                            {formData.steps.map((step, index) => {
                              const stepError = routineErrors[`step_${index}`];
                              return (
                                <div
                                  key={step.id}
                                  data-field={`step_${index}`}
                                  className={`group flex items-start gap-4 p-4 bg-slate-50 dark:bg-[#1E293B] border rounded-2xl transition-colors ${
                                    stepError
                                      ? "border-rose-400 dark:border-rose-500"
                                      : "border-slate-200 dark:border-slate-700"
                                  }`}
                                >
                                  <div className="mt-3 cursor-grab text-slate-400 hover:text-slate-600">
                                    <GripVertical className="w-5 h-5" />
                                  </div>
                                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black shrink-0 mt-1">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 space-y-2.5 min-w-0">
                                    <input
                                      type="text"
                                      name={`step_${index}`}
                                      maxLength={300}
                                      placeholder="Instrucción corta (Ej. Colocar el material en la mesa)"
                                      value={step.text}
                                      onChange={(e) =>
                                        handleStepChange(
                                          step.id,
                                          "text",
                                          e.target.value,
                                          index,
                                        )
                                      }
                                      aria-invalid={Boolean(stepError)}
                                      className={`w-full bg-transparent border-b px-2 py-2 outline-none text-sm font-medium text-slate-900 dark:text-white ${
                                        stepError
                                          ? "border-rose-500 focus:border-rose-600 form-input-invalid rounded-lg"
                                          : "border-slate-300 dark:border-slate-600 focus:border-blue-500"
                                      }`}
                                    />
                                    {stepError && (
                                      <p role="alert" className="form-error">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span>{stepError}</span>
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 px-2">
                                      <Clock className="w-4 h-4 text-slate-400" />
                                      <input
                                        type="text"
                                        maxLength={20}
                                        placeholder="Tiempo (Ej. 2 min)"
                                        value={step.time}
                                        onChange={(e) =>
                                          handleStepChange(
                                            step.id,
                                            "time",
                                            e.target.value,
                                            index,
                                          )
                                        }
                                        className="bg-transparent text-xs font-semibold text-slate-500 outline-none w-24"
                                      />
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveStep(step.id)}
                                    disabled={formData.steps.length <= 1}
                                    title={
                                      formData.steps.length <= 1
                                        ? "Debe haber al menos 1 paso"
                                        : "Eliminar paso"
                                    }
                                    className="mt-3 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors opacity-60 group-hover:opacity-100 disabled:opacity-20 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* TAB 3: Media */}
                      {activeTab === "media" && (
                        <div className="space-y-8 animate-in fade-in">
                          <div className="space-y-2" data-field="materials">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">
                                Materiales Requeridos (Separados por comas)
                              </label>
                              <span className="text-[10px] font-semibold tabular-nums text-slate-400">
                                {formData.materials.length}/2000
                              </span>
                            </div>
                            <textarea
                              rows="2"
                              name="materials"
                              maxLength={2000}
                              value={formData.materials}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  materials: e.target.value,
                                });
                                clearRoutineError("materials");
                              }}
                              aria-invalid={Boolean(routineErrors.materials)}
                              className={`w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all resize-none ${
                                routineErrors.materials
                                  ? "form-input-invalid"
                                  : ""
                              }`}
                              placeholder="Ej. Pelota de yoga, Arena cinética, Fichas de colores..."
                            />
                            {routineErrors.materials && (
                              <p role="alert" className="form-error">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{routineErrors.materials}</span>
                              </p>
                            )}
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between gap-2">
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500 block">
                                Soporte Multimedia (Pictogramas o Video)
                              </label>
                              {formData.mediaType !== "none" && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      mediaType: "none",
                                      mediaUrl: "",
                                    });
                                    clearRoutineError("mediaUrl");
                                    setUploadError("");
                                  }}
                                  className="text-xs font-bold text-slate-500 hover:text-rose-500 transition-colors"
                                >
                                  Quitar multimedia
                                </button>
                              )}
                            </div>

                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    mediaType: "image",
                                  });
                                  clearRoutineError("mediaUrl");
                                }}
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
                              <div
                                className="mt-4 animate-in zoom-in-95 space-y-2"
                                data-field="mediaUrl"
                              >
                                <div className="relative">
                                  <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                                    <Link className="h-5 w-5 text-slate-400" />
                                  </div>
                                  <input
                                    type="url"
                                    name="mediaUrl"
                                    placeholder="https://youtube.com/watch?v=..."
                                    value={formData.mediaUrl}
                                    onChange={(e) => {
                                      setFormData({
                                        ...formData,
                                        mediaUrl: e.target.value,
                                      });
                                      clearRoutineError("mediaUrl");
                                    }}
                                    aria-invalid={Boolean(
                                      routineErrors.mediaUrl,
                                    )}
                                    className={`w-full pl-5 pr-12 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-rose-500 focus:ring-4 focus:ring-rose-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all ${
                                      routineErrors.mediaUrl
                                        ? "form-input-invalid"
                                        : ""
                                    }`}
                                  />
                                </div>
                                {routineErrors.mediaUrl && (
                                  <p role="alert" className="form-error">
                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{routineErrors.mediaUrl}</span>
                                  </p>
                                )}
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
                                      onClick={() => {
                                        setFormData({
                                          ...formData,
                                          mediaType: "none",
                                          mediaUrl: "",
                                        });
                                        clearRoutineError("mediaUrl");
                                      }}
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
                            <div className="space-y-2" data-field="peiGoalDesc">
                              <div className="flex items-center justify-between gap-2">
                                <label
                                  data-tour="rt-build-pei"
                                  className="text-xs font-black uppercase tracking-widest text-slate-500"
                                >
                                  Descripción de la Meta (PEI)
                                </label>
                                <span className="text-[10px] font-semibold tabular-nums text-slate-400">
                                  {formData.peiGoalDesc.length}/500
                                </span>
                              </div>
                              <input
                                type="text"
                                name="peiGoalDesc"
                                maxLength={500}
                                value={formData.peiGoalDesc}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    peiGoalDesc: e.target.value,
                                  });
                                  clearRoutineError("peiGoalDesc");
                                }}
                                aria-invalid={Boolean(
                                  routineErrors.peiGoalDesc,
                                )}
                                className={`w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all ${
                                  routineErrors.peiGoalDesc
                                    ? "form-input-invalid"
                                    : ""
                                }`}
                                placeholder="Ej. Sostener contacto visual (10s)"
                              />
                              {routineErrors.peiGoalDesc && (
                                <p role="alert" className="form-error">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{routineErrors.peiGoalDesc}</span>
                                </p>
                              )}
                            </div>
                            <div
                              className="space-y-2"
                              data-field="peiGoalTrials"
                            >
                              <label className="text-xs font-black uppercase tracking-widest text-slate-500">
                                Criterio de Maestría (Ensayos Exitosos Totales)
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                name="peiGoalTrials"
                                maxLength={3}
                                value={formData.peiGoalTrials}
                                onChange={(e) => {
                                  const cleaned = sanitizeIntegerInput(
                                    e.target.value,
                                    3,
                                  );
                                  setFormData({
                                    ...formData,
                                    peiGoalTrials: cleaned,
                                  });
                                  clearRoutineError("peiGoalTrials");
                                }}
                                aria-invalid={Boolean(
                                  routineErrors.peiGoalTrials,
                                )}
                                className={`w-full px-5 py-4 bg-slate-50 dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 text-sm font-medium text-slate-900 dark:text-white transition-all ${
                                  routineErrors.peiGoalTrials
                                    ? "form-input-invalid"
                                    : ""
                                }`}
                                placeholder="Ej. 20 (entre 1 y 100)"
                              />
                              {routineErrors.peiGoalTrials && (
                                <p role="alert" className="form-error">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{routineErrors.peiGoalTrials}</span>
                                </p>
                              )}
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
                      onClick={handleAttemptCloseRoutine}
                      disabled={isRoutineSaving}
                      className="flex-[1] py-4 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      form="create-routine-form"
                      disabled={isRoutineSaving}
                      data-tour="rt-build-generate"
                      className="flex-[2] py-4 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 rounded-2xl shadow-xl shadow-blue-500/30 transition-all flex justify-center items-center gap-2 hover:-translate-y-1"
                    >
                      {isRoutineSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />{" "}
                          Guardando...
                        </>
                      ) : editingId ? (
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

            <ConfirmDialog
              isOpen={showDiscardRoutineConfirm}
              onClose={() => setShowDiscardRoutineConfirm(false)}
              onConfirm={handleDirectCloseRoutine}
              title="¿Descartar cambios de la terapia?"
              message="Hay cambios sin guardar en el constructor de terapias que se perderán si sales ahora."
              confirmLabel="Descartar y salir"
              cancelLabel="Seguir editando"
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
