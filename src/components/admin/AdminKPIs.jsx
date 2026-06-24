import { Users, Stethoscope, Clock, ShieldAlert } from 'lucide-react';

export default function AdminKPIs({ metricas }) {
  if (!metricas) return null;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Users className="w-16 h-16 text-blue-600" /></div>
        <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider relative z-10">Pacientes Activos</span>
        <div className="mt-2 flex items-baseline gap-2 relative z-10">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">{metricas.totalNinos}</span>
        </div>
      </div>
      
      <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Stethoscope className="w-16 h-16 text-emerald-600" /></div>
        <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider relative z-10">Especialistas (Staff)</span>
        <div className="mt-2 flex items-baseline gap-2 relative z-10">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">{metricas.totalEspecialistas}</span>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 shadow-sm border border-slate-200 dark:border-slate-800/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Clock className="w-16 h-16 text-purple-600" /></div>
        <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider relative z-10">Casos Asignados</span>
        <div className="mt-2 flex items-baseline gap-2 relative z-10">
          <span className="text-3xl font-bold text-slate-900 dark:text-white">{metricas.asignacionesActivas}</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-5 shadow-sm border border-orange-500/20 relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-4 opacity-20"><ShieldAlert className="w-16 h-16 text-white" /></div>
        <span className="text-orange-100 text-xs font-semibold uppercase tracking-wider relative z-10">Incidentes / Crisis (Mes)</span>
        <div className="mt-2 flex items-baseline gap-2 relative z-10">
          <span className="text-3xl font-bold">{metricas.totalAlertas}</span>
        </div>
      </div>
    </div>
  );
}
