# SIAT — Especificación Funcional Detallada por Módulo

**Stack**: React 18 + Vite, Tailwind CSS (dark mode `class`), Recharts, jsPDF + jspdf-autotable, xlsx, lucide-react, React Router (routing por vista en `GlobalState`, no `<Route>`), backend Laravel en `https://backend-siat.onrender.com` (axios en `src/api/axios.js`), WebSocket evento `new_telemetry` (`src/hooks/useTelemetry.js`).

**Roles** (`userRole` en GlobalState): `ESPECIALISTA`, `REPRESENTANTE`, `ADMIN_INSTITUCION` (alias legacy `ROL_ADM`). Guard RBAC central en `App.jsx → getSafeView()`: ADMIN solo puede ir a `["admin","inventario","sensores","profile"]`; REPRESENTANTE a `["dashboard","rutinas","agenda","perfil_padre","diario_hogar","historial","profile","sensores","herramientas"]`.

**Layout compartido**: `Sidebar.jsx` (drawer <lg, fijo 260px ≥lg; ítems bloqueados con candado si no hay `selectedChildId`: rutinas/historial/home_analytics/inventario), `Topbar.jsx` (h-16 sticky: breadcrumb SIAT/rol desktop, hamburguesa móvil, NotificationBell, tour contextual, toggle dark, avatar con iniciales), `Footer.jsx`. Contenedor estándar de página: `max-w-[1400px] mx-auto p-4 md:p-6 flex flex-col gap-6 pb-12`. Título de página unificado: componente `src/components/ui/PageTitle.jsx` = `h1.text-lg.md:text-xl.font-bold.tracking-tight.text-brand-700.dark:text-blue-400.flex.items-center.gap-2` + icono lucide w-5 h-5 a la izquierda (regla global CSS `svg.text-brand-700` lo mantiene visible sobre el degradado de títulos).

---

# 1. PANEL DEL ESPECIALISTA

## 1.1 Panel del Paciente — `dashboard`
**Archivos**: `pages/SpecialistDashboard.jsx` + `components/specialist/*`.
**Estados**: sin paciente → `SpecialistGlobalView`; con paciente → vista clínica. Loading 700 ms (`LoadingState variant="dashboard"`).

### Header
- `PageTitle` icono Users: `Panel del Paciente: {nom_nino} {ape_nino}` o `Bienvenido, {userName}`.
- Subtítulo (hidden <sm): "Seguimiento PEI, registro conductual y detonantes sensoriales."
- Botones (grid-cols-2 móvil / fila lg): **Registrar Incidente** (primary), **Anotar Indicación** (outline), **Reporte PDF** (secondary, loading "…"), **Nota SOAP** (ghost), **Alertas** (ghost), **Config** (ghost), **Historial** (ghost, col-span-2).
- Atajos: `Alt+I` incidente, `Alt+D` indicación, `Alt+S` SOAP.
- Reporte PDF = `exportDashboardReport({userName,userRole,paciente,kpis:[pacientes,metas PEI,alertas,WebSocket],alerts,titulo,fecha})`.

### Vista con paciente (grid `lg:grid-cols-2 gap-6`)
1. **Metas PEI** (`PatientPeiGoals.jsx`):
   - Header: Target icono + "Metas PEI" | derecha: badge Trophy `{completadas} de {total} metas` (tooltip) + botón **Nueva Meta**.
   - `FilterBar embedded`: búsqueda "Buscar meta...", chips de categoría activa, panel Filtros con select "Todas las categorías" + categorías dinámicas.
   - Tarjetas por meta: categoría (uppercase), estado (Iniciando <40% rosa / En Progreso ≥40% ámbar / Avanzada ≥70% / Completada 100% verde), descripción truncada, contador ensayos `met_trial/met_ttria` con AnimatedCounter, botón **+** registrar ensayo (deshabilitado al llegar al total), barra progreso h-3 con % flotante, bloque Logro (criterio) y Vigencia (fechas `met_fini → met_ffin`). Animación escalonada 50 ms.
   - Vacíos: "No hay metas que coincidan con los filtros." / "No hay metas PEI registradas."
