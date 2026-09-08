# 📋 Revisión Completa del Panel del Especialista - SIAT

**Fecha:** 21 Agosto 2026  
**Versión:** 2.0 (Actualizada con hallazgos backend + UI/UX)  
**Estado:** Análisis completo - Listo para implementación

---

## ✅ Módulos Existentes y Estado Actual

| Módulo | Archivo Principal | Estado | % Completo | Observaciones |
|--------|-------------------|--------|------------|---------------|
| **Dashboard Principal** | `SpecialistDashboard.jsx` | ✅ Funcional | 90% | Orquesta todos los sub-componentes, maneja modals |
| **Vista Global (sin paciente)** | `SpecialistGlobalView.jsx` | ✅ KPIs, Gráficas, Accesos rápidos | 85% | Falta feed de alertas real (`globalAlertsFeed = []`) |
| **Metas PEI** | `PatientPeiGoals.jsx` + `NewPeiGoalModal.jsx` | ✅ CRUD completo, progreso animado, categorías | 95% | Mejor UX: animated counter, status badges, criterios |
| **Historial Conductual** | `PatientBehaviorChart.jsx` | ✅ Stacked bar 7 días, leyenda | 80% | Usa mock data como fallback |
| **Análisis Sensorial** | `PatientSensoryChart.jsx` | ✅ Donut chart, totales centro | 75% | Usa mock data como fallback |
| **Bitácora Crisis (IoT)** | `PatientCrisisLog.jsx` | ✅ Telemetría BPM/MPU6050, correlación clínica | 90% | Análisis automático: sobrecarga vs hiperactividad vs estereotipia |
| **Registro Incidente (A-B-C)** | `IncidentModal.jsx` | ✅ Formulario completo A-B-C | 95% | Tipos, detonantes, severidad, consecuencia, intervención |
| **Nota SOAP** | `SoapNoteModal.jsx` | ✅ 4 secciones S-O-A-P | 90% | Validación requerida por sección, firmado digital |
| **Indicaciones Clínicas** | `IndicacionModal.jsx` | ✅ Tipos, áreas, prioridad, vigencia | 95% | Visible inmediato para representante |
| **Historial Evolución** | `HistoryProgress.jsx` | ✅ Filtros, paginación, export PDF, KPIs | 90% | Incluye metas PEI para representantes |
| **Gestión Pacientes** | `PatientManagement.jsx` | ✅ Grid, filtros, registro, vista previa | 95% | Reutilización de representante por cédula |
| **Ficha Clínica** | `StudentRecord.jsx` | ✅ Edición, foto, sensibilidad, diagnóstico | 90% | Exporta manual TEA PDF |

---

## 🔧 Backend Confirmado - Módulos Ya Implementados

**Ubicación:** `C:\Users\WinterOS\Documents\Francisco\Diseno\Backend SIAT\src\modules\`

### Módulo `especialista` - **EXISTE Y FUNCIONA**
| Endpoint | Método | Descripción | Frontend usa |
|----------|--------|-------------|--------------|
| `/especialista/soap/:nin_codi` | GET/POST | Listar/Crear notas SOAP | `SoapNoteModal` → `GlobalState.crearSoap` |
| `/especialista/indicaciones/:nin_codi` | GET/POST | Listar/Crear indicaciones | `IndicacionModal` → `crearIndicacion` |
| `/especialista/incidentes/:nin_codi` | GET/POST | Listar/Crear incidentes A-B-C | `IncidentModal` → `handleIncidentSubmit` |
| `/especialista/alertas/:nin_codi` | GET | Alertas + telemetría IoT (BPM/MPU6050) | `PatientCrisisLog` → `fetchCrisisAlerts` |

### Otros Módulos Backend Relevantes (Ya Implementados)
| Módulo | Endpoints Clave | Frontend Actual |
|--------|-----------------|-----------------|
| **`metas`** | `GET /metas/:nin_codi`, `POST /metas`, `PATCH /metas/:id/ensayo` | `PatientPeiGoals` ✅ |
| **`sesiones`** | `POST /sesiones/iniciar`, `PUT /:id/cerrar`, `GET /ninos/:id/sesiones`, `/actividades`, `/categorias` | ❌ **FALTA FRONTEND** |
| **`reportes`** | `GET /historial-completo/:id`, `POST /alertas/:id/feedback`, `GET /evolucion-representante` | `HistoryProgress` ✅ parcial |
| **`ninos`** | `GET /mis-ninos`, `GET/PUT /:id/ficha`, `POST /:id/umbrales`, `POST /invite-representative` | `PatientManagement`, `StudentRecord` ✅ |

**Conclusión:** Backend tiene **todo lo necesario para Fase 2 (Sesiones)**. Solo falta frontend.

---

## 🔗 Integración con Panel Representante (Componentes Compartidos)

### Flujo de Datos Compartido
```
┌─────────────────────┐     POST /ninos/bitacora     ┌──────────────────────┐
│  DiarioHogar.jsx    │ ──────────────────────────▶ │  GlobalState         │
│  (Representante)    │  bitácora diaria: ánimo,    │  clinicalAlerts +    │
│                     │  sueño, crisis, notas       │  homeHistoricalData  │
└─────────────────────┘                              └──────────┬───────────┘
                                                                 │
                                                         ┌────────▼───────────┐
                                                         │ SpecialistDashboard│
                                                         │ PatientCrisisLog   │
                                                         │ PatientBehavior    │
                                                         │ PatientSensory     │
                                                         └────────────────────┘
