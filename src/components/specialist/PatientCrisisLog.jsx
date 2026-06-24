import { useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'
import { HeartPulse, BrainCircuit } from 'lucide-react'

export default function PatientCrisisLog({
  alertas,
  crisisTelemetry,
  selectedAlertId,
  setSelectedAlertId,
  valMini,
  valMaxi,
  isDark
}) {
  useEffect(() => {
    if (selectedAlertId === null && alertas && alertas.length > 0) {
      setSelectedAlertId(alertas[0].id_alert)
    }
  }, [selectedAlertId, alertas, setSelectedAlertId])

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-800/60 mt-6 transition-all duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-red-500 animate-pulse" />
            Análisis Fisiológico de Crisis (Procesamiento IoT)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Estudio de constantes biotelemetría (MAX30102 + MPU6050) en ventanas de tiempo de incidentes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Umbral Activo: {valMini} - {valMaxi} BPM</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de Incidentes Registrados */}
        <div className="lg:col-span-4 flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Bitácora de Incidentes</h3>
          {alertas && alertas.map((al) => {
            const isSelected = selectedAlertId === al.id_alert;
            
            return (
              <button
                key={al.id_alert}
                onClick={() => setSelectedAlertId(al.id_alert)}
                className={`p-3 text-left rounded-xl border text-sm transition-all flex flex-col gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/20 dark:border-indigo-900/50'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 dark:hover:bg-slate-800/80'
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {new Date(al.fec_hora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} ({new Date(al.fec_hora).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })})
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    al.est_dete === 'SOBRECARGA'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                  }`}>
                    {al.est_dete === 'SOBRECARGA' ? 'Crisis' : 'Precrisis'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span>Pico: {al.bpm_max} BPM</span>
                  <span className="font-medium text-indigo-600 dark:text-indigo-400">Estrés: {al.stress_index}%</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Gráfico y Correlación */}
        <div className="lg:col-span-8 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl p-4 border border-slate-100 dark:border-slate-800 min-h-[350px] flex flex-col">
          {selectedAlertId && crisisTelemetry && crisisTelemetry[selectedAlertId] ? (() => {
            const alertData = alertas.find(a => a.id_alert === selectedAlertId) || alertas[0];
            const chartData = crisisTelemetry[selectedAlertId];
            
            // Determinación clínica
            let clinicaTipo = "";
            let clinicaColor = "";
            let clinicaDesc = "";
            
            if (alertData.bpm_max > valMaxi && alertData.mov_max < 3) {
              clinicaTipo = "Sobrecarga Sensorial Coherente (Estrés Emocional)";
              clinicaColor = "text-rose-600 dark:text-rose-400";
              clinicaDesc = "Se observa un aumento significativo del pulso (taquicardia) mientras el nivel de movimiento se mantiene bajo. Esto es una fuerte firma clínica de sobrecarga sensorial o crisis de ansiedad silenciosa, no atribuible a ejercicio físico.";
            } else if (alertData.bpm_max > valMaxi && alertData.mov_max > 7) {
              clinicaTipo = "Hiperactividad Física / Esfuerzo Motor";
              clinicaColor = "text-amber-600 dark:text-amber-400";
              clinicaDesc = "El aumento del pulso coincide con picos de aceleración y movimiento intensos. Sugiere que el paciente estaba en medio de actividad física vigorosa o juego. Se recomienda evaluar si fue una rabieta de descarga motora.";
            } else if (alertData.mov_max > 8 && alertData.bpm_max <= valMaxi) {
              clinicaTipo = "Conducta Repetitiva / Estereotipia de Calma";
              clinicaColor = "text-indigo-600 dark:text-indigo-400";
              clinicaDesc = "Aceleración rítmica detectada en el sensor inercial sin aumento de la frecuencia cardíaca. Indica un comportamiento de autorregulación (ej. aleteo de manos o balanceo) en el que el paciente mantiene la calma.";
            } else {
              clinicaTipo = "Estrés Fisiológico Moderado (Precrisis)";
              clinicaColor = "text-amber-500 dark:text-amber-400";
              clinicaDesc = "Variaciones tempranas de pulso detectadas por encima del reposo normal. Nivel de estrés en aumento. La intervención preventiva en este punto suele ser altamente efectiva.";
            }

            return (
              <div className="flex-1 flex flex-col gap-4">
                {/* Stats del evento */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white dark:bg-[#1E293B] p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Pulso Máximo</span>
                    <p className="text-lg font-black text-rose-500 mt-0.5">{alertData.bpm_max} <span className="text-xs font-semibold text-slate-500">BPM</span></p>
                  </div>
                  <div className="bg-white dark:bg-[#1E293B] p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Movimiento Pico</span>
                    <p className="text-lg font-black text-indigo-500 mt-0.5">{alertData.mov_max} <span className="text-xs font-semibold text-slate-500">G</span></p>
                  </div>
                  <div className="bg-white dark:bg-[#1E293B] p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Índice de Estrés</span>
                    <p className="text-lg font-black text-amber-500 mt-0.5">{alertData.stress_index}%</p>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-[180px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#e2e8f0'} />
                      <XAxis dataKey="time" stroke={isDark ? '#94a3b8' : '#64748b'} fontSize={10} tickLine={false} />
                      <YAxis yAxisId="left" stroke="#ef4444" fontSize={10} tickLine={false} domain={[50, 150]} />
                      <YAxis yAxisId="right" orientation="right" stroke="#6366f1" fontSize={10} tickLine={false} domain={[0, 10]} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: isDark ? '#1E293B' : '#fff', borderColor: isDark ? '#334155' : '#e2e8f0', borderRadius: '8px' }}
                      />
                      <Line yAxisId="left" type="monotone" dataKey="bpm" name="Frecuencia Cardíaca (BPM)" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line yAxisId="right" type="monotone" dataKey="mov" name="Movimiento (MPU6050)" stroke="#6366f1" strokeWidth={2.5} strokeDasharray="5 5" dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Clinical Correlation */}
                <div className="bg-white dark:bg-[#1E293B] p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-2 mt-auto">
                  <div className="flex items-center gap-2">
                    <BrainCircuit className="w-4 h-4 text-indigo-500" />
                    <span className={`text-xs font-bold uppercase tracking-wider ${clinicaColor}`}>{clinicaTipo}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {clinicaDesc}
                  </p>
                </div>
              </div>
            );
          })() : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
              <HeartPulse className="w-12 h-12 stroke-[1.5] mb-2 text-slate-300 animate-pulse" />
              <p className="text-sm font-medium">Selecciona un incidente para graficar su telemetría</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