2. **Sensibilidad Sensorial** (`PatientSensoryChart.jsx`): dona Recharts innerRadius 60/outerRadius 90/paddingAngle 5, colores `[#3B82F6,#F59E0B,#10B981,#F43F5E,#8B5CF6]`. Título con "Principal: {detonante}" (truncate). Centro: total eventos. Leyenda 2 columnas con % redondeado. Tooltip "{value} evento(s)". Alturas `h-[330px] sm:h-[310px] lg:h-[350px]`. Vacío: "Sin registros esta semana".
3. **Historial Conductual** (`PatientBehaviorChart.jsx`): barras últimos 7 días por conducta (Berrinche/Estereotipia/Agresión) desde alertas; oculta si total=0.
4. **Crisis Recientes**: máx 3 (`crisisAlerts.slice(0,3)`), hora es-ES HH:mm, badge Crisis (SOBRECARGA, rosa) / Precrisis (ámbar), BPM máx y estrés %. "Ver todo" → historial.

### Modales del dashboard
- **IncidentModal** (ABC): Tipo de conducta* [Berrinche, Meltdown sensorial, Estereotipia, Agresión, Auto-lesión, Escape, Búsqueda de atención]; Duración* [<1 min, 1-5, 5-15, >15]; Antecedente/Detonante A* [Transición, Demanda, Ruido, Luces brillantes, Estímulo táctil, Retiro de objeto, Cansancio, Hambre, Malestar, Espontáneo]; Severidad* Leve/Moderada/Severa (botones verde/ámbar/rosa); Rutina aplicada; Resultado [4 niveles regulación]; Consecuencia C; Intervención; Observaciones → `POST /especialista/incidentes/{id_ninos}` con campos `inc_tipo, inc_dura, inc_deto, inc_seve, inc_ruti, inc_conse, inc_inter, inc_resu, inc_obse`. Toast éxito "🚨 Incidente conductual registrado y tabulado."
- **IndicacionModal**: Tipo* cards [Terapéutica, Conductual, Médica, Académica, Familiar]; Área [12 opciones: Comunicación…Regulación Emocional, default General]; Frecuencia [Diaria…Solo en sesión]; Duración estimada; Vigencia date opcional; Prioridad Alta/Media/Baja (default Media); Instrucciones* textarea → `crearIndicacion(id, {...})`.
- **SoapNoteModal**: 4 textareas requeridos S/O/A/P con guía clínica por sección + banda paciente → `POST /especialista/soap {nin_codi, soap_subj, soap_obje, soap_anal, soap_plan}`.
- **NewPeiGoalModal**: Paso 1 categoría (12 chips) + meta SMART*; Paso 2 ensayos objetivo default 20, línea base %, criterio logro, fechas inicio/límite, notas → `crearPeiGoal`. Toast "🎯 Meta PEI creada correctamente."
- **AlertRulesConfig**: BPM máx 120 / BPM mín 60 / Movimiento 80% / Ruido 70 dB; tipos activos chips [Crisis IoT, Indicaciones, Emergencia SOS, Comportamiento, Sesiones]; horario silencioso toggle Desde/Hasta.

### Vista global (sin paciente)
Stats mock (`pacientesActivos=listaNinos.length`, alertas 0, cumplimiento 0), feed alertas, gráficos globales 7 días, quick actions [Historial de Evolución (highlight), Gestionar Pacientes, Registrar Incidente, Anotar Indicación, Nota SOAP] — todas exigen pacientes asignados + seleccionado ("👆 Selecciona un paciente para continuar").

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

## 1.3 Ficha del Paciente — `student`
**Archivo**: `pages/StudentRecord.jsx` — `GET /ninos/{id}/ficha`.
- Header: PageTitle UserCircle + subtítulo. Sin paciente: aviso "Selecciona un paciente en el menú superior".
- Badges edad/género/nivel TEA (N1 azul/N2 ámbar/N3 rosa).
- Editable (modo edición con FotoUpload): Fecha nacimiento (date), Género radio M/F, Nivel select 1/2/3, Perfil Sensorial [S1 Hipo-reactividad Auditiva, S2 Hiper-reactividad Táctil, S3 Mixto], Diagnóstico textarea, Foto.
- Solo lectura: Código sistema `nin_codi`, Especialista asignado, Institución+teléfono, Representante (nombre-relación-teléfono).
- Guardar → `PUT /ninos/{id}/ficha` + refresca lista. Links pie: historial sensibilidades, manual niveles TEA.