```

### Componentes Compartidos (`src/components/shared/`)
| Componente | Usado por | Qué hace |
|------------|-----------|----------|
| `AlertCenter.jsx` | ParentProfile (tab alertas) + SpecialistDashboard (vía GlobalState) | Timeline alertas con filtros, feedback Sí/No |
| `Indicaciones.jsx` | ParentProfile (tab indicaciones) + HistoryProgress | Lista indicaciones con paginación |
| `FilterBar.jsx` | PatientManagement, HistoryProgress, PatientPeiGoals | Filtros unificados responsive |

### Panel Representante (`ParentProfile.jsx` + `DiarioHogar.jsx`)
| Vista | Tabs/Funcionalidad | Endpoint |
|-------|-------------------|----------|
| `ParentProfile` | **perfil** \| **alertas** \| **indicaciones** | `GET /ninos/mi-expediente` |
| `DiarioHogar` | Bitácora diaria: ánimo, sueño, crisis, apetito, notas, terapia | `POST /ninos/bitacora` |

### ⚠️ Brecha Crítica Integración
| Falta | Impacto | Solución |
|-------|---------|----------|
| **Confirmación lectura indicaciones** | Representante ve indicación pero especialista no sabe si la leyó | Endpoint `PUT /indicaciones/:id/leer` + `IndicacionReadReceipt.jsx` |
| **Notificación push tiempo real** | Representante debe recargar para ver nuevas alertas | Socket.io `new_indicacion` / `new_alerta` |

---

## 🔌 Endpoints Backend Mapeados (GlobalState.jsx)

```javascript
// Pacientes
GET  /ninos/mis-ninos                          → Lista pacientes asignados
GET  /ninos/:childId/ficha                     → Ficha clínica completa
PUT  /ninos/:childId/ficha                     → Actualizar ficha
PUT  /ninos/:childId/umbrales                  → Umbrales sensibilidad

// Alertas y Crisis IoT
GET  /especialista/alertas/:childId            → Alertas + telemetría (BPM/MPU6050)

// Metas PEI
GET  /metas/:childId                           → Metas PEI del paciente
POST /metas                                    → Crear meta PEI
PATCH /metas/:goalId/ensayo                    → Incrementar ensayo

// Registro Clínico
POST /especialista/indicaciones                → Indicación clínica
POST /especialista/incidentes/:childId         → Incidente A-B-C
POST /especialista/soap                        → Nota SOAP

// Historial
GET  /reportes/historial-completo/:childId     → Historial + sesiones + alertas
POST /reportes/alertas/:id_alert/feedback      → Feedback efectividad alerta

