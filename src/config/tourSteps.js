/**
 * tourSteps.js — Definición centralizada de todos los tutoriales interactivos de SIAT.
 * Usamos los selectores CSS reales (ej. #tour-admin-kpis, #tour-sidebar-patients).
 */

export const adminTourSteps = [
  {
    element: '#tour-admin-sidebar',
    popover: {
      title: 'Menú de Navegación Admin',
      description: 'Desde aquí controlas toda la institución. Puedes gestionar especialistas, ver asignaciones, monitorear infraestructura y revisar los historiales clínicos de crisis.',
      side: 'right', align: 'start'
    }
  },
  {
    element: '#tour-admin-kpis',
    popover: {
      title: 'Panel Ejecutivo',
      description: 'Monitorea en tiempo real las altas de la última semana, cuántos incidentes severos se han registrado y el crecimiento de la plantilla de especialistas.',
      side: 'bottom', align: 'start'
    }
  },
  {
    element: '#tour-admin-tab-especialistas',
    popover: {
      title: 'Gestión de Especialistas',
      description: 'En este módulo puedes dar de alta nuevos terapeutas, resetear sus contraseñas en caso de olvido, y suspender temporalmente su acceso a la plataforma.',
      side: 'right', align: 'center'
    }
  },
  {
    element: '#tour-admin-tab-asignaciones',
    popover: {
      title: 'Vínculos Especialista-Paciente',
      description: 'Aquí estableces qué especialista atiende a qué niño. Esto define los permisos de privacidad; un especialista solo puede ver expedientes clínicos de pacientes que le has asignado aquí.',
      side: 'right', align: 'center'
    }
  }
];

export const specialistTourSteps = [
  {
    element: '#tour-specialist-sidebar',
    popover: {
      title: 'Navegación Clínica',
      description: 'Bienvenido al Portal Clínico. Utiliza este panel para navegar entre los expedientes de tus pacientes, asignar rutinas y monitorear telemetría.',
      side: 'right', align: 'start'
    }
  },
  {
    element: '#tour-sidebar-patients',
    popover: {
      title: 'Directorio de Pacientes',
      description: 'Lista completa de todos los niños bajo tu supervisión. Desde aquí puedes buscar rápidamente y usar el botón "Nuevo Registro" para generar la admisión clínica y la invitación LOPNNA al representante.',
      side: 'right', align: 'center'
    }
  },
  {
    element: '#tour-sidebar-home_analytics',
    popover: {
      title: 'Análisis de Casa (Diario)',
      description: 'Aquí visualizarás los reportes emocionales diarios que llena el representante, cruzados con eventos del IoT, dándote una visión holística de la semana del niño fuera de terapia. Requiere seleccionar un paciente primero.',
      side: 'right', align: 'center'
    }
  },
  {
    element: '#tour-sidebar-rutinas',
    popover: {
      title: 'Diseño de Rutinas',
      description: 'Módulo para planificar pictogramas y secuencias (ej. "Lavarse los dientes"). El representante las verá en su app y podrá marcar su cumplimiento para que evalúes la adherencia. Requiere seleccionar un paciente primero.',
      side: 'right', align: 'center'
    }
  }
];

export const parentTourSteps = [
  {
    element: '#tour-parent-sidebar',
    popover: {
      title: 'Portal de Representante',
      description: 'Aquí encontrarás todas las herramientas para apoyar la rutina de tu niño y mantener comunicación indirecta con los especialistas.',
      side: 'right', align: 'start'
    }
  },
  {
    element: '#tour-sidebar-sensores',
    popover: {
      title: 'Seguimiento en Vivo (IoT)',
      description: 'Módulo de telemetría. Si el paciente porta los sensores de hardware, aquí verás niveles de estrés y pulsaciones en tiempo real para predecir posibles crisis.',
      side: 'right', align: 'center'
    }
  },
  {
    element: '#tour-sidebar-diario_hogar',
    popover: {
      title: 'Diario del Hogar',
      description: 'Es de vital importancia llenar esto diariamente. Aquí reportas cómo fue la calidad de sueño del niño, su humor general y si hubo eventos inusuales. El terapeuta usa esto para guiar sus sesiones.',
      side: 'right', align: 'center'
    }
  },
  {
    element: '#tour-sidebar-agenda',
    popover: {
      title: 'Día a Día (Rutinas)',
      description: 'Las secuencias de actividades que el especialista asigne aparecerán aquí (pictogramas, tiempos). Marca la casilla cuando logren completarlas juntos.',
      side: 'right', align: 'center'
    }
  }
];

export const getDynamicTourSteps = (path, contextData) => {
  return [];
};