## 1.4 Historial de Evolución — `historial`
**Archivo**: `pages/HistoryProgress.jsx`.
- KPIs: Promedio Calma % (+5% vs semana pasada), Total Sesiones (Σ tot_sesi), Alertas Efectivas %.
- BarChart "Evolución del Tiempo en Calma (pro_calm)": barras ≥75% azul corporativo, resto gris; mock 7 días si vacío.
- Filtros: rango [7 días/Este mes/Todo], búsqueda notas (`com_tend`), efectividad [Todas/Efectiva/No Efectiva].
- Tabla "Registro Clínico Detallado": Fecha | Calma % | Sesiones (contador circular) | badge Efectiva/No | Notas. Móvil tarjetas expandibles. Paginación 8.
- Sección Metas PEI (tarjetas con ensayos y %). Botón **Exportar PDF** → `exportHistoryToPDF(filtrados)`.

## 1.5 Análisis en Casa — `home_analytics`
**Archivo**: `pages/HomeAnalytics.jsx` — `GET /ninos/{id}/bitacora`. Sin paciente: pantalla vacía con botón a Gestor.
- KPIs: Calma promedio %, Mejor Día (% calma), Peor Día (% sobrecarga, tarjeta roja).
- BarChart "Balance Emocional por Día": calma (azul) vs sobrecarga (rosa); clic en celda selecciona el día (resaltado). Chips selector día en móvil. Mock 7 días para días sin datos.
- AreaChart "Frecuencia Cardíaca — {día}" (BPM reales; fallback mock horario).
- Registro clínico expandible por hora: badge ánimo [Muy Calmo/Estable/Irritable/Crisis/Sobrecarga], bpm rojo >100; expandido: sueño, ánimo, apetito, crisis, digestión, medicación, desencadenantes, sensibilidad, observaciones.
- Export semanal PDF (`exportHomeWeeklyToPDF`) solo si hay notas.

## 1.6 Terapias y Actividades — `rutinas`
**Archivo**: `pages/Routines.jsx`.
- Catálogo grid: categoría, nº sesiones realizadas, duración, título, descripción, instrucciones, pictograma/video, materiales, dificultad badge [Baja verde/Media ámbar/Alta rosa]. Acciones rol gestión: Editar, Eliminar (confirm: "si tiene sesiones quedará inactiva"), ▶ Iniciar sesión en vivo. Filtros: búsqueda, categoría BD, dificultad, Activa/Inactiva. FAB "Crear Nueva Terapia". Gestión de categorías (crear/editar/desactivar, mín 3 car).
- **Sesión en vivo**: `POST /sesiones/iniciar {nin_codi, act_codi, dis_codi:"D001"}` (fallback local `S_FALLBACK_…`) → panel Monitoreo: cronómetro MM:SS, progreso global, paso único en pantalla con countdown gigante (rojo pulsante ≤10 s), auto-avance al vencer tiempo del paso, ←/→ navegación, video/imagen adjunta → Detener/Finalizar → formulario: tiempo total, **Cooperación 1–5 estrellas**, notas → `PUT /sesiones/{ses_codi}/cerrar` con nota `[Cooperación: X/5] …`.
- **Constructor drawer 4 tabs**: Detalles clínicos (Nombre*, Descripción, Categoría select, Duración*, Dificultad); Paso a paso (instrucción+tiempo "2 min", serializa "1. texto (tiempo)"); Materiales (comas; Imagen Cloudinary 5 MB PNG/JPG/SVG/WebP o Video URL YouTube/Vimeo/mp4 preview); Metas PEI (meta + criterio ensayos default 20 → también `crearPeiGoal`).

## 1.7 Seguimiento en Vivo (especialista) — `inventario`
**Archivo**: `pages/HardwareInventory.jsx` rama especialista — "Calibración de Dispositivos".
- Grid sensores: icono por tipo (Heart pulso/Activity acelerómetro/Cpu genérico), badge ●Online/○Offline, ID monoespaciado, barras Batería (verde >50/ámbar >20/rojo) y Señal (azul >70/ámbar >30/gris). Botón **Calibrar Sensor**.
- Modal calibración 3 estados: *idle* (explica prueba pulso reposo 15 s, muestra valMini–valMaxi vigentes) → *measuring* (feed BPM ~71–79, countdown 15→0) → *completed* (Reposo basal, Min=90%, Max=145%, nota predictiva hogar) → Repetir / Guardar y Aplicar Umbrales (`saveCalibrationBaseline(avg)`).
- Modal Nuevo Sensor: Nombre*, Tipo [Pulsera MAX30102, Acelerómetro MPU6050, Temperatura MLX90614, Casco EEG] → `addHardware`.

## 1.8 Manual de Usuario (especialista)
Ítem no-navegable → `exportManualPDFEspecialista()` (jsPDF, portada Funauta).

---

# 2. PANEL DEL REPRESENTANTE

## 2.1 Inicio — `dashboard` → `pages/MainDashboard.jsx`
- Header: PageTitle LayoutDashboard "Inicio", subtítulo "Paciente: {nomNino}". Botones **Reporte** (PDF) y **Diario de Hoy** (→ diario_hogar).
- **ChildStatusBanner**: gradiente según `liveStress` ≤50 verde "tranquilo"/≤75 ámbar "inquieto"/>75 rojo "en crisis"; badges Estable/Alerta/Crítico; mensaje contextual ("¡Sobrecarga sensorial detectada! Activa el protocolo SOS"); chip conexión WS; BPM corazón animado `60/bpm`s; movimiento G; batería 85%; hora.
- **DaySummary**: mini-tarjetas Ánimo/Sueño/Apetito/Crisis hoy; fila Agenda de hoy X/Y (primeras 4 rutinas → agenda); Indicación del especialista (`weeklyGoal`).
- Columna derecha: **SOS Sensorial** (botones Respiración y Tablero AAC); **Últimos Eventos** (≤4 de `useClinicalData().alertsList`); tarjeta Pulsera IoT (Conectada/Desconectada, batería, señal).
- **BreathingProtocolModal** "Respiración de la Tortuga": ciclo Inhala→Retén→Exhala 4 s con contador, círculo animado, Pausar/Reanudar/Cerrar.
- **AacBoardDrawer**: 6 pictogramas [Comer, Beber, Baño, Ayuda, No quiero, Abrazo]; frase máx 5; "Hablar Frase" TTS (`utils/speech.speak`); Limpiar.

## 2.2 Seguimiento en Vivo — `sensores` → `HardwareInventory.jsx` rama padre
- Header: PageTitle Activity "Seguimiento en Vivo"; "Paciente: {nomNino}"; badges WS activo y Pulsera En Línea/Desconectada; botones simular **Crisis/Calma** (WS: `POST /monitoreo/simular-estado`; offline: simulador frontend; teclas S/C).
- Tarjetas: Ritmo Cardíaco BPM + rango calibrado; Movimiento G [<1.2 Reposo, <2.5 Normal, <5 Juego, >5 "Movimientos Estereotípicos"]; Estrés % barra color [Calma <40, Agitación leve >40, Sobrecarga >75] (fórmula: pondera BPM vs umbral y movimiento; mín 80% si mov>8G y bpmRatio>0.4).
- LineChart "Señal de Telemetría Continua": BPM rojo + Estrés % púrpura punteado, ventana deslizante (`useTelemetry`).
- Hardware: LiPo 85% (12 h), Bluetooth 92%.

## 2.3 Día a Día — `agenda` → `pages/AgendaDiaria.jsx`
- Foco Clínico Semanal + botón **Reportar Avance de Hoy** (`reportGoalProgress`, se deshabilita tras usar).
- Agenda Visual de Hoy: checklist 6 tareas default (higiene, desayuno, integración sensorial, actividad educativa, ordenar, descanso) en `localStorage agenda_{fecha}`; clic alterna completada (toast felicitación) + progreso %.
- Catálogo terapias (del backend) con **Iniciar Sesión en Vivo** → mismo flujo sesión/cronómetro/cooperación que especialista (`PUT /sesiones/:cod/cerrar`); autocompleta tarea relacionada de la agenda.
- Botón crear terapia oculto para REPRESENTANTE (submit rechaza con toast).