// Sesiones (BACKEND YA EXISTE - FALTA FRONTEND)
POST /sesiones/iniciar                         → Iniciar sesión terapéutica
PUT  /sesiones/:id/cerrar                      → Cerrar sesión con nota
GET  /sesiones/ninos/:id/sesiones              → Agenda paciente
GET  /sesiones/actividades                     → Catálogo actividades
GET  /sesiones/categorias                      → Categorías
```

---

## 📱 Problemas Responsive Detectados (Críticos para Móvil)

### 1. Espaciado Excesivo / Tamaños Grandes

| Archivo | Problema | Línea | Actual | Recomendado |
|---------|----------|-------|--------|-------------|
| `SpecialistDashboard.jsx` | Header contenedor principal | 469 | `p-6 md:p-8`, `gap-8` | `p-4 md:p-6`, `gap-6` |
| `SpecialistDashboard.jsx` | Header botones acciones | 486-524 | `px-4 py-2`, `px-3 py-1.5` | Estandarizar a `Button` component |
| `PatientPeiGoals.jsx` | Card meta PEI | 99-118 | `p-4`, `gap-3`, `px-2.5 py-1.5` | `p-3`, `gap-2`, `Button size="sm"` |
| `SpecialistGlobalView.jsx` | KPIs cards | 41-82 | `p-4 md:p-5` | `p-3 md:p-4` |
| `SpecialistGlobalView.jsx` | Gráficas contenedor | 86-160 | `min-h-[300px]`, `p-6` | `h-[280px] lg:h-[350px]`, `p-4` |
| `PatientBehaviorChart.jsx` | Contenedor gráfico | 31 | `min-h-[300px] lg:h-[400px]`, `p-6` | `h-[280px] lg:h-[350px]`, `p-4` |
| `PatientSensoryChart.jsx` | Contenedor donut | 26 | `min-h-[300px] lg:h-[400px]`, `p-6` | `h-[280px] lg:h-[350px]`, `p-4` |
| `IncidentModal.jsx` | Modal formulario | 64, 82 | `max-w-2xl`, `p-6`, inputs `p-2.5` | `max-w-xl`, `p-4`, `p-2` |
| `SoapNoteModal.jsx` | Modal SOAP | 88, 126 | `max-w-2xl`, `p-6`, `h-20` | `max-w-xl`, `p-4`, `h-16` |
| `NewPeiGoalModal.jsx` | Modal meta PEI | 86, 114 | `max-w-2xl`, `p-6` | `max-w-xl`, `p-4` |

### 2. Patrones Responsive Inconsistentes

| Componente | Estado Actual | Corrección Requerida |
|------------|---------------|---------------------|
| `SpecialistDashboard` header | `flex flex-wrap gap-2` **sin** `sm:flex-row` | `flex flex-col sm:flex-row flex-wrap gap-2` |
| `FilterBar.jsx` (embedded) | `flex flex-col flex-wrap` | `flex flex-col sm:flex-row flex-wrap` |
| `PatientPeiGoals` FilterBar select | Select categoría **sin** responsive | `w-full sm:w-auto` |
| `PatientManagement` Toolbar | ✅ **Correcto** `flex-col md:flex-row` + `flex-1 sm:flex-none` | Mantener como referencia |
| `AdminDashboard` filter bars | ✅ **Correcto** `flex-col sm:flex-row` | Mantener como referencia |

---

## 🎨 Botones NO Estandarizados (Urgent: Design System)

### Tamaños Encontrados (Inconsistentes)

```jsx
// Pequeños (header actions)
px-3 py-1.5 text-[11px]     // SpecialistDashboard export/incidente
px-2.5 py-1.5 text-[11px]   // PatientPeiGoals "Nueva Meta"

// Medianos (formularios)
px-3 py-2 text-sm           // FilterBar, selects
px-4 py-2 text-sm           // Modals submit

// Grandes (CTA principales)
px-4 py-2.5 text-sm         // PatientManagement "Registrar"
px-5 py-2.5 text-sm         // Modals "Guardar"
px-4 py-2 font-semibold     // DiarioHogar "Guardar Reporte"
```

### Colores Inconsistentes por Acción

| Acción Semántica | Colores Usados Actualmente | **Estandarizar A** |
|------------------|---------------------------|-------------------|
| **Primaria** (Guardar, Crear, Confirmar) | `bg-brand-500`, `bg-indigo-600`, `bg-blue-600`, `bg-emerald-500` | `bg-brand-600 hover:bg-brand-700` |
| **Secundaria** (Cancelar, Cerrar) | `bg-slate-100`, `bg-gray-200`, `bg-white`, `bg-slate-800` | `bg-slate-100 dark:bg-slate-800 hover:bg-slate-200` |
| **Peligro** (Eliminar, Incidente, No efectivo) | `bg-rose-600`, `bg-red-600`, `bg-rose-500` | `bg-rose-600 hover:bg-rose-700` |
| **Info/Neutro** (Ver, Exportar, Descargar) | `bg-slate-900`, `bg-emerald-50`, `bg-indigo-50`, `bg-teal-50` | `bg-slate-900 dark:bg-slate-700` / `bg-slate-100` |
| **Éxito/Confirmación** (Sí, Efectiva, Completar) | `bg-green-600`, `bg-emerald-500`, `bg-emerald-600` | `bg-emerald-600 hover:bg-emerald-700` |
| **Advertencia** (Pendiente, Moderada) | `bg-amber-500`, `bg-amber-600`, `bg-yellow-500` | `bg-amber-600 hover:bg-amber-700` |

### Solución: Crear Design System Button

**Nuevo archivo:** `src/components/ui/Button.jsx`

```jsx
// Variantes semánticas
<Button variant="primary" size="sm">Guardar</Button>       // bg-brand-600
<Button variant="secondary" size="sm">Cancelar</Button>    // bg-slate-100
<Button variant="danger" size="sm">Eliminar</Button>       // bg-rose-600
<Button variant="success" size="sm">Confirmar</Button>     // bg-emerald-600
<Button variant="warning" size="sm">Pendiente</Button>     // bg-amber-600
<Button variant="ghost" size="sm">Ver</Button>             // transparente
<Button variant="outline" size="sm">Exportar</Button>      // border only

