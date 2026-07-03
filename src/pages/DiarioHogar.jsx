import { useState, useEffect, useMemo, useCallback } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { useGlobalContext } from '../context/GlobalState'
import api from '../api/axios'
import { CheckCircle2, NotebookPen, Calendar, X, Moon, Utensils, AlertTriangle, Heart } from 'lucide-react'
import LoadingState from '../components/dashboard/LoadingState'
import Topbar from '../components/layout/Topbar'
import Pagination from '../components/shared/Pagination'

const mockBitacoras = [
  { bit_codi: 0, bit_fech: new Date().toISOString().split('T')[0], bit_anim: 'Estable', bit_crisi: 0, bit_suen: 8, bit_apet: 'Bueno', bit_dese: '', bit_obse: 'Sin novedades aún.' },
  { bit_codi: 1, bit_fech: new Date(Date.now() - 86400000).toISOString().split('T')[0], bit_anim: 'Estable', bit_crisi: 0, bit_suen: 8, bit_apet: 'Bueno', bit_dese: 'Ruido de aspiradora', bit_obse: 'Buena jornada, completó todas las rutinas.' },
  { bit_codi: 2, bit_fech: new Date(Date.now() - 172800000).toISOString().split('T')[0], bit_anim: 'Irritable', bit_crisi: 2, bit_suen: 6, bit_apet: 'Regular', bit_dese: 'Cambio en la rutina de la tarde', bit_obse: 'Dos crisis breves, se recuperó con respiración.' },
  { bit_codi: 3, bit_fech: new Date(Date.now() - 259200000).toISOString().split('T')[0], bit_anim: 'Muy Calmo', bit_crisi: 0, bit_suen: 9, bit_apet: 'Bueno', bit_dese: '', bit_obse: 'Sin novedades.' },
  { bit_codi: 4, bit_fech: new Date(Date.now() - 345600000).toISOString().split('T')[0], bit_anim: 'Estable', bit_crisi: 0, bit_suen: 7, bit_apet: 'Selectivo', bit_dese: 'Textura de alimentos nuevos', bit_obse: 'Rechazó la cena.' },
]

