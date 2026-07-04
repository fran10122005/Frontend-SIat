# Plan de Mejora — Panel de Administración (SIAT)

## Resumen

El panel admin actual tiene funcionalidades básicas (CRUD de especialistas, asignaciones, catálogos, usuarios, infraestructura). Se requiere agregar nuevas funciones y mejorar las existentes para que sea un panel de gestión completo para la institución.

---

## 1. Funciones Nuevas

| # | Función | Descripción | Prioridad | Esfuerzo |
|---|---------|-------------|-----------|----------|
| 1.1 | **Dashboard Ejecutivo** | Vista de inicio con KPIs en tiempo real (pacientes activos, especialistas, crisis del mes, ocupación), gráficos de tendencia mensual, alertas recientes, actividad del día | Alta | 6h |
| 1.2 | **Gestión de Representantes** | CRUD completo de representantes: listar, crear, editar, desactivar, buscar, filtrar por estado y paciente asignado | Alta | 6h |
| 1.3 | **Historial Clínico Global** | Tabla con búsqueda y filtros de todos los incidentes, crisis y reportes del hogar a nivel institucional, exportable a Excel/PDF | Alta | 6h |
| 1.4 | **Reportes Exportables** | Dashboard exportable a PDF con KPIs, gráficos y tabla de alertas. Reportes programados (enviar por correo cada semana) | Alta | 4h |
| 1.5 | **Auditoría de Cambios** | Quién hizo qué y cuándo: cambios en especialistas, asignaciones, usuarios. Tabla con búsqueda, filtros por tipo/fecha, exportación | Alta | 5h |
| 1.6 | **Gestión de Sesiones de Terapia** | Calendario institucional con todas las citas y sesiones del día. Vista por especialista. Reagendar y cancelar | Media | 8h |
| 1.7 | **Notificaciones y Alertas** | Centro de notificaciones: crisis detectadas, sesiones próximas, usuarios nuevos. Marcado como leído/no leído | Media | 5h |
| 1.8 | **Módulo de Facturación** | Registro de pagos, planes, facturación mensual por paciente. Resumen de ingresos y morosidad | Baja | 10h |
| 1.9 | **Respaldos de Base de Datos** | Botón para generar respaldo, lista de respaldos anteriores con fecha y tamaño, descargar/restaurar | Baja | 4h |


---

## 2. Mejora de Funciones Existentes

| # | Función | Problema Actual | Mejora | Prioridad | Esfuerzo |
|---|---------|----------------|--------|-----------|----------|
| 2.1 | **Catálogos (Institución)** | PUT a institución da 400 error. No permite editar todos los campos | Depurar endpoint, enviar objeto completo, agregar campos faltantes (email, web, logo) | Alta | 2h |
| 2.2 | **Especialistas** | Sin paginación server-side. No permite cambiar contraseña | Paginación desde API, botón "reset contraseña", campo de especialidad múltiple | Alta | 4h |
| 2.3 | **Asignaciones** | No muestra historial de reasignaciones | Agregar línea de tiempo de cambios de asignación por paciente | Alta | 3h |
| 2.4 | **Usuarios** | Sin roles personalizados | Agregar creación de roles con permisos granulares (leer, escribir, admin) | Media | 6h |
| 2.5 | **Infraestructura** | Datos estáticos (mock), sin estado real de servicios | Conectar con endpoint real de salud del sistema, mostrar uptime, versión, uso de DB, latencia real | Alta | 4h |
| 2.6 | **Registro de Niño + Representante** | Modal muy largo, sin validación en cliente | Dividir en pasos (stepper), validar con Zod antes de enviar | Media | 4h |
| 2.7 | **Exportación a Excel/PDF** | Filtros no se aplican a la exportación | Exportar siempre los datos filtrados visibles, no todos | Media | 2h |
| 2.8 | **Mensajes del Sistema** | Mensajes inline con timeout fijo | Usar toast unificado (ya existe en GlobalState) con tipos (éxito, error, advertencia) | Media | 1h |

---

## 3. UX/UI

| # | Mejora | Descripción | Prioridad | Esfuerzo |
|---|--------|-------------|-----------|----------|
| 3.1 | **Tabs con iconos y submenús** | Cada tab en el sidebar con icono y contador (ej. "Especialistas (12)") | Alta | 2h |
| 3.2 | **Breadcrumbs** | Navegación secundaria tipo "Admin > Especialistas > Editar" | Media | 1h |
| 3.3 | **Empty states** | Mensajes ilustrados cuando no hay datos en cada sección | Alta | 2h |
| 3.4 | **Loading skeletons** | Esqueletos de carga por sección (ya existe LoadingState, usarlo en todos los tabs) | Alta | 1h |
| 3.5 | **Tablas responsive** | Scroll horizontal en móvil o conversión a tarjetas | Media | 3h |
| 3.6 | **Tema oscuro completo** | Verificar que todos los componentes nuevos respeten `isDark` | Alta | 1h |

