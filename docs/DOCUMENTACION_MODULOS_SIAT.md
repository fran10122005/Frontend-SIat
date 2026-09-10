# SIAT — Especificación Funcional Detallada por Módulo

**Stack**: React 18 + Vite, Tailwind CSS (dark mode `class`), Recharts, jsPDF + jspdf-autotable, xlsx, lucide-react, React Router (routing por vista en `GlobalState`, no `<Route>`), backend Node.js / Express en PostgreSQL (Neon Serverless) con capa de compatibilidad API en `https://backend-siat.onrender.com` (axios en `src/api/axios.js`), WebSocket evento `new_telemetry` (`src/hooks/useTelemetry.js`).

**Seguridad y Rate Limiting**: Middleware `authLimiter` activo en todos los endpoints de autenticación (`/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, `/passkey/login-challenge`, `/passkey/login-verify`) configurado a 10 solicitudes por ventana de 15 minutos (HTTP 429 Too Many Requests).

**Roles** (`userRole` en GlobalState): `ESPECIALISTA`, `REPRESENTANTE`, `ADMIN_INSTITUCION` (alias legacy `ROL_ADM`). Guard RBAC central en `App.jsx → getSafeView()`: ADMIN solo puede ir a `["admin","inventario","sensores","profile"]`; REPRESENTANTE a `["dashboard","rutinas","agenda","perfil_padre","diario_hogar","historial","profile","sensores","herramientas"]`.

**Layout compartido**: `Sidebar.jsx` (drawer <lg, fijo 260px ≥lg; ítems bloqueados con candado si no hay `selectedChildId`: rutinas/historial/home_analytics/inventario/student), `Topbar.jsx` (h-16 sticky: breadcrumb SIAT/rol desktop, hamburguesa móvil, NotificationBell, tour contextual, toggle dark, avatar con iniciales), `Footer.jsx`. Contenedor estándar de página: `max-w-[1400px] mx-auto p-4 md:p-6 flex flex-col gap-6 pb-12`. Título de página unificado: componente `src/components/ui/PageTitle.jsx` = `h1.text-lg.md:text-xl.font-bold.tracking-tight.text-brand-700.dark:text-blue-400.flex.items-center.gap-2` + icono lucide w-5 h-5 a la izquierda (regla global CSS `svg.text-brand-700` lo mantiene visible sobre el degradado de títulos).

---

# 1. PANEL DEL ESPECIALISTA

## 1.1 Panel del Paciente — `dashboard`
**Archivos**: `pages/SpecialistDashboard.jsx` + `components/specialist/*`.
**Estados**: sin paciente → `SpecialistGlobalView`; con paciente → vista clínica interactiva. Loading 700 ms (`LoadingState variant="dashboard"`).

### Header
- `PageTitle` icono Users: `Panel del Paciente: {nom_nino} {ape_nino}` o `Bienvenido, {userName}`.
- Subtítulo (hidden <sm): "Seguimiento PEI, registro conductual y detonantes sensoriales."
- Botones (grid-cols-2 móvil / fila lg): **Registrar Incidente** (primary), **Anotar Indicación** (outline), **Reglas Alerta** (ghost), **Reporte PDF** (ghost, loading "…"), **Historial** (ghost, col-span-2).
- Atajos: `Alt+I` incidente, `Alt+D` indicación.
- Reporte PDF = `exportDashboardReport({userName,userRole,paciente,kpis:[pacientes,metas PEI,alertas,WebSocket],alerts,titulo,fecha})`.

### Vista con paciente (grid `lg:grid-cols-2 gap-6`)
1. **Metas PEI** (`PatientPeiGoals.jsx`):
   - Header: Target icono + "Metas PEI" | derecha: badge Trophy `{completadas} de {total} metas` (tooltip) + botón **Nueva Meta**.
   - `FilterBar embedded`: búsqueda "Buscar meta...", chips de categoría activa, panel Filtros con select "Todas las categorías" + categorías dinámicas.
   - Tarjetas por meta: categoría (uppercase), estado (Iniciando <40% rosa / En Progreso ≥40% ámbar / Avanzada ≥70% / Completada 100% verde), descripción truncada, contador ensayos `met_trial/met_ttria` con AnimatedCounter, botón **+** registrar ensayo (`handleIncrementPeiTrial` → `PATCH /metas/:met_codi/ensayo` con actualización optimista y fallback a `/trial`), barra progreso h-3 con % flotante, bloque Logro (criterio) y Vigencia (fechas `met_fini → met_ffin`). Animación escalonada 50 ms.
   - Vacíos: "No hay metas que coincidan con los filtros." / "No hay metas PEI registradas."
2. **Sensibilidad Sensorial** (`PatientSensoryChart.jsx`): dona Recharts innerRadius 60/outerRadius 90/paddingAngle 5, colores `[#3B82F6,#F59E0B,#10B981,#F43F5E,#8B5CF6]`. Título con "Principal: {detonante}" (truncate). Centro: total eventos. Leyenda 2 columnas con % redondeado. Tooltip "{value} evento(s)". Alturas `h-[330px] sm:h-[310px] lg:h-[350px]`. Vacío: "Sin registros esta semana".
3. **Historial Conductual** (`PatientBehaviorChart.jsx`): barras últimos 7 días por conducta (Berrinche/Estereotipia/Agresión) desde alertas; oculta si total=0.
4. **Crisis Recientes**: máx 3 (`crisisAlerts.slice(0,3)`), hora es-ES HH:mm, badge Crisis (SOBRECARGA, rosa) / Precrisis (ámbar), BPM máx y estrés %. "Ver todo" → historial.
5. **Tarjeta de Incidentes Conductuales (Columna Derecha)**:
   - Contador en badge del total de incidentes registrados para el paciente (`tr_incid`).
   - Lista de los últimos 5 eventos con severidad (badge color: Leve verde, Moderada ámbar, Alta naranja, Crítica rosa), tipo de conducta, duración en minutos y tiempo relativo transcurrido.
   - Resumen del detonante/antecedente principal.
   - Clic en cualquier tarjeta abre el **Modal Detalle del Incidente** con desglose clínico A-B-C completo.

### Modales del dashboard
- **IncidentModal** (Modelo A-B-C):
  - *A - Antecedente/Detonante*: Transición, Demanda, Ruido, Luces brillantes, Estímulo táctil, Retiro de objeto, Cansancio, Hambre, Malestar, Espontáneo.
  - *B - Conducta*: Tipo [Berrinche, Meltdown sensorial, Estereotipia, Agresión, Auto-lesión, Escape, Búsqueda de atención]; Duración [<1 min, 1-5, 5-15, >15]; Severidad Leve/Moderada/Alta/Crítica; Rutina/Actividad previa.
  - *C - Consecuencia y Desenlace*: Intervención aplicada, Resultado [4 niveles de autorregulación], Observaciones clínicas.
  - Envío → `POST /especialista/incidentes/{id_ninos}` (`inc_tipo`, `inc_dura`, `inc_deto`, `inc_seve`, `inc_ruti`, `inc_conse`, `inc_inter`, `inc_resu`, `inc_obse`).
  - Recarga automática de la bitácora y toast de confirmación.
- **IndicacionModal**:
  - Tipo* cards [Terapéutica, Conductual, Médica, Académica, Familiar].
  - Área [12 opciones: Comunicación, Sensorial, Autonomía, Socialización, etc., default General].
  - Frecuencia [Diaria, 2-3 veces por semana, Semanal, Solo en sesión].
  - Duración estimada, Vigencia date opcional, Prioridad Alta/Media/Baja.
  - Instrucciones / Descripción* textarea.
  - Envío → `crearIndicacion` con compatibilidad dual (`POST /especialista/indicaciones/:nin_codi` y fallback a `/reportes/indicacion`).
- **NewPeiGoalModal**: Paso 1 categoría (12 chips) + meta SMART*; Paso 2 ensayos objetivo default 20, línea base %, criterio logro, fechas inicio/límite, notas → `crearPeiGoal`. Toast "🎯 Meta PEI creada correctamente."
- **Modal Detalle del Incidente**: Inspección completa de incidentes con desglose visual de antecedentes, intervención, consecuencias y datos del especialista firmante.
- **AlertRulesConfig**: BPM máx 120 / BPM mín 60 / Movimiento 80% / Ruido 70 dB; tipos activos chips [Crisis IoT, Indicaciones, Emergencia SOS, Comportamiento, Sesiones]; horario silencioso toggle Desde/Hasta. Acceso directo desde el botón "Reglas Alerta" de la cabecera.

### Vista global (sin paciente)
Stats consolidados (`pacientesActivos=listaNinos.length`, alertas, cumplimiento), feed de alertas, gráficos globales 7 días, accesos rápidos protegidos [Historial de Evolución, Gestionar Pacientes, Registrar Incidente, Anotar Indicación] que solicitan selección de paciente.

---

## 1.2 Gestión de Pacientes — `patients`
**Archivo**: `pages/PatientManagement.jsx`.
- Header: PageTitle Users "Gestión de Pacientes" + subtítulo "Pacientes asignados" + badge contador `{filtrados}/{total} pacientes`.
- FilterBar: búsqueda debounce 300 ms (nombre/apellido); Nivel de desarrollo (dinámico); Género M/F; Asignación [Con especialista/Sin especialista]; Orden [nombre A-Z/Z-A, edad ±, ingreso recientes/antiguos]. Chips removibles + limpiar todo.
- Grid tarjetas (3 col): avatar/foto, nombre, edad calculada (Cake), badge `Nv.{nivel}`, badge asignación punto verde/gris. Paginación 8/pág. EmptyState ilustrado.
- FAB "Registrar Nuevo Paciente" → `RegisterChildModal` (3 pasos):
  - *Paso 1 Identidad*: foto Cloudinary (5 MB), Nombre(s)*, Apellidos*, Fecha nacimiento* (calcula edad), Sexo*, Nivel soporte DSM-5 [Nivel 1 Necesita apoyo/Nivel 2 Apoyo notable/Nivel 3 Apoyo muy notable], Diagnóstico opcional.
  - *Paso 2 Clínica*: Condición sensorial/comorbilidad [hiperacusia, táctil, visual, olfativa, vestibular, propioceptiva, TDAH, ansiedad, epilepsia, TOC, discapacidad intelectual, otra], Impacto [Leve/Moderado/Severo], Notas clínicas, Documentos PDF drag&drop Cloudinary 10 MB c/u.
  - *Paso 3 Representante*: Cédula* (busca existente `GET /ninos/representante?cedula=` y reutiliza deshabilitando campos), Correo acceso, Nombres/Apellidos, Parentesco, Teléfono, checkbox consentimiento LOPNNA Art.65 + Infogobierno Art.79 → `POST /ninos/invite-representative`.
  - Éxito nuevo representante → modal "¡Invitación Clínica Creada!" con URL + Copiar Enlace.
- Clic tarjeta: `setSelectedChildId` + nombre → navega `dashboard` (desbloquea módulos).

---

## 1.3 Ficha del Paciente — `student`
**Archivo**: `pages/StudentRecord.jsx` — `GET /ninos/{id}/ficha`.
- Header: PageTitle UserCircle + subtítulo. Sin paciente: aviso "Selecciona un paciente en el menú superior".
- Badges edad/género/nivel TEA (N1 azul/N2 ámbar/N3 rosa).
- Editable (modo edición con FotoUpload): Fecha nacimiento (date), Género radio M/F, Nivel select 1/2/3, Perfil Sensorial [S1 Hipo-reactividad Auditiva, S2 Hiper-reactividad Táctil, S3 Mixto], Diagnóstico textarea, Foto.
- Solo lectura: Código sistema `nin_codi`, Especialista asignado, Institución+teléfono, Representante (nombre-relación-teléfono).
- Guardar → `PUT /ninos/{id}/ficha` + refresca lista. Links pie: historial sensibilidades, manual niveles TEA.

---

## 1.4 Historial de Evolución — `historial`
**Archivo**: `pages/HistoryProgress.jsx`.
Estructurado en **doble pestaña de navegación**:

### Pestaña 1: Evolución y Sesiones
- **KPIs Clínicos**: Promedio Calma % (+5% vs semana pasada), Total Sesiones (Σ tot_sesi), Alertas Efectivas %.
- **Gráfico de Evolución**: BarChart "Evolución del Tiempo en Calma (pro_calm)" con barras ≥75% azul corporativo y resto gris; fallback de 7 días.
- **Filtros**: Rango de tiempo [7 días/Este mes/Todo], búsqueda por notas (`com_tend`), efectividad [Todas/Efectiva/No Efectiva].
- **Tabla de Registros**: Fecha | Calma % | Sesiones (contador circular) | badge Efectiva/No | Notas clínicas. En móvil: tarjetas expandibles. Paginación 8 por página.
- **Acciones**: Botón **Exportar PDF** → `exportHistoryToPDF(filtrados)`.

### Pestaña 2: Incidentes Conductuales (Bitácora A-B-C)
- **KPIs de Incidentes**: Total de Incidentes registrados, Conteo de Alta Severidad / Críticos, Duración promedio en minutos.
- **Barra de Filtros**:
  - Buscador de texto en vivo (filtra por detonante, conducta, consecuencia, intervención y notas).
  - Selector de Severidad: `[TODAS, LEVE, MODERADA, ALTA, CRITICA]`.
  - Selector de Tipo de Incidente: Berrinche, Meltdown sensorial, Agresión, Auto-lesión, Estereotipia, Escape, Búsqueda de atención.
- **Listado Acordeón Expandible**:
  - Cabecera: Icono temático, Tipo de conducta, Badge de severidad, Duración en minutos, Fecha/hora y botón expandir.
  - Desglose clínico interactivo:
    - **A - Detonante / Antecedente**: Situación detonante que inició el episodio.
    - **B - Conducta y Duración**: Manifestación conductual y tiempo de sostenimiento.
    - **C - Consecuencia y Desenlace**: Grado de autorregulación y resolución final.
    - **Estrategia / Intervención aplicada**: Protocolo de contención utilizado.
    - **Rutina en desarrollo**: Actividad que se encontraba ejecutando el niño.
    - **Especialista firmante**: Nombre completo del profesional que levantó el reporte.
- **Paginación dedicada**: 8 incidentes por página con selector de páginas.

---

## 1.5 Análisis en Casa — `home_analytics`
**Archivo**: `pages/HomeAnalytics.jsx` — `GET /ninos/{id}/bitacora`. Sin paciente: pantalla vacía con botón a Gestor.
- KPIs: Calma promedio %, Mejor Día (% calma), Peor Día (% sobrecarga, tarjeta roja).
- BarChart "Balance Emocional por Día": calma (azul) vs sobrecarga (rosa); clic en celda selecciona el día (resaltado). Chips selector día en móvil. Mock 7 días para días sin datos.
- AreaChart "Frecuencia Cardíaca — {día}" (BPM reales; fallback mock horario).
- Registro clínico expandible por hora: badge ánimo [Muy Calmo/Estable/Irritable/Crisis/Sobrecarga], bpm rojo >100; expandido: sueño, ánimo, apetito, crisis, digestión, medicación, desencadenantes, sensibilidad, observaciones.
- Export semanal PDF (`exportHomeWeeklyToPDF`) solo si hay notas.

---

## 1.6 Terapias y Actividades — `rutinas`
**Archivo**: `pages/Routines.jsx`.
- Catálogo grid: categoría, nº sesiones realizadas, duración, título, descripción, instrucciones, pictograma/video, materiales, dificultad badge [Baja verde/Media ámbar/Alta rosa]. Acciones rol gestión: Editar, Eliminar (confirm: "si tiene sesiones quedará inactiva"), ▶ Iniciar sesión en vivo. Filtros: búsqueda, categoría BD, dificultad, Activa/Inactiva. FAB "Crear Nueva Terapia". Gestión de categorías (crear/editar/desactivar, mín 3 car).
- **Sesión en vivo**: `POST /sesiones/iniciar {nin_codi, act_codi, dis_codi:"D001"}` (fallback local `S_FALLBACK_…`) → panel Monitoreo: cronómetro MM:SS, progreso global, paso único en pantalla con countdown gigante (rojo pulsante ≤10 s), auto-avance al vencer tiempo del paso, ←/→ navegación, video/imagen adjunta → Detener/Finalizar → formulario: tiempo total, **Cooperación 1–5 estrellas**, notas → `PUT /sesiones/{ses_codi}/cerrar` con nota `[Cooperación: X/5] …`.
- **Constructor drawer 4 tabs**: Detalles clínicos (Nombre*, Descripción, Categoría select, Duración*, Dificultad); Paso a paso (instrucción+tiempo "2 min", serializa "1. texto (tiempo)"); Materiales (comas; Imagen Cloudinary 5 MB PNG/JPG/SVG/WebP o Video URL YouTube/Vimeo/mp4 preview); Metas PEI (meta + criterio ensayos default 20 → también `crearPeiGoal`).

---

## 1.7 Seguimiento en Vivo (especialista) — `inventario`
**Archivo**: `pages/HardwareInventory.jsx` rama especialista — "Calibración de Dispositivos".
- Grid sensores: icono por tipo (Heart pulso/Activity acelerómetro/Cpu genérico), badge ●Online/○Offline, ID monoespaciado, barras Batería (verde >50/ámbar >20/rojo) y Señal (azul >70/ámbar >30/gris). Botón **Calibrar Sensor**.
- Modal calibración 3 estados: *idle* (explica prueba pulso reposo 15 s, muestra valMini–valMaxi vigentes) → *measuring* (feed BPM ~71–79, countdown 15→0) → *completed* (Reposo basal, Min=90%, Max=145%, nota predictiva hogar) → Repetir / Guardar y Aplicar Umbrales (`saveCalibrationBaseline(avg)`).
- Modal Nuevo Sensor: Nombre*, Tipo [Pulsera MAX30102, Acelerómetro MPU6050, Temperatura MLX90614, Casco EEG] → `addHardware`.

---

## 1.8 Manual de Usuario (especialista)
Ítem no-navegable → `exportManualPDFEspecialista()` (jsPDF, portada Funauta con glosario técnico y normativas clínicas).

---

# 2. PANEL DEL REPRESENTANTE

## 2.1 Inicio — `dashboard` → `pages/MainDashboard.jsx`
- Header: PageTitle LayoutDashboard "Inicio", subtítulo "Paciente: {nomNino}". Botones **Reporte** (PDF) y **Diario de Hoy** (→ diario_hogar).
- **ChildStatusBanner**: gradiente según `liveStress` ≤50 verde "tranquilo"/≤75 ámbar "inquieto"/>75 rojo "en crisis"; badges Estable/Alerta/Crítico; mensaje contextual ("¡Sobrecarga sensorial detectada! Activa el protocolo SOS"); chip conexión WS; BPM corazón animado `60/bpm`s; movimiento G; batería 85%; hora.
- **DaySummary**: mini-tarjetas Ánimo/Sueño/Apetito/Crisis hoy; fila Agenda de hoy X/Y (primeras 4 rutinas → agenda); Indicación del especialista (`weeklyGoal`).
- Columna derecha: **SOS Sensorial** (botones Respiración y Tablero AAC); **Últimos Eventos** (≤4 de `useClinicalData().alertsList`); tarjeta Pulsera IoT (Conectada/Desconectada, batería, señal).
- **BreathingProtocolModal** "Respiración de la Tortuga": ciclo Inhala→Retén→Exhala 4 s con contador, círculo animado, Pausar/Reanudar/Cerrar.
- **AacBoardDrawer**: 6 pictogramas [Comer, Beber, Baño, Ayuda, No quiero, Abrazo]; frase máx 5; "Hablar Frase" TTS (`utils/speech.speak`); Limpiar.

---

## 2.2 Seguimiento en Vivo — `sensores` → `HardwareInventory.jsx` rama padre
- Header: PageTitle Activity "Seguimiento en Vivo"; "Paciente: {nomNino}"; badges WS activo y Pulsera En Línea/Desconectada; botones simular **Crisis/Calma** (WS: `POST /monitoreo/simular-estado`; offline: simulador frontend; teclas S/C).
- Tarjetas: Ritmo Cardíaco BPM + rango calibrado; Movimiento G [<1.2 Reposo, <2.5 Normal, <5 Juego, >5 "Movimientos Estereotípicos"]; Estrés % barra color [Calma <40, Agitación leve >40, Sobrecarga >75] (fórmula: pondera BPM vs umbral y movimiento; mín 80% si mov>8G y bpmRatio>0.4).
- LineChart "Señal de Telemetría Continua": BPM rojo + Estrés % púrpura punteado, ventana deslizante (`useTelemetry`).
- Hardware: LiPo 85% (12 h), Bluetooth 92%.

---

## 2.3 Día a Día — `agenda` → `pages/AgendaDiaria.jsx`
- Foco Clínico Semanal + botón **Reportar Avance de Hoy** (`reportGoalProgress`, se deshabilita tras usar).
- Agenda Visual de Hoy: checklist 6 tareas default (higiene, desayuno, integración sensorial, actividad educativa, ordenar, descanso) en `localStorage agenda_{fecha}`; clic alterna completada (toast felicitación) + progreso %.
- Catálogo terapias (del backend) con **Iniciar Sesión en Vivo** → mismo flujo sesión/cronómetro/cooperación que especialista (`PUT /sesiones/:cod/cerrar`); autocompleta tarea relacionada de la agenda.
- Botón crear terapia oculto para REPRESENTANTE (submit rechaza con toast).

---

## 2.4 Diario de Hogar — `diario_hogar` → `pages/DiarioHogar.jsx`
- Guard: solo REPRESENTANTE ("Acceso Denegado").
- **ConsentimientoModal bloqueante** si no hay consentimiento vigente (`GET /consentimiento/estado/{nin_codi}`; aceptar `POST /consentimiento/aceptar` v1.0; cache sessionStorage). Texto legal LOPNNA Art. 65 / Infogobierno Art. 79.
- Stats: Reportes totales, Último ánimo, Crisis total, Racha días.
- Formulario "Registrar Nuevo Reporte Diario": fecha (hoy), Ánimo [Muy Calmo/Estable/Irritable/Ansioso/Triste], Crisis hoy readonly "Sincronizado vía IoT", Algo positivo, Notas; "+ Más detalles": horas sueño, apetito [Bueno/Regular/Selectivo/Rechazó], terapia [completa/parcial/no], desencadenantes → `POST /ninos/bitacora` (fallback mocks).
- Historial: filtros desde/hasta, ánimo, solo crisis; paginación 8; tarjetas con iconos ánimo 😌😊😠😟😢, sueño, apetito, chips desencadenantes.

---

## 2.5 Herramientas de Apoyo — `herramientas` → `pages/Herramientas.jsx`
Tabs integradas:
- **AAC**: constructor máx 6 pictos + TTS; búsqueda debounce; categorías [Necesidades, Emociones, Acciones, Sensaciones Físicas, Lugares, Personas]; pictos personalizados localStorage; frases recientes reproducibles.
- **Primero-Después**: selects tarea → premio o texto libre; ¡Completado! con confeti de 2 s y animación de estrellas.
- **Regulación Sensorial**: 12 estrategias guiadas [presión profunda, respiración 4-4-4, balanceo, manta peso, audífonos, agua fría, saltar, apretar, masaje, luz tenue, mecedora, masticar] narradas por voz con temporizador de 30 s.
- **Temporizador Visual**: dial SVG circular verde→ámbar→rojo, controles ±min:seg, alarma sonora WebAudio de doble tono.
- **Economía de Fichas**: gráfico 7 días, saldo acumulado, botón otorgar estrella, tareas configurables con checkbox suma/resta, catálogo de recompensas canjeables con historial.

---

## 2.6 Mi Perfil / Expediente Clínico — `perfil_padre` → `pages/ParentProfile.jsx`
Header PageTitle Activity "Expediente Clínico". Consentimiento modal si falta. Tabs:
- **Información del Perfil**: `GET /ninos/mi-expediente` solo lectura — foto, nombre, edad, género, badge Nivel TEA (1/2/3), ingreso; Datos personales (ID nin_codi, nacimiento); Clínica (nivel, Perfil Sensorial Principal, diagnóstico); Institucional (especialista asignado, institución+teléfono).
- **Registro de Alertas** (`shared/AlertCenter.jsx`): timeline cronológico; filtros por fecha y efectividad [Todos/Acción Pendiente/Efectivas/No Efectivas]; cada alerta con BPM máx, movimiento, estrés % y botón de feedback **¿Efectiva? Sí/No** (`POST /reportes/alertas/:id/feedback`).
- **Indicaciones Clínicas** (`shared/Indicaciones.jsx`): paginado a 8 registros; fecha, tipo, prioridad, cita de instrucciones y botón para marcar como leída (`PATCH /especialista/indicaciones/:ind_codi/leer`).

---

## 2.7 Centro de Cuenta — `profile` → `pages/UserProfile.jsx` (compartido)
5 tabs principales:
1. **Información Personal**: nombre, apellidos, teléfono, foto (`PUT /auth/me`); REPRESENTANTE: cédula readonly y parentesco; correo bloqueado.
2. **Seguridad**: Passkeys WebAuthn (`/api/passkey` challenge/verify/list/delete); cambio de contraseña con medidor de fortaleza (`PUT /auth/me/password`); 2FA TOTP con diálogo de confirmación; gestión de sesiones activas (`siat_sessions_v1`).
3. **Notificaciones**: 5 canales configurables (crisis por correo, crisis push, resumen diario, recordatorios, novedades); emergencias SOS prioritarias por correo.
4. **Consentimiento**: Descarga de PDF con constancia y firma digital; historial en `GET /consentimiento/historial`.
5. **Zona de Peligro**: Exportación de expediente en JSON; solicitud de baja/eliminación con plazo legal de 30 días hábiles revocable.

---

# 3. PANEL DE ADMINISTRACIÓN

**Routing**: vista `admin` → `pages/AdminDashboard.jsx`; deep-links `adminTabPaths`: `/admin`, `/admin/especialistas`, `/admin/representantes`, `/admin/historial-clinico`, `/admin/asignaciones`, `/admin/catalogos`, `/admin/infraestructura`, `/admin/usuarios`. Sidebar admin con contadores en vivo. Guard RBAC: `ADMIN_INSTITUCION`.

## 3.1 Panel Principal — tab `dashboard` ("Panel Clínico Institucional")
- Carga paralela: `/admin/especialistas, /admin/ninos, /admin/asignaciones, /admin/metricas, /admin/catalogos, /admin/users, /admin/auditoria`.
- Header: PageTitle Building2 + título por pestaña. Botones: **Exportar** (PDF KPIs + logs de auditoría) y **Programar** (modal: frecuencia Diario/Semanal/Mensual, correo destino; `POST /admin/reportes/programados`).
- **KPIs** (`AdminKPIs.jsx`): Pacientes Activos (`totalNinos`), Especialistas Staff (`totalEspecialistas`), Casos Asignados (`asignacionesActivas`), Incidentes/Crisis Mes (`totalAlertas`, tarjeta roja).
- **Gráficos** (`AdminCharts.jsx`): AreaChart "Carga Clínica y Pacientes" + BarChart "Productividad Terapéutica" (horas acumuladas).
- **Bitácora de Auditoría** (`AdminActivityLog.jsx`): filtros búsqueda, severidad [TODOS, INFO, WARN, SUCCESS, INCIDENTE, ASIGNACION] y fechas; exportación a Excel y PDF apaisado.

---

## 3.2 Directorio de Especialistas — tab `especialistas` (`EspecialistasTab.jsx`)
- Sub-tabs: **Especialistas | Especialidades**.
- Tabla Nómina Médica: Profesional (avatar, título, correo) | Especialidad | Pacientes activos | Estado | Acciones [Editar, Resetear contraseña `POST /admin/especialistas/:id/password`, Activar/Desactivar `PATCH /admin/especialistas/:id/estado`].
- Modal alta `POST /admin/especialistas`: Foto Cloudinary, Cédula/Pasaporte validado, Nombres, Apellidos, Fecha de nacimiento, Sexo, Correo corporativo, Teléfono venezolano validado (+58), Licencia MPPS/CM y Especialidad médica.

---

## 3.3 Representantes Legales — tab `representantes` (`RepresentantesTab.jsx`)
- Tabla de representantes: Nombre, Contacto, Pacientes vinculados, Estado, Acciones de edición de parentesco, reseteo de credenciales y activación.
- Modal de alta de paciente y vinculación de representante (mismo wizard de 3 pasos con detección de duplicados por cédula).

---

## 3.4 Historial Clínico Global — tab `historial_clinico` (`HistorialClinicoTab.jsx`)
- Auditoría médica central de todos los incidentes conductuales y crisis registradas en el sistema (`tr_incid` y alertas IoT).
- KPIs: Total Eventos, Crisis Severas, Efectividad de Intervención (%), Picos Cardíacos máximos.
- Filtros por paciente, especialista tratante, severidad, tipo de conducta y fechas.
- Modal de Ficha de Evento Clínico con antecedentes, duración, BPM y notas de intervención. Exportación a PDF y Excel.

---

## 3.5 Asignaciones — tab `asignaciones` (`AsignacionesTab.jsx`)
- Modal "Asignar Paciente a Especialista" (`POST /admin/asignar`).
- Tabla de casos activos: Paciente, Especialista tratante, Fecha de ingreso, Estado de vinculación y acción de alta/desvinculación (`PATCH /admin/asignaciones/:asi_codi/estado`).

---

## 3.6 Mi Fundación — tab `catalogos` (`CatalogosTab.jsx`)
- Formulario de datos institucionales: RIF, Nombre de la Fundación, Dirección, Teléfono, Correo y Contacto principal (`PUT /admin/instituciones/:codigoOriginal`).

---

## 3.7 Usuarios — tab `usuarios` (`UsuariosTab.jsx`)
- Directorio central de cuentas de acceso: Nombre, Correo, Rol institucional, Fecha de registro, Último acceso, Estado clickeable y reseteo de claves.

---

## 3.8 Infraestructura — tab `infraestructura` (`InfraestructuraTab.jsx`)
- Monitor de salud de servicios `GET /admin/health`: Uptime API Core, Latencia BD (ms), Clientes WebSocket activos y versión de la plataforma con gráfico de latencia de 24 horas y reporte técnico en PDF.

---

# 4. COMPONENTES COMPARTIDOS CLAVE
- `RegisterChildModal` — Wizard de 3 pasos para alta de paciente y asignación de representante legal.
- `AdminModal` — Base estándar para ventanas modales administrativas con diseño responsivo y tema oscuro.
- `ConfirmDialog` — Modal de confirmación para acciones críticas (danger / warning / success).
- `FilterBar` — Barra unificada de filtros con búsqueda debounce, chips dinámicos, selector desplegable y botón de limpieza.
- `Pagination` — Componente reutilizable de paginación accesible.
- `StatusBadge`, `FotoUpload` (Cloudinary 5 MB), `EmptyState`, `LoadingState`, `ResponsiveTable`.
- `ConsentimientoModal` — Modal legal bloqueante para cumplimiento LOPNNA / Ley de Infogobierno.
- `useTelemetry` — Hook de conexión WebSocket para telemetría continua de bioseñales y simulador de estados de crisis/calma.

---

# 5. ENDPOINTS DE LA API (Resumen por Módulo)

### Autenticación y Seguridad (con Rate Limiting)
- `POST /auth/login` (Rate limited: 10 req / 15 min)
- `POST /auth/register` (Rate limited: 10 req / 15 min)
- `POST /auth/forgot-password` (Rate limited: 10 req / 15 min)
- `POST /auth/reset-password` (Rate limited: 10 req / 15 min)
- `POST /passkey/login-challenge` & `POST /passkey/login-verify` (Rate limited)
- `GET /auth/me`, `PUT /auth/me`, `PUT /auth/me/password`

### Especialista y Pacientes
- `GET /ninos/mis-ninos` — Lista de pacientes asignados al especialista.
- `GET /ninos/:id/ficha` & `PUT /ninos/:id/ficha` — Consulta y actualización de expediente.
- `POST /especialista/incidentes/:id_ninos` — Registro de incidente conductual (Modelo A-B-C).
- `GET /especialista/indicaciones/:nin_codi` — Lista de indicaciones prescritas para el paciente.
- `POST /especialista/indicaciones/:nin_codi` — Alta de nueva indicación clínica multidisciplinaria.
- `PATCH /especialista/indicaciones/:ind_codi/leer` — Acuse de recibo / marca de indicación leída.
- `PATCH /metas/:met_codi/ensayo` (alias `trial`) — Incremento de ensayo completado en meta PEI.

### Reportes e Historial Clínico
- `GET /reportes/historial-completo/:nin_codi` — Historial consolidado (evolución, sesiones, indicaciones y bitácora).
- `GET /reportes/evolucion-representante` — Consulta de evolución para representantes.
- `GET /reportes/alertas-representante` — Alertas de telemetría IoT.
- `POST /reportes/alertas/:id/feedback` — Evaluación de efectividad de alerta.

### Terapias, Sesiones y Telemetría
- `GET /sesiones/actividades` — Catálogo de actividades terapéuticas.
- `POST /sesiones/iniciar` & `PUT /sesiones/:cod/cerrar` — Control de ciclo de vida de sesiones en vivo.
- `POST /monitoreo/simular-estado` — Simulación de estados de sobrecarga y calma IoT.

### Administración
- `GET /admin/especialistas`, `POST /admin/especialistas`, `PUT /admin/especialistas/:id`, `PATCH /admin/especialistas/:id/estado`
- `GET /admin/especialidades`, `POST /admin/especialidades`, `PUT /admin/especialidades/:id`, `PATCH /admin/especialidades/:id/estado`
- `GET /admin/representantes`, `PUT /admin/representantes/:usu_codi`
- `GET /admin/asignaciones`, `POST /admin/asignar`, `PATCH /admin/asignaciones/:asi_codi/estado`
- `GET /admin/auditoria`, `GET /admin/metricas`, `GET /admin/health`
- `PUT /admin/instituciones/:codigoOriginal`