export default function DiarioHogar() {
  const { userRole, selectedChildId, navigate, showToast, listaNinos } = useGlobalContext()

  const genero = useMemo(() => {
    const nino = listaNinos.find(n => (n.id_ninos || n.nin_codi) === selectedChildId)
    return nino?.nin_gner === 'F' ? 'femenino' : 'masculino'
  }, [listaNinos, selectedChildId])

  const art = genero === 'femenino' ? 'la' : 'el'
  const ninoLabel = genero === 'femenino' ? 'niña' : 'niño'

  // API Integration States
  const [bitacorasList, setBitacorasList] = useState([])
  const [loadingBitacoras, setLoadingBitacoras] = useState(true)

  // Form states for Bitácora
  const todayLocal = new Date()
  const localDate = new Date(todayLocal.getTime() - todayLocal.getTimezoneOffset() * 60000).toISOString().split('T')[0]
  const [reportDate, setReportDate] = useState(localDate)
  const [mood, setMood] = useState('Estable')
  const [crisisCount, setCrisisCount] = useState(0)
  const [sleepHours, setSleepHours] = useState(8)
  const [appetite, setAppetite] = useState('')
  const [notes, setNotes] = useState('')
  const [triggers, setTriggers] = useState('')
  const [positiveNote, setPositiveNote] = useState('')
  const [therapyDone, setTherapyDone] = useState('')
  const [showExtra, setShowExtra] = useState(false)

  // Filters
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterMood, setFilterMood] = useState('TODOS')
  const [filterCrisisOnly, setFilterCrisisOnly] = useState(false)

  const filteredBitacoras = useMemo(() => {
    let data = bitacorasList
    if (filterDateFrom) data = data.filter(b => new Date(b.bit_fech) >= new Date(filterDateFrom))
    if (filterDateTo) data = data.filter(b => new Date(b.bit_fech) <= new Date(filterDateTo + 'T23:59:59'))
    if (filterMood !== 'TODOS') data = data.filter(b => b.bit_anim === filterMood)
    if (filterCrisisOnly) data = data.filter(b => (b.bit_crisi || 0) > 0)
    return data
  }, [bitacorasList, filterDateFrom, filterDateTo, filterMood, filterCrisisOnly])

  const PAGE_SIZE = 8
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(filteredBitacoras.length / PAGE_SIZE)
  const pagedBitacoras = filteredBitacoras.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => { setPage(0) }, [filterDateFrom, filterDateTo, filterMood, filterCrisisOnly])

  const hasFilters = filterDateFrom || filterDateTo || filterMood !== 'TODOS' || filterCrisisOnly

  const fetchBitacoras = useCallback(async () => {
    try {
      setLoadingBitacoras(true)
      const endpoint = userRole === 'ESPECIALISTA' && selectedChildId
        ? `/ninos/${selectedChildId}/bitacora`
        : '/ninos/bitacora'
      const res = await api.get(endpoint)
      setBitacorasList(res.data.data?.length > 0 ? res.data.data : mockBitacoras)
    } catch (err) {
      console.error(err)
      setBitacorasList(mockBitacoras)
    } finally {
      setLoadingBitacoras(false)
    }
  }, [userRole, selectedChildId])

  const handleReportSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        date: reportDate,
        mood,
        crisisCount: Number(crisisCount),
        sleepHours: sleepHours ? parseFloat(sleepHours) : null,
        appetite: appetite || null,
        text: notes || null,
        triggers: triggers || null,
        positiveNote: positiveNote || null,
        therapyDone: therapyDone || null
      }
      await api.post('/ninos/bitacora', payload)
      showToast('✅ Reporte guardado')
      setCrisisCount(0)
      setMood('Estable')
      setNotes('')
      setTriggers('')
      setAppetite('')
      setPositiveNote('')
      setTherapyDone('')
      setSleepHours(8)
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
  }, [userRole, fetchBitacoras, selectedChildId])

  // Security Guard
  if (userRole !== 'REPRESENTANTE') {
    return (
      <div className="flex h-[100dvh] w-full bg-slate-50 dark:bg-slate-900 items-center justify-center">
        <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Acceso Denegado</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">Módulo exclusivo para Representantes (Padres).</p>
          <button onClick={() => navigate('dashboard')} className="px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Volver al Inicio</button>
        </div>
      </div>
    )
  }

  const totalReports = bitacorasList.length
  const totalCrisis = bitacorasList.reduce((sum, b) => sum + (b.bit_crisi || 0), 0)
  const lastMood = bitacorasList.length > 0 ? bitacorasList[0].bit_anim : '—'

  return (
    <div className="flex h-[100dvh] w-full bg-[#F4F7F9] dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-10 space-y-8 animate-in fade-in duration-300 pb-20">
            
            {/* Header del Módulo */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                  <NotebookPen className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                  Diario de Hogar
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Registro diario del estado y evolución de {art} {ninoLabel}
                </p>
              </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <NotebookPen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reportes</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{totalReports}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Último Ánimo</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{lastMood}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Crisis (Total)</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{totalCrisis}</p>
                </div>
              </div>
              <div className="bg-white dark:bg-[#1E293B] rounded-xl p-5 border border-slate-200 dark:border-slate-800/60 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Racha</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {bitacorasList.length > 0
                      ? `${Math.min(bitacorasList.length, 7)} días`
                      : '—'}
                  </p>
                </div>
              </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Fecha</label>
                    <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Ánimo de {art} {ninoLabel}</label>
                    <select value={mood} onChange={e => setMood(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                      <option>Muy Calmo</option><option>Estable</option><option>Irritable</option><option>Ansioso</option><option>Triste</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Crisis hoy</label>
                    <input type="number" min="0" value={crisisCount} onChange={e => setCrisisCount(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Algo positivo de hoy</label>
                  <input type="text" placeholder={genero === 'femenino' ? 'Ej: Hoy logró comer sola, se vistió sola...' : 'Ej: Hoy logró comer solo, se vistió solo...'} value={positiveNote} onChange={e => setPositiveNote(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Notas (opcional)</label>
                  <textarea rows="2" placeholder={genero === 'femenino' ? 'Cómo fue el día, eventos importantes...' : 'Cómo fue el día, eventos importantes...'} value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"></textarea>
                </div>

                <div className="space-y-1.5">
                  <button type="button" onClick={() => setShowExtra(!showExtra)} className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors">
                    {showExtra ? '− Ocultar' : '+ Más detalles'} (sueño, apetito, terapia...)
                  </button>

                  {showExtra && (
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Horas de sueño</label>
                        <input type="number" min="0" max="24" value={sleepHours} onChange={e => setSleepHours(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Apetito</label>
                        <select value={appetite} onChange={e => setAppetite(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                          <option value="">—</option>
                          <option>Bueno</option><option>Regular</option><option>Selectivo</option><option>Rechazó alimentos</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Terapia hoy</label>
                        <select value={therapyDone} onChange={e => setTherapyDone(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                          <option value="">—</option>
                          <option value="si">Sí, completa</option>
                          <option value="parcial">Sí, parcial</option>
                          <option value="no">No</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Desencadenantes</label>
                        <input type="text" placeholder="Ej: Ruido, cambio de rutina" value={triggers} onChange={e => setTriggers(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" className="px-5 py-2.5 bg-brand-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Guardar Reporte
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
              <div className="p-6 md:p-8 pt-4">
                <div className="flex flex-wrap gap-3 items-center mb-6">
                  <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" title="Fecha desde" />
                  <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" title="Fecha hasta" />
                  <select value={filterMood} onChange={e => setFilterMood(e.target.value)} className="px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                    <option value="TODOS">Todos los ánimos</option>
                    <option value="Muy Calmo">Muy Calmo</option>
                    <option value="Estable">Estable</option>
                    <option value="Irritable">Irritable</option>
                    <option value="Ansioso">Ansioso</option>
                    <option value="Triste">Triste</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input type="checkbox" checked={filterCrisisOnly} onChange={e => setFilterCrisisOnly(e.target.checked)} className="rounded border-gray-300 dark:border-slate-600 text-brand-500 focus:ring-brand-500" />
                    Solo crisis
                  </label>
                  {hasFilters && (
                    <button onClick={() => { setFilterDateFrom(''); setFilterDateTo(''); setFilterMood('TODOS'); setFilterCrisisOnly(false) }} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors shrink-0">
                      <X className="w-3.5 h-3.5" /> Limpiar
                    </button>
                  )}
                </div>

                {loadingBitacoras ? (
                  <LoadingState variant="table" rows={4} />
                ) : filteredBitacoras.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-slate-400">
                    <Calendar className="w-8 h-8 opacity-50" />
                    <span className="text-sm font-medium">Aún no hay reportes registrados</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pagedBitacoras.map((bitacora, idx) => {
                      const dateObj = new Date(bitacora.bit_fech);
                      const diaSemana = dateObj.toLocaleDateString('es-ES', { weekday: 'short' });
                      const diaFormato = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                      const fechaTexto = `${diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1)} ${diaFormato}`;
                      const animoIconos = { 'Muy Calmo': '😌', 'Estable': '😊', 'Irritable': '😠', 'Ansioso': '😟', 'Triste': '😢' };
                      const crisisColor = (bitacora.bit_crisi || 0) > 0 ? 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/20 border-rose-200 dark:border-rose-900/30' : 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30';

                      return (
                        <div key={bitacora.bit_codi || idx} className="p-5 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{fechaTexto}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${crisisColor}`}>
                                <AlertTriangle className="w-3 h-3" /> {bitacora.bit_crisi || 0} crisis
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                              <span className="text-base">{animoIconos[bitacora.bit_anim] || '😐'}</span>
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Ánimo</p>
                                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{bitacora.bit_anim}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                              <Moon className="w-4 h-4 text-indigo-400" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sueño</p>
                                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{bitacora.bit_suen ? `${bitacora.bit_suen}h` : '—'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                              <Utensils className="w-4 h-4 text-amber-400" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Apetito</p>
                                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{bitacora.bit_apet || '—'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700">
                              <Heart className="w-4 h-4 text-rose-400" />
                              <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Positivo</p>
                                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">{bitacora.positiveNote || '—'}</p>
                              </div>
                            </div>
                          </div>

                          {(bitacora.bit_dese || bitacora.bit_obse) && (
                            <div className="flex flex-wrap gap-2">
                              {bitacora.bit_dese && (
                                <span className="text-[10px] px-2 py-1 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-900/30">
                                  🧩 {bitacora.bit_dese}
                                </span>
                              )}
                              {bitacora.bit_obse && (
                                <span className="text-[10px] px-2 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 border border-blue-200 dark:border-blue-900/30">
                                  💬 {bitacora.bit_obse}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
