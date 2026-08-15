import { useState } from "react";
import {
  Target,
  X,
  CalendarDays,
  Ruler,
  CheckSquare,
  FileText,
  Sparkles,
} from "lucide-react";

const CATEGORIAS = [
  "Comunicación",
  "Lenguaje",
  "Socialización",
  "Conducta",
  "Sensorial",
  "Motricidad Fina",
  "Motricidad Gruesa",
  "Autonomía / Vida Diaria",
  "Atención y Concentración",
  "Regulación Emocional",
  "Cognición",
  "Juego",
];

export default function NewPeiGoalModal({
  showModal,
  setShowModal,
  activeChild,
  onSave,
}) {
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

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-indigo-100 dark:border-slate-700 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/20 shrink-0">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Nueva Meta PEI
          </h3>
          <button
            onClick={() => setShowModal(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {activeChild && (
          <div className="px-6 py-2.5 bg-indigo-50/30 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-slate-700 flex items-center gap-2 text-xs text-indigo-700 dark:text-indigo-300 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            Paciente:{" "}
            <strong>
              {activeChild.nom_nino} {activeChild.ape_nino}
            </strong>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Categoría */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Categoría de la Meta
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CATEGORIAS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, met_categ: c }))}
                  className={`px-3 py-2 rounded-xl border-2 text-xs font-semibold transition-all ${form.met_categ === c ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300" : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-300"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción SMART */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Meta (Específica y Medible)
            </label>
            <textarea
              required
              value={form.met_desc}
              onChange={set("met_desc")}
              rows={2}
              placeholder="Ej. El paciente mantendrá contacto visual con su terapeuta durante 5 segundos en 3 de 4 intentos..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
            ></textarea>
            <p className="text-[10px] text-slate-500 mt-1">
              Redacte la meta en formato objetivo, observable y medible.
            </p>
          </div>

          {/* Línea base + Ensayos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5" /> Línea Base de Progreso (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={form.met_line}
                onChange={set("met_line")}
                placeholder="Ej. 10"
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Número de Ensayos Objetivo
              </label>
              <input
                type="number"
                min="1"
                value={form.met_ttria}
                onChange={set("met_ttria")}
                placeholder="Ej. 20"
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Criterio de éxito */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5" /> Criterio de Logro
            </label>
            <textarea
              value={form.met_crit}
              onChange={set("met_crit")}
              rows={2}
              placeholder="Ej. Se considerará lograda cuando el paciente mantenga el contacto visual en al menos el 80% de los ensayos durante 3 sesiones consecutivas..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
            ></textarea>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" /> Fecha de Inicio
              </label>
              <input
                type="date"
                value={form.met_fini}
                onChange={set("met_fini")}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                Fecha Límite
              </label>
              <input
                type="date"
                value={form.met_ffin}
                onChange={set("met_ffin")}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Observaciones (Opcional)
            </label>
            <textarea
              value={form.met_obse}
              onChange={set("met_obse")}
              rows={2}
              placeholder="Contexto, adaptaciones o notas adicionales para el equipo..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 resize-none"
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 font-semibold text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 font-semibold text-xs bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Crear Meta PEI"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
