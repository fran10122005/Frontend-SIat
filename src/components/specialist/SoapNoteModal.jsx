import { FileText, X, CheckCircle2, User } from "lucide-react";
import { useState } from "react";

const SECCIONES = [
  {
    key: "soap_subj",
    letra: "S",
    titulo: "Subjetivo",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    border: "focus:ring-blue-500",
    desc: "Reporte de padres / observación libre",
    placeholder:
      "El padre indica que el niño tuvo problemas para dormir anoche...",
  },
  {
    key: "soap_obje",
    letra: "O",
    titulo: "Objetivo",
    color:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    border: "focus:ring-emerald-500",
    desc: "Métricas y observaciones medibles",
    placeholder:
      "Se completaron 3 de 4 ensayos de contacto visual. Se registraron 2 estereotipias motoras de 1 min de duración.",
  },
  {
    key: "soap_anal",
    letra: "A",
    titulo: "Análisis",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    border: "focus:ring-amber-500",
    desc: "Evaluación clínica",
    placeholder:
      "Adecuada tolerancia a estímulos táctiles hoy. Progreso notable en metas del PEI.",
  },
  {
    key: "soap_plan",
    letra: "P",
    titulo: "Plan",
    color:
      "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    border: "focus:ring-purple-500",
    desc: "Próximos pasos y rutinas asignadas",
    placeholder:
      "Mantener plan actual. Asignar rutina visual de lavado de manos para casa.",
  },
];

export default function SoapNoteModal({
  showSoapModal,
  setShowSoapModal,
  activeChild,
  onSave,
}) {
  const [soapData, setSoapData] = useState({
    soap_subj: "",
    soap_obje: "",
    soap_anal: "",
    soap_plan: "",
  });
  const [loading, setLoading] = useState(false);

  if (!showSoapModal) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(soapData);
      setShowSoapModal(false);
      setSoapData({
        soap_subj: "",
        soap_obje: "",
        soap_anal: "",
        soap_plan: "",
      });
    } catch {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setShowSoapModal(false)}
    >
      <div
        className="bg-[#f8fafc] dark:bg-[#1a2332] rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700/80 max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 bg-blue-600 text-white shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold">Nota Clínica (Formato SOAP)</h3>
            </div>
            <button
              onClick={() => setShowSoapModal(false)}
              className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeChild && (
          <div className="px-6 py-3 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30 flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              {activeChild.nom_nino?.[0]}
              {activeChild.ape_nino?.[0]}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Paciente Actual
              </p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {activeChild.nom_nino} {activeChild.ape_nino}
              </p>
            </div>
            <span className="ml-auto text-[10px] font-semibold text-slate-400 flex items-center gap-1">
              <User className="w-3 h-3" /> Especialista
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {SECCIONES.map((sec) => (
            <div key={sec.key}>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0 ${sec.color}`}
                >
                  {sec.letra}
                </span>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {sec.titulo}{" "}
                  <span className="font-normal text-slate-400">
                    · {sec.desc}
                  </span>
                </label>
              </div>
              <textarea
                required
                value={soapData[sec.key]}
                onChange={(e) =>
                  setSoapData((prev) => ({
                    ...prev,
                    [sec.key]: e.target.value,
                  }))
                }
                className={`w-full p-3 text-sm bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-500 h-20 resize-none transition-all ${sec.border}`}
                placeholder={sec.placeholder}
              ></textarea>
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700/50">
            <button
              type="button"
              onClick={() => setShowSoapModal(false)}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shadow-blue-600/25 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                  Guardando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" /> Firmar y Guardar Nota
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
