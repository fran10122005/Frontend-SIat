import { useState } from 'react'
import funautaLogo from '../../Logo.png'
import { useGlobalContext } from '../context/GlobalState'
import api from '../api/axios';

function Login({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const { setUserRole, setUserName } = useGlobalContext()

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(email)) {
      setError('Ingrese un correo electrónico válido.')
      return
    }

    if (password.trim().length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    try {
      setIsLoading(true);
      const res = await api.post('/auth/login', {
        usu_crro: email,
        usu_clve: password
      });

      const { token, user } = res.data.data;
      localStorage.setItem('token', token);
      
      setUserName(user.nombre || 'Usuario');

      if (user.rol_codi === 'ROL_REP') {
        setUserRole('REPRESENTANTE');
        onNavigate('dashboard');
      } else if (user.rol_codi === 'ROL_ESP') {
        setUserRole('ESPECIALISTA');
        onNavigate('dashboard');
      } else if (user.rol_codi === 'ROL_ADM') {
        setUserRole('ADMIN_INSTITUCION');
        onNavigate('admin'); 
      } else {
        setError('Rol de usuario no reconocido.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full flex flex-col justify-center px-5 sm:px-8 py-6 sm:py-8 bg-white dark:bg-slate-900 transition-colors duration-200">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8 text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-brand-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-500/20 mx-auto mb-3 sm:mb-4">
            <img src={funautaLogo} alt="Logo" className="w-8 h-8 sm:w-9 sm:h-9 object-contain brightness-0 invert" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-brand-700 dark:text-blue-400">SIAT-TEA</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ingresa a tu portal de acompañamiento terapéutico</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo Electrónico</label>
            <div className="relative group">
              <input
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:bg-white dark:focus:bg-slate-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
              <button
                type="button"
                onClick={() => onNavigate('forgot')}
                className="text-sm font-medium text-brand-500 dark:text-blue-400 hover:text-brand-600 dark:hover:text-blue-300 transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative group">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full pl-4 pr-10 py-3 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:bg-white dark:focus:bg-slate-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl flex items-start animate-in slide-in-from-top-2 duration-200">
              <svg className="w-5 h-5 mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-brand-500 to-blue-600 hover:from-brand-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-brand-500/25 dark:shadow-none transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          ¿No tienes cuenta?{' '}
          <button
            type="button"
            className="font-semibold text-brand-500 dark:text-blue-400 hover:text-brand-600 dark:hover:text-blue-300 transition-colors"
            onClick={() => onNavigate('register')}
          >
            Cómo obtener acceso
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login
