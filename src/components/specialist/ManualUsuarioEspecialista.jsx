import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoPath from '../../../Logo.png';
import {
  BookOpen, Download, Search, LayoutDashboard, Users, UserCircle,
  TrendingUp, LineChart, Puzzle, Cpu, HelpCircle, BookMarked, Sun,
  ChevronRight, Printer, Maximize2, Minimize2, Info, AlertTriangle,
  CheckCircle, GraduationCap, Activity, Heart, Brain,
  Book, ClipboardList, Target, Stethoscope
} from 'lucide-react';
import Sidebar from '../Sidebar';
import Topbar from '../Topbar';

const iconos = {
  dashboard: LayoutDashboard,
  patients: Users,
  student: UserCircle,
  historial: TrendingUp,
  home_analytics: LineChart,
  rutinas: Puzzle,
  inventario: Cpu,
  introduccion: BookOpen,
  estructura: BookMarked,
  soap: ClipboardList,
  indicaciones: Stethoscope,
  incidentes: AlertTriangle,
  pei: Target,
  calibracion: Activity,
  crisis: Heart,
  solucion: HelpCircle,
  glosario: GraduationCap,
  default: Info
};

const secciones = [
  {
    id: 'introduccion',
    titulo: 'Introducción',
    icono: 'introduccion',
    descripcion: 'Bienvenido al sistema SIAT para especialistas',
    contenido: [
      { tipo: 'texto', valor: 'El módulo de Especialista está diseñado para profesionales de la salud (terapeutas, psicólogos, médicos) que trabajan con niños con Trastorno del Espectro Autista (TEA). Desde este panel podrá gestionar pacientes, registrar sesiones, crear metas PEI, documentar notas clínicas SOAP, monitorear la evolución, calibrar sensores IoT y coordinar el plan terapéutico con los representantes.' },
      { tipo: 'texto', valor: 'SIAT integra wearables IoT (pulseras biométricas) que permiten la detección temprana de crisis de sobrecarga sensorial, brindando datos objetivos para la toma de decisiones clínicas.' }
    ]
  },
  {
    id: 'estructura',
    titulo: 'Estructura del Panel',
    icono: 'estructura',
    descripcion: 'Distribución de la interfaz del especialista',
    contenido: [
      { tipo: 'texto', valor: 'El panel del especialista se compone de:' },
      { tipo: 'lista', items: [
        'Barra lateral izquierda: Navegación entre las 7 secciones del panel.',
        'Barra superior: Nombre del usuario, campana de notificaciones y modo oscuro.',
        'Área principal: Contenido dinámico según la sección seleccionada.'
      ]},
      { tipo: 'subtitulo', valor: 'Secciones de la Barra Lateral' },
      { tipo: 'tabla', encabezados: ['Sección', 'Descripción'],
        filas: [
          ['Resumen Global', 'KPIs, agenda del día y alertas de todos los pacientes.'],
          ['Gestión de Pacientes', 'Listado de pacientes con búsqueda, filtros y registro de nuevos niños.'],
          ['Perfil Clínico', 'Ficha del paciente con datos de identidad, nivel TEA y perfil sensorial.'],
          ['Historial de Evolución', 'KPIs de progreso, gráficos de evolución y análisis fisiológico de crisis.'],
          ['Análisis en Casa', 'Reportes del hogar enviados por el representante (sueño, ánimo, crisis).'],
          ['Asignación de Actividades', 'Catálogo de terapias, constructor de rutinas y sesiones en vivo.'],
          ['Calibración de Sensores', 'Gestión de dispositivos IoT y calibración de línea base fisiológica.'],
          ['Manual de Usuario', 'Esta guía de referencia completa.']
        ]
      },
      { tipo: 'nota', variante: 'info', valor: 'Las secciones Historial, Análisis en Casa y Actividades requieren tener un paciente seleccionado previamente.' }
    ]
  },
  {
    id: 'dashboard',
    titulo: 'Resumen Global',
    icono: 'dashboard',
    descripcion: 'Vista general con KPIs, agenda y alertas',
    contenido: [
      { tipo: 'subtitulo', valor: 'Vista Global (sin paciente seleccionado)' },
      { tipo: 'texto', valor: 'Al ingresar al panel, se muestra una visión general de toda la carga clínica:' },

      { tipo: 'subtitulo', valor: 'Indicadores Clave (KPIs)' },
      { tipo: 'tabla', encabezados: ['KPI', 'Descripción'],
        filas: [
          ['Pacientes Activos', 'Total de niños asignados al especialista'],
          ['Citas Hoy', 'Número de consultas agendadas para el día actual'],
          ['Cumplimiento PEI', 'Porcentaje promedio de avance en metas PEI'],
          ['Alertas (24h)', 'Alertas de crisis registradas en las últimas 24 horas']
        ]
      },

      { tipo: 'subtitulo', valor: 'Agenda Clínica del Día' },
      { tipo: 'texto', valor: 'Lista de citas del día obtenidas del sistema. Cada cita muestra:' },
      { tipo: 'lista', items: [
        'Hora programada y estado (Completada / En Progreso / Pendiente).',
        'Nombre del paciente y tipo de cita.',
        'Botón "Ir a Paciente": carga el panel clínico del paciente.',
        'Botón "Completar": marca la cita como finalizada.'
      ]},

      { tipo: 'subtitulo', valor: 'Alertas Globales' },
      { tipo: 'texto', valor: 'Feed de novedades con las alertas más recientes de todos los pacientes, mostrando timestamp, nombre del paciente y descripción de la alerta.' },

      { tipo: 'subtitulo', valor: 'Panel Clínico (con paciente seleccionado)' },
      { tipo: 'texto', valor: 'Al seleccionar un paciente (desde la agenda o desde Gestión de Pacientes), se despliega el panel clínico con:' },
      { tipo: 'lista', items: [
        'Metas PEI (trial-by-trial): progreso de objetivos terapéuticos.',
        'Gráfico Sensorial: distribución de detonantes de crisis.',
        'Gráfico Conductual: tendencia semanal de incidentes.',
        'Botones de acción rápida: Incidente, Indicación y Nota SOAP.'
      ]}
    ]
  },
  {
    id: 'patients',
    titulo: 'Gestión de Pacientes',
    icono: 'patients',
    descripcion: 'Listado, búsqueda y registro de pacientes',
    contenido: [
      { tipo: 'subtitulo', valor: 'Listado de Pacientes' },
      { tipo: 'texto', valor: 'Cuadrícula de tarjetas mostrando todos los pacientes asignados. Cada tarjeta incluye:' },
      { tipo: 'lista', items: [
        'Iniciales del paciente en un círculo azul.',
        'Indicador de estado del hardware (Online/Offline).',
        'Nombre completo, ID y nivel de desarrollo TEA.',
        'Botón "Gestionar Paciente": abre el Perfil Clínico del paciente.'
      ]},

      { tipo: 'subtitulo', valor: 'Búsqueda y Filtros' },
      { tipo: 'lista', items: [
        'Campo de búsqueda: filtra pacientes por nombre o apellido.',
        'Filtro por nivel de desarrollo: seleccione Nivel 1, 2 o 3.'
      ]},

      { tipo: 'subtitulo', valor: 'Registrar Nuevo Paciente' },
      { tipo: 'pasos', items: [
        'Haga clic en "Registrar Nuevo Niño" en la parte superior.',
        'Complete los datos del paciente: nombres, apellidos, fecha de nacimiento, género y nivel TEA.',
        'Complete los datos del representante: nombres, apellidos y correo electrónico.',
        'Presione "Crear Registro".',
        'El sistema generará un enlace de activación único para el representante.',
        'Copie el enlace y compártalo con el representante para que configure su cuenta.'
      ]},
      { tipo: 'nota', variante: 'info', valor: 'Niveles TEA disponibles: Nivel 1 (Leve - necesita ayuda), Nivel 2 (Moderado - ayuda notable), Nivel 3 (Severo - ayuda muy notable).' }
    ]
  },
  {
    id: 'student',
    titulo: 'Perfil Clínico',
    icono: 'student',
    descripcion: 'Ficha del paciente con datos clínicos',
    contenido: [
      { tipo: 'texto', valor: 'Formulario de dos columnas con los datos maestros del paciente. Por defecto se muestra en modo lectura.' },

      { tipo: 'subtitulo', valor: 'Datos de Identidad' },
      { tipo: 'tabla', encabezados: ['Campo', 'Descripción'],
        filas: [
          ['Código Interno', 'ID único del paciente en el sistema (solo lectura)'],
          ['Nombres', 'Nombres del estudiante'],
          ['Apellidos', 'Apellidos del estudiante'],
          ['Fecha de Nacimiento', 'Fecha de nacimiento del paciente']
        ]
      },

      { tipo: 'subtitulo', valor: 'Parámetros Clínicos' },
      { tipo: 'lista', items: [
        'Género: Masculino / Femenino.',
        'Nivel de Desarrollo: Nivel 1, 2 o 3 con sus descripciones clínicas.',
        'Perfil de Sensibilidad: Hipo-reactividad Auditiva, Hiper-reactividad Táctil, Perfil Sensorial Mixto.'
      ]},

      { tipo: 'subtitulo', valor: 'Editar Perfil' },
      { tipo: 'pasos', items: [
        'Haga clic en "Editar Perfil" para habilitar la edición.',
        'Modifique los campos necesarios.',
        'Presione "Guardar Cambios" para persistir los datos.',
        'Presione "Cancelar" para descartar los cambios.'
      ]},
      { tipo: 'nota', variante: 'warning', valor: 'Los cambios en el perfil clínico se reflejan inmediatamente en el sistema y son visibles para el representante.' }
    ]
  },
  {
    id: 'historial',
    titulo: 'Historial de Evolución',
    icono: 'historial',
    descripcion: 'KPIs, gráficos y análisis de crisis',
    contenido: [
      { tipo: 'subtitulo', valor: 'Indicadores Clave' },
      { tipo: 'tabla', encabezados: ['Indicador', 'Descripción'],
        filas: [
          ['Promedio de Calma', 'Porcentaje promedio de tiempo en calma en las sesiones'],
          ['Total de Sesiones', 'Número total de sesiones terapéuticas registradas'],
          ['Alertas Efectivas', 'Porcentaje de intervenciones marcadas como efectivas']
        ]
      },

      { tipo: 'subtitulo', valor: 'Filtro de Fechas' },
      { tipo: 'texto', valor: 'Puede filtrar los datos por rango: Últimos 7 días, Este Mes o Todo el historial.' },

      { tipo: 'subtitulo', valor: 'Gráfico de Evolución' },
      { tipo: 'texto', valor: 'Gráfico de barras que muestra el porcentaje de tiempo en calma (pro_calm) por fecha. Las barras en azul indican >75% de calma; las grises indican ≤75%.' },

      { tipo: 'subtitulo', valor: 'Tabla de Registro Clínico' },
      { tipo: 'texto', valor: 'Tabla detallada con fecha, número de sesiones, efectividad (verde/rojo) y notas médicas.' },

      { tipo: 'subtitulo', valor: 'Análisis Fisiológico de Crisis' },
      { tipo: 'texto', valor: 'Panel avanzado que cruza datos del sensor MAX30102 (pulso) y MPU6050 (movimiento) para determinar el tipo de crisis:' },
      { tipo: 'tabla', encabezados: ['Condición', 'Diagnóstico'],
        filas: [
          ['BPM > umbral máximo + Mov < 3G', 'Sobrecarga Sensorial Coherente (Estrés Emocional)'],
          ['BPM > umbral máximo + Mov > 7G', 'Hiperactividad Física / Esfuerzo Motor'],
          ['Mov > 8G + BPM ≤ umbral', 'Conducta Repetitiva / Estereotipia de Calma'],
          ['Otros casos', 'Estrés Fisiológico Moderado (Precrisis)']
        ]
      },
      { tipo: 'subtitulo', valor: 'Exportar PDF' },
      { tipo: 'texto', valor: 'Haga clic en "Exportar PDF Médico" para descargar un reporte profesional con los datos de evolución, incluyendo logo, tabla estilizada y formato landscape.' }
    ]
  },
  {
    id: 'home_analytics',
    titulo: 'Análisis en Casa',
    icono: 'home_analytics',
    descripcion: 'Reportes del hogar enviados por el representante',
    contenido: [
      { tipo: 'texto', valor: 'Panel que cruza los datos del wearable fuera de la clínica con las notas registradas por el representante en el Diario de Hogar.' },

      { tipo: 'subtitulo', valor: 'Indicadores de Resumen' },
      { tipo: 'tabla', encabezados: ['Indicador', 'Descripción'],
        filas: [
          ['Promedio de Calma', 'Porcentaje promedio de calma en el período analizado'],
          ['Mejor Día', 'Día con mayor porcentaje de calma'],
          ['Peor Día (Más Crisis)', 'Día con mayor sobrecarga registrada']
        ]
      },

      { tipo: 'subtitulo', valor: 'Gráfico: Balance Emocional por Día' },
      { tipo: 'texto', valor: 'Gráfico de barras apiladas que muestra la proporción de Calma (azul) vs Sobrecarga (rojo) por día. Las barras son clickeables para filtrar el detalle.' },

      { tipo: 'subtitulo', valor: 'Gráfico: Frecuencia Cardíaca' },
      { tipo: 'texto', valor: 'Gráfico de área que muestra la distribución de BPM durante el día seleccionado.' },

      { tipo: 'subtitulo', valor: 'Registro Clínico Detallado' },
      { tipo: 'texto', valor: 'Tabla filtrada por día que muestra hora de registro, BPM (rojo si >100) y resumen clínico con datos de sueño, estado de ánimo, apetito, crisis, digestión y medicación.' }
    ]
  },
  {
    id: 'rutinas',
    titulo: 'Asignación de Actividades',
    icono: 'rutinas',
    descripcion: 'Terapias, sesiones en vivo y constructor de rutinas',
    contenido: [
      { tipo: 'subtitulo', valor: 'Catálogo de Terapias' },
      { tipo: 'texto', valor: 'Cuadrícula de tarjetas con las terapias disponibles. Cada tarjeta muestra:' },
      { tipo: 'lista', items: [
        'Categoría (Higiene, Terapéutico, Alimentación, Educativo, Regulación Sensorial).',
        'Duración estimada y título de la terapia.',
        'Instrucciones detalladas.',
        'Botón "Iniciar Sesión en Vivo".'
      ]},

      { tipo: 'subtitulo', valor: 'Constructor de Terapias' },
      { tipo: 'texto', valor: 'Panel deslizante (drawer) con 4 pestañas para crear terapias personalizadas:' },

      { tipo: 'tabla', encabezados: ['Pestaña', 'Campos'],
        filas: [
          ['Detalles Clínicos', 'Nombre, categoría, duración estimada, dificultad (Baja/Media/Alta)'],
          ['Paso a Paso', 'Lista dinámica de pasos con instrucción y tiempo estimado'],
          ['Materiales', 'Materiales requeridos, imagen/pictograma (drag & drop), video de referencia (URL)'],
          ['Metas PEI', 'Descripción de meta, criterio de maestría, lista de metas actuales']
        ]
      },

      { tipo: 'subtitulo', valor: 'Sesión en Vivo' },
      { tipo: 'pasos', items: [
        'Seleccione una terapia y presione "Iniciar Sesión en Vivo".',
        'Siga las instrucciones paso a paso mientras el cronómetro corre.',
        'Presione "Detener" para finalizar la sesión.',
        'Evalúe la cooperación del paciente (1-5 estrellas).',
        'Agregue notas u observaciones.',
        'Presione "Guardar Bitácora" para registrar la sesión.'
      ]}
    ]
  },
  {
    id: 'inventario',
    titulo: 'Calibración de Sensores',
    icono: 'inventario',
    descripcion: 'Gestión de dispositivos IoT y calibración fisiológica',
    contenido: [
      { tipo: 'subtitulo', valor: 'Gestión de Dispositivos' },
      { tipo: 'texto', valor: 'Grid de dispositivos IoT mostrando:' },
      { tipo: 'lista', items: [
        'Estado Online/Offline con indicador verde/rojo.',
        'Nombre, ID y tipo de sensor.',
        'Barra de batería (verde >50%, amarillo >20%, rojo ≤20%).',
        'Barra de señal (azul >70%, amarillo >30%, gris ≤30%).',
        'Botón "Calibrar Sensor" para iniciar la calibración.'
      ]},

      { tipo: 'subtitulo', valor: 'Calibración de Línea Base (15 segundos)' },
      { tipo: 'texto', valor: 'Proceso de 3 pasos para establecer los umbrales personalizados del paciente:' },

      { tipo: 'subtitulo', valor: 'Paso 1: Preparación' },
      { tipo: 'texto', valor: 'El sistema explica la prueba de pulso en reposo de 15 segundos. Muestra los umbrales actuales (BPM mínimo y máximo). Presione "Iniciar Calibración" para comenzar.' },

      { tipo: 'subtitulo', valor: 'Paso 2: Medición' },
      { tipo: 'texto', valor: 'Animación de pulso con valores BPM fluctuando. Cuenta regresiva de 15 segundos con barra de progreso. El paciente debe permanecer en reposo.' },

      { tipo: 'subtitulo', valor: 'Paso 3: Resultados' },
      { tipo: 'texto', valor: 'Una vez completada la medición, se muestran:' },
      { tipo: 'lista', items: [
        'Reposo Basal: BPM promedio del paciente en reposo.',
        'Umbral Mínimo: 90% del BPM basal.',
        'Umbral Máximo: 145% del BPM basal.',
        'Puede optar por "Repetir" o "Guardar y Aplicar Umbrales".'
      ]},
      { tipo: 'nota', variante: 'info', valor: 'La calibración precisa permite que el sistema detecte automáticamente crisis de sobrecarga sensorial cuando el BPM supera el umbral máximo sin aceleración en el MPU6050.' },

      { tipo: 'subtitulo', valor: 'Agregar Nuevo Sensor' },
      { tipo: 'lista', items: [
        'Presione "Nuevo Sensor" en la parte superior.',
        'Complete: nombre del sensor y tipo de dispositivo.',
        'Tipos disponibles: Pulsera Biométrica MAX30102, Acelerómetro MPU6050, Sensor Temperatura MLX90614, Casco EEG Básico.'
      ]}
    ]
  },
  {
    id: 'soap',
    titulo: 'Notas SOAP',
    icono: 'soap',
    descripcion: 'Documentación clínica estructurada',
    contenido: [
      { tipo: 'texto', valor: 'Formato de nota clínica SOAP (Subjetivo, Objetivo, Análisis, Plan) para documentar cada sesión terapéutica.' },
      { tipo: 'tabla', encabezados: ['Campo', 'Descripción', 'Ejemplo'],
        filas: [
          ['S - Subjetivo', 'Reporte de padres u observación libre', 'El padre indica que el niño tuvo problemas para dormir'],
          ['O - Objetivo', 'Métricas y observaciones medibles', 'Se completaron 3 de 4 ensayos de contacto visual'],
          ['A - Análisis', 'Evaluación clínica del profesional', 'Adecuada tolerancia a estímulos táctiles hoy'],
          ['P - Plan', 'Próximos pasos y rutinas asignadas', 'Asignar rutina visual de lavado de manos']
        ]
      },
      { tipo: 'pasos', items: [
        'Desde el panel clínico del paciente, presione "Nota SOAP".',
        'Complete los 4 campos del formulario clínico.',
        'Presione "Firmar y Guardar Nota" para registrar.'
      ]}
    ]
  },
  {
    id: 'indicaciones',
    titulo: 'Indicaciones Médicas',
    icono: 'indicaciones',
    descripcion: 'Instrucciones para el representante',
    contenido: [
      { tipo: 'texto', valor: 'Las indicaciones médicas son instrucciones o recomendaciones que el especialista envía al representante. Son visibles inmediatamente en el Expediente Clínico del representante.' },
      { tipo: 'pasos', items: [
        'Desde el panel clínico del paciente, presione "Anotar Indicación".',
        'Escriba las instrucciones en el área de texto.',
        'Presione "Guardar y Enviar".',
        'La indicación será visible inmediatamente para el representante.'
      ]},
      { tipo: 'nota', variante: 'info', valor: 'Las indicaciones se muestran en el Expediente Clínico del representante, en la pestaña "Indicaciones Clínicas".' }
    ]
  },
  {
    id: 'incidentes',
    titulo: 'Registro de Incidentes',
    icono: 'incidentes',
    descripcion: 'Modelo ABC para documentar conductas',
    contenido: [
      { tipo: 'texto', valor: 'Formulario estructurado basado en el modelo ABC (Antecedente-Conducta-Consecuencia) para documentar incidentes conductuales.' },
      { tipo: 'tabla', encabezados: ['Campo', 'Opciones'],
        filas: [
          ['Tipo de Conducta', 'Berrinche/Rabieta, Meltdown Sensorial, Estereotipia Repetitiva, Agresión, Autolesión'],
          ['Duración Aprox.', '<1 min, 1-5 min, 5-15 min, >15 min'],
          ['Detonante (Antecedente)', 'Transición, Demanda clínica, Ruido, Luces, Estímulo táctil, Retiro de objeto, Desconocido'],
          ['Apoyo Aplicado', 'Texto libre (ej. Respiración de la tortuga)'],
          ['Notas de Observación', 'Texto libre']
        ]
      },
      { tipo: 'pasos', items: [
        'Desde el panel clínico del paciente, presione "Registrar Incidente".',
        'Complete el formulario con tipo, duración, detonante y notas.',
        'Presione "Guardar Incidente".'
      ]}
    ]
  },
  {
    id: 'pei',
    titulo: 'Metas PEI (Trial-by-Trial)',
    icono: 'pei',
    descripcion: 'Plan de Educación Individualizada',
    contenido: [
      { tipo: 'texto', valor: 'Las metas PEI (Plan de Educación Individualizada) permiten registrar el progreso de objetivos terapéuticos mediante ensayos discretos (trial-by-trial).' },
      { tipo: 'lista', items: [
        'Cada meta tiene una descripción, un contador de ensayos (trials/totalTrials) y una barra de progreso.',
        'Presione el botón "+" para incrementar un ensayo exitoso.',
        'La barra de progreso se muestra en verde al alcanzar el 100%.',
        'Las metas se pueden crear desde el constructor de terapias (pestaña Metas PEI).'
      ]},
      { tipo: 'subtitulo', valor: 'Acciones disponibles' },
      { tipo: 'lista', items: [
        'Incrementar ensayo: registra un ensayo exitoso en la meta.',
        'Crear meta: desde el constructor de terapias, complete descripción y criterio de maestría.',
        'Seguimiento visual: cada meta muestra el progreso en tiempo real.'
      ]}
    ]
  },
  {
    id: 'solucion',
    titulo: 'Solución de Problemas',
    icono: 'solucion',
    descripcion: 'Problemas comunes y soluciones',
    contenido: [
      { tipo: 'tabla', encabezados: ['Problema', 'Causa', 'Solución'],
        filas: [
          ['No veo pacientes', 'No hay pacientes asignados', 'Contacte al administrador de la institución'],
          ['No puedo acceder a una sección', 'No hay paciente seleccionado', 'Seleccione un paciente desde Gestión de Pacientes o la Agenda'],
          ['La calibración no guarda', 'Error de conexión', 'Verifique la conexión con el backend y reintente'],
          ['Error al crear meta PEI', 'Datos incompletos', 'Complete descripción y criterio de maestría'],
          ['El representante no recibe indicaciones', 'Cuenta inactiva', 'Verifique que el representante tenga su cuenta activa'],
          ['No aparecen datos de evolución', 'Sin sesiones registradas', 'Registre al menos una sesión para ver datos'],
          ['No se actualizan los sensores IoT', 'WebSocket desconectado', 'Verifique la conexión del servidor de telemetría'],
          ['Error al exportar PDF', 'Datos vacíos', 'Asegúrese de que haya datos en el historial']
        ]
      }
    ]
  },
  {
    id: 'glosario',
    titulo: 'Glosario',
    icono: 'glosario',
    descripcion: 'Términos técnicos y siglas',
    contenido: [
      { tipo: 'tabla', encabezados: ['Término', 'Definición'],
        filas: [
          ['TEA', 'Trastorno del Espectro Autista'],
          ['PEI', 'Plan de Educación Individualizada'],
          ['SOAP', 'Nota clínica: Subjetivo, Objetivo, Análisis, Plan'],
          ['ABC', 'Modelo Antecedente-Conducta-Consecuencia'],
          ['BPM', 'Latidos por minuto (Beats Per Minute)'],
          ['IoT', 'Internet de las Cosas — dispositivos conectados'],
          ['MAX30100/102', 'Sensor óptico de frecuencia cardíaca'],
          ['MPU6050', 'Acelerómetro y giroscopio de 3 ejes'],
          ['Línea Base', 'Medición fisiológica de referencia del paciente'],
          ['Trial-by-Trial', 'Registro de ensayos discretos para metas terapéuticas'],
          ['Meltdown', 'Crisis sensorial por sobrecarga de estímulos'],
          ['Estereotipia', 'Movimientos repetitivos comunes en TEA'],
          ['HIP', 'Hipo-reactividad sensorial (menor sensibilidad)'],
          ['Sensorial Mixto', 'Perfil con hipo e hiper-reactividad combinadas'],
          ['AAC', 'Comunicación Aumentativa y Alternativa']
        ]
      }
    ]
  }
];

