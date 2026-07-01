import React from 'react'
import { useGlobalContext } from '../context/GlobalState'
import { Sun, Moon, Menu } from 'lucide-react'
import NotificationBell from './NotificationBell'

export default function Topbar() {
  const { userRole, userName, setCurrentView, isSidebarOpen, setIsSidebarOpen, isDark, toggleTheme } = useGlobalContext()

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800/60 bg-white/80 dark:bg-[#0F172A]/80 px-6 backdrop-blur-md transition-colors duration-200">
      {/* Botón menú hamburguesa en móvil */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="flex md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
        aria-label="Abrir Menú"
      >
        <Menu className="w-5.5 h-5.5" />
      </button>

      {/* Contenedor derecho de acciones */}
      <div className="flex items-center gap-4 ml-auto">
        <NotificationBell />
        <button 
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          aria-label="Toggle Dark Mode"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <div onClick={() => setCurrentView('profile')} className="flex items-center gap-3 cursor-pointer p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors pl-4 border-l border-slate-200 dark:border-slate-700">
          <div className="flex flex-col items-end hidden sm:flex">
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {userName || (userRole === 'ESPECIALISTA' ? 'Especialista' : (userRole === 'ADMIN_INSTITUCION' || userRole === 'ROL_ADM' ? 'Administrador' : 'Representante'))}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {userRole === 'ESPECIALISTA' ? 'Staff Clínico' : (userRole === 'ADMIN_INSTITUCION' || userRole === 'ROL_ADM' ? 'Administración' : 'Representante Legal')}
            </span>
          </div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm ring-2 ring-white dark:ring-slate-800 ${userRole === 'ESPECIALISTA' ? 'bg-indigo-600' : (userRole === 'ADMIN_INSTITUCION' ? 'bg-slate-700' : 'bg-blue-600')}`}>
            {userName ? userName.replace('Dra. ', '').replace('Dr. ', '').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase() : (userRole === 'ESPECIALISTA' ? 'ES' : (userRole === 'ADMIN_INSTITUCION' ? 'AD' : 'US'))}
          </div>
        </div>
      </div>
    </header>
  )
}
