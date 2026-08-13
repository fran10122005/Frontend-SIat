/**
 * tourSteps.js — Definición centralizada de todos los tutoriales interactivos de SIAT.
 * Los pasos de rol usan selectores de navegación (#tour-sidebar-*, #tour-admin-*).
 * Los tours por módulo usan selectores data-tour-* que deben existir en el DOM
 * de cada página antes de arrancar el tour.
 * Cada paso describe UNA función concreta del módulo (guía detallada por función).
 * El contexto (TourContext) omite automáticamente los pasos cuyo elemento no
 * exista en pantalla (p. ej. modales o sesiones en vivo cerrados).
 */

/* -------------------------------------------------------------------------- */
/*  Tours de rol (guía inicial ampliada)                                       */
/* -------------------------------------------------------------------------- */

export const adminTourSteps = [
  {
    element: "#tour-admin-sidebar",
    popover: {
      title: "Menú de Navegación Admin",
      description:
        "Controla toda la institución desde aquí: especialistas, representantes, asignaciones, historial clínico, usuarios, infraestructura y datos de tu fundación.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-admin-kpis",
    popover: {
      title: "Panel Ejecutivo",
      description:
        "Monitorea en tiempo real las altas de la última semana, incidentes severos y el crecimiento de la plantilla. El KPI de alertas usa tendencias para detectar patrones de riesgo.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-admin-tab-especialistas",
    popover: {
      title: "Gestión de Especialistas",
      description:
        "Acceso rápido al módulo de terapeutas: alta de personal, especialidades, reset de contraseñas y suspensión temporal de accesos.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-admin-tab-asignaciones",
    popover: {
      title: "Vínculos Especialista-Paciente",
      description:
        "Establece qué especialista atiende a cada niño. Esto define los permisos de privacidad: un especialista solo ve expedientes de pacientes asignados aquí.",
      side: "right",
      align: "center",
    },
  },
];

export const specialistTourSteps = [
  {
    element: "#tour-specialist-sidebar",
    popover: {
      title: "Navegación Clínica",
      description:
        "Bienvenido al Portal Clínico. Usa este panel para moverte entre expedientes, historiales, rutinas y telemetría de tus pacientes.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-sidebar-dashboard",
    popover: {
      title: "Resumen Global",
      description:
        "Vista general de los pacientes a tu cargo y del estado del sistema de monitoreo.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-patients",
    popover: {
      title: "Gestión de Pacientes",
      description:
        "Directorio de todos los niños bajo tu supervisión. Aquí se hace la admisión clínica y la invitación LOPNNA al representante.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-student",
    popover: {
      title: "Perfil Clínico",
      description:
        "Ficha clínica del estudiante: datos de identidad, nivel de desarrollo TEA y perfil de sensibilidad vinculado.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-historial",
    popover: {
      title: "Historial de Evolución",
      description:
        "Reportes médicos históricos: tendencias de calma, sesiones y efectividad de las rutinas aplicadas.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-home_analytics",
    popover: {
      title: "Análisis en Casa",
      description:
        "Reportes emocionales diarios del representante cruzados con datos del wearable, para una visión holística de la semana del niño.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-rutinas",
    popover: {
      title: "Asignación de Actividades",
      description:
        "Diseña terapias con pasos estructurados y metas PEI. El representante las ejecuta en casa y marca su cumplimiento.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-inventario",
    popover: {
      title: "Calibración de Sensores",
      description:
        "Inventario y calibración del hardware de biotelemetría para establecer los umbrales de pulso en reposo de cada paciente.",
      side: "right",
      align: "center",
    },
  },
];

export const parentTourSteps = [
  {
    element: "#tour-parent-sidebar",
    popover: {
      title: "Portal de Representante",
      description:
        "Todas las herramientas para apoyar la rutina de tu niño y mantener comunicación indirecta con los especialistas.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-sidebar-dashboard",
    popover: {
      title: "Panel Principal",
      description:
        "Resumen diario de las actividades de tu niño y acceso a los módulos más usados.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-sensores",
    popover: {
      title: "Seguimiento en Vivo (IoT)",
      description:
        "Telemetría del wearable: pulso, movimiento e índice de estrés en tiempo real para anticipar posibles crisis.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-agenda",
    popover: {
      title: "Día a Día",
      description:
        "Agenda visual de hoy y las terapias que asignó el especialista. Marca cada actividad al completarla.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-diario_hogar",
    popover: {
      title: "Diario de Hogar",
      description:
        "De vital importancia: reporta a diario el ánimo, sueño, apetito y crisis del niño. El terapeuta usa esto para guiar sus sesiones.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-herramientas",
    popover: {
      title: "Herramientas de Apoyo",
      description:
        "Kit de apoyo en casa: comunicación AAC, primero-después, regulación sensorial, temporizador y economía de fichas.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-perfil_padre",
    popover: {
      title: "Expediente Clínico",
      description:
        "Consulta la información clínica de tu niño, las alertas registradas y las indicaciones del especialista.",
      side: "right",
      align: "center",
    },
  },
];

/* -------------------------------------------------------------------------- */
/*  Tours por módulo (guías contextuales función-por-función)                  */
/* -------------------------------------------------------------------------- */

const specialistModuleTours = {
  patients: [
    {
      element: '[data-tour="pm-header"]',
      popover: {
        title: "Portal Clínico de Especialistas",
        description:
          "Este es el directorio de pacientes asignados a ti. Desde aquí gestionas los ingresos clínicos y generas las invitaciones de activación para los representantes.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="pm-search"]',
      popover: {
        title: "Búsqueda por Nombre",
        description:
          "Escribe el nombre o apellido del paciente para filtrar la lista al instante. Ideal cuando manejas muchos expedientes.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-filter-nivel"]',
      popover: {
        title: "Filtrar por Nivel de Desarrollo",
        description:
          "Selecciona el nivel de desarrollo TEA para ver solo los pacientes de una clasificación específica.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-filter-estado"]',
      popover: {
        title: "Filtrar por Estado del Sensor",
        description:
          "Muestra únicamente pacientes con el wearable conectado o desconectado, para detectar rápidamente quién necesita atención.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-clear"]',
      popover: {
        title: "Limpiar Filtros",
        description:
          "Aparece cuando hay filtros activos. Un clic restablece la búsqueda, el nivel y el estado a sus valores iniciales.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-register"]',
      popover: {
        title: "Registrar Nuevo Niño",
        description:
          "Abre la admisión clínica: crea la ficha del niño y, en un solo paso, envía la invitación LOPNNA al representante.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-grid"]',
      popover: {
        title: "Tarjetas de Pacientes",
        description:
          "Cada tarjeta resume identificación, clasificación TEA y estado del sensor del niño.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-card"]',
      popover: {
        title: "Contenido de la Tarjeta",
        description:
          "La tarjeta muestra foto, nombre, edad, nivel de desarrollo TEA y si el wearable está conectado o no en tiempo real.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-manage"]',
      popover: {
        title: "Gestionar Paciente",
        description:
          "Pulsa este botón en la tarjeta para abrir la ficha clínica completa del paciente y administrar su perfil.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-pagination"]',
      popover: {
        title: "Paginación",
        description:
          "Usa las flechas para avanzar entre las páginas del directorio cuando tengas más pacientes de los que caben en pantalla.",
        side: "top",
        align: "center",
      },
    },
  ],
  student: [
    {
      element: '[data-tour="sr-header"]',
      popover: {
        title: "Ficha Clínica del Estudiante",
        description:
          "Expediente maestro del paciente. Concentra los datos de identidad y los parámetros clínicos que personalizan la intervención.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="sr-identity"]',
      popover: {
        title: "Datos de Identidad",
        description:
          "Primera sección del expediente: los datos básicos que identifican al niño dentro del sistema.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-code"]',
      popover: {
        title: "Código del Paciente",
        description:
          "Identificador interno único asignado al niño en la admisión. No es editable.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-name"]',
      popover: {
        title: "Nombre",
        description:
          "Nombres del estudiante registrados en la admisión clínica.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-lastname"]',
      popover: {
        title: "Apellidos",
        description:
          "Apellidos del estudiante. Forman parte de los datos de identidad del expediente.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-birth"]',
      popover: {
        title: "Fecha de Nacimiento",
        description:
          "Permite calcular la edad real del paciente. Influye en la interpretación de su desarrollo.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-clinical"]',
      popover: {
        title: "Parámetros Clínicos",
        description:
          "Segunda sección del expediente: los parámetros que determinan las recomendaciones y alertas del sistema.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-gender"]',
      popover: {
        title: "Género",
        description:
          "Sexo del paciente. Junto con la edad y el nivel TEA, ajusta las recomendaciones clínicas.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-level"]',
      popover: {
        title: "Nivel de Desarrollo TEA",
        description:
          "Clasificación del espectro del niño. Determina la intensidad de las alertas y el enfoque terapéutico sugerido.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-sensitivity"]',
      popover: {
        title: "Perfil de Sensibilidad",
        description:
          "Grado de sensibilidad sensorial del paciente. Se usa para interpretar las lecturas del wearable y anticipar crisis.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-links"]',
      popover: {
        title: "Vínculos del Paciente",
        description:
          "Muestra el especialista tratante y el representante legal enlazados. Aquí se reflejan las asignaciones y las invitaciones LOPNNA.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-edit"]',
      popover: {
        title: "Editar Perfil",
        description:
          "Activa el modo edición de la ficha. Los campos pasan de solo lectura a editables.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-cancel"]',
      popover: {
        title: "Cancelar",
        description:
          "Descarta los cambios realizados y vuelve a la vista de solo lectura de la ficha.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-save"]',
      popover: {
        title: "Guardar Cambios",
        description:
          "Confirma y persiste las modificaciones del expediente. Los cambios quedan registrados en el historial del paciente.",
        side: "top",
        align: "center",
      },
    },
  ],
  historial: [
    {
      element: '[data-tour="hp-header"]',
      popover: {
        title: "Reportes de Evolución Médica",
        description:
          "Análisis histórico de las sesiones y del comportamiento del paciente. Detecta tendencias y evalúa la efectividad de las rutinas aplicadas.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="hp-date-filter"]',
      popover: {
        title: "Rango de Fechas",
        description:
          "Acota el análisis a los últimos 7 días, el mes en curso o todo el historial registrado.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hp-kpis"]',
      popover: {
        title: "Indicadores Clave",
        description:
          "Promedio de calma, total de sesiones y tasa de alertas efectivas resumen la evolución del paciente de un vistazo.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="hp-chart"]',
      popover: {
        title: "Evolución del Tiempo en Calma",
        description:
          "Barras del pro_calm por fecha. Las barras azules indican valores saludables; las grises, días por debajo del umbral.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="hp-search-notes"]',
      popover: {
        title: "Buscar en Notas",
        description:
          "Escribe una palabra clave para localizar registros por su nota médica, sin necesidad de revisar el listado completo.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hp-filter-efectividad"]',
      popover: {
        title: "Filtrar por Efectividad",
        description:
          "Filtra los registros según el nivel de efectividad de la intervención (Alta, Media o Baja).",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hp-clear"]',
      popover: {
        title: "Limpiar Filtros",
        description:
          "Aparece con filtros activos y restablece la búsqueda y la efectividad en un solo clic.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="hp-table"]',
      popover: {
        title: "Registro Clínico Detallado",
        description:
          "Desglose sesión por sesión: fecha, sesiones realizadas, efectividad y notas médicas. Usa los filtros para depurar la información.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="hp-export"]',
      popover: {
        title: "Exportar PDF Médico",
        description:
          "Genera un reporte médico en PDF con los indicadores y registros filtrados, listo para el expediente institucional.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="hp-pagination"]',
      popover: {
        title: "Paginación",
        description:
          "Navega entre las páginas del registro clínico cuando el historial filtrado tenga más filas de las visibles.",
        side: "top",
        align: "center",
      },
    },
  ],
  home_analytics: [
    {
      element: '[data-tour="ha-header"]',
      popover: {
        title: "Análisis del Hogar",
        description:
          "Cruza los reportes diarios del representante con los datos del wearable para ver la semana completa del niño fuera de la clínica.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="ha-kpis"]',
      popover: {
        title: "Resumen Semanal",
        description:
          "Promedio de calma, mejor día y día con más sobrecarga dan un diagnóstico rápido del comportamiento en casa.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="ha-balance"]',
      popover: {
        title: "Balance Emocional por Día",
        description:
          "Porcentaje de tiempo en calma vs. sobrecarga por día. Haz clic en una barra para seleccionar el día y ver su detalle.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="ha-bpm"]',
      popover: {
        title: "Frecuencia Cardíaca",
        description:
          "Distribución de BPM durante el día seleccionado. Picos altos pueden correlacionarse con crisis o actividad intensa.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="ha-table"]',
      popover: {
        title: "Registro Clínico del Día",
        description:
          "Notas del representante con sueño, ánimo, apetito y desencadenantes. Úsalo para preparar la siguiente sesión.",
        side: "top",
        align: "center",
      },
    },
  ],
  rutinas: [
    {
      element: '[data-tour="rt-header"]',
      popover: {
        title: "Catálogo de Terapias",
        description:
          "Rutinas asignadas al paciente. Planifica las actividades y metas que el representante seguirá en casa.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="rt-create"]',
      popover: {
        title: "Crear Nueva Terapia",
        description:
          "Abre el constructor avanzado de rutinas para diseñar una terapia personalizada.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="rt-catalog"]',
      popover: {
        title: "Tarjetas de Terapia",
        description:
          "Cada rutina muestra categoría, duración, instrucciones y dificultad. Desde aquí la asignas o la pones en marcha.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="rt-build-steps"]',
      popover: {
        title: "Pasos Estructurados",
        description:
          "En el constructor, agrega cada paso de la terapia con su instrucción, material y soporte multimedia. Cuantos más pasos, más clara será la guía para el representante.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="rt-build-pei"]',
      popover: {
        title: "Meta PEI",
        description:
          "Define el objetivo del Plan Educativo Individualizado que persigue la rutina. Se vincula al avance del paciente.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="rt-build-generate"]',
      popover: {
        title: "Generar Terapia",
        description:
          "Guarda la rutina construida y la publica para que el representante la encuentre en su agenda.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="rt-live"]',
      popover: {
        title: "Iniciar Sesión en Vivo",
        description:
          "Arranca el monitor clínico de una rutina para guiar al representante en tiempo real mientras la ejecutan.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="rt-live-timer"]',
      popover: {
        title: "Cronómetro de Sesión",
        description:
          "Contabiliza el tiempo transcurrido de la sesión en vivo para controlar la duración de la terapia.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="rt-live-steps"]',
      popover: {
        title: "Pasos en Vivo",
        description:
          "Muestra el paso actual de la rutina con su instrucción para acompañar la ejecución paso a paso.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="rt-live-stop"]',
      popover: {
        title: "Terminar Sesión",
        description:
          "Detiene el monitoreo en vivo y abre el cierre de la sesión para registrar el resultado.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="rt-finish-rating"]',
      popover: {
        title: "Nivel de Cooperación",
        description:
          "Califica del 1 al 5 la cooperación del paciente durante la sesión. Es un insumo para el historial de evolución.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="rt-finish-notes"]',
      popover: {
        title: "Notas de la Sesión",
        description:
          "Añade observaciones clínicas sobre cómo respondió el paciente. Quedarán en la bitácora médica.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="rt-finish-save"]',
      popover: {
        title: "Guardar Bitácora",
        description:
          "Cierra la sesión y alimenta automáticamente el historial de evolución del paciente con los datos registrados.",
        side: "top",
        align: "center",
      },
    },
  ],
  inventario: [
    {
      element: '[data-tour="hw-title"]',
      popover: {
        title: "Calibración de Dispositivos",
        description:
          "Gestiona el hardware de biotelemetría asignado a los pacientes: pulseras biométricas, acelerómetros y más.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="hw-new"]',
      popover: {
        title: "Nuevo Sensor",
        description:
          "Registra un nuevo dispositivo en el inventario clínico seleccionando su tipo (pulso, movimiento, temperatura o EEG).",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-grid"]',
      popover: {
        title: "Dispositivos Clínicos",
        description:
          "Grilla con todos los sensores registrados y su estado operativo para monitorear la infraestructura de telemetría.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-card"]',
      popover: {
        title: "Tarjeta del Dispositivo",
        description:
          "Muestra el tipo de sensor, batería, señal y estado de conexión de cada dispositivo del inventario.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-calibrate"]',
      popover: {
        title: "Calibrar Sensor",
        description:
          "Toma la firma fisiológica en reposo y calcula los umbrales mín/máx que disparan alertas predictivas de crisis en el hogar.",
        side: "top",
        align: "center",
      },
    },
  ],
};

const parentModuleTours = {
  sensores: [
    {
      element: '[data-tour="hw-title"]',
      popover: {
        title: "Seguimiento en Vivo",
        description:
          "Telemetría del wearable en tiempo real: pulso, movimiento e índice de estrés para anticipar una posible crisis.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="hw-bpm"]',
      popover: {
        title: "Ritmo Cardíaco",
        description:
          "Pulsaciones por minuto en vivo, con los rangos calibrados por el especialista. Un pulso fuera de rango activa alertas.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-mov"]',
      popover: {
        title: "Movimiento",
        description:
          "Aceleración medida en G. Distingue entre reposo, juego activo y movimientos estereotípicos (stim).",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-stress"]',
      popover: {
        title: "Índice de Estrés",
        description:
          "Estimación de sobrecarga sensorial. Por encima de 75% indica crisis; entre 40% y 75%, agitación leve.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-chart"]',
      popover: {
        title: "Señal de Telemetría Continua",
        description:
          "Ventana deslizante con las muestras de BPM y estrés de los últimos minutos. Útil para detectar patrones previos a una crisis.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-sim"]',
      popover: {
        title: "Simulación (Pruebas)",
        description:
          "Botones de crisis y calma para probar la respuesta de las alertas cuando el niño no porta el wearable.",
        side: "left",
        align: "center",
      },
    },
  ],
  agenda: [
    {
      element: '[data-tour="ag-header"]',
      popover: {
        title: "Día a Día (Agenda y Terapias)",
        description:
          "El cronograma visual de hoy y las guías clínicas que el especialista asignó, en un solo lugar.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="ag-focus"]',
      popover: {
        title: "Foco Clínico Semanal",
        description:
          "La meta de la semana asignada por el especialista. Aquí ves qué habilidades se están trabajando.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="ag-report"]',
      popover: {
        title: "Reportar Avance de Hoy",
        description:
          "Registra cuánto avanzó tu niño en el foco semanal. Este reporte se envía al especialista para su evaluación.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="ag-checklist"]',
      popover: {
        title: "Agenda Visual de Hoy",
        description:
          "Actividades con pictogramas organizadas para el día. Tocando cada tarea se guarda el cumplimiento.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="ag-task"]',
      popover: {
        title: "Marcar Actividad Completada",
        description:
          "Toca cada actividad de la agenda al finalizarla. El avance queda registrado y el especialista lo evalúa.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="ag-catalog"]',
      popover: {
        title: "Catálogo de Terapias",
        description:
          "Rutinas diseñadas por el especialista para ejecutar en casa, con su paso a paso clínico.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="ag-live"]',
      popover: {
        title: "Iniciar Sesión en Vivo",
        description:
          "Arranca una terapia guiada en vivo, con el paso a paso clínico que el especialista monitorea en tiempo real.",
        side: "left",
        align: "center",
      },
    },
  ],
  diario_hogar: [
    {
      element: '[data-tour="dh-header"]',
      popover: {
        title: "Diario de Hogar",
        description:
          "Reporte diario del estado del niño. Esta información es la base de las decisiones del terapeuta.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="dh-stats"]',
      popover: {
        title: "Resumen de Registros",
        description:
          "Total de reportes, último ánimo, crisis acumuladas y racha de días consecutivos. Verifica tu constancia.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-form"]',
      popover: {
        title: "Registrar Nuevo Reporte",
        description:
          "Formulario diario del estado del niño. ¡Es vital llenarlo cada día!",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-date"]',
      popover: {
        title: "Fecha del Reporte",
        description:
          "Por defecto es hoy. Puedes cambiarla para registrar un día anterior que no se haya completado.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-mood"]',
      popover: {
        title: "Ánimo del Día",
        description:
          "Selecciona el ánimo general del niño: feliz, tranquilo, irritable, etc. Es el dato principal del reporte.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-crisis"]',
      popover: {
        title: "Crisis de Sobrecarga",
        description:
          "Indica si hubo crisis sensorial hoy y con qué intensidad. Un clic es suficiente; los detalles van en las notas.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-positive"]',
      popover: {
        title: "Algo Positivo",
        description:
          "Escribe un logro o momento agradable del niño. Refuerza el enfoque positivo del tratamiento.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-extra"]',
      popover: {
        title: "Más Detalles",
        description:
          "Despliega campos opcionales: sueño, apetito, terapia y desencadenantes. Úsalos para enriquecer el reporte.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-save"]',
      popover: {
        title: "Guardar Reporte",
        description:
          'Envía el reporte del día. Al instante alimenta el "Análisis del Hogar" que revisa el especialista.',
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-filters"]',
      popover: {
        title: "Filtros del Historial",
        description:
          "Filtra el historial por fechas, ánimo o solo crisis para revisar períodos específicos.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-history"]',
      popover: {
        title: "Historial de Diario",
        description:
          "Todos los reportes guardados en orden cronológico. Cada uno alimenta el análisis del especialista.",
        side: "left",
        align: "center",
      },
    },
  ],
  herramientas: [
    {
      element: '[data-tour="ht-header"]',
      popover: {
        title: "Herramientas de Apoyo",
        description:
          "Kit de herramientas visuales para el día a día en casa: comunicación, transiciones, regulación sensorial y refuerzo positivo.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="ht-tabs"]',
      popover: {
        title: "Pestañas de Herramientas",
        description:
          "Comunicación (AAC), Primero-Después, Regulación Sensorial, Temporizador y Economía de Fichas. Cambia de herramienta con un toque.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-aac"]',
      popover: {
        title: "Comunicación Aumentativa (AAC)",
        description:
          "Construye frases con pictogramas para que el dispositivo las pronuncie. El niño también puede usarla directamente.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-aac-grid"]',
      popover: {
        title: "Tablero de Pictogramas",
        description:
          "Cuadrícula de pictogramas con imagen y texto. Toca uno para agregarlo a la frase que se va a decir.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-aac-search"]',
      popover: {
        title: "Buscar Pictograma",
        description:
          "Escribe una palabra para filtrar los pictogramas del tablero y encontrar el símbolo exacto más rápido.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-aac-create"]',
      popover: {
        title: "Crear Pictograma Propio",
        description:
          "Agrega pictogramas personalizados (palabras, fotos o personas) para adaptar la comunicación al vocabulario del niño.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-aac-speak"]',
      popover: {
        title: "Hablar Frase",
        description:
          "Pronuncia en voz alta la frase construida con los pictogramas seleccionados.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-aac-clear"]',
      popover: {
        title: "Limpiar Frase",
        description:
          "Vacía la frase armada para empezar de nuevo con una nueva combinación de pictogramas.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-ft-panel"]',
      popover: {
        title: "Primero-Después",
        description:
          "Secuencia visual de dos tareas: la actividad obligatoria primero y la recompensa después. Reduce la resistencia al cambio.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-ft-complete"]',
      popover: {
        title: "Completar Actividad",
        description:
          'Marca la actividad "Primero" como terminada para mostrar visualmente que ahora toca la recompensa "Después".',
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-sensory-grid"]',
      popover: {
        title: "Regulación Sensorial",
        description:
          "Selecciona ejercicios o recursos sensoriales (presión, texturas, movimiento) para calmar al niño en momentos de sobrecarga.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-timer-panel"]',
      popover: {
        title: "Temporizador Visual",
        description:
          "Cuenta regresiva con apoyo visual para transiciones y actividades con límite de tiempo. Ayuda a anticipar el cambio de actividad.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-econ-panel"]',
      popover: {
        title: "Economía de Fichas",
        description:
          "Sistema de refuerzo positivo: el niño acumula fichas por conductas deseadas y las canjea por recompensas.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-econ-balance"]',
      popover: {
        title: "Saldo de Fichas",
        description:
          "Muestra cuántas fichas tiene acumuladas el niño y el progreso hacia la recompensa establecida.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-econ-earn"]',
      popover: {
        title: "Ganar Ficha",
        description:
          "Pulsa este botón para entregar una ficha cuando el niño complete la conducta esperada.",
        side: "top",
        align: "center",
      },
    },
  ],
  perfil_padre: [
    {
      element: '[data-tour="pp-header"]',
      popover: {
        title: "Expediente Clínico",
        description:
          "Consulta la información clínica de tu niño: datos de identidad, nivel TEA, perfil sensorial y especialista asignado.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="pp-tabs"]',
      popover: {
        title: "Secciones del Expediente",
        description:
          "Información del perfil, registro de alertas e indicaciones clínicas del especialista. Cambia de pestaña para consultar cada sección.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="pp-perfil"]',
      popover: {
        title: "Datos Clínicos Registrados",
        description:
          "Información de solo lectura. Cualquier corrección debe solicitarse al especialista médico.",
        side: "top",
        align: "center",
      },
    },
  ],
};

const adminModuleTours = {
  especialistas: [
    {
      element: '[data-tour="admin-especialistas"]',
      popover: {
        title: "Gestión de Especialistas",
        description:
          "Da de alta terapeutas, administra sus especialidades, resetea contraseñas y suspende accesos desde esta vista.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-esp-subnav"]',
      popover: {
        title: "Sub-módulos",
        description:
          "Cambia entre dos vistas: la nómina de Especialistas y el catálogo de Especialidades médicas.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-esp-register-btn"]',
      popover: {
        title: "Acreditación de Nuevo Especialista",
        description:
          'Pulsa "Nuevo Especialista" para abrir la ventana de alta: cédula, correo corporativo, nombres, apellidos, teléfono, licencia médica, especialidad, institución y sexo. Pulsa "Registrar Especialista" al completarlo.',
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-esp-directory"]',
      popover: {
        title: "Nómina Médica",
        description:
          "Directorio de especialistas con búsqueda, filtros (especialidad, estado, género, fechas) y acciones por fila: Editar, Reset Pass y Activar/Desactivar. Incluye exportación PDF/Excel.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-esp-catalog"]',
      popover: {
        title: "Catálogo de Especialidades",
        description:
          "Pulsa 'Añadir Especialidad' para registrar una nueva (denominación y perfil clínico) y administra el catálogo base con acciones Editar, Archivar o Restaurar.",
        side: "top",
        align: "center",
      },
    },
  ],
  representantes: [
    {
      element: '[data-tour="admin-representantes"]',
      popover: {
        title: "Representantes",
        description:
          "Consulta los representantes legales registrados, los enlaces de activación generados para cada niño y su estado.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-rep-search"]',
      popover: {
        title: "Búsqueda y Filtro",
        description:
          "Busca representantes por nombre o correo y filtra por estado (activo/inactivo) para localizar un registro específico.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-rep-register"]',
      popover: {
        title: "Registrar Nuevo Niño",
        description:
          "Abre el registro de un nuevo paciente junto con su representante legal, generando la invitación de activación.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-rep-table"]',
      popover: {
        title: "Tabla de Representantes",
        description:
          "Cada fila muestra el representante, su contacto y estado. Usa las acciones de la fila para resetear la contraseña o activar/desactivar la cuenta.",
        side: "top",
        align: "center",
      },
    },
  ],
  historial_clinico: [
    {
      element: '[data-tour="admin-historial_clinico"]',
      popover: {
        title: "Historial Clínico",
        description:
          "Incidentes y crisis registradas en toda la institución, con detalle por paciente y tendencias.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-hc-kpis"]',
      popover: {
        title: "Métricas Clínicas",
        description:
          "Total de eventos, crisis severas y efectividad de la intervención a nivel institucional en un vistazo.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-hc-filters"]',
      popover: {
        title: "Filtros y Exportación",
        description:
          "Busca por paciente, especialista o síntoma, filtra por tipo de evento y rango de fechas, y exporta a PDF o Excel.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-hc-table"]',
      popover: {
        title: "Registro Clínico e Incidentes",
        description:
          "Listado detallado de cada evento institucional con su severidad y tratamiento aplicado.",
        side: "top",
        align: "center",
      },
    },
  ],
  asignaciones: [
    {
      element: '[data-tour="admin-asignaciones"]',
      popover: {
        title: "Asignaciones Especialista-Paciente",
        description:
          "Vincula qué especialista atiende a cada niño. Esto define los permisos de privacidad del expediente clínico.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-asg-form-btn"]',
      popover: {
        title: "Asignar Paciente a Especialista",
        description:
          'Pulsa "Asignar" para abrir la ventana. Selecciona el paciente y el especialista tratante, y pulsa "Crear Asignación" para establecer el vínculo clínico.',
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-asg-filters"]',
      popover: {
        title: "Filtros de Asignaciones",
        description:
          "Busca por paciente o especialista, filtra por estado y por fechas de ingreso para depurar la lista.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-asg-table"]',
      popover: {
        title: "Casos Clínicos",
        description:
          "Tabla de vínculos activos con exportación PDF/Excel. Cada fila permite activar o inactivar la asignación.",
        side: "top",
        align: "center",
      },
    },
  ],
  usuarios: [
    {
      element: '[data-tour="admin-usuarios"]',
      popover: {
        title: "Usuarios del Sistema",
        description:
          "Administra las cuentas de acceso de toda la institución: activa o suspende usuarios y exporta el listado.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-usr-filters"]',
      popover: {
        title: "Búsqueda y Filtros",
        description:
          "Busca por nombre o correo, filtra por rol (administrador, especialista, representante) y por rango de fechas de creación.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-usr-status"]',
      popover: {
        title: "Tabs por Estado",
        description:
          "Pestañas con contadores para ver todos los usuarios, solo activos o solo suspendidos.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-usr-table"]',
      popover: {
        title: "Cuentas de Acceso",
        description:
          "Listado de usuarios con su rol y estado, acciones de activar/suspender por fila y exportación PDF/Excel.",
        side: "top",
        align: "center",
      },
    },
  ],
  infraestructura: [
    {
      element: '[data-tour="admin-infraestructura"]',
      popover: {
        title: "Infraestructura",
        description:
          "Estado de la API, base de datos, conexiones WebSocket y versión del sistema, con historial de uptime.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-infra-cards"]',
      popover: {
        title: "Estado de los Servicios",
        description:
          "Cuatro indicadores en tiempo real: API Core (uptime), Base de Datos (latencia), WebSocket (clientes conectados) y Versión de la plataforma.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-infra-chart"]',
      popover: {
        title: "Latencia de Red",
        description:
          "Evolución de la latencia de las últimas 24 horas. Detecta degradaciones en la transmisión de datos biométricos.",
        side: "top",
        align: "center",
      },
    },
  ],
  catalogos: [
    {
      element: '[data-tour="admin-catalogos"]',
      popover: {
        title: "Mi Fundación",
        description:
          "Datos de la institución y configuración general del centro.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-cat-institution"]',
      popover: {
        title: "Configuración de la Fundación",
        description:
          "Datos registrados de la institución: RIF, nombre, dirección, teléfono, correo, sitio web y contacto principal.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-cat-edit"]',
      popover: {
        title: "Habilitar Edición",
        description:
          "Activa el lápiz para editar los campos de la fundación. Mientras está activo, los campos se vuelven editables.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-cat-save"]',
      popover: {
        title: "Guardar Cambios",
        description:
          "Confirma las modificaciones de los datos institucionales y las envía al servidor.",
        side: "top",
        align: "center",
      },
    },
  ],
};

const moduleTourMap = {
  ADMIN_INSTITUCION: adminModuleTours,
  ESPECIALISTA: specialistModuleTours,
  REPRESENTANTE: parentModuleTours,
};

export const getDynamicTourSteps = (path, role) => {
  if (!role || !path) return [];
  const tours = moduleTourMap[role];
  if (!tours) return [];
  return tours[path] || [];
};
