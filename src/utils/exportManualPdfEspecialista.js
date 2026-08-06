import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logoPath from "../assets/Logo.png";

export const seccionesManualEspecialista = [
  {
    id: "introduccion",
    titulo: "Introducción",
    icono: "introduccion",
    descripcion: "Bienvenido al sistema SIAT para especialistas",
    contenido: [
      {
        tipo: "texto",
        valor:
          "El módulo de Especialista está diseñado para profesionales de la salud (terapeutas, psicólogos, médicos) que trabajan con niños con Trastorno del Espectro Autista (TEA). Desde este panel podrá gestionar pacientes, registrar sesiones, crear metas PEI, documentar notas clínicas SOAP, monitorear la evolución, calibrar sensores IoT y coordinar el plan terapéutico con los representantes.",
      },
      {
        tipo: "texto",
        valor:
          "SIAT integra wearables IoT (pulseras biométricas) que permiten la detección temprana de crisis de sobrecarga sensorial, brindando datos objetivos para la toma de decisiones clínicas.",
      },
    ],
  },
  {
    id: "estructura",
    titulo: "Estructura del Panel",
    icono: "estructura",
    descripcion: "Distribución de la interfaz del especialista",
    contenido: [
      { tipo: "texto", valor: "El panel del especialista se compone de:" },
      {
        tipo: "lista",
        items: [
          "Barra lateral izquierda: Navegación entre las 8 secciones del panel.",
          "Barra superior: Nombre del usuario, campana de notificaciones y modo oscuro.",
          "Área principal: Contenido dinámico según la sección seleccionada.",
        ],
      },
      { tipo: "subtitulo", valor: "Secciones de la Barra Lateral" },
      {
        tipo: "tabla",
        encabezados: ["Sección", "Descripción"],
        filas: [
          [
            "Resumen Global",
            "KPIs, agenda del día y alertas de todos los pacientes.",
          ],
          [
            "Gestión de Pacientes",
            "Listado de pacientes con búsqueda, filtros y registro de nuevos niños.",
          ],
          [
            "Perfil Clínico",
            "Ficha del paciente con datos de identidad, nivel TEA y perfil sensorial.",
          ],
          [
            "Historial de Evolución",
            "KPIs de progreso, gráficos de evolución y análisis fisiológico de crisis.",
          ],
          [
            "Análisis en Casa",
            "Reportes del hogar enviados por el representante (sueño, ánimo, crisis).",
          ],
          [
            "Asignación de Actividades",
            "Catálogo de terapias, constructor de rutinas y sesiones en vivo.",
          ],
          [
            "Calibración de Sensores",
            "Gestión de dispositivos IoT y calibración de línea base fisiológica.",
          ],
          ["Manual de Usuario", "Esta guía de referencia completa."],
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          "Las secciones Historial, Análisis en Casa y Actividades requieren tener un paciente seleccionado previamente.",
      },
    ],
  },
  {
    id: "dashboard",
    titulo: "Resumen Global",
    icono: "dashboard",
    descripcion: "Vista general con KPIs, agenda y alertas",
    contenido: [
      { tipo: "subtitulo", valor: "Vista Global (sin paciente seleccionado)" },
      {
        tipo: "texto",
        valor:
          "Al ingresar al panel, se muestra una visión general de toda la carga clínica:",
      },

      { tipo: "subtitulo", valor: "Indicadores Clave (KPIs)" },
      {
        tipo: "tabla",
        encabezados: ["KPI", "Descripción"],
        filas: [
          ["Pacientes Activos", "Total de niños asignados al especialista"],
          ["Citas Hoy", "Número de consultas agendadas para el día actual"],
          ["Cumplimiento PEI", "Porcentaje promedio de avance en metas PEI"],
          [
            "Alertas (24h)",
            "Alertas de crisis registradas en las últimas 24 horas",
          ],
        ],
      },

      { tipo: "subtitulo", valor: "Agenda Clínica del Día" },
      {
        tipo: "texto",
        valor:
          "Lista de citas del día obtenidas del sistema. Cada cita muestra:",
      },
      {
        tipo: "lista",
        items: [
          "Hora programada y estado (Completada / En Progreso / Pendiente).",
          "Nombre del paciente y tipo de cita.",
          'Botón "Ir a Paciente": carga el panel clínico del paciente.',
          'Botón "Completar": marca la cita como finalizada.',
        ],
      },

      { tipo: "subtitulo", valor: "Alertas Globales" },
      {
        tipo: "texto",
        valor:
          "Feed de novedades con las alertas más recientes de todos los pacientes, mostrando timestamp, nombre del paciente y descripción de la alerta.",
      },

      { tipo: "subtitulo", valor: "Panel Clínico (con paciente seleccionado)" },
      {
        tipo: "texto",
        valor:
          "Al seleccionar un paciente (desde la agenda o desde Gestión de Pacientes), se despliega el panel clínico con:",
      },
      {
        tipo: "lista",
        items: [
          "Metas PEI (trial-by-trial): progreso de objetivos terapéuticos.",
          "Gráfico Sensorial: distribución de detonantes de crisis.",
          "Gráfico Conductual: tendencia semanal de incidentes.",
          "Botones de acción rápida: Incidente, Indicación y Nota SOAP.",
        ],
      },
    ],
  },
  {
    id: "patients",
    titulo: "Gestión de Pacientes",
    icono: "patients",
    descripcion: "Listado, búsqueda y registro de pacientes",
    contenido: [
      { tipo: "subtitulo", valor: "Listado de Pacientes" },
      {
        tipo: "texto",
        valor:
          "Cuadrícula de tarjetas mostrando todos los pacientes asignados. Cada tarjeta incluye:",
      },
      {
        tipo: "lista",
        items: [
          "Iniciales del paciente en un círculo azul.",
          "Indicador de estado del hardware (Online/Offline).",
          "Nombre completo, ID y nivel de desarrollo TEA.",
          'Botón "Gestionar Paciente": abre el Perfil Clínico del paciente.',
        ],
      },

      { tipo: "subtitulo", valor: "Búsqueda y Filtros" },
      {
        tipo: "lista",
        items: [
          "Campo de búsqueda: filtra pacientes por nombre o apellido.",
          "Filtro por nivel de desarrollo: seleccione Nivel 1, 2 o 3.",
        ],
      },

      { tipo: "subtitulo", valor: "Registrar Nuevo Paciente" },
      {
        tipo: "pasos",
        items: [
          'Haga clic en "Registrar Nuevo Niño" en la parte superior.',
          "Complete los datos del paciente: nombres, apellidos, fecha de nacimiento, género y nivel TEA.",
          "Complete los datos del representante: nombres, apellidos y correo electrónico.",
          'Presione "Crear Registro".',
          "El sistema generará un enlace de activación único para el representante.",
          "Copie el enlace y compártalo con el representante para que configure su cuenta.",
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          "Niveles TEA disponibles: Nivel 1 (Leve - necesita ayuda), Nivel 2 (Moderado - ayuda notable), Nivel 3 (Severo - ayuda muy notable).",
      },
    ],
  },
  {
    id: "student",
    titulo: "Perfil Clínico",
    icono: "student",
    descripcion: "Ficha del paciente con datos clínicos",
    contenido: [
      {
        tipo: "texto",
        valor:
          "Formulario de dos columnas con los datos maestros del paciente. Por defecto se muestra en modo lectura.",
      },

      { tipo: "subtitulo", valor: "Datos de Identidad" },
      {
        tipo: "tabla",
        encabezados: ["Campo", "Descripción"],
        filas: [
          [
            "Código Interno",
            "ID único del paciente en el sistema (solo lectura)",
          ],
          ["Nombres", "Nombres del estudiante"],
          ["Apellidos", "Apellidos del estudiante"],
          ["Fecha de Nacimiento", "Fecha de nacimiento del paciente"],
        ],
      },

      { tipo: "subtitulo", valor: "Parámetros Clínicos" },
      {
        tipo: "lista",
        items: [
          "Género: Masculino / Femenino.",
          "Nivel de Desarrollo: Nivel 1, 2 o 3 con sus descripciones clínicas.",
          "Perfil de Sensibilidad: Hipo-reactividad Auditiva, Hiper-reactividad Táctil, Perfil Sensorial Mixto.",
        ],
      },

      { tipo: "subtitulo", valor: "Editar Perfil" },
      {
        tipo: "pasos",
        items: [
          'Haga clic en "Editar Perfil" para habilitar la edición.',
          "Modifique los campos necesarios.",
          'Presione "Guardar Cambios" para persistir los datos.',
          'Presione "Cancelar" para descartar los cambios.',
        ],
      },
      {
        tipo: "nota",
        variante: "warning",
        valor:
          "Los cambios en el perfil clínico se reflejan inmediatamente en el sistema y son visibles para el representante.",
      },
    ],
  },
  {
    id: "historial",
    titulo: "Historial de Evolución",
    icono: "historial",
    descripcion: "KPIs, gráficos y análisis de crisis",
    contenido: [
      { tipo: "subtitulo", valor: "Indicadores Clave" },
      {
        tipo: "tabla",
        encabezados: ["Indicador", "Descripción"],
        filas: [
          [
            "Promedio de Calma",
            "Porcentaje promedio de tiempo en calma en las sesiones",
          ],
          [
            "Total de Sesiones",
            "Número total de sesiones terapéuticas registradas",
          ],
          [
            "Alertas Efectivas",
            "Porcentaje de intervenciones marcadas como efectivas",
          ],
        ],
      },

      { tipo: "subtitulo", valor: "Filtro de Fechas" },
      {
        tipo: "texto",
        valor:
          "Puede filtrar los datos por rango: Últimos 7 días, Este Mes o Todo el historial.",
      },

      { tipo: "subtitulo", valor: "Gráfico de Evolución" },
      {
        tipo: "texto",
        valor:
          "Gráfico de barras que muestra el porcentaje de tiempo en calma (pro_calm) por fecha. Las barras en azul indican >75% de calma; las grises indican ≤75%.",
      },

      { tipo: "subtitulo", valor: "Tabla de Registro Clínico" },
      {
        tipo: "texto",
        valor:
          "Tabla detallada con fecha, número de sesiones, efectividad (verde/rojo) y notas médicas.",
      },

      { tipo: "subtitulo", valor: "Análisis Fisiológico de Crisis" },
      {
        tipo: "texto",
        valor:
          "Panel avanzado que cruza datos del sensor MAX30102 (pulso) y MPU6050 (movimiento) para determinar el tipo de crisis:",
      },
      {
        tipo: "tabla",
        encabezados: ["Condición", "Diagnóstico"],
        filas: [
          [
            "BPM > umbral máximo + Mov < 3G",
            "Sobrecarga Sensorial Coherente (Estrés Emocional)",
          ],
          [
            "BPM > umbral máximo + Mov > 7G",
            "Hiperactividad Física / Esfuerzo Motor",
          ],
          [
            "Mov > 8G + BPM ≤ umbral",
            "Conducta Repetitiva / Estereotipia de Calma",
          ],
          ["Otros casos", "Estrés Fisiológico Moderado (Precrisis)"],
        ],
      },
      { tipo: "subtitulo", valor: "Exportar PDF" },
      {
        tipo: "texto",
        valor:
          'Haga clic en "Exportar PDF Médico" para descargar un reporte profesional con los datos de evolución, incluyendo logo, tabla estilizada y formato landscape.',
      },
    ],
  },
  {
    id: "home_analytics",
    titulo: "Análisis en Casa",
    icono: "home_analytics",
    descripcion: "Reportes del hogar enviados por el representante",
    contenido: [
      {
        tipo: "texto",
        valor:
          "Panel que cruza los datos del wearable fuera de la clínica con las notas registradas por el representante en el Diario de Hogar.",
      },

      { tipo: "subtitulo", valor: "Indicadores de Resumen" },
      {
        tipo: "tabla",
        encabezados: ["Indicador", "Descripción"],
        filas: [
          [
            "Promedio de Calma",
            "Porcentaje promedio de calma en el período analizado",
          ],
          ["Mejor Día", "Día con mayor porcentaje de calma"],
          ["Peor Día (Más Crisis)", "Día con mayor sobrecarga registrada"],
        ],
      },

      { tipo: "subtitulo", valor: "Gráfico: Balance Emocional por Día" },
      {
        tipo: "texto",
        valor:
          "Gráfico de barras apiladas que muestra la proporción de Calma (azul) vs Sobrecarga (rojo) por día. Las barras son clickeables para filtrar el detalle.",
      },

      { tipo: "subtitulo", valor: "Gráfico: Frecuencia Cardíaca" },
      {
        tipo: "texto",
        valor:
          "Gráfico de área que muestra la distribución de BPM durante el día seleccionado.",
      },

      { tipo: "subtitulo", valor: "Registro Clínico Detallado" },
      {
        tipo: "texto",
        valor:
          "Tabla filtrada por día que muestra hora de registro, BPM (rojo si >100) y resumen clínico con datos de sueño, estado de ánimo, apetito, crisis, digestión y medicación.",
      },
    ],
  },
  {
    id: "rutinas",
    titulo: "Asignación de Actividades",
    icono: "rutinas",
    descripcion: "Terapias, sesiones en vivo y constructor de rutinas",
    contenido: [
      { tipo: "subtitulo", valor: "Catálogo de Terapias" },
      {
        tipo: "texto",
        valor:
          "Cuadrícula de tarjetas con las terapias disponibles. Cada tarjeta muestra:",
      },
      {
        tipo: "lista",
        items: [
          "Categoría (Higiene, Terapéutico, Alimentación, Educativo, Regulación Sensorial).",
          "Duración estimada y título de la terapia.",
          "Instrucciones detalladas.",
          'Botón "Iniciar Sesión en Vivo".',
        ],
      },

      { tipo: "subtitulo", valor: "Constructor de Terapias" },
      {
        tipo: "texto",
        valor:
          "Panel deslizante (drawer) con 4 pestañas para crear terapias personalizadas:",
      },

      {
        tipo: "tabla",
        encabezados: ["Pestaña", "Campos"],
        filas: [
          [
            "Detalles Clínicos",
            "Nombre, categoría, duración estimada, dificultad (Baja/Media/Alta)",
          ],
          [
            "Paso a Paso",
            "Lista dinámica de pasos con instrucción y tiempo estimado",
          ],
          [
            "Materiales",
            "Materiales requeridos, imagen/pictograma (drag & drop), video de referencia (URL)",
          ],
          [
            "Metas PEI",
            "Descripción de meta, criterio de maestría, lista de metas actuales",
          ],
        ],
      },

      { tipo: "subtitulo", valor: "Sesión en Vivo" },
      {
        tipo: "pasos",
        items: [
          'Seleccione una terapia y presione "Iniciar Sesión en Vivo".',
          "Siga las instrucciones paso a paso mientras el cronómetro corre.",
          'Presione "Detener" para finalizar la sesión.',
          "Evalúe la cooperación del paciente (1-5 estrellas).",
          "Agregue notas u observaciones.",
          'Presione "Guardar Bitácora" para registrar la sesión.',
        ],
      },
    ],
  },
  {
    id: "inventario",
    titulo: "Calibración de Sensores",
    icono: "inventario",
    descripcion: "Gestión de dispositivos IoT y calibración fisiológica",
    contenido: [
      { tipo: "subtitulo", valor: "Gestión de Dispositivos" },
      { tipo: "texto", valor: "Grid de dispositivos IoT mostrando:" },
      {
        tipo: "lista",
        items: [
          "Estado Online/Offline con indicador verde/rojo.",
          "Nombre, ID y tipo de sensor.",
          "Barra de batería (verde >50%, amarillo >20%, rojo ≤20%).",
          "Barra de señal (azul >70%, amarillo >30%, gris ≤30%).",
          'Botón "Calibrar Sensor" para iniciar la calibración.',
        ],
      },

      { tipo: "subtitulo", valor: "Calibración de Línea Base (15 segundos)" },
      {
        tipo: "texto",
        valor:
          "Proceso de 3 pasos para establecer los umbrales personalizados del paciente:",
      },

      { tipo: "subtitulo", valor: "Paso 1: Preparación" },
      {
        tipo: "texto",
        valor:
          'El sistema explica la prueba de pulso en reposo de 15 segundos. Muestra los umbrales actuales (BPM mínimo y máximo). Presione "Iniciar Calibración" para comenzar.',
      },

      { tipo: "subtitulo", valor: "Paso 2: Medición" },
      {
        tipo: "texto",
        valor:
          "Animación de pulso con valores BPM fluctuando. Cuenta regresiva de 15 segundos con barra de progreso. El paciente debe permanecer en reposo.",
      },

      { tipo: "subtitulo", valor: "Paso 3: Resultados" },
      { tipo: "texto", valor: "Una vez completada la medición, se muestran:" },
      {
        tipo: "lista",
        items: [
          "Reposo Basal: BPM promedio del paciente en reposo.",
          "Umbral Mínimo: 90% del BPM basal.",
          "Umbral Máximo: 145% del BPM basal.",
          'Puede optar por "Repetir" o "Guardar y Aplicar Umbrales".',
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          "La calibración precisa permite que el sistema detecte automáticamente crisis de sobrecarga sensorial cuando el BPM supera el umbral máximo sin aceleración en el MPU6050.",
      },

      { tipo: "subtitulo", valor: "Agregar Nuevo Sensor" },
      {
        tipo: "lista",
        items: [
          'Presione "Nuevo Sensor" en la parte superior.',
          "Complete: nombre del sensor y tipo de dispositivo.",
          "Tipos disponibles: Pulsera Biométrica MAX30102, Acelerómetro MPU6050, Sensor Temperatura MLX90614, Casco EEG Básico.",
        ],
      },
    ],
  },
  {
    id: "soap",
    titulo: "Notas SOAP",
    icono: "soap",
    descripcion: "Documentación clínica estructurada",
    contenido: [
      {
        tipo: "texto",
        valor:
          "Formato de nota clínica SOAP (Subjetivo, Objetivo, Análisis, Plan) para documentar cada sesión terapéutica.",
      },
      {
        tipo: "tabla",
        encabezados: ["Campo", "Descripción", "Ejemplo"],
        filas: [
          [
            "S - Subjetivo",
            "Reporte de padres u observación libre",
            "El padre indica que el niño tuvo problemas para dormir",
          ],
          [
            "O - Objetivo",
            "Métricas y observaciones medibles",
            "Se completaron 3 de 4 ensayos de contacto visual",
          ],
          [
            "A - Análisis",
            "Evaluación clínica del profesional",
            "Adecuada tolerancia a estímulos táctiles hoy",
          ],
          [
            "P - Plan",
            "Próximos pasos y rutinas asignadas",
            "Asignar rutina visual de lavado de manos",
          ],
        ],
      },
      {
        tipo: "pasos",
        items: [
          'Desde el panel clínico del paciente, presione "Nota SOAP".',
          "Complete los 4 campos del formulario clínico.",
          'Presione "Firmar y Guardar Nota" para registrar.',
        ],
      },
    ],
  },
  {
    id: "indicaciones",
    titulo: "Indicaciones Médicas",
    icono: "indicaciones",
    descripcion: "Instrucciones para el representante",
    contenido: [
      {
        tipo: "texto",
        valor:
          "Las indicaciones médicas son instrucciones o recomendaciones que el especialista envía al representante. Son visibles inmediatamente en el Expediente Clínico del representante.",
      },
      {
        tipo: "pasos",
        items: [
          'Desde el panel clínico del paciente, presione "Anotar Indicación".',
          "Escriba las instrucciones en el área de texto.",
          'Presione "Guardar y Enviar".',
          "La indicación será visible inmediatamente para el representante.",
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          'Las indicaciones se muestran en el Expediente Clínico del representante, en la pestaña "Indicaciones Clínicas".',
      },
    ],
  },
  {
    id: "incidentes",
    titulo: "Registro de Incidentes",
    icono: "incidentes",
    descripcion: "Modelo ABC para documentar conductas",
    contenido: [
      {
        tipo: "texto",
        valor:
          "Formulario estructurado basado en el modelo ABC (Antecedente-Conducta-Consecuencia) para documentar incidentes conductuales.",
      },
      {
        tipo: "tabla",
        encabezados: ["Campo", "Opciones"],
        filas: [
          [
            "Tipo de Conducta",
            "Berrinche/Rabieta, Meltdown Sensorial, Estereotipia Repetitiva, Agresión, Autolesión",
          ],
          ["Duración Aprox.", "<1 min, 1-5 min, 5-15 min, >15 min"],
          [
            "Detonante (Antecedente)",
            "Transición, Demanda clínica, Ruido, Luces, Estímulo táctil, Retiro de objeto, Desconocido",
          ],
          ["Apoyo Aplicado", "Texto libre (ej. Respiración de la tortuga)"],
          ["Notas de Observación", "Texto libre"],
        ],
      },
      {
        tipo: "pasos",
        items: [
          'Desde el panel clínico del paciente, presione "Registrar Incidente".',
          "Complete el formulario con tipo, duración, detonante y notas.",
          'Presione "Guardar Incidente".',
        ],
      },
    ],
  },
  {
    id: "pei",
    titulo: "Metas PEI (Trial-by-Trial)",
    icono: "pei",
    descripcion: "Plan de Educación Individualizada",
    contenido: [
      {
        tipo: "texto",
        valor:
          "Las metas PEI (Plan de Educación Individualizada) permiten registrar el progreso de objetivos terapéuticos mediante ensayos discretos (trial-by-trial).",
      },
      {
        tipo: "lista",
        items: [
          "Cada meta tiene una descripción, un contador de ensayos (trials/totalTrials) y una barra de progreso.",
          'Presione el botón "+" para incrementar un ensayo exitoso.',
          "La barra de progreso se muestra en verde al alcanzar el 100%.",
          "Las metas se pueden crear desde el constructor de terapias (pestaña Metas PEI).",
        ],
      },
      { tipo: "subtitulo", valor: "Acciones disponibles" },
      {
        tipo: "lista",
        items: [
          "Incrementar ensayo: registra un ensayo exitoso en la meta.",
          "Crear meta: desde el constructor de terapias, complete descripción y criterio de maestría.",
          "Seguimiento visual: cada meta muestra el progreso en tiempo real.",
        ],
      },
    ],
  },
  {
    id: "solucion",
    titulo: "Solución de Problemas",
    icono: "solucion",
    descripcion: "Problemas comunes y soluciones",
    contenido: [
      {
        tipo: "tabla",
        encabezados: ["Problema", "Causa", "Solución"],
        filas: [
          [
            "No veo pacientes",
            "No hay pacientes asignados",
            "Contacte al administrador de la institución",
          ],
          [
            "No puedo acceder a una sección",
            "No hay paciente seleccionado",
            "Seleccione un paciente desde Gestión de Pacientes o la Agenda",
          ],
          [
            "La calibración no guarda",
            "Error de conexión",
            "Verifique la conexión con el backend y reintente",
          ],
          [
            "Error al crear meta PEI",
            "Datos incompletos",
            "Complete descripción y criterio de maestría",
          ],
          [
            "El representante no recibe indicaciones",
            "Cuenta inactiva",
            "Verifique que el representante tenga su cuenta activa",
          ],
          [
            "No aparecen datos de evolución",
            "Sin sesiones registradas",
            "Registre al menos una sesión para ver datos",
          ],
          [
            "No se actualizan los sensores IoT",
            "WebSocket desconectado",
            "Verifique la conexión del servidor de telemetría",
          ],
          [
            "Error al exportar PDF",
            "Datos vacíos",
            "Asegúrese de que haya datos en el historial",
          ],
        ],
      },
    ],
  },
  {
    id: "glosario",
    titulo: "Glosario",
    icono: "glosario",
    descripcion: "Términos técnicos y siglas",
    contenido: [
      {
        tipo: "tabla",
        encabezados: ["Término", "Definición"],
        filas: [
          ["TEA", "Trastorno del Espectro Autista"],
          ["PEI", "Plan de Educación Individualizada"],
          ["SOAP", "Nota clínica: Subjetivo, Objetivo, Análisis, Plan"],
          ["ABC", "Modelo Antecedente-Conducta-Consecuencia"],
          ["BPM", "Latidos por minuto (Beats Per Minute)"],
          ["IoT", "Internet de las Cosas — dispositivos conectados"],
          ["MAX30100/102", "Sensor óptico de frecuencia cardíaca"],
          ["MPU6050", "Acelerómetro y giroscopio de 3 ejes"],
          ["Línea Base", "Medición fisiológica de referencia del paciente"],
          [
            "Trial-by-Trial",
            "Registro de ensayos discretos para metas terapéuticas",
          ],
          ["Meltdown", "Crisis sensorial por sobrecarga de estímulos"],
          ["Estereotipia", "Movimientos repetitivos comunes en TEA"],
          ["HIP", "Hipo-reactividad sensorial (menor sensibilidad)"],
          ["Sensorial Mixto", "Perfil con hipo e hiper-reactividad combinadas"],
          ["AAC", "Comunicación Aumentativa y Alternativa"],
        ],
      },
    ],
  },
];

export async function exportManualPDFEspecialista() {
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = 210;
  const pageH = 297;
  const margin = 12;
  const contentW = pageW - margin * 2;
  const maxY = 275;
  const headerH = 14;
  const lineH = 4;

  let logoData = null;
  try {
    const img = new Image();
    img.src = logoPath;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    logoData = canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("Logo no disponible para PDF:", e);
  }

  const secciones = seccionesManualEspecialista;

  const addHeader = (doc, pageNum, totalPages, sectionTitle) => {
    if (logoData) {
      doc.addImage(logoData, "PNG", pageW - margin - 22, 4, 18, 18);
    }
    doc.setFontSize(6);
    doc.setTextColor(160, 160, 160);
    doc.text(
      `SIAT — Manual del Especialista v1.0 | ${sectionTitle}`,
      margin,
      10,
    );
    doc.text(`${pageNum} / ${totalPages}`, pageW - margin, 10, {
      align: "right",
    });
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, 12, pageW - margin, 12);
  };

  const addFooter = (doc, y) => {
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageW - margin, y);
  };

  const checkPage = (needed) => {
    if (yy + needed > maxY) {
      addFooter(doc, yy + 2);
      doc.addPage();
      pageNum++;
      addHeader(doc, pageNum, totalPages, sectionTitle);
      yy = headerH + 4;
    }
  };

  // ---- PORTADA ----
  doc.setFillColor(1, 28, 63);
  doc.rect(0, 0, pageW, pageH, "F");
  doc.setTextColor(255, 255, 255);
  if (logoData) {
    doc.addImage(logoData, "PNG", pageW / 2 - 20, 50, 40, 40);
  }
  doc.setFontSize(26);
  doc.text("Manual de Usuario", pageW / 2, 110, { align: "center" });
  doc.setFontSize(16);
  doc.text("Módulo del Especialista", pageW / 2, 120, { align: "center" });
  doc.setFontSize(11);
  doc.text(
    "SIAT — Sistema Integrado de Asistencia Terapéutica",
    pageW / 2,
    135,
    { align: "center" },
  );
  doc.setFontSize(9);
  doc.text(
    `Versión 1.0 — ${new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })}`,
    pageW / 2,
    145,
    { align: "center" },
  );
  doc.text("Funauta — Fundación de Apoyo al Autista", pageW / 2, 160, {
    align: "center",
  });

  // ---- ÍNDICE ----
  doc.addPage();
  doc.setTextColor(1, 28, 63);
  doc.setFontSize(14);
  doc.text("Índice de Contenidos", margin, 20);
  doc.setDrawColor(1, 28, 63);
  doc.setLineWidth(0.3);
  doc.line(margin, 23, pageW - margin, 23);
  let y = 30;
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  secciones.forEach((sec, i) => {
    if (y > 265) {
      doc.addPage();
      y = 20;
    }
    doc.text(
      `${String(i + 1).padStart(2, "0")}   ${sec.titulo}`,
      margin + 2,
      y,
    );
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(sec.descripcion, margin + 14, y + 3.5);
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    y += 8;
  });

  // ---- CONTENIDO ----
  const totalPages = secciones.length + 1;
  let pageNum = 2;
  let sectionTitle = secciones[0].titulo;
  doc.addPage();
  pageNum++;
  addHeader(doc, pageNum, totalPages, sectionTitle);
  let yy = headerH + 4;

  secciones.forEach((sec, idx) => {
    const estTitleLines = 6;
    checkPage(estTitleLines + 3);

    doc.setFillColor(1, 28, 63);
    doc.rect(margin, yy - 1.5, contentW, 5.5, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(sec.titulo, margin + 2, yy + 2.5);
    doc.setTextColor(60, 60, 60);
    sectionTitle = sec.titulo;
    yy += 7.5;

    sec.contenido.forEach((bloque) => {
      checkPage(0);

      switch (bloque.tipo) {
        case "texto":
          doc.setFontSize(8);
          const txtLines = doc.splitTextToSize(bloque.valor, contentW);
          checkPage(txtLines.length * lineH + 2);
          doc.text(txtLines, margin, yy);
          yy += txtLines.length * lineH + 1.5;
          break;

        case "subtitulo":
          checkPage(6);
          doc.setFontSize(9);
          doc.setTextColor(1, 60, 100);
          doc.text(bloque.valor, margin, yy);
          yy += 5;
          doc.setTextColor(60, 60, 60);
          break;

        case "lista":
          doc.setFontSize(8);
          bloque.items.forEach((item) => {
            const iLines = doc.splitTextToSize(`• ${item}`, contentW - 4);
            checkPage(iLines.length * lineH + 1);
            doc.text(iLines, margin + 4, yy);
            yy += iLines.length * lineH + 0.5;
          });
          yy += 1.5;
          break;

        case "pasos":
          doc.setFontSize(8);
          bloque.items.forEach((item, i) => {
            const sLines = doc.splitTextToSize(
              `${i + 1}. ${item}`,
              contentW - 4,
            );
            checkPage(sLines.length * lineH + 1);
            doc.text(sLines, margin + 4, yy);
            yy += sLines.length * lineH + 0.5;
          });
          yy += 1.5;
          break;

        case "tabla":
          if (bloque.filas.length > 0) {
            try {
              const colCount = bloque.encabezados.length;
              const colW = contentW / colCount;
              autoTable(doc, {
                head: [bloque.encabezados],
                body: bloque.filas,
                startY: Math.min(yy, maxY - 15),
                margin: { left: margin, right: margin },
                styles: { fontSize: 7, cellPadding: 1.5 },
                headStyles: {
                  fillColor: [1, 60, 100],
                  textColor: [255, 255, 255],
                  fontSize: 7,
                  fontStyle: "bold",
                },
                columnStyles: Object.fromEntries(
                  bloque.encabezados.map((_, i) => [i, { cellWidth: colW }]),
                ),
                tableLineColor: [220, 220, 220],
                tableLineWidth: 0.1,
                didDrawPage: () => {
                  pageNum++;
                  addHeader(doc, pageNum, totalPages, sectionTitle);
                  yy = headerH + 4;
                },
              });
              yy = doc.lastAutoTable.finalY + 4;
            } catch {
              yy += 3;
            }
          }
          break;

        case "nota": {
          doc.setFontSize(7.5);
          doc.setTextColor(90, 90, 90);
          const nIcon =
            bloque.variante === "warning"
              ? "⚠ "
              : bloque.variante === "success"
                ? "✓ "
                : "ℹ ";
          const nLines = doc.splitTextToSize(
            nIcon + bloque.valor,
            contentW - 8,
          );
          const noteH = nLines.length * lineH + 4;
          checkPage(noteH + 3);
          const colorMap = {
            info: [230, 240, 255],
            warning: [255, 245, 220],
            success: [225, 245, 225],
          };
          const bg = colorMap[bloque.variante] || [230, 240, 255];
          doc.setFillColor(bg[0], bg[1], bg[2]);
          doc.roundedRect(margin, yy - 1, contentW, noteH, 1, 1, "F");
          doc.setDrawColor(180, 180, 180);
          doc.roundedRect(margin, yy - 1, contentW, noteH, 1, 1, "S");
          doc.text(nLines, margin + 4, yy + 2);
          yy += noteH + 3;
          doc.setTextColor(60, 60, 60);
          break;
        }
      }
    });

    yy += 2;
  });

  addFooter(doc, yy + 2);
  doc.save("manual_usuario_especialista_siat.pdf");
}
