import { renderManualPDF } from "./pdfManualRenderer";

export const seccionesManual = [
  {
    id: "introduccion",
    icono: "introduccion",
    titulo: "Introducción",
    descripcion: "Visión general del módulo de administrador",
    contenido: [
      {
        tipo: "texto",
        valor:
          "El módulo de Administrador está diseñado para el perfil ADMIN_INSTITUCION (Administrador de una fundación o clínica). Desde este panel se gestionan especialistas, pacientes, asignaciones, catálogos, cuentas de usuario y el monitoreo de infraestructura del sistema.",
      },
    ],
  },
  {
    id: "estructura",
    icono: "estructura",
    titulo: "Estructura del Panel",
    descripcion: "Distribución de la interfaz de administración",
    contenido: [
      {
        tipo: "texto",
        valor:
          "El panel de administración se compone de tres partes principales:",
      },
      {
        tipo: "lista",
        items: [
          "Barra lateral izquierda: Navegación entre las secciones del panel.",
          "Barra superior (Topbar): Muestra el nombre del usuario, campana de notificaciones y botón de modo oscuro.",
          "Área principal: Contenido dinámico según la pestaña seleccionada.",
        ],
      },
      { tipo: "subtitulo", valor: "Secciones de la Barra Lateral" },
      {
        tipo: "tabla",
        encabezados: ["Sección", "Ícono", "Descripción"],
        filas: [
          ["Panel Principal", "📊", "KPIs y gráficos del dashboard"],
          [
            "Especialistas",
            "🩺",
            "CRUD de especialistas y especialidades médicas",
          ],
          ["Asignaciones", "🔗", "Asignar pacientes a especialistas"],
          ["Usuarios", "👥", "Gestión de cuentas de acceso"],
          ["Infraestructura", "🖥️", "Estado operativo del sistema"],
          ["Mi Fundación", "⚙️", "Configuración de datos institucionales"],
          ["Manual de Usuario", "📖", "Esta guía de referencia"],
        ],
      },
    ],
  },
  {
    id: "dashboard",
    icono: "dashboard",
    titulo: "Panel Principal (Dashboard)",
    descripcion: "Indicadores clave, gráficos y bitácora",
    contenido: [
      { tipo: "subtitulo", valor: "Indicadores Clave (KPIs)" },
      {
        tipo: "texto",
        valor:
          "Al ingresar al panel principal se muestran cuatro tarjetas con métricas en tiempo real:",
      },
      {
        tipo: "tabla",
        encabezados: ["Indicador", "Descripción"],
        filas: [
          ["Pacientes Activos", "Total de niños registrados en la institución"],
          [
            "Especialistas (Staff)",
            "Cantidad de profesionales de la salud acreditados",
          ],
          [
            "Casos Asignados",
            "Número de asignaciones activas (paciente-especialista)",
          ],
          [
            "Incidentes / Crisis (Mes)",
            "Alertas de sobrecarga sensorial registradas en el mes actual",
          ],
        ],
      },
      { tipo: "subtitulo", valor: "Gráficos" },
      {
        tipo: "lista",
        items: [
          "Carga Clínica y Pacientes: Gráfico de área con la evolución de admisiones e ingresos.",
          "Productividad Terapéutica: Gráfico de barras con horas de terapia impartidas mensualmente.",
        ],
      },
    ],
  },
  {
    id: "reportes",
    icono: "reportes",
    titulo: "Reportes Automáticos",
    descripcion: "Programación del envío periódico de reportes por correo",
    contenido: [
      {
        tipo: "texto",
        valor:
          "Desde el panel principal puede acceder al 'Programador de Reportes Ejecutivos', que le permite configurar el envío automático y periódico de reportes por correo electrónico.",
      },
      { tipo: "subtitulo", valor: "Configuración del envío automático" },
      {
        tipo: "tabla",
        encabezados: ["Campo", "Descripción"],
        filas: [
          [
            "Activar envío automático",
            "Habilita o deshabilita el envío periódico del reporte",
          ],
          [
            "Frecuencia",
            "Diario, Semanal (con día preferido) o Mensual (día 1 del mes)",
          ],
          ["Hora de envío", "Hora del día (HH:MM) en que se genera el reporte"],
          ["Correo destinatario", "Dirección de correo principal del reporte"],
          [
            "Correos adicionales",
            "Lista de correos secundarios que también reciben el reporte",
          ],
          ["Asunto", "Línea de asunto personalizada del correo"],
          [
            "Módulos",
            "Selección de los módulos de datos que se incluyen en el reporte",
          ],
        ],
      },
      { tipo: "subtitulo", valor: "Uso" },
      {
        tipo: "pasos",
        items: [
          'Abra el "Programador de Reportes Ejecutivos" desde el panel principal.',
          "Active el envío automático y defina frecuencia, hora y destinatarios.",
          'Presione "Guardar" para persistir la configuración.',
          'Use "Enviar Prueba Ahora" para generar un envío inmediato y verificar que los correos se reciben correctamente.',
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          "El envío programado se ejecuta mientras el panel de administración esté abierto en el navegador. Cierre sesión o apague el equipo solo si no desea recibir reportes automáticos.",
      },
    ],
  },
  {
    id: "especialistas",
    icono: "especialistas",
    titulo: "Gestión de Especialistas",
    descripcion: "CRUD de profesionales de la salud y especialidades",
    contenido: [
      { tipo: "subtitulo", valor: "Sub-pestañas de navegación" },
      {
        tipo: "texto",
        valor:
          'La sección se divide en dos sub-pestañas: "Especialistas" (gestión del personal clínico) y "Especialidades" (catálogo de especialidades médicas).',
      },
      { tipo: "subtitulo", valor: "Registrar Nuevo Especialista" },
      {
        tipo: "pasos",
        items: [
          'Haga clic en "Especialistas" en la barra lateral. Asegúrese de estar en la sub-pestaña "Especialistas".',
          'Haga clic en el botón "+ Nuevo Especialista" y complete el formulario.',
          'Presione "Registrar Especialista".',
          "El sistema generará automáticamente una contraseña provisional segura y se la mostrará en pantalla.",
        ],
      },
      { tipo: "texto", valor: "Campos del formulario:" },
      {
        tipo: "tabla",
        encabezados: ["Campo", "Descripción", "Obligatorio"],
        filas: [
          ["Cédula", "Número de identificación del especialista", "Sí"],
          ["Correo Electrónico", "Correo con el que accederá al sistema", "Sí"],
          ["Nombres", "Nombres del especialista", "Sí"],
          ["Apellidos", "Apellidos del especialista", "Sí"],
          ["Teléfono de Contacto", "Número telefónico", "No"],
          ["Licencia Médica", "Número de licencia o colegiatura", "No"],
          ["Especialidad", "Seleccionar del catálogo de especialidades", "Sí"],
          ["Institución", "Fundación a la que pertenece", "Sí"],
          ["Sexo", "Masculino o Femenino", "Sí"],
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          "Al crear un especialista se genera una contraseña provisional segura y aleatoria que se muestra en pantalla. El especialista deberá cambiarla en su primer inicio de sesión.",
      },
      { tipo: "subtitulo", valor: 'Filtros de la Tabla "Nómina Médica"' },
      {
        tipo: "texto",
        valor:
          "La tabla de especialistas incluye múltiples filtros para localizar rápidamente al profesional deseado:",
      },
      {
        tipo: "tabla",
        encabezados: ["Filtro", "Descripción"],
        filas: [
          [
            "Búsqueda",
            "Campo de texto que filtra por nombre, apellido o correo electrónico",
          ],
          [
            "Especialidad",
            "Selector desplegable con todas las especialidades del catálogo",
          ],
          [
            "Estado",
            "Filtra por Activo o Inactivo según el estado de la cuenta",
          ],
          ["Género", "Filtra por Masculino o Femenino"],
          [
            "Fecha de registro",
            "Dos date pickers (desde / hasta) para filtrar por fecha de creación",
          ],
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          'Todos los filtros son acumulativos. Use el botón "Limpiar" para resetear todos los filtros a la vez.',
      },
      { tipo: "subtitulo", valor: "Editar Especialista" },
      {
        tipo: "pasos",
        items: [
          'En la tabla "Nómina Médica", ubique al especialista deseado.',
          "Pase el mouse sobre la fila para revelar los botones de acción.",
          'Haga clic en "Editar". Se abrirá un formulario inline.',
          "Modifique nombres, apellidos o correo electrónico.",
          'Presione "Guardar" para confirmar o "Cancelar" para descartar.',
        ],
      },
      { tipo: "subtitulo", valor: "Activar / Desactivar Especialista" },
      {
        tipo: "pasos",
        items: [
          "En la tabla, ubique al especialista.",
          'Haga clic en el badge de estado (verde "Activo" o rojo "Inactivo").',
          "Se abrirá un modal de confirmación. Confirme la acción.",
          "Un especialista desactivado no podrá iniciar sesión en el sistema.",
        ],
      },
      {
        tipo: "nota",
        variante: "warning",
        valor:
          "Desactivar un especialista no elimina sus registros históricos ni asignaciones pasadas. Solo bloquea su acceso al sistema.",
      },
      { tipo: "subtitulo", valor: "Exportar Directorio" },
      {
        tipo: "lista",
        items: [
          "PDF: Genera un documento con nombre, especialidad, clínica, teléfono y estado.",
          "Excel: Genera un archivo .xlsx con código, nombre, especialidad, licencia, email y estado.",
        ],
      },
      { tipo: "subtitulo", valor: "Gestión de Especialidades Médicas" },
      {
        tipo: "texto",
        valor:
          'Cambie a la sub-pestaña "Especialidades" para administrar el catálogo de especialidades:',
      },
      {
        tipo: "tabla",
        encabezados: ["Acción", "Descripción"],
        filas: [
          [
            "Crear",
            'Complete el formulario "Definición de Especialidad Médica". El código se genera automáticamente (formato ESP-{timestamp}).',
          ],
          [
            "Editar",
            'Pase el mouse sobre la fila > haga clic en "Editar" > modifique el nombre o descripción > "Guardar".',
          ],
          [
            "Archivar",
            "Marca la especialidad como inactiva. No aparecerá en formularios de registro de especialistas.",
          ],
          ["Restaurar", "Vuelve a activar una especialidad archivada."],
        ],
      },
      { tipo: "subtitulo", valor: "Filtros de Especialidades" },
      {
        tipo: "texto",
        valor:
          "La tabla de especialidades incluye búsqueda por nombre o código y filtro por estado (Activa / Inactiva).",
      },
    ],
  },
  {
    id: "asignaciones",
    icono: "asignaciones",
    titulo: "Asignaciones (Paciente - Especialista)",
    descripcion: "Vinculación de pacientes con especialistas",
    contenido: [
      { tipo: "subtitulo", valor: "Asignar Paciente a Especialista" },
      {
        tipo: "pasos",
        items: [
          'Haga clic en "Asignaciones" en la barra lateral.',
          'En la sección "Asignar Paciente a Especialista", seleccione un paciente del listado.',
          'Seleccione un especialista activo (con estado "Activo").',
          'Presione "Crear Asignación". La asignación aparecerá en la tabla de casos activos.',
        ],
      },
      { tipo: "subtitulo", valor: "Registrar Nuevo Niño (Invitación Clínica)" },
      {
        tipo: "pasos",
        items: [
          'En la sección de asignaciones, haga clic en "Registrar Nuevo Niño".',
          "Complete los datos del paciente: nombres, apellidos, fecha de nacimiento, género y nivel TEA.",
          "Complete los datos del representante: nombres, apellidos y correo electrónico.",
          'Presione "Crear Registro".',
          "El sistema generará un enlace de activación único.",
          "Copie el enlace y compártalo con el representante para que configure su cuenta.",
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          "Niveles TEA disponibles: Nivel 1 (Leve), Nivel 2 (Moderado), Nivel 3 (Severo).",
      },
      {
        tipo: "nota",
        variante: "success",
        valor:
          "El representante recibirá un enlace de activación por correo electrónico para registrar su cuenta y comenzar a monitorear al niño.",
      },
      { tipo: "subtitulo", valor: "Filtros de la Tabla de Asignaciones" },
      { tipo: "texto", valor: "La tabla de casos clínicos incluye:" },
      {
        tipo: "tabla",
        encabezados: ["Filtro", "Descripción"],
        filas: [
          ["Búsqueda", "Filtra por nombre del paciente o del especialista"],
          ["Estado", "Filtra por Activo o Inactivo"],
          [
            "Fecha de ingreso",
            "Dos date pickers (desde / hasta) para filtrar por fecha de asignación",
          ],
        ],
      },
      { tipo: "subtitulo", valor: "Dar de Alta / Reactivar Asignación" },
      {
        tipo: "lista",
        items: [
          "Dar de Alta: Desactiva la asignación (el especialista ya no atiende a ese paciente).",
          "Reactivar Caso: Vuelve a activar una asignación previamente desactivada.",
        ],
      },
      { tipo: "subtitulo", valor: "Exportar Asignaciones" },
      {
        tipo: "lista",
        items: [
          "PDF: Listado con paciente, especialista, fecha de ingreso y estado.",
          "Excel: Archivo .xlsx con los mismos datos.",
        ],
      },
    ],
  },
  {
    id: "usuarios",
    icono: "usuarios",
    titulo: "Gestión de Usuarios",
    descripcion: "Administración de cuentas de acceso",
    contenido: [
      { tipo: "subtitulo", valor: "Filtros y Búsqueda" },
      {
        tipo: "pasos",
        items: [
          'Haga clic en "Usuarios" en la barra lateral.',
          "Use el campo de búsqueda para filtrar por nombre o correo electrónico.",
          "Use el selector de Rol para ver solo Administradores, Especialistas o Representantes.",
          "Use el selector de Estado para filtrar por Activo o Inactivo.",
          "Use los date pickers para filtrar por rango de fecha de creación.",
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          'Todos los filtros son acumulativos. Use el botón "Limpiar" para resetearlos.',
      },
      { tipo: "subtitulo", valor: "Información de Usuarios" },
      {
        tipo: "texto",
        valor:
          "La tabla muestra para cada usuario: nombre, correo electrónico, rol (Administrador, Especialista, Representante), fecha de creación de la cuenta, último acceso al sistema y estado (Activo/Inactivo).",
      },
      { tipo: "subtitulo", valor: "Activar / Desactivar Cuenta" },
      {
        tipo: "pasos",
        items: [
          'Haga clic en el badge de estado del usuario (verde "Activo" o rojo "Inactivo").',
          "Confirme la acción en el modal de confirmación.",
          "Un usuario desactivado no podrá acceder al sistema hasta ser reactivado.",
        ],
      },
      {
        tipo: "nota",
        variante: "warning",
        valor:
          "Desactivar un usuario revoca todo acceso al sistema, independientemente de su rol.",
      },
    ],
  },
  {
    id: "catalogos",
    icono: "catalogos",
    titulo: "Mi Fundación",
    descripcion: "Configuración de datos institucionales",
    contenido: [
      { tipo: "subtitulo", valor: "Configuración de la Institución" },
      {
        tipo: "pasos",
        items: [
          'Haga clic en "Mi Fundación" en la barra lateral.',
          "Visualice y edite los datos de la institución: RIF, nombre, dirección, teléfono y contacto principal.",
          'Presione "Guardar Cambios" para persistir los cambios.',
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          "El RIF / Código Fiscal ahora es editable. Todos los campos del formulario pueden modificarse.",
      },
      {
        tipo: "nota",
        variante: "success",
        valor:
          'El catálogo de especialidades se gestiona desde la sección "Especialistas" > sub-pestaña "Especialidades".',
      },
    ],
  },
  {
    id: "infraestructura",
    icono: "infraestructura",
    titulo: "Infraestructura",
    descripcion: "Monitoreo del estado del sistema",
    contenido: [
      { tipo: "subtitulo", valor: "Estado del Sistema" },
      {
        tipo: "pasos",
        items: [
          'Haga clic en "Infraestructura" en la barra lateral.',
          "Visualice tres indicadores clave:",
        ],
      },
      {
        tipo: "tabla",
        encabezados: ["Indicador", "Descripción"],
        filas: [
          [
            "Estado API Core",
            "Operatividad del backend (porcentaje de disponibilidad)",
          ],
          ["Nodos Edge (Telemetría)", "Estado de los nodos de transmisión IoT"],
          [
            "Latencia Promedio",
            "Tiempo de respuesta de la red en milisegundos",
          ],
        ],
      },
      { tipo: "subtitulo", valor: "Gráfico de Latencia" },
      {
        tipo: "texto",
        valor:
          "Gráfico de líneas que muestra la latencia de red de las últimas 24 horas en la transmisión de datos biométricos desde las pulseras IoT.",
      },
    ],
  },
  {
    id: "transversales",
    icono: "transversales",
    titulo: "Funcionalidades Transversales",
    descripcion: "Modo oscuro, notificaciones y más",
    contenido: [
      { tipo: "subtitulo", valor: "Modo Oscuro" },
      {
        tipo: "texto",
        valor:
          "Haga clic en el ícono de Luna/Sol en la barra superior para alternar entre modo claro y oscuro en todo el panel.",
      },
      { tipo: "subtitulo", valor: "Notificaciones" },
      {
        tipo: "texto",
        valor:
          "El ícono de campana en la barra superior muestra alertas y notificaciones del sistema en tiempo real.",
      },
      { tipo: "subtitulo", valor: "Mensajes de Retroalimentación" },
      {
        tipo: "texto",
        valor:
          "El sistema muestra mensajes temporales en la parte superior del área de trabajo:",
      },
      {
        tipo: "lista",
        items: [
          "Verde: Operación exitosa.",
          "Rojo: Error en la operación con descripción del problema.",
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          "Los mensajes de retroalimentación desaparecen automáticamente después de 4 segundos.",
      },
    ],
  },
  {
    id: "solucion",
    icono: "solucion",
    titulo: "Solución de Problemas",
    descripcion: "Problemas comunes y sus soluciones",
    contenido: [
      {
        tipo: "tabla",
        encabezados: ["Problema", "Causa", "Solución"],
        filas: [
          [
            "No se cargan los datos",
            "El backend no está corriendo",
            "Verifique que el servidor backend esté activo en http://localhost:3000",
          ],
          [
            "Error al crear especialista",
            "Correo duplicado o cédula existente",
            "Use un correo y cédula únicos",
          ],
          [
            "No aparece en asignaciones",
            "El especialista está inactivo",
            'Actívelo desde la pestaña "Especialistas"',
          ],
          [
            "No aparece paciente",
            "El niño no está registrado",
            'Use "Registrar Nuevo Niño"',
          ],
          [
            "Modal no responde",
            "Error de conexión",
            "Recargue la página y verifique la conexión",
          ],
          [
            "No llega el correo de invitación",
            "SMTP no configurado",
            "Verifique la configuración del servidor de correo en el backend",
          ],
        ],
      },
    ],
  },
  {
    id: "glosario",
    icono: "glosario",
    titulo: "Glosario",
    descripcion: "Términos técnicos y siglas del sistema",
    contenido: [
      {
        tipo: "tabla",
        encabezados: ["Término", "Definición"],
        filas: [
          ["TEA", "Trastorno del Espectro Autista"],
          ["KPI", "Indicador Clave de Rendimiento (Key Performance Indicator)"],
          [
            "CRUD",
            "Crear, Leer, Actualizar, Eliminar (operaciones básicas de datos)",
          ],
          ["IoT", "Internet de las Cosas — dispositivos conectados a internet"],
          [
            "RBAC",
            "Control de Acceso Basado en Roles (Role-Based Access Control)",
          ],
          ["JWT", "JSON Web Token — mecanismo de autenticación seguro"],
          ["PEI", "Plan de Educación Individualizada"],
          [
            "SOAP",
            "Nota clínica estructurada: Subjetivo, Objetivo, Evaluación, Plan",
          ],
          [
            "BPM",
            "Latidos por minuto (Beats Per Minute) — frecuencia cardíaca",
          ],
          ["ESP32", "Microcontrolador utilizado en las pulseras IoT"],
          [
            "MAX30100/102",
            "Sensor óptico para medición de frecuencia cardíaca",
          ],
          ["MPU6050", "Acelerómetro y giroscopio de 3 ejes"],
        ],
      },
    ],
  },
];
export async function exportManualPDF() {
  await renderManualPDF(
    seccionesManual,
    "Administrador",
    "manual_usuario_admin_siat.pdf",
  );
}
