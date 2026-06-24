import { useState } from 'react'
import api from '../api/axios';
import funautaLogo from '../../Logo.png'

function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      setError('Ingrese un correo electrónico válido.')
      return
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message || 'Si el correo existe, se enviará un enlace de recuperación.');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full min-h-screen bg-[#F4F7F9] dark:bg-slate-900 flex flex-col justify-center items-center px-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700">
        <div className="mb-8 text-center flex flex-col items-center">
          {/* Mobile Logo Badge */}
          <div className="flex items-center gap-3 mb-6 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <img src={funautaLogo} alt="Logo FUNAUTA" className="w-12 h-12 object-contain" />
            <div className="text-left">
              <span className="block text-sm font-extrabold text-[#003366] dark:text-blue-400 tracking-wider">SIAT-TEA</span>
              <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">FUNAUTA</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#003366] dark:text-blue-400 mb-2 transition-colors">Recuperar Contraseña</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">Ingresa tu correo y te enviaremos instrucciones para restablecer tu contraseña.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/10 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl flex items-start">
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 text-sm px-4 py-3 rounded-xl flex items-start">
              <span>{message}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#007BFF] hover:bg-[#0062cc] text-white font-semibold py-3 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(0,123,255,0.39)] dark:shadow-none transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center"
          >
            {isLoading ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button" 
            className="text-sm font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            onClick={() => onNavigate('login')}
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
