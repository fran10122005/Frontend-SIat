/**
 * tourSteps.js — Definición centralizada de todos los tutoriales interactivos de SIAT.
 * Los pasos de rol usan selectores de navegación (#tour-sidebar-*, #tour-admin-*).
 * Los tours por módulo usan selectores data-tour-* que existen en el DOM de cada página.
 * Cada paso sigue una estructura de alta eficiencia:
 *  🎯 Propósito: Qué control o información presenta el elemento.
 *  ⚡ Acción: Qué debe pulsar o seleccionar el usuario.
 *  💡 Clave: Beneficio clínico, operativo o recomendación práctica.
 * El contexto (TourContext) omite automáticamente pasos de elementos no visibles.
 */

/* -------------------------------------------------------------------------- */
/*  1. TOURS GENERALES POR ROL (Navegación e Inducción Principal)              */
/* -------------------------------------------------------------------------- */

export const adminTourSteps = [
  {
    element: "#tour-admin-sidebar",
    popover: {
      title: "🏛️ Gobierno Institucional",
      description:
        "🎯 Propósito: Barra de gestión central para dirección y administración clínica.\n⚡ Acción: Navega entre nómina médica, representantes legales, asignaciones terapéuticas y auditoría.\n💡 Clave: Toda modificación queda registrada para cumplimiento normativo LOPNNA.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-admin-kpis",
    popover: {
      title: "📊 Métricas Ejecutivas en Tiempo Real",
      description:
        "🎯 Propósito: Supervisión integral de la carga clínica y el pulso institucional.\n⚡ Acción: Observa pacientes activos, altas de la semana, especialistas en servicio y crisis del mes.\n💡 Clave: Compara las tendencias mensuales para planificar turnos y recursos.",
      side: "bottom",
      align: "start",
    },
  },
  {
    element: "#tour-admin-tab-especialistas",
    popover: {
      title: "🩺 Nómina de Especialistas Clínicos",
      description:
        "🎯 Propósito: Acreditación y control de terapeutas ocupacionales, psicólogos y neuropediatras.\n⚡ Acción: Pulsa aquí para dar de alta terapeutas, validar colegiatura MPPS y asignar especialidades.\n💡 Clave: Solo el personal activo y acreditado puede acceder a expedientes de pacientes.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-admin-tab-asignaciones",
    popover: {
      title: "🔗 Matriz de Asignaciones Clínicas",
      description:
        "🎯 Propósito: Vincula formalmente a cada niño con sus terapeutas tratantes.\n⚡ Acción: Crea o modifica asignaciones para iniciar el acompañamiento terapéutico.\n💡 Clave: Principio de menor privilegio: ningún especialista puede ver pacientes fuera de su nómina asignada.",
      side: "right",
      align: "center",
    },
  },
];

export const specialistTourSteps = [
  {
    element: "#tour-specialist-sidebar",
    popover: {
      title: "🩺 Estación de Trabajo Terapéutica",
      description:
        "🎯 Propósito: Tu centro clínico para seguimiento conductual, metas PEI y bioseñales en vivo.\n⚡ Acción: Explora las secciones laterales para atender pacientes, programar terapias o calibrar sensores.\n💡 Clave: Diseñado para registrar datos rápidamente durante la sesión con el niño.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-sidebar-dashboard",
    popover: {
      title: "📊 Panel Clínico del Paciente",
      description:
        "🎯 Propósito: Centro de supervisión directa del niño en consulta.\n⚡ Acción: Observa las pulsaciones en vivo, registra avances en metas PEI y documenta desregulaciones.\n💡 Clave: Cambia de paciente en la barra superior cuando atiendas a otro niño.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-patients",
    popover: {
      title: "👥 Selección y Admisión de Pacientes",
      description:
        "🎯 Propósito: Nómina de niños asignados bajo tu supervisión profesional.\n⚡ Acción: Busca por nombre, filtra por nivel TEA, verifica conexión del reloj o admite un nuevo paciente.\n💡 Clave: Genera invitaciones digitales para que los representantes activen su acceso familiar.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-student",
    popover: {
      title: "📋 Ficha Maestra del Paciente",
      description:
        "🎯 Propósito: Expediente clínico integral del niño con diagnóstico y reactividad sensorial.\n⚡ Acción: Consulta diagnósticos TEA, antecedentes familiares y datos de contacto del tutor legal.\n💡 Clave: La base fisiológica para personalizar los umbrales de alerta del smartwatch.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-historial",
    popover: {
      title: "📈 Evolución Clínica y Bitácora A-B-C",
      description:
        "🎯 Propósito: Auditoría cronológica de crisis y efectividad de las intervenciones.\n⚡ Acción: Revisa sesiones anteriores, analiza detonantes recurrentes y exporta informes en PDF.\n💡 Clave: Informes estructurados con validez médica para neuropediatras y escuelas.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-home_analytics",
    popover: {
      title: "🏡 Análisis Cruzado con el Hogar",
      description:
        "🎯 Propósito: Correlaciona el descanso, alimentación y estado anímico en casa con la biotelemetría.\n⚡ Acción: Revisa cómo influye una noche de mal sueño en las desregulaciones del día.\n💡 Clave: Integra a la familia como aliada directa del proceso terapéutico.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-rutinas",
    popover: {
      title: "🧩 Terapias Guiadas y Pictogramas",
      description:
        "🎯 Propósito: Catálogo de actividades terapéuticas secuenciadas paso a paso.\n⚡ Acción: Ejecuta sesiones guiadas en pantalla completa y califica la cooperación (1-5 estrellas).\n💡 Clave: Cada actividad completada abona progreso verificable a las metas PEI.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-inventario",
    popover: {
      title: "📡 Calibración de Sensores IoT",
      description:
        "🎯 Propósito: Conexión Bluetooth Low Energy (BLE) y calibración de pulsaciones basales.\n⚡ Acción: Enlaza el reloj del niño, realiza el test guiado de 15 segundos y ajusta los límites BPM.\n💡 Clave: Anticipa desregulaciones antes de que se manifiesten físicamente.",
      side: "right",
      align: "center",
    },
  },
];

export const parentTourSteps = [
  {
    element: "#tour-parent-sidebar",
    popover: {
      title: "🏠 Espacio de Apoyo Familiar",
      description:
        "🎯 Propósito: Tu centro de acompañamiento para cuidar el bienestar de tu niño todos los días.\n⚡ Acción: Consulta el estado en vivo, llena el diario de sueño y utiliza herramientas de calma.\n💡 Clave: Comunicación fluida y en tiempo real con el equipo de especialistas.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "#tour-sidebar-dashboard",
    popover: {
      title: "🚦 Semáforo Emocional en Vivo",
      description:
        "🎯 Propósito: Conoce si tu niño está en calma, alerta o en sobrecarga a partir de su pulso.\n⚡ Acción: Observa el color del semáforo y revisa las pautas prioritarias enviadas por el especialista.\n💡 Clave: Cuenta con botón SOS para activar ejercicios de respiración guiada de inmediato.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-sensores",
    popover: {
      title: "💓 Pulso y Estrés en Tiempo Real",
      description:
        "🎯 Propósito: Lecturas biométricas continuas enviadas por la pulsera inteligente del niño.\n⚡ Acción: Verifica las pulsaciones (BPM) y el nivel de estrés para anticiparte a una crisis.\n💡 Clave: Si el pulso sube sin actividad física, aplica una pausa de respiración o calma.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-agenda",
    popover: {
      title: "📅 Rutina Visual Día a Día",
      description:
        "🎯 Propósito: Horario interactivo con pictogramas para estructurar el día del niño.\n⚡ Acción: Marca las tareas cotidianas completadas para brindarle certidumbre y tranquilidad.\n💡 Clave: La anticipación visual previene crisis por transiciones imprevistas.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-diario_hogar",
    popover: {
      title: "📝 Diario del Hogar (Registro Rápido)",
      description:
        "🎯 Propósito: Comparte en 1 minuto cómo durmió, su apetito, su ánimo y medicinas tomadas.\n⚡ Acción: Completa este registro cada mañana para que el terapeuta prepare la sesión del día.\n💡 Clave: Información clave para entender qué detona el malestar de tu niño.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-herramientas",
    popover: {
      title: "🎒 Kit de Regulación y Comunicación",
      description:
        "🎯 Propósito: 5 herramientas interactivas: Tablero de voz AAC, Primero-Después, 12 ejercicios sensoriales, temporizador y fichas.\n⚡ Acción: Úsalas ante momentos de tensión o para reforzar conductas positivas.\n💡 Clave: Diseñadas clínicamente para dar respuestas inmediatas en casa.",
      side: "right",
      align: "center",
    },
  },
  {
    element: "#tour-sidebar-perfil_padre",
    popover: {
      title: "📑 Expediente y Consentimiento LOPNNA",
      description:
        "🎯 Propósito: Datos oficiales de tu niño, estado de la autorización legal y seguridad.\n⚡ Acción: Configura el acceso biométrico rápido con huella dactilar o rostro (Passkeys).\n💡 Clave: Privacidad garantizada bajo el Artículo 65 de la LOPNNA.",
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
        title: "🎯 Panel Clínico del Paciente",
        description:
          "🎯 Propósito: Centro de supervisión focalizada del niño en sesión terapéutica.\n⚡ Acción: Monitorea el bienestar del paciente, revisa alertas y ejecuta acciones de intervención rápida.\n💡 Clave: Puedes cambiar de paciente en cualquier momento desde el selector superior.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="sp-hero"]',
      popover: {
        title: "👤 Ficha Rápida del Niño",
        description:
          "🎯 Propósito: Identificación del paciente: fotografía, nivel TEA, edad y rango de pulso basal (BPM).\n⚡ Acción: Verifica que las pulsaciones actuales se mantengan dentro de su franja segura calibrada.\n💡 Clave: Si el pulso supera el límite máximo en reposo, el sistema activa alerta preventiva.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="sp-incident-btn"]',
      popover: {
        title: "🚨 Registrar Incidente A-B-C",
        description:
          "🎯 Propósito: Documentar eventos de crisis o desregulación bajo el modelo Antecedente-Conducta-Consecuencia.\n⚡ Acción: Haz clic aquí durante o después de la crisis para registrar el detonante, severidad y la estrategia aplicada.\n💡 Clave: Se tabula al instante en el historial clínico y actualiza los indicadores del mes.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-indicacion-btn"]',
      popover: {
        title: "📋 Prescribir Indicación al Hogar",
        description:
          "🎯 Propósito: Emitir pautas de intervención o tareas para la familia o la escuela.\n⚡ Acción: Pulsa para redactar la instrucción; el representante la recibirá con foco prioritario.\n💡 Clave: Cuenta con acuse de lectura digital para seguimiento en la próxima consulta.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-rules-btn"]',
      popover: {
        title: "⚙️ Umbrales de Alerta Personalizados",
        description:
          "🎯 Propósito: Calibrar los límites de sobrecarga sensorial para la fisiología específica de este niño.\n⚡ Acción: Ajusta los BPM máximos de estrés, el tiempo de tolerancia y los canales de aviso.\n💡 Clave: Evita falsas alarmas calibrando según la edad y condición del paciente.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-export-pdf"]',
      popover: {
        title: "📑 Exportar Informe Clínico PDF",
        description:
          "🎯 Propósito: Generar el expediente formal con curvas de bioseñales y bitácora de desregulaciones.\n⚡ Acción: Haz clic para descargar el PDF con membrete institucional listo para entregar.\n💡 Clave: Formato validado para neuropediatras, psicólogos y auditorías médicas.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-pei-card"]',
      popover: {
        title: "🎯 Metas PEI (Objetivos SMART)",
        description:
          "🎯 Propósito: Seguimiento del Plan Educativo Individualizado en autonomía, lenguaje y regulación.\n⚡ Acción: Monitorea el porcentaje de logro y pulsa (+) para agregar un nuevo objetivo clínico.\n💡 Clave: Permite demostrar el avance terapéutico del paciente con datos medibles.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-pei-trial"]',
      popover: {
        title: "✨ Registrar Ensayo Logrado (+1)",
        description:
          "🎯 Propósito: Avanzar en vivo el progreso de una conducta aprendida durante la sesión.\n⚡ Acción: Pulsa este botón cada vez que el niño cumpla la tarea con éxito.\n💡 Clave: Actualiza automáticamente el porcentaje de avance de la meta PEI.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-abc-card"]',
      popover: {
        title: "📖 Bitácora de Crisis Recientes",
        description:
          "🎯 Propósito: Registro cronológico de crisis clasificadas por color (Leve, Moderada, Severa).\n⚡ Acción: Revisa los detonantes y estrategias previas para planificar la intervención de hoy.\n💡 Clave: Detecta si un detonante ambiental se repite de forma consistente.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-ble-widget"]',
      popover: {
        title: "📡 Enlace Wearable Bluetooth",
        description:
          "🎯 Propósito: Conexión directa por Web Bluetooth (BLE SIG 0x2A37) con la pulsera del niño.\n⚡ Acción: Pulsa para escanear y conectar el dispositivo, o verificar batería y estabilidad.\n💡 Clave: Lecturas en vivo sin intermediarios ni demoras de red.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-sensory-triggers"]',
      popover: {
        title: "⚠️ Detonantes Sensoriales Frecuentes",
        description:
          "🎯 Propósito: Ranking inteligente de causas de estrés (acústico, táctil, transiciones, fatiga).\n⚡ Acción: Adapta el entorno terapéutico antes de comenzar actividades de alta exigencia.\n💡 Clave: Previene crisis anticipando la exposición a factores detonantes.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-home-log"]',
      popover: {
        title: "🏡 Reporte del Hogar de Hoy",
        description:
          "🎯 Propósito: Información reportada por la familia: horas de sueño, ánimo, apetito y medicinas.\n⚡ Acción: Consulta este reporte antes de la sesión para ajustar el ritmo terapéutico.\n💡 Clave: Si el niño durmió poco o está irritable, prioriza ejercicios de calma.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sp-feed-tabs"]',
      popover: {
        title: "📋 Indicaciones Clínicas Prescritas",
        description:
          "🎯 Propósito: Resumen rápido de las pautas terapéuticas y recomendaciones enviadas a la familia.\n⚡ Acción: Consulta las indicaciones recientes prescritas para el paciente.\n💡 Clave: Las alertas en tiempo real llegan directamente a tu campana de notificaciones.",
        side: "left",
        align: "center",
      },
    },
  ],

  // PACIENTES (PatientManagement.jsx)
  patients: [
    {
      element: '[data-tour="pm-header"]',
      popover: {
        title: "👥 Selección de Pacientes",
        description:
          "🎯 Propósito: Nómina activa de niños bajo tu cuidado clínico.\n⚡ Acción: Gestiona admisiones, revisa clasificaciones TEA y genera enlaces de invitación familiar.\n💡 Clave: Solo muestra pacientes formalmente vinculados a tu usuario.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="pm-search"]',
      popover: {
        title: "🔍 Búsqueda Inmediata",
        description:
          "🎯 Propósito: Localización rápida de expedientes clínicos.\n⚡ Acción: Escribe el nombre, apellido o código de cédula/historial del paciente.\n💡 Clave: Filtra los resultados en tiempo real mientras escribes.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-filter-nivel"]',
      popover: {
        title: "🎯 Filtro por Nivel de Apoyo TEA",
        description:
          "🎯 Propósito: Segmentar pacientes según su grado de requerimiento de apoyo.\n⚡ Acción: Selecciona Nivel 1 (Apoyo leve), Nivel 2 (Sustancial) o Nivel 3 (Muy sustancial).\n💡 Clave: Permite organizar sesiones terapéuticas por nivel de complejidad.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-filter-estado"]',
      popover: {
        title: "📡 Filtro por Conexión Wearable",
        description:
          "🎯 Propósito: Identificar qué niños tienen su pulsera activa en este momento.\n⚡ Acción: Filtra por 'Conectados' para verificar quiénes están transmitiendo telemetría en vivo.\n💡 Clave: Facilita la supervisión durante terapias presenciales o actividades escolares.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-register"]',
      popover: {
        title: "➕ Admisión de Nuevo Paciente",
        description:
          "🎯 Propósito: Formulario de ingreso de un nuevo niño al programa terapéutico.\n⚡ Acción: Haz clic para registrar datos de filiación, diagnóstico y generar el código LOPNNA para los padres.\n💡 Clave: Vincula automáticamente al representante legal con el expediente.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="pm-grid"]',
      popover: {
        title: "🗂️ Tarjetas Clínicas de Pacientes",
        description:
          "🎯 Propósito: Vista de pájaro del estado de cada niño asignado.\n⚡ Acción: Pulsa sobre cualquier tarjeta para abrir su expediente maestro o panel en vivo.\n💡 Clave: Muestra edad, nivel TEA y estado de vinculación Bluetooth.",
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
        title: "📋 Ficha Clínica Maestra",
        description:
          "🎯 Propósito: Expediente integral que centraliza datos diagnósticos, legales y familiares.\n⚡ Acción: Revisa el historial de desarrollo, perfil sensorial y contactos de emergencia.\n💡 Clave: Fuente de verdad clínica inmutable para el equipo multidisciplinario.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="sr-identity"]',
      popover: {
        title: "🆔 Datos de Filiación e Identidad",
        description:
          "🎯 Propósito: Información legal del menor protegida bajo normativa LOPNNA.\n⚡ Acción: Verifica nombre, fecha de nacimiento, edad exacta calculada y código institucional.\n💡 Clave: Garantiza la identidad unívoca del paciente en todo informe médico expedido.",
        side: "right",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-clinical"]',
      popover: {
        title: "🧠 Clasificación del Espectro Autista",
        description:
          "🎯 Propósito: Perfil de neurodesarrollo y reactividad sensorial (hiperreactivo, hiporreactivo o mixto).\n⚡ Acción: Consulta los patrones de sensibilidad acústica, táctil o visual para ajustar el tratamiento.\n💡 Clave: Estos parámetros calibran la sensibilidad de los algoritmos de detección de crisis.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-links"]',
      popover: {
        title: "👨‍👩‍👦 Representantes y Vínculo Legal",
        description:
          "🎯 Propósito: Identificación del tutor legal y especialistas asignados al caso.\n⚡ Acción: Revisa los teléfonos de contacto familiar y el estado de la patria potestad/tutela.\n💡 Clave: Cumplimiento estricto del consentimiento informado LOPNNA Art. 65.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="sr-edit"]',
      popover: {
        title: "✏️ Edición y Actualización de Expediente",
        description:
          "🎯 Propósito: Actualizar diagnósticos médicos, pautas farmacológicas o datos de contacto.\n⚡ Acción: Pulsa para modificar campos y guardar cambios en el expediente.\n💡 Clave: Cada edición queda auditada con fecha, hora y cédula del especialista.",
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
        title: "📈 Historial y Bitácora Longitudinal",
        description:
          "🎯 Propósito: Módulo de seguimiento del progreso a lo largo de semanas y meses.\n⚡ Acción: Compara la asistencia a terapias, progreso en rutinas y frecuencia de crisis.\n💡 Clave: Permite verificar científicamente si el tratamiento está dando resultados.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="hist-tabs"]',
      popover: {
        title: "🔄 Pestañas: Evolución vs Bitácora A-B-C",
        description:
          "🎯 Propósito: Dos ópticas clínicas: progreso general y análisis funcional de conducta.\n⚡ Acción: Cambia a 'Bitácora A-B-C' para filtrar incidentes por severidad, fecha o detonante.\n💡 Clave: Permite aislar crisis graves para preparar informes neuropediátricos.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hist-kpis"]',
      popover: {
        title: "📊 Indicadores de Estabilidad Conductual",
        description:
          "🎯 Propósito: Métricas consolidadas: total de crisis del período, duración media y autorregulación.\n⚡ Acción: Monitorea si la duración de los episodios disminuye con el paso del tiempo.\n💡 Clave: Reducción en tiempo de desregulación es señal de maduración sensorial.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hist-export-btn"]',
      popover: {
        title: "📥 Exportación de Auditoría a PDF / Excel",
        description:
          "🎯 Propósito: Generar reportes formales con gráficas y tablas de incidentes.\n⚡ Acción: Haz clic para descargar en PDF o en hoja de cálculo (.xlsx) para auditorías.\n💡 Clave: Incluye firma digital y membrete oficial de la institución.",
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
        title: "🧩 Catálogo de Terapias Estructuradas",
        description:
          "🎯 Propósito: Biblioteca de actividades terapéuticas con pasos visuales y temporizador.\n⚡ Acción: Diseña terapias para estimulación sensorial, motricidad o autonomía personal.\n💡 Clave: Diseñadas bajo el método TEACCH para reducir la ansiedad del niño.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="rout-create-btn"]',
      popover: {
        title: "➕ Crear Nueva Terapia Guiada",
        description:
          "🎯 Propósito: Configurar una nueva secuencia terapéutica personalizada.\n⚡ Acción: Define categoría, duración, materiales, pictogramas y la meta PEI asociada.\n💡 Clave: La actividad quedará disponible de inmediato para reproducirla en consulta o en casa.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="rout-player"]',
      popover: {
        title: "▶️ Reproductor de Terapia en Vivo",
        description:
          "🎯 Propósito: Guía interactiva paso a paso con cronómetro y retroalimentación visual.\n⚡ Acción: Reproduce la sesión y al finalizar califica la cooperación del niño (1 a 5 estrellas).\n💡 Clave: Los datos de ejecución se suman automáticamente al progreso de metas PEI.",
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
        title: "📡 Calibración de Sensores Biométricos",
        description:
          "🎯 Propósito: Administración de biotelemetría mediante Web Bluetooth (BLE SIG 0x2A37).\n⚡ Acción: Enlaza el smartwatch del niño y configura los parámetros basales de pulso.\n💡 Clave: Compatible con pulseras y relojes estándar sin apps intermediarias.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="hw-bpm"]',
      popover: {
        title: "💓 Monitor de Frecuencia Cardíaca (BPM)",
        description:
          "🎯 Propósito: Pulsaciones en tiempo real con diferenciación entre calma y sobrecarga.\n⚡ Acción: Observa la respuesta cardíaca ante diferentes estímulos sensoriales.\n💡 Clave: Un incremento sostenido del 25% sobre la línea base advierte desregulación inminente.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-calibration-btn"]',
      popover: {
        title: "⏱️ Calibración Basal de 15 Segundos",
        description:
          "🎯 Propósito: Registrar la frecuencia cardíaca promedio del niño en estado de reposo.\n⚡ Acción: Pide al niño que esté tranquilo y pulsa para iniciar la captura de 15 segundos.\n💡 Clave: Establece la línea base exacta para calibrar los umbrales de alerta del paciente.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-simulation-btn"]',
      popover: {
        title: "🧪 Simulador de Crisis y Telemetría",
        description:
          "🎯 Propósito: Entorno de pruebas clínicas y entrenamiento del personal sin sensor físico.\n⚡ Acción: Genera patrones de taquicardia o estrés para verificar que las alertas funcionen correctamente.\n💡 Clave: Ideal para capacitar a nuevos especialistas y padres en el protocolo SOS.",
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
        title: "🏡 Análisis Cruzado con el Hogar",
        description:
          "🎯 Propósito: Correlacionar los factores del entorno familiar con la conducta clínica.\n⚡ Acción: Examina el impacto de las horas de sueño, apetito y ánimo en las desregulaciones.\n💡 Clave: Permite detectar detonantes ambientales que ocurren fuera del centro médico.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="ha-charts"]',
      popover: {
        title: "📉 Gráficas de Correlación Multidimensional",
        description:
          "🎯 Propósito: Visualizar tendencias cruzadas entre bioseñales y calidad del descanso.\n⚡ Acción: Identifica si los días con menos de 7 horas de sueño registran picos de taquicardia.\n💡 Clave: Información clave para orientar a la familia en pautas de higiene del sueño.",
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
        title: "⚙️ Configuración de Cuenta Profesional",
        description:
          "🎯 Propósito: Gestión de credenciales, seguridad biométrica y ergonomía visual.\n⚡ Acción: Navega entre tus datos personales, métodos de acceso y preferencias de pantalla.\n💡 Clave: Mantén actualizada tu información de contacto para recibir notificaciones clínicas.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="profile-passkeys"]',
      popover: {
        title: "🔐 Acceso Biométrico Rápido (Passkeys)",
        description:
          "🎯 Propósito: Iniciar sesión en 1 segundo usando huella dactilar, FaceID o PIN del dispositivo.\n⚡ Acción: Haz clic en 'Registrar Passkey' para vincular tus biometría sin necesidad de contraseñas.\n💡 Clave: Estándar FIDO2/WebAuthn con máxima protección contra suplantación de identidad.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="pref-theme"]',
      popover: {
        title: "👁️ Modos Visuales Descansados",
        description:
          "🎯 Propósito: Personalizar el contraste para evitar el encandilamiento y fatiga ocular.\n⚡ Acción: Elige 'Claro Confort' (tonos suaves amables) o 'Noche Calmante' (modo oscuro profundo).\n💡 Clave: Diseñado específicamente para jornadas clínicas extensas frente al monitor.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="pref-accent"]',
      popover: {
        title: "🎨 Color de Acento Institucional",
        description:
          "🎯 Propósito: Ajustar el color primario de botones y gráficos de la interfaz.\n⚡ Acción: Selecciona entre 6 variantes cromáticas optimizadas para concentración.\n💡 Clave: Elige el tono con el que te sientas más cómodo durante tu jornada.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="pref-density"]',
      popover: {
        title: "📐 Densidad y Tamaño de Letra",
        description:
          "🎯 Propósito: Adaptar el espaciado y legibilidad a tu pantalla o tablet.\n⚡ Acción: Alterna entre espaciado cómodo o compacto y ajusta el tamaño base de texto.\n💡 Clave: Mayor ergonomía si utilizas SIAT en dispositivos móviles o tablets en consulta.",
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
        title: "🏠 Panel Principal de la Familia",
        description:
          "🎯 Propósito: Tu centro de control diario para acompañar el bienestar de tu niño.\n⚡ Acción: Consulta el estado en vivo, atajos de calma y las terapias programadas para hoy.\n💡 Clave: Diseñado para darte tranquilidad y respuestas inmediatas en cualquier momento.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="parent-dash-status"]',
      popover: {
        title: "🚦 Semáforo Biométrico en Tiempo Real",
        description:
          "🎯 Propósito: Estado de regulación del niño (Verde: Calma, Amarillo: Alerta, Rojo: Posible Sobrecarga).\n⚡ Acción: Monitorea las pulsaciones (BPM) y el nivel de estrés que transmite su pulsera.\n💡 Clave: Te avisa de cambios fisiológicos antes de que ocurra una desregulación visible.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-dash-summary"]',
      popover: {
        title: "📋 Resumen y Agenda del Día",
        description:
          "🎯 Propósito: Vista rápida de las actividades, rutinas pendientes y pautas activas.\n⚡ Acción: Revisa las tareas cotidianas que faltan por completar durante la jornada.\n💡 Clave: Mantener rutinas predecibles genera seguridad emocional en el niño.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-dash-focus"]',
      popover: {
        title: "🎯 Foco Terapéutico de la Semana",
        description:
          "🎯 Propósito: La pauta o recomendación prioritaria enviada por el especialista tratante.\n⚡ Acción: Lee la sugerencia clínica y aplícala en casa durante los momentos clave del día.\n💡 Clave: Alinea el trabajo de los padres con las metas de la consulta presencial.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-dash-sos"]',
      popover: {
        title: "🆘 Protocolo SOS de Calma Inmediata",
        description:
          "🎯 Propósito: Auxilio rápido en momentos de sobrecarga sensorial o desregulación.\n⚡ Acción: Pulsa para activar ejercicios de respiración guiada o el tablero de comunicación AAC con voz.\n💡 Clave: Herramientas accesibles con 1 solo toque para calmar situaciones difíciles.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-dash-events"]',
      popover: {
        title: "🔔 Eventos y Notificaciones del Día",
        description:
          "🎯 Propósito: Historial de avisos generados por el smartwatch y notas terapéuticas.\n⚡ Acción: Consulta los registros de pulsaciones altas o alertas detectadas en la jornada.\n💡 Clave: Te permite identificar en qué momento del día el niño experimentó más tensión.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-dash-diary-btn"]',
      popover: {
        title: "📝 Llenar Diario de Hoy",
        description:
          "🎯 Propósito: Acceso directo al formulario diario de sueño, apetito y humor matutino.\n⚡ Acción: Tarda solo 1 minuto en registrar cómo durmió y cómo comenzó el día el niño.\n💡 Clave: El especialista lee esta información antes de iniciar la terapia en el centro médico.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="parent-dash-export"]',
      popover: {
        title: "📥 Descargar Reporte del Día en PDF",
        description:
          "🎯 Propósito: Generar un resumen formal con los datos biométricos y eventos de hoy.\n⚡ Acción: Haz clic para descargar el documento y compartirlo en citas médicas o escolares.\n💡 Clave: Evidencia objetiva para el pediatra o neurólogo.",
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
        title: "💓 Telemetría IoT en Tiempo Real",
        description:
          "🎯 Propósito: Supervisión continua de las señales transmitidas por la pulsera inteligente del niño.\n⚡ Acción: Monitorea pulsaciones, nivel de estrés y movimiento corporal en vivo.\n💡 Clave: Funciona por Bluetooth o sincronización automática en la nube.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="hw-bpm"]',
      popover: {
        title: "💓 Frecuencia Cardíaca (BPM)",
        description:
          "🎯 Propósito: Pulsaciones por minuto en vivo comparadas con el rango seguro del niño.\n⚡ Acción: Verifica que el valor esté dentro del área verde (rango basal en reposo).\n💡 Clave: Un pulso elevado persistente sin ejercicio advierte tensión sensorial.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-stress"]',
      popover: {
        title: "⚡ Índice de Estrés Sensorial",
        description:
          "🎯 Propósito: Algoritmo que mide la variabilidad del pulso para detectar sobrecarga.\n⚡ Acción: Si el indicador sube a color amarillo o rojo, inicia una pausa de relajación.\n💡 Clave: Permite intervenir antes de que el niño sufra un meltdown o berrinche.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-mov"]',
      popover: {
        title: "🏃 Movimiento Corporal y Agitación",
        description:
          "🎯 Propósito: Registrar la actividad física a través del acelerómetro del reloj.\n⚡ Acción: Permite distinguir entre juego activo (correr, saltar) y balanceo por desregulación.\n💡 Clave: Evita confundir el cansancio físico con una crisis sensorial.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="hw-history"]',
      popover: {
        title: "📈 Curva de Evolución de la Sesión",
        description:
          "🎯 Propósito: Gráfico continuo de pulsaciones y estrés durante la última hora.\n⚡ Acción: Observa cómo reacciona el niño ante ruidos, visitas o cambios de ambiente.\n💡 Clave: Te ayuda a identificar qué situaciones le generan mayor tranquilidad.",
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
        title: "📅 Agenda Visual Día a Día",
        description:
          "🎯 Propósito: Estructurar la rutina diaria del niño mediante apoyos visuales y pictogramas.\n⚡ Acción: Ayuda al niño a saber qué actividad viene después para reducir su incertidumbre.\n💡 Clave: La anticipación es la herramienta más eficaz para evitar crisis en transiciones.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="ag-checklist"]',
      popover: {
        title: "✅ Checklist Interactivo de Tareas",
        description:
          "🎯 Propósito: Secuencia de actividades cotidianas (bañarse, desayunar, tareas, juego).\n⚡ Acción: Pulsa para marcar cada actividad completada junto a tu niño.\n💡 Clave: La confirmación visual refuerza el sentido de logro y autonomía.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ag-create"]',
      popover: {
        title: "➕ Agregar Nueva Actividad a la Rutina",
        description:
          "🎯 Propósito: Personalizar el horario del niño con actividades propias de la familia.\n⚡ Acción: Haz clic para definir la hora, nombre de la tarea y su imagen representativa.\n💡 Clave: Mantén horarios consistentes para brindar mayor estabilidad.",
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
        title: "📝 Diario del Hogar (Registro Familiar)",
        description:
          "🎯 Propósito: Documentar cada mañana los factores biológicos que impactan en el niño.\n⚡ Acción: Completa los 4 datos básicos (sueño, ánimo, apetito y crisis) en 1 minuto.\n💡 Clave: El especialista utiliza estos datos para calibrar la dificultad de cada terapia.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="dh-sueno"]',
      popover: {
        title: "😴 Calidad y Horas de Sueño",
        description:
          "🎯 Propósito: Registrar cuántas horas durmió y si tuvo despertares nocturnos.\n⚡ Acción: Selecciona las horas de descanso y califica si fue un sueño reparador o inquieto.\n💡 Clave: El mal descanso es el detonante número uno de crisis sensoriales en TEA.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-animo"]',
      popover: {
        title: "😊 Estado Anímico Matutino",
        description:
          "🎯 Propósito: Indicar la disposición emocional del niño al despertar.\n⚡ Acción: Elige entre alegre, tranquilo, irritable o ansioso.\n💡 Clave: Permite al terapeuta saber si el niño viene con alta sensibilidad o receptivo.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-apetito"]',
      popover: {
        title: "🍽️ Apetito y Alimentación",
        description:
          "🎯 Propósito: Registrar cómo fue la ingesta de alimentos y selectividad sensorial.\n⚡ Acción: Marca si comió bien, poco o rechazó texturas específicas de comida.\n💡 Clave: Molestias estomacales no verbalizadas se manifiestan frecuentemente como desregulación.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="dh-crisis"]',
      popover: {
        title: "🚨 Reporte de Crisis en Casa",
        description:
          "🎯 Propósito: Documentar si ocurrió algún meltdown o desregulación fuera del centro médico.\n⚡ Acción: Describe brevemente qué detonó la crisis, cuánto duró y qué técnica ayudó a calmarlo.\n💡 Clave: Ayuda al especialista a ajustar el plan de intervención.",
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
        title: "🎒 Kit de Herramientas de Apoyo",
        description:
          "🎯 Propósito: 5 herramientas interactivas diseñadas clínicamente para el apoyo en TEA.\n⚡ Acción: Navega entre las pestañas para elegir la herramienta que necesites en cada momento.\n💡 Clave: Disponibles sin conexión para usarlas en casa, la escuela o la calle.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="ht-tabs"]',
      popover: {
        title: "🎛️ Selector de Herramientas Terapéuticas",
        description:
          "🎯 Propósito: Cambiar rápidamente de herramienta según la necesidad del niño.\n⚡ Acción: Elige: 1. Tablero AAC (Voz), 2. Primero-Después, 3. Calma Sensorial, 4. Temporizador o 5. Fichas.\n💡 Clave: Cada herramienta atiende una fase distinta de la autorregulación.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-aac"]',
      popover: {
        title: "🗣️ Comunicación Aumentativa (AAC)",
        description:
          "🎯 Propósito: Tablero de pictogramas con voz para niños con dificultades en el habla.\n⚡ Acción: Toca los pictogramas para formar frases y expresar hambre, dolor, emociones o deseos.\n💡 Clave: Reduce drásticamente la frustración por no poder comunicarse verbalmente.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-aac-speak"]',
      popover: {
        title: "🔊 Reproducir Frase con Voz Natural",
        description:
          "🎯 Propósito: Síntesis de voz automática de la frase construida con pictogramas.\n⚡ Acción: Pulsa para que el teléfono pronuncie la frase en voz alta y clara.\n💡 Clave: Fortalece el modelo auditivo del lenguaje en el niño.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-ft-panel"]',
      popover: {
        title: "↔️ Tablero Primero - Después",
        description:
          "🎯 Propósito: Contingencia visual: 'Primero hacemos la tarea, Después recibes tu juego favorito'.\n⚡ Acción: Selecciona la actividad obligatoria a la izquierda y el reforzador a la derecha.\n💡 Clave: Facilita transiciones difíciles sin confrontación.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-sensory-grid"]',
      popover: {
        title: "🧘 12 Estrategias de Regulación Sensorial",
        description:
          "🎯 Propósito: Ejercicios guiados paso a paso con temporizador y voz de apoyo.\n⚡ Acción: Elige entre respiración diafragmática, presión propioceptiva, masajes o pausas de calma.\n💡 Clave: Diseñados por terapeutas ocupacionales para bajar la sobrecarga del sistema nervioso.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-timer-panel"]',
      popover: {
        title: "⏳ Temporizador Visual Circular",
        description:
          "🎯 Propósito: Hacer visible el paso del tiempo con un dial de color que se reduce gradualmente.\n⚡ Acción: Ajusta los minutos deseados y pulsa iniciar para anticipar el final de una actividad.\n💡 Clave: Los niños con pensamiento visual asimilan el tiempo sin angustia.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="ht-econ-panel"]',
      popover: {
        title: "⭐ Economía de Fichas (Refuerzo Positivo)",
        description:
          "🎯 Propósito: Sistema motivacional donde el niño acumula estrellas por conductas positivas.\n⚡ Acción: Otorga una estrella cada vez que complete una meta pactada y canjéala por recompensas.\n💡 Clave: Estimula hábitos positivos mediante refuerzo inmediato.",
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
        title: "📑 Expediente del Niño y Filiación Legal",
        description:
          "🎯 Propósito: Consulta de la ficha clínica oficial del niño y tus datos de contacto.\n⚡ Acción: Revisa diagnósticos registrados, teléfonos de emergencia y especialistas asignados.\n💡 Clave: Datos protegidos y cifrados bajo estándares de confidencialidad médica.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="pp-consent"]',
      popover: {
        title: "⚖️ Consentimiento Legal LOPNNA (Art. 65)",
        description:
          "🎯 Propósito: Estado formal de la autorización de tratamiento de datos de salud de menores.\n⚡ Acción: Verifica que tu consentimiento informado esté activo y validado conforme a la ley.\n💡 Clave: Garantiza tus derechos como representante legal en la custodia de datos médicos.",
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
        title: "⚙️ Configuración de tu Cuenta Familiar",
        description:
          "🎯 Propósito: Administrar datos de acceso, seguridad y preferencias de la pantalla.\n⚡ Acción: Cambia contraseñas, añade métodos biométricos y personaliza el tema visual.\n💡 Clave: Mantén actualizada tu información para recibir alertas oportunas.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="profile-passkeys"]',
      popover: {
        title: "🔐 Acceso con Huella o Rostro (Passkeys)",
        description:
          "🎯 Propósito: Ingresar a SIAT en 1 segundo usando la huella o FaceID de tu teléfono.\n⚡ Acción: Pulsa en 'Registrar Passkey' para no tener que recordar ni escribir contraseñas.\n💡 Clave: Máxima seguridad criptográfica y comodidad en el día a día.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="pref-theme"]',
      popover: {
        title: "👁️ Modos Visuales Amables con la Vista",
        description:
          "🎯 Propósito: Reducir el cansancio ocular según la hora del día o nivel de iluminación.\n⚡ Acción: Elige 'Claro Confort' (tonos suaves no encandilantes) o 'Noche Calmante' (modo oscuro).\n💡 Clave: Navega cómodamente sin brillo agresivo en habitaciones oscuras.",
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
        title: "📊 Consola Ejecutiva Institucional",
        description:
          "🎯 Propósito: Resumen global de la operación clínica y asistencial de la fundación.\n⚡ Acción: Supervisa pacientes activos, altas médicas, especialistas de guardia e incidentes del mes.\n💡 Clave: Muestra variaciones porcentuales automáticas frente al mes previo.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="admin-dash-actions"]',
      popover: {
        title: "⚡ Accesos Rápidos de Gestión",
        description:
          "🎯 Propósito: Atajos inmediatos a los módulos más frecuentados por la directiva.\n⚡ Acción: Pulsa para acreditar especialistas, asignar pacientes, auditar usuarios o editar la fundación.\n💡 Clave: Ahorra clics en tareas operativas diarias.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-dash-charts"]',
      popover: {
        title: "📉 Carga Terapéutica y Distribución TEA",
        description:
          "🎯 Propósito: Análisis estadístico de admisiones de pacientes y horas de terapia impartidas.\n⚡ Acción: Evalúa la distribución poblacional por grado del espectro y la productividad médica.\n💡 Clave: Base sólida para la planificación presupuestaria y contratación de personal.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-dash-audit"]',
      popover: {
        title: "🛡️ Registro Inmutable de Auditoría",
        description:
          "🎯 Propósito: Trazabilidad total de operaciones críticas (inicios de sesión, asignaciones, cambios).\n⚡ Acción: Revisa los logs de seguridad con fecha, hora, dirección IP y usuario responsable.\n💡 Clave: Cumplimiento de estándares de custodia de información médica confidencial.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-dash-export"]',
      popover: {
        title: "📑 Exportación Ejecutiva a PDF y Excel",
        description:
          "🎯 Propósito: Generación de informes consolidados de gestión para juntas directivas.\n⚡ Acción: Haz clic para exportar en PDF con membrete institucional o en tabla Excel (.xlsx).\n💡 Clave: Listo para adjuntar en memorias y cuentas o auditorías gubernamentales.",
        side: "left",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-dash-schedule"]',
      popover: {
        title: "⏰ Automatización de Reportes por Correo",
        description:
          "🎯 Propósito: Programar el envío automático periódico de auditorías a la directiva.\n⚡ Acción: Define frecuencia (semanal o mensual) y correos de destino para recibir reportes sin esfuerzo.\n💡 Clave: Mantiene informada a la directiva institucional de forma desatendida.",
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
        title: "🩺 Nómina de Especialistas Médicos",
        description:
          "🎯 Propósito: Control integral del staff clínico: psicólogos, terapeutas y neuropediatras.\n⚡ Acción: Consulta cédulas, correos corporativos, especialidad y estado de acceso.\n💡 Clave: Solo el personal activo y acreditado puede acceder a historias clínicas.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-esp-subnav"]',
      popover: {
        title: "🗂️ Especialistas vs Catálogo de Especialidades",
        description:
          "🎯 Propósito: Alternar entre la nómina de médicos y las disciplinas habilitadas en el centro.\n⚡ Acción: Añade nuevas especialidades terapéuticas según la oferta asistencial de la fundación.\n💡 Clave: Mantiene estandarizada la categorización de los profesionales.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-esp-btn-nuevo"]',
      popover: {
        title: "➕ Acreditar Nuevo Especialista",
        description:
          "🎯 Propósito: Registrar un nuevo profesional con credenciales médicas MPPS.\n⚡ Acción: Haz clic para abrir el formulario y asignar correo institucional, cédula y especialidad.\n💡 Clave: Genera credenciales de acceso inicial que el especialista personalizará al ingresar.",
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
        title: "👨‍👩‍👦 Directorio de Representantes Legales",
        description:
          "🎯 Propósito: Registro centralizado de padres, madres y tutores legales de los pacientes.\n⚡ Acción: Audita vinculación familiar, teléfonos de emergencia y estado del consentimiento LOPNNA.\n💡 Clave: Base para la comunicación legal e invitaciones de enlace familiar.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-rep-search"]',
      popover: {
        title: "🔍 Búsqueda Rápida por Cédula o Nombre",
        description:
          "🎯 Propósito: Localización inmediata de cualquier tutor legal registrado.\n⚡ Acción: Ingresa el número de documento de identidad o apellidos para filtrar al instante.\n💡 Clave: Facilita la verificación de filiación en admisiones o emergencias.",
        side: "bottom",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-rep-btn-nuevo"]',
      popover: {
        title: "➕ Vincular Representante y Paciente",
        description:
          "🎯 Propósito: Formalizar la asociación jurídica entre el tutor legal y el niño.\n⚡ Acción: Abre el formulario de vinculación familiar bajo los requerimientos del Art. 65 LOPNNA.\n💡 Clave: Habilita el acceso del representante al portal de seguimiento y diario del hogar.",
        side: "left",
        align: "center",
      },
    },
  ],

  // VÍNCULOS Y ASIGNACIONES (AsignacionesTab.jsx)
  asignaciones: [
    {
      element: '[data-tour="admin-asignaciones"]',
      popover: {
        title: "🔗 Matriz de Asignaciones Terapéuticas",
        description:
          "🎯 Propósito: Control formal de los vínculos entre especialistas tratantes y pacientes.\n⚡ Acción: Supervisa qué terapeuta tiene asignado a cada niño y desde qué fecha.\n💡 Clave: Garantiza que ningún profesional acceda a historiales de niños fuera de su cobertura.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-asig-btn-nuevo"]',
      popover: {
        title: "➕ Crear Nueva Asignación",
        description:
          "🎯 Propósito: Asociar a un paciente con un especialista para iniciar su acompañamiento.\n⚡ Acción: Selecciona el médico tratante y el niño para formalizar el inicio terapéutico.\n💡 Clave: El niño aparecerá de inmediato en el panel clínico del especialista seleccionado.",
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
        title: "👥 Control de Cuentas y Accesos (RBAC)",
        description:
          "🎯 Propósito: Administración de seguridad: activación, bloqueo o reset de cuentas del sistema.\n⚡ Acción: Reenvía credenciales temporales, cambia roles o suspende accesos al personal.\n💡 Clave: Control estricto de accesos basado en roles (Admin, Especialista, Representante).",
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
        title: "🖥️ Monitor de Infraestructura y Uptime",
        description:
          "🎯 Propósito: Monitoreo técnico del estado operativo de los servidores y base de datos.\n⚡ Acción: Verifica la disponibilidad del API Node.js, latencia de PostgreSQL y WebSockets activos.\n💡 Clave: Diagnostica problemas de conectividad o lentitud en tiempo real.",
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
        title: "🏛️ Identidad Institucional de la Fundación",
        description:
          "🎯 Propósito: Configurar datos fiscales, RIF, sede física y teléfonos de la institución.\n⚡ Acción: Asegúrate de que los datos institucionales estén al día.\n💡 Clave: Estos datos aparecen automáticamente en el membrete de todos los informes PDF expedidos.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="admin-cat-edit"]',
      popover: {
        title: "✏️ Modificar Datos Institucionales",
        description:
          "🎯 Propósito: Actualizar el domicilio legal, teléfono de contacto o autoridades de la sede.\n⚡ Acción: Haz clic para habilitar el modo de edición y guarda los cambios.\n💡 Clave: Mantiene la vigencia legal de los documentos impresos y exportados.",
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
        title: "⚙️ Perfil y Seguridad del Administrador",
        description:
          "🎯 Propósito: Gestión de credenciales directivas, autenticación criptográfica y apariencia.\n⚡ Acción: Configura llaves de seguridad FIDO2 (Passkeys) y personaliza el tema visual.\n💡 Clave: Protege la cuenta con mayor nivel de privilegios de la institución.",
        side: "bottom",
        align: "start",
      },
    },
    {
      element: '[data-tour="profile-passkeys"]',
      popover: {
        title: "🔐 Passkeys FIDO2 para Administradores",
        description:
          "🎯 Propósito: Acceso ultra-seguro sin contraseñas usando Windows Hello, biometría o llave física.\n⚡ Acción: Registra tu método biométrico para blindar la consola contra accesos no autorizados.\n💡 Clave: Estándar criptográfico recomendado para cuentas directivas y de gobierno.",
        side: "top",
        align: "center",
      },
    },
    {
      element: '[data-tour="pref-theme"]',
      popover: {
        title: "👁️ Temas de Gestión Anti-Fatiga Visual",
        description:
          "🎯 Propósito: Ajustar el contraste de pantalla para auditorías y jornadas prolongadas.\n⚡ Acción: Alterna entre 'Claro Confort' (tonos mates descansados) y 'Noche Calmante'.\n💡 Clave: Elimina encandilamientos y reduce drásticamente el cansancio visual.",
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
