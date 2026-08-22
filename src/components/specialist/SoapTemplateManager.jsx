import { useState } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  X,
  Plus,
  PencilLine,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Button from "../ui/Button";

const DEFAULT_TEMPLATES = [
  {
    id: "t1",
    name: "Sesión Estándar",
    subj: "El representante reporta que el paciente se encontraba con disposición favorable para la sesión de hoy.",
    obje: "Se realizaron actividades de estimulación sensorial durante 45 minutos. Se observó aceptación táctil en un 70% de las intervenciones.",
    anal: "El paciente demuestra avances en tolerancia sensorial. Se requiere continuar con exposición gradual a texturas nuevas.",
    plan: "Mantener rutina actual. Asignar actividad de exploración sensorial en casa (3 veces por semana).",
  },
  {
    id: "t2",
    name: "Sesión de Crisis",
    subj: "El representante indica que el paciente presentó una crisis de ansiedad previa a la sesión.",
    obje: "Se aplicó protocolo de regulación. El paciente logró calmarse en 12 minutos con técnicas de presión profunda.",
    anal: "La crisis se correlaciona con cambio de rutina escolar. Patrón de estrés por transición identificado.",
    plan: "Implementar visual de transición en casa y escuela. Reunión con docentes para ajustar horarios.",
  },
];

const SECCIONES = [
  {
    key: "subj",
    letra: "S",
    titulo: "Subjetivo",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  },
  {
    key: "obje",
    letra: "O",
    titulo: "Objetivo",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  },
  {
    key: "anal",
    letra: "A",
    titulo: "Análisis",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  },
  {
    key: "plan",
    letra: "P",
    titulo: "Plan",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  },
];

export default function SoapTemplateManager({ showModal, setShowModal }) {
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    subj: "",
    obje: "",
    anal: "",
    plan: "",
  });

  if (!showModal) return null;

  const handleNew = () => {
    setEditingId(null);
    setForm({ name: "", subj: "", obje: "", anal: "", plan: "" });
    setShowForm(true);
  };

  const handleEdit = (tpl) => {
    setEditingId(tpl.id);
    setForm({
      name: tpl.name,
      subj: tpl.subj,
      obje: tpl.obje,
      anal: tpl.anal,
      plan: tpl.plan,
    });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    if (editingId === id) {
      setShowForm(false);
      setEditingId(null);
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editingId) {
      setTemplates((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, ...form } : t)),
      );
    } else {
      setTemplates((prev) => [...prev, { id: `t${Date.now()}`, ...form }]);
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", subj: "", obje: "", anal: "", plan: "" });
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ name: "", subj: "", obje: "", anal: "", plan: "" });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setShowModal(false)}
    >
      <div
        className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-blue-600 text-white shrink-0 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <span className="p-2 bg-white/20 rounded-xl">
              <FileText className="w-5 h-5" />
            </span>
            Plantillas SOAP
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="xs"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleNew}
            >
              Nueva Plantilla
            </Button>
            <button
              onClick={() => setShowModal(false)}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Formulario inline */}
          {showForm && (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800/40 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Nombre de la Plantilla
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                  placeholder="Ej. Sesión de Integración Sensorial"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SECCIONES.map((sec) => (
                  <div key={sec.key}>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${sec.color}`}
                      >
                        {sec.letra}
                      </span>
                      {sec.titulo}
                    </label>
                    <textarea
                      value={form[sec.key]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [sec.key]: e.target.value }))
                      }
                      rows={3}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 resize-none"
                      placeholder={`Contenido de ${sec.titulo.toLowerCase()}...`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="xs" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="xs"
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                  onClick={handleSave}
                  disabled={!form.name.trim()}
                >
                  {editingId ? "Actualizar" : "Guardar"}
                </Button>
              </div>
            </div>
          )}

          {/* Lista de plantillas */}
          {templates.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-500">
              <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No hay plantillas guardadas.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map((tpl) => {
                const isExpanded = expandedId === tpl.id;
                return (
                  <div
                    key={tpl.id}
                    className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#1E293B]">
                      <button
                        onClick={() =>
                          setExpandedId(isExpanded ? null : tpl.id)
                        }
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex-1 truncate">
                        {tpl.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<PencilLine className="w-3 h-3" />}
                        onClick={() => handleEdit(tpl)}
                      />
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<Trash2 className="w-3 h-3" />}
                        onClick={() => handleDelete(tpl.id)}
                        className="text-rose-500 hover:text-rose-600"
                      />
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-3 pt-1 space-y-2 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700">
                        {SECCIONES.map(
                          (sec) =>
                            tpl[sec.key] && (
                              <div key={sec.key} className="flex gap-2">
                                <span
                                  className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${sec.color}`}
                                >
                                  {sec.letra}
                                </span>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                  {tpl[sec.key]}
                                </p>
                              </div>
                            ),
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
