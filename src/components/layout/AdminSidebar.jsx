import { useGlobalContext } from '../../context/GlobalState';
import funautaLogo from '../../assets/Logo.png';
import { LayoutDashboard, Stethoscope, Link2, LogOut, Server, Building2, Users, BookOpen } from 'lucide-react';

export default function AdminSidebar({ activeTab, setActiveTab }) {
  const { setUserRole, setSelectedChildId, setNomNino, userRole, isSidebarOpen, setIsSidebarOpen } = useGlobalContext();

  const menuItems = [
    { id: 'dashboard',    icon: LayoutDashboard, label: 'Panel Principal' },
    { id: 'especialistas', icon: Stethoscope,    label: 'Especialistas' },
    { id: 'asignaciones', icon: Link2,           label: 'Asignaciones' },
    ...(userRole === 'ADMIN_INSTITUCION' ? [
      { id: 'usuarios', icon: Users, label: 'Usuarios' },
      { id: 'infraestructura', icon: Server, label: 'Infraestructura' },
      { id: 'catalogos', icon: Building2, label: 'Mi Fundación' },
      { id: 'manual', icon: BookOpen, label: 'Manual de Usuario' }
    ] : []),
  ];

  return (
    <>
      {/* Backdrop de móvil */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-[260px] bg-gradient-to-b from-[#011C3F] via-[#023A7A] to-[#034EA1] text-white flex flex-col shrink-0 h-full shadow-2xl shadow-blue-900/20 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Cabecera - Logo integrado al gradiente */}
        <div className="h-[88px] flex items-center gap-3 px-5 border-b border-white/8">
          <img 
            src={funautaLogo} 
            alt="Logo SIAT" 
            className="w-11 h-11 object-contain shrink-0"
            style={{ 
              mixBlendMode: 'screen',
              filter: 'brightness(1.4) saturate(0.6)'
            }} 
          />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-white/50 tracking-[0.25em] uppercase leading-none">Funauta</span>
            <h1 className="text-xl font-black tracking-[0.15em] text-white leading-tight">SIAT</h1>
            <span className="text-[9px] font-medium text-emerald-400/70 tracking-[0.2em] uppercase">
              {userRole === 'ADMIN_INSTITUCION' ? 'Super Admin' : 'Fundación'}
            </span>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false); // Cerrar al hacer clic en móvil
                }}
                className={`w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-300 group ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-white/20 to-white/5 text-white font-bold shadow-lg shadow-black/10 border-l-4 border-white'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white hover:translate-x-1'
                }`}
              >
                <Icon className={`w-5 h-5 mr-3 shrink-0 transition-colors ${
                  activeTab === item.id ? 'text-white' : 'text-blue-200 group-hover:text-white'
                }`} />
                <span className="text-sm tracking-wide flex-1">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <button
            onClick={() => {
              setUserRole(null);
              setSelectedChildId(null);
              setNomNino(null);
              setIsSidebarOpen(false);
              if (window.__navigate) window.__navigate('login');
            }}
            className="w-full flex items-center px-4 py-3 rounded-xl text-left transition-all duration-300 text-rose-400/90 hover:bg-rose-500/15 hover:text-rose-300 group hover:translate-x-1"
          >
            <LogOut className="w-5 h-5 mr-3 shrink-0 group-hover:text-rose-300 transition-all duration-300 group-hover:scale-110 group-hover:-translate-x-1" />
            <span className="text-[13px] tracking-wide font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
