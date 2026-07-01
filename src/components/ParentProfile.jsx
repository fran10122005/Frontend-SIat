import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { useGlobalContext } from '../context/GlobalState'
import api from '../api/axios'
import AlertCenter from './AlertCenter'
import Indicaciones from './Indicaciones'
import { CheckCircle2, Moon, Sun, Utensils, HeartPulse, NotebookPen, Calendar, UserCircle } from 'lucide-react'
import Topbar from './Topbar'

export default function ParentProfile() {
  const { userRole, navigate, showToast } = useGlobalContext()
  const [isDark, setIsDark] = useState(false)
  const [activeTab, setActiveTab] = useState('perfil')

  // API Integration States
  const [childProfile, setChildProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true)
      const res = await api.get('/ninos/mi-expediente')
      setChildProfile(res.data.data)
    } catch (err) {
      console.error(err)
      showToast('⚠️ No se pudo cargar el expediente clínico del niño')
    } finally {
      setLoadingProfile(false)
    }
  }

  useEffect(() => {
    if (userRole === 'REPRESENTANTE') {
      fetchProfile()
    }
  }, [userRole])

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

  const getTeaLevelBadge = (level) => {
    const lvl = String(level || '').toLowerCase();
    if (lvl.includes('1')) {
      return 'Nivel 1 - Necesita Ayuda';
    } else if (lvl.includes('2')) {
      return 'Nivel 2 - Necesita Ayuda Notable';
    } else if (lvl.includes('3')) {
      return 'Nivel 3 - Necesita Ayuda Muy Notable';
    }
    return level || 'No especificado';
  }

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

  return (
    <div className="flex h-[100dvh] w-full bg-[#F4F7F9] dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar */}
        <Topbar />

        {/* Content Container with Tabs */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header & Tabs */}
          <div className="pt-4 md:pt-5 px-6 md:px-8 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shrink-0">
            <div className="max-w-[1400px] mx-auto">
              <h1 className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors mb-4">
                <UserCircle className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                Expediente Clínico
              </h1>

              <div className="flex gap-6 overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setActiveTab('perfil')}
                  className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'perfil' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Información del Perfil
                  </span>
                </button>
                <button 
                  onClick={() => setActiveTab('alertas')}
                  className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'alertas' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    Registro de Alertas
                  </span>
                </button>
                <button 
                  onClick={() => setActiveTab('indicaciones')}
                  className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'indicaciones' ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 102-2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    Indicaciones Clínicas
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Content */}
          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
            {activeTab === 'perfil' && (
              <div className="max-w-[1400px] mx-auto p-6 md:p-8 lg:p-10">
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors duration-200">
                  <div className="p-6 md:p-8">
                    <h3 className="text-sm font-semibold text-brand-700 dark:text-blue-300 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700 pb-2 mb-6 transition-colors">
                      Datos Clínicos Registrados
                    </h3>
                    
                    {loadingProfile ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <p className="text-sm text-gray-500 mt-4">Cargando expediente clínico...</p>
                      </div>
                    ) : !childProfile ? (
                      <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-gray-400">No se encontró información de expediente para el niño asociado.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Col 1 */}
                        <div className="space-y-6">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Nombre Completo</p>
                            <p className="text-lg font-medium text-gray-900 dark:text-white mt-1">
                              {childProfile.nin_nomb} {childProfile.nin_apel}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Código de Sistema (ID)</p>
                            <p className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700/50 inline-block px-2 py-1 rounded mt-1">
                              {childProfile.nin_codi}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Fecha de Nacimiento</p>
                            <p className="text-md text-gray-800 dark:text-gray-200 mt-1">
                              {childProfile.nin_fnac ? new Date(childProfile.nin_fnac).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''} ({childProfile.nin_edad})
                            </p>
                          </div>
                        </div>

                        {/* Col 2 */}
                        <div className="space-y-6">
                          <div>
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Nivel de Desarrollo (TEA)</p>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg mt-1 font-medium text-sm">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              {getTeaLevelBadge(childProfile.nin_nivd)}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Perfil Sensorial Principal</p>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg mt-1 font-medium text-sm">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                              {childProfile.perfil_sensorial || 'Sensorial Mixto'}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Especialista Asignado</p>
                            <p className="text-md text-gray-800 dark:text-gray-200 mt-1 flex items-center gap-2">
                              <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                              {childProfile.especialista || 'Especialista asignado'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-6 md:px-8 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 flex justify-end">
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Cualquier modificación debe ser solicitada al especialista médico.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'alertas' && <AlertCenter />}
            {activeTab === 'indicaciones' && <Indicaciones />}
            
            {/* Bitacora tab is removed - handled by DiarioHogar component */}
          </div>
        </div>
      </main>
    </div>
  )
}
