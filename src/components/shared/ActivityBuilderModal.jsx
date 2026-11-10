import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  X,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  UploadCloud,
  Image as ImageIcon,
  Video,
  Link as LinkIcon,
  ExternalLink,
  Loader2,
  ListChecks,
  ListOrdered,
  SlidersHorizontal,
  Sparkles,
  Star,
  Lock,
  Users,
  Globe,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import {
  uploadToCloudinary,
  isCloudinaryReady,
  FOLDERS,
} from "../../config/cloudinary";
import ConfirmDialog from "./ConfirmDialog";
import {
  validateRequiredText,
  validateUrl,
  sanitizeIntegerInput,
  focusFirstError,
} from "../../utils/validators";

let stepIdCounter = 0;
export const createBuilderStepId = () =>
  `step_${Date.now()}_${++stepIdCounter}`;

export const isVideoUrl = (url = "") =>
  /youtube\.com|youtu\.be|vimeo\.com|\.mp4|\.m3u8|\.webm|\.mov/i.test(
    String(url || ""),
  );

export const parseStepDurationParts = (raw = "") => {
  const t = String(raw || "")
    .trim()
    .toLowerCase();
  const segMatch = t.match(/(\d+)\s*seg/);
  if (segMatch) {
    return {
      durationValue: String(parseInt(segMatch[1], 10) || 30),
      durationUnit: "seg",
    };
  }
  const hourMatch = t.match(/(\d+)\s*h/);
  if (hourMatch) {
    return {
      durationValue: String((parseInt(hourMatch[1], 10) || 1) * 60),
      durationUnit: "min",
    };
  }
  const numMatch = t.match(/(\d+)/);
  if (numMatch) {
    return {
      durationValue: String(parseInt(numMatch[1], 10) || 5),
      durationUnit: "min",
    };
  }
  return { durationValue: "5", durationUnit: "min" };
};

export const parseStepsForBuilder = (inst = "") => {
  const parsed = String(inst || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^\d+[.)]\s*(.*?)\s*\(([^)]+)\)\s*$/);
      const loose = !match ? line.match(/^(?:\d+[.)]|[-•*])\s*(.*)$/) : null;
      const text = (match ? match[1] : loose ? loose[1] : line).trim();
      const dur = parseStepDurationParts(match ? match[2] : "");
      return {
        id: createBuilderStepId(),
        text,
        durationValue: dur.durationValue,
        durationUnit: dur.durationUnit,
      };
    })
    .filter((s) => s.text);

  return parsed.length > 0
    ? parsed
    : [
        {
          id: createBuilderStepId(),
          text: "",
          durationValue: "5",
          durationUnit: "min",
        },
      ];
};

export const serializeBuilderSteps = (steps = []) =>
  (Array.isArray(steps) ? steps : [])
    .map((s, idx) => {
      const text = String(s?.text || "").trim();
      const val = parseInt(s?.durationValue, 10);
      const safeVal = Number.isFinite(val) && val > 0 ? val : 5;
      const unit = s?.durationUnit === "seg" ? "seg" : "min";
      return `${idx + 1}. ${text} (${safeVal} ${unit})`;
    })
    .join("\n");

export const calculateStepsTotalSeconds = (steps = []) =>
  (Array.isArray(steps) ? steps : []).reduce((acc, s) => {
    const val = parseInt(s?.durationValue, 10);
    if (!Number.isFinite(val) || val <= 0) return acc;
    return acc + (s?.durationUnit === "seg" ? val : val * 60);
  }, 0);

export const formatStepsDurationSummary = (totalSeconds = 0) => {
  const secs = Math.max(0, Math.round(totalSeconds));
  if (secs < 60) return `${secs} seg`;
  const mins = Math.floor(secs / 60);
  const rem = secs % 60;
  return rem === 0 ? `${mins} min` : `${mins} min ${rem} seg`;
};

const DURATION_PRESETS = [5, 10, 15, 20, 30];

const STEPS_META = [
  {
    num: 1,
    title: "Datos básicos y alcance",
    short: "Datos Básicos",
    icon: SlidersHorizontal,
  },
  { num: 2, title: "Pasos guiados", short: "Pasos Guiados", icon: ListOrdered },
  {
    num: 3,
    title: "Recursos y Meta PEI",
    short: "Recursos y PEI",
    icon: Sparkles,
  },
];

const getFieldStep = (key = "") => {
  if (key === "steps" || key.startsWith("step_")) return 2;
  if (
    key === "materials" ||
    key === "mediaUrl" ||
    key === "peiGoalDesc" ||
    key === "peiGoalTrials"
  ) {
    return 3;
  }
  return 1;
};

const getActiveMediaUrl = (form) => {
  if (form.mediaMode === "image") return String(form.imageUrl || "").trim();
  if (form.mediaMode === "video") return String(form.videoUrl || "").trim();
  return "";
};

const buildInitialForm = (editingRoutine, categories, selectedChildId) => {
  const activeCategories = (categories || []).filter(
    (c) => c.cat_estd !== false,
  );

  if (editingRoutine) {
    const matchedCat =
      categories.find((c) => c.cat_codi === editingRoutine.categoryCode) ||
      categories.find(
        (c) =>
          c.cat_nomb?.trim().toLowerCase() ===
          String(editingRoutine.category || "")
            .trim()
            .toLowerCase(),
      ) ||
      null;

    const existingMedia = String(editingRoutine.media || "").trim();
    const existingIsVideo = existingMedia ? isVideoUrl(existingMedia) : false;

    return {
      title: editingRoutine.title || "",
      description: editingRoutine.description || "",
      categoryCode: matchedCat?.cat_codi || "",
      durationMinutes: String(editingRoutine.act_time || 15),
      difficulty: editingRoutine.difficulty || "Baja",
      scope: editingRoutine.nin_codi ? "CHILD" : "GLOBAL",
      nin_codi: editingRoutine.nin_codi || selectedChildId || null,
      visibility:
        editingRoutine.visibility === "ESPECIALISTA" ? "ESPECIALISTA" : "AMBOS",
      status: editingRoutine.status === "Inactiva" ? "Inactiva" : "Activa",
      steps: parseStepsForBuilder(editingRoutine.inst),
      materials: editingRoutine.materials || "",
      mediaMode: existingMedia ? (existingIsVideo ? "video" : "image") : "none",
      imageUrl: existingMedia && !existingIsVideo ? existingMedia : "",
      videoUrl: existingMedia && existingIsVideo ? existingMedia : "",
      peiGoalDesc: "",
      peiGoalTrials: "20",
    };
  }

  return {
    title: "",
    description: "",
    categoryCode: activeCategories[0]?.cat_codi || "",
    durationMinutes: "15",
    difficulty: "Baja",
    scope: selectedChildId ? "CHILD" : "GLOBAL",
    nin_codi: selectedChildId || null,
    visibility: "AMBOS",
    status: "Activa",
    steps: [
      {
        id: createBuilderStepId(),
        text: "",
        durationValue: "5",
        durationUnit: "min",
      },
    ],
    materials: "",
    mediaMode: "none",
    imageUrl: "",
    videoUrl: "",
    peiGoalDesc: "",
    peiGoalTrials: "20",
  };
};