## 2.4 Diario de Hogar — `diario_hogar` → `pages/DiarioHogar.jsx`
- Guard: solo REPRESENTANTE ("Acceso Denegado").
- **ConsentimientoModal bloqueante** si no hay consentimiento vigente (`GET /consentimiento/estado/{nin_codi}`; aceptar `POST /consentimiento/aceptar` v1.0; cache sessionStorage). Texto legal LOPNNA Art. 65 / Infogobierno Art. 79.
- Stats: Reportes totales, Último ánimo, Crisis total, Racha días.
- Formulario "Registrar Nuevo Reporte Diario": fecha (hoy), Ánimo [Muy Calmo/Estable/Irritable/Ansioso/Triste], Crisis hoy readonly "Sincronizado vía IoT", Algo positivo, Notas; "+ Más detalles": horas sueño, apetito [Bueno/Regular/Selectivo/Rechazó], terapia [completa/parcial/no], desencadenantes → `POST /ninos/bitacora` (fallback mocks).
- Historial: filtros desde/hasta, ánimo, solo crisis; paginación 8; tarjetas con iconos ánimo 😌😊😠😟😢, sueño, apetito, chips desencadenantes.

## 2.5 Herramientas de Apoyo — `herramientas` → `pages/Herramientas.jsx`
Tabs: **AAC** (constructor máx 6 pictos + TTS; búsqueda debounce; categorías [Necesidades, Emociones, Acciones, Sensaciones Físicas, Lugares, Personas]; pictos personalizados localStorage; frases recientes 4 reproducibles); **Primero-Después** (selects tarea→premio o texto libre; ¡Completado! +1 estrella confeti 2 s); **Regulación Sensorial** (12 estrategias [presión profunda, respiración 4-4-4, balanceo, manta peso, audífonos, agua fría, saltar, apretar, masaje, luz tenue, mecedora, masticar]; narra por voz + barra 30 s); **Temporizador Visual** (dial SVG verde→ámbar→rojo, ±min:seg, Iniciar/Pausar/Reiniciar, alarma WebAudio doble tono); **Economía de Fichas** (aviso protección clínica; gráfico 7 días estrellas; saldo + Otorgar 1 Estrella; tareas con valor checkbox suma/resta; recompensas costo canje si alcanza; historial canjes; keys `siat_balance/siat_tasks/siat_rewards…`).

## 2.6 Mi Perfil / Expediente Clínico — `perfil_padre` → `pages/ParentProfile.jsx`
Header PageTitle Activity "Expediente Clínico". Consentimiento modal si falta. Tabs:
- **Información del Perfil**: `GET /ninos/mi-expediente` solo lectura — foto, nombre, edad, género, badge Nivel TEA (1/2/3), ingreso; Datos personales (ID nin_codi, nacimiento); Clínica (nivel, Perfil Sensorial Principal, diagnóstico); Institucional (especialista asignado, institución+teléfono). Nota: cambios vía especialista.
- **Registro de Alertas** (`shared/AlertCenter.jsx`): timeline por fecha; filtros fecha/estado [Todos/Acción Pendiente/Efectivas/No Efectivas]; cada alerta: hora, tipo Crisis/Precrisis, BPM máx, movimiento G, estrés %, evaluación **¿Efectiva? Sí/No** → `evaluateAlert()` `POST /reportes/alertas/:id/feedback` (refresca). Fallback 3 demo.
- **Indicaciones Clínicas** (`shared/Indicaciones.jsx`): paginado 8; fecha, cita "…", link "[Ver Rutina asociada]" → rutinas.

