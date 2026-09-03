import { renderManualPDF } from "./pdfManualRenderer";

export const seccionesManualEspecialista = [
  {
    id: "introduccion",
    titulo: "IntroducciÃ³n",
    icono: "introduccion",
    descripcion: "Bienvenido al sistema SIAT para especialistas",
    contenido: [
      {
        tipo: "texto",
        valor:
          "El mÃ³dulo de Especialista estÃ¡ diseÃ±ado para profesionales de la salud (terapeutas, psicÃ³logos, mÃ©dicos) que trabajan con niÃ±os con Trastorno del Espectro Autista (TEA). Desde este panel podrÃ¡ gestionar pacientes, registrar sesiones, crear metas PEI, documentar notas clÃ­nicas SOAP, monitorear la evoluciÃ³n, calibrar sensores IoT y coordinar el plan terapÃ©utico con los representantes.",
      },
      {
        tipo: "texto",
        valor:
          "SIAT integra wearables IoT (pulseras biomÃ©tricas) que permiten la detecciÃ³n temprana de crisis de sobrecarga sensorial, brindando datos objetivos para la toma de decisiones clÃ­nicas.",
      },
    ],
  },
  {
    id: "estructura",
    titulo: "Estructura del Panel",
    icono: "estructura",
    descripcion: "DistribuciÃ³n de la interfaz del especialista",
    contenido: [
      { tipo: "texto", valor: "El panel del especialista se compone de:" },
      {
        tipo: "lista",
        items: [
          "Barra lateral izquierda: NavegaciÃ³n entre las 8 secciones del panel.",
          "Barra superior: Nombre del usuario, campana de notificaciones y modo oscuro.",
          "Ãrea principal: Contenido dinÃ¡mico segÃºn la secciÃ³n seleccionada.",
        ],
      },
      { tipo: "subtitulo", valor: "Secciones de la Barra Lateral" },
      {
        tipo: "tabla",
        encabezados: ["SecciÃ³n", "DescripciÃ³n"],
        filas: [
          [
            "Resumen Global",
            "KPIs, agenda del dÃ­a y alertas de todos los pacientes.",
          ],
          [
            "GestiÃ³n de Pacientes",
            "Listado de pacientes con bÃºsqueda, filtros y registro de nuevos niÃ±os.",
          ],
          [
            "Perfil ClÃ­nico",
            "Ficha del paciente con datos de identidad, nivel TEA y perfil sensorial.",
          ],
          [
            "Historial de EvoluciÃ³n",
            "KPIs de progreso, grÃ¡ficos de evoluciÃ³n y anÃ¡lisis fisiolÃ³gico de crisis.",
          ],
          [
            "AnÃ¡lisis en Casa",
            "Reportes del hogar enviados por el representante (sueÃ±o, Ã¡nimo, crisis).",
          ],
          [
            "AsignaciÃ³n de Actividades",
            "CatÃ¡logo de terapias, constructor de rutinas y sesiones en vivo.",
          ],
          [
            "CalibraciÃ³n de Sensores",
            "GestiÃ³n de dispositivos IoT y calibraciÃ³n de lÃ­nea base fisiolÃ³gica.",
          ],
          ["Manual de Usuario", "Esta guÃ­a de referencia completa."],
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          "Las secciones Historial, AnÃ¡lisis en Casa y Actividades requieren tener un paciente seleccionado previamente.",
      },
    ],
  },
  {
    id: "dashboard",
    titulo: "Resumen Global",
    icono: "dashboard",
    descripcion: "Vista general con KPIs y alertas",
    contenido: [
      { tipo: "subtitulo", valor: "Vista Global (sin paciente seleccionado)" },
      {
        tipo: "texto",
        valor:
          "Al ingresar al panel, se muestra una visiÃ³n general de toda la carga clÃ­nica:",
      },

      { tipo: "subtitulo", valor: "Indicadores Clave (KPIs)" },
      {
        tipo: "tabla",
        encabezados: ["KPI", "DescripciÃ³n"],
        filas: [
          ["Pacientes Activos", "Total de niÃ±os asignados al especialista"],
          ["Cumplimiento PEI", "Porcentaje promedio de avance en metas PEI"],
          [
            "Alertas (24h)",
            "Alertas de crisis registradas en las Ãºltimas 24 horas",
          ],
        ],
      },

      { tipo: "subtitulo", valor: "Alertas Globales" },
      {
        tipo: "texto",
        valor:
          "Feed de novedades con las alertas mÃ¡s recientes de todos los pacientes, mostrando timestamp, nombre del paciente y descripciÃ³n de la alerta.",
      },

      {
        tipo: "subtitulo",
        valor: "Panel ClÃ­nico (con paciente seleccionado)",
      },
      {
        tipo: "texto",
        valor:
          "Al seleccionar un paciente (desde GestiÃ³n de Pacientes o la Agenda), se despliega el Panel del Paciente, una vista integral que resume la informaciÃ³n clÃ­nica mÃ¡s relevante:",
      },
      {
        tipo: "tabla",
        encabezados: ["Tarjeta", "DescripciÃ³n"],
        filas: [
          [
            "Resumen del DÃ­a",
            "Estado regulatorio estimado del paciente y datos del dÃ­a (calma, actividad).",
          ],
          [
            "Detonantes Sensoriales",
            "DistribuciÃ³n de los principales detonantes de crisis registrados.",
          ],
          [
            "Alertas Recientes",
            "Ãšltimas alertas de crisis con hora y detalle.",
          ],
          ["Notas SOAP", "Notas clÃ­nicas SOAP mÃ¡s recientes del paciente."],
          [
            "Progreso de Metas PEI",
            "Mini-progreso de las metas terapÃ©uticas y acceso a creaciÃ³n de nuevas metas.",
          ],
        ],
      },
      {
        tipo: "subtitulo",
        valor: "Barra de Acciones RÃ¡pidas",
      },
      {
        tipo: "texto",
        valor:
          "En la cabecera del Panel del Paciente se disponen los accesos rÃ¡pidos a las acciones clÃ­nicas principales: Registrar Incidente, Anotar IndicaciÃ³n, Reporte PDF, Nota SOAP e Historial. En pantallas pequeÃ±as, las acciones se agrupan en un menÃº desplegable 'MÃ¡s'.",
      },
    ],
  },
  {
    id: "patients",
    titulo: "GestiÃ³n de Pacientes",
    icono: "patients",
    descripcion: "Listado, bÃºsqueda y registro de pacientes",
    contenido: [
      { tipo: "subtitulo", valor: "Listado de Pacientes" },
      {
        tipo: "texto",
        valor:
          "CuadrÃ­cula de tarjetas mostrando todos los pacientes asignados. Cada tarjeta incluye:",
      },
      {
        tipo: "lista",
        items: [
          "Iniciales del paciente en un cÃ­rculo azul.",
          "Indicador de estado del hardware (Online/Offline).",
          "Nombre completo, ID y nivel de desarrollo TEA.",
          'BotÃ³n "Gestionar Paciente": abre el Perfil ClÃ­nico del paciente.',
        ],
      },

      { tipo: "subtitulo", valor: "BÃºsqueda y Filtros" },
      {
        tipo: "lista",
        items: [
          "Campo de bÃºsqueda: filtra pacientes por nombre o apellido.",
          "Filtro por nivel de desarrollo: seleccione Nivel 1, 2 o 3.",
        ],
      },

      { tipo: "subtitulo", valor: "Registrar Nuevo Paciente" },
      {
        tipo: "pasos",
        items: [
          'Haga clic en "Registrar Nuevo NiÃ±o" en la parte superior.',
          "Complete los datos del paciente: nombres, apellidos, fecha de nacimiento, gÃ©nero y nivel TEA.",
          "Complete los datos del representante: nombres, apellidos y correo electrÃ³nico.",
          'Presione "Crear Registro".',
          "El sistema generarÃ¡ un enlace de activaciÃ³n Ãºnico para el representante.",
          "Copie el enlace y compÃ¡rtalo con el representante para que configure su cuenta.",
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
    titulo: "Perfil ClÃ­nico",
    icono: "student",
    descripcion: "Ficha del paciente con datos clÃ­nicos",
    contenido: [
      {
        tipo: "texto",
        valor:
          "Formulario de dos columnas con los datos maestros del paciente. Por defecto se muestra en modo lectura.",
      },

      { tipo: "subtitulo", valor: "Datos de Identidad" },
      {
        tipo: "tabla",
        encabezados: ["Campo", "DescripciÃ³n"],
        filas: [
          [
            "CÃ³digo Interno",
            "ID Ãºnico del paciente en el sistema (solo lectura)",
          ],
          ["Nombres", "Nombres del estudiante"],
          ["Apellidos", "Apellidos del estudiante"],
          ["Fecha de Nacimiento", "Fecha de nacimiento del paciente"],
        ],
      },

      { tipo: "subtitulo", valor: "ParÃ¡metros ClÃ­nicos" },
      {
        tipo: "lista",
        items: [
          "GÃ©nero: Masculino / Femenino.",
          "Nivel de Desarrollo: Nivel 1, 2 o 3 con sus descripciones clÃ­nicas.",
          "Perfil de Sensibilidad: Hipo-reactividad Auditiva, Hiper-reactividad TÃ¡ctil, Perfil Sensorial Mixto.",
        ],
      },

      { tipo: "subtitulo", valor: "Editar Perfil" },
      {
        tipo: "pasos",
        items: [
          'Haga clic en "Editar Perfil" para habilitar la ediciÃ³n.',
          "Modifique los campos necesarios.",
          'Presione "Guardar Cambios" para persistir los datos.',
          'Presione "Cancelar" para descartar los cambios.',
        ],
      },
      {
        tipo: "nota",
        variante: "warning",
        valor:
          "Los cambios en el perfil clÃ­nico se reflejan inmediatamente en el sistema y son visibles para el representante.",
      },
    ],
  },
  {
    id: "historial",
    titulo: "Historial de EvoluciÃ³n",
    icono: "historial",
    descripcion: "KPIs, grÃ¡ficos y anÃ¡lisis de crisis",
    contenido: [
      { tipo: "subtitulo", valor: "Indicadores Clave" },
      {
        tipo: "tabla",
        encabezados: ["Indicador", "DescripciÃ³n"],
        filas: [
          [
            "Promedio de Calma",
            "Porcentaje promedio de tiempo en calma en las sesiones",
          ],
          [
            "Total de Sesiones",
            "NÃºmero total de sesiones terapÃ©uticas registradas",
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
          "Puede filtrar los datos por rango: Ãšltimos 7 dÃ­as, Este Mes o Todo el historial.",
      },

      { tipo: "subtitulo", valor: "GrÃ¡fico de EvoluciÃ³n" },
      {
        tipo: "texto",
        valor:
          "GrÃ¡fico de barras que muestra el porcentaje de tiempo en calma (pro_calm) por fecha. Las barras en azul indican >75% de calma; las grises indican â‰¤75%.",
      },

      { tipo: "subtitulo", valor: "Tabla de Registro ClÃ­nico" },
      {
        tipo: "texto",
        valor:
          "Tabla detallada con fecha, nÃºmero de sesiones, efectividad (verde/rojo) y notas mÃ©dicas.",
      },

      { tipo: "subtitulo", valor: "AnÃ¡lisis FisiolÃ³gico de Crisis" },
      {
        tipo: "texto",
        valor:
          "Panel avanzado que cruza datos del sensor MAX30102 (pulso) y MPU6050 (movimiento) para determinar el tipo de crisis:",
      },
      {
        tipo: "tabla",
        encabezados: ["CondiciÃ³n", "DiagnÃ³stico"],
        filas: [
          [
            "BPM > umbral mÃ¡ximo + Mov < 3G",
            "Sobrecarga Sensorial Coherente (EstrÃ©s Emocional)",
          ],
          [
            "BPM > umbral mÃ¡ximo + Mov > 7G",
            "Hiperactividad FÃ­sica / Esfuerzo Motor",
          ],
          [
            "Mov > 8G + BPM â‰¤ umbral",
            "Conducta Repetitiva / Estereotipia de Calma",
          ],
          ["Otros casos", "EstrÃ©s FisiolÃ³gico Moderado (Precrisis)"],
        ],
      },
      { tipo: "subtitulo", valor: "Exportar PDF" },
      {
        tipo: "texto",
        valor:
          'Haga clic en "Exportar PDF MÃ©dico" para descargar un reporte profesional con los datos de evoluciÃ³n, incluyendo logo, tabla estilizada y formato landscape.',
      },
    ],
  },
  {
    id: "home_analytics",
    titulo: "AnÃ¡lisis en Casa",
    icono: "home_analytics",
    descripcion: "Reportes del hogar enviados por el representante",
    contenido: [
      {
        tipo: "texto",
        valor:
          "Panel que cruza los datos del wearable fuera de la clÃ­nica con las notas registradas por el representante en el Diario de Hogar.",
      },

      { tipo: "subtitulo", valor: "Indicadores de Resumen" },
      {
        tipo: "tabla",
        encabezados: ["Indicador", "DescripciÃ³n"],
        filas: [
          [
            "Promedio de Calma",
            "Porcentaje promedio de calma en el perÃ­odo analizado",
          ],
          ["Mejor DÃ­a", "DÃ­a con mayor porcentaje de calma"],
          ["Peor DÃ­a (MÃ¡s Crisis)", "DÃ­a con mayor sobrecarga registrada"],
        ],
      },

      { tipo: "subtitulo", valor: "GrÃ¡fico: Balance Emocional por DÃ­a" },
      {
        tipo: "texto",
        valor:
          "GrÃ¡fico de barras apiladas que muestra la proporciÃ³n de Calma (azul) vs Sobrecarga (rojo) por dÃ­a. Las barras son clickeables para filtrar el detalle.",
      },

      { tipo: "subtitulo", valor: "GrÃ¡fico: Frecuencia CardÃ­aca" },
      {
        tipo: "texto",
        valor:
          "GrÃ¡fico de Ã¡rea que muestra la distribuciÃ³n de BPM durante el dÃ­a seleccionado.",
      },

      { tipo: "subtitulo", valor: "Registro ClÃ­nico Detallado" },
      {
        tipo: "texto",
        valor:
          "Tabla filtrada por dÃ­a que muestra hora de registro, BPM (rojo si >100) y resumen clÃ­nico con datos de sueÃ±o, estado de Ã¡nimo, apetito, crisis, digestiÃ³n y medicaciÃ³n.",
      },
    ],
  },
  {
    id: "rutinas",
    titulo: "AsignaciÃ³n de Actividades",
    icono: "rutinas",
    descripcion: "Terapias, sesiones en vivo y constructor de rutinas",
    contenido: [
      { tipo: "subtitulo", valor: "CatÃ¡logo de Terapias" },
      {
        tipo: "texto",
        valor:
          "CuadrÃ­cula de tarjetas con las terapias disponibles. Cada tarjeta muestra:",
      },
      {
        tipo: "lista",
        items: [
          "CategorÃ­a (Higiene, TerapÃ©utico, AlimentaciÃ³n, Educativo, RegulaciÃ³n Sensorial).",
          "DuraciÃ³n estimada y tÃ­tulo de la terapia.",
          "Instrucciones detalladas.",
          'BotÃ³n "Iniciar SesiÃ³n en Vivo".',
        ],
      },

      { tipo: "subtitulo", valor: "Constructor de Terapias" },
      {
        tipo: "texto",
        valor:
          "Panel deslizante (drawer) con 4 pestaÃ±as para crear terapias personalizadas:",
      },

      {
        tipo: "tabla",
        encabezados: ["PestaÃ±a", "Campos"],
        filas: [
          [
            "Detalles ClÃ­nicos",
            "Nombre, categorÃ­a, duraciÃ³n estimada, dificultad (Baja/Media/Alta)",
          ],
          [
            "Paso a Paso",
            "Lista dinÃ¡mica de pasos con instrucciÃ³n y tiempo estimado",
          ],
          [
            "Materiales",
            "Materiales requeridos, imagen/pictograma (drag & drop), video de referencia (URL)",
          ],
          [
            "Metas PEI",
            "DescripciÃ³n de meta, criterio de maestrÃ­a, lista de metas actuales",
          ],
        ],
      },

      { tipo: "subtitulo", valor: "SesiÃ³n en Vivo" },
      {
        tipo: "pasos",
        items: [
          'Seleccione una terapia y presione "Iniciar SesiÃ³n en Vivo".',
          "Siga las instrucciones paso a paso mientras el cronÃ³metro corre.",
          'Presione "Detener" para finalizar la sesiÃ³n.',
          "EvalÃºe la cooperaciÃ³n del paciente (1-5 estrellas).",
          "Agregue notas u observaciones.",
          'Presione "Guardar BitÃ¡cora" para registrar la sesiÃ³n.',
        ],
      },
    ],
  },
  {
    id: "inventario",
    titulo: "CalibraciÃ³n de Sensores",
    icono: "inventario",
    descripcion: "GestiÃ³n de dispositivos IoT y calibraciÃ³n fisiolÃ³gica",
    contenido: [
      { tipo: "subtitulo", valor: "GestiÃ³n de Dispositivos" },
      { tipo: "texto", valor: "Grid de dispositivos IoT mostrando:" },
      {
        tipo: "lista",
        items: [
          "Estado Online/Offline con indicador verde/rojo.",
          "Nombre, ID y tipo de sensor.",
          "Barra de baterÃ­a (verde >50%, amarillo >20%, rojo â‰¤20%).",
          "Barra de seÃ±al (azul >70%, amarillo >30%, gris â‰¤30%).",
          'BotÃ³n "Calibrar Sensor" para iniciar la calibraciÃ³n.',
        ],
      },

      { tipo: "subtitulo", valor: "CalibraciÃ³n de LÃ­nea Base (15 segundos)" },
      {
        tipo: "texto",
        valor:
          "Proceso de 3 pasos para establecer los umbrales personalizados del paciente:",
      },

      { tipo: "subtitulo", valor: "Paso 1: PreparaciÃ³n" },
      {
        tipo: "texto",
        valor:
          'El sistema explica la prueba de pulso en reposo de 15 segundos. Muestra los umbrales actuales (BPM mÃ­nimo y mÃ¡ximo). Presione "Iniciar CalibraciÃ³n" para comenzar.',
      },

      { tipo: "subtitulo", valor: "Paso 2: MediciÃ³n" },
      {
        tipo: "texto",
        valor:
          "AnimaciÃ³n de pulso con valores BPM fluctuando. Cuenta regresiva de 15 segundos con barra de progreso. El paciente debe permanecer en reposo.",
      },

      { tipo: "subtitulo", valor: "Paso 3: Resultados" },
      { tipo: "texto", valor: "Una vez completada la mediciÃ³n, se muestran:" },
      {
        tipo: "lista",
        items: [
          "Reposo Basal: BPM promedio del paciente en reposo.",
          "Umbral MÃ­nimo: 90% del BPM basal.",
          "Umbral MÃ¡ximo: 145% del BPM basal.",
          'Puede optar por "Repetir" o "Guardar y Aplicar Umbrales".',
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          "La calibraciÃ³n precisa permite que el sistema detecte automÃ¡ticamente crisis de sobrecarga sensorial cuando el BPM supera el umbral mÃ¡ximo sin aceleraciÃ³n en el MPU6050.",
      },

      { tipo: "subtitulo", valor: "Agregar Nuevo Sensor" },
      {
        tipo: "lista",
        items: [
          'Presione "Nuevo Sensor" en la parte superior.',
          "Complete: nombre del sensor y tipo de dispositivo.",
          "Tipos disponibles: Pulsera BiomÃ©trica MAX30102, AcelerÃ³metro MPU6050, Sensor Temperatura MLX90614, Casco EEG BÃ¡sico.",
        ],
      },
    ],
  },
  {
    id: "soap",
    titulo: "Notas SOAP",
    icono: "soap",
    descripcion: "DocumentaciÃ³n clÃ­nica estructurada",
    contenido: [
      {
        tipo: "texto",
        valor:
          "Formato de nota clÃ­nica SOAP (Subjetivo, Objetivo, AnÃ¡lisis, Plan) para documentar cada sesiÃ³n terapÃ©utica.",
      },
      {
        tipo: "tabla",
        encabezados: ["Campo", "DescripciÃ³n", "Ejemplo"],
        filas: [
          [
            "S - Subjetivo",
            "Reporte de padres u observaciÃ³n libre",
            "El padre indica que el niÃ±o tuvo problemas para dormir",
          ],
          [
            "O - Objetivo",
            "MÃ©tricas y observaciones medibles",
            "Se completaron 3 de 4 ensayos de contacto visual",
          ],
          [
            "A - AnÃ¡lisis",
            "EvaluaciÃ³n clÃ­nica del profesional",
            "Adecuada tolerancia a estÃ­mulos tÃ¡ctiles hoy",
          ],
          [
            "P - Plan",
            "PrÃ³ximos pasos y rutinas asignadas",
            "Asignar rutina visual de lavado de manos",
          ],
        ],
      },
      {
        tipo: "pasos",
        items: [
          'Desde el panel clÃ­nico del paciente, presione "Nota SOAP".',
          "Complete los 4 campos del formulario clÃ­nico.",
          'Presione "Firmar y Guardar Nota" para registrar.',
        ],
      },
    ],
  },
  {
    id: "indicaciones",
    titulo: "Indicaciones MÃ©dicas",
    icono: "indicaciones",
    descripcion: "Instrucciones para el representante",
    contenido: [
      {
        tipo: "texto",
        valor:
          "Las indicaciones mÃ©dicas son instrucciones o recomendaciones que el especialista envÃ­a al representante. Son visibles inmediatamente en el Expediente ClÃ­nico del representante.",
      },
      {
        tipo: "pasos",
        items: [
          'Desde el panel clÃ­nico del paciente, presione "Anotar IndicaciÃ³n".',
          "Escriba las instrucciones en el Ã¡rea de texto.",
          'Presione "Guardar y Enviar".',
          "La indicaciÃ³n serÃ¡ visible inmediatamente para el representante.",
        ],
      },
      {
        tipo: "nota",
        variante: "info",
        valor:
          'Las indicaciones se muestran en el Expediente ClÃ­nico del representante, en la pestaÃ±a "Indicaciones ClÃ­nicas".',
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
            "Berrinche/Rabieta, Meltdown Sensorial, Estereotipia Repetitiva, AgresiÃ³n, AutolesiÃ³n",
          ],
          ["DuraciÃ³n Aprox.", "<1 min, 1-5 min, 5-15 min, >15 min"],
          [
            "Detonante (Antecedente)",
            "TransiciÃ³n, Demanda clÃ­nica, Ruido, Luces, EstÃ­mulo tÃ¡ctil, Retiro de objeto, Desconocido",
          ],
          ["Apoyo Aplicado", "Texto libre (ej. RespiraciÃ³n de la tortuga)"],
          ["Notas de ObservaciÃ³n", "Texto libre"],
        ],
      },
      {
        tipo: "pasos",
        items: [
          'Desde el panel clÃ­nico del paciente, presione "Registrar Incidente".',
          "Complete el formulario con tipo, duraciÃ³n, detonante y notas.",
          'Presione "Guardar Incidente".',
        ],
      },
    ],
  },
  {
    id: "pei",
    titulo: "Metas PEI (Trial-by-Trial)",
    icono: "pei",
    descripcion: "Plan de EducaciÃ³n Individualizada",
    contenido: [
      {
        tipo: "texto",
        valor:
          "Las metas PEI (Plan de EducaciÃ³n Individualizada) permiten registrar el progreso de objetivos terapÃ©uticos mediante ensayos discretos (trial-by-trial).",
      },
      {
        tipo: "lista",
        items: [
          "Cada meta tiene una descripciÃ³n, un contador de ensayos (trials/totalTrials) y una barra de progreso.",
          'Presione el botÃ³n "+" para incrementar un ensayo exitoso.',
          "La barra de progreso se muestra en verde al alcanzar el 100%.",
          "Las metas se pueden crear desde el constructor de terapias (pestaÃ±a Metas PEI).",
        ],
      },
      { tipo: "subtitulo", valor: "Acciones disponibles" },
      {
        tipo: "lista",
        items: [
          "Incrementar ensayo: registra un ensayo exitoso en la meta.",
          "Crear meta: desde el constructor de terapias, complete descripciÃ³n y criterio de maestrÃ­a.",
          "Seguimiento visual: cada meta muestra el progreso en tiempo real.",
        ],
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
            "No veo pacientes",
            "No hay pacientes asignados",
            "Contacte al administrador de la instituciÃ³n",
          ],
          [
            "No puedo acceder a una secciÃ³n",
            "No hay paciente seleccionado",
            "Seleccione un paciente desde GestiÃ³n de Pacientes o la Agenda",
          ],
          [
            "La calibraciÃ³n no guarda",
            "Error de conexiÃ³n",
            "Verifique la conexiÃ³n con el backend y reintente",
          ],
          [
            "Error al crear meta PEI",
            "Datos incompletos",
            "Complete descripciÃ³n y criterio de maestrÃ­a",
          ],
          [
            "El representante no recibe indicaciones",
            "Cuenta inactiva",
            "Verifique que el representante tenga su cuenta activa",
          ],
          [
            "No aparecen datos de evoluciÃ³n",
            "Sin sesiones registradas",
            "Registre al menos una sesiÃ³n para ver datos",
          ],
          [
            "No se actualizan los sensores IoT",
            "WebSocket desconectado",
            "Verifique la conexiÃ³n del servidor de telemetrÃ­a",
          ],
          [
            "Error al exportar PDF",
            "Datos vacÃ­os",
            "AsegÃºrese de que haya datos en el historial",
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
          ["PEI", "Plan de EducaciÃ³n Individualizada"],
          ["SOAP", "Nota clÃ­nica: Subjetivo, Objetivo, AnÃ¡lisis, Plan"],
          ["ABC", "Modelo Antecedente-Conducta-Consecuencia"],
          ["BPM", "Latidos por minuto (Beats Per Minute)"],
          ["IoT", "Internet de las Cosas â€” dispositivos conectados"],
          ["MAX30100/102", "Sensor Ã³ptico de frecuencia cardÃ­aca"],
          ["MPU6050", "AcelerÃ³metro y giroscopio de 3 ejes"],
          ["LÃ­nea Base", "MediciÃ³n fisiolÃ³gica de referencia del paciente"],
          [
            "Trial-by-Trial",
            "Registro de ensayos discretos para metas terapÃ©uticas",
          ],
          ["Meltdown", "Crisis sensorial por sobrecarga de estÃ­mulos"],
          ["Estereotipia", "Movimientos repetitivos comunes en TEA"],
          ["HIP", "Hipo-reactividad sensorial (menor sensibilidad)"],
          ["Sensorial Mixto", "Perfil con hipo e hiper-reactividad combinadas"],
          ["AAC", "ComunicaciÃ³n Aumentativa y Alternativa"],
        ],
      },
    ],
  },
];

export async function exportManualPDFEspecialista() {
  await renderManualPDF(
    seccionesManualEspecialista,
    "Especialista",
    "manual_usuario_especialista_siat.pdf",
  );
}
