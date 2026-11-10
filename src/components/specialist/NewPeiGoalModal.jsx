import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Target,
  X,
  Sparkles,
  Check,
  Calendar,
  Hash,
  Percent,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";
import Button from "../ui/Button";
import ConfirmDialog from "../shared/ConfirmDialog";
import {
  toLocalYMD,
  parseLocalYMD,
  sanitizeIntegerInput,
  sanitizeDecimalInput,
  validateRequiredText,
  focusFirstError,
} from "../../utils/validators";
import { extractFieldErrors } from "../../utils/errorHandler";

const CATEGORIAS = [
  { label: "Comunicación", emoji: "💬" },
  { label: "Lenguaje", emoji: "🗣️" },
  { label: "Socialización", emoji: "🤝" },
  { label: "Conducta", emoji: "🧩" },
  { label: "Sensorial", emoji: "👁️" },
  { label: "Motricidad Fina", emoji: "✍️" },
  { label: "Motricidad Gruesa", emoji: "🏃" },
  { label: "Autonomía", emoji: "👕" },
  { label: "Atención", emoji: "🎯" },
  { label: "Regulación Emocional", emoji: "💛" },
  { label: "Cognición", emoji: "🧠" },
  { label: "Juego", emoji: "🎲" },
];

const inputClass =
  "w-full px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-sm leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all duration-150 shadow-xs";

const addMonthsToDate = (startDateStr, months) => {
  const parsed = parseLocalYMD(startDateStr);
  const base = parsed ? new Date(parsed.date.getTime()) : new Date();
  const origDay = base.getDate();
  base.setDate(1);
  base.setMonth(base.getMonth() + months);
  const maxDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(origDay, maxDay));
  return toLocalYMD(base);
};

const createInitialForm = () => ({
  met_categ: "",
  met_desc: "",
  met_ttria: "20",
  met_line: "",
  met_crit: "",
  met_fini: toLocalYMD(),
  met_ffin: "",
  met_obse: "",
});