## 2.7 Centro de Cuenta — `profile` → `pages/UserProfile.jsx` (compartido)
5 tabs: **Información Personal** (nombre/apellidos/teléfono/foto `PUT /auth/me`; REPRESENTANTE: cédula readonly + parentesco; correo bloqueado); **Seguridad** (Passkeys WebAuthn register/list/delete `api/passkey`; contraseña con medidor fortaleza `PUT /auth/me/password`; 2FA toggle TOTP ConfirmDialog; sesiones activas revocables `siat_sessions_v1` + cerrar otras); **Notificaciones** (5 toggles: crisis correo, crisis push, resumen diario, recordatorios, novedades + permiso push; emergencias siempre por correo); **Consentimiento** (descarga PDF con firma jsPDF; historial `GET /consentimiento/historial`); **Zona de Peligro** (exportar JSON; eliminar cuenta plazo 30 días hábiles, cancelable).

## 2.8 Manual de Usuario (representante)
`exportManualPDFRepresentante()` — 10 secciones + glosario (TEA, AAC, BPM, PEI, estereotipia…).

---

# 3. PANEL DE ADMINISTRACIÓN

**Routing**: vista `admin` → `pages/AdminDashboard.jsx`; deep-links `adminTabPaths`: `/admin`, `/admin/especialistas`, `/admin/representantes`, `/admin/historial-clinico`, `/admin/asignaciones`, `/admin/catalogos`, `/admin/infraestructura`, `/admin/usuarios`. Sidebar admin con contadores (incidentes, asignaciones activas). Cada tab carga solo sus datos (`/admin/*`). Guard: solo ADMIN_INSTITUCION.

## 3.1 Panel Principal — tab `dashboard` ("Panel Clínico Institucional")
- Carga paralela: `/admin/especialistas, /admin/ninos, /admin/asignaciones, /admin/metricas, /admin/catalogos, /admin/users, /admin/auditoria`.
- Header: PageTitle Building2 + título por tab. Botones: **Exportar** (PDF KPIs + alertas logs INCIDENTE/WARN) y **Programar** (modal: toggle automático, frecuencia Diario/Semanal/Mensual, día semana si semanal, correo destino; `localStorage.reportSchedule` + `POST /admin/reportes/programados`).
- Quick actions: Especialistas / Asignaciones / Usuarios / Institución.
- **KPIs** (`AdminKPIs.jsx`): Pacientes Activos (`totalNinos`), Especialistas Staff (`totalEspecialistas`), Casos Asignados (`asignacionesActivas`), Incidentes/Crisis Mes (`totalAlertas`, tarjeta roja). Tendencias decorativas.
- **Gráficos** (`AdminCharts.jsx`): AreaChart "Carga Clínica y Pacientes" (pacientes/mes, badge +108% anual) + BarChart "Productividad Terapéutica" (horas/mes, badge total acumulado).
- **Bitácora** (`AdminActivityLog.jsx`): filtros búsqueda/tipo [TODOS/INFO/WARN/SUCCESS/INCIDENTE/ASIGNACION]/fechas; tabla Fecha|Tipo(badge)|Evento(`aud_desc`)|Actor·IP("Sistema" si vacío); paginación 10 escritorio/5 móvil filas expandibles; export Excel `auditoria_{fecha}.xlsx` + PDF landscape.

## 3.2 Directorio de Especialistas — tab `especialistas` (`EspecialistasTab.jsx`)
- Sub-tabs **Especialistas | Especialidades**.
- Tabla "Nómina Médica": Profesional Clínico (avatar, Dr./Dra., correo) | Especialidad (+N pacientes `_count.tc_asign`) | Estado | Acciones [Editar, Resetear contraseña → `POST /admin/especialistas/:id/password` (clave en toast), Activar/Desactivar → `PATCH .../estado` ConfirmDialog]. Clic fila = vista previa ficha (ID, estado, correo, teléfono, especialidad, licencia, sexo, pacientes activos, nacimiento, acreditación).
- Botones: Nuevo Especialista, PDF, Excel. Filtros: búsqueda, especialidad, estado, género, fechas. Paginación 8.
- Modal alta "Acreditación de Nuevo Especialista" (`POST /admin/especialistas`): Foto Cloudinary specialistPhotos 5 MB; Tipo doc [V,E,Pasaporte] + número (cédula 6–8 dígitos o pasaporte LETRAS+4-8); Nombres*, Apellidos*, Nacimiento (no futura), Sexo M/F*; Correo corporativo*, Teléfono +58 venezolano*; Licencia `CM-#####`/`MPPS-######`*; Especialidad select*. Edición `PUT /admin/especialistas/:id`.
- Sub-tab Especialidades: tabla Especialidad(+ID)|Descripción técnica|Estado|Acciones [Editar, Archivar/Restaurar `PATCH /admin/especialidades/:id/estado`]. Alta (`POST /admin/especialidades`, código auto si omite): Denominación 50 car.*, Código mayúsculas ej PSIC-01, Perfil clínico 1000 car. Edición `PUT .../:id` (código bloqueado). Exports propios.

