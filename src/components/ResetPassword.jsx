import { useState, useEffect } from 'react'
import api from '../api/axios';
import funautaLogo from '../../Logo.png'

function ResetPassword({ onNavigate }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError('Enlace inválido o expirado. Por favor solicita uno nuevo.');
    }
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!token) {
      setError('No hay token válido.');
      return;
    }

    if (password.trim().length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/reset-password', { 
        token, 
        newPassword: password 
      });
      setMessage(res.data.message || 'Contraseña actualizada correctamente.');
      // Redirigir al login despues de 3 segundos
      setTimeout(() => {
        onNavigate('login');
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'El enlace es inválido o ha expirado.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full min-h-[100dvh] bg-[#F4F7F9] dark:bg-slate-900 flex flex-col justify-center items-center px-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-slate-700">
        <div className="mb-8 text-center flex flex-col items-center">
          {/* Mobile Logo Badge */}
          <div className="flex items-center gap-3 mb-6 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <img src={funautaLogo} alt="Logo FUNAUTA" className="w-12 h-12 object-contain" />
            <div className="text-left">
              <span className="block text-sm font-extrabold text-brand-700 dark:text-blue-400 tracking-wider">SIAT-TEA</span>
              <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">FUNAUTA</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-brand-700 dark:text-blue-400 mb-2 transition-colors">Crear Nueva Contraseña</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">Ingresa tu nueva contraseña para acceder al sistema SIAT.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva Contraseña</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Contraseña</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
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
            disabled={isLoading || !token}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-4 rounded-xl shadow-button dark:shadow-none transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center"
          >
            {isLoading ? 'Actualizando...' : 'Restablecer Contraseña'}
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

export default ResetPassword
