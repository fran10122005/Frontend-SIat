import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useGlobalContext } from '../context/GlobalState'
import api from '../api/axios'
import { CheckCircle2, NotebookPen, Calendar } from 'lucide-react'
import Topbar from './Topbar'

export default function DiarioHogar() {
  const { userRole, selectedChildId, navigate, showToast } = useGlobalContext()
  const [isDark, setIsDark] = useState(false)

  // API Integration States
  const [bitacorasList, setBitacorasList] = useState([])
  const [loadingBitacoras, setLoadingBitacoras] = useState(true)

  // Form states for Bitácora
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [sleepHours, setSleepHours] = useState(8)
  const [sleepQuality, setSleepQuality] = useState('Excelente')
  const [mood, setMood] = useState('Estable')
  const [appetite, setAppetite] = useState('Bueno')
  const [bpm, setBpm] = useState('')
  const [notes, setNotes] = useState('')
  const [crisisCount, setCrisisCount] = useState(0)
  const [triggers, setTriggers] = useState('')
  const [sensoryIssues, setSensoryIssues] = useState('')
  const [medicationTaken, setMedicationTaken] = useState(true)
  const [digestion, setDigestion] = useState('Normal')

  const fetchBitacoras = async () => {
    try {
      setLoadingBitacoras(true)
      const endpoint = userRole === 'ESPECIALISTA' && selectedChildId
        ? `/ninos/${selectedChildId}/bitacora`
        : '/ninos/bitacora'
      const res = await api.get(endpoint)
      setBitacorasList(res.data.data || [])
    } catch (err) {
      console.error(err)
      showToast('⚠️ No se pudo cargar el historial de bitácoras')
    } finally {
      setLoadingBitacoras(false)
    }
  }

  const handleReportSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        date: reportDate,
        sleepHours: parseFloat(sleepHours),
        sleepQuality,
        mood,
        appetite,
        bpm: bpm ? parseInt(bpm) : null,
        text: notes || 'Sin observaciones adicionales.',
        crisisCount,
        triggers,
        sensoryIssues,
        medicationTaken,
        digestion
      }
      await api.post('/ninos/bitacora', payload)
      showToast('✅ Reporte de bitácora registrado exitosamente')
      setNotes('')
      setBpm('')
      setCrisisCount(0)
      setTriggers('')
      setSensoryIssues('')
      setDigestion('Normal')
      fetchBitacoras()
    } catch (err) {
      console.error(err)
      showToast('❌ Error al registrar la bitácora: ' + (err.response?.data?.message || err.message))
    }
  }

  useEffect(() => {
    if (userRole === 'REPRESENTANTE') {
      fetchBitacoras()
    }
  }, [userRole])

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true)
    }
  }, [])

  // Security Guard
  if (userRole !== 'REPRESENTANTE') {
    return (
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-900 items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Acceso Denegado</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Módulo exclusivo para Representantes (Padres).</p>
          <button onClick={() => navigate('dashboard')} className="px-6 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-blue-600 transition-colors">Volver al Inicio</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-[#F4F7F9] dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <Topbar />

        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
          <div className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-10 space-y-8 animate-in fade-in duration-300 pb-20">
            
            {/* Header del Módulo */}
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-[#003366] dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                <NotebookPen className="w-6 h-6 text-[#003366] dark:text-blue-400" />
                Diario de Hogar (Bitácora)
              </h1>

            </div>

            {/* Formulario */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-8">
              <div className="p-6 md:p-8 border-b border-gray-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <NotebookPen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Registrar Nuevo Reporte Diario
                </h3>
              </div>
              <form onSubmit={handleReportSubmit} className="p-6 md:p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fecha del Reporte</label>
                      <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Horas de Sueño</label>
                      <input type="number" min="0" max="24" value={sleepHours} onChange={e => setSleepHours(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Calidad de Sueño</label>
                      <select value={sleepQuality} onChange={e => setSleepQuality(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                        <option>Excelente</option><option>Interrumpido</option><option>Insomnio</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Apetito</label>
                      <select value={appetite} onChange={e => setAppetite(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                        <option>Bueno</option><option>Regular</option><option>Malo / Selectivo</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado de Ánimo Predominante</label>
                      <select value={mood} onChange={e => setMood(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                        <option>Muy Calmo</option><option>Estable</option><option>Irritable</option><option>Crisis / Sobrecarga</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cant. de Crisis Hoy</label>
                      <input type="number" min="0" value={crisisCount} onChange={e => setCrisisCount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">BPM Estimado (Opcional)</label>
                      <input type="number" placeholder="Ej: 85" value={bpm} onChange={e => setBpm(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Desencadenantes Identificados</label>
                      <input type="text" placeholder="Ej: Luces fuertes, cambio de rutina..." value={triggers} onChange={e => setTriggers(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sensibilidades Sensoriales Hoy</label>
                      <input type="text" placeholder="Ej: Taparse los oídos frecuente" value={sensoryIssues} onChange={e => setSensoryIssues(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estado Digestivo</label>
                      <select value={digestion} onChange={e => setDigestion(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                        <option>Normal</option><option>Estreñimiento</option><option>Diarrea</option><option>Malestar abdominal</option>
                      </select>
                    </div>
                    <div className="space-y-2 flex flex-col justify-center pt-6">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={medicationTaken} onChange={e => setMedicationTaken(e.target.checked)} className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Medicación Administrada Correctamente</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Observaciones y Contexto Adicional</label>
                    <textarea rows="3" placeholder="Detalles de la sesión en casa, eventos del día..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"></textarea>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" className="px-6 py-2.5 bg-[#007BFF] hover:bg-blue-600 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Enviar Reporte al Especialista
                    </button>
                  </div>
              </form>
            </div>

            {/* Historial */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-gray-100 dark:border-slate-700">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-500" />
                  Historial de Diario
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider">Día / Hora</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider">BPM</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider">Resumen Clínico Reportado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {loadingBitacoras ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                          Cargando historial de bitácoras...
                        </td>
                      </tr>
                    ) : bitacorasList.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                          No hay reportes de bitácora registrados.
                        </td>
                      </tr>
                    ) : (
                      bitacorasList.map((bitacora, idx) => {
                        const dateObj = new Date(bitacora.bit_fech);
                        const diaSemana = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });
                        const diaFormato = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                        const fechaTexto = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${diaFormato}`;
                        
                        // Formatear el resumen de la bitácora
                        const summaryText = `[Sueño: ${bitacora.bit_suen}h - ${bitacora.bit_cali}] [Estado de Ánimo: ${bitacora.bit_anim}] [Apetito: ${bitacora.bit_apet}] [Crisis: ${bitacora.bit_crisi || 0}] [Digestión: ${bitacora.bit_diges || 'N/A'}] [Medicación: ${bitacora.bit_medi ? 'Sí' : 'No'}]`;
                        const extrasText = [bitacora.bit_dese ? `Desencadenantes: ${bitacora.bit_dese}` : null, bitacora.bit_senso ? `Sensibilidad: ${bitacora.bit_senso}` : null, bitacora.bit_obse].filter(Boolean).join(' | ');
                        
                        return (
                          <tr key={bitacora.bit_codi || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200 whitespace-nowrap align-top">
                              {fechaTexto}
                            </td>
                            <td className="px-6 py-4 align-top">
                              <span className={`px-2 py-1 rounded-md text-xs font-bold ${bitacora.bit_bpm && bitacora.bit_bpm > 100 ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                {bitacora.bit_bpm ? `${bitacora.bit_bpm} bpm` : 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                              <div className="font-semibold text-xs text-indigo-600 dark:text-indigo-400 mb-1">{summaryText}</div>
                              <div className="text-sm italic">{extrasText || 'Sin detalles adicionales'}</div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