// Tamaños
size="xs"    // px-2 py-1 text-[10px]  (chips, badges)
size="sm"    // px-3 py-1.5 text-xs    (headers, toolbars)
size="md"    // px-4 py-2 text-sm      (forms, modals)
size="lg"    // px-5 py-2.5 text-sm    (CTA principales)
size="xl"    // px-6 py-3 text-base    (landing, empty states)
```

---

## 📊 Generación de Reportes - Estado Actual vs Necesario

| Reporte | Existe | Archivo/Ubicación | Qué Falta para Producción |
|---------|--------|-------------------|---------------------------|
| Dashboard PDF | ✅ | `exportDashboardReport` (SpecialistDashboard, MainDashboard) | - |
| Historial Evolución PDF | ✅ | `exportHistoryToPDF` (HistoryProgress) | - |
| Manual TEA PDF | ✅ | `exportManualPDFEspecialista` (StudentRecord) | - |
| **Informe PEI Completo** | ❌ | - | Metas, progreso, ensayos, gráficas evolución, recomendaciones, firma digital |
| **Informe Crisis IoT** | ❌ | - | Telemetría BPM/MPU6050, correlación clínica, tendencias, ajuste umbrales |
| **Reporte Mensual Automático** | ❌ | - | Programación cron, email a representante + admin, PDF adjunto |
| **Informe Sesión Terapéutica** | ❌ | - | Actividades realizadas, tiempo real vs planificado, observaciones, firma |
| **Informe Alta/Progreso** | ❌ | - | Resumen período, metas logradas, pendientes, próxima cita |

### Endpoints Backend Requeridos para Reportes
| Método | Endpoint | Descripción | Fase |
|--------|----------|-------------|------|
| POST | `/reportes/pei/:childId` | Generar informe PEI PDF | 3 |
| POST | `/reportes/crisis/:childId` | Generar informe crisis PDF | 3 |
| POST | `/reportes/sesion/:ses_codi` | Generar informe sesión PDF | 2 |
| POST | `/reportes/mensual/programar` | Programar reporte automático | 3 |
| GET | `/reportes/mensual/historial` | Historial reportes generados | 3 |

---

## 📝 Descripciones "Subtítulos" Redundantes (Ocupan Espacio Móvil)

### Ejemplos Concretos a Eliminar/Mover a Tooltip

```jsx
// SpecialistDashboard.jsx líneas 479-482 - ELIMINAR o hidden sm:block
<p className="text-subtitle-muted mt-1">
  {activeChild
    ? "Seguimiento de progreso PEI, registro conductual y detonantes sensoriales."
    : "Resumen de pacientes, metas PEI y alertas generales."}
/>

// SpecialistGlobalView.jsx líneas 92-94, 130-131 - ELIMINAR
<p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
  Distribución de eventos por tipo en la última semana
</p>
<p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
  Proporción de eventos registrados
</p>

// PatientPeiGoals.jsx línea 147-149 - MOVER A title/tooltip
<p className="text-[10px] text-slate-500 mt-1">
  Redacte la meta en formato objetivo, observable y medible.
</p>

// IncidentModal.jsx placeholders líneas 175, 207, 218, 232 - REDUCIR
placeholder="Ej. Respiración de la tortuga, Presión profunda"
placeholder="Acciones tomadas inmediatamente después del comportamiento..."
placeholder="Estrategias terapéuticas utilizadas durante el episodio..."
placeholder="Describe brevemente el comportamiento y cómo se logró la calma."

