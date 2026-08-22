import { useState } from "react";
import { createPortal } from "react-dom";
import {
  Target,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Check,
} from "lucide-react";
import Button from "../ui/Button";

const CATEGORIAS = [
  "Comunicación",
  "Lenguaje",
  "Socialización",
  "Conducta",
  "Sensorial",
  "Motricidad Fina",
  "Motricidad Gruesa",
  "Autonomía",
  "Atención",
  "Regulación Emocional",
  "Cognición",
  "Juego",
];

const inputClass =
  "w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm leading-relaxed focus:outline-none focus:border-blue-500 focus:ring-0 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors duration-150";

export default function NewPeiGoalModal({
  showModal,
  setShowModal,
  activeChild,
  onSave,
}) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    met_categ: "",
    met_desc: "",
    met_ttria: 20,
    met_line: "",
    met_crit: "",
    met_fini: "",
    met_ffin: "",
    met_obse: "",
  });
  const [loading, setLoading] = useState(false);

  if (!showModal) return null;

  const set = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.met_desc.trim()) return;
    setLoading(true);
    try {
      await onSave({
        met_desc: form.met_desc.trim(),
        met_ttria: parseInt(form.met_ttria, 10) || 20,
        met_categ: form.met_categ || null,
        met_line: form.met_line ? parseFloat(form.met_line) : null,
        met_crit: form.met_crit.trim() || null,
        met_fini: form.met_fini || null,
        met_ffin: form.met_ffin || null,
        met_obse: form.met_obse.trim() || null,
      });
      setShowModal(false);
      setStep(1);
      setForm({
        met_categ: "",
        met_desc: "",
        met_ttria: 20,
        met_line: "",
        met_crit: "",
        met_fini: "",
        met_ffin: "",
        met_obse: "",
      });
    } catch {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowModal(false);
    setStep(1);
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700/80 max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-blue-600 text-white shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Nueva Meta PEI</h3>
                {activeChild && (
                  <p className="text-blue-100 text-sm mt-0.5">
                    {activeChild.nom_nino} {activeChild.ape_nino}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Progress */}
          <div className="flex items-center gap-2 mt-4">
            <div
              className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 1 ? "bg-white" : "bg-white/30"}`}
            />
            <div
              className={`flex-1 h-1.5 rounded-full transition-colors ${step >= 2 ? "bg-white" : "bg-white/30"}`}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-blue-200 font-medium">
              Describe la meta
            </span>
            <span className="text-[10px] text-blue-200 font-medium">
              Detalles
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* PASO 1 */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                    Categoría
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CATEGORIAS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            met_categ: p.met_categ === c ? "" : c,
                          }))
                        }
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                          form.met_categ === c
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 bg-white dark:bg-slate-800"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Meta SMART *
                  </label>
                  <textarea
                    required
                    value={form.met_desc}
                    onChange={set("met_desc")}
                    rows={4}
                    placeholder="Ej. Mantendrá contacto visual 5 segundos en 3 de 4 intentos durante la sesión de terapia..."
                    className={`${inputClass} resize-none`}
                  />
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 ml-1">
                    Objetivo específico, observable y medible.
                  </p>
                </div>
              </div>
            )}

            {/* PASO 2 */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Ensayos objetivo
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={form.met_ttria}
                      onChange={set("met_ttria")}
                      className={`${inputClass} text-center font-semibold`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Línea base %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.met_line}
                      onChange={set("met_line")}
                      placeholder="0"
                      className={`${inputClass} text-center font-semibold`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Criterio de logro
                  </label>
                  <textarea
                    value={form.met_crit}
                    onChange={set("met_crit")}
                    rows={2}
                    placeholder="Cuándo se considerará lograda..."
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Fecha inicio
                    </label>
                    <input
                      type="date"
                      value={form.met_fini}
                      onChange={set("met_fini")}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Fecha límite
                    </label>
                    <input
                      type="date"
                      value={form.met_ffin}
                      onChange={set("met_ffin")}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    value={form.met_obse}
                    onChange={set("met_obse")}
                    rows={2}
                    placeholder="Notas adicionales..."
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700/50 flex justify-between items-center shrink-0">
            <div>
              {step === 2 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                  onClick={() => setStep(1)}
                >
                  Atrás
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                Cancelar
              </Button>
              {step === 1 ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setStep(2)}
                  disabled={!form.met_desc.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl shadow-sm shadow-blue-500/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="sm"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl shadow-sm shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {loading ? (
                    "Guardando..."
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Crear Meta
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
