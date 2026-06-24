import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useGlobalContext } from '../context/GlobalState'
import api from '../api/axios'
import { Users } from 'lucide-react'
import Topbar from './Topbar'

export default function PatientManagement() {
  const { listaNinos, setSelectedChildId, setNomNino, navigate, fetchNinos, showToast } = useGlobalContext()
  const [isDark, setIsDark] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterNivel, setFilterNivel] = useState('Todos')
  
  // New States for Clinical Invitation
  const [showRegModal, setShowRegModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    nin_nomb: '',
    nin_apel: '',
    nin_fnac: '',
    nin_gner: 'M',
    nin_nivd: 'Nivel 1',
    rep_nomb: '',
    rep_apel: '',
    usu_crro: ''
  })

  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true)
    }
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
    setIsDark(!isDark)
  }

  const handleManagePatient = (nino) => {
    setSelectedChildId(nino.id_ninos)
    setNomNino(`${nino.nom_nino} ${nino.ape_nino}`) // Set legacy nomNino for consistency
    navigate('student')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/ninos/invite-representative', formData)
      const respData = res.data.data
      setGeneratedLink(respData.invitationUrl)
      setShowRegModal(false)
      setShowLinkModal(true)
      showToast('✅ Invitación clínica creada con éxito')
      setFormData({
        nin_nomb: '',
        nin_apel: '',
        nin_fnac: '',
        nin_gner: 'M',
        nin_nivd: 'Nivel 1',
        rep_nomb: '',
        rep_apel: '',
        usu_crro: ''
      })
      fetchNinos()
    } catch (err) {
      console.error(err)
      showToast(`❌ Error: ${err.response?.data?.error || err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const filteredNinos = listaNinos.filter(nino => {
    const matchesSearch = `${nino.nom_nino} ${nino.ape_nino}`.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterNivel === 'Todos' || nino.niv_desa === filterNivel
    return matchesSearch && matchesFilter
  })

  // Obtener iniciales
  const getInitials = (nombre, apellido) => {
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
  }

  const nivelesUnicos = ['Todos', ...new Set(listaNinos.map(n => n.niv_desa))]

  return (
    <div className="flex h-screen w-full bg-[#F4F7F9] dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-200">
      {/* Menú Lateral Izquierdo */}
      <Sidebar />

      {/* Lienzo Derecho (Main Canvas) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar / Header Superior de Utilidad */}
        <Topbar />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-6 md:p-8 lg:p-10 flex flex-col gap-8">
            
            {/* Header del Dashboard ([B] Ind. Empresa y [A] Logo + [D] Botones de Cambio) */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-[#003366] dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                  <Users className="w-6 h-6 text-[#003366] dark:text-blue-400" />
                  Portal Clínico de Especialistas
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Panel de control para el seguimiento de pacientes asignados
                </p>
              </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                  <input 
                    type="text" 
                    placeholder="Buscar paciente por nombre..." 
                    className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#007BFF] transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <select 
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#007BFF] transition-all cursor-pointer"
                  value={filterNivel}
                  onChange={(e) => setFilterNivel(e.target.value)}
                >
                  {nivelesUnicos.map(nivel => (
                    <option key={nivel} value={nivel}>{nivel}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => setShowRegModal(true)}
                className="w-full md:w-auto px-5 py-2.5 bg-[#0056b3] hover:bg-[#003d82] text-white font-medium rounded-lg shadow-md transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                Registrar Nuevo Niño
              </button>
            </div>

            {/* [C] Objetos (Cuadrícula de Pacientes) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNinos.map(nino => (
                <div key={nino.id_ninos} className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                  
                  {/* Decorative background glow on hover */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-100 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 dark:from-slate-700 dark:to-slate-800 pointer-events-none -z-10 blur-xl"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-[#007BFF] dark:text-blue-400 text-xl font-bold shadow-sm border border-blue-200 dark:border-blue-800/50">
                      {getInitials(nino.nom_nino, nino.ape_nino)}
                    </div>
                    
                    {/* Hardware State Indicator */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600">
                      <span className={`w-2 h-2 rounded-full ${nino.est_disp === 'Online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-gray-400'}`}></span>
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{nino.est_disp}</span>
                    </div>
                  </div>
                  
                  <div className="mb-5 flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1 mb-1">
                      {nino.nom_nino} {nino.ape_nino}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mb-3 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                      {nino.id_ninos}
                    </p>
                    
                    {/* Development Level Badge */}
                    <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50">
                      <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      Clasificación: {nino.niv_desa}
                    </span>
                  </div>

                  <button 
                    onClick={() => handleManagePatient(nino)}
                    className="w-full py-2.5 bg-[#007BFF] hover:bg-[#0056b3] text-white font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 group/btn"
                  >
                    Gestionar Paciente 
                    <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              ))}
              
              {filteredNinos.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-slate-600">
                  <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-lg font-medium">No se encontraron pacientes</p>
                  <p className="text-sm">Ajusta los filtros o intenta con otro nombre.</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      </main>

      {/* Modal: Registrar Niño & Invitar Representante */}
      {showRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-[#034EA1] text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">Registrar Niño e Invitar Representante</h3>
              <button onClick={() => setShowRegModal(false)} className="text-white/80 hover:text-white text-xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b pb-1">Información del Paciente (Niño)</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombres</label>
                  <input required type="text" value={formData.nin_nomb} onChange={e => setFormData({...formData, nin_nomb: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. Juanito" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Apellidos</label>
                  <input required type="text" value={formData.nin_apel} onChange={e => setFormData({...formData, nin_apel: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. Pérez" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">F. Nacimiento</label>
                  <input required type="date" value={formData.nin_fnac} onChange={e => setFormData({...formData, nin_fnac: e.target.value})} className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Género</label>
                  <select value={formData.nin_gner} onChange={e => setFormData({...formData, nin_gner: e.target.value})} className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nivel TEA</label>
                  <select value={formData.nin_nivd} onChange={e => setFormData({...formData, nin_nivd: e.target.value})} className="w-full px-2 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                    <option value="Nivel 1">Nivel 1 (Leve)</option>
                    <option value="Nivel 2">Nivel 2 (Moderado)</option>
                    <option value="Nivel 3">Nivel 3 (Severo)</option>
                  </select>
                </div>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 border-b pb-1 pt-2">Información de la Invitación (Representante)</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Nombres Padre/Madre</label>
                  <input required type="text" value={formData.rep_nomb} onChange={e => setFormData({...formData, rep_nomb: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. Carlos" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Apellidos Padre/Madre</label>
                  <input required type="text" value={formData.rep_apel} onChange={e => setFormData({...formData, rep_apel: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej. Pérez" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Correo Electrónico (Representante)</label>
                <input required type="email" value={formData.usu_crro} onChange={e => setFormData({...formData, usu_crro: e.target.value})} className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="correo@repre.com" />
                <p className="text-[10px] text-slate-400 mt-1">El sistema pre-registrará al representante y le enviará un enlace de activación por correo.</p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t">
                <button type="button" onClick={() => setShowRegModal(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-200">Cancelar</button>
                <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{loading ? 'Procesando...' : 'Crear Registro'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Enlace de Activación Generado (Demo Fallback) */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">¡Invitación Clínica Creada!</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Se ha generado el token de activación clínico. Copie el siguiente enlace y envíelo al representante para que configure su cuenta:
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs select-all break-all text-left max-h-[80px] overflow-y-auto">
                {generatedLink}
              </div>

              <div className="flex gap-2 justify-center pt-2">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink)
                    showToast('📋 Enlace copiado al portapapeles')
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold"
                >
                  Copiar Enlace
                </button>
                <button 
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-lg text-sm font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
