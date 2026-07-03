import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { useGlobalContext } from '../context/GlobalState'
import api from '../api/axios'
import { 
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import { LineChart as LCIcon, Calendar, NotebookPen, TrendingDown, TrendingUp, AlertCircle, Moon, Sun } from 'lucide-react'
import Topbar from '../components/layout/Topbar'

// Eliminamos el array vacío mockBpmHistory porque ahora usaremos la data real de la DB

export default function HomeAnalytics() {
  const { selectedChildId, navigate, userName, userRole } = useGlobalContext()
  const [isDark, setIsDark] = useState(false)
  const [selectedDay, setSelectedDay] = useState('Vie')
  const [homeHistoricalData, setHomeHistoricalData] = useState([])
  const [parentNotes, setParentNotes] = useState([])
  const [fetchError, setFetchError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedChildId) return;
      try {
        setFetchError(null)
        const endpoint = `/ninos/${selectedChildId}/bitacora`;
        const res = await api.get(endpoint);
        const bitacoras = res.data.data || [];

        const processedHomeData = {};
        const mappedNotes = [];

        bitacoras.forEach(bit => {
          const d = new Date(bit.bit_fech);
          // Ajustar huso horario para que no haya desfase por UTC (asegura que 20-Jun siga siendo 20-Jun localmente)
          const localDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
          
          const diaSemana = localDate.toLocaleDateString('es-ES', { weekday: 'short' });
          const diaFormato = localDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
          const dia = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${diaFormato}`;

          let newCalma = 70;
          if (bit.bit_anim === 'Muy Calmo') newCalma = 95;
          if (bit.bit_anim === 'Estable') newCalma = 80;
          if (bit.bit_anim === 'Irritable') newCalma = 45;
          if (bit.bit_anim === 'Crisis / Sobrecarga') newCalma = 15;

          if (!processedHomeData[dia]) {
            processedHomeData[dia] = { dia, rawDate: localDate.getTime(), calma: newCalma, sobrecarga: 100 - newCalma, count: 1 };
          } else {
            processedHomeData[dia].calma += newCalma;
            processedHomeData[dia].sobrecarga += (100 - newCalma);
            processedHomeData[dia].count += 1;
          }

          const time = new Date(bit.bit_crea).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          const summaryText = `[Sueño: ${bit.bit_suen}h - ${bit.bit_cali}] [Estado de Ánimo: ${bit.bit_anim}] [Apetito: ${bit.bit_apet}] [Crisis: ${bit.bit_crisi || 0}] [Digestión: ${bit.bit_diges || 'N/A'}] [Medicación: ${bit.bit_medi ? 'Sí' : 'No'}]`;
          const extrasText = [bit.bit_dese ? `Desencadenantes: ${bit.bit_dese}` : null, bit.bit_senso ? `Sensibilidad: ${bit.bit_senso}` : null, bit.bit_obse].filter(Boolean).join(' | ');

          mappedNotes.push({
            time,
            bpm: bit.bit_bpm,
            dia,
            summaryText,
            extrasText
          });
        });

        const finalHomeData = Object.values(processedHomeData).map(item => ({
          dia: item.dia,
          rawDate: item.rawDate,
          calma: Math.round(item.calma / item.count),
          sobrecarga: Math.round(item.sobrecarga / item.count)
        }));

        // Ordenar cronológicamente (de más antiguo a más reciente)
        const sortedHomeData = finalHomeData.sort((a, b) => a.rawDate - b.rawDate);

        setHomeHistoricalData(sortedHomeData);
        setParentNotes(mappedNotes);

        if (sortedHomeData.length > 0) {
          setSelectedDay(sortedHomeData[sortedHomeData.length - 1].dia);
        }

      } catch (err) {
        console.error("Error fetching bitacoras:", err);
        setFetchError(err.response?.data?.message || err.message || "Error de conexión");
      }
    };
    fetchData();
  }, [selectedChildId]);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark')
    setIsDark(!isDark)
  }

  // Mock data dinámica con fechas reales de los últimos 7 días
  const mockHistoricalData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const diaSemana = d.toLocaleDateString('es-ES', { weekday: 'short' })
    const diaFormato = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    const dia = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${diaFormato}`
    const calma = [65, 72, 58, 80, 45, 70, 85][i]
    return { dia, rawDate: d.getTime(), calma, sobrecarga: 100 - calma }
  })
  const mockBpmData = [
    { hora: '08:00', bpm: 72 }, { hora: '10:00', bpm: 85 },
    { hora: '12:00', bpm: 78 }, { hora: '14:00', bpm: 95 },
    { hora: '16:00', bpm: 68 }, { hora: '18:00', bpm: 82 },
    { hora: '20:00', bpm: 74 },
  ]

  const effectiveHomeData = homeHistoricalData.length > 0 ? homeHistoricalData : mockHistoricalData
  const avgCalma = Math.round(effectiveHomeData.reduce((s, d) => s + d.calma, 0) / effectiveHomeData.length)
  const worstDay = [...effectiveHomeData].sort((a, b) => a.calma - b.calma)[0] || { dia: '-', calma: 0, sobrecarga: 0 }
  const bestDay  = [...effectiveHomeData].sort((a, b) => b.calma - a.calma)[0] || { dia: '-', calma: 0 }
  const dayNotes = parentNotes.filter(n => n.dia === selectedDay).sort((a, b) => a.time.localeCompare(b.time))
  
  // Extraer el historial real de BPM de los reportes ingresados por el padre en el diario de hogar
  const bpmChartData = dayNotes
    .filter(n => n.bpm)
    .map(n => ({ hora: n.time, bpm: n.bpm }))

  const displayHistoricalData = homeHistoricalData.length > 0 ? homeHistoricalData : mockHistoricalData
  const displayBpmData = bpmChartData.length > 0 ? bpmChartData : mockBpmData

  if (!selectedChildId) {
    return (
      <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center p-10 bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-800/60 shadow-sm max-w-md mx-4">
            <LCIcon className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Sin paciente seleccionado</h3>
            <p className="text-slate-500 text-sm mb-6">Selecciona un paciente para ver su análisis histórico del hogar.</p>
            <button onClick={() => navigate('patients')} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
              Ir al Gestor de Pacientes
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8 pb-12">

            <div>
              <h1 className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                <LCIcon className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                Análisis del Hogar
              </h1>
              <p className="text-sm text-slate-500 mt-1">Datos del wearable fuera de la clínica, cruzados con las notas del representante.</p>
              {fetchError && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded border border-red-300">
                  <span className="font-bold">Error obteniendo datos:</span> {fetchError}. Asegúrate de que el backend se haya reiniciado para aplicar las nuevas rutas.
                </div>
              )}
            </div>

            {/* KPIs resumen */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Promedio de Calma</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{avgCalma}%</p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Calendar className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Mejor Día</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{bestDay.dia} <span className="text-sm font-medium text-emerald-600">({bestDay.calma}%)</span></p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-5 border border-rose-500/20 shadow-sm flex items-center gap-4 text-white">
                <div className="p-3 bg-white/20 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-rose-100 uppercase tracking-wide">Peor Día (Más Crisis)</p>
                  <p className="text-2xl font-bold">{worstDay.dia} <span className="text-sm font-medium text-rose-200">({worstDay.sobrecarga}% sobrecarga)</span></p>
                </div>
              </div>
            </div>

            {/* Gráficas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Balance Calma/Sobrecarga por día */}
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-sm min-h-[250px] md:h-[360px]">
                <div className="mb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Balance Emocional por Día</h2>
                    <p className="text-xs text-slate-500 mt-1">% de tiempo en calma vs. sobrecarga (datos del hogar)</p>
                  </div>
                  <div className="flex gap-3 text-xs font-semibold">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>Calma</span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>Sobrecarga</span>
                  </div>
                </div>
                <div className="min-h-[180px] md:min-h-0" style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={0}>
                    <BarChart data={displayHistoricalData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
                      <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }} tickFormatter={v => `${v}%`} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, backgroundColor: isDark ? '#0F172A' : '#fff', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '12px' }}
                        formatter={(value, name) => [`${value}%`, name === 'calma' ? 'Calma' : 'Sobrecarga']}
                      />
                      <Bar dataKey="calma" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={35}>
                        {displayHistoricalData.map((entry, i) => (
                          <Cell key={i} fill={entry.dia === selectedDay ? '#1D4ED8' : '#3B82F6'} onClick={() => setSelectedDay(entry.dia)} cursor="pointer" />
                        ))}
                      </Bar>
                      <Bar dataKey="sobrecarga" fill="#F87171" radius={[4, 4, 0, 0]} maxBarSize={35}>
                        {displayHistoricalData.map((entry, i) => (
                          <Cell key={i} fill={entry.dia === selectedDay ? '#DC2626' : '#F87171'} onClick={() => setSelectedDay(entry.dia)} cursor="pointer" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* BPM a lo largo del día seleccionado */}
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-sm min-h-[250px] md:h-[360px]">
                <div className="mb-4">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Frecuencia Cardíaca — {selectedDay}</h2>
                  <p className="text-xs text-slate-500 mt-1">Distribución de BPM durante el día seleccionado en casa</p>
                </div>
                <div className="min-h-[180px] md:min-h-0" style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={0}>
                    <AreaChart data={displayBpmData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bpmGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
                      <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`, backgroundColor: isDark ? '#0F172A' : '#fff', color: isDark ? '#f8fafc' : '#0f172a', fontSize: '12px' }}
                        formatter={v => [`${v} bpm`, 'Frec. Cardíaca']}
                      />
                      <Area type="monotone" dataKey="bpm" stroke="#6366F1" strokeWidth={3} fillOpacity={1} fill="url(#bpmGrad)" name="BPM" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Registro Clínico Completo para el día seleccionado */}
            <div className="bg-white dark:bg-[#1E293B] rounded-xl p-6 border border-slate-200 dark:border-slate-800/60 shadow-sm">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <NotebookPen className="w-5 h-5 text-indigo-500" />
                    Registro Clínico Completo — {selectedDay}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">Detalles médicos, crisis y observaciones anotadas por el representante</p>
                </div>
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full font-medium">
                  Haz clic en una barra del gráfico para filtrar por día
                </span>
              </div>

              {dayNotes.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                  <p className="text-sm">Sin reportes registrados para este día.</p>
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3 font-semibold uppercase">Hora de Registro</th>
                        <th className="px-4 py-3 font-semibold uppercase">BPM</th>
                        <th className="px-4 py-3 font-semibold uppercase">Resumen Clínico Reportado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {dayNotes.map((note, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-4 font-mono text-slate-500 text-xs align-top whitespace-nowrap">{note.time}</td>
                          <td className="px-4 py-4 align-top">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${note.bpm && note.bpm > 100 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                              {note.bpm ? `${note.bpm} bpm` : 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-slate-700 dark:text-slate-300">
                            <div className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 mb-1">{note.summaryText}</div>
                            <div className="text-sm italic text-slate-500 dark:text-slate-400">{note.extrasText || 'Sin detalles adicionales'}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