const normalizeSnapshot = (data, isEdit) =>
  JSON.stringify({
    title: String(data?.title || ""),
    description: String(data?.description || ""),
    categoryCode: String(data?.categoryCode || ""),
    durationMinutes: String(data?.durationMinutes || ""),
    difficulty: String(data?.difficulty || "Baja"),
    scope: String(data?.scope || "GLOBAL"),
    visibility: String(data?.visibility || "AMBOS"),
    status: isEdit ? String(data?.status || "Activa") : "Activa",
    steps: (data?.steps || []).map((s) => ({
      text: String(s?.text || ""),
      durationValue: String(s?.durationValue || ""),
      durationUnit: String(s?.durationUnit || "min"),
    })),
    materials: String(data?.materials || ""),
    mediaMode: String(data?.mediaMode || "none"),
    activeMediaUrl: getActiveMediaUrl(data || {}),
    peiGoalDesc: isEdit ? "" : String(data?.peiGoalDesc || ""),
    peiGoalTrials: isEdit ? "20" : String(data?.peiGoalTrials ?? "20"),
  });

export default function ActivityBuilderModal({
  isOpen,
  onClose,
  editingRoutine = null,
  categories = [],
  selectedChildId = "",
  childName = "",
  globalPeiGoals = [],
  createRoutine,
  updateRoutine,
  crearPeiGoal,
  showToast,
}) {
  const isEdit = Boolean(editingRoutine);
  const effectiveChildId = editingRoutine?.nin_codi || selectedChildId || null;

  const activeCategories = useMemo(
    () => categories.filter((c) => c.cat_estd !== false),
    [categories],
  );

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() =>
    buildInitialForm(editingRoutine, categories, selectedChildId),
  );
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Multimedia upload & preview states
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [imageBroken, setImageBroken] = useState(false);

  // Drag-and-drop step reorder state
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const modalBodyRef = useRef(null);
  const initialSnapshotRef = useRef("");
  const wasOpenRef = useRef(false);
  const prevRoutineIdRef = useRef(null);

  // Re-initialize form when modal opens or switches target routine
  useEffect(() => {
    const routineKey = editingRoutine?.id || "__create__";
    if (
      isOpen &&
      (!wasOpenRef.current || prevRoutineIdRef.current !== routineKey)
    ) {
      const initial = buildInitialForm(
        editingRoutine,
        categories,
        selectedChildId,
      );
      setForm(initial);
      initialSnapshotRef.current = normalizeSnapshot(
        initial,
        Boolean(editingRoutine),
      );
      setStep(1);
      setErrors({});
      setUploadProgress(null);
      setUploadError("");
      setImageBroken(false);
      setShowDiscardConfirm(false);
      setDraggedIdx(null);
      setDragOverIdx(null);
    }
    wasOpenRef.current = isOpen;
    prevRoutineIdRef.current = routineKey;
  }, [isOpen, editingRoutine, categories, selectedChildId]);

  // If categories arrive asynchronously after modal opens in create mode
  useEffect(() => {
    if (!isOpen || isEdit) return;
    if (!form.categoryCode && activeCategories.length > 0) {
      const firstCode = activeCategories[0].cat_codi;
      setForm((prev) => ({ ...prev, categoryCode: firstCode }));
      try {
        const snap = JSON.parse(initialSnapshotRef.current || "{}");
        if (!snap.categoryCode) {
          snap.categoryCode = firstCode;
          initialSnapshotRef.current = JSON.stringify(snap);
        }
      } catch {
        // Si no había snapshot válido, se omite
      }
    }
  }, [isOpen, isEdit, activeCategories, form.categoryCode]);

  const isDirty = useMemo(() => {
    if (!isOpen || !initialSnapshotRef.current) return false;
    return normalizeSnapshot(form, isEdit) !== initialSnapshotRef.current;
  }, [isOpen, form, isEdit]);

  const stepErrorCounts = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0 };
    Object.entries(errors).forEach(([key, val]) => {
      if (val) counts[getFieldStep(key)] += 1;
    });
    return counts;
  }, [errors]);

  const totalStepSeconds = useMemo(
    () => calculateStepsTotalSeconds(form.steps),
    [form.steps],
  );

  const suggestedMinutes = useMemo(
    () =>
      totalStepSeconds > 0
        ? Math.min(600, Math.max(1, Math.ceil(totalStepSeconds / 60)))
        : 1,
    [totalStepSeconds],
  );

  const parsedDurationMinutes = useMemo(() => {
    const n = parseInt(form.durationMinutes, 10);
    return Number.isFinite(n) ? n : 0;
  }, [form.durationMinutes]);

  const serializedGuideLength = useMemo(
    () => serializeBuilderSteps(form.steps).length,
    [form.steps],
  );

  const selectedCategoryObj = useMemo(
    () => categories.find((c) => c.cat_codi === form.categoryCode) || null,
    [categories, form.categoryCode],
  );

  const clearFieldError = useCallback((field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearStepErrors = useCallback(() => {
    setErrors((prev) => {
      const hasStepErr = Object.keys(prev).some(
        (k) => k === "steps" || k.startsWith("step_"),
      );
      if (!hasStepErr) return prev;
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (k === "steps" || k.startsWith("step_")) delete next[k];
      });
      return next;
    });
  }, []);

  const handleDirectClose = useCallback(() => {
    setShowDiscardConfirm(false);
    setErrors({});
    setUploadError("");
    setStep(1);
    onClose();
  }, [onClose]);

  const handleAttemptClose = useCallback(() => {
    if (isSaving) return;
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      handleDirectClose();
    }
  }, [isSaving, isDirty, handleDirectClose]);

  // Escape key closes modal safely
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (showDiscardConfirm) {
          setShowDiscardConfirm(false);
        } else {
          handleAttemptClose();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, showDiscardConfirm, handleAttemptClose]);

  // --- Validators per Step ---
  const validateStep1 = (data = form) => {
    const errs = {};
    const titleErr = validateRequiredText(
      data.title,
      "El nombre de la terapia",
      { min: 3, max: 60 },
    );
    if (titleErr) errs.title = titleErr;

    if (String(data.description || "").trim().length > 2000) {
      errs.description = "La descripción no puede exceder 2000 caracteres";
    }

    if (!data.categoryCode) {
      errs.category =
        activeCategories.length === 0
          ? "No hay categorías activas disponibles. Crea una en «Categorías»"
          : "Selecciona una categoría activa";
    } else {
      const cat = categories.find((c) => c.cat_codi === data.categoryCode);
      if (!cat || cat.cat_estd === false) {
        errs.category =
          "La categoría actual está inactiva. Selecciona una categoría activa";
      }
    }

    const durStr = String(data.durationMinutes ?? "").trim();
    const durNum = parseInt(durStr, 10);
    if (!durStr) {
      errs.durationMinutes = "La duración estimada es obligatoria";
    } else if (Number.isNaN(durNum) || durNum < 1 || durNum > 600) {
      errs.durationMinutes = "Ingresa entre 1 y 600 minutos";
    }

    if (data.scope === "CHILD" && !effectiveChildId) {
      errs.scope =
        "Selecciona un paciente activo o cambia el alcance a Catálogo general";
    }

    return errs;
  };

  const validateStep2 = (data = form) => {
    const errs = {};
    if (!Array.isArray(data.steps) || data.steps.length === 0) {
      errs.steps = "Agrega al menos 1 paso estructurado";
      return errs;
    }

    data.steps.forEach((s, idx) => {
      const txt = String(s?.text || "").trim();
      if (!txt) {
        errs[`step_${idx}`] =
          `La instrucción del paso ${idx + 1} es obligatoria`;
      } else if (txt.length < 2) {
        errs[`step_${idx}`] =
          `El paso ${idx + 1} debe tener al menos 2 caracteres`;
      } else if (txt.length > 300) {
        errs[`step_${idx}`] = `El paso ${idx + 1} excede 300 caracteres`;
      }

      const durVal = parseInt(String(s?.durationValue ?? "").trim(), 10);
      const unit = s?.durationUnit === "seg" ? "seg" : "min";
      if (!String(s?.durationValue ?? "").trim() || Number.isNaN(durVal)) {
        errs[`step_${idx}_time`] = "Indica un tiempo numérico";
      } else if (unit === "min" && (durVal < 1 || durVal > 180)) {
        errs[`step_${idx}_time`] = "Entre 1 y 180 min";
      } else if (unit === "seg" && (durVal < 5 || durVal > 3600)) {
        errs[`step_${idx}_time`] = "Entre 5 y 3600 seg";
      }
    });

    const combinedLen = serializeBuilderSteps(data.steps).length;
    if (combinedLen > 2000) {
      errs.steps = `La guía combinada (${combinedLen}/2000 car.) supera el límite permitido`;
    }

    return errs;
  };

  const validateStep3 = (data = form) => {
    const errs = {};
    if (String(data.materials || "").length > 2000) {
      errs.materials = "Los materiales no pueden exceder 2000 caracteres";
    }

    if (data.mediaMode === "video") {
      const urlErr = validateUrl(data.videoUrl, { required: true });
      if (urlErr) errs.mediaUrl = urlErr;
    } else if (data.mediaMode === "image" && data.imageUrl) {
      const urlErr = validateUrl(data.imageUrl, { required: false });
      if (urlErr) errs.mediaUrl = urlErr;
    }

    if (!isEdit) {
      const peiDesc = String(data.peiGoalDesc || "").trim();
      if (peiDesc) {
        const descErr = validateRequiredText(
          peiDesc,
          "La descripción de la meta PEI",
          { min: 3, max: 500 },
        );
        if (descErr) errs.peiGoalDesc = descErr;

        const trialsStr = String(data.peiGoalTrials ?? "").trim();
        const trialsNum = parseInt(trialsStr, 10);
        if (
          !trialsStr ||
          Number.isNaN(trialsNum) ||
          trialsNum < 1 ||
          trialsNum > 100
        ) {
          errs.peiGoalTrials = "Ingresa entre 1 y 100 ensayos";
        }
      }
    }

    return errs;
  };

  const goToStep = (targetStep) => {
    setStep(targetStep);
    modalBodyRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    const stepErrs = step === 1 ? validateStep1() : validateStep2();
    if (Object.keys(stepErrs).length > 0) {
      setErrors((prev) => ({ ...prev, ...stepErrs }));
      requestAnimationFrame(() => focusFirstError(stepErrs, modalBodyRef));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((k) => {
        if (getFieldStep(k) === step) delete next[k];
      });
      return next;
    });
    goToStep(Math.min(3, step + 1));
  };

  // --- Step Management Handlers ---
  const handleAddStep = () => {
    setForm((prev) => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          id: createBuilderStepId(),
          text: "",
          durationValue: "5",
          durationUnit: "min",
        },
      ],
    }));
    clearFieldError("steps");
  };

  const handleRemoveStep = (idToRemove) => {
    if (form.steps.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== idToRemove),
    }));
    clearStepErrors();
  };

  const handleStepFieldChange = (id, field, value, idx) => {
    setForm((prev) => ({
      ...prev,
      steps: prev.steps.map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      ),
    }));
    if (field === "text") clearFieldError(`step_${idx}`);
    if (field === "durationValue" || field === "durationUnit") {
      clearFieldError(`step_${idx}_time`);
    }
    clearFieldError("steps");
  };

  const moveStep = (fromIdx, toIdx) => {
    if (
      fromIdx === toIdx ||
      fromIdx < 0 ||
      toIdx < 0 ||
      fromIdx >= form.steps.length ||
      toIdx >= form.steps.length
    ) {
      return;
    }
    setForm((prev) => {
      const copy = [...prev.steps];
      const [moved] = copy.splice(fromIdx, 1);
      copy.splice(toIdx, 0, moved);
      return { ...prev, steps: copy };
    });
    clearStepErrors();
  };

  // --- Sync Total Duration from Steps ---
  const handleSyncTotalDuration = () => {
    setForm((prev) => ({
      ...prev,
      durationMinutes: String(suggestedMinutes),
    }));
    clearFieldError("durationMinutes");
    showToast?.(`⏱️ Duración total ajustada a ${suggestedMinutes} min.`);
  };

  // --- Image Upload ---
  const handleImageFileSelect = async (file) => {
    if (!file) return;
    setUploadError("");
    clearFieldError("mediaUrl");
    if (!file.type.startsWith("image/")) {
      setUploadError("Solo se permiten imágenes (PNG, JPG, SVG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("La imagen no puede superar los 5 MB.");
      return;
    }
    if (!isCloudinaryReady()) {
      setUploadError("Cloudinary no está configurado en este entorno.");
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
      setImageBroken(false);
      setForm((prev) => ({
        ...prev,
        mediaMode: "image",
        imageUrl: url,
      }));
    } catch {
      setUploadError("No se pudo subir la imagen. Inténtalo nuevamente.");
    } finally {
      setUploadProgress(null);
    }
  };

  // --- Final Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;
    if (uploadProgress !== null) {
      showToast?.("⏳ Espera a que termine de subir la imagen.");
      return;
    }

    const e1 = validateStep1();
    const e2 = validateStep2();
    const e3 = validateStep3();
    const allErrors = { ...e1, ...e2, ...e3 };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      const firstInvalidStep =
        Object.keys(e1).length > 0 ? 1 : Object.keys(e2).length > 0 ? 2 : 3;
      setStep(firstInvalidStep);
      const focusTargetErrors =
        firstInvalidStep === 1 ? e1 : firstInvalidStep === 2 ? e2 : e3;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          focusFirstError(focusTargetErrors, modalBodyRef);
        });
      });
      return;
    }

    const activeMediaUrl = getActiveMediaUrl(form);
    const payloadData = {
      title: form.title.trim(),
      description: form.description,
      category: selectedCategoryObj?.cat_nomb || "",
      categoryCode: form.categoryCode,
      durationMinutes: parseInt(form.durationMinutes, 10) || 15,
      durationStr: `${parseInt(form.durationMinutes, 10) || 15} min`,
      difficulty: form.difficulty,
      scope: form.scope,
      nin_codi: form.scope === "CHILD" ? effectiveChildId : null,
      visibility: form.visibility,
      status: isEdit ? form.status : "Activa",
      steps: form.steps.map((s) => ({
        id: s.id,
        text: String(s.text || "").trim(),
        durationValue: parseInt(s.durationValue, 10) || 5,
        durationUnit: s.durationUnit === "seg" ? "seg" : "min",
      })),
      materials: form.materials,
      mediaType: form.mediaMode,
      mediaUrl: activeMediaUrl,
    };

    setIsSaving(true);
    try {
      const res = isEdit
        ? await updateRoutine(editingRoutine.id, payloadData)
        : await createRoutine(payloadData);

      if (res && res.ok === false) {
        const rawSrv = res.fieldErrors || {};
        const mappedSrv = { ...rawSrv };
        if (mappedSrv.durationStr && !mappedSrv.durationMinutes) {
          mappedSrv.durationMinutes = mappedSrv.durationStr;
          delete mappedSrv.durationStr;
        }
        if (Object.keys(mappedSrv).length > 0) {
          setErrors(mappedSrv);
          const firstSrvStep = [1, 2, 3].find((sNum) =>
            Object.keys(mappedSrv).some(
              (k) => mappedSrv[k] && getFieldStep(k) === sNum,
            ),
          );
          if (firstSrvStep) setStep(firstSrvStep);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              focusFirstError(mappedSrv, modalBodyRef);
            });
          });
        }
        return;
      }

      const peiDesc = String(form.peiGoalDesc || "").trim();
      const peiTrials = parseInt(form.peiGoalTrials, 10) || 20;
      if (
        !isEdit &&
        peiDesc &&
        selectedChildId &&
        typeof crearPeiGoal === "function"
      ) {
        try {
          await crearPeiGoal(selectedChildId, {
            met_desc: peiDesc,
            met_ttria: peiTrials,
          });
        } catch (peiErr) {
          console.error("Error al crear meta PEI asociada:", peiErr);
          showToast?.(
            "⚠️ Terapia creada, pero no se pudo asociar la meta PEI automática.",
          );
        }
      }

      handleDirectClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/55 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 300);
          }
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="activity-builder-title"
          className={`bg-[#f8fafc] dark:bg-[#1a2332] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl flex flex-col border-t border-slate-200 dark:border-slate-700/80 sm:border max-h-[95dvh] sm:max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 transition-transform ${
            isShaking ? "scale-[1.01] ring-2 ring-blue-500/30" : ""
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header Navy Institucional ── */}
          <div className="relative px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white border-b border-slate-700/60 dark:border-slate-800 shrink-0">
            <div className="sm:hidden absolute top-1.5 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-white/30" />
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl shrink-0 border border-blue-400/20">
                  {isEdit ? (
                    <Pencil className="w-5 h-5" />
                  ) : (
                    <ListChecks className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <h2
                    id="activity-builder-title"
                    className="text-base sm:text-lg font-bold text-white tracking-tight truncate"
                  >
                    {isEdit ? "Editar Terapia" : "Constructor de Terapias"}
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm mt-0.5 truncate">
                    {isEdit
                      ? editingRoutine?.title
                      : "Configura los parámetros, pasos guiados y recursos en 3 pasos."}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAttemptClose}
                aria-label="Cerrar constructor de terapias"
                className="text-slate-300 hover:text-white p-2.5 -m-1 rounded-lg hover:bg-white/10 transition-colors shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ── Stepper 3 Pasos ── */}
          <nav
            aria-label="Pasos del constructor"
            className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 shrink-0"
          >
            <div className="flex items-center gap-0">
              {STEPS_META.map((s, idx) => {
                const Icon = s.icon;
                const isActive = step === s.num;
                const isCompleted = step > s.num;
                const errCount = stepErrorCounts[s.num] || 0;
                return (
                  <div
                    key={s.num}
                    className="flex items-center flex-1 last:flex-initial"
                  >
                    <button
                      type="button"
                      onClick={() => goToStep(s.num)}
                      aria-current={isActive ? "step" : undefined}
                      className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
                    >
                      <div className="relative">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 shadow-sm ${
                            errCount > 0
                              ? "bg-rose-50 text-rose-600 border-2 border-rose-500 dark:bg-rose-950/60 dark:text-rose-300"
                              : isActive
                                ? "bg-brand-600 text-white ring-4 ring-brand-200 dark:ring-brand-900"
                                : isCompleted
                                  ? "bg-brand-500 text-white"
                                  : "bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-400 group-hover:border-brand-400"
                          }`}
                        >
                          {isCompleted && errCount === 0 ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Icon className="w-4 h-4" />
                          )}
                        </div>
                        {errCount > 0 && (
                          <span
                            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black leading-none flex items-center justify-center shadow"
                            title={`${errCount} campo(s) por revisar`}
                          >
                            {errCount}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-semibold whitespace-nowrap ${
                          errCount > 0
                            ? "text-rose-600 dark:text-rose-400"
                            : isActive || isCompleted
                              ? "text-brand-600 dark:text-brand-400"
                              : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {s.short}
                      </span>
                    </button>
                    {idx < STEPS_META.length - 1 && (
                      <div className="flex-1 h-0.5 mx-2 mb-4 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full bg-brand-500 rounded-full transition-all duration-300 ${
                            step > s.num ? "w-full" : "w-0"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </nav>

          {/* ── Scrollable Form Body ── */}
          <div
            ref={modalBodyRef}
            className="overflow-y-auto flex-1 px-4 sm:px-6 py-5"
          >
            <form
              id="activity-builder-form"
              noValidate
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              {/* ════════ PASO 1: DATOS BÁSICOS Y ALCANCE ════════ */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div>
                    <div className="form-section-title">
                      <SlidersHorizontal className="form-section-title-icon" />
                      <span className="form-section-title-text">
                        Información Principal
                      </span>
                      <div className="form-section-title-line" />
                    </div>

                    <div className="space-y-4">
                      {/* Nombre de la Terapia */}
                      <div data-field="title">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <label
                            htmlFor="act-title"
                            className="form-label form-label-inline"
                          >
                            Nombre de la Terapia{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <span
                            className={`text-[10px] font-semibold tabular-nums ${
                              form.title.length >= 60
                                ? "text-rose-500"
                                : "text-slate-400"
                            }`}
                          >
                            {form.title.length}/60
                          </span>
                        </div>
                        <input
                          id="act-title"
                          type="text"
                          name="title"
                          maxLength={60}
                          value={form.title}
                          onChange={(e) => {
                            setForm((p) => ({ ...p, title: e.target.value }));
                            clearFieldError("title");
                          }}
                          aria-invalid={Boolean(errors.title)}
                          placeholder="Ej. Terapia Sensorial con Espuma"
                          className={`form-input border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-600 ${
                            errors.title ? "form-input-invalid" : ""
                          }`}
                        />
                        {errors.title && (
                          <p role="alert" className="form-error">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.title}</span>
                          </p>
                        )}
                      </div>

                      {/* Descripción Clínica */}
                      <div data-field="description">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <label
                            htmlFor="act-desc"
                            className="form-label form-label-inline"
                          >
                            Descripción Clínica (Opcional)
                          </label>
                          <span className="text-[10px] font-semibold tabular-nums text-slate-400">
                            {form.description.length}/2000
                          </span>
                        </div>
                        <textarea
                          id="act-desc"
                          rows={2}
                          name="description"
                          maxLength={2000}
                          value={form.description}
                          onChange={(e) => {
                            setForm((p) => ({
                              ...p,
                              description: e.target.value,
                            }));
                            clearFieldError("description");
                          }}
                          aria-invalid={Boolean(errors.description)}
                          placeholder="Ej. Actividad orientada a estimular el sistema táctil y propioceptivo con calma."
                          className={`form-textarea border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-600 resize-none ${
                            errors.description ? "form-input-invalid" : ""
                          }`}
                        />
                        {errors.description && (
                          <p role="alert" className="form-error">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.description}</span>
                          </p>
                        )}
                      </div>

                      {/* Categoría & Duración */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div data-field="category">
                          <label htmlFor="act-category" className="form-label">
                            Categoría <span className="text-rose-500">*</span>
                          </label>
                          <select
                            id="act-category"
                            name="category"
                            value={form.categoryCode}
                            onChange={(e) => {
                              setForm((p) => ({
                                ...p,
                                categoryCode: e.target.value,
                              }));
                              clearFieldError("category");
                            }}
                            aria-invalid={Boolean(errors.category)}
                            className={`form-select border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/40 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-600 ${
                              errors.category ? "form-input-invalid" : ""
                            }`}
                          >
                            {activeCategories.length === 0 ? (
                              <option value="">Sin categorías activas</option>
                            ) : (
                              !selectedCategoryObj && (
                                <option value="" disabled>
                                  Selecciona una categoría...
                                </option>
                              )
                            )}
                            {selectedCategoryObj?.cat_estd === false && (
                              <option
                                value={selectedCategoryObj.cat_codi}
                                disabled
                              >
                                {selectedCategoryObj.cat_nomb} (Inactiva)
                              </option>
                            )}
                            {activeCategories.map((cat) => (
                              <option key={cat.cat_codi} value={cat.cat_codi}>
                                {cat.cat_nomb}
                              </option>
                            ))}
                          </select>
                          {errors.category && (
                            <p role="alert" className="form-error">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{errors.category}</span>
                            </p>
                          )}
                          {!errors.category &&
                            selectedCategoryObj?.cat_estd === false && (
                              <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                La categoría actual fue desactivada. Elige una
                                activa.
                              </p>
                            )}
                        </div>

                        <div data-field="durationMinutes">
                          <label htmlFor="act-duration" className="form-label">
                            Duración Estimada{" "}
                            <span className="text-rose-500">*</span>
                          </label>
                          <div className="relative flex items-center">
                            <input
                              id="act-duration"
                              type="text"
                              inputMode="numeric"
                              name="durationMinutes"
                              maxLength={3}
                              value={form.durationMinutes}
                              onChange={(e) => {
                                const cleaned = sanitizeIntegerInput(
                                  e.target.value,
                                  3,
                                );
                                setForm((p) => ({
                                  ...p,
                                  durationMinutes: cleaned,
                                }));
                                clearFieldError("durationMinutes");
                              }}
                              aria-invalid={Boolean(errors.durationMinutes)}
                              placeholder="15"
                              className={`form-input pr-12 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-600 ${
                                errors.durationMinutes
                                  ? "form-input-invalid"
                                  : ""
                              }`}
                            />
                            <span className="absolute right-3 text-xs font-semibold text-slate-400 pointer-events-none">
                              min
                            </span>
                          </div>
                          {errors.durationMinutes && (
                            <p role="alert" className="form-error">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{errors.durationMinutes}</span>
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {DURATION_PRESETS.map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  setForm((p) => ({
                                    ...p,
                                    durationMinutes: String(preset),
                                  }));
                                  clearFieldError("durationMinutes");
                                }}
                                className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors border ${
                                  String(form.durationMinutes) ===
                                  String(preset)
                                    ? "bg-brand-50 border-brand-500 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"
                                }`}
                              >
                                {preset}m
                              </button>
                            ))}
                            {totalStepSeconds > 0 &&
                              suggestedMinutes !== parsedDurationMinutes && (
                                <button
                                  type="button"
                                  onClick={handleSyncTotalDuration}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Pasos: {suggestedMinutes}m
                                </button>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Dificultad */}
                      <div>
                        <label className="form-label">
                          Dificultad Esperada
                        </label>
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            {
                              id: "Baja",
                              active:
                                "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-500 dark:text-emerald-300",
                            },
                            {
                              id: "Media",
                              active:
                                "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/30 dark:border-amber-500 dark:text-amber-300",
                            },
                            {
                              id: "Alta",
                              active:
                                "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-900/30 dark:border-rose-500 dark:text-rose-300",
                            },
                          ].map((diff) => (
                            <button
                              key={diff.id}
                              type="button"
                              onClick={() =>
                                setForm((p) => ({ ...p, difficulty: diff.id }))
                              }
                              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                                form.difficulty === diff.id
                                  ? diff.active
                                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300"
                              }`}
                            >
                              {diff.id}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Alcance y Visibilidad */}
                  <div>
                    <div className="form-section-title">
                      <Users className="form-section-title-icon" />
                      <span className="form-section-title-text">
                        Alcance, Visibilidad{isEdit ? " y Estado" : ""}
                      </span>
                      <div className="form-section-title-line" />
                    </div>

                    <div className="space-y-4">
                      {/* Scope */}
                      <div data-field="scope">
                        <label className="form-label">
                          Alcance de la Actividad
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            disabled={!effectiveChildId}
                            onClick={() => {
                              setForm((p) => ({ ...p, scope: "CHILD" }));
                              clearFieldError("scope");
                            }}
                            className={`text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                              form.scope === "CHILD"
                                ? "bg-blue-50/90 border-blue-500 text-blue-900 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-200 ring-2 ring-blue-500/15"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${
                                form.scope === "CHILD"
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                              }`}
                            >
                              <UserCheck className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold leading-tight">
                                Solo este paciente
                              </p>
                              <p className="text-[11px] opacity-80 mt-0.5 leading-snug truncate">
                                {effectiveChildId
                                  ? editingRoutine?.nin_codi &&
                                    editingRoutine.nin_codi !== selectedChildId
                                    ? `Paciente asignado (${editingRoutine.nin_codi})`
                                    : childName ||
                                      "Paciente activo seleccionado"
                                  : "Selecciona un paciente arriba primero"}
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setForm((p) => ({ ...p, scope: "GLOBAL" }));
                              clearFieldError("scope");
                            }}
                            className={`text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                              form.scope === "GLOBAL"
                                ? "bg-blue-50/90 border-blue-500 text-blue-900 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-200 ring-2 ring-blue-500/15"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <div
                              className={`p-1.5 rounded-lg shrink-0 ${
                                form.scope === "GLOBAL"
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                              }`}
                            >
                              <Globe className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold leading-tight">
                                Catálogo general
                              </p>
                              <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
                                Disponible para todos los pacientes
                              </p>
                            </div>
                          </button>
                        </div>
                        {errors.scope && (
                          <p role="alert" className="form-error">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.scope}</span>
                          </p>
                        )}
                      </div>

                      {/* Visibilidad */}
                      <div>
                        <label className="form-label">Visibilidad</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            {
                              id: "AMBOS",
                              title: "Especialista y Representante",
                              desc: "Disponible en consulta y en Día a Día.",
                              icon: Users,
                            },
                            {
                              id: "ESPECIALISTA",
                              title: "Solo Especialista",
                              desc: "Uso interno clínico; oculta al representante.",
                              icon: Lock,
                            },
                          ].map((opt) => {
                            const Icon = opt.icon;
                            const active = form.visibility === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  setForm((p) => ({ ...p, visibility: opt.id }))
                                }
                                className={`text-left p-3 rounded-xl border transition-all flex items-start gap-2.5 ${
                                  active
                                    ? "bg-blue-50/90 border-blue-500 text-blue-900 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-200 ring-2 ring-blue-500/15"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300"
                                }`}
                              >
                                <div
                                  className={`p-1.5 rounded-lg shrink-0 ${
                                    active
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                                  }`}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold leading-tight">
                                    {opt.title}
                                  </p>
                                  <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
                                    {opt.desc}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Estado en edición */}
                      {isEdit && (
                        <div>
                          <label className="form-label">Estado</label>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              {
                                id: "Activa",
                                label: "Activa",
                                sub: "Lista para iniciar sesiones",
                                activeCls:
                                  "bg-emerald-50 border-emerald-500 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
                              },
                              {
                                id: "Inactiva",
                                label: "Inactiva",
                                sub: "Archivada (no iniciable)",
                                activeCls:
                                  "bg-slate-200/80 border-slate-500 text-slate-800 dark:bg-slate-700 dark:border-slate-400 dark:text-white",
                              },
                            ].map((st) => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() =>
                                  setForm((p) => ({ ...p, status: st.id }))
                                }
                                className={`text-left px-3 py-2.5 rounded-xl border transition-all ${
                                  form.status === st.id
                                    ? st.activeCls
                                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-400"
                                }`}
                              >
                                <p className="text-xs font-bold">{st.label}</p>
                                <p className="text-[11px] opacity-80">
                                  {st.sub}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ════════ PASO 2: PASOS GUIADOS ════════ */}
              {step === 2 && (
                <div
                  className="space-y-4 animate-in fade-in duration-200"
                  data-field="steps"
                >
                  <div className="form-section-title">
                    <ListOrdered className="form-section-title-icon" />
                    <span className="form-section-title-text">
                      Secuencia Paso a Paso
                    </span>
                    <div className="form-section-title-line" />
                  </div>

                  {/* Barra de resumen de tiempos + caracteres */}
                  <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                      <span>
                        Suma de pasos:{" "}
                        <strong className="font-bold">
                          {formatStepsDurationSummary(totalStepSeconds)}
                        </strong>
                      </span>
                      {suggestedMinutes !== parsedDurationMinutes ? (
                        <button
                          type="button"
                          onClick={handleSyncTotalDuration}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Aplicar al total ({suggestedMinutes} min)
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          · Sincronizada
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-semibold tabular-nums ${
                        serializedGuideLength > 2000
                          ? "text-rose-600 dark:text-rose-400 font-bold"
                          : "text-slate-400"
                      }`}
                    >
                      {serializedGuideLength}/2000 car.
                    </span>
                  </div>

                  {errors.steps && (
                    <p role="alert" className="form-error">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.steps}</span>
                    </p>
                  )}

                  {/* Tarjetas de pasos */}
                  <div className="space-y-3">
                    {form.steps.map((stepItem, index) => {
                      const textErr = errors[`step_${index}`];
                      const timeErr = errors[`step_${index}_time`];
                      const isDragTarget =
                        dragOverIdx === index &&
                        draggedIdx !== null &&
                        draggedIdx !== index;
                      return (
                        <div
                          key={stepItem.id}
                          onDragOver={(e) => {
                            if (draggedIdx === null) return;
                            e.preventDefault();
                            if (dragOverIdx !== index) setDragOverIdx(index);
                          }}
                          onDragLeave={() => {
                            if (dragOverIdx === index) setDragOverIdx(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            if (draggedIdx !== null) {
                              moveStep(draggedIdx, index);
                            }
                            setDraggedIdx(null);
                            setDragOverIdx(null);
                          }}
                          className={`flex items-start gap-2.5 sm:gap-3 p-3.5 rounded-xl border bg-white dark:bg-slate-800/70 transition-all ${
                            textErr || timeErr
                              ? "border-rose-400 dark:border-rose-500 ring-1 ring-rose-500/15"
                              : isDragTarget
                                ? "border-brand-500 ring-2 ring-brand-500/25 bg-brand-50/30 dark:bg-brand-900/20"
                                : draggedIdx === index
                                  ? "border-slate-300 opacity-60"
                                  : "border-slate-200 dark:border-slate-700"
                          }`}
                        >
                          {/* Reorder Controls: Drag handle + Up/Down */}
                          <div className="flex flex-col items-center gap-0.5 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => moveStep(index, index - 1)}
                              disabled={index === 0}
                              aria-label={`Subir paso ${index + 1}`}
                              title="Subir paso"
                              className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <div
                              draggable
                              onDragStart={(e) => {
                                setDraggedIdx(index);
                                if (e.dataTransfer) {
                                  e.dataTransfer.effectAllowed = "move";
                                  e.dataTransfer.setData(
                                    "text/plain",
                                    String(index),
                                  );
                                }
                              }}
                              onDragEnd={() => {
                                setDraggedIdx(null);
                                setDragOverIdx(null);
                              }}
                              title="Arrastrar para reordenar"
                              className="p-0.5 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <button
                              type="button"
                              onClick={() => moveStep(index, index + 1)}
                              disabled={index === form.steps.length - 1}
                              aria-label={`Bajar paso ${index + 1}`}
                              title="Bajar paso"
                              className="p-1 rounded text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-25 disabled:cursor-not-allowed"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Badge número */}
                          <span className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-xs font-black shrink-0 mt-1">
                            {index + 1}
                          </span>

                          {/* Contenido del paso */}
                          <div className="flex-1 min-w-0 space-y-2">
                            <div data-field={`step_${index}`}>
                              <input
                                type="text"
                                name={`step_${index}`}
                                maxLength={300}
                                value={stepItem.text}
                                onChange={(e) =>
                                  handleStepFieldChange(
                                    stepItem.id,
                                    "text",
                                    e.target.value,
                                    index,
                                  )
                                }
                                aria-label={`Instrucción del paso ${index + 1}`}
                                aria-invalid={Boolean(textErr)}
                                placeholder="Instrucción corta (Ej. Colocar el material en la mesa)"
                                className={`form-input border border-slate-300 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-900/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-600 ${
                                  textErr ? "form-input-invalid" : ""
                                }`}
                              />
                              {textErr && (
                                <p role="alert" className="form-error">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{textErr}</span>
                                </p>
                              )}
                            </div>

                            {/* Duración estructurada numérica + unidad */}
                            <div data-field={`step_${index}_time`}>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  Tiempo:
                                </span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  name={`step_${index}_time`}
                                  maxLength={4}
                                  value={stepItem.durationValue}
                                  onChange={(e) =>
                                    handleStepFieldChange(
                                      stepItem.id,
                                      "durationValue",
                                      sanitizeIntegerInput(e.target.value, 4),
                                      index,
                                    )
                                  }
                                  aria-label={`Duración del paso ${index + 1}`}
                                  aria-invalid={Boolean(timeErr)}
                                  className={`w-20 px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 outline-none focus:border-brand-600 tabular-nums ${
                                    timeErr ? "form-input-invalid" : ""
                                  }`}
                                />
                                <select
                                  aria-label={`Unidad del paso ${index + 1}`}
                                  value={stepItem.durationUnit}
                                  onChange={(e) =>
                                    handleStepFieldChange(
                                      stepItem.id,
                                      "durationUnit",
                                      e.target.value,
                                      index,
                                    )
                                  }
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 outline-none focus:border-brand-600 cursor-pointer"
                                >
                                  <option value="min">min</option>
                                  <option value="seg">seg</option>
                                </select>
                              </div>
                              {timeErr && (
                                <p role="alert" className="form-error">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{timeErr}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Eliminar paso */}
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(stepItem.id)}
                            disabled={form.steps.length <= 1}
                            aria-label={`Eliminar paso ${index + 1}`}
                            title={
                              form.steps.length <= 1
                                ? "Debe haber al menos 1 paso"
                                : "Eliminar paso"
                            }
                            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors disabled:opacity-25 disabled:cursor-not-allowed shrink-0 mt-0.5"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Agregar Paso */}
                  <button
                    data-tour="rt-build-steps"
                    type="button"
                    onClick={handleAddStep}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-brand-400 dark:border-brand-700 bg-brand-50/40 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300 text-xs font-bold hover:bg-brand-50 dark:hover:bg-brand-900/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" /> Agregar Paso (
                    {form.steps.length})
                  </button>
                </div>
              )}

              {/* ════════ PASO 3: RECURSOS Y META PEI ════════ */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Materiales */}
                  <div>
                    <div className="form-section-title">
                      <ImageIcon className="form-section-title-icon" />
                      <span className="form-section-title-text">
                        Materiales y Soporte Multimedia
                      </span>
                      <div className="form-section-title-line" />
                    </div>

                    <div className="space-y-4">
                      <div data-field="materials">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <label
                            htmlFor="act-materials"
                            className="form-label form-label-inline"
                          >
                            Materiales Requeridos (Opcional)
                          </label>
                          <span className="text-[10px] font-semibold tabular-nums text-slate-400">
                            {form.materials.length}/2000
                          </span>
                        </div>
                        <textarea
                          id="act-materials"
                          rows={2}
                          name="materials"
                          maxLength={2000}
                          value={form.materials}
                          onChange={(e) => {
                            setForm((p) => ({
                              ...p,
                              materials: e.target.value,
                            }));
                            clearFieldError("materials");
                          }}
                          aria-invalid={Boolean(errors.materials)}
                          placeholder="Ej. Pelota de yoga, Arena cinética, Fichas de colores (separados por comas)"
                          className={`form-textarea border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-600 resize-none ${
                            errors.materials ? "form-input-invalid" : ""
                          }`}
                        />
                        {errors.materials && (
                          <p role="alert" className="form-error">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{errors.materials}</span>
                          </p>
                        )}
                      </div>

                      {/* Selector de modo multimedia */}
                      <div>
                        <label className="form-label">
                          Soporte Multimedia (Opcional)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: "none", label: "Sin soporte", icon: X },
                            {
                              id: "image",
                              label: "Imagen / Pictograma",
                              icon: ImageIcon,
                            },
                            {
                              id: "video",
                              label: "Video de Referencia",
                              icon: Video,
                            },
                          ].map((opt) => {
                            const Icon = opt.icon;
                            const active = form.mediaMode === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => {
                                  setForm((p) => ({ ...p, mediaMode: opt.id }));
                                  clearFieldError("mediaUrl");
                                  setUploadError("");
                                }}
                                className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
                                  active
                                    ? opt.id === "video"
                                      ? "bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300"
                                      : "bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300"
                                }`}
                              >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span className="truncate">{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Modo Imagen */}
                        {form.mediaMode === "image" && (
                          <div className="mt-3" data-field="mediaUrl">
                            <div
                              onClick={() =>
                                uploadProgress === null &&
                                fileInputRef.current?.click()
                              }
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                handleImageFileSelect(
                                  e.dataTransfer.files?.[0],
                                );
                              }}
                              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-5 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-900/30 hover:border-brand-400 transition-colors cursor-pointer"
                            >
                              {uploadProgress !== null ? (
                                <>
                                  <Loader2 className="w-7 h-7 text-brand-600 animate-spin mb-2" />
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    Subiendo imagen… {uploadProgress}%
                                  </p>
                                  <div className="w-44 h-1.5 mt-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-brand-600 transition-all"
                                      style={{ width: `${uploadProgress}%` }}
                                    />
                                  </div>
                                </>
                              ) : form.imageUrl ? (
                                <div className="flex flex-col items-center gap-2.5 w-full">
                                  {imageBroken ? (
                                    <div className="px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                      <AlertTriangle className="w-4 h-4 shrink-0" />
                                      <span>
                                        No se pudo previsualizar la imagen
                                        guardada.
                                      </span>
                                    </div>
                                  ) : (
                                    <img
                                      src={form.imageUrl}
                                      alt="Pictograma de la actividad"
                                      onError={() => setImageBroken(true)}
                                      className="max-h-40 max-w-full rounded-lg object-contain border border-slate-200 dark:border-slate-700"
                                    />
                                  )}
                                  <div className="flex items-center gap-3">
                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Imagen adjunta
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setImageBroken(false);
                                        setForm((p) => ({
                                          ...p,
                                          imageUrl: "",
                                        }));
                                      }}
                                      className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:underline"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Quitar
                                      imagen
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
                                    <UploadCloud className="w-5 h-5" />
                                  </div>
                                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                    Arrastra una imagen o haz clic para
                                    seleccionar
                                  </p>
                                  <p className="text-[11px] text-slate-400 mt-1">
                                    PNG, JPG, SVG o WebP (Máx 5 MB)
                                  </p>
                                </>
                              )}
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml,image/webp,image/jpg"
                                className="hidden"
                                onChange={(e) =>
                                  handleImageFileSelect(e.target.files?.[0])
                                }
                              />
                            </div>
                            {uploadError && (
                              <p role="alert" className="form-error">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{uploadError}</span>
                              </p>
                            )}
                          </div>
                        )}

                        {/* Modo Video */}
                        {form.mediaMode === "video" && (
                          <div className="mt-3 space-y-2" data-field="mediaUrl">
                            <div className="relative">
                              <input
                                type="url"
                                name="mediaUrl"
                                value={form.videoUrl}
                                onChange={(e) => {
                                  setForm((p) => ({
                                    ...p,
                                    videoUrl: e.target.value,
                                  }));
                                  clearFieldError("mediaUrl");
                                }}
                                aria-label="URL del video de referencia"
                                aria-invalid={Boolean(errors.mediaUrl)}
                                placeholder="https://youtube.com/watch?v=..."
                                className={`form-input pr-10 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-600 ${
                                  errors.mediaUrl ? "form-input-invalid" : ""
                                }`}
                              />
                              <LinkIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                            {errors.mediaUrl && (
                              <p role="alert" className="form-error">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{errors.mediaUrl}</span>
                              </p>
                            )}
                            {form.videoUrl.trim() && !errors.mediaUrl && (
                              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                                <a
                                  href={form.videoUrl.trim()}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5 truncate hover:underline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">
                                    {form.videoUrl.trim()}
                                  </span>
                                </a>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForm((p) => ({ ...p, videoUrl: "" }));
                                    clearFieldError("mediaUrl");
                                  }}
                                  className="text-xs font-bold text-rose-600 hover:underline shrink-0"
                                >
                                  Limpiar
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Meta PEI */}
                  <div data-tour="rt-build-pei">
                    <div className="form-section-title">
                      <Star className="form-section-title-icon" />
                      <span className="form-section-title-text">
                        Meta Clínica (PEI)
                      </span>
                      <div className="form-section-title-line" />
                    </div>

                    {isEdit ? (
                      <div className="space-y-3">
                        <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          Las metas PEI del paciente se editan desde su{" "}
                          <strong className="font-bold">Ficha Clínica</strong>.
                          Al guardar cambios en esta terapia se conservan sus
                          metas vigentes sin duplicar registros.
                        </div>
                        {globalPeiGoals.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Metas Activas del Paciente (
                              {globalPeiGoals.length})
                            </p>
                            {globalPeiGoals.map((g) => (
                              <div
                                key={g.met_codi}
                                className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex justify-between items-center gap-2"
                              >
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                  {g.met_desc}
                                </span>
                                <span className="text-[11px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-0.5 rounded-md shrink-0">
                                  {g.met_prog}%
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : !selectedChildId ? (
                      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                        Selecciona un paciente activo en la barra superior si
                        deseas crear y vincular una meta PEI al generar esta
                        terapia.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300">
                          Opcionalmente crea una meta PEI para{" "}
                          <strong className="font-bold">
                            {childName || "este paciente"}
                          </strong>{" "}
                          al guardar la terapia.
                        </div>

                        <div data-field="peiGoalDesc">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <label
                              htmlFor="act-pei-desc"
                              className="form-label form-label-inline"
                            >
                              Descripción de la Meta (Opcional)
                            </label>
                            <span className="text-[10px] font-semibold tabular-nums text-slate-400">
                              {form.peiGoalDesc.length}/500
                            </span>
                          </div>
                          <input
                            id="act-pei-desc"
                            type="text"
                            name="peiGoalDesc"
                            maxLength={500}
                            value={form.peiGoalDesc}
                            onChange={(e) => {
                              setForm((p) => ({
                                ...p,
                                peiGoalDesc: e.target.value,
                              }));
                              clearFieldError("peiGoalDesc");
                              clearFieldError("peiGoalTrials");
                            }}
                            aria-invalid={Boolean(errors.peiGoalDesc)}
                            placeholder="Ej. Sostener contacto visual por 10 segundos"
                            className={`form-input border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-600 ${
                              errors.peiGoalDesc ? "form-input-invalid" : ""
                            }`}
                          />
                          {errors.peiGoalDesc && (
                            <p role="alert" className="form-error">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{errors.peiGoalDesc}</span>
                            </p>
                          )}
                        </div>

                        {form.peiGoalDesc.trim() && (
                          <div data-field="peiGoalTrials">
                            <label
                              htmlFor="act-pei-trials"
                              className="form-label"
                            >
                              Criterio de Maestría (Ensayos Exitosos)
                            </label>
                            <input
                              id="act-pei-trials"
                              type="text"
                              inputMode="numeric"
                              name="peiGoalTrials"
                              maxLength={3}
                              value={form.peiGoalTrials}
                              onChange={(e) => {
                                setForm((p) => ({
                                  ...p,
                                  peiGoalTrials: sanitizeIntegerInput(
                                    e.target.value,
                                    3,
                                  ),
                                }));
                                clearFieldError("peiGoalTrials");
                              }}
                              aria-invalid={Boolean(errors.peiGoalTrials)}
                              placeholder="20"
                              className={`form-input w-40 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/40 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-600 ${
                                errors.peiGoalTrials ? "form-input-invalid" : ""
                              }`}
                            />
                            {errors.peiGoalTrials && (
                              <p role="alert" className="form-error">
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>{errors.peiGoalTrials}</span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* ── Sticky Footer ── */}
          <div className="px-4 sm:px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 [padding-bottom:max(0.875rem,env(safe-area-inset-bottom))] sm:[padding-bottom:0.875rem]">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Paso {step} de {STEPS_META.length} · {STEPS_META[step - 1].title}
            </span>

            <div className="flex flex-wrap items-center justify-end gap-2">
              {step === 1 ? (
                <button
                  type="button"
                  onClick={handleAttemptClose}
                  disabled={isSaving}
                  className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep(step - 1)}
                  disabled={isSaving}
                  className="min-h-[40px] px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <ChevronLeft className="w-4 h-4" /> Anterior
                </button>
              )}

              {step < 3 && (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSaving}
                  className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold text-brand-700 dark:text-brand-300 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/30 dark:hover:bg-brand-900/50 border border-brand-200 dark:border-brand-800 rounded-xl transition-colors flex items-center gap-1"
                >
                  Siguiente <ChevronRight className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                form="activity-builder-form"
                disabled={isSaving}
                data-tour="rt-build-generate"
                className="min-h-[40px] px-5 py-2 text-xs sm:text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 active:scale-[0.99] rounded-xl shadow-sm shadow-brand-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Guardando...
                  </>
                ) : isEdit ? (
                  <>
                    <Pencil className="w-4 h-4" /> Guardar Cambios
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Generar Terapia
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={handleDirectClose}
        title="¿Descartar cambios de la terapia?"
        message="Hay cambios sin guardar en el constructor de terapias que se perderán si sales ahora."
        confirmLabel="Descartar y salir"
        cancelLabel="Seguir editando"
      />
    </>
  );
}
