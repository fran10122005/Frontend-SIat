import { useState } from 'react'
import funautaLogo from '../../Logo.png'
import { useGlobalContext } from '../context/GlobalState'
import api from '../api/axios';

function Login({ onNavigate }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
    <div className="w-full min-h-full bg-white dark:bg-slate-900 flex flex-col px-8 sm:px-16 lg:px-24 py-12 transition-colors duration-200">
      <div className="w-full max-w-md mx-auto my-auto">
        <div className="mb-10 text-center md:text-left flex flex-col items-center md:items-start">
          {/* Mobile Logo Badge */}
          <div className="flex md:hidden items-center gap-3 mb-6 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <img src={funautaLogo} alt="Logo FUNAUTA" className="w-12 h-12 object-contain" />
            <div className="text-left">
              <span className="block text-sm font-extrabold text-[#003366] dark:text-blue-400 tracking-wider">SIAT-TEA</span>
              <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">FUNAUTA</span>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#003366] dark:text-blue-400 mb-2 transition-colors">Bienvenido a SIAT-TEA</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">Ingresa a tu portal de acompañamiento terapéutico</p>
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
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/10 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
              <button 
                type="button"
                onClick={() => onNavigate('forgot')}
                className="text-sm font-medium text-[#007BFF] dark:text-blue-400 hover:text-[#0056b3] dark:hover:text-blue-300 transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none transition-all duration-200 focus:border-[#007BFF] focus:ring-4 focus:ring-[#007BFF]/10 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl flex items-start">
              <svg className="w-5 h-5 mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#007BFF] hover:bg-[#0062cc] text-white font-semibold py-3 px-4 rounded-xl shadow-[0_4px_14px_0_rgba(0,123,255,0.39)] dark:shadow-none transition-all duration-200 hover:-translate-y-[1px] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center"
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
            className="font-semibold text-[#007BFF] dark:text-blue-400 hover:text-[#0056b3] dark:hover:text-blue-300 transition-colors"
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
