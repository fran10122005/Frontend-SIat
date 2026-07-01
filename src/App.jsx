import { useState, useEffect } from 'react'
import { useGlobalContext } from './context/GlobalState'
import Auth from './components/Auth'
import StudentRecord from './components/StudentRecord'
import MainDashboard from './components/MainDashboard'
import Routines from './components/Routines'
import Herramientas from './components/Herramientas'
import DiarioHogar from './components/DiarioHogar'
import AgendaDiaria from './components/AgendaDiaria'
import ManualUsuarioRepresentante from './components/parent/ManualUsuarioRepresentante'
import ManualUsuarioEspecialista from './components/specialist/ManualUsuarioEspecialista'

import HistoryProgress from './components/HistoryProgress'
import PatientManagement from './components/PatientManagement'
import SpecialistDashboard from './components/SpecialistDashboard'
import AdminDashboard from './components/AdminDashboard'
import HardwareInventory from './components/HardwareInventory'
import ParentProfile from './components/ParentProfile'
import ForgotPassword from './components/ForgotPassword'
import HomeAnalytics from './components/HomeAnalytics'
import ResetPassword from './components/ResetPassword'
import RegisterRepre from './components/RegisterRepre'
import UserProfile from './components/UserProfile'
import './App.css'

export default function App() {
  const { 
    currentView, navigate, userRole, 
    isOnline, setIsOnline,
    showEmergencyGuard, setShowEmergencyGuard,
    pendingNavigation, setPendingNavigation, setCurrentView,
    setUserRole, setSelectedChildId, setNomNino
  } = useGlobalContext()

  const [showSessionExpired, setShowSessionExpired] = useState(false)

  const handleLogout = () => {
    setShowSessionExpired(false)
    setUserRole(null)
    setSelectedChildId(null)
    setNomNino(null)
    setCurrentView('login')
  }

  const handleContinueSession = () => setShowSessionExpired(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
      if (window.location.pathname.includes('/reset-password')) {
        setCurrentView('reset-password');
      } else {
        setCurrentView('register-repre');
      }
    }
  }, [setCurrentView]);

  // SISTEMA DE SEGURIDAD (RBAC): Guardia de Vistas
  const getSafeView = () => {
    const publicViews = ['login', 'register', 'forgot', 'reset-password', 'register-repre'];
    if (publicViews.includes(currentView)) return currentView;

    const role = userRole || 'GUEST';

    // Matriz estricta de permisos por rol
    const rolePermissions = {
      'ADMIN_INSTITUCION': ['admin', 'inventario', 'sensores', 'profile'],
      'ESPECIALISTA': ['dashboard', 'student', 'patients', 'rutinas', 'agenda', 'herramientas', 'inventario', 'sensores', 'historial', 'home_analytics', 'profile', 'manual_especialista'],
      'REPRESENTANTE': ['dashboard', 'rutinas', 'agenda', 'perfil_padre', 'diario_hogar', 'historial', 'profile', 'sensores', 'herramientas', 'manual_repre']
    };

    const allowedViews = rolePermissions[role] || [];
    
    if (!allowedViews.includes(currentView)) {
      // Intento de violación de seguridad: Retornar a la vista segura por defecto
      if (role === 'ADMIN_INSTITUCION') return 'admin';
      if (role === 'ESPECIALISTA') return 'dashboard';
      if (role === 'REPRESENTANTE') return 'dashboard';
      return 'login';
    }

    return currentView;
  };

  const safeView = getSafeView();

  // Si detectamos que la vista solicitada fue bloqueada, sincronizamos el estado global (corrige el localStorage)
  useEffect(() => {
    if (safeView !== currentView) {
      setCurrentView(safeView);
    }
  }, [safeView, currentView, setCurrentView]);

  const renderPage = () => {
    // Usamos safeView para garantizar que jamás se renderice un componente no autorizado
    if (safeView === 'login' || safeView === 'register') return <Auth currentView={safeView} onNavigate={navigate} />
    if (safeView === 'forgot') return <ForgotPassword onNavigate={navigate} />
    if (safeView === 'reset-password') return <ResetPassword onNavigate={navigate} />
    if (safeView === 'register-repre') return <RegisterRepre onNavigate={navigate} />
    
    if (safeView === 'admin') return <AdminDashboard onNavigate={navigate} />
    
    if (safeView === 'dashboard') {
      if (userRole === 'ESPECIALISTA') return <SpecialistDashboard onNavigate={navigate} />
      return <MainDashboard onNavigate={navigate} />
    }
    
    if (safeView === 'student') return <StudentRecord onNavigate={navigate} />
    if (safeView === 'patients') return <PatientManagement onNavigate={navigate} />
    if (safeView === 'rutinas') return <Routines onNavigate={navigate} />
    if (safeView === 'agenda') return <AgendaDiaria />
    if (safeView === 'herramientas') return <Herramientas />
    if (safeView === 'perfil_padre') return <ParentProfile />
    if (safeView === 'diario_hogar') return <DiarioHogar />
    if (safeView === 'profile') return <UserProfile />
    if (safeView === 'inventario' || safeView === 'sensores') return <HardwareInventory />
    if (safeView === 'historial') return <HistoryProgress onNavigate={navigate} />
    if (safeView === 'home_analytics') return <HomeAnalytics />
    if (safeView === 'manual_repre') return <ManualUsuarioRepresentante />
    if (safeView === 'manual_especialista') return <ManualUsuarioEspecialista />

    return <Auth currentView="login" onNavigate={navigate} />
  }

  return (
    <div className="app-shell relative">
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white py-1.5 px-4 text-center text-sm font-semibold shadow-md z-[100] flex items-center justify-center gap-2 animate-in slide-in-from-top-full duration-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3l18 18" /></svg>
          Modo Local: Guardando datos en Edge
        </div>
      )}
      {renderPage()}

      {/* Auto Logout Modal */}
      {showSessionExpired && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-blue-200 dark:border-blue-900/30 animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Inactividad Detectada</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Por políticas de seguridad clínica, tu sesión se cerrará automáticamente en 15 segundos si no hay actividad. ¿Deseas continuar?
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={handleLogout} className="px-4 py-2 font-semibold text-sm bg-gray-200 dark:bg-slate-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600 rounded-lg transition-colors">
                Cerrar Sesión
              </button>
              <button onClick={handleContinueSession} className="px-4 py-2 font-semibold text-sm bg-brand-800 text-white hover:bg-brand-900 rounded-lg shadow-sm transition-colors">
                Continuar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
