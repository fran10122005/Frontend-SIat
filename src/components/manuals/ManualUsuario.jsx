import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoPath from '../../assets/Logo.png';
import {
  BookOpen, Download, Search, LayoutDashboard, Stethoscope,
  Link2, Users,   Server, Settings, HelpCircle, BookMarked,
  ChevronRight, Printer, Maximize2, Minimize2, Sun, CheckCircle, AlertTriangle,
  Info, GraduationCap
} from 'lucide-react';

const iconos = {
  dashboard: LayoutDashboard,
  especialistas: Stethoscope,
  asignaciones: Link2,
  usuarios: Users,
  infraestructura: Server,
  catalogos: Settings,
  introduccion: BookOpen,
  estructura: BookMarked,
  transversales: Sun,
  solucion: HelpCircle,
  glosario: GraduationCap,
  default: Info
};

const secciones = [
  {
    id: 'introduccion',
    titulo: 'Introducción',
    icono: 'introduccion',
    descripcion: 'Visión general del módulo de administrador',
    contenido: [
      { tipo: 'texto', valor: 'El módulo de Administrador está diseñado para el perfil ADMIN_INSTITUCION (Administrador de una fundación o clínica). Desde este panel se gestionan especialistas, pacientes, asignaciones, catálogos, cuentas de usuario y el monitoreo de infraestructura del sistema.' }
    ]
  },
  {
    id: 'estructura',
    titulo: 'Estructura del Panel',
    icono: 'estructura',
    descripcion: 'Distribución de la interfaz de administración',
    contenido: [
      { tipo: 'texto', valor: 'El panel de administración se compone de tres partes principales:' },
      { tipo: 'lista', items: [
        'Barra lateral izquierda: Navegación entre las secciones del panel.',
        'Barra superior (Topbar): Muestra el nombre del usuario, campana de notificaciones y botón de modo oscuro.',
        'Área principal: Contenido dinámico según la pestaña seleccionada.'
      ]},
      { tipo: 'subtitulo', valor: 'Secciones de la Barra Lateral' },
      { tipo: 'tabla', encabezados: ['Sección', 'Ícono', 'Descripción'],
        filas: [
          ['Panel Principal', '📊', 'KPIs y gráficos del dashboard'],
          ['Especialistas', '🩺', 'CRUD de especialistas y especialidades médicas'],
          ['Asignaciones', '🔗', 'Asignar pacientes a especialistas'],
          ['Usuarios', '👥', 'Gestión de cuentas de acceso'],
          ['Infraestructura', '🖥️', 'Estado operativo del sistema'],
          ['Mi Fundación', '⚙️', 'Configuración de datos institucionales'],
          ['Manual de Usuario', '📖', 'Esta guía de referencia']
        ]
      }
    ]
  },
  {
    id: 'dashboard',
    titulo: 'Panel Principal (Dashboard)',
    icono: 'dashboard',
    descripcion: 'Indicadores clave, gráficos y bitácora',
    contenido: [
      { tipo: 'subtitulo', valor: 'Indicadores Clave (KPIs)' },
      { tipo: 'texto', valor: 'Al ingresar al panel principal se muestran cuatro tarjetas con métricas en tiempo real:' },
      { tipo: 'tabla', encabezados: ['Indicador', 'Descripción'],
        filas: [
          ['Pacientes Activos', 'Total de niños registrados en la institución'],
          ['Especialistas (Staff)', 'Cantidad de profesionales de la salud acreditados'],
          ['Casos Asignados', 'Número de asignaciones activas (paciente-especialista)'],
          ['Incidentes / Crisis (Mes)', 'Alertas de sobrecarga sensorial registradas en el mes actual']
        ]
      },
      { tipo: 'subtitulo', valor: 'Gráficos' },
      { tipo: 'lista', items: [
        'Carga Clínica y Pacientes: Gráfico de área con la evolución de admisiones e ingresos.',
        'Productividad Terapéutica: Gráfico de barras con horas de terapia impartidas mensualmente.'
      ]},
    ]
  },
  {
    id: 'especialistas',
    titulo: 'Gestión de Especialistas',
    icono: 'especialistas',
    descripcion: 'CRUD de profesionales de la salud y especialidades',
    contenido: [
      { tipo: 'subtitulo', valor: 'Sub-pestañas de navegación' },
      { tipo: 'texto', valor: 'La sección se divide en dos sub-pestañas: "Especialistas" (gestión del personal clínico) y "Especialidades" (catálogo de especialidades médicas).' },
      { tipo: 'subtitulo', valor: 'Registrar Nuevo Especialista' },
      { tipo: 'pasos', items: [
        'Haga clic en "Especialistas" en la barra lateral. Asegúrese de estar en la sub-pestaña "Especialistas".',
        'Complete el formulario de "Acreditación de Nuevo Especialista".',
        'Presione "Registrar Especialista".',
        'El sistema asignará automáticamente la contraseña por defecto: SiatDoc2026*.'
      ]},
      { tipo: 'texto', valor: 'Campos del formulario:' },
      { tipo: 'tabla', encabezados: ['Campo', 'Descripción', 'Obligatorio'],
        filas: [
          ['Cédula', 'Número de identificación del especialista', 'Sí'],
          ['Correo Electrónico', 'Correo con el que accederá al sistema', 'Sí'],
          ['Nombres', 'Nombres del especialista', 'Sí'],
          ['Apellidos', 'Apellidos del especialista', 'Sí'],
          ['Teléfono de Contacto', 'Número telefónico', 'No'],
          ['Licencia Médica', 'Número de licencia o colegiatura', 'No'],
          ['Especialidad', 'Seleccionar del catálogo de especialidades', 'Sí'],
          ['Institución', 'Fundación a la que pertenece', 'Sí'],
          ['Sexo', 'Masculino o Femenino', 'Sí']
        ]
      },
      { tipo: 'nota', variante: 'info', valor: 'La contraseña por defecto para nuevos especialistas es SiatDoc2026*. El especialista deberá cambiarla en su primer inicio de sesión.' },
      { tipo: 'subtitulo', valor: 'Filtros de la Tabla "Nómina Médica"' },
      { tipo: 'texto', valor: 'La tabla de especialistas incluye múltiples filtros para localizar rápidamente al profesional deseado:' },
      { tipo: 'tabla', encabezados: ['Filtro', 'Descripción'],
        filas: [
          ['Búsqueda', 'Campo de texto que filtra por nombre, apellido o correo electrónico'],
          ['Especialidad', 'Selector desplegable con todas las especialidades del catálogo'],
          ['Estado', 'Filtra por Activo o Inactivo según el estado de la cuenta'],
          ['Género', 'Filtra por Masculino o Femenino'],
          ['Fecha de registro', 'Dos date pickers (desde / hasta) para filtrar por fecha de creación']
        ]
      },
      { tipo: 'nota', variante: 'info', valor: 'Todos los filtros son acumulativos. Use el botón "Limpiar" para resetear todos los filtros a la vez.' },
      { tipo: 'subtitulo', valor: 'Editar Especialista' },
      { tipo: 'pasos', items: [
        'En la tabla "Nómina Médica", ubique al especialista deseado.',
        'Pase el mouse sobre la fila para revelar los botones de acción.',
        'Haga clic en "Editar". Se abrirá un formulario inline.',
        'Modifique nombres, apellidos o correo electrónico.',
        'Presione "Guardar" para confirmar o "Cancelar" para descartar.'
      ]},
      { tipo: 'subtitulo', valor: 'Activar / Desactivar Especialista' },
      { tipo: 'pasos', items: [
        'En la tabla, ubique al especialista.',
        'Haga clic en el badge de estado (verde "Activo" o rojo "Inactivo").',
        'Se abrirá un modal de confirmación. Confirme la acción.',
        'Un especialista desactivado no podrá iniciar sesión en el sistema.'
      ]},
      { tipo: 'nota', variante: 'warning', valor: 'Desactivar un especialista no elimina sus registros históricos ni asignaciones pasadas. Solo bloquea su acceso al sistema.' },
      { tipo: 'subtitulo', valor: 'Exportar Directorio' },
      { tipo: 'lista', items: [
        'PDF: Genera un documento con nombre, especialidad, clínica, teléfono y estado.',
        'Excel: Genera un archivo .xlsx con código, nombre, especialidad, licencia, email y estado.'
      ]},
      { tipo: 'subtitulo', valor: 'Gestión de Especialidades Médicas' },
      { tipo: 'texto', valor: 'Cambie a la sub-pestaña "Especialidades" para administrar el catálogo de especialidades:' },
      { tipo: 'tabla', encabezados: ['Acción', 'Descripción'],
        filas: [
          ['Crear', 'Complete el formulario "Definición de Especialidad Médica". El código se genera automáticamente (formato ESP-{timestamp}).'],
          ['Editar', 'Pase el mouse sobre la fila > haga clic en "Editar" > modifique el nombre o descripción > "Guardar".'],
          ['Archivar', 'Marca la especialidad como inactiva. No aparecerá en formularios de registro de especialistas.'],
          ['Restaurar', 'Vuelve a activar una especialidad archivada.']
        ]
      },
      { tipo: 'subtitulo', valor: 'Filtros de Especialidades' },
      { tipo: 'texto', valor: 'La tabla de especialidades incluye búsqueda por nombre o código y filtro por estado (Activa / Inactivo).' }
    ]
  },
  {
    id: 'asignaciones',
    titulo: 'Asignaciones (Paciente - Especialista)',
    icono: 'asignaciones',
    descripcion: 'Vinculación de pacientes con especialistas',
    contenido: [
      { tipo: 'subtitulo', valor: 'Asignar Paciente a Especialista' },
      { tipo: 'pasos', items: [
        'Haga clic en "Asignaciones" en la barra lateral.',
        'En la sección "Asignar Paciente a Especialista", seleccione un paciente del listado.',
        'Seleccione un especialista activo (con estado "Activo").',
        'Presione "Crear Asignación". La asignación aparecerá en la tabla de casos activos.'
      ]},
      { tipo: 'subtitulo', valor: 'Registrar Nuevo Niño (Invitación Clínica)' },
      { tipo: 'pasos', items: [
        'En la sección de asignaciones, haga clic en "Registrar Nuevo Niño".',
        'Complete los datos del paciente: nombres, apellidos, fecha de nacimiento, género y nivel TEA.',
        'Complete los datos del representante: nombres, apellidos y correo electrónico.',
        'Presione "Crear Registro".',
        'El sistema generará un enlace de activación único.',
        'Copie el enlace y compártalo con el representante para que configure su cuenta.'
      ]},
      { tipo: 'nota', variante: 'info', valor: 'Niveles TEA disponibles: Nivel 1 (Leve), Nivel 2 (Moderado), Nivel 3 (Severo).' },
      { tipo: 'nota', variante: 'success', valor: 'El representante recibirá un enlace de activación por correo electrónico para registrar su cuenta y comenzar a monitorear al niño.' },
      { tipo: 'subtitulo', valor: 'Filtros de la Tabla de Asignaciones' },
      { tipo: 'texto', valor: 'La tabla de casos clínicos incluye:' },
      { tipo: 'tabla', encabezados: ['Filtro', 'Descripción'],
        filas: [
          ['Búsqueda', 'Filtra por nombre del paciente o del especialista'],
          ['Estado', 'Filtra por Activo o Inactivo'],
          ['Fecha de ingreso', 'Dos date pickers (desde / hasta) para filtrar por fecha de asignación']
        ]
      },
      { tipo: 'subtitulo', valor: 'Dar de Alta / Reactivar Asignación' },
      { tipo: 'lista', items: [
        'Dar de Alta: Desactiva la asignación (el especialista ya no atiende a ese paciente).',
        'Reactivar Caso: Vuelve a activar una asignación previamente desactivada.'
      ]},
      { tipo: 'subtitulo', valor: 'Exportar Asignaciones' },
      { tipo: 'lista', items: [
        'PDF: Listado con paciente, especialista, fecha de ingreso y estado.',
        'Excel: Archivo .xlsx con los mismos datos.'
      ]}
    ]
  },
  {
    id: 'usuarios',
    titulo: 'Gestión de Usuarios',
    icono: 'usuarios',
    descripcion: 'Administración de cuentas de acceso',
    contenido: [
      { tipo: 'subtitulo', valor: 'Filtros y Búsqueda' },
      { tipo: 'pasos', items: [
        'Haga clic en "Usuarios" en la barra lateral.',
        'Use el campo de búsqueda para filtrar por nombre o correo electrónico.',
        'Use el selector de Rol para ver solo Administradores, Especialistas o Representantes.',
        'Use el selector de Estado para filtrar por Activo o Inactivo.',
        'Use los date pickers para filtrar por rango de fecha de creación.'
      ]},
      { tipo: 'nota', variante: 'info', valor: 'Todos los filtros son acumulativos. Use el botón "Limpiar" para resetearlos.' },
      { tipo: 'subtitulo', valor: 'Información de Usuarios' },
      { tipo: 'texto', valor: 'La tabla muestra para cada usuario: nombre, correo electrónico, rol (Administrador, Especialista, Representante), fecha de creación de la cuenta, último acceso al sistema y estado (Activo/Inactivo).' },
      { tipo: 'subtitulo', valor: 'Activar / Desactivar Cuenta' },
      { tipo: 'pasos', items: [
        'Haga clic en el badge de estado del usuario (verde "Activo" o rojo "Inactivo").',
        'Confirme la acción en el modal de confirmación.',
        'Un usuario desactivado no podrá acceder al sistema hasta ser reactivado.'
      ]},
      { tipo: 'nota', variante: 'warning', valor: 'Desactivar un usuario revoca todo acceso al sistema, independientemente de su rol.' }
    ]
  },
  {
    id: 'catalogos',
    titulo: 'Mi Fundación',
    icono: 'catalogos',
    descripcion: 'Configuración de datos institucionales',
    contenido: [
      { tipo: 'subtitulo', valor: 'Configuración de la Institución' },
      { tipo: 'pasos', items: [
        'Haga clic en "Mi Fundación" en la barra lateral.',
        'Visualice y edite los datos de la institución: RIF, nombre, dirección, teléfono y contacto principal.',
        'Presione "Guardar Cambios" para persistir los cambios.'
      ]},
      { tipo: 'nota', variante: 'info', valor: 'El RIF / Código Fiscal ahora es editable. Todos los campos del formulario pueden modificarse.' },
      { tipo: 'nota', variante: 'success', valor: 'El catálogo de especialidades se gestiona desde la sección "Especialistas" > sub-pestaña "Especialidades".' }
    ]
  },
  {
    id: 'infraestructura',
    titulo: 'Infraestructura',
    icono: 'infraestructura',
    descripcion: 'Monitoreo del estado del sistema',
    contenido: [
      { tipo: 'subtitulo', valor: 'Estado del Sistema' },
      { tipo: 'pasos', items: [
        'Haga clic en "Infraestructura" en la barra lateral.',
        'Visualice tres indicadores clave:'
      ]},
      { tipo: 'tabla', encabezados: ['Indicador', 'Descripción'],
        filas: [
          ['Estado API Core', 'Operatividad del backend (porcentaje de disponibilidad)'],
          ['Nodos Edge (Telemetría)', 'Estado de los nodos de transmisión IoT'],
          ['Latencia Promedio', 'Tiempo de respuesta de la red en milisegundos']
        ]
      },
      { tipo: 'subtitulo', valor: 'Gráfico de Latencia' },
      { tipo: 'texto', valor: 'Gráfico de líneas que muestra la latencia de red de las últimas 24 horas en la transmisión de datos biométricos desde las pulseras IoT.' }
    ]
  },
  {
    id: 'transversales',
    titulo: 'Funcionalidades Transversales',
    icono: 'transversales',
    descripcion: 'Modo oscuro, notificaciones y más',
    contenido: [
      { tipo: 'subtitulo', valor: 'Modo Oscuro' },
      { tipo: 'texto', valor: 'Haga clic en el ícono de Luna/Sol en la barra superior para alternar entre modo claro y oscuro en todo el panel.' },
      { tipo: 'subtitulo', valor: 'Notificaciones' },
      { tipo: 'texto', valor: 'El ícono de campana en la barra superior muestra alertas y notificaciones del sistema en tiempo real.' },
      { tipo: 'subtitulo', valor: 'Mensajes de Retroalimentación' },
      { tipo: 'texto', valor: 'El sistema muestra mensajes temporales en la parte superior del área de trabajo:' },
      { tipo: 'lista', items: [
        'Verde: Operación exitosa.',
        'Rojo: Error en la operación con descripción del problema.'
      ]},
      { tipo: 'nota', variante: 'info', valor: 'Los mensajes de retroalimentación desaparecen automáticamente después de 4 segundos.' }
    ]
  },
  {
    id: 'solucion',
    titulo: 'Solución de Problemas',
    icono: 'solucion',
    descripcion: 'Problemas comunes y sus soluciones',
    contenido: [
      { tipo: 'tabla', encabezados: ['Problema', 'Causa', 'Solución'],
        filas: [
          ['No se cargan los datos', 'El backend no está corriendo', 'Verifique que el servidor backend esté activo en http://localhost:3000'],
          ['Error al crear especialista', 'Correo duplicado o cédula existente', 'Use un correo y cédula únicos'],
          ['No aparece en asignaciones', 'El especialista está inactivo', 'Actívelo desde la pestaña "Especialistas"'],
          ['No aparece paciente', 'El niño no está registrado', 'Use "Registrar Nuevo Niño"'],
          ['Modal no responde', 'Error de conexión', 'Recargue la página y verifique la conexión'],
          ['No llega el correo de invitación', 'SMTP no configurado', 'Verifique la configuración del servidor de correo en el backend']
        ]
      }
    ]
  },
  {
    id: 'glosario',
    titulo: 'Glosario',
    icono: 'glosario',
    descripcion: 'Términos técnicos y siglas del sistema',
    contenido: [
      { tipo: 'tabla', encabezados: ['Término', 'Definición'],
        filas: [
          ['TEA', 'Trastorno del Espectro Autista'],
          ['KPI', 'Indicador Clave de Rendimiento (Key Performance Indicator)'],
          ['CRUD', 'Crear, Leer, Actualizar, Eliminar (operaciones básicas de datos)'],
          ['IoT', 'Internet de las Cosas — dispositivos conectados a internet'],
          ['RBAC', 'Control de Acceso Basado en Roles (Role-Based Access Control)'],
          ['JWT', 'JSON Web Token — mecanismo de autenticación seguro'],
          ['PEI', 'Plan de Educación Individualizada'],
          ['SOAP', 'Nota clínica estructurada: Subjetivo, Objetivo, Evaluación, Plan'],
          ['BPM', 'Latidos por minuto (Beats Per Minute) — frecuencia cardíaca'],
          ['ESP32', 'Microcontrolador utilizado en las pulseras IoT'],
          ['MAX30100/102', 'Sensor óptico para medición de frecuencia cardíaca'],
          ['MPU6050', 'Acelerómetro y giroscopio de 3 ejes']
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
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
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
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold shrink-0 mt-0.5">
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
    case 'nota':
      const colores = {
        info: 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-400',
        warning: 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-400',
        success: 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-400',
        danger: 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400'
      };
      const iconosNota = {
        info: Info,
        warning: AlertTriangle,
        success: CheckCircle,
        danger: AlertTriangle
      };
      const IconoNote = iconosNota[bloque.variante];
      return (
        <div className={`flex items-start gap-3 p-4 rounded-lg border text-sm mt-3 ${colores[bloque.variante] || colores.info}`}>
          <IconoNote className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{bloque.valor}</span>
        </div>
      );
    default:
      return null;
  }
}

export default function ManualUsuario() {
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
    const footerH = 8;
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
    } catch (e) {
      console.warn('Logo no disponible para PDF:', e);
    }

    const addHeader = (doc, pageNum, totalPages, sectionTitle) => {
      if (logoData) {
        doc.addImage(logoData, 'PNG', pageW - margin - 22, 4, 18, 18);
      }
      doc.setFontSize(6);
      doc.setTextColor(160, 160, 160);
      doc.text(`SIAT — Manual de Usuario v1.0 | ${sectionTitle}`, margin, 10);
      doc.text(`${pageNum} / ${totalPages}`, pageW - margin, 10, { align: 'right' });
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
    doc.rect(0, 0, pageW, pageH, 'F');
    doc.setTextColor(255, 255, 255);
    if (logoData) {
      doc.addImage(logoData, 'PNG', pageW / 2 - 20, 50, 40, 40);
    }
    doc.setFontSize(26);
    doc.text('Manual de Usuario', pageW / 2, 110, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Módulo de Administrador', pageW / 2, 120, { align: 'center' });
    doc.setFontSize(11);
    doc.text('SIAT — Sistema Integrado de Asistencia Terapéutica', pageW / 2, 135, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Versión 1.0 — ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, 145, { align: 'center' });
    doc.text('Funauta — Fundación de Apoyo al Autista', pageW / 2, 160, { align: 'center' });

    // ---- ÍNDICE ----
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

    // ---- CONTENIDO ----
    const totalPages = secciones.length + 1;
    let pageNum = 2;
    let sectionTitle = secciones[0].titulo;
    doc.addPage();
    pageNum++;
    addHeader(doc, pageNum, totalPages, sectionTitle);
    let yy = headerH + 4;

    secciones.forEach((sec, idx) => {
      // Section title
      const secTitleText = `${idx + 1}. ${sec.titulo}`;
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
                  didDrawPage: (data) => {
                    pageNum++;
                    addHeader(doc, pageNum, totalPages, sectionTitle);
                    yy = headerH + 4;
                  }
                });
                yy = doc.lastAutoTable.finalY + 4;
              } catch (e) {
                yy += 3;
              }
            }
            break;

          case 'nota': {
            doc.setFontSize(7.5);
            doc.setTextColor(90, 90, 90);
            const nIcon = bloque.variante === 'warning' ? '⚠ ' : bloque.variante === 'success' ? '✓ ' : bloque.variante === 'danger' ? '✗ ' : 'ℹ ';
            const nLines = doc.splitTextToSize(nIcon + bloque.valor, contentW - 8);
            const noteH = nLines.length * lineH + 4;
            checkPage(noteH + 3);
            const colorMap = { info: [230, 240, 255], warning: [255, 245, 220], success: [225, 245, 225], danger: [255, 225, 225] };
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

    addFooter(doc, yy + 2);
    doc.save('manual_usuario_admin_siat.pdf');
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
    <div ref={contentRef} className={`${fullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-[#0B1120] p-8 overflow-y-auto' : ''}`}>
      <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl mx-auto">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-[#011C3F] to-[#034EA1] rounded-xl p-6 md:p-8 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/15 rounded-xl backdrop-blur-sm">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Manual de Usuario</h2>
                <p className="text-sm text-blue-200 mt-0.5">Guía de referencia del módulo de administrador SIAT</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleFullscreen}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors backdrop-blur-sm"
                title={fullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{fullscreen ? 'Salir' : 'Completo'}</span>
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/30"
              >
                <Download className="w-4 h-4" /> <span className="hidden sm:inline">Descargar</span> PDF
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-semibold transition-colors backdrop-blur-sm"
                title="Imprimir"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Buscador */}
          <div className="flex items-center gap-3 mt-5 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300" />
              <input
                type="text"
                placeholder="Buscar en el manual por tema, palabra clave..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-4 pr-10 py-3 text-sm bg-white/10 border border-white/20 rounded-lg outline-none focus:ring-2 focus:ring-white/30 placeholder:text-blue-300/60 text-white transition-all"
              />
            </div>
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="px-3 py-3 text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0">
                Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Layout de dos columnas */}
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Tabla de Contenidos - Sidebar */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border border-slate-200 dark:border-slate-800/60 sticky top-6 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <BookMarked className="w-3.5 h-3.5" /> Contenidos
                </h3>
              </div>
              <nav className="p-2 space-y-0.5 max-h-[70vh] overflow-y-auto">
                {secciones.map((sec, i) => {
                  const IconComp = iconos[sec.icono] || iconos.default;
                  const isActive = seccionesAbiertas.has(sec.id);
                  return (
                    <button
                      key={sec.id}
                      onClick={() => jumpToSection(sec.id)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                      }`}
                    >
                      <IconComp className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{sec.titulo}</span>
                      {isActive && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Contenido principal */}
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
                <article
                  id={`seccion-${sec.id}`}
                  key={sec.id}
                  className={`bg-white dark:bg-[#1E293B] rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${
                    seccionesAbiertas.has(sec.id)
                      ? 'border-blue-200 dark:border-blue-900/50 shadow-md'
                      : 'border-slate-200 dark:border-slate-800/60 hover:shadow-md'
                  }`}
                >
                  <button
                    onClick={() => toggleSeccion(sec.id)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${seccionesAbiertas.has(sec.id) ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'} transition-colors`}>
                        <IconComp className={`w-5 h-5 ${seccionesAbiertas.has(sec.id) ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`} />
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

            {/* Footer */}
            <div className="text-center text-xs text-slate-400 dark:text-slate-500 py-6 border-t border-slate-200 dark:border-slate-800">
              <p className="font-semibold">SIAT — Sistema Integrado de Asistencia Terapéutica</p>
              <p className="mt-1">Funauta — Fundación de Apoyo al Autista</p>
              <p className="mt-1">Versión 1.0 — {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
