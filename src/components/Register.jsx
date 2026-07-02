import { Shield, Sparkles, UserPlus, HeartHandshake, ArrowLeft, Mail, Phone, ExternalLink } from 'lucide-react'
import funautaLogo from '../../Logo.png'

function Register({ onNavigate }) {
  return (
    <div className="w-full min-h-full bg-white dark:bg-slate-900 flex flex-col px-6 sm:px-10 lg:px-16 py-8 sm:py-12 transition-colors duration-200">
      <div className="w-full max-w-2xl mx-auto my-auto space-y-6 sm:space-y-8">
        
        {/* Header Section with Badge */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left space-y-3">
          {/* Mobile Logo Badge */}
          <div className="flex md:hidden items-center gap-3 mb-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <img src={funautaLogo} alt="Logo FUNAUTA" className="w-12 h-12 object-contain" />
            <div className="text-left">
              <span className="block text-sm font-extrabold text-brand-700 dark:text-blue-400 tracking-wider">SIAT-TEA</span>
              <span className="block text-[10px] text-gray-500 dark:text-gray-400 font-semibold uppercase">FUNAUTA</span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-400/10 border border-blue-500/20 dark:border-blue-400/20 text-blue-600 dark:text-blue-400 text-xs font-semibold tracking-wide animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Acceso Institucional Seguro
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-700 dark:text-blue-400 tracking-tight leading-tight">
            ¿Cómo ingresar a SIAT-TEA?
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm max-w-xl leading-relaxed">
            Para proteger la privacidad y el seguimiento clínico de los menores, las cuentas no son de creación pública. El acceso se gestiona de forma guiada por tu institución asociada.
          </p>
        </div>

        {/* Timeline of Steps */}
        <div className="relative pl-6 sm:pl-8 border-l-2 border-dashed border-blue-100 dark:border-slate-800 ml-4 sm:ml-5 space-y-6 sm:space-y-8 py-2">
          
          {/* Step 1 */}
          <div className="relative">
            {/* Bullet icon */}
            <div className="absolute -left-[39px] sm:-left-[47px] top-0.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold shadow-lg shadow-blue-500/30">
              1
            </div>
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
              <div className="flex items-center gap-2.5 mb-1.5">
                <Shield className="w-4 h-4 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                  Vinculación del Centro de Apoyo
                </h3>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xxs sm:text-xs leading-relaxed">
                El centro terapéutico o fundación donde asistes debe estar registrado en nuestro sistema. Tu especialista te indicará si ya lo están.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            {/* Bullet icon */}
            <div className="absolute -left-[39px] sm:-left-[47px] top-0.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold shadow-lg shadow-blue-500/30">
              2
            </div>
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
              <div className="flex items-center gap-2.5 mb-1.5">
                <UserPlus className="w-4 h-4 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                  Creación del Perfil de Representante
                </h3>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xxs sm:text-xs leading-relaxed">
                El especialista o la fundación registrará tus datos y los del niño en el sistema para que puedas acceder a toda la información de sus terapias.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="relative">
            {/* Bullet icon */}
            <div className="absolute -left-[39px] sm:-left-[47px] top-0.5 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-brand-500 text-white text-xs font-bold shadow-lg shadow-blue-500/30">
              3
            </div>
            <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group hover:-translate-y-0.5">
              <div className="flex items-center gap-2.5 mb-1.5">
                <HeartHandshake className="w-4 h-4 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                  Activación del Acceso
                </h3>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xxs sm:text-xs leading-relaxed">
                Recibirás un enlace en tu correo electrónico. Al abrirlo, podrás crear tu contraseña y empezar a usar el sistema de inmediato.
              </p>
            </div>
          </div>

        </div>

        {/* FUNAUTA Interactive Card */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-950 dark:to-blue-950 p-5 sm:p-6 rounded-2xl shadow-xl text-white relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-4 translate-y-4 pointer-events-none transition-transform group-hover:scale-110 duration-700">
            <HeartHandshake className="w-40 h-40" />
          </div>
          <div className="relative z-10 space-y-3">
            <span className="inline-block px-2.5 py-1 rounded-md bg-white/20 text-white text-xxs sm:text-xs font-bold uppercase tracking-wider">
              Familia FUNAUTA
            </span>
            <h3 className="text-base sm:text-lg font-bold leading-tight">
              ¿Te gustaría formar parte de nuestra comunidad?
            </h3>
            <p className="text-white/80 text-xxs sm:text-xs leading-relaxed max-w-lg">
              Si quieres afiliar a tu clínica o fundación al ecosistema SIAT, solicitar terapias de apoyo o recibir orientación especializada sobre el autismo, estamos listos para acompañarte.
            </p>
            
            {/* Interactive Contact Pills */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <a 
                href="mailto:contacto@funauta.org" 
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-brand-700 hover:bg-slate-100 text-xxs sm:text-xs font-bold transition-all hover:scale-105 active:scale-100 shadow-md shadow-black/10"
              >
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                contacto@funauta.org
              </a>
              <a 
                href="tel:+584123456789" 
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/25 text-white border border-white/20 text-xxs sm:text-xs font-bold transition-all hover:scale-105 active:scale-100"
              >
                <Phone className="w-3.5 h-3.5 text-blue-200" />
                +58 (412) 345-6789
              </a>
            </div>
          </div>
        </div>

        {/* Back to Login Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="w-full bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800/80 text-gray-700 dark:text-gray-300 hover:text-gray-900 border border-gray-200 dark:border-slate-800 text-xs sm:text-sm font-semibold py-2.5 sm:py-3 px-4 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Volver al Inicio de Sesión
          </button>
        </div>

      </div>
    </div>
  )
}

export default Register
