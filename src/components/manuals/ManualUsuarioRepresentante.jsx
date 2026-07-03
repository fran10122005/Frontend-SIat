import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoPath from '../../assets/Logo.png';
import {
  BookOpen, Download, Search, LayoutDashboard, Activity, CheckSquare,
  NotebookPen, Puzzle, UserCircle, HelpCircle, BookMarked,
  ChevronRight, Printer, Maximize2, Minimize2, Info, AlertTriangle,
  CheckCircle, GraduationCap, Heart, Bell, Book
} from 'lucide-react';
import Sidebar from '../layout/Sidebar';
import Topbar from '../layout/Topbar';

const iconos = {
  dashboard: LayoutDashboard,
  sensores: Activity,
  agenda: CheckSquare,
  diario_hogar: NotebookPen,
  herramientas: Puzzle,
  expediente: UserCircle,
  introduccion: BookOpen,
  estructura: BookMarked,
  crisis: Heart,
  notificaciones: Bell,
  solucion: HelpCircle,
  glosario: GraduationCap,
  default: Info
};

const secciones = [
  {
    id: 'introduccion',
    titulo: 'Introducción',
    icono: 'introduccion',
    descripcion: 'Bienvenido al sistema SIAT para representantes',
    contenido: [
      { tipo: 'texto', valor: 'El módulo de Representante está diseñado para padres, madres o tutores de niños con Trastorno del Espectro Autista (TEA). Desde este panel podrá monitorear en tiempo real las constantes vitales de su hijo, registrar reportes diarios, gestionar rutinas terapéuticas, comunicarse con el especialista y acceder a herramientas de apoyo durante crisis sensoriales.' },
      { tipo: 'texto', valor: 'SIAT integra wearables IoT (pulseras biométricas) que permiten la detección temprana de crisis de sobrecarga sensorial, brindando tranquilidad y herramientas de intervención inmediata.' }
    ]
  },
  {
    id: 'estructura',
    titulo: 'Estructura del Panel',
    icono: 'estructura',
    descripcion: 'Distribución de la interfaz del representante',
    contenido: [
      { tipo: 'texto', valor: 'La interfaz del representante se compone de tres partes principales:' },
      { tipo: 'lista', items: [
        'Barra lateral izquierda: Navegación entre las secciones del panel.',
        'Barra superior: Muestra el nombre del usuario, campana de notificaciones en tiempo real y botón de modo oscuro.',
        'Área principal: Contenido dinámico según la sección seleccionada.'
      ]},
      { tipo: 'subtitulo', valor: 'Secciones de la Barra Lateral' },
      { tipo: 'tabla', encabezados: ['Sección', 'Descripción'],
        filas: [
          ['Panel Principal', 'Resumen del estado regulatorio, últimas alertas y acceso rápido a herramientas de crisis.'],
          ['Seguimiento en Vivo', 'Monitoreo en tiempo real de frecuencia cardíaca, movimiento e índice de estrés.'],
          ['Día a Día', 'Agenda visual, checklist de tareas diarias y catálogo de terapias con cronómetro.'],
          ['Diario de Hogar', 'Registro diario de observaciones clínicas (sueño, ánimo, apetito, crisis).'],
          ['Herramientas de Apoyo', 'Tablero de comunicación AAC y sistema de economía de fichas.'],
          ['Expediente Clínico', 'Perfil del niño, historial de alertas e indicaciones del especialista.'],
          ['Manual de Usuario', 'Esta guía de referencia completa.']
        ]
      }
    ]
  },
  {
    id: 'dashboard',
    titulo: 'Panel Principal',
    icono: 'dashboard',
    descripcion: 'Resumen del estado del paciente',
    contenido: [
      { tipo: 'subtitulo', valor: 'Estado Regulatorio' },
      { tipo: 'texto', valor: 'Tarjeta principal que muestra en tiempo real el nivel de estrés del niño:' },
      { tipo: 'lista', items: [
        'Verde (≤ 40%): "Calma Basal" — el niño está en estado óptimo.',
        'Amarillo (≤ 75%): "Agitación Moderada" — se recomienda monitorear.',
        'Rojo (> 75%): "Crisis Sensorial / Sobrecarga" — requiere intervención inmediata.'
      ]},
      { tipo: 'texto', valor: 'Además se muestra el pulso actual en BPM y un corazón animado que late al ritmo del paciente.' },

      { tipo: 'subtitulo', valor: 'Zona SOS Sensorial' },
      { tipo: 'texto', valor: 'Acceso rápido a dos herramientas de intervención durante crisis:' },
      { tipo: 'lista', items: [
        'Respiración Tortuga: Guía interactiva de respiración (inhala 4s → retén 4s → exhala 4s) con círculo animado.',
        'Tablero AAC Rápido: Comunicación aumentativa con pictogramas básicos (comer, beber, baño, ayuda, etc.) y sintetizador de voz.'
      ]},

      { tipo: 'subtitulo', valor: 'Foco Clínico de la Semana' },
      { tipo: 'texto', valor: 'Muestra el objetivo terapéutico semanal definido por el especialista. Presione "Ver Agenda Visual" para acceder al plan detallado.' },

      { tipo: 'subtitulo', valor: 'Últimos Eventos' },
      { tipo: 'texto', valor: 'Panel con hasta 4 alertas recientes del paciente con icono, mensaje y hora.' },

      { tipo: 'subtitulo', valor: 'Estado del Wearable IoT' },
      { tipo: 'texto', valor: 'Indicador del estado de la pulsera biométrica: conexión, nivel de batería y calidad de señal.' },

      { tipo: 'subtitulo', valor: 'Solicitar Cita' },
      { tipo: 'pasos', items: [
        'Presione el botón "Pedir Cita" en el panel principal.',
        'Complete el formulario: especialista, fecha deseada, hora, tipo de cita y motivo.',
        'Presione "Solicitar Cita". La solicitud será enviada al especialista.'
      ]},
      { tipo: 'tabla', encabezados: ['Campo', 'Descripción'],
        filas: [
          ['Especialista', 'Seleccione de la lista de especialistas asignados'],
          ['Fecha Deseada', 'Seleccione la fecha para la cita'],
          ['Hora Deseada', 'Seleccione la hora preferida'],
          ['Tipo de Cita', 'Consulta Regular, Terapia de Lenguaje, Terapia Ocupacional, Psicología, Revisión de PEI, Urgencia'],
          ['Motivo', 'Notas adicionales para el especialista']
        ]
      }
    ]
  },
  {
    id: 'sensores',
    titulo: 'Seguimiento en Vivo',
    icono: 'sensores',
    descripcion: 'Monitoreo biométrico en tiempo real',
    contenido: [
      { tipo: 'subtitulo', valor: 'Cockpit de Biotelemetría' },
      { tipo: 'texto', valor: 'Panel de monitoreo en tiempo real de las constantes fisiológicas del paciente desde la pulsera IoT.' },

      { tipo: 'subtitulo', valor: 'Indicadores en Vivo' },
      { tipo: 'tabla', encabezados: ['Indicador', 'Rango Normal', 'Descripción'],
        filas: [
          ['Ritmo Cardíaco (BPM)', 'Según umbral calibrado', 'Frecuencia cardíaca actual del paciente'],
          ['Movimiento (G)', '< 1.2G reposo, > 5.0G estereotipias', 'Nivel de actividad física y movimientos'],
          ['Índice de Estrés', '0-100%', 'Porcentaje calculado de estrés en tiempo real']
        ]
      },
      { tipo: 'subtitulo', valor: 'Gráfico de Señal' },
      { tipo: 'texto', valor: 'Gráfico de líneas con ventana deslizante que muestra la evolución del BPM (rojo) y el índice de estrés (púrpura) en los últimos instantes.' },

      { tipo: 'subtitulo', valor: 'Estado del Hardware' },
      { tipo: 'lista', items: [
        'Batería: Nivel de carga de la pulsera biométrica.',
        'Señal: Calidad de la conexión Bluetooth/red.',
        'Conectividad: Estado del WebSocket con el servidor.'
      ]},

      { tipo: 'nota', variante: 'info', valor: 'Los datos se actualizan automáticamente cada pocos segundos vía WebSocket. No necesita recargar la página.' }
    ]
  },
  {
    id: 'agenda',
    titulo: 'Día a Día',
    icono: 'agenda',
    descripcion: 'Agenda visual y terapias interactivas',
    contenido: [
      { tipo: 'subtitulo', valor: 'Foco Clínico Semanal' },
      { tipo: 'texto', valor: 'Objetivo terapéutico de la semana definido por el especialista. Presione "Reportar Avance de Hoy" para notificar el progreso.' },

      { tipo: 'subtitulo', valor: 'Agenda Visual de Hoy' },
      { tipo: 'texto', valor: 'Checklist de tareas diarias con iconos: lavarse, comer, jugar, estudio, ordenar, dormir.' },
      { tipo: 'lista', items: [
        'Cada tarea se marca como completada al hacer clic.',
        'Una barra de progreso muestra el porcentaje de cumplimiento.',
        'Al completar todas las tareas, aparece un mensaje de felicitación.'
      ]},

      { tipo: 'subtitulo', valor: 'Catálogo de Terapias y Rutinas' },
      { tipo: 'texto', valor: 'Grid de tarjetas con terapias disponibles. Cada tarjeta muestra categoría, duración, título e instrucciones.' },
      { tipo: 'pasos', items: [
        'Seleccione una terapia del catálogo.',
        'Presione "Iniciar Sesión en Vivo".',
        'Siga las instrucciones paso a paso mientras el cronómetro corre.',
        'Al finalizar, evalúe la cooperación del niño (1-5 estrellas) y agregue notas.',
        'Presione "Guardar Sesión" para registrar los resultados.'
      ]},

      { tipo: 'subtitulo', valor: 'Constructor de Terapias' },
      { tipo: 'texto', valor: 'Desde el panel lateral puede crear sus propias terapias personalizadas:' },
      { tipo: 'lista', items: [
        'Nombre de la Terapia',
        'Categoría: Higiene, Terapéutico, Alimentación, Educativo, Regulación Sensorial',
        'Duración Estimada y Dificultad (Baja/Media/Alta)',
        'Pasos estructurados con instrucción y tiempo estimado'
      ]}
    ]
  },
  {
    id: 'diario_hogar',
    titulo: 'Diario de Hogar',
    icono: 'diario_hogar',
    descripcion: 'Registro diario de observaciones clínicas',
    contenido: [
      { tipo: 'texto', valor: 'Formulario para registrar observaciones clínicas diarias del niño en casa. Esta información es enviada al especialista para dar seguimiento.' },

      { tipo: 'subtitulo', valor: 'Campos del Formulario' },
      { tipo: 'tabla', encabezados: ['Campo', 'Tipo', 'Opciones'],
        filas: [
          ['Fecha del Reporte', 'Fecha', 'Por defecto: hoy'],
          ['Horas de Sueño', 'Número', '0-24 horas'],
          ['Calidad de Sueño', 'Select', 'Excelente, Interrumpido, Insomnio'],
          ['Apetito', 'Select', 'Bueno, Regular, Malo / Selectivo'],
          ['Estado de Ánimo', 'Select', 'Muy Calmo, Estable, Irritable, Crisis / Sobrecarga'],
          ['Cant. de Crisis Hoy', 'Número', 'Entero (mínimo 0)'],
          ['BPM Estimado', 'Número', 'Opcional'],
          ['Desencadenantes', 'Texto', 'Ej: luces fuertes, cambio de rutina'],
          ['Sensibilidades Sensoriales', 'Texto', 'Descripción libre'],
          ['Estado Digestivo', 'Select', 'Normal, Estreñimiento, Diarrea, Malestar abdominal'],
          ['Medicación Administrada', 'Checkbox', 'Sí / No'],
          ['Observaciones', 'Texto largo', 'Notas adicionales']
        ]
      },

      { tipo: 'subtitulo', valor: 'Historial de Reportes' },
      { tipo: 'texto', valor: 'Tabla con el historial de reportes enviados, mostrando día, BPM y resumen clínico. Los BPM altos (>100) se resaltan en rojo.' },

      { tipo: 'pasos', items: [
        'Complete todos los campos del formulario.',
        'Presione "Enviar Reporte al Especialista".',
        'El reporte quedará registrado en el historial y será visible para su especialista.'
      ]},
      { tipo: 'nota', variante: 'info', valor: 'Se recomienda llenar el Diario de Hogar al final del día para tener un registro completo de la jornada.' }
    ]
  },
  {
    id: 'herramientas',
    titulo: 'Herramientas de Apoyo',
    icono: 'herramientas',
    descripcion: 'AAC y sistema de economía de fichas',
    contenido: [
      { tipo: 'subtitulo', valor: 'Tablero de Comunicación AAC' },
      { tipo: 'texto', valor: 'Sistema de Comunicación Aumentativa y Alternativa con pictogramas para facilitar la expresión del niño.' },
      { tipo: 'lista', items: [
        'Pictogramas por categorías: Necesidades, Emociones, Acciones.',
        'Constructor de frases: toque pictogramas para armar una frase (máximo 5).',
        'Botón "Hablar": Reproduce la frase con sintetizador de voz en español.',
        'Frases frecuentes: las últimas 4 frases se guardan automáticamente.',
        'Pictogramas personalizados: cree sus propios pictogramas con nombre, emoji y categoría.'
      ]},

      { tipo: 'subtitulo', valor: 'Economía de Fichas' },
      { tipo: 'texto', valor: 'Sistema de recompensas conductuales basado en estrellas para reforzar comportamientos positivos.' },
      { tipo: 'lista', items: [
        'Saldo de estrellas: contador visible en la parte superior.',
        'Tareas conductuales: checklist con valor en estrellas. Al completar una tarea, se suman estrellas.',
        'Catálogo de recompensas: canjee estrellas por premios predefinidos.',
        'Historial de canjes: registro cronológico de todas las recompensas canjeadas.',
        'Tareas y recompensas personalizadas: cree las suyas propias.'
      ]},
      { type: 'nota', variante: 'info', valor: 'Todos los datos de herramientas se guardan automáticamente en su navegador (localStorage). No se pierden al cerrar sesión.' }
    ]
  },
  {
    id: 'expediente',
    titulo: 'Expediente Clínico',
    icono: 'expediente',
    descripcion: 'Perfil del niño, alertas e indicaciones',
    contenido: [
      { tipo: 'texto', valor: 'El Expediente Clínico agrupa tres secciones en pestañas:' },

      { tipo: 'subtitulo', valor: 'Información del Perfil' },
      { tipo: 'texto', valor: 'Datos del paciente registrados en el sistema:' },
      { tipo: 'lista', items: [
        'Nombre completo del niño.',
        'Código de sistema (ID).',
        'Fecha de nacimiento y edad.',
        'Nivel de desarrollo TEA (Nivel 1 - Leve, Nivel 2 - Moderado, Nivel 3 - Severo).',
        'Perfil sensorial principal.',
        'Especialista asignado.'
      ]},
      { tipo: 'nota', variante: 'warning', valor: 'La información del perfil es de solo lectura. Si necesita actualizar algún dato, solicítelo al especialista a cargo.' },

      { tipo: 'subtitulo', valor: 'Registro de Alertas' },
      { tipo: 'texto', valor: 'Línea de tiempo de todas las alertas registradas del paciente.' },
      { tipo: 'lista', items: [
        'Filtros por fecha y estado (Pendiente, Efectiva, No Efectiva).',
        'Cada alerta muestra: hora, tipo (Crisis/Precrisis), detalles fisiológicos (BPM, movimiento, estrés).',
        'Puede evaluar la efectividad de la intervención: "Sí, fue efectiva" o "No fue efectiva".'
      ]},

      { tipo: 'subtitulo', valor: 'Indicaciones Clínicas' },
      { tipo: 'texto', valor: 'Listado de indicaciones y recomendaciones dadas por el especialista para el cuidado del niño en casa.' }
    ]
  },
  {
    id: 'crisis',
    titulo: 'Manejo de Crisis Sensoriales',
    icono: 'crisis',
    descripcion: 'Protocolos de intervención durante crisis',
    contenido: [
      { tipo: 'texto', valor: 'SIAT proporciona herramientas integradas para ayudar durante episodios de sobrecarga sensorial:' },

      { tipo: 'subtitulo', valor: 'Protocolo de Respiración (Respiración Tortuga)' },
      { tipo: 'texto', valor: 'Técnica de anclaje para regular el sistema nervioso durante una crisis:' },
      { tipo: 'lista', items: [
        'Ciclo de 3 fases: Inhala (4s) → Retén (4s) → Exhala (4s).',
        'Círculo animado que se expande y contrae guiando la respiración.',
        'Números regresivos en el centro para mantener el ritmo.',
        'Botón de pausa/reanudar para adaptarse al ritmo del niño.'
      ]},

      { tipo: 'subtitulo', valor: 'Tablero AAC (Comunicación Aumentativa)' },
      { tipo: 'texto', valor: 'Durante una crisis, la comunicación verbal puede ser difícil. Use el tablero AAC con pictogramas básicos para entender las necesidades del niño.' },

      { tipo: 'subtitulo', valor: 'Notificaciones de Alerta' },
      { tipo: 'texto', valor: 'Cuando el sistema detecta una posible crisis (BPM elevado + movimientos estereotípicos):' },
      { tipo: 'lista', items: [
        'La campana de notificaciones vibra y suena.',
        'Aparece un toast emergente con los detalles de la alerta.',
        'Puede acceder al seguimiento en vivo para monitorear la evolución.',
        'Después de la crisis, evalúe si la intervención fue efectiva desde el Expediente Clínico.'
      ]}
    ]
  },
  {
    id: 'notificaciones',
    titulo: 'Notificaciones en Tiempo Real',
    icono: 'notificaciones',
    descripcion: 'Alertas y comunicaciones del sistema',
    contenido: [
      { tipo: 'texto', valor: 'El sistema cuenta con un centro de notificaciones en tiempo real:' },
      { tipo: 'lista', items: [
        'Campana en la barra superior con contador de notificaciones no leídas.',
        'Las alertas de crisis aparecen automáticamente con sonido y vibración.',
        'Puede ver el detalle de cada alerta en el dropdown de notificaciones.',
        'Botón "Limpiar" para eliminar todas las notificaciones.'
      ]},
      { tipo: 'subtitulo', valor: 'Modo Oscuro' },
      { tipo: 'texto', valor: 'Haga clic en el ícono de Luna/Sol en la barra superior para alternar entre modo claro y oscuro.' },
      { tipo: 'subtitulo', valor: 'Modo Offline' },
      { tipo: 'texto', valor: 'SIAT soporta modo offline. Cuando pierde conexión a internet, los datos se guardan localmente y se sincronizan automáticamente cuando la conexión se restablece.' }
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
          ['No veo los datos de mi hijo', 'El niño no está asignado a su cuenta', 'Contacte al administrador de la institución'],
          ['La pulsera no muestra datos', 'El wearable está desconectado o sin batería', 'Verifique que la pulsera esté encendida y cargada'],
          ['No recibo notificaciones', 'WebSocket desconectado', 'Verifique su conexión a internet y recargue la página'],
          ['Error al enviar reporte', 'Conexión inestable', 'Intente de nuevo más tarde. Los datos se guardan localmente'],
          ['No puedo iniciar sesión', 'Credenciales incorrectas o cuenta inactiva', 'Use "¿Olvidaste tu contraseña?" o contacte al administrador'],
          ['El enlace de invitación no funciona', 'El enlace ha expirado', 'Solicite un nuevo enlace de invitación al administrador']
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
          ['AAC', 'Comunicación Aumentativa y Alternativa — métodos de comunicación no verbal'],
          ['BPM', 'Latidos por minuto (Beats Per Minute) — frecuencia cardíaca'],
          ['IoT', 'Internet de las Cosas — dispositivos conectados a internet'],
          ['PEI', 'Plan de Educación Individualizada'],
          ['Sobrecarga Sensorial', 'Estado de crisis por exceso de estímulos sensoriales'],
          ['Estereotipia', 'Movimientos repetitivos comunes en TEA (aleteos, balanceos)'],
          ['WebSocket', 'Canal de comunicación en tiempo real entre la pulsera y el sistema'],
          ['Pictograma', 'Representación gráfica utilizada en comunicación aumentativa'],
          ['Economía de Fichas', 'Sistema de recompensas para reforzar conductas positivas']
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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
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
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold shrink-0 mt-0.5">
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

export default function ManualUsuarioRepresentante() {
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
        if (c.tipo === 'texto' || c.tipo === 'subtitulo' || c.tipo === 'nota') {
          return c.valor && c.valor.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (c.tipo === 'tabla') {
          return c.filas.some(f => f.some(celda => celda.toLowerCase().includes(searchTerm.toLowerCase())));
        }
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
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      logoData = canvas.toDataURL('image/png');
    } catch (e) { /* ignore */ }

    const addHeader = (pageNum, totalPages, sectionTitle) => {
      if (logoData) {
        doc.addImage(logoData, 'PNG', pageW - margin - 22, 4, 18, 18);
      }
      doc.setFontSize(6);
      doc.setTextColor(160, 160, 160);
      doc.text(`SIAT — Manual del Representante v1.0 | ${sectionTitle}`, margin, 10);
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

    // Cover page
    doc.setFillColor(1, 28, 63);
    doc.rect(0, 0, pageW, pageH, 'F');
    doc.setTextColor(255, 255, 255);
    if (logoData) doc.addImage(logoData, 'PNG', pageW / 2 - 20, 50, 40, 40);
    doc.setFontSize(26);
    doc.text('Manual de Usuario', pageW / 2, 110, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Módulo del Representante', pageW / 2, 120, { align: 'center' });
    doc.setFontSize(11);
    doc.text('SIAT — Sistema Integrado de Asistencia Terapéutica', pageW / 2, 135, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Versión 1.0 — ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, 145, { align: 'center' });
    doc.text('Funauta — Fundación de Apoyo al Autista', pageW / 2, 160, { align: 'center' });
    doc.text('Guía para padres, madres y tutores', pageW / 2, 175, { align: 'center' });

    // Table of contents
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

    // Content
    const totalPages = secciones.length + 1;
    let pageNum = 2;
    let sectionTitle = secciones[0].titulo;
    doc.addPage();
    pageNum++;
    addHeader(pageNum, totalPages, sectionTitle);
    let yy = headerH + 4;

    secciones.forEach((sec, idx) => {
      const estTitleLines = 6;
      checkPage(estTitleLines + 3);

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
    doc.save('manual_usuario_representante_siat.pdf');
  }, []);

  const toggleFullscreen = () => {
    if (!fullscreen) {
      contentRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  useEffect(() => {
    const onFSChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  const seccionItems = searchTerm ? filteredSecciones : secciones;

  return (
    <div className="flex h-[100dvh] w-full bg-[#F8FAFC] dark:bg-[#0B1120] font-sans overflow-hidden transition-colors duration-200">
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
                  Guía para padres, madres y tutores — SIAT
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
                <h2 className="text-xl font-bold tracking-tight">Manual de Usuario</h2>
                <p className="text-sm text-blue-200 mt-0.5">Guía para padres, madres y tutores — SIAT</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleFullscreen} className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors backdrop-blur-sm" title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
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
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
              <input type="text" placeholder="Buscar en el manual..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-4 pr-10 py-3 text-sm bg-white/10 border border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-white/30 placeholder:text-blue-300/60 text-white transition-all" />
            </div>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="px-3 py-3 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0">
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Two column layout */}
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Table of Contents sidebar */}
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
                    <button key={sec.id} onClick={() => jumpToSection(sec.id)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all ${isActive ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                      <IconComp className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{sec.titulo}</span>
                      {isActive && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-4">
            {searchTerm && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-400">
                {filteredSecciones.length > 0
                  ? `Se encontraron ${filteredSecciones.length} sección(es) que coinciden con "${searchTerm}"`
                  : `No se encontraron resultados para "${searchTerm}"`
                }
              </div>
            )}

            {seccionItems.map(sec => {
              const IconComp = iconos[sec.icono] || iconos.default;
              return (
                <article key={sec.id} id={`seccion-${sec.id}`} className={`bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${seccionesAbiertas.has(sec.id) ? 'border-emerald-200 dark:border-emerald-900/50 shadow-md' : 'border-slate-200 dark:border-slate-800/60 hover:shadow-md'}`}>
                  <button onClick={() => toggleSeccion(sec.id)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${seccionesAbiertas.has(sec.id) ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-slate-100 dark:bg-slate-800'} transition-colors`}>
                        <IconComp className={`w-5 h-5 ${seccionesAbiertas.has(sec.id) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
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