## 3.3 Representantes Legales — tab `representantes` (`RepresentantesTab.jsx`)
- Tabla: Representante (avatar, nombre, ID)|Contacto (correo+tel)|Paciente Asociado (nombres + badge "N niños")|Estado|Acciones [Editar `PUT /admin/representantes/:usu_codi` (nombres, apellidos, teléfono validado, vínculo legal Madre/Padre/Tutor/Abuela/Abuelo/Hermana/Hermano/Otro), Reset password `POST /admin/users/:id/password`, Activar/Desactivar `PATCH /admin/users/:id/estado`]. Vista previa: usuario+código+pacientes asociados (foto/género/edad/nivel TEA/nacimiento/ID) con **FotoUpload** → `PATCH /admin/ninos/:nin_codi/foto`.
- Botones: PDF, Excel, **Registrar Nuevo Niño** (mismo wizard 3 pasos del especialista; reutiliza representante por cédula; modal invitación con enlace copiable). Filtros búsqueda/estado. Paginación 10.

## 3.4 Historial Clínico Global — tab `historial_clinico` (`HistorialClinicoTab.jsx`)
Solo lectura (datos `incidentesData`; vacío → `MOCK_INCIDENTES`).
- KPIs derivados del filtro: Total Eventos, Crisis Severas, Efectividad Intervención (% RESUELTO/COMPLETADO), Picos Cardíacos (BPM máx).
- Filtros: búsqueda paciente/especialista/síntoma; tipo [Crisis de Sobrecarga, Incidente Conductual, Reporte del Hogar, Evaluación PEI]; severidad [Leve/Moderada/Severa]; fechas. Exports PDF/Excel `historial_clinico_siat_{fecha}.xlsx`.
- Tabla: Paciente(+ID evento)|Tipo/Severidad (badges)|Especialista/Origen|BPM Peak|Fecha-Hora|Detalle(ojo→modal "Ficha de Evento Clínico": tipo, severidad, duración min, BPM, descripción, intervención). Paginación 10.

## 3.5 Asignaciones — tab `asignaciones` (`AsignacionesTab.jsx`)
- Modal "Asignar Paciente a Especialista" (`POST /admin/asignar`): Paciente select (nombre—código), Especialista Tratante select (solo activos), Fecha inicio atención (date ≤ hoy), Estado inicial fijo "Activo".
- Tabla "Casos Clínicos": Paciente(+ID)|Especialista(+ID)|Fecha Ingreso|Estado|Acción [Dar de alta Archive / Reactivar RotateCcw → `PATCH /admin/asignaciones/:asi_codi/estado` ConfirmDialog "Desvincular Paciente"/"Reactivar Asignación"].
- Filtros búsqueda/estado/fechas. Paginación 8. Exports PDF/Excel.

## 3.6 Mi Fundación — tab `catalogos` (`CatalogosTab.jsx`)
Formulario inline con lápiz editar/habilitar: RIF (11 car.), Nombre Fundación*, Dirección, Teléfono, Correo, Sitio web, Contacto principal → **Guardar Cambios** `PUT /admin/instituciones/:codigoOriginal` (RIF viaja en body para poder corregirse). Sin tablas ni paginación.

