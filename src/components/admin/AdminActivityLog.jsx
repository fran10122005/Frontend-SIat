export default function AdminActivityLog({ userName, logs = [] }) {
  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 mt-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Reporte de Operaciones Clínicas (Logs)</h3>
          <p className="text-sm text-slate-500">Bitácora de auditoría interna de la fundación.</p>
        </div>
      </div>
      <div className="overflow-hidden border border-slate-200 dark:border-slate-700 rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-4 py-3 font-semibold">Timestamp</th>
              <th className="px-4 py-3 font-semibold">Tipo</th>
              <th className="px-4 py-3 font-semibold">Detalle del Evento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {logs.map(log => {
              const levelColors = {
                INFO: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                WARN: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                SUCCESS: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                INCIDENTE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                ASIGNACION: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
              };
              const badgeColor = levelColors[log.aud_tipo] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
              const dateStr = new Date(log.aud_time).toLocaleString();
              
              return (
                <tr key={log.aud_codi} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{dateStr}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${badgeColor}`}>{log.aud_tipo}</span></td>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                    {log.aud_desc} <span className="text-xs text-slate-400 ml-2">({log.tm_usuar?.usu_crro || 'Sistema'})</span>
                  </td>
                </tr>
              );
            })}
            {logs.length === 0 && (
              <tr>
                <td colSpan="3" className="px-4 py-8 text-center text-slate-500">No hay operaciones clínicas registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
