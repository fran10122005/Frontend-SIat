import { useState, useEffect, useRef, useCallback } from "react";
import { AlertCircle, X, ShieldAlert } from "lucide-react";
import Button from "../ui/Button";
import { focusFirstError } from "../../utils/validators";

const TIPOS = [
  "Crisis / Meltdown Sensorial",
  "Berrinche / Desregulación",
  "Agresión física o verbal",
  "Auto-lesión",
  "Conducta de escape / Fuga",
  "Otro",
];

const SEVERIDADES = [
  {
    value: "Leve",
    label: "Leve",
    color: "bg-emerald-600 text-white border-emerald-600",
  },
  {
    value: "Moderada",
    label: "Moderada",
    color: "bg-amber-500 text-white border-amber-500",
  },
  {
    value: "Severa",
    label: "Severa",
    color: "bg-rose-600 text-white border-rose-600",
  },
];

const DETONANTES_RAPIDOS = [
  "Ruido fuerte / Estímulo sensorial",
  "Cambio de rutina / Transición",
  "Demanda o tarea difícil",
  "Cansancio o hambre",
  "Frustración / Negativa",
  "Desconocido / Espontáneo",
];

export default function IncidentModal({
  showIncidentModal,
  setShowIncidentModal,
  incidentData,
  setIncidentData,
  handleIncidentSubmit,
  activeChild,
}) {
  const formRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (showIncidentModal) {
      setErrors({});
      setIsSubmitting(false);
    }
  }, [showIncidentModal]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setErrors({});
    setShowIncidentModal(false);
  }, [isSubmitting, setShowIncidentModal]);

  useEffect(() => {
    if (!showIncidentModal) return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showIncidentModal, handleClose]);

  if (!showIncidentModal) return null;

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const set = (key) => (e) => {
    setIncidentData((prev) => ({ ...prev, [key]: e.target.value }));
    clearError(key);
  };

  const interVal = incidentData.inc_inter ?? incidentData.inc_obse ?? "";

  const onLocalSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const errs = {};
    if (!String(incidentData.inc_tipo || "").trim()) {
      errs.inc_tipo = "Selecciona el tipo de conducta o evento";
    }
    if (!String(incidentData.inc_deto || "").trim()) {
      errs.inc_deto = "Selecciona la causa o detonante identificado";
    }
    if (String(interVal).trim().length > 1000) {
      errs.inc_inter = "Máximo 1000 caracteres";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      focusFirstError(errs, formRef);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await handleIncidentSubmit?.(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full sm:max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700/80 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-rose-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                Registrar Incidente Conductual
              </h3>
              {activeChild && (
                <p className="text-rose-100 text-xs">
                  Paciente: {activeChild.nom_nino || activeChild.nombre}{" "}
                  {activeChild.ape_nino || activeChild.apellido}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Cerrar modal"
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form
          ref={formRef}
          noValidate
          onSubmit={onLocalSubmit}
          className="p-6 space-y-4 overflow-y-auto flex-1"
        >
          {/* Tipo de Conducta */}
          <div data-field="inc_tipo">
            <label
              htmlFor="inc-tipo"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              <span>Tipo de Conducta / Evento</span>{" "}
              <span className="text-rose-500 font-bold" aria-hidden="true">
                *
              </span>
            </label>
            <select
              id="inc-tipo"
              name="inc_tipo"
              value={incidentData.inc_tipo || ""}
              onChange={set("inc_tipo")}
              className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-rose-500 text-slate-800 dark:text-slate-200 ${
                errors.inc_tipo ? "form-input-invalid" : ""
              }`}
            >
              <option value="">Selecciona tipo de evento...</option>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {errors.inc_tipo && (
              <p role="alert" className="form-error">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.inc_tipo}</span>
              </p>
            )}
          </div>

          {/* Severidad y Duración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Severidad
              </label>
              <div className="flex gap-1.5">
                {SEVERIDADES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() =>
                      setIncidentData((prev) => ({
                        ...prev,
                        inc_seve: s.value,
                      }))
                    }
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      (incidentData.inc_seve || "Moderada") === s.value
                        ? s.color
                        : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="inc-dura"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
              >
                Duración Aprox.
              </label>
              <select
                id="inc-dura"
                value={incidentData.inc_dura || "1-5 minutos"}
                onChange={set("inc_dura")}
                className="w-full p-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-rose-500 text-slate-800 dark:text-slate-200"
              >
                <option value="< 1 minuto">Menos de 1 minuto</option>
                <option value="1-5 minutos">1 a 5 minutos</option>
                <option value="5-15 minutos">5 a 15 minutos</option>
                <option value="> 15 minutos">Más de 15 minutos</option>
              </select>
            </div>
          </div>

          {/* Detonante */}
          <div data-field="inc_deto">
            <label
              htmlFor="inc-deto"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
            >
              <span>Causa / Detonante Identificado</span>{" "}
              <span className="text-rose-500 font-bold" aria-hidden="true">
                *
              </span>
            </label>
            <select
              id="inc-deto"
              name="inc_deto"
              value={incidentData.inc_deto || ""}
              onChange={set("inc_deto")}
              className={`w-full p-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-rose-500 text-slate-800 dark:text-slate-200 ${
                errors.inc_deto ? "form-input-invalid" : ""
              }`}
            >
              <option value="">Selecciona el detonante...</option>
              {DETONANTES_RAPIDOS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.inc_deto && (
              <p role="alert" className="form-error">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.inc_deto}</span>
              </p>
            )}
          </div>

          {/* Intervención y Calma */}
          <div data-field="inc_inter">
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="inc-inter"
                className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Estrategia Aplicada y Observaciones
              </label>
              <span
                className={`text-[10px] font-semibold tabular-nums ${
                  interVal.length >= 1000
                    ? "text-rose-500"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {interVal.length}/1000
              </span>
            </div>
            <textarea
              id="inc-inter"
              name="inc_inter"
              rows={3}
              maxLength={1000}
              value={interVal}
              onChange={(e) => {
                setIncidentData((prev) => ({
                  ...prev,
                  inc_inter: e.target.value,
                  inc_obse: e.target.value,
                }));
                clearError("inc_inter");
              }}
              placeholder="¿Qué estrategia o rutina se utilizó para calmarlo? (Ej. tiempo fuera, respiración, objeto de confort)..."
              className={`w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-rose-500 text-slate-800 dark:text-slate-200 resize-none transition-colors ${
                errors.inc_inter ? "form-input-invalid" : ""
              }`}
            />
            {errors.inc_inter && (
              <p role="alert" className="form-error">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors.inc_inter}</span>
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-200 dark:border-slate-700/50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2 rounded-xl shadow-sm shadow-rose-500/25 transition-all flex items-center gap-1.5"
            >
              <AlertCircle className="w-4 h-4" />{" "}
              {isSubmitting ? "Registrando..." : "Registrar Incidente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
