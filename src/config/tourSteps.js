/**
 * tourSteps.js — Definición centralizada de todos los tutoriales interactivos de SIAT.
 * Los pasos de rol usan selectores de navegación (#tour-sidebar-*, #tour-admin-*).
 * Los tours por módulo usan selectores data-tour-* que existen en el DOM de cada página.
 * Cada paso describe con especificidad clínica, técnica y funcional el elemento destacado.
 * El contexto (TourContext) omite automáticamente los pasos cuyo elemento no
 * exista en pantalla (p. ej. modales cerrados o vistas condicionales).
 */

/* -------------------------------------------------------------------------- */
/*  1. TOURS GENERALES POR ROL (Navegación e Inducción Principal)              */
/* -------------------------------------------------------------------------- */

export const adminTourSteps = [
  {
    element: "#tour-admin-sidebar",
    popover: {
      title: "Consola de Gobierno Institucional",
      description:
        "Panel de control centralizado para la dirección clínica. Administra nóminas médicas, representantes legales, asignaciones terapéuticas, infraestructura de servidores y políticas de seguridad multi-tenant.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-admin-kpis",
    popover: {
      title: "Métricas Ejecutivas en Tiempo Real",
      description:
        "Supervisa la población activa de pacientes, altas de la semana, especialistas en servicio y volumen de incidentes severos del mes con comparativa de tendencias.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-admin-tab-especialistas",
    popover: {
      title: "Gestión de Especialistas Clínicos",
      description:
        "Acreditación de terapeutas ocupacionales, psicólogos y neuropediatras. Valida credenciales médicas MPPS, asigna especialidades y gestiona el estado de sus accesos.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-admin-tab-asignaciones",
    popover: {
      title: "Aislamiento y Asignaciones Terapéuticas",
      description:
        "Vincula especialistas con pacientes. Garantiza el principio de menor privilegio: un profesional clínico solo puede acceder a los expedientes y telemetría de los niños que tiene formalmente asignados.",
      side: "right",
      align: "center",
    },
  },
];

export const specialistTourSteps = [
  {
    element: "#tour-specialist-sidebar",
    popover: {
      title: "Portal Clínico del Especialista",
      description:
        "Bienvenido a tu estación de trabajo terapéutica. Diseñada para el seguimiento conductual, la prescripción de indicaciones, el avance de metas PEI y la biotelemetría en tiempo real.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-sidebar-dashboard",
    popover: {
      title: "Panel Clínico Principal",
      description:
        "Alterna entre el Dashboard Global (resumen de toda tu población de pacientes) y el Panel Individual del Paciente seleccionado con sus bioseñales y metas en curso.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-patients",
    popover: {
      title: "Directorio y Admisión de Pacientes",
      description:
        "Consulta expedientes asignados, filtra por nivel TEA o estado de conexión del sensor, realiza admisiones clínicas y genera invitaciones de enlace para los representantes.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-student",
    popover: {
      title: "Ficha Maestra del Paciente",
      description:
        "Expediente integral del niño: diagnóstico clínico, clasificación del espectro TEA, perfil de reactividad sensorial y datos de contacto de sus representantes legales.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-historial",
    popover: {
      title: "Historial de Evolución e Incidentes A-B-C",
      description:
        "Auditoría cronológica de crisis sensoriales, efectividad de rutinas e informes médicos detallados listos para exportar en PDF apaisado o vertical con validez institucional.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-home_analytics",
    popover: {
      title: "Análisis Cruzado en Casa",
      description:
        "Cruza los reportes del diario del hogar (sueño, ánimo, apetito, medicación) con la biotelemetría del smartwatch para evaluar el impacto del entorno familiar en la autorregulación.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-rutinas",
    popover: {
      title: "Catálogo y Reproductor de Terapias",
      description:
        "Crea terapias paso a paso con pictogramas y temporizador, reproduce sesiones guiadas en vivo y registra la cooperación del paciente (1 a 5 estrellas) vinculada a metas PEI.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-inventario",
    popover: {
      title: "Calibración IoT y Sensores Biométricos",
      description:
        "Enlace directo por Web BLE con el smartwatch del niño, calibración guiada de 15 segundos para el pulso basal en reposo y simulación de crisis para entrenamiento.",
      side: "right",
      align: "center",
    },
  },
];

export const parentTourSteps = [
  {
    element: "#tour-parent-sidebar",
    popover: {
      title: "Portal del Representante (Familia)",
      description:
        "Tu espacio para acompañar el progreso de tu niño, consultar bioseñales en vivo, mantenerte en contacto con los terapeutas y aplicar herramientas de regulación en casa.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-sidebar-dashboard",
    popover: {
      title: "Inicio y Estado en Vivo",
      description:
        "Semáforo emocional en tiempo real, resumen del día, indicaciones de la semana y botones de auxilio sensorial inmediato (SOS).",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-sensores",
    popover: {
      title: "Seguimiento Biométrico (IoT)",
      description:
        "Lecturas continuas del smartwatch del niño: pulso cardíaco (BPM), nivel de movimiento y estrés para anticipar crisis sensoriales antes de que escalen.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-agenda",
    popover: {
      title: "Día a Día (Estructuración Visual)",
      description:
        "Horario visual de actividades cotidianas y tareas terapéuticas asignadas por el especialista. Marca cada actividad completada para brindar certidumbre al niño.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-diario_hogar",
    popover: {
      title: "Diario del Hogar (Registro Diario)",
      description:
        "Fundamental para el éxito del tratamiento: registra cómo durmió, su apetito, su estado de ánimo y cualquier conducta inusual. El terapeuta lee esto antes de cada sesión.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-herramientas",
    popover: {
      title: "Kit de Apoyo Sensorial y Conductual",
      description:
        "5 herramientas interactivas: Tablero de comunicación aumentativa (AAC) con voz, Primero-Después, 12 ejercicios de regulación sensorial, Temporizador visual y Economía de fichas.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-perfil_padre",
    popover: {
      title: "Expediente del Niño y Consentimiento LOPNNA",
      description:
        "Consulta la ficha médica de tu niño, verifica el estado del consentimiento legal informado y administra el acceso rápido mediante biometría (Passkeys).",
      side: "right",
      align: "center",
    },
  },
];

/* -------------------------------------------------------------------------- */
/*  2. TOURS CONTEXTUALES DE ESPECIALISTA                                      */
/* -------------------------------------------------------------------------- */

const specialistModuleTours = {
  // DASHBOARD DEL ESPECIALISTA (Individual con paciente seleccionado o Global)
  dashboard: [
    // --- Rama A: Paciente Seleccionado ---
    {
      element: '[data-tour="sp-header"]',
      popover: {
        title: "Panel Clínico del Paciente",
        description:
          "Vista de acompañamiento focalizada. Desde aquí supervisas en tiempo real el bienestar del niño, registras ensayos clínicos y ejecutas intervenciones terapéuticas.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="sp-hero"]',
      popover: {
        title: "Ficha Rápida del Niño",
        description:
          "Identificación completa del paciente: fotografía, nivel de desarrollo TEA, edad calculada y rango basal de frecuencia cardíaca calibrado en reposo (BPM mínimo y máximo).",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="sp-incident-btn"]',
      popover: {
        title: "Registrar Incidente Conductual (Modelo A-B-C)",
        description:
          "Registra eventos clínicos bajo el modelo Antecedente (detonante sensorial o ambiental), Conducta (tipo y severidad) y Consecuencia (estrategia de regulación aplicada).",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-indicacion-btn"]',
      popover: {
        title: "Prescribir Indicación Clínica",
        description:
          "Emite pautas terapéuticas para el hogar o el aula con acuse de lectura digital. El representante la visualizará de inmediato como foco prioritario en su panel.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-rules-btn"]',
      popover: {
        title: "Umbrales Clínicos de Alerta",
        description:
          "Personaliza los límites de sobrecarga sensorial para este paciente específico: umbral de taquicardia por estrés, tiempo de persistencia y canales de notificación.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-export-pdf"]',
      popover: {
        title: "Exportar Informe Clínico",
        description:
          "Descarga un informe profesional en PDF con gráficas de evolución, resumen de bioseñales y bitácora de incidentes para entregar a la dirección o a neuropediatría.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-pei-card"]',
      popover: {
        title: "Metas PEI (Plan Educativo Individualizado)",
        description:
          "Monitoreo de objetivos SMART de autonomía, comunicación o autorregulación sensorial. Muestra el porcentaje de logro acumulado según el criterio clínico establecido.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-pei-trial"]',
      popover: {
        title: "Registro de Ensayo Logrado (+1)",
        description:
          "Durante la sesión de terapia o consulta presencial, pulsa este botón cada vez que el niño ejecute satisfactoriamente la conducta esperada para avanzar el progreso en vivo.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-abc-card"]',
      popover: {
        title: "Bitácora de Incidentes Recientes",
        description:
          "Historial cronológico de desregulaciones con código de color por severidad (Leve, Moderada o Grave), duración en minutos y estrategia terapéutica empleada.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-ble-widget"]',
      popover: {
        title: "Estado del Enlace Wearable (IoT)",
        description:
          "Supervisa la conexión Bluetooth Low Energy (BLE) con la pulsera o smartwatch del niño, nivel de batería del dispositivo y estabilidad de transmisión.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-sensory-triggers"]',
      popover: {
        title: "Detonantes Sensoriales Frecuentes",
        description:
          "Patrones detectados por el sistema a partir de las crisis registradas: sobrecarga acústica, hipersensibilidad táctil, transiciones imprevistas o fatiga visual.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-home-log"]',
      popover: {
        title: "Bitácora del Hogar (Reporte de Hoy)",
        description:
          "Información vital cargada por los padres en el Diario del Hogar: horas y calidad de sueño, estado anímico matutino, apetito y administración de medicamentos.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-feed-tabs"]',
      popover: {
        title: "Feed Clínico Unificado",
        description:
          "Alterna entre las alertas biométricas generadas automáticamente por el sensor y las indicaciones médicas prescritas con su estado de lectura por parte de la familia.",
        side: "left",
        align: "center",
      },
    },

    // --- Rama B: Vista Global (sin paciente seleccionado) ---
    {
      element: '[data-tour="sp-global-kpis"]',
      popover: {
        title: "KPIs Globales de Población",
        description:
          "Resumen ejecutivo de todos tus pacientes: niños activos bajo tu cuidado, porcentaje promedio de cumplimiento de metas PEI y alertas críticas en las últimas 24 horas.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="sp-global-charts"]',
      popover: {
        title: "Análisis Epidemiológico y Conductual",
        description:
          "Gráficos semanales con la distribución de incidentes por tipología (agresión, estereotipia, llanto, aislamiento) y la proporción de detonantes ambientales.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-global-actions"]',
      popover: {
        title: "Acciones Rápidas Globales",
        description:
          "Accesos directos para seleccionar pacientes específicos, programar rutinas de intervención o calibrar nuevo hardware biométrico.",
        side: "top",
        align: "start",
      },
    },
    {
      element: '[data-tour="sp-global-alerts"]',
      popover: {
        title: "Novedades y Alertas Críticas",
        description:
          "Feed centralizado con las alertas de crisis sensorial registradas recientemente en toda tu nómina de pacientes, ordenadas por severidad y hora.",
        side: "top",
        align: "center",
      },
    },
  ],

  // PACIENTES (PatientManagement.jsx)
  patients: [
    {
      element: '[data-tour="pm-header"]',
      popover: {
        title: "Directorio de Pacientes Asignados",
        description:
          "Nómina de niños bajo tu supervisión clínica. Aquí se gestiona la admisión de nuevos pacientes, el perfil TEA y los enlaces de activación para las familias.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="pm-search"]',
      popover: {
        title: "Búsqueda Rápida",
        description:
          "Localiza expedientes al instante por nombre, apellido o código de identificación clínica.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-filter-nivel"]',
      popover: {
        title: "Filtro por Nivel de Desarrollo TEA",
        description:
          "Filtra la lista según la clasificación clínica (Nivel 1: Apoyo leve, Nivel 2: Apoyo sustancial, Nivel 3: Apoyo muy sustancial).",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-filter-estado"]',
      popover: {
        title: "Filtro por Conexión del Wearable",
        description:
          "Identifica rápidamente qué niños tienen la pulsera conectada y transmitiendo datos biométricos en este momento.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-register"]',
      popover: {
        title: "Admisión de Nuevo Paciente",
        description:
          "Abre el formulario clínico de admisión: registra los datos de filiación, diagnóstico TEA, y genera el código de invitación LOPNNA para el representante legal.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-grid"]',
      popover: {
        title: "Tarjetas de Pacientes",
        description:
          "Cada ficha muestra la fotografía, edad cronológica, nivel TEA, estado del enlace Bluetooth y el botón para abrir su expediente clínico integral.",
        side: "top",
        align: "center",
      },
    },
  ],

  // ESTUDIANTE / FICHA CLÍNICA (StudentRecord.jsx)
  student: [
    {
      element: '[data-tour="sr-header"]',
      popover: {
        title: "Ficha Clínica del Estudiante",
        description:
          "Expediente clínico maestro. Centraliza la información diagnóstica, biométrica, legal y familiar del paciente.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="sr-identity"]',
      popover: {
        title: "Datos de Filiación e Identidad",
        description:
          "Nombre legal, fecha de nacimiento, edad calculada, género y código interno inmutable del expediente clínico.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-clinical"]',
      popover: {
        title: "Parámetros del Espectro Autista",
        description:
          "Clasificación TEA y perfil de reactividad sensorial (hiporreactivo, hiperreactivo o mixto). Estos datos calibran los algoritmos de detección de crisis de SIAT.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-links"]',
      popover: {
        title: "Vínculos Clínicos y Tutores Legales",
        description:
          "Representante legal vinculado bajo normativa LOPNNA y especialistas asignados para la intervención multidisciplinaria.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-edit"]',
      popover: {
        title: "Edición del Expediente",
        description:
          "Permite actualizar diagnósticos, observaciones clínicas o datos de contacto familiar manteniendo la trazabilidad en auditoría.",
        side: "top",
        align: "center",
      },
    },
  ],

  // HISTORIAL DE EVOLUCIÓN (HistoryProgress.jsx)
  historial: [
    {
      element: '[data-tour="hist-header"]',
      popover: {
        title: "Historial de Evolución Terapéutica",
        description:
          "Módulo de análisis longitudinal: compara la evolución de las sesiones de terapia con la bitácora de crisis conductuales registradas a lo largo del tiempo.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="hist-tabs"]',
      popover: {
        title: "Doble Pestaña de Análisis",
        description:
          "Alterna entre 'Evolución y Sesiones' (asistencia, cooperación y progreso en rutinas) y 'Bitácora A-B-C' (análisis funcional de antecedentes, conductas y consecuencias).",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hist-kpis"]',
      popover: {
        title: "Indicadores de Estabilidad",
        description:
          "Total de crisis en el período, duración promedio de desregulación en minutos y porcentaje de autorregulación exitosa lograda.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hist-export-btn"]',
      popover: {
        title: "Exportación de Informes Médicos",
        description:
          "Genera un informe consolidado en PDF o exporta la tabla completa a Excel para auditorías médicas, informes escolares o trámites legales.",
        side: "left",
        align: "center",
      },
    },
  ],

  // TERAPIAS Y ACTIVIDADES (Routines.jsx)
  rutinas: [
    {
      element: '[data-tour="rout-header"]',
      popover: {
        title: "Catálogo de Terapias y Actividades",
        description:
          "Diseño de planes terapéuticos estructurados. Cada actividad contiene pasos visuales secuenciados, materiales necesarios y autoguía con temporizador.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="rout-create-btn"]',
      popover: {
        title: "Crear Nueva Actividad Terapéutica",
        description:
          "Configura una actividad definiendo su categoría (sensorial, autonomía, motricidad), pasos ilustrados, duración sugerida y meta PEI asociada.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="rout-player"]',
      popover: {
        title: "Reproductor de Terapia en Vivo",
        description:
          "Guía paso a paso en pantalla completa con cronómetro, autoguía y evaluación al finalizar de 1 a 5 estrellas para calificar el nivel de cooperación del niño.",
        side: "top",
        align: "center",
      },
    },
  ],

  // INVENTARIO Y CALIBRACIÓN IOT (HardwareInventory.jsx)
  inventario: [
    {
      element: '[data-tour="hw-title"]',
      popover: {
        title: "Calibración IoT y Sensores Wearables",
        description:
          "Administración de biotelemetría. Conecta smartwatches y pulseras compatibles mediante Bluetooth Low Energy (BLE SIG 0x2A37).",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="hw-bpm"]',
      popover: {
        title: "Frecuencia Cardíaca en Vivo (BPM)",
        description:
          "Monitoreo de pulsaciones en tiempo real con indicador de señal y diferenciación entre pulso en reposo, estrés y sobrecarga sensorial.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-calibration-btn"]',
      popover: {
        title: "Calibración Basal de 15 Segundos",
        description:
          "Prueba guiada para registrar la frecuencia cardíaca en reposo del paciente. Esta lectura fija la línea base personalizada para calcular umbrales de alerta.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-simulation-btn"]',
      popover: {
        title: "Simulador de Crisis y Telemetría",
        description:
          "Herramienta para entornos de desarrollo y entrenamiento: simula lecturas de taquicardia o crisis sensorial para probar alertas sin requerir un sensor físico.",
        side: "top",
        align: "center",
      },
    },
  ],

  // ANÁLISIS EN CASA (HomeAnalytics.jsx)
  home_analytics: [
    {
      element: '[data-tour="ha-header"]',
      popover: {
        title: "Análisis Integral del Hogar",
        description:
          "Visualiza el impacto de los factores cotidianos (sueño, apetito y ánimo) reportados por los padres sobre el comportamiento clínico del paciente.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="ha-charts"]',
      popover: {
        title: "Correlación Multidimensional",
        description:
          "Gráficos de tendencia que revelan cómo las horas de descanso y los cambios en la alimentación influyen directamente en la aparición de crisis sensoriales.",
        side: "top",
        align: "center",
      },
    },
  ],

  // PERFIL Y CONFIGURACIÓN (UserProfile.jsx)
  profile: [
    {
      element: '[data-tour="profile-nav-tabs"]',
      popover: {
        title: "Secciones del Perfil Profesional",
        description:
          "Navega entre tus datos personales y sanitarios, configuración de seguridad, notificaciones y preferencias de interfaz.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="profile-passkeys"]',
      popover: {
        title: "Passkeys (Biometría WebAuthn / FIDO2)",
        description:
          "Configura acceso ultrarrápido sin contraseñas usando tu huella dactilar, FaceID o PIN del dispositivo, con protección criptográfica de estándar bancario y clínico.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="pref-theme"]',
      popover: {
        title: "Modos Visuales Amables con la Vista",
        description:
          "Elige entre 'Claro Confort' (suave, sin reflejos planos), 'Noche Calmante' (modo oscuro anti-fatiga visual diseñado para jornadas prolongadas) o 'Automático'.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="pref-accent"]',
      popover: {
        title: "Paleta Cromática Clínica",
        description:
          "Personaliza los colores de acento de la aplicación con 6 opciones calibradas para facilitar la ergonomía y la concentración visual.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="pref-density"]',
      popover: {
        title: "Densidad y Accesibilidad de Tipografía",
        description:
          "Ajusta el espaciado de pantalla (compacto o estándar) y el tamaño base de letra para adaptar SIAT a tus preferencias ergonómicas.",
        side: "top",
        align: "center",
      },
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  3. TOURS CONTEXTUALES DE REPRESENTANTE (PADRE / TUTOR)                    */
/* -------------------------------------------------------------------------- */

const parentModuleTours = {
  // DASHBOARD DEL REPRESENTANTE (MainDashboard.jsx)
  dashboard: [
    {
      element: '[data-tour="parent-dash-header"]',
      popover: {
        title: "Inicio del Representante",
        description:
          "Tu panel principal diario. Aquí encuentras el estado emocional de tu niño, los accesos rápidos de apoyo y el resumen de las terapias de hoy.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="parent-dash-status"]',
      popover: {
        title: "Semáforo Biométrico en Tiempo Real",
        description:
          "Indica el estado de regulación del niño (Verde: Calma, Amarillo: Alerta Sensorial, Rojo: Posible Crisis) a partir del pulso (BPM), estrés y movimiento medidos por el smartwatch.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-dash-summary"]',
      popover: {
        title: "Resumen del Día",
        description:
          "Muestra el reporte del hogar de hoy, la rutina diaria pendiente y la indicación clínica activa formulada por el especialista tratante.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-dash-focus"]',
      popover: {
        title: "Foco Clínico de la Semana",
        description:
          "Pauta terapéutica prioritaria establecida por tu especialista para trabajar en casa (por ejemplo: anticipación visual antes de salir, o ejercicios de respiración).",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-dash-sos"]',
      popover: {
        title: "Protocolo SOS Sensorial",
        description:
          "Herramientas de auxilio inmediato: activa un ejercicio guiado de respiración calmante o despliega el tablero de comunicación rápida AAC con voz.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-dash-events"]',
      popover: {
        title: "Últimos Eventos y Notificaciones",
        description:
          "Historial en vivo de avisos del smartwatch y lecturas de telemetría registradas a lo largo de la jornada.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-dash-diary-btn"]',
      popover: {
        title: "Diario de Hoy",
        description:
          "Acceso directo para registrar cómo durmió tu niño, su apetito, su ánimo y su medicación. Ayuda mucho al especialista para preparar la próxima sesión.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-dash-export"]',
      popover: {
        title: "Descargar Reporte del Día",
        description:
          "Genera un documento PDF con el resumen de bioseñales y eventos de hoy, ideal para compartirlo en consultas médicas o terapéuticas.",
        side: "bottom",
        align: "center",
      },
    },
  ],

  // SEGUIMIENTO EN VIVO (IoT)
  sensores: [
    {
      element: '[data-tour="hw-title"]',
      popover: {
        title: "Telemetría IoT en Tiempo Real",
        description:
          "Supervisión continua de bioseñales transmitidas por la pulsera inteligente del niño mediante Bluetooth o sincronización en la nube.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="hw-bpm"]',
      popover: {
        title: "Frecuencia Cardíaca (BPM)",
        description:
          "Pulsaciones por minuto en vivo contrastadas con el rango basal seguro que calibró el terapeuta. Un incremento sostenido activa una sugerencia de calma.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-stress"]',
      popover: {
        title: "Índice de Estrés Sensorial",
        description:
          "Algoritmo que evalúa la variabilidad de la frecuencia cardíaca (VFC) para detectar sobrecarga sensorial antes de que se manifieste una crisis visible.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-mov"]',
      popover: {
        title: "Nivel de Movimiento Corporal",
        description:
          "Medido a través del acelerómetro del smartwatch; permite distinguir entre actividad física normal (juego, carrera) y estereotipias motoras por desregulación.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-history"]',
      popover: {
        title: "Gráfico de Evolución de Sesión",
        description:
          "Curva continua de BPM y estrés durante la última hora para observar cómo responde el niño a diferentes estímulos de su entorno.",
        side: "top",
        align: "center",
      },
    },
  ],

  // AGENDA DÍA A DÍA (AgendaDiaria.jsx)
  agenda: [
    {
      element: '[data-tour="ag-header"]',
      popover: {
        title: "Agenda Visual Día a Día",
        description:
          "Estructurador visual de rutina. Ayuda al niño a comprender la secuencia del día y reduce la ansiedad producida por la incertidumbre.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="ag-checklist"]',
      popover: {
        title: "Checklist Interactivo",
        description:
          "Lista de tareas cotidianas y terapéuticas. Marca cada tarea con un toque al terminarla; la retroalimentación visual refuerza el logro del niño.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ag-create"]',
      popover: {
        title: "Agregar Nueva Actividad",
        description:
          "Crea una actividad personalizada para el horario del niño definiendo su hora, nombre, nivel de dificultad y apoyo visual.",
        side: "left",
        align: "center",
      },
    },
  ],

  // DIARIO DEL HOGAR (DiarioHogar.jsx)
  diario_hogar: [
    {
      element: '[data-tour="dh-header"]',
      popover: {
        title: "Diario del Hogar",
        description:
          "Registro familiar fundamental. Permite documentar los factores biológicos y ambientales que inciden en el comportamiento del niño.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="dh-sueno"]',
      popover: {
        title: "Calidad y Horas de Sueño",
        description:
          "Registra cuánto y cómo durmió tu niño anoche. El mal descanso es uno de los mayores desencadenantes de sobrecarga sensorial.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-animo"]',
      popover: {
        title: "Estado Anímico Matutino",
        description:
          "Califica el humor del niño al comenzar el día (alegre, tranquilo, irritable, ansioso) para que el especialista adapte la exigencia terapéutica.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-apetito"]',
      popover: {
        title: "Apetito y Alimentación",
        description:
          "Indica cómo fue la ingesta de alimentos hoy para monitorear selectividades alimentarias o molestias digestivas comunes.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-crisis"]',
      popover: {
        title: "Reporte de Crisis o Conductas Inusuales",
        description:
          "Si ocurrió una desregulación en casa, describe qué la detonó, cuánto duró y cómo lograron calmarlo para ajustar el plan de intervención.",
        side: "top",
        align: "center",
      },
    },
  ],

  // HERRAMIENTAS DE APOYO (Herramientas.jsx)
  herramientas: [
    {
      element: '[data-tour="ht-header"]',
      popover: {
        title: "Kit de Herramientas de Apoyo",
        description:
          "5 herramientas interactivas diseñadas específicamente para niños dentro del Espectro Autista. Selecciónalas con un toque en las pestañas superiores.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="ht-tabs"]',
      popover: {
        title: "Selector de Herramientas",
        description:
          "Alterna entre: 1. Tablero AAC (comunicación con voz), 2. Primero-Después, 3. Regulación Sensorial, 4. Temporizador Visual y 5. Economía de Fichas.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-aac"]',
      popover: {
        title: "Comunicación Aumentativa y Alternativa (AAC)",
        description:
          "Tablero de pictogramas categorizados con síntesis de voz (TTS). Permite al niño construir frases para expresar necesidades básicas, emociones y deseos.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-aac-speak"]',
      popover: {
        title: "Reproducir Frase con Voz",
        description:
          "Pronuncia en voz alta la frase estructurada con los pictogramas seleccionados por el niño o el representante.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-ft-panel"]',
      popover: {
        title: "Tablero Primero - Después",
        description:
          "Estructurador visual de contingencia conductual: 'Primero hacemos la tarea no preferida, Después recibes la recompensa o juego favorito'. Facilita enormemente las transiciones.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-sensory-grid"]',
      popover: {
        title: "12 Estrategias de Regulación Sensorial",
        description:
          "Ejercicios guiados paso a paso con voz y temporizador: respiración diafragmática, presión profunda propioceptiva, pausas vestibulares y técnicas de calma.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-timer-panel"]',
      popover: {
        title: "Temporizador Visual Circular",
        description:
          "Reloj visual con dial de color que se desvanece y alarma sonora suave. Ayuda a materializar el paso del tiempo en niños con pensamiento visual.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-econ-panel"]',
      popover: {
        title: "Economía de Fichas (Refuerzo Positivo)",
        description:
          "Sistema gamificado donde el niño acumula estrellas por completar conductas positivas y las canjea por recompensas previamente pactadas con la familia.",
        side: "top",
        align: "center",
      },
    },
  ],

  // EXPEDIENTE Y CONSENTIMIENTO (ParentProfile.jsx)
  perfil_padre: [
    {
      element: '[data-tour="pp-header"]',
      popover: {
        title: "Expediente del Niño y Filiación Legal",
        description:
          "Información clínica oficial del paciente, datos de contacto del representante y estado del consentimiento legal informado LOPNNA.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="pp-consent"]',
      popover: {
        title: "Consentimiento Legal LOPNNA (Art. 65)",
        description:
          "Estado de validación de la autorización para el tratamiento de datos de salud y telemetría de menores de edad, conforme a la legislación vigente.",
        side: "top",
        align: "center",
      },
    },
  ],

  // PERFIL Y CONFIGURACIÓN (UserProfile.jsx)
  profile: [
    {
      element: '[data-tour="profile-nav-tabs"]',
      popover: {
        title: "Configuración de tu Cuenta",
        description:
          "Administra tus datos de representante, contraseñas, métodos de autenticación rápida y preferencias visuales.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="profile-passkeys"]',
      popover: {
        title: "Acceso Rápido con Huella o Rostro (Passkeys)",
        description:
          "Registra tu huella dactilar o FaceID para ingresar a SIAT en un solo segundo sin tener que memorizar ni escribir contraseñas.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="pref-theme"]',
      popover: {
        title: "Temas Visuales Cómodos para la Vista",
        description:
          "Elige el modo 'Claro Confort' o 'Noche Calmante' (anti-fatiga visual) para navegar cómodamente a cualquier hora del día o de la noche.",
        side: "top",
        align: "center",
      },
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  4. TOURS CONTEXTUALES DE ADMINISTRADOR INSTITUCIONAL                       */
/* -------------------------------------------------------------------------- */

const adminModuleTours = {
  // DASHBOARD EJECUTIVO DE ADMINISTRACIÓN
  dashboard: [
    {
      element: '[data-tour="admin-dash-kpis"]',
      popover: {
        title: "Panel Ejecutivo de Gestión",
        description:
          "Indicadores clave de la institución: pacientes activos totales, altas registradas en la semana, especialistas en nómina y volumen de incidentes severos del mes.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="admin-dash-actions"]',
      popover: {
        title: "Accesos Rápidos Institucionales",
        description:
          "Navegación directa con un solo clic hacia la nómina de especialistas, asignación de pacientes, directorio de usuarios y ficha de tu fundación.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-dash-charts"]',
      popover: {
        title: "Carga Clínica y Distribución TEA",
        description:
          "Gráficos Recharts interactivos: analiza la carga de pacientes por terapeuta y la distribución poblacional por grado del espectro autista.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-dash-audit"]',
      popover: {
        title: "Bitácora Global de Auditoría y Seguridad",
        description:
          "Registro inmutable de todos los eventos del sistema: inicios de sesión, cambios de expediente, asignaciones y alertas clínicas para cumplimiento normativo.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-dash-export"]',
      popover: {
        title: "Exportación Ejecutiva a PDF y Excel",
        description:
          "Genera el informe mensual consolidado de gestión institucional en PDF o descarga la auditoría completa en formato Excel (.xlsx).",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-dash-schedule"]',
      popover: {
        title: "Automatización de Reportes por Correo",
        description:
          "Programa el envío automático semanal o mensual de informes de auditoría hacia los correos de la directiva institucional.",
        side: "left",
        align: "center",
      },
    },
  ],

  // GESTIÓN DE ESPECIALISTAS (EspecialistasTab.jsx)
  especialistas: [
    {
      element: '[data-tour="admin-especialistas"]',
      popover: {
        title: "Nómina de Especialistas Médicos",
        description:
          "Alta, acreditación y control de terapeutas. Incluye validación de colegiatura médica MPPS, asignación de especialidades clínicas y reset de credenciales.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-esp-subnav"]',
      popover: {
        title: "Especialistas vs Catálogo de Especialidades",
        description:
          "Alterna entre el listado del personal clínico activo y el catálogo institucional de especialidades (Terapia Ocupacional, Fonoaudiología, Psicología, Neuropediatría).",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-esp-btn-nuevo"]',
      popover: {
        title: "Acreditar Nuevo Especialista",
        description:
          "Abre el formulario para registrar un nuevo terapeuta con su número de cédula, correo institucional, especialidad y credencial profesional.",
        side: "left",
        align: "center",
      },
    },
  ],

  // DIRECTORIO DE REPRESENTANTES (RepresentantesTab.jsx)
  representantes: [
    {
      element: '[data-tour="admin-representantes"]',
      popover: {
        title: "Directorio de Representantes Legales",
        description:
          "Gestión de los padres y tutores de los pacientes. Permite validar su vinculación filial, generar códigos de invitación y auditar accesos.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-rep-search"]',
      popover: {
        title: "Búsqueda por Cédula o Nombre",
        description:
          "Localiza inmediatamente a cualquier tutor legal ingresando su número de documento de identidad o apellidos.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-rep-btn-nuevo"]',
      popover: {
        title: "Vincular Representante y Paciente",
        description:
          "Formulario de asociación familiar: registra al tutor legal y vincula a su representado bajo las disposiciones del Art. 65 de la LOPNNA.",
        side: "left",
        align: "center",
      },
    },
  ],

  // HISTORIAL CLÍNICO INSTITUCIONAL (HistorialClinicoTab.jsx)
  historial_clinico: [
    {
      element: '[data-tour="admin-historial_clinico"]',
      popover: {
        title: "Auditoría Clínica Institucional",
        description:
          "Bitácora centralizada de todos los incidentes conductuales y crisis sensoriales reportadas en la fundación, accesible para la dirección médica.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-hist-filtros"]',
      popover: {
        title: "Filtros por Paciente, Severidad y Fecha",
        description:
          "Aísla los incidentes severos o analiza el comportamiento de un paciente específico en un rango de fechas determinado.",
        side: "bottom",
        align: "center",
      },
    },
  ],

  // VÍNCULOS Y ASIGNACIONES (AsignacionesTab.jsx)
  asignaciones: [
    {
      element: '[data-tour="admin-asignaciones"]',
      popover: {
        title: "Matriz de Asignaciones Clínicas",
        description:
          "Asocia cada niño con su terapeuta principal o multidisciplinario. Define estrictamente la privacidad y los permisos de acceso a los expedientes.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-asig-btn-nuevo"]',
      popover: {
        title: "Crear Nueva Asignación",
        description:
          "Selecciona al especialista tratante y al paciente para formalizar el inicio del acompañamiento terapéutico institucional.",
        side: "left",
        align: "center",
      },
    },
  ],

  // USUARIOS DEL SISTEMA (UsuariosTab.jsx)
  usuarios: [
    {
      element: '[data-tour="admin-usuarios"]',
      popover: {
        title: "Control de Cuentas y Accesos (RBAC)",
        description:
          "Administración de usuarios: activación/suspensión de cuentas, reenvío de claves temporales y asignación de roles de seguridad.",
        side: "top",
        align: "center",
      },
    },
  ],

  // INFRAESTRUCTURA (InfraestructuraTab.jsx)
  infraestructura: [
    {
      element: '[data-tour="admin-infraestructura"]',
      popover: {
        title: "Monitor de Infraestructura y Uptime",
        description:
          "Supervisión del estado del API Core (Node.js/Express), latencia de la base de datos PostgreSQL Serverless (Neon) y conexiones WebSocket activas en tiempo real.",
        side: "top",
        align: "center",
      },
    },
  ],

  // DATOS DE LA FUNDACIÓN (CatalogosTab.jsx)
  catalogos: [
    {
      element: '[data-tour="admin-cat-institution"]',
      popover: {
        title: "Identidad Institucional de la Fundación",
        description:
          "Configura los datos fiscales, RIF, sede física, teléfonos de emergencia y membrete que aparecerán en los informes clínicos oficiales expedidos por SIAT.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-cat-edit"]',
      popover: {
        title: "Modificar Datos de la Fundación",
        description:
          "Habilita el modo de edición para actualizar el domicilio legal o datos de contacto de la institución clínica.",
        side: "top",
        align: "center",
      },
    },
  ],

  // PERFIL Y CONFIGURACIÓN (UserProfile.jsx)
  profile: [
    {
      element: '[data-tour="profile-nav-tabs"]',
      popover: {
        title: "Perfil del Administrador",
        description:
          "Administra tus credenciales institucionales, llaves criptográficas de acceso y preferencias del panel.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="profile-passkeys"]',
      popover: {
        title: "Passkeys de Seguridad para Administradores",
        description:
          "Registra llaves de seguridad físicas (FIDO2) o biometría de tu estación de trabajo para proteger la cuenta directiva contra accesos no autorizados.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="pref-theme"]',
      popover: {
        title: "Temas de Gestión Descansados",
        description:
          "Personaliza el entorno con el nuevo modo Noche Calmante (anti-fatiga visual) o el modo Claro Confort para auditorías prolongadas.",
        side: "top",
        align: "center",
      },
    },
  ],
};

/* -------------------------------------------------------------------------- */
/*  5. MAPEO Y RESOLUTOR DINÁMICO                                             */
/* -------------------------------------------------------------------------- */

const moduleTourMap = {
  ADMIN_INSTITUCION: adminModuleTours,
  ESPECIALISTA: specialistModuleTours,
  REPRESENTANTE: parentModuleTours,
};

/**
 * Resuelve la lista de pasos para un módulo y rol específicos.
 * Soporta alias como settings -> profile, global_dashboard -> dashboard
 * y normaliza variaciones del rol (p. ej. ROL_ADM -> ADMIN_INSTITUCION).
 */
export const getDynamicTourSteps = (path, role) => {
  if (!role || !path) return [];
  const normalizedRole =
    role === "ROL_ADM" || role === "ADMIN_INSTITUCION"
      ? "ADMIN_INSTITUCION"
      : role === "ROL_ESP" || role === "ESPECIALISTA"
        ? "ESPECIALISTA"
        : role === "ROL_REP" || role === "REPRESENTANTE"
          ? "REPRESENTANTE"
          : role;

  const tours = moduleTourMap[normalizedRole];
  if (!tours) return [];

  const alias =
    path === "global_dashboard"
      ? "dashboard"
      : path === "settings"
        ? "profile"
        : path;

  return tours[alias] || tours[path] || [];
};
