import {
  UserCircle2,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";

export default function SpecialistGlobalView({
  globalStats,
  globalAlertsFeed,
}) {
  return (
    <>
      {/* KPIs Globales */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 animate-in fade-in duration-300">
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 md:p-5 shadow-sm border border-slate-200 dark:border-slate-800/60 relative overflow-hidden flex items-center gap-4">
          <div className="p-2.5 md:p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
            <UserCircle2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[11px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Pacientes Activos
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {globalStats.pacientesActivos}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 md:p-5 shadow-sm border border-slate-200 dark:border-slate-800/60 relative overflow-hidden flex items-center gap-4">
          <div className="p-2.5 md:p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[11px] md:text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Cumplimiento PEI (Promedio)
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
              {globalStats.porcentajeCumplimiento}%
            </h3>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-3 md:p-5 shadow-sm border border-rose-500/20 relative overflow-hidden text-white flex items-center gap-4 animate-pulse col-span-2 md:col-span-1">
          <div className="p-2 md:p-3 bg-white/20 text-white rounded-lg backdrop-blur-sm">
            <AlertCircle className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <p className="text-[11px] md:text-xs font-semibold text-rose-100 uppercase tracking-wide">
              Alertas (24h)
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-white">
              {globalStats.alertasPendientes}
            </h3>
          </div>
        </div>
      </div>

      {/* Alertas Globales */}
      <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 flex flex-col min-h-[250px] animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            Alertas y Novedades
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          {globalAlertsFeed.map((al) => (
            <div
              key={al.id}
              className="p-3 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 relative pl-4 border-l-4 border-l-rose-500"
            >
              <p className="text-xs text-slate-400 mb-1 font-medium">
                {al.time} • {al.paciente}
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                {al.text}
              </p>
            </div>
          ))}
          {globalAlertsFeed.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 min-h-[150px]">
              <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No hay alertas recientes.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