function ContenidoRenderer({ bloque }) {
  switch (bloque.tipo) {
    case 'texto':
      return <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{bloque.valor}</p>;
    case 'subtitulo':
      return <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-5 mb-3">{bloque.valor}</h4>;
    case 'lista':
      return (
        <ul className="space-y-1.5 mt-2">
          {bloque.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'pasos':
      return (
        <ol className="space-y-2 mt-2">
          {bloque.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span className="pt-0.5">{item}</span>
            </li>
          ))}
        </ol>
      );
    case 'tabla':
      return (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 mt-3 mb-3">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                {bloque.encabezados.map((h, i) => (
                  <th key={i} className="px-4 py-2.5 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {bloque.filas.map((fila, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  {fila.map((celda, j) => (
                    <td key={j} className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{celda}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'nota': {
      const colores = {
        info: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-400',
        warning: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-400',
        success: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-400'
      };
      const IconoNote = bloque.variante === 'warning' ? AlertTriangle : bloque.variante === 'success' ? CheckCircle : Info;
      return (
        <div className={`flex items-start gap-3 p-4 rounded-lg border text-sm mt-3 ${colores[bloque.variante] || colores.info}`}>
          <IconoNote className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{bloque.valor}</span>
        </div>
      );
    }
    default:
      return null;
  }
}

export default function ManualUsuarioEspecialista() {
  const [searchTerm, setSearchTerm] = useState('');
  const [seccionesAbiertas, setSeccionesAbiertas] = useState(new Set(['introduccion']));
  const [fullscreen, setFullscreen] = useState(false);
  const contentRef = useRef(null);

  const toggleSeccion = (id) => {
    setSeccionesAbiertas(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredSecciones = useMemo(() =>
    secciones.filter(s =>
      s.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contenido.some(c => {
        if (c.tipo === 'texto' || c.tipo === 'subtitulo' || c.tipo === 'nota')
          return c.valor && c.valor.toLowerCase().includes(searchTerm.toLowerCase());
        if (c.tipo === 'tabla')
          return c.filas.some(f => f.some(celda => celda.toLowerCase().includes(searchTerm.toLowerCase())));
        return false;
      })
    ), [searchTerm]);

  const jumpToSection = (id) => {
    setSeccionesAbiertas(prev => { const next = new Set(prev); next.add(id); return next; });
    setSearchTerm('');
    setTimeout(() => {
      document.getElementById(`seccion-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const exportToPDF = useCallback(async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
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
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      logoData = canvas.toDataURL('image/png');
    } catch (e) { /* ignore */ }

    const addHeader = (pageNum, totalPages, sectionTitle) => {
      if (logoData) doc.addImage(logoData, 'PNG', pageW - margin - 22, 4, 18, 18);
      doc.setFontSize(6);
      doc.setTextColor(160, 160, 160);
      doc.text(`SIAT — Manual del Especialista v1.0 | ${sectionTitle}`, margin, 10);
      doc.text(`${pageNum} / ${totalPages}`, pageW - margin, 10, { align: 'right' });
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, 12, pageW - margin, 12);
    };

    const checkPage = (needed) => {
      if (yy + needed > maxY) {
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yy + 2, pageW - margin, yy + 2);
        doc.addPage();
        pageNum++;
        addHeader(pageNum, totalPages, sectionTitle);
        yy = headerH + 4;
      }
    };

    doc.setFillColor(1, 28, 63);
    doc.rect(0, 0, pageW, pageH, 'F');
    doc.setTextColor(255, 255, 255);
    if (logoData) doc.addImage(logoData, 'PNG', pageW / 2 - 20, 50, 40, 40);
    doc.setFontSize(26);
    doc.text('Manual de Usuario', pageW / 2, 110, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Módulo del Especialista', pageW / 2, 120, { align: 'center' });
    doc.setFontSize(11);
    doc.text('SIAT — Sistema Integrado de Asistencia Terapéutica', pageW / 2, 135, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Versión 1.0 — ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, 145, { align: 'center' });
    doc.text('Funauta — Fundación de Apoyo al Autista', pageW / 2, 160, { align: 'center' });

    doc.addPage();
    doc.setTextColor(1, 28, 63);
    doc.setFontSize(14);
    doc.text('Índice de Contenidos', margin, 20);
    doc.setDrawColor(1, 28, 63);
    doc.setLineWidth(0.3);
    doc.line(margin, 23, pageW - margin, 23);
    let y = 30;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    secciones.forEach((sec, i) => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.text(`${String(i + 1).padStart(2, '0')}   ${sec.titulo}`, margin + 2, y);
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text(sec.descripcion, margin + 14, y + 3.5);
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(9);
      y += 8;
    });

    const totalPages = secciones.length + 1;
    let pageNum = 2;
    let sectionTitle = secciones[0].titulo;
    doc.addPage();
    pageNum++;
    addHeader(pageNum, totalPages, sectionTitle);
    let yy = headerH + 4;

    secciones.forEach((sec, idx) => {
      checkPage(9);
      doc.setFillColor(1, 28, 63);
      doc.rect(margin, yy - 1.5, contentW, 5.5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text(sec.titulo, margin + 2, yy + 2.5);
      doc.setTextColor(60, 60, 60);
      sectionTitle = sec.titulo;
      yy += 7.5;

      sec.contenido.forEach(bloque => {
        checkPage(0);
        switch (bloque.tipo) {
          case 'texto':
            doc.setFontSize(8);
            const txtLines = doc.splitTextToSize(bloque.valor, contentW);
            checkPage(txtLines.length * lineH + 2);
            doc.text(txtLines, margin, yy);
            yy += txtLines.length * lineH + 1.5;
            break;
          case 'subtitulo':
            checkPage(6);
            doc.setFontSize(9);
            doc.setTextColor(1, 60, 100);
            doc.text(bloque.valor, margin, yy);
            yy += 5;
            doc.setTextColor(60, 60, 60);
            break;
          case 'lista':
            doc.setFontSize(8);
            bloque.items.forEach(item => {
              const iLines = doc.splitTextToSize(`• ${item}`, contentW - 4);
              checkPage(iLines.length * lineH + 1);
              doc.text(iLines, margin + 4, yy);
              yy += iLines.length * lineH + 0.5;
            });
            yy += 1.5;
            break;
          case 'pasos':
            doc.setFontSize(8);
            bloque.items.forEach((item, i) => {
              const sLines = doc.splitTextToSize(`${i + 1}. ${item}`, contentW - 4);
              checkPage(sLines.length * lineH + 1);
              doc.text(sLines, margin + 4, yy);
              yy += sLines.length * lineH + 0.5;
            });
            yy += 1.5;
            break;
          case 'tabla':
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
                  headStyles: { fillColor: [1, 60, 100], textColor: [255, 255, 255], fontSize: 7, fontStyle: 'bold' },
                  columnStyles: Object.fromEntries(bloque.encabezados.map((_, i) => [i, { cellWidth: colW }])),
                  tableLineColor: [220, 220, 220],
                  tableLineWidth: 0.1,
                  didDrawPage: () => {
                    pageNum++;
                    addHeader(pageNum, totalPages, sectionTitle);
                    yy = headerH + 4;
                  }
                });
                yy = doc.lastAutoTable.finalY + 4;
              } catch (e) { yy += 3; }
            }
            break;
          case 'nota': {
            doc.setFontSize(7.5);
            doc.setTextColor(90, 90, 90);
            const nIcon = bloque.variante === 'warning' ? '⚠ ' : bloque.variante === 'success' ? '✓ ' : 'ℹ ';
            const nLines = doc.splitTextToSize(nIcon + bloque.valor, contentW - 8);
            const noteH = nLines.length * lineH + 4;
            checkPage(noteH + 3);
            const colorMap = { info: [230, 240, 255], warning: [255, 245, 220], success: [225, 245, 225] };
            const bg = colorMap[bloque.variante] || [230, 240, 255];
            doc.setFillColor(bg[0], bg[1], bg[2]);
            doc.roundedRect(margin, yy - 1, contentW, noteH, 1, 1, 'F');
            doc.setDrawColor(180, 180, 180);
            doc.roundedRect(margin, yy - 1, contentW, noteH, 1, 1, 'S');
            doc.text(nLines, margin + 4, yy + 2);
            yy += noteH + 3;
            doc.setTextColor(60, 60, 60);
            break;
          }
        }
      });
      yy += 2;
    });

    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yy + 2, pageW - margin, yy + 2);
    doc.save('manual_usuario_especialista_siat.pdf');
  }, []);

  const toggleFullscreen = () => {
    if (!fullscreen) contentRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
    setFullscreen(!fullscreen);
  };

  useEffect(() => {
    const onFSChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  const seccionItems = searchTerm ? filteredSecciones : secciones;

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <Topbar />
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1400px] w-full mx-auto p-6 md:p-8 flex flex-col gap-8 pb-12">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-brand-700 dark:text-blue-400 tracking-tight flex items-center gap-2 md:gap-3 transition-colors">
                  <Book className="w-6 h-6 text-brand-700 dark:text-blue-400" />
                  Manual de Usuario
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Guía para profesionales de la salud — SIAT
                </p>
              </div>
            </div>
            <div ref={contentRef} className={`${fullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-[#0B1120] p-8 overflow-y-auto' : ''}`}>
              <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#011C3F] to-[#034EA1] rounded-xl p-6 md:p-8 text-white shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/15 rounded-xl backdrop-blur-sm">
                        <BookOpen className="w-7 h-7" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold tracking-tight">Manual del Especialista</h2>
                        <p className="text-sm text-blue-200 mt-0.5">Guía de referencia del módulo clínico — SIAT</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={toggleFullscreen} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors backdrop-blur-sm" title={fullscreen ? 'Salir' : 'Pantalla completa'}>
                        {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        <span className="hidden sm:inline">{fullscreen ? 'Salir' : 'Completo'}</span>
                      </button>
                      <button onClick={exportToPDF} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30">
                        <Download className="w-4 h-4" /> <span className="hidden sm:inline">Descargar</span> PDF
                      </button>
                      <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors backdrop-blur-sm" title="Imprimir">
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-5 max-w-lg">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
                      <input type="text" placeholder="Buscar en el manual..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 text-sm bg-white/10 border border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-white/30 placeholder:text-blue-300/60 text-white transition-all" />
                    </div>
                    {searchTerm && (
                      <button onClick={() => setSearchTerm('')} className="px-3 py-3 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0">
                        Limpiar
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-6 flex-col lg:flex-row">
                  <div className="lg:w-64 shrink-0">
                    <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 sticky top-6 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <BookMarked className="w-3.5 h-3.5" /> Contenidos
                        </h3>
                      </div>
                      <nav className="p-2 space-y-0.5 max-h-[70vh] overflow-y-auto">
                        {secciones.map(sec => {
                          const IconComp = iconos[sec.icono] || iconos.default;
                          const isActive = seccionesAbiertas.has(sec.id);
                          return (
                            <button key={sec.id} onClick={() => jumpToSection(sec.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                              <IconComp className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{sec.titulo}</span>
                              {isActive && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
                            </button>
                          );
                        })}
                      </nav>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 space-y-4">
                    {searchTerm && (
                      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900/30 rounded-lg px-4 py-3 text-sm text-indigo-700 dark:text-indigo-400">
                        {filteredSecciones.length > 0
                          ? `Se encontraron ${filteredSecciones.length} sección(es) que coinciden con "${searchTerm}"`
                          : `No se encontraron resultados para "${searchTerm}"`}
                      </div>
                    )}

                    {seccionItems.map(sec => {
                      const IconComp = iconos[sec.icono] || iconos.default;
                      return (
                        <article key={sec.id} id={`seccion-${sec.id}`} className={`bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${seccionesAbiertas.has(sec.id) ? 'border-indigo-200 dark:border-indigo-900/50 shadow-md' : 'border-slate-200 dark:border-slate-800/60 hover:shadow-md'}`}>
                          <button onClick={() => toggleSeccion(sec.id)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${seccionesAbiertas.has(sec.id) ? 'bg-indigo-100 dark:bg-indigo-900/30' : 'bg-slate-100 dark:bg-slate-800'} transition-colors`}>
                                <IconComp className={`w-5 h-5 ${seccionesAbiertas.has(sec.id) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'}`} />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{sec.titulo}</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sec.descripcion}</p>
                              </div>
                            </div>
                            <div className={`p-1 rounded-full transition-all ${seccionesAbiertas.has(sec.id) ? 'rotate-90' : ''}`}>
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </div>
                          </button>
                          {seccionesAbiertas.has(sec.id) && (
                            <div className="px-5 pb-6 border-t border-slate-100 dark:border-slate-800">
                              <div className="pt-4 space-y-1 max-w-none">
                                {sec.contenido.map((bloque, i) => (
                                  <ContenidoRenderer key={i} bloque={bloque} />
                                ))}
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}

                    <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-6 border-t border-slate-200 dark:border-slate-800">
                      <p className="font-semibold">SIAT — Sistema Integrado de Asistencia Terapéutica</p>
                      <p className="mt-1">Funauta — Fundación de Apoyo al Autista</p>
                      <p className="mt-1">Versión 1.0 — {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
