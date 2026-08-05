import { useEffect } from 'react';
import { useTourContext } from '../../context/TourContext';
import { useGlobalContext } from '../../context/GlobalState';
import { Compass, Play, X, UserCircle2 } from 'lucide-react';

const WelcomeTourModal = () => {
  const { startRoleTour, hasSeenTour, markTourAsSeen } = useTourContext();
  const { userRole, userName } = useGlobalContext();

  useEffect(() => {
    if (hasSeenTour) return;

    // Small delay to let the app render completely before showing the overlay
    const timer = setTimeout(() => {
      const overlay = document.getElementById('welcome-tour-overlay');
      if (overlay) {
        overlay.classList.remove('opacity-0', 'scale-95');
        overlay.classList.add('opacity-100', 'scale-100');
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [hasSeenTour]);

  if (hasSeenTour) return null;

  // Render role-specific descriptions
  const getRoleContent = () => {
    if (userRole === 'ADMIN_INSTITUCION') {
      return {
        title: '¡Bienvenido al Panel de Fundación!',
        desc: 'Te guiaremos a través de las métricas principales y las herramientas de gestión de especialistas, pacientes e infraestructura de tu clínica.',
        modules: [
          { label: 'Especialistas', desc: 'Gestión de personal' },
          { label: 'Asignaciones', desc: 'Control de pacientes' },
          { label: 'Infraestructura', desc: 'Métricas de sistema' }
        ]
      };
    }
    if (userRole === 'ESPECIALISTA') {
      return {
        title: '¡Bienvenido a tu Portal Clínico!',
        desc: 'Te mostraremos cómo monitorear la evolución de tus pacientes, revisar las métricas de casa y planificar rutinas efectivas.',
        modules: [
          { label: 'Pacientes', desc: 'Directorio e ingresos' },
          { label: 'Historial', desc: 'Análisis de crisis' },
          { label: 'Casa', desc: 'Diario del hogar' }
        ]
      };
    }
    return {
      title: '¡Bienvenido al Portal SIAT!',
      desc: 'Como representante, aquí podrás reportar el día a día, ver rutinas asignadas y consultar las métricas de salud en tiempo real.',
      modules: [
        { label: 'Diario', desc: 'Registro de casa' },
        { label: 'IoT', desc: 'Métricas vitales' },
        { label: 'Agenda', desc: 'Rutinas diarias' }
      ]
    };
  };

  const content = getRoleContent();

  return (
    <div
      id="welcome-tour-overlay"
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm transition-all duration-500 opacity-0 scale-95 px-4"
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#1E293B] rounded-3xl p-8 shadow-2xl border border-slate-200/50 dark:border-slate-800 relative overflow-hidden">
        {/* Glow background */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative text-center mb-7">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-brand-50 text-brand-600 dark:from-brand-900/40 dark:to-brand-800/20 dark:text-brand-400 shadow-inner">
            <Compass className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {content.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            Hola <strong className="text-brand-600 dark:text-brand-400">{userName.split(' ')[0]}</strong>. {content.desc}
          </p>
        </div>

        {/* Feature summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-8 relative">
          {content.modules.map((item) => (
            <div
              key={item.label}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-3 text-center"
            >
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                {item.label}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                {item.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 relative">
          <button
            onClick={() => {
              markTourAsSeen();
              setTimeout(() => startRoleTour(userRole), 300);
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-semibold rounded-xl py-3.5 transition-all shadow-lg shadow-brand-600/25"
          >
            <Play className="w-4 h-4 fill-white" />
            Comenzar Tutorial
          </button>

          <button
            onClick={markTourAsSeen}
            className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.98] text-slate-600 dark:text-slate-300 font-semibold rounded-xl py-3.5 transition-all"
          >
            <X className="w-4 h-4" />
            Explorar por mi cuenta
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeTourModal;
