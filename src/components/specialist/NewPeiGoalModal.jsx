import { useState, useEffect } from "react";
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
  Layers,
} from "lucide-react";
import Button from "../ui/Button";

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

const getTodayStr = () => new Date().toISOString().split("T")[0];

const addMonthsToDate = (startDateStr, months) => {
  const base = startDateStr ? new Date(startDateStr) : new Date();
  if (isNaN(base.getTime())) return "";
  base.setMonth(base.getMonth() + months);
  return base.toISOString().split("T")[0];
};

const INITIAL_FORM = {
  met_categ: "",
  met_desc: "",
  met_ttria: 20,
  met_line: "",
  met_crit: "",
  met_fini: getTodayStr(),
  met_ffin: "",
  met_obse: "",
};

export default function NewPeiGoalModal({
  showModal,
  setShowModal,
  activeChild,
  onSave,
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);

  // Garantizar reinicio limpio cada vez que se abre el modal
  useEffect(() => {
    if (showModal) {
      setLoading(false);
      setForm({
        ...INITIAL_FORM,
        met_fini: getTodayStr(),
      });
    }
  }, [showModal]);

  if (!showModal) return null;

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const applyDurationMonths = (months) => {
    const ffin = addMonthsToDate(form.met_fini || getTodayStr(), months);
    setForm((p) => ({ ...p, met_ffin: ffin }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.met_desc.trim()) return;

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
      setForm({ ...INITIAL_FORM, met_fini: getTodayStr() });
    } catch (err) {
      console.error("Error al guardar meta PEI:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setLoading(false);
    setForm({ ...INITIAL_FORM, met_fini: getTodayStr() });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-[#151D2A] rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl md:max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[92vh] sm:max-h-[88vh] flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
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
              onClick={handleClose}
              className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/15 transition-all"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body con todos los campos organizados */}
        <form
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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Descripción del Objetivo SMART *
                </label>
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  {form.met_desc.length} caracteres
                </span>
              </div>
              <textarea
                required
                value={form.met_desc}
                onChange={set("met_desc")}
                rows={3}
                placeholder="Describe el objetivo clínico específico, observable y medible..."
                className={`${inputClass} resize-none min-h-[90px]`}
              />
            </div>

            {/* 3. Parámetros Clínicos (Ensayos + Línea Base) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-blue-500" />
                    Ensayos Objetivo
                  </span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.met_ttria}
                  onChange={set("met_ttria")}
                  className={`${inputClass} text-center font-bold text-base py-2`}
                />
                <div className="flex gap-1.5 mt-2">
                  {[10, 20, 30, 50].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, met_ttria: t }))}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                        form.met_ttria === t
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-blue-400"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between mb-2">
                  <span className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-blue-500" />
                    Línea Base Inicial (%)
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.met_line}
                  onChange={set("met_line")}
                  placeholder="0"
                  className={`${inputClass} text-center font-bold text-base py-2`}
                />
                <div className="flex gap-1.5 mt-2">
                  {[0, 10, 25, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, met_line: pct }))}
                      className={`flex-1 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                        Number(form.met_line) === pct
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
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Criterio de Logro
              </label>
              <textarea
                value={form.met_crit}
                onChange={set("met_crit")}
                rows={2}
                placeholder="Ej. 80% de aciertos en 3 sesiones consecutivas sin apoyo físico..."
                className={`${inputClass} resize-none`}
              />
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
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    value={form.met_fini}
                    onChange={set("met_fini")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                    Fecha Límite
                  </label>
                  <input
                    type="date"
                    value={form.met_ffin}
                    onChange={set("met_ffin")}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* 6. Observaciones */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Observaciones y Adaptaciones
              </label>
              <textarea
                value={form.met_obse}
                onChange={set("met_obse")}
                rows={2}
                placeholder="Notas adicionales sobre apoyos o adaptaciones..."
                className={`${inputClass} resize-none`}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 flex justify-end items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-slate-500 dark:text-slate-400"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={loading || !form.met_desc.trim()}
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
    </div>,
    document.body,
  );
}
