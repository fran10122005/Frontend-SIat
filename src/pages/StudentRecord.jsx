import { useState, useEffect } from 'react'
import Sidebar from '../components/layout/Sidebar'
import { useGlobalContext } from '../context/GlobalState'
import { UserCircle } from 'lucide-react'
import Topbar from '../components/layout/Topbar'
import api from '../api/axios'

export default function StudentRecord({ onNavigate }) {
  const { showToast, selectedChildId, fetchNinos } = useGlobalContext()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    id_ninos: '',
    nom_nino: '',
    ape_nino: '',
    fec_naci: '',
    gen_nino: '',
    niv_desa: '',
    Id_sensi: '',
  })

  // Poblar los datos del niño seleccionado desde la API
  useEffect(() => {
    const fetchFicha = async () => {
      if (!selectedChildId) {
        setFormData({
          id_ninos: '',
          nom_nino: '',
          ape_nino: '',
          fec_naci: '',
          gen_nino: '',
          niv_desa: '',
          Id_sensi: '',
        })
        setIsEditing(false)
        return
      }

      try {
        const res = await api.get(`/ninos/${selectedChildId}/ficha`)
        const data = res.data.data
        
        let formattedDate = ''
        if (data.nin_fnac) {
          formattedDate = new Date(data.nin_fnac).toISOString().split('T')[0]
        }

        setFormData({
          id_ninos: data.nin_codi || '',
          nom_nino: data.nin_nomb || '',
          ape_nino: data.nin_apel || '',
          fec_naci: formattedDate,
          gen_nino: data.nin_gner || '',
          niv_desa: data.nin_nivd || '',
          Id_sensi: data.sensibilidad?.sen_tipo || '',
        })
      } catch (err) {
        console.error('Error fetching child clinical record:', err)
        showToast('⚠️ Error al cargar la ficha clínica desde el servidor.')
      }
    }

    fetchFicha()
  }, [selectedChildId])

  const currentTimestamp = new Date().toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedChildId) {
      showToast("⚠️ Debe seleccionar un paciente primero.")
      return
    }

    try {
      await api.put(`/ninos/${selectedChildId}/ficha`, {
        nin_nomb: formData.nom_nino,
        nin_apel: formData.ape_nino,
        nin_fnac: formData.fec_naci,
        nin_gner: formData.gen_nino,
        nin_nivd: formData.niv_desa,
        sen_tipo: formData.Id_sensi
      })
      setIsEditing(false)
      showToast("✅ Ficha clínica actualizada correctamente")
      fetchNinos() // Refrescar nombres y detalles en el menú contextual
    } catch (err) {
      console.error('Error updating child clinical record:', err)
      showToast(`❌ Error al guardar: ${err.response?.data?.error || err.message}`)
    }
  }


  return (
    <div className="flex h-[100dvh] w-full bg-[#F4F7F9] dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-200">
      {/* Menú Lateral Izquierdo */}
      <Sidebar />

      {/* Lienzo Derecho (Main Canvas) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Topbar / Header Superior */}
        <Topbar />

        {/* Main Content Scrollable Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-6 md:p-8 lg:p-10 flex flex-col gap-8">

            <header className="mb-8">
               <h1 className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                 <UserCircle className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                 Ficha Clínica del Estudiante
               </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">
                Administración de datos maestros y parámetros de sensibilidad del paciente.
              </p>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden mb-6 transition-colors duration-200">
                <div className="p-6 md:p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">

                    <div className="space-y-6">
                      <h3 className="text-sm font-semibold text-brand-700 dark:text-blue-300 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700 pb-2 transition-colors">
                        Datos de Identidad
                      </h3>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Código Interno Sistema <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1"></span></label>
                        <input
                          type="text"
                          name="id_ninos"
                          value={formData.id_ninos}
                          readOnly
                          className="w-full px-4 py-2.5 bg-gray-100 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none font-mono text-sm transition-colors"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nombres del Estudiante <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1"></span></label>
                        <input
                          type="text"
                          name="nom_nino"
                          value={formData.nom_nino}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Ej. Juan Alberto"
                          className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-slate-800/50 dark:text-gray-400' : ''}`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Apellidos del Estudiante <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1"></span></label>
                        <input
                          type="text"
                          name="ape_nino"
                          value={formData.ape_nino}
                          onChange={handleChange}
                          disabled={!isEditing}
                          placeholder="Ej. Pérez Gómez"
                          className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-slate-800/50 dark:text-gray-400' : ''}`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha de Nacimiento <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1"></span></label>
                        <div className="relative">
                          <input
                            type="date"
                            name="fec_naci"
                            value={formData.fec_naci}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-gray-800 dark:text-white appearance-none relative z-10 [color-scheme:light] dark:[color-scheme:dark] ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-slate-800/50 dark:text-gray-400' : ''}`}
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 z-0 pointer-events-none">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-sm font-semibold text-brand-700 dark:text-blue-300 uppercase tracking-wider border-b border-gray-100 dark:border-slate-700 pb-2 transition-colors">
                        Parámetros Clínicos
                      </h3>

                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Género Registrado <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1"></span></label>
                        <div className="flex gap-4">
                          <label className={`flex items-center p-3 border border-gray-200 dark:border-slate-700 rounded-lg transition-colors flex-1 ${!isEditing ? 'bg-gray-50 cursor-not-allowed dark:bg-slate-800/50' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}>
                            <input
                              type="radio"
                              name="gen_nino"
                              value="M"
                              checked={formData.gen_nino === 'M'}
                              onChange={handleChange}
                              disabled={!isEditing}
                              className="w-4 h-4 text-brand-500 border-gray-300 dark:border-slate-600 focus:ring-brand-500 bg-white dark:bg-slate-900 disabled:opacity-50"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Masculino [M]</span>
                          </label>
                          <label className={`flex items-center p-3 border border-gray-200 dark:border-slate-700 rounded-lg transition-colors flex-1 ${!isEditing ? 'bg-gray-50 cursor-not-allowed dark:bg-slate-800/50' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}>
                            <input
                              type="radio"
                              name="gen_nino"
                              value="F"
                              checked={formData.gen_nino === 'F'}
                              onChange={handleChange}
                              disabled={!isEditing}
                              className="w-4 h-4 text-brand-500 border-gray-300 dark:border-slate-600 focus:ring-brand-500 bg-white dark:bg-slate-900 disabled:opacity-50"
                            />
                            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Femenino [F]</span>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nivel de Desarrollo <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1"></span></label>
                        <div className="relative">
                          <select
                            name="niv_desa"
                            value={formData.niv_desa}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-gray-800 dark:text-white appearance-none ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-slate-800/50 dark:text-gray-400' : 'cursor-pointer'}`}
                          >
                            <option value="" disabled>Seleccionar nivel clínico...</option>
                            <option value="nivel-1">Nivel 1 - Necesita Ayuda</option>
                            <option value="nivel-2">Nivel 2 - Necesita Ayuda Notable</option>
                            <option value="nivel-3">Nivel 3 - Necesita Ayuda Muy Notable</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vincular Perfil de Sensibilidad <span className="text-xs text-gray-400 dark:text-gray-500 font-normal ml-1"></span></label>
                        <div className="relative">
                          <select
                            name="Id_sensi"
                            value={formData.Id_sensi}
                            onChange={handleChange}
                            disabled={!isEditing}
                            className={`w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-gray-800 dark:text-white appearance-none ${!isEditing ? 'bg-gray-50 text-gray-500 cursor-not-allowed dark:bg-slate-800/50 dark:text-gray-400' : 'cursor-pointer'}`}
                          >
                            <option value="" disabled>Seleccionar perfil de sensibilidad...</option>
                            <option value="hipo-auditiva">S1 - Hipo-reactividad Auditiva</option>
                            <option value="hiper-tactil">S2 - Hiper-reactividad Táctil</option>
                            <option value="mixto">S3 - Perfil Sensorial Mixto</option>
                          </select>
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pie de la Tarjeta y Botones */}
                <div className="px-6 md:px-8 py-5 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium dark:text-gray-300">Fecha de Registro en Sistema:</span> {currentTimestamp}
                  </div>
                  <div className="flex w-full md:w-auto items-center gap-3">
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedChildId) {
                            showToast("⚠️ Debes seleccionar un paciente en el menú superior primero.")
                            return
                          }
                          setIsEditing(true)
                        }}
                        className={`flex-1 md:flex-none px-6 py-2.5 font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 ${!selectedChildId ? 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-slate-700 cursor-not-allowed' : 'bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                        disabled={!selectedChildId}
                      >
                        ✏️ Editar Perfil
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="flex-1 md:flex-none px-6 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 md:flex-none px-6 py-2.5 bg-brand-500 text-white font-medium rounded-lg hover:bg-brand-600 transition-colors shadow-sm shadow-[#007BFF]/40"
                        >
                          Guardar Cambios
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </form>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mt-2 pl-2">
              <button
                onClick={() => onNavigate && onNavigate('historial')}
                className="flex items-center text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1.5 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Ver historial de sensibilidades vinculadas
              </button>
              <button
                onClick={() => onNavigate && onNavigate('manual_especialista')}
                className="flex items-center text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors group cursor-pointer"
              >
                <svg className="w-4 h-4 mr-1.5 opacity-70 group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                Consultar manual de niveles TEA
              </button>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}