export default function NewPeiGoalModal({
  showModal,
  setShowModal,
  activeChild,
  onSave,
}) {
  const formRef = useRef(null);
  const [form, setForm] = useState(createInitialForm);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Garantizar reinicio limpio cada vez que se abre el modal
  useEffect(() => {
    if (showModal) {
      setLoading(false);
      setShowDiscardConfirm(false);
      setIsShaking(false);
      setErrors({});
      setForm(createInitialForm());
    }
  }, [showModal]);

  const isDirty = Boolean(
    form.met_desc?.trim() ||
    (form.met_crit && form.met_crit.trim()) ||
    (form.met_obse && form.met_obse.trim()) ||
    (form.met_line !== "" &&
      form.met_line !== null &&
      form.met_line !== undefined) ||
    (form.met_categ && form.met_categ !== ""),
  );

  const handleDirectClose = useCallback(() => {
    setShowModal(false);
    setLoading(false);
    setErrors({});
    setForm(createInitialForm());
  }, [setShowModal]);

  const handleAttemptClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      handleDirectClose();
    }
  }, [isDirty, handleDirectClose]);

  // Manejo de la tecla Escape con protección de datos
  useEffect(() => {
    if (!showModal) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleAttemptClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal, handleAttemptClose]);

  if (!showModal) return null;

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const set = (key) => (e) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    clearError(key);
    if (key === "met_fini") clearError("met_ffin");
  };

  const applyDurationMonths = (months) => {
    const ffin = addMonthsToDate(form.met_fini || toLocalYMD(), months);
    setForm((p) => ({ ...p, met_ffin: ffin }));
    clearError("met_ffin");
  };

  const validatePeiForm = () => {
    const errs = {};

    const descErr = validateRequiredText(
      form.met_desc,
      "La descripción del objetivo",
      { min: 5, max: 500 },
    );
    if (descErr) errs.met_desc = descErr;

    const ttriaStr = String(form.met_ttria ?? "").trim();
    const ttriaNum = Number(ttriaStr);
    if (
      !ttriaStr ||
      !Number.isInteger(ttriaNum) ||
      ttriaNum < 1 ||
      ttriaNum > 500
    ) {
      errs.met_ttria = "Los ensayos objetivo deben estar entre 1 y 500";
    }

    if (
      form.met_line !== "" &&
      form.met_line !== null &&
      form.met_line !== undefined
    ) {
      const lineNum = Number(form.met_line);
      if (Number.isNaN(lineNum) || lineNum < 0 || lineNum > 100) {
        errs.met_line = "La línea base debe estar entre 0% y 100%";
      }
    }

    if ((form.met_crit || "").trim().length > 500) {
      errs.met_crit = "El criterio de logro no puede exceder 500 caracteres";
    }

    if ((form.met_obse || "").trim().length > 500) {
      errs.met_obse = "Las observaciones no pueden exceder 500 caracteres";
    }

    if (form.met_fini && form.met_ffin && form.met_ffin < form.met_fini) {
      errs.met_ffin =
        "La fecha límite debe ser igual o posterior a la fecha de inicio";
    }

    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const errs = validatePeiForm();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      focusFirstError(errs, formRef);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      await onSave({
        met_desc: form.met_desc.trim(),
        met_ttria: parseInt(form.met_ttria, 10) || 20,
        met_categ: form.met_categ || "General",
        met_area: form.met_categ || "General",
        met_line:
          form.met_line !== "" && !isNaN(Number(form.met_line))
            ? parseFloat(form.met_line)
            : null,
        met_crit: (form.met_crit || "").trim() || null,
        met_fini: form.met_fini || null,
        met_ffin: form.met_ffin || null,
        met_obse: (form.met_obse || "").trim() || null,
      });
      setShowModal(false);
      setForm(createInitialForm());
    } catch (err) {
      console.error("Error al guardar meta PEI:", err);
      const apiErrs = extractFieldErrors(err);
      if (Object.keys(apiErrs).length > 0) {
        setErrors((prev) => ({ ...prev, ...apiErrs }));
        focusFirstError(apiErrs, formRef);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (isDirty) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);
      } else {
        handleDirectClose();
      }
    }
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={handleBackdropClick}
      >
        <div
          role="dialog"
          aria-modal="true"
          className={`bg-white dark:bg-[#151D2A] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl md:max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[92vh] sm:max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 transition-transform ${
            isShaking ? "scale-[1.01] ring-2 ring-blue-500/30" : ""
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shrink-0 relative">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-xl border border-white/20 shadow-inner">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">
                      Nueva Meta PEI
                    </h3>
                    <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full">
                      Plan Terapéutico
                    </span>
                  </div>
                  {activeChild && (
                    <p className="text-blue-100 text-xs sm:text-sm font-medium mt-0.5">
                      Paciente:{" "}
                      <span className="text-white font-semibold">
                        {activeChild.nom_nino} {activeChild.ape_nino}
                      </span>
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleAttemptClose}
                className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/15 transition-all"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Body con todos los campos organizados */}
          <form
            ref={formRef}
            noValidate
            onSubmit={handleSubmit}
            className="flex-1 overflow-y-auto flex flex-col justify-between"
          >
            <div className="p-4 sm:p-6 space-y-5">
              {/* 1. Categoría */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    Área o Categoría
                  </label>
                  {form.met_categ && (
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                      {form.met_categ}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {CATEGORIAS.map((c) => {
                    const isSelected = form.met_categ === c.label;
                    return (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            met_categ: isSelected ? "" : c.label,
                          }))
                        }
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all text-left flex items-center gap-2 ${
                          isSelected
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/25 scale-[1.02]"
                            : "border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800"
                        }`}
                      >
                        <span className="text-sm">{c.emoji}</span>
                        <span className="truncate">{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Meta SMART */}
              <div data-field="met_desc">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="pei-met_desc"
                    className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                  >
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>Descripción del Objetivo SMART</span>
                    <span
                      className="text-rose-500 font-bold"
                      aria-hidden="true"
                    >
                      *
                    </span>
                  </label>
                  <span
                    className={`text-[11px] font-semibold tabular-nums ${
                      form.met_desc.length >= 500
                        ? "text-rose-500"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {form.met_desc.length}/500
                  </span>
                </div>
                <textarea
                  id="pei-met_desc"
                  name="met_desc"
                  maxLength={500}
                  value={form.met_desc}
                  onChange={set("met_desc")}
                  rows={3}
                  placeholder="Describe el objetivo clínico específico, observable y medible..."
                  className={`${inputClass} resize-none min-h-[90px] ${
                    errors.met_desc ? "form-input-invalid" : ""
                  }`}
                />
                {errors.met_desc && (
                  <p role="alert" className="form-error">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.met_desc}</span>
                  </p>
                )}
              </div>

              {/* 3. Parámetros Clínicos (Ensayos + Línea Base) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div
                  data-field="met_ttria"
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80"
                >
                  <label
                    htmlFor="pei-met_ttria"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-2"
                  >
                    <span className="flex items-center gap-1.5">
                      <Hash className="w-3.5 h-3.5 text-blue-500" />
                      <span>Ensayos Objetivo</span>
                      <span
                        className="text-rose-500 font-bold"
                        aria-hidden="true"
                      >
                        *
                      </span>
                    </span>
                  </label>
                  <input
                    id="pei-met_ttria"
                    name="met_ttria"
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    value={form.met_ttria}
                    onChange={(e) => {
                      setForm((p) => ({
                        ...p,
                        met_ttria: sanitizeIntegerInput(e.target.value, 3),
                      }));
                      clearError("met_ttria");
                    }}
                    className={`${inputClass} text-center font-bold text-base py-2 ${
                      errors.met_ttria ? "form-input-invalid" : ""
                    }`}
                  />
                  {errors.met_ttria && (
                    <p role="alert" className="form-error">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.met_ttria}</span>
                    </p>
                  )}
                  <div className="flex gap-1.5 mt-2">
                    {[10, 20, 30, 50].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, met_ttria: String(t) }));
                          clearError("met_ttria");
                        }}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                          Number(form.met_ttria) === t
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  data-field="met_line"
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80"
                >
                  <label
                    htmlFor="pei-met_line"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-2"
                  >
                    <span className="flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-blue-500" />
                      Línea Base Inicial (%)
                    </span>
                  </label>
                  <input
                    id="pei-met_line"
                    name="met_line"
                    type="text"
                    inputMode="decimal"
                    maxLength={5}
                    value={form.met_line}
                    onChange={(e) => {
                      setForm((p) => ({
                        ...p,
                        met_line: sanitizeDecimalInput(e.target.value, 5),
                      }));
                      clearError("met_line");
                    }}
                    placeholder="0"
                    className={`${inputClass} text-center font-bold text-base py-2 ${
                      errors.met_line ? "form-input-invalid" : ""
                    }`}
                  />
                  {errors.met_line && (
                    <p role="alert" className="form-error">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.met_line}</span>
                    </p>
                  )}
                  <div className="flex gap-1.5 mt-2">
                    {[0, 10, 25, 50].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          setForm((p) => ({ ...p, met_line: String(pct) }));
                          clearError("met_line");
                        }}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                          form.met_line !== "" && Number(form.met_line) === pct
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Criterio de Logro */}
              <div data-field="met_crit">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="pei-met_crit"
                    className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Criterio de Logro
                  </label>
                  <span
                    className={`text-[11px] font-semibold tabular-nums ${
                      form.met_crit.length >= 500
                        ? "text-rose-500"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {form.met_crit.length}/500
                  </span>
                </div>
                <textarea
                  id="pei-met_crit"
                  name="met_crit"
                  maxLength={500}
                  value={form.met_crit}
                  onChange={set("met_crit")}
                  rows={2}
                  placeholder="Ej. 80% de aciertos en 3 sesiones consecutivas sin apoyo físico..."
                  className={`${inputClass} resize-none ${
                    errors.met_crit ? "form-input-invalid" : ""
                  }`}
                />
                {errors.met_crit && (
                  <p role="alert" className="form-error">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.met_crit}</span>
                  </p>
                )}
              </div>

              {/* 5. Fechas con Atajos */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    Vigencia y Plazos
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      Atajos:
                    </span>
                    {[
                      { label: "+1M", m: 1 },
                      { label: "+3M", m: 3 },
                      { label: "+6M", m: 6 },
                    ].map((shortcut) => (
                      <button
                        key={shortcut.label}
                        type="button"
                        onClick={() => applyDurationMonths(shortcut.m)}
                        className="px-2 py-0.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 text-[10px] font-bold rounded-md border border-slate-200 dark:border-slate-700 transition-colors"
                      >
                        {shortcut.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div data-field="met_fini">
                    <label
                      htmlFor="pei-met_fini"
                      className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                    >
                      Fecha de Inicio
                    </label>
                    <input
                      id="pei-met_fini"
                      name="met_fini"
                      type="date"
                      value={form.met_fini}
                      onChange={set("met_fini")}
                      className={inputClass}
                    />
                  </div>
                  <div data-field="met_ffin">
                    <label
                      htmlFor="pei-met_ffin"
                      className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1"
                    >
                      Fecha Límite
                    </label>
                    <input
                      id="pei-met_ffin"
                      name="met_ffin"
                      type="date"
                      min={form.met_fini || undefined}
                      value={form.met_ffin}
                      onChange={set("met_ffin")}
                      className={`${inputClass} ${
                        errors.met_ffin ? "form-input-invalid" : ""
                      }`}
                    />
                    {errors.met_ffin && (
                      <p role="alert" className="form-error">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.met_ffin}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 6. Observaciones */}
              <div data-field="met_obse">
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="pei-met_obse"
                    className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Observaciones y Adaptaciones
                  </label>
                  <span
                    className={`text-[11px] font-semibold tabular-nums ${
                      form.met_obse.length >= 500
                        ? "text-rose-500"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {form.met_obse.length}/500
                  </span>
                </div>
                <textarea
                  id="pei-met_obse"
                  name="met_obse"
                  maxLength={500}
                  value={form.met_obse}
                  onChange={set("met_obse")}
                  rows={2}
                  placeholder="Notas adicionales sobre apoyos o adaptaciones..."
                  className={`${inputClass} resize-none ${
                    errors.met_obse ? "form-input-invalid" : ""
                  }`}
                />
                {errors.met_obse && (
                  <p role="alert" className="form-error">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.met_obse}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 flex justify-end items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAttemptClose}
                className="text-slate-500 dark:text-slate-400"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-h-[40px]"
              >
                {loading ? (
                  "Guardando..."
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Guardar Meta PEI
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
      <ConfirmDialog
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={handleDirectClose}
        title="¿Descartar cambios de la meta?"
        message="Hay información escrita en el formulario de la meta PEI que se perderá si sales ahora."
        confirmLabel="Descartar y salir"
        cancelLabel="Continuar editando"
      />
    </>,
    document.body,
  );
}