---

## 4. Técnico

| # | Mejora | Descripción | Prioridad | Esfuerzo |
|---|--------|-------------|-----------|----------|
| 4.1 | **TypeScript** | Migrar archivos del admin a `.tsx` con interfaces para props y respuestas API | Media | 6h |
| 4.2 | **Validación con Zod** | Esquemas compartidos para formularios y respuestas API | Media | 4h |
| 4.3 | **Custom Hooks** | Extraer lógica repetitiva a hooks (`useFetch`, `usePagination`, `useFilters`) | Media | 3h |
| 4.4 | **Manejo de errores global** | Interceptor de Axios para errores 401, 403, 500 con mensajes al usuario | Alta | 2h |
| 4.5 | **Paginación server-side** | Pasar `?page=&limit=&search=` a los endpoints del backend | Alta | 4h |
| 4.6 | **Testing** | Tests unitarios con Vitest para hooks y utilidades. Tests de integración con Playwright para flujos críticos | Baja | 8h |

---

## 5. Endpoints Backend Necesarios

| # | Endpoint | Método | Descripción | Para función |
|---|----------|--------|-------------|-------------|
| 5.1 | `/admin/instituciones/:id` | PUT | Actualizar institución (arreglar 400) | 2.1 |
| 5.2 | `/admin/representantes` | GET | Listar representantes | 1.2 |
| 5.3 | `/admin/representantes` | POST | Crear representante | 1.2 |
| 5.4 | `/admin/representantes/:id` | PUT | Editar representante | 1.2 |
| 5.5 | `/admin/representantes/:id` | DELETE | Desactivar representante | 1.2 |
| 5.6 | `/admin/reportes/incidentes` | GET | Incidentes con filtros (fecha, tipo, paciente) | 1.3 |
| 5.7 | `/admin/notificaciones` | GET | Centro de notificaciones | 1.7 |
| 5.8 | `/admin/notificaciones/:id/leer` | PATCH | Marcar como leída | 1.7 |
| 5.9 | `/admin/backups` | POST | Generar respaldo de BD | 1.9 |
| 5.10 | `/admin/backups` | GET | Listar respaldos | 1.9 |
| 5.11 | `/admin/health` | GET | Estado real de servicios (API, DB, WS, Redis) | 2.5 |
| 5.12 | `/admin/sesiones` | GET | Calendario de sesiones institucional | 1.6 |
| 5.13 | `/admin/sesiones/:id` | PATCH | Reagendar/cancelar sesión | 1.6 |
| 5.14 | `/admin/especialistas/:id/password` | POST | Resetear contraseña | 2.2 |
| 5.15 | `/admin/reportes/programados` | POST | Programar reporte periódico | 1.4 |

---

## 6. Priorización por Iteraciones

### Iteración 1 (~25h) — Funcionalidad Core
- 1.1 Dashboard Ejecutivo (6h)
- 1.5 Auditoría de Cambios (5h)
- 2.1 Arreglar PUT Institución (2h)
- 2.2 Especialistas — paginación y reset pass (4h)
- 2.5 Infraestructura — datos reales (4h)
- 2.8 Toasts unificados (1h)
- 3.1 Tabs con contadores (2h)
- 4.4 Manejador de errores global (2h)

### Iteración 2 (~20h) — Gestión y Reportes
- 1.2 Gestión de Representantes (6h)
- 1.3 Historial Clínico Global (6h)
- 1.4 Reportes exportables (4h)
- 2.3 Historial de reasignaciones (3h)
- 3.3 Empty states (2h)

### Iteración 3 (~15h) — UX y Técnico
- 2.4 Roles personalizados (6h)
- 2.6 Stepper registro niño+repre (4h)
- 3.4 Loading skeletons (1h)
- 4.3 Custom hooks (3h)
- 4.5 Paginación server-side (4h) — *se solapa con 2.2*

### Iteración 4 (~20h) — Avanzado
- 1.6 Gestión de Sesiones (8h)
- 1.7 Notificaciones (5h)
- 1.8 Facturación (10h) — *opcional*

### Iteración 5 (~12h) — Calidad
- 1.9 Respaldos (4h)
- 4.6 Testing (8h)

---

**Total estimado completo:** ~82-92 horas distribuidas en 5 iteraciones.
