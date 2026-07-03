import { useState, useEffect } from 'react';
import Login from './Login';
import Register from './Register';
import funautaLogo from '../../assets/Logo.png';

export default function Auth({ currentView, onNavigate }) {
  const [isLogin, setIsLogin] = useState(currentView === 'login');

  useEffect(() => {
    setIsLogin(currentView === 'login' || currentView !== 'register');
  }, [currentView]);

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#F4F7F9] dark:bg-slate-900 overflow-hidden font-sans">
      {/* Mobile Layout: simple centered */}
      <div className="flex flex-col md:hidden h-[100dvh] w-full p-4 overflow-y-auto bg-gradient-to-br from-brand-500/60 to-blue-600/40 dark:from-slate-900 dark:to-slate-950">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl shadow-brand-500/10 dark:shadow-black/30 m-auto shrink-0">
          <div className="h-1.5 bg-gradient-to-r from-brand-500 via-blue-500 to-indigo-500"></div>
          {isLogin ? <Login onNavigate={onNavigate} /> : <Register onNavigate={onNavigate} />}
        </div>
      </div>

      {/* Desktop Layout: split with brand panel */}
      <div className="hidden md:flex relative w-full h-full min-h-[100dvh]">
        {/* Forms Container */}
        <div 
          className={`absolute top-0 w-1/2 h-full transition-transform duration-700 ease-in-out z-10 bg-white dark:bg-slate-900 shadow-2xl
            ${isLogin ? 'left-1/2' : 'left-0'}`}
        >
          <div className="relative w-full h-full overflow-hidden">
            {/* Login Form */}
            <div 
              className={`absolute top-0 left-0 w-full h-full overflow-y-auto flex flex-col transition-all duration-700 ease-in-out bg-white dark:bg-slate-900
                ${isLogin ? 'opacity-100 z-20 translate-x-0' : 'opacity-0 z-0 -translate-x-1/2 pointer-events-none'}`}
            >
               <Login onNavigate={onNavigate} />
            </div>
            {/* Register Form */}
            <div 
              className={`absolute top-0 left-0 w-full h-full overflow-y-auto flex flex-col transition-all duration-700 ease-in-out bg-white dark:bg-slate-900
                ${!isLogin ? 'opacity-100 z-20 translate-x-0' : 'opacity-0 z-0 translate-x-1/2 pointer-events-none'}`}
            >
               <Register onNavigate={onNavigate} />
            </div>
          </div>
        </div>

        {/* Branding Panel */}
        <div 
          className={`absolute top-0 w-1/2 h-full bg-[#003366] dark:bg-slate-950 text-white flex-col items-center justify-center p-8 lg:p-16 transition-transform duration-700 ease-in-out z-20 flex
            ${isLogin ? 'left-0' : 'left-1/2'}`}
        >
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="z-10 flex flex-col items-center text-center">
            <img 
              src={funautaLogo} 
              alt="Logo SIAT-TEA" 
              className="w-32 h-32 md:w-48 md:h-48 mb-8 drop-shadow-xl object-contain transition-transform duration-700 hover:scale-105"
            />
            <h2 className="text-3xl font-semibold tracking-tight mb-3">SIAT-TEA</h2>
            <p className="text-white/80 text-lg md:text-xl max-w-md">
              Sistema Inteligente de Acompañamiento Terapéutico
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
