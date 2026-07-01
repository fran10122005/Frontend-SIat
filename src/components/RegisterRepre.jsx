import { useState, useEffect } from 'react'
import funautaLogo from '../../Logo.png'
import { useGlobalContext } from '../context/GlobalState'
import api from '../api/axios'
import { KeyRound, Phone, UserCheck, AlertCircle } from 'lucide-react'

export default function RegisterRepre({ onNavigate }) {
  const { setUserRole, setUserName, setSelectedChildId, setNomNino, showToast } = useGlobalContext()
  const [token, setToken] = useState('')
  const [invData, setInvData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form Fields
  const [password, setPassword] = useState('')
  const [relation, setRelation] = useState('Madre')
  const [phone, setPhone] = useState('')

  useEffect(() => {
    // Obtener token del query string de la URL
    const params = new URLSearchParams(window.location.search)
    const tok = params.get('token')
    if (!tok) {
      setError('Enlace inválido. Se requiere un token de invitación válido para completar el registro.')
      setLoading(false)
      return
    }
    setToken(tok)
    validateToken(tok)
  }, [])

  const validateToken = async (tok) => {
    try {
      const res = await api.get(`/auth/invitation-details?token=${tok}`)
      setInvData(res.data.data)
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'El token de invitación es inválido, ha expirado o ya ha sido completado.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.trim().length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post('/auth/complete-invitation', {
        token,
        usu_clve: password,
        rep_rela: relation,
        rep_telf: phone
      })

      const { token: sessionToken, user } = res.data.data
      localStorage.setItem('token', sessionToken)

      // Establecer estados globales
      setUserName(user.nombre || 'Representante')
      setUserRole('REPRESENTANTE')
      
      // Intentar refrescar la información del niño en el contexto
      showToast('🎉 Cuenta activada correctamente. ¡Bienvenido a SIAT!')
      
      // Forzar recarga tras registrarse
      window.location.href = '/'
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.error || 'Error al completar el registro. Intente nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card flex flex-col items-center justify-center py-12 space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1e40af]"></div>
          <p className="text-slate-500 text-sm font-semibold">Validando invitación clínica...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="login-page">
        <div className="login-card space-y-6">
          <div className="login-brand">
            <div className="brand-icon">
              <img src={funautaLogo} alt="Logo" className="brand-logo" />
            </div>
            <div className="brand-texts">
              <span className="brand-title">SIAT</span>
              <span className="brand-subtitle">Fundación Una Luz Para El Autismo</span>
            </div>
          </div>
          
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border-l-4 border-rose-500 text-rose-700 dark:text-rose-400 rounded-lg flex gap-3 text-sm leading-relaxed">
            <AlertCircle className="w-6 h-6 shrink-0 text-rose-500" />
            <div>
              <strong className="font-bold">Error de Registro:</strong>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          </div>

          <button onClick={() => onNavigate('login')} className="login-button">
            Volver al Inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="brand-icon">
            <img src={funautaLogo} alt="Logo" className="brand-logo" />
          </div>
          <div className="brand-texts">
            <span className="brand-title">SIAT</span>
            <span className="brand-subtitle">Invitación Clínica</span>
          </div>
        </div>

        {/* Copy Text */}
        <div className="login-copy">
          <h1 className="text-xl font-bold">Completar Registro</h1>
          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
            Hola <strong>{invData?.rep_nomb} {invData?.rep_apel}</strong>. Has sido invitado por la Fundación para monitorear el progreso terapéutico y constante fisiológica de tu hijo(a) <strong>{invData?.nin_nomb} {invData?.nin_apel}</strong>.
          </p>
        </div>

        {/* Complete Registration Form */}
        <form onSubmit={handleSubmit} className="login-form">
          
          <div className="field-group">
            <span>Contraseña de Acceso</span>
            <div className="field-wrapper">
              <div className="field-icon">
                <KeyRound className="w-5 h-5" />
              </div>
              <input
                required
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="field-group">
              <span>Relación / Parentesco</span>
              <div className="field-wrapper">
                <div className="field-icon">
                  <UserCheck className="w-5 h-5" />
                </div>
                <select
                  value={relation}
                  onChange={e => setRelation(e.target.value)}
                  className="cursor-pointer"
                >
                  <option value="Madre">Madre</option>
                  <option value="Padre">Padre</option>
                  <option value="Abuelo/a">Abuelo/a</option>
                  <option value="Tío/a">Tío/a</option>
                  <option value="Representante Legal">Representante</option>
                </select>
              </div>
            </div>

            <div className="field-group">
              <span>Teléfono de Contacto</span>
              <div className="field-wrapper">
                <div className="field-icon">
                  <Phone className="w-5 h-5" />
                </div>
                <input
                  required
                  type="tel"
                  placeholder="Ej. 04140000000"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {error && <p className="form-error">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="login-button"
          >
            {submitting ? 'Guardando Registro...' : 'Completar Registro e Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