## 3.7 Usuarios — tab `usuarios` (`UsuariosTab.jsx`, solo ADMIN_INSTITUCION)
- Tabs estado con contadores: Todos/Activos/Suspendidos. Badge "N Usuarios". Exports PDF ("Usuarios del Systema") / Excel `usuarios_siat.xlsx`.
- Filtros: búsqueda nombre/correo, rol [Administradores/Especialistas/Representantes], fechas creación.
- Tabla "Cuentas de Acceso al Sistema": Usuario (icono rol + nombre Dr./Dra./rep/admin + correo)|Rol badge|Creación|Último Acceso ("Nunca")|Estado (**badge clickeable** abre confirmación)|Acciones [Reset password (spinner), Suspender/Activar `PATCH /admin/users/:id/estado` con mensaje HTML revoco/restablece inmediato]. Paginación 8. No crea cuentas aquí.

## 3.8 Infraestructura — tab `infraestructura` (`InfraestructuraTab.jsx`)
Health-check `GET /admin/health` (fallback defaults): tarjetas API Core (uptime %), Base de Datos (latencia ms), WebSocket (clientes conectados), Versión SIAT. LineChart "Latencia de Red (24h)" latencia violeta + uptime verde punteado (mock 00:00–20:00). Badge N puntos. Botón Reporte técnico PDF (`exportInfraestructuraToPDF`). Sin CRUD (el inventario IoT vive en HardwareInventory).

---

# 4. COMPONENTES COMPARTIDOS CLAVE
- `RegisterChildModal` — wizard alta paciente+representante (ver 1.2).
- `AdminModal` — base modals admin (cabecera azul, bottom-sheet móvil).
- `ConfirmDialog` — title/message/type danger|success.
- `FilterBar` — búsqueda + colapsable "Filtros" + contador + chips + "Limpiar todo" + modo `embedded`.
- `Pagination` — anterior/números/siguiente (oculto ≤1 pág).
- `StatusBadge`, `FotoUpload` (Cloudinary), `EmptyState`, `LoadingState`, `ResponsiveTable` (patrón mobile-summary/expandible).
- `ConsentimientoModal` — bloqueante legal representante.
- `useTelemetry` — WS `new_telemetry` → liveBpm/liveStress/liveMov/history + simulador CRISIS/CALMA 10 s.
- Pendientes de integrar (construidos sin cablear, panel especialista): SessionWizard, SessionManager (agenda semanal 7 días), SoapTemplateManager (CRUD plantillas), InterventionCatalog (intervenciones por perfil crisis), MonthlyReportScheduler, PeiReportModal, CrisisReportModal, SessionReportModal, ActivityLog, ReadOnlyMode, IndicacionReadReceipt (`indi_leid` + `PATCH /especialista/indicaciones/:id/leer`).

# 5. ENDPOINTS (resumen por método)
- GET: `/ninos/mis-ninos`, `/ninos/{id}/ficha`, `/ninos/{id}/bitacora`, `/ninos/representante?cedula=`, `/ninos/mi-expediente`, `/reportes/historial-completo/{id}`, `/reportes/alertas-representante`, `/reportes/evolucion-representante`, `/consentimiento/estado/{id}`, `/consentimiento/historial`, `/admin/*` (listas, metricas, auditoria, health), `/sesiones/actividades?nin_codi=`.
- POST: `/especialista/incidentes/{id}`, `/especialista/soap`, `/auth/login|register…`, `/ninos/bitacora`, `/ninos/invite-representative`, `/consentimiento/aceptar`, `/sesiones/iniciar`, `/monitoreo/simular-estado`, `/admin/especialistas`, `/admin/especialidades`, `/admin/asignar`, `/admin/reportes/programados`, `/admin/users/{id}/password`, `/admin/especialistas/{id}/password`, `/reportes/alertas/{id}/feedback`.
- PUT/PATCH: `/ninos/{id}/ficha`, `/auth/me`, `/auth/me/password`, `/sesiones/{cod}/cerrar`, `/especialista/indicaciones/{id}/leer`, `/admin/especialistas/{id}` (+`/estado`), `/admin/especialidades/{id}/estado`, `/admin/representantes/{usu_codi}`, `/admin/users/{id}/estado`, `/admin/asignaciones/{asi_codi}/estado`, `/admin/instituciones/{codigo}`, `/admin/ninos/{nin_codi}/foto`.