// SoapNoteModal.jsx placeholders líneas 12-13, 23-24, 34-35, 45-46 - SON NECESARIOS (guía clínica)
// MANTENER pero reducir font-size a text-[10px] y mt-0.5
```

### Regla General
- **Descripciones > 80 chars** → `hidden sm:block` o mover a `title` attribute
- **Placeholders guía** → Mantener pero `text-[10px]` y `mt-0.5`
- **Textos explicativos de sección** → Solo en desktop (`hidden md:block`)

---

## ❌ Módulos que FALTAN en Frontend (Backend YA TIENE Endpoints)

| Módulo | Backend Endpoints | Frontend Actual | Prioridad | Fase |
|--------|-------------------|-----------------|-----------|------|
| **Agenda Sesiones** | `POST /sesiones/iniciar`, `PUT /:id/cerrar`, `GET /ninos/:id/sesiones` | ❌ Solo `AgendaDiaria.jsx` básico | 🔴 ALTA | 2 |
| **Bitácora Sesión** | `POST /sesiones/:id/actividades` | ❌ | 🔴 ALTA | 2 |
| **Catálogo Actividades** | `GET/POST/PUT/DELETE /sesiones/actividades` | ❌ | 🔴 ALTA | 2 |
| **Catálogo Categorías** | `GET/POST/PUT/DELETE /sesiones/categorias` | ❌ | 🟡 MEDIA | 2 |
| **Catálogo Intervenciones** | No existe en BD | ❌ | 🟡 MEDIA | 3 |
| **Plantillas SOAP** | No existe en BD | ❌ | 🟡 MEDIA | 3 |
| **Configuración Alertas** | No existe en BD | ❌ | 🟡 MEDIA | 4 |
| **Confirmación Lectura Indicaciones** | Falta endpoint `PUT /indicaciones/:id/leer` | ❌ | 🟡 MEDIA | 3 |
| **Reportes Avanzados (PEI, Crisis, Mensual)** | Parcial en `reportes` | ❌ | 🟡 MEDIA | 3 |

---

## ⚠️ Brechas Críticas Identificadas (ACTUALIZADO)

### 🔴 **Prioridad ALTA - Bloqueantes para Producción**

| # | Brecha | Impacto | Archivos Afectados |
|---|--------|---------|-------------------|
| 1 | **Datos Mock Hardcodeados** | Especialista ve datos falsos si backend falla | `SpecialistDashboard.jsx` (143-193, 270-318), `PatientBehaviorChart.jsx` (13-21), `PatientSensoryChart.jsx` (11-17), `SpecialistGlobalView.jsx` (23) |
| 2 | **Falta Módulo Sesiones Terapéuticas** | No hay agenda, inicio/cierre sesión, bitácora actividades | Backend listo, falta frontend completo |
| 3 | **GlobalAlertsFeed Vacío** | Vista global sin alertas reales | `SpecialistDashboard.jsx` línea 141 |
| 4 | **Botones NO Estandarizados** | Inconsistencia visual, mantenimiento difícil | **TODOS los archivos specialist/** |
| 5 | **Responsive Roto en Móvil** | Contenido empujado, scroll innecesario | Header, modals, gráficas, filterbars |

### 🟡 **Prioridad MEDIA - Necesarias para Completitud**

| # | Brecha | Impacto |
|---|--------|---------|
| 6 | **Sin Confirmación Lectura Indicaciones** | Representante ve indicación pero no hay acuse de recibo |
| 7 | **Reportes Limitados** | Solo 3 PDFs básicos. Falta: PEI, Crisis IoT, Mensual, Sesión |
| 8 | **Configuración Personalizable** | Solo umbrales por niño. Falta: Plantillas SOAP, Catálogo intervenciones, Reglas alertas |
| 9 | **Comunicación Bidireccional** | No hay chat/mensajería especialista-representante |
| 10 | **Descripciones Redundantes** | Ocupan espacio móvil, empujan contenido útil |

### 🟢 **Prioridad BAJA - Mejoras UX**

| # | Brecha | Impacto |
|---|--------|---------|
| 11 | **Shortcuts Teclado** | Acciones frecuentes sin atajos (Nueva meta, Incidente, SOAP) |
| 12 | **Modo Solo Lectura** | Para supervisores/auditoría |
| 13 | **Accesibilidad Charts** | Leyendas ya tienen `flex-wrap` (corregido) |

---

## 📦 Plan de Implementación por Fases (ACTUALIZADO)

---

### **FASE 0: Urgente - Design System + Responsive + Limpieza Visual (Semana 1 - ESTA SEMANA) ✅ COMPLETADA**
**Objetivo:** Base visual consistente antes de construir features nuevos

| Tarea | Archivos | Descripción | Estado |
|-------|----------|-------------|--------|
| 0.1 | **NUEVO** `src/components/ui/Button.jsx` | Componente Button unificado con variantes (primary, secondary, danger, success, warning, ghost, outline) y tamaños (xs, sm, md, lg, xl) | ✅ **COMPLETADO** |
| 0.2 | `SpecialistDashboard.jsx`, `PatientPeiGoals.jsx` | Migrar botones header y "Nueva Meta" a nuevo `Button` component | ✅ **COMPLETADO** |
| 0.3 | `SpecialistDashboard.jsx` (469), `PatientPeiGoals.jsx` (99), `SpecialistGlobalView.jsx` (41, 86), `PatientBehaviorChart.jsx` (31), `PatientSensoryChart.jsx` (26) | Compactar espaciado: `p-6 md:p-8`→`p-4 md:p-6`, `gap-8`→`gap-6`, `min-h-[300px]`→`h-[280px] lg:h-[350px]` | ✅ **COMPLETADO** |
| 0.4 | `SpecialistDashboard.jsx` (486), `FilterBar.jsx` (27), `PatientPeiGoals.jsx` (141) | Fix responsive: `flex flex-col sm:flex-row` en headers y filterbars | ✅ **COMPLETADO** |
| 0.5 | `SpecialistDashboard.jsx` (479), `SpecialistGlobalView.jsx` (92, 130), `PatientPeiGoals.jsx` (147) | Eliminar/reducir descripciones redundantes: `hidden sm:block` | ✅ **COMPLETADO** |
| 0.6 | `PatientBehaviorChart.jsx`, `PatientSensoryChart.jsx` | Eliminar mocks hardcodeados, agregar empty states | ✅ **COMPLETADO** |
| 0.7 | `GlobalState.jsx` | Validar endpoints reales responden 200 | ⏳ Pendiente |

**Entregable:** Design System Button funcionando, panel responsive en móvil, cero mocks en charts, espaciado compacto. ✅ 6/7 tareas completadas.

---

### **FASE 1: Datos Reales y Limpieza Backend (Semana 1-2)**
**Objetivo:** Conectar todos los componentes a datos reales, validar endpoints sesión

| Tarea | Archivos | Descripción | Criterio Aceptación |
|-------|----------|-------------|---------------------|
| 1.1 | `SpecialistDashboard.jsx` | Conectar `clinicalAlerts` del GlobalState al `globalAlertsFeed` | Alertas reales aparecen en vista global |
| 1.2 | `GlobalState.jsx` | Agregar `fetchSessions`, `startSession`, `closeSession`, `logActivity` usando endpoints `/sesiones/*` existentes | Hooks listos para Fase 2 |
| 1.3 | `GlobalState.jsx` | Agregar `markIndicacionRead`, `fetchIndicacionStatus` (requiere backend endpoint nuevo) | Preparado para Fase 3.1 |
| 1.4 | Todos componentes | Unificar `LoadingState` variant="dashboard" en lugar de datos mock | Loading skeletons consistentes |

**Entregable:** Panel 100% datos reales, hooks sesión listos, endpoint lectura indicaciones preparado.

---

### **FASE 2: Módulo de Sesiones Terapéuticas (Semana 3-4)**
**Objetivo:** Agenda semanal, wizard sesión, bitácora actividades (Backend YA EXISTE)

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 2.1 | **NUEVO** `src/components/specialist/SessionManager.jsx` | Vista agenda semanal del especialista con cards por paciente, drag-and-drop para reagendar |
| 2.2 | **NUEVO** `src/components/specialist/SessionWizard.jsx` | Modal paso-a-paso: 1) Seleccionar paciente → 2) Elegir actividades (de rutinas asignadas) → 3) Iniciar cronómetro → 4) Registrar observaciones por actividad → 5) Cerrar sesión con nota resumen |
| 2.3 | **NUEVO** `src/components/specialist/ActivityLog.jsx` | Bitácora checklist actividades realizadas en sesión (✓ Completada, ⚠ Parcial, ✗ No realizada) + tiempo real vs planificado |
| 2.4 | `SpecialistDashboard.jsx` | Integrar acceso rápido "Iniciar Sesión" en header (usar `Button variant="primary"`) |
| 2.5 | **NUEVO** `src/components/specialist/SessionReportModal.jsx` | Generar Informe Sesión PDF: actividades, tiempos, observaciones, firma |

**Entregable:** Flujo completo: Agenda → Iniciar → Ejecutar → Cerrar → Informe Sesión → Historial

---

### **FASE 3: Comunicación y Reportes (Semana 5-6)**
**Objetivo:** Feedback indicaciones, reportes avanzados, plantillas

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 3.1 | **NUEVO** `src/components/specialist/IndicacionReadReceipt.jsx` | Componente para que representante marque "Leída" + confirmación especialista (requiere backend `PUT /indicaciones/:id/leer`) |
| 3.2 | `GlobalState.jsx` | Agregar `markIndicacionRead(indicacionId)`, `fetchIndicacionStatus(childId)` |
| 3.3 | **NUEVO** `src/components/specialist/PeiReportModal.jsx` | Generar Informe PEI completo: metas, progreso, ensayos, gráficas evolución, recomendaciones |
| 3.4 | **NUEVO** `src/components/specialist/CrisisReportModal.jsx` | Informe IoT: telemetría crisis, correlación clínica, tendencias, recomendaciones ajustes umbrales |
| 3.5 | **NUEVO** `src/components/specialist/MonthlyReportScheduler.jsx` | Programar reporte mensual automático (email + PDF) a representante + admin |
| 3.6 | **NUEVO** `src/components/specialist/SoapTemplateManager.jsx` | CRUD plantillas SOAP (Subjetivo/Objetivo/Análisis/Plan) reutilizables |
| 3.7 | **NUEVO** `src/components/specialist/InterventionCatalog.jsx` | Catálogo intervenciones por tipo conducta (Berrinche → Respiración tortuga, Presión profunda, etc.) |

**Entregable:** Comunicación cerrada + reportes profesionales + plantillas tiempo

---

### **FASE 4: Configuración y Personalización (Semana 7)**
**Objetivo:** Reglas alertas, umbrales globales, preferencias

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 4.1 | **NUEVO** `src/components/specialist/AlertRulesConfig.jsx` | Configurar: umbral BPM por niño, umbral movimiento, tipos alerta a notificar, horario silencioso |
| 4.2 | **NUEVO** `src/components/specialist/SpecialistSettings.jsx` | Preferencias: tema, notificaciones push, exportación auto, vista por defecto |
| 4.3 | `GlobalState.jsx` | Persistir configuración en BD (`PUT /especialista/config`) |
| 4.4 | `SpecialistDashboard.jsx` | Aplicar config: filtrar alertas, respetar horario silencioso |

**Entregable:** Panel adaptado a flujo de trabajo individual

---

### **FASE 5: Accesibilidad y Pulido (Semana 8)**
**Objetivo:** Shortcuts, modo solo lectura, testing

| Tarea | Archivos | Descripción |
|-------|----------|-------------|
| 5.1 | `SpecialistDashboard.jsx` | Shortcuts: `Alt+N` Nueva Meta, `Alt+I` Incidente, `Alt+S` SOAP, `Alt+D` Indicación |
| 5.2 | **NUEVO** `src/components/specialist/ReadOnlyMode.jsx` | Wrapper que deshabilita edición, muestra badge "Solo Lectura" |
| 5.3 | Tests E2E | Cypress: flujo completo dashboard → paciente → sesión → reporte |
| 5.4 | Performance | Code-split modals pesados (`SessionWizard`, `PeiReportModal`) con `React.lazy` |

**Entregable:** Panel pulido, accesible, listo para auditoría

---

## 🗂️ Estructura de Archivos Propuesta (Nuevos + Actualizaciones)

```
src/
├── components/
│   ├── ui/
│   │   └── Button.jsx                    # FASE 0.1 - Design System
│   ├── specialist/
│   │   ├── SessionManager.jsx            # FASE 2.1
│   │   ├── SessionWizard.jsx             # FASE 2.2
│   │   ├── ActivityLog.jsx               # FASE 2.3
│   │   ├── SessionReportModal.jsx        # FASE 2.5
│   │   ├── IndicacionReadReceipt.jsx     # FASE 3.1
│   │   ├── PeiReportModal.jsx            # FASE 3.3
│   │   ├── CrisisReportModal.jsx         # FASE 3.4
│   │   ├── MonthlyReportScheduler.jsx    # FASE 3.5
│   │   ├── SoapTemplateManager.jsx       # FASE 3.6
│   │   ├── InterventionCatalog.jsx       # FASE 3.7
│   │   ├── AlertRulesConfig.jsx          # FASE 4.1
│   │   ├── SpecialistSettings.jsx        # FASE 4.2
│   │   └── ReadOnlyMode.jsx              # FASE 5.2
│   └── shared/
│       ├── AlertCenter.jsx               # ✅ EXISTE - Compartido con Representante
│       ├── Indicaciones.jsx              # ✅ EXISTE - Compartido con Representante
│       └── FilterBar.jsx                 # ✅ EXISTE - Usado en ambos paneles
```

---

## 🔧 Endpoints Backend Requeridos (Nuevos + Existentes)

| Método | Endpoint | Descripción | Estado | Fase |
|--------|----------|-------------|--------|------|
| **YA EXISTEN EN BACKEND** | | | | |
| GET | `/especialista/alertas/:nin_codi` | Alertas + telemetría IoT | ✅ Implementado | 0 |
| GET | `/metas/:nin_codi` | Metas PEI paciente | ✅ Implementado | 0 |
| POST | `/metas` | Crear meta PEI | ✅ Implementado | 0 |
| PATCH | `/metas/:met_codi/ensayo` | Incrementar ensayo | ✅ Implementado | 0 |
| POST | `/especialista/soap` | Crear nota SOAP | ✅ Implementado | 0 |
| GET | `/especialista/soap/:nin_codi` | Listar notas SOAP | ✅ Implementado | 0 |
| POST | `/especialista/indicaciones` | Crear indicación | ✅ Implementado | 0 |
| GET | `/especialista/indicaciones/:nin_codi` | Listar indicaciones | ✅ Implementado | 0 |
| POST | `/especialista/incidentes/:nin_codi` | Crear incidente | ✅ Implementado | 0 |
| GET | `/especialista/incidentes/:nin_codi` | Listar incidentes | ✅ Implementado | 0 |
| POST | `/sesiones/iniciar` | Iniciar sesión terapéutica | ✅ Implementado | 2 |
| PUT | `/sesiones/:id/cerrar` | Cerrar sesión con nota | ✅ Implementado | 2 |
| GET | `/sesiones/ninos/:nin_codi/sesiones` | Agenda paciente | ✅ Implementado | 2 |
| GET | `/sesiones/actividades` | Catálogo actividades | ✅ Implementado | 2 |
| GET | `/sesiones/categorias` | Categorías | ✅ Implementado | 2 |
| POST | `/sesiones/actividades` | Crear actividad | ✅ Implementado | 2 |
| PUT | `/sesiones/actividades/:id` | Actualizar actividad | ✅ Implementado | 2 |
| POST | `/sesiones/actividades/:id/asignar/:nin_codi` | Asignar actividad a niño | ✅ Implementado | 2 |
| **NUEVOS - REQUERIDOS** | | | | |
| PUT | `/indicaciones/:id/leer` | Marcar indicación leída por representante | ❌ Falta | 3 |
| GET | `/especialista/indicaciones/:childId/estado` | Estado lecturas indicaciones | ❌ Falta | 3 |
| POST | `/reportes/pei/:childId` | Generar informe PEI PDF | ❌ Falta | 3 |
| POST | `/reportes/crisis/:childId` | Generar informe crisis PDF | ❌ Falta | 3 |
| POST | `/reportes/sesion/:ses_codi` | Generar informe sesión PDF | ❌ Falta | 2 |
| POST | `/reportes/mensual/programar` | Programar reporte automático | ❌ Falta | 3 |
| GET | `/reportes/mensual/historial` | Historial reportes generados | ❌ Falta | 3 |
| CRUD | `/especialista/plantillas-soap` | Plantillas SOAP | ❌ Falta BD + API | 3 |
| CRUD | `/especialista/catalogo-intervenciones` | Catálogo intervenciones | ❌ Falta BD + API | 3 |
| PUT | `/especialista/config` | Guardar configuración alertas | ❌ Falta BD + API | 4 |
| GET | `/especialista/config` | Obtener configuración | ❌ Falta BD + API | 4 |

---

## 📊 Métricas de Éxito (ACTUALIZADO)

| Métrica | Objetivo | Fase |
|---------|----------|------|
| **Tiempo dashboard → sesión iniciada** | < 30 segundos | 2 |
| **Mock data en producción** | 0 | 0 |
| **Botones hardcodeados (colores/tamaños)** | 0 | 0 |
| **Scroll innecesario en móvil (375px)** | 0 | 0 |
| **Cobertura tests E2E flujos críticos** | > 80% | 5 |
| **Tiempo carga dashboard (datos reales)** | < 2s | 1 |
| **Tasa error endpoints especialista** | < 0.5% | 1 |
| **Satisfacción especialista (encuesta)** | > 4.5/5 | 5 |
| **Indicaciones con confirmación lectura** | > 90% | 3 |
| **Reportes automáticos mensuales generados** | 100% | 3 |

---

## 🚀 Próximos Pasos Inmediatos (ESTA SEMANA - FASE 0)

1. **Día 1-2:** Crear `src/components/ui/Button.jsx` (Design System) + migrar `SpecialistDashboard.jsx` y `PatientPeiGoals.jsx` como prueba
2. **Día 2-3:** Compactar espaciado en `SpecialistDashboard.jsx`, `SpecialistGlobalView.jsx`, `PatientBehaviorChart.jsx`, `PatientSensoryChart.jsx`
3. **Día 3:** Fix responsive headers y FilterBar (`flex-col sm:flex-row`)
4. **Día 4:** Eliminar/reducir descripciones redundantes (tooltips + `hidden sm:block`)
5. **Día 5:** Eliminar mocks hardcodeados + validar endpoints reales (`/especialista/alertas/:id`, `/metas/:id`, `/sesiones/iniciar`)
6. **Crear branch:** `feature/specialist-panel-phase0-design-system`
7. **Daily standup:** Sync con backend para confirmar endpoints sesión y crear endpoint `PUT /indicaciones/:id/leer`

---

## 📝 Notas Técnicas Adicionales

### Patrones Establecidos (Respetar)
- **Toasts:** Usar `showToast` de GlobalState (z-index 300)
- **Modals:** z-index 100, backdrop `bg-slate-900/60`, `animate-in zoom-in-95`
- **Charts:** `ResponsiveContainer` + `minWidth={0} minHeight={0}`, `h-[280px] lg:h-[350px]` fijo
- **Responsive:** `flex-col sm:flex-row`, `flex-1 sm:flex-none`, `grid-cols-1 sm:grid-cols-2`
- **Error Handling:** `toastError(err, showToast, "mensaje fallback")` de `utils/errorHandler`
- **Botones:** **SOLO** `<Button variant="..." size="...">` - nada de clases hardcodeadas

### Deuda Técnica Conocida
- `SpecialistDashboard.jsx` > 700 líneas → candidato a extraer sub-componentes
- `GlobalState.jsx` > 850 líneas → separar en contextos por dominio (pacientes, sesiones, reportes, alertas)
- `mockPeiGoals` en dashboard vs `globalPeiGoals` en context → unificar fuente de verdad
- `FilterBar` usado en 5+ componentes → verificar consistencia props
- `AlertCenter` e `Indicaciones` compartidos con Representante → cambios afectan ambos paneles

### Dependencias Entre Paneles
| Cambio en Especialista | Impacta a Representante | Acción Requerida |
|------------------------|------------------------|------------------|
| Nueva indicación | Ve en tab "Indicaciones" | ✅ Ya funciona |
| Nueva alerta crisis | Ve en tab "Alertas" | ✅ Ya funciona |
| Endpoint `PUT /indicaciones/:id/leer` | Botón "Marcar como leída" | Crear en backend + frontend ambos |
| Socket `new_indicacion` | Notificación push tiempo real | Implementar en ambos |
| Configuración alertas | Umbrales notificaciones | Sincronizar preferencias |

---

**Documento generado automáticamente tras revisión de código.**  
**Versión 2.0** - Incluye hallazgos backend, integración representante, responsive, design system buttons, reportes, descripciones redundantes.  
Para dudas o ajustes, consultar `AGENTS.md` (contexto sesión) y `PLAN_MEJORA_PANEL_ADMIN.md` (paralelo panel admin).