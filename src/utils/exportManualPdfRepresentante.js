import { renderManualPDF } from "./pdfManualRenderer";

export const seccionesManualRepresentante = [
  {
    id: "introduccion",
    titulo: "IntroducciÃ³n",
    icono: "introduccion",
    descripcion: "Bienvenido al sistema SIAT para representantes",
    contenido: [
      {
        tipo: "texto",
        valor:
          "El mÃ³dulo de Representante estÃ¡ diseÃ±ado para padres, madres o tutores de niÃ±os con Trastorno del Espectro Autista (TEA). Desde este panel podrÃ¡ monitorear en tiempo real las constantes vitales de su hijo, registrar reportes diarios, gestionar rutinas terapÃ©uticas, comunicarse con el especialista y acceder a herramientas de apoyo durante crisis sensoriales.",
      },
      {
        tipo: "texto",
        valor:
          "SIAT integra wearables IoT (pulseras biomÃ©tricas) que permiten la detecciÃ³n temprana de crisis de sobrecarga sensorial, brindando tranquilidad y herramientas de intervenciÃ³n inmediata.",
      },
    ],
  },
  {
    id: "estructura",
    titulo: "Estructura del Panel",
    icono: "estructura",
    descripcion: "DistribuciÃ³n de la interfaz del representante",
    contenido: [
      {
        tipo: "texto",
        valor:
          "La interfaz del representante se compone de tres partes principales:",
      },
      {
        tipo: "lista",
        items: [
          "Barra lateral izquierda: NavegaciÃ³n entre las secciones del panel.",
          "Barra superior: Muestra el nombre del usuario, campana de notificaciones en tiempo real y botÃ³n de modo oscuro.",
          "Ãrea principal: Contenido dinÃ¡mico segÃºn la secciÃ³n seleccionada.",
        ],
      },
      { tipo: "subtitulo", valor: "Secciones de la Barra Lateral" },
      {
        tipo: "tabla",
        encabezados: ["SecciÃ³n", "DescripciÃ³n"],
        filas: [
          [
            "Panel Principal",
            "Resumen del estado regulatorio, Ãºltimas alertas y acceso rÃ¡pido a herramientas de crisis.",
          ],
          [
            "Seguimiento en Vivo",
            "Monitoreo en tiempo real de frecuencia cardÃ­aca, movimiento e Ã­ndice de estrÃ©s.",
          ],
          [
            "DÃ­a a DÃ­a",
            "Agenda visual, checklist de tareas diarias y catÃ¡logo de terapias con cronÃ³metro.",
          ],
          [
            "Diario de Hogar",
            "Registro diario de observaciones clÃ­nicas (sueÃ±o, Ã¡nimo, apetito, crisis).",
          ],
          [
            "Herramientas de Apoyo",
            "Tablero de comunicaciÃ³n AAC y sistema de economÃ­a de fichas.",
          ],
          [
            "Expediente ClÃ­nico",
            "Perfil del niÃ±o, historial de alertas e indicaciones del especialista.",
          ],
          ["Manual de Usuario", "Esta guÃ­a de referencia completa."],
        ],
      },
    ],
  },
  {
    id: "dashboard",
    titulo: "Panel Principal",
    icono: "dashboard",
    descripcion: "Resumen del estado del paciente",
    contenido: [
      { tipo: "subtitulo", valor: "Estado Regulatorio" },
      {
        tipo: "texto",
        valor:
          "Tarjeta principal que muestra en tiempo real el nivel de estrÃ©s del niÃ±o:",
      },
      {
        tipo: "lista",
        items: [
          'Verde (â‰¤ 40%): "Calma Basal" â€” el niÃ±o estÃ¡ en estado Ã³ptimo.',
          'Amarillo (â‰¤ 75%): "AgitaciÃ³n Moderada" â€” se recomienda monitorear.',
          'Rojo (> 75%): "Crisis Sensorial / Sobrecarga" â€” requiere intervenciÃ³n inmediata.',
        ],
      },
      {
        tipo: "texto",
        valor:
          "AdemÃ¡s se muestra el pulso actual en BPM y un corazÃ³n animado que late al ritmo del paciente.",
      },

      { tipo: "subtitulo", valor: "Zona SOS Sensorial" },
      {
        tipo: "texto",
        valor:
          "Acceso rÃ¡pido a dos herramientas de intervenciÃ³n durante crisis:",
      },
      {
        tipo: "lista",
        items: [
          "RespiraciÃ³n Tortuga: GuÃ­a interactiva de respiraciÃ³n (inhala 4s â†’ retÃ©n 4s â†’ exhala 4s) con cÃ­rculo animado.",
          "Tablero AAC RÃ¡pido: ComunicaciÃ³n aumentativa con pictogramas bÃ¡sicos (comer, beber, baÃ±o, ayuda, etc.) y sintetizador de voz.",
        ],
      },

      { tipo: "subtitulo", valor: "Foco ClÃ­nico de la Semana" },
      {
        tipo: "texto",
        valor:
          'Muestra el objetivo terapÃ©utico semanal definido por el especialista. Presione "Ver Agenda Visual" para acceder al plan detallado.',
      },

      { tipo: "subtitulo", valor: "Ãšltimos Eventos" },
      {
        tipo: "texto",
        valor:
          "Panel con hasta 4 alertas recientes del paciente con icono, mensaje y hora.",
      },

      { tipo: "subtitulo", valor: "Estado del Wearable IoT" },
      {
        tipo: "texto",
        valor:
          "Indicador del estado de la pulsera biomÃ©trica: conexiÃ³n, nivel de baterÃ­a y calidad de seÃ±al.",
      },
    ],
  },
  {
    id: "sensores",
    titulo: "Seguimiento en Vivo",
    icono: "sensores",
    descripcion: "Monitoreo biomÃ©trico en tiempo real",
    contenido: [
      { tipo: "subtitulo", valor: "Cockpit de BiotelemetrÃ­a" },
      {
        tipo: "texto",
        valor:
          "Panel de monitoreo en tiempo real de las constantes fisiolÃ³gicas del paciente desde la pulsera IoT.",
      },

      { tipo: "subtitulo", valor: "Indicadores en Vivo" },
      {
        tipo: "tabla",
        encabezados: ["Indicador", "Rango Normal", "DescripciÃ³n"],
        filas: [
          [
            "Ritmo CardÃ­aco (BPM)",
            "SegÃºn umbral calibrado",
            "Frecuencia cardÃ­aca actual del paciente",
          ],
          [
            "Movimiento (G)",
            "< 1.2G reposo, > 5.0G estereotipias",
            "Nivel de actividad fÃ­sica y movimientos",
          ],
          [
            "Ãndice de EstrÃ©s",
            "0-100%",
            "Porcentaje calculado de estrÃ©s en tiempo real",
          ],
        ],
      },
      { tipo: "subtitulo", valor: "GrÃ¡fico de SeÃ±al" },
      {
        tipo: "texto",
        valor:
          "GrÃ¡fico de lÃ­neas con ventana deslizante que muestra la evoluciÃ³n del BPM (rojo) y el Ã­ndice de estrÃ©s (pÃºrpura) en los Ãºltimos instantes.",
      },

      { tipo: "subtitulo", valor: "Estado del Hardware" },
      {
        tipo: "lista",
        items: [
          "BaterÃ­a: Nivel de carga de la pulsera biomÃ©trica.",
          "SeÃ±al: Calidad de la conexiÃ³n Bluetooth/red.",
          "Conectividad: Estado del WebSocket con el servidor.",
        ],
      },

      {
        tipo: "nota",
        variante: "info",
        valor:
          "Los datos se actualizan automÃ¡ticamente cada pocos segundos vÃ­a WebSocket. No necesita recargar la pÃ¡gina.",
      },
    ],
  },
  {
    id: "agenda",
    titulo: "DÃ­a a DÃ­a",
    icono: "agenda",
    descripcion: "Agenda visual y terapias interactivas",
    contenido: [
      { tipo: "subtitulo", valor: "Foco ClÃ­nico Semanal" },
      {
        tipo: "texto",
        valor:
          'Objetivo terapÃ©utico de la semana definido por el especialista. Presione "Reportar Avance de Hoy" para notificar el progreso.',
      },

      { tipo: "subtitulo", valor: "Agenda Visual de Hoy" },
      {
        tipo: "texto",
        valor:
          "Checklist de tareas diarias con iconos: lavarse, comer, jugar, estudio, ordenar, dormir.",
      },
      {
        tipo: "lista",
        items: [
          "Cada tarea se marca como completada al hacer clic.",
          "Una barra de progreso muestra el porcentaje de cumplimiento.",
          "Al completar todas las tareas, aparece un mensaje de felicitaciÃ³n.",
        ],
      },

      { tipo: "subtitulo", valor: "CatÃ¡logo de Terapias y Rutinas" },
      {
        tipo: "texto",
        valor:
          "Grid de tarjetas con terapias disponibles. Cada tarjeta muestra categorÃ­a, duraciÃ³n, tÃ­tulo e instrucciones.",
      },
      {
        tipo: "pasos",
        items: [
          "Seleccione una terapia del catÃ¡logo.",
          'Presione "Iniciar SesiÃ³n en Vivo".',
          "Siga las instrucciones paso a paso mientras el cronÃ³metro corre.",
          "Al finalizar, evalÃºe la cooperaciÃ³n del niÃ±o (1-5 estrellas) y agregue notas.",
          'Presione "Guardar SesiÃ³n" para registrar los resultados.',
        ],
      },

      { tipo: "subtitulo", valor: "Constructor de Terapias" },
      {
        tipo: "texto",
        valor:
          "Desde el panel lateral puede crear sus propias terapias personalizadas:",
      },
      {
        tipo: "lista",
        items: [
          "Nombre de la Terapia",
          "CategorÃ­a: Higiene, TerapÃ©utico, AlimentaciÃ³n, Educativo, RegulaciÃ³n Sensorial",
          "DuraciÃ³n Estimada y Dificultad (Baja/Media/Alta)",
          "Pasos estructurados con instrucciÃ³n y tiempo estimado",
        ],
      },
    ],
  },
  {
    id: "diario_hogar",
    titulo: "Diario de Hogar",
    icono: "diario_hogar",
    descripcion: "Registro diario de observaciones clÃ­nicas",
    contenido: [
      {
        tipo: "texto",
        valor:
          "Formulario para registrar observaciones clÃ­nicas diarias del niÃ±o en casa. Esta informaciÃ³n es enviada al especialista para dar seguimiento.",
      },

      { tipo: "subtitulo", valor: "Campos del Formulario" },
      {
        tipo: "tabla",
        encabezados: ["Campo", "Tipo", "Opciones"],
        filas: [
          ["Fecha del Reporte", "Fecha", "Por defecto: hoy"],
          ["Horas de SueÃ±o", "NÃºmero", "0-24 horas"],
          ["Calidad de SueÃ±o", "Select", "Excelente, Interrumpido, Insomnio"],
          ["Apetito", "Select", "Bueno, Regular, Malo / Selectivo"],
          [
            "Estado de Ãnimo",
            "Select",
            "Muy Calmo, Estable, Irritable, Crisis / Sobrecarga",
          ],
          ["Cant. de Crisis Hoy", "NÃºmero", "Entero (mÃ­nimo 0)"],
          ["BPM Estimado", "NÃºmero", "Opcional"],
          ["Desencadenantes", "Texto", "Ej: luces fuertes, cambio de rutina"],
          ["Sensibilidades Sensoriales", "Texto", "DescripciÃ³n libre"],
          [
            "Estado Digestivo",
            "Select",
            "Normal, EstreÃ±imiento, Diarrea, Malestar abdominal",
          ],
          ["MedicaciÃ³n Administrada", "Checkbox", "SÃ­ / No"],
          ["Observaciones", "Texto largo", "Notas adicionales"],
        ],
      },

      { tipo: "subtitulo", valor: "Historial de Reportes" },
      {
        tipo: "texto",
        valor:
          "Tabla con el historial de reportes enviados, mostrando dÃ­a, BPM y resumen clÃ­nico. Los BPM altos (>100) se resaltan en rojo.",
      },

      {
        tipo: "pasos",
        items: [
          "Complete todos los campos del formulario.",
          'Presione "Enviar Reporte al Especialista".',
          "El reporte quedarÃ¡ registrado en el historial y serÃ¡ visible para su especialista.",
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          "Se recomienda llenar el Diario de Hogar al final del dÃ­a para tener un registro completo de la jornada.",
      },
    ],
  },
  {
    id: "herramientas",
    titulo: "Herramientas de Apoyo",
    icono: "herramientas",
    descripcion: "AAC y sistema de economÃ­a de fichas",
    contenido: [
      { tipo: "subtitulo", valor: "Tablero de ComunicaciÃ³n AAC" },
      {
        tipo: "texto",
        valor:
          "Sistema de ComunicaciÃ³n Aumentativa y Alternativa con pictogramas para facilitar la expresiÃ³n del niÃ±o.",
      },
      {
        tipo: "lista",
        items: [
          "Pictogramas por categorÃ­as: Necesidades, Emociones, Acciones.",
          "Constructor de frases: toque pictogramas para armar una frase (mÃ¡ximo 5).",
          'BotÃ³n "Hablar": Reproduce la frase con sintetizador de voz en espaÃ±ol.',
          "Frases frecuentes: las Ãºltimas 4 frases se guardan automÃ¡ticamente.",
          "Pictogramas personalizados: cree sus propios pictogramas con nombre, emoji y categorÃ­a.",
        ],
      },

      { tipo: "subtitulo", valor: "EconomÃ­a de Fichas" },
      {
        tipo: "texto",
        valor:
          "Sistema de recompensas conductuales basado en estrellas para reforzar comportamientos positivos.",
      },
      {
        tipo: "lista",
        items: [
          "Saldo de estrellas: contador visible en la parte superior.",
          "Tareas conductuales: checklist con valor en estrellas. Al completar una tarea, se suman estrellas.",
          "CatÃ¡logo de recompensas: canjee estrellas por premios predefinidos.",
          "Historial de canjes: registro cronolÃ³gico de todas las recompensas canjeadas.",
          "Tareas y recompensas personalizadas: cree las suyas propias.",
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          "Todos los datos de herramientas se guardan automÃ¡ticamente en su navegador (localStorage). No se pierden al cerrar sesiÃ³n.",
      },
    ],
  },
  {
    id: "expediente",
    titulo: "Expediente ClÃ­nico",
    icono: "expediente",
    descripcion: "Perfil del niÃ±o, alertas e indicaciones",
    contenido: [
      {
        tipo: "texto",
        valor: "El Expediente ClÃ­nico agrupa tres secciones en pestaÃ±as:",
      },

      { tipo: "subtitulo", valor: "InformaciÃ³n del Perfil" },
      { tipo: "texto", valor: "Datos del paciente registrados en el sistema:" },
      {
        tipo: "lista",
        items: [
          "Nombre completo del niÃ±o.",
          "CÃ³digo de sistema (ID).",
          "Fecha de nacimiento y edad.",
          "Nivel de desarrollo TEA (Nivel 1 - Leve, Nivel 2 - Moderado, Nivel 3 - Severo).",
          "Perfil sensorial principal.",
          "Especialista asignado.",
        ],
      },
      {
        tipo: "nota",
        variante: "warning",
        valor:
          "La informaciÃ³n del perfil es de solo lectura. Si necesita actualizar algÃºn dato, solicÃ­telo al especialista a cargo.",
      },

      { tipo: "subtitulo", valor: "Registro de Alertas" },
      {
        tipo: "texto",
        valor:
          "LÃ­nea de tiempo de todas las alertas registradas del paciente.",
      },
      {
        tipo: "lista",
        items: [
          "Filtros por fecha y estado (Pendiente, Efectiva, No Efectiva).",
          "Cada alerta muestra: hora, tipo (Crisis/Precrisis), detalles fisiolÃ³gicos (BPM, movimiento, estrÃ©s).",
          'Puede evaluar la efectividad de la intervenciÃ³n: "SÃ­, fue efectiva" o "No fue efectiva".',
        ],
      },

      { tipo: "subtitulo", valor: "Indicaciones ClÃ­nicas" },
      {
        tipo: "texto",
        valor:
          "Listado de indicaciones y recomendaciones dadas por el especialista para el cuidado del niÃ±o en casa.",
      },
    ],
  },
  {
    id: "crisis",
    titulo: "Manejo de Crisis Sensoriales",
    icono: "crisis",
    descripcion: "Protocolos de intervenciÃ³n durante crisis",
    contenido: [
      {
        tipo: "texto",
        valor:
          "SIAT proporciona herramientas integradas para ayudar durante episodios de sobrecarga sensorial:",
      },

      {
        tipo: "subtitulo",
        valor: "Protocolo de RespiraciÃ³n (RespiraciÃ³n Tortuga)",
      },
      {
        tipo: "texto",
        valor:
          "TÃ©cnica de anclaje para regular el sistema nervioso durante una crisis:",
      },
      {
        tipo: "lista",
        items: [
          "Ciclo de 3 fases: Inhala (4s) â†’ RetÃ©n (4s) â†’ Exhala (4s).",
          "CÃ­rculo animado que se expande y contrae guiando la respiraciÃ³n.",
          "NÃºmeros regresivos en el centro para mantener el ritmo.",
          "BotÃ³n de pausa/reanudar para adaptarse al ritmo del niÃ±o.",
        ],
      },

      { tipo: "subtitulo", valor: "Tablero AAC (ComunicaciÃ³n Aumentativa)" },
      {
        tipo: "texto",
        valor:
          "Durante una crisis, la comunicaciÃ³n verbal puede ser difÃ­cil. Use el tablero AAC con pictogramas bÃ¡sicos para entender las necesidades del niÃ±o.",
      },

      { tipo: "subtitulo", valor: "Notificaciones de Alerta" },
      {
        tipo: "texto",
        valor:
          "Cuando el sistema detecta una posible crisis (BPM elevado + movimientos estereotÃ­picos):",
      },
      {
        tipo: "lista",
        items: [
          "La campana de notificaciones vibra y suena.",
          "Aparece un toast emergente con los detalles de la alerta.",
          "Puede acceder al seguimiento en vivo para monitorear la evoluciÃ³n.",
          "DespuÃ©s de la crisis, evalÃºe si la intervenciÃ³n fue efectiva desde el Expediente ClÃ­nico.",
        ],
      },
    ],
  },
  {
    id: "notificaciones",
    titulo: "Notificaciones en Tiempo Real",
    icono: "notificaciones",
    descripcion: "Alertas y comunicaciones del sistema",
    contenido: [
      {
        tipo: "texto",
        valor:
          "El sistema cuenta con un centro de notificaciones en tiempo real:",
      },
      {
        tipo: "lista",
        items: [
          "Campana en la barra superior con contador de notificaciones no leÃ­das.",
          "Las alertas de crisis aparecen automÃ¡ticamente con sonido y vibraciÃ³n.",
          "Puede ver el detalle de cada alerta en el dropdown de notificaciones.",
          'BotÃ³n "Limpiar" para eliminar todas las notificaciones.',
        ],
      },
      { tipo: "subtitulo", valor: "Modo Oscuro" },
      {
        tipo: "texto",
        valor:
          "Haga clic en el Ã­cono de Luna/Sol en la barra superior para alternar entre modo claro y oscuro.",
      },
      { tipo: "subtitulo", valor: "Modo Offline" },
      {
        tipo: "texto",
        valor:
          "SIAT soporta modo offline. Cuando pierde conexiÃ³n a internet, los datos se guardan localmente y se sincronizan automÃ¡ticamente cuando la conexiÃ³n se restablece.",
      },
    ],
  },
  {
    id: "solucion",
    titulo: "SoluciÃ³n de Problemas",
    icono: "solucion",
    descripcion: "Problemas comunes y soluciones",
    contenido: [
      {
        tipo: "tabla",
        encabezados: ["Problema", "Causa", "SoluciÃ³n"],
        filas: [
          [
            "No veo los datos de mi hijo",
            "El niÃ±o no estÃ¡ asignado a su cuenta",
            "Contacte al administrador de la instituciÃ³n",
          ],
          [
            "La pulsera no muestra datos",
            "El wearable estÃ¡ desconectado o sin baterÃ­a",
            "Verifique que la pulsera estÃ© encendida y cargada",
          ],
          [
            "No recibo notificaciones",
            "WebSocket desconectado",
            "Verifique su conexiÃ³n a internet y recargue la pÃ¡gina",
          ],
          [
            "Error al enviar reporte",
            "ConexiÃ³n inestable",
            "Intente de nuevo mÃ¡s tarde. Los datos se guardan localmente",
          ],
          [
            "No puedo iniciar sesiÃ³n",
            "Credenciales incorrectas o cuenta inactiva",
            'Use "Â¿Olvidaste tu contraseÃ±a?" o contacte al administrador',
          ],
          [
            "El enlace de invitaciÃ³n no funciona",
            "El enlace ha expirado",
            "Solicite un nuevo enlace de invitaciÃ³n al administrador",
          ],
        ],
      },
    ],
  },
  {
    id: "glosario",
    titulo: "Glosario",
    icono: "glosario",
    descripcion: "TÃ©rminos tÃ©cnicos y siglas",
    contenido: [
      {
        tipo: "tabla",
        encabezados: ["TÃ©rmino", "DefiniciÃ³n"],
        filas: [
          ["TEA", "Trastorno del Espectro Autista"],
          [
            "AAC",
            "ComunicaciÃ³n Aumentativa y Alternativa â€” mÃ©todos de comunicaciÃ³n no verbal",
          ],
          [
            "BPM",
            "Latidos por minuto (Beats Per Minute) â€” frecuencia cardÃ­aca",
          ],
          [
            "IoT",
            "Internet de las Cosas â€” dispositivos conectados a internet",
          ],
          ["PEI", "Plan de EducaciÃ³n Individualizada"],
          [
            "Sobrecarga Sensorial",
            "Estado de crisis por exceso de estÃ­mulos sensoriales",
          ],
          [
            "Estereotipia",
            "Movimientos repetitivos comunes en TEA (aleteos, balanceos)",
          ],
          [
            "WebSocket",
            "Canal de comunicaciÃ³n en tiempo real entre la pulsera y el sistema",
          ],
          [
            "Pictograma",
            "RepresentaciÃ³n grÃ¡fica utilizada en comunicaciÃ³n aumentativa",
          ],
          [
            "EconomÃ­a de Fichas",
            "Sistema de recompensas para reforzar conductas positivas",
          ],
        ],
      },
    ],
  },
];

export async function exportManualPDFRepresentante() {
  await renderManualPDF(
    seccionesManualRepresentante,
    "Representante",
    "manual_usuario_representante_siat.pdf",
  );
}
