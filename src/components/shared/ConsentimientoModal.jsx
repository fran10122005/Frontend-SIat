import { useState } from "react";
import { ShieldAlert, CheckCircle, FileText } from "lucide-react";

const TEXTO_CONSENTIMIENTO = `Al aceptar este documento, usted, en su condición de representante legal, autoriza de forma expresa, libre e inequívoca al Sistema Inteligente de Asistencia Terapéutica (SIAT) y a la institución vinculada a:

1. Recopilar y procesar datos personales y de salud del menor bajo su representación (incluyendo, pero no limitado a: frecuencia cardíaca, niveles de estrés, movimiento, registros de sueño, apetito y crisis) mediante el uso de dispositivos wearables y bitácoras manuales.
2. Almacenar dichos datos en expedientes clínicos digitales de alta seguridad.
3. Compartir la información exclusivamente con los especialistas terapéuticos asignados al menor y con los administradores de la institución, con el único fin de monitorear y mejorar su desarrollo.

Privacidad y Biometría:
• SIAT protege la confidencialidad de la información médica. No divulgaremos estos datos a terceros ajenos a la institución sin su previo consentimiento por escrito, salvo requerimiento judicial.
• Si decide utilizar biometría (huella dactilar/passkeys) para acceder al sistema, SIAT NO almacenará su huella. Solo almacenaremos una credencial criptográfica pública.

Este consentimiento se fundamenta en el Artículo 79 de la Ley de Infogobierno y el Artículo 65 de la LOPNNA de la República Bolivariana de Venezuela. Usted tiene el derecho de solicitar el acceso, rectificación o eliminación de estos datos comunicándose con la administración de la institución.`;

export default function ConsentimientoModal({ onAccept, loading }) {
  const [acceptedCheck, setAcceptedCheck] = useState(false);
  const currentVersion = "1.0";

  const handleAccept = () => {
    if (acceptedCheck) {
      onAccept(currentVersion);
    }
  };

  const currentDate = new Intl.DateTimeFormat("es-VE", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-brand-50 dark:bg-slate-900/50 p-6 border-b border-brand-100 dark:border-slate-700 flex items-center gap-4">
          <div className="bg-brand-100 dark:bg-brand-900/30 p-3 rounded-xl">
            <ShieldAlert className="w-8 h-8 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Consentimiento Informado Legal
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Requerido por la Ley de Infogobierno (Art. 79) y LOPNNA (Art. 65)
            </p>
          </div>
        </div>

        {/* Body / Documento */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 dark:bg-slate-900/20">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner">
            <div className="flex items-center gap-2 mb-4 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-100 dark:border-slate-700 pb-2">
              <FileText className="w-5 h-5 text-brand-500" />
              Términos y Condiciones del Servicio
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
              {TEXTO_CONSENTIMIENTO}
            </div>
          </div>
        </div>

        {/* Footer / Acción */}
        <div className="p-6 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-4">
          <label className="flex items-start gap-3 p-3 rounded-lg border border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
            <div className="mt-0.5">
              <input
                type="checkbox"
                className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 focus:ring-offset-0 dark:border-slate-600 dark:bg-slate-700"
                checked={acceptedCheck}
                onChange={(e) => setAcceptedCheck(e.target.checked)}
              />
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold block mb-1">
                He leído y entiendo los términos descritos.
              </span>
              Como representante legal, firmo digitalmente mi consentimiento en
              la fecha: <br />
              <span className="text-brand-600 dark:text-brand-400 font-mono text-xs">
                {currentDate}
              </span>
            </div>
          </label>

          <button
            onClick={handleAccept}
            disabled={!acceptedCheck || loading}
            className="w-full py-3 px-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed dark:disabled:bg-slate-700 dark:disabled:text-slate-500 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            Aceptar y Continuar
          </button>
        </div>
      </div>
    </div>
  );
}
