# Fase 3 — Plan de Implementación y Estado

> **Última actualización:** Jul 2026
> **Estado general:** 10/14 tareas completadas (frontend). Pendientes requieren cambios en backend.

---

## 1. Eliminación Lógica (Soft Delete) — ✅ COMPLETO (frontend)

### Objetivo
Estandarizar el borrado lógico en todas las entidades usando un campo `est_reg` común, con confirmación visual y protección contra eliminación accidental.

### Tareas

#### 1.1 Normalizar campo `est_reg` — ✅ Parcial
- ⬜ **Backend:** Agregar `est_reg` como enum `'Activo'|'Inactivo'` en todas las tablas (reemplazar booleanos `usu_estd`, `esc_estd` y string `asi_stdo`).
- ✅ **Frontend:** `StatusBadge` componente creado en `src/components/StatusBadge.jsx`. Acepta `active` (boolean), `activeLabel`, `inactiveLabel`.
- ✅ Refactorizados: `EspecialistasTab`, `UsuariosTab`, `AsignacionesTab`, `CatalogosTab`.

#### 1.2 Modal de confirmación — ✅ Completo
- ✅ `ConfirmDialog` creado en `src/components/ConfirmDialog.jsx`. Soporta variante danger/success, iconos, HTML en mensaje.
- ✅ Integrado en `AdminDashboard` (reemplazó modal inline) y `handleToggleUser` ahora también usa confirmación.

#### 1.3 Protección contra desactivación crítica — ⬜ Pendiente (backend)
- Requiere validación en backend antes de permitir desactivación.

#### 1.4 Historial de cambios de estado — ⬜ Pendiente (backend)
- Requiere middleware Prisma para registrar cambios en `TR_AUDIT`.

---

## 2. Trazabilidad (Traceability) — ✅ PARCIAL (frontend listo)

### Objetivo
Registrar automáticamente quién crea, edita o cambia el estado de cada registro, y permitir consultar el historial completo por entidad.

### Tareas

#### 2.1 Middleware de auditoría (backend) — ⬜ Pendiente
- Implementar hook en Prisma que capture `create`/`update`/`delete` en todas las tablas y escriba en `TR_AUDIT`.

#### 2.2 Trazabilidad por entidad (frontend) — ⬜ Pendiente
- Pestaña "Trazabilidad" en perfil del niño (`student`).
- Botón "Ver historial" en admin.

#### 2.3 Componente Timeline — ✅ Completo
- `ActivityTimeline` creado en `src/components/ActivityTimeline.jsx`.
- Línea vertical con dots, íconos por tipo, fecha/hora, descripción, actor.
- Filtros: búsqueda, tipo de evento, rango de fechas, botón limpiar.
- Totalmente desacoplado: acepta `typeKey`, `dateKey`, `descKey`, `actorKey` como props.

---

## 3. Metas del Sistema (PEI) — ⬜ PENDIENTE

### Objetivo
Mejorar el módulo de Plan Educativo Individualizado (PEI): metas calendarizadas, progreso visual, y exportación de reportes por meta.

### Tareas (todas pendientes — requieren backend + frontend)

- 3.1 Calendarización de metas (`met_fech`)
- 3.2 Progreso visual (`MetaProgressCard`)
- 3.3 Reporte por meta (PDF)

---

## 4. Herramientas / Reportes — ✅ PARCIAL

### Objetivo
Integrar las herramientas existentes con generación de reportes avanzados y dashboards por meta.

### Tareas

#### 4.1 Dashboard de progreso general — ⬜ Pendiente

#### 4.2 Exportación combinada — ⬜ Pendiente

#### 4.3 Herramientas interactivas — ✅ Parcial
- ✅ Botón "Limpiar" agregado al buscador de pictogramas en `Herramientas.jsx`.

---

## 5. Auditoría Visual — ✅ COMPLETO

### Objetivo
Transformar la tabla plana de auditoría en un centro de monitoreo visual con filtros, búsqueda y gráficos.

### Tareas

#### 5.1 Rediseño de `AdminActivityLog` — ✅ Completo
- Filtros por tipo (checkboxes inline), rango de fechas (date pickers), búsqueda por texto (`useDebounce` style).
- Paginación de 50 registros por página con navegación.
- Tarjetas visuales con icono, descripción, timestamp, actor e IP.
- Gráfico de barras diario (últimos 30 días) con altura proporcional.
- Estadísticas por tipo de evento con porcentajes.
- Botón "Limpiar" condicional.
- Tabla duplicada de auditoría eliminada de `AdminDashboard.jsx`.

#### 5.2 Gráficos de auditoría — ✅ Incluido en 5.1
- Barras por día integradas directamente en el componente.

#### 5.3 Exportación de auditoría — ✅ Completo
- Botón "Excel" en `AdminActivityLog` que exporta los registros filtrados a `.xlsx` usando `xlsx`.

---

## Tareas Adicionales Implementadas

| Tarea | Archivos |
|-------|----------|
| **Logout por inactividad** | `src/context/GlobalState.jsx` — integra `useIdleTimer` (15 min default, configurable via `VITE_IDLE_TIMEOUT`) |
| **Seguridad axios** | `src/api/axios.js` — `clearAuth()` selectivo, flag anti-redirect-loop, timeout 15s, `VITE_API_URL` configurable |
| **useDebounce hook** | `src/hooks/useDebounce.js` — debounce 300ms para filtros de búsqueda |
| **Botón Limpiar en vistas** | `AlertCenter.jsx`, `ManualUsuario.jsx`, `ManualUsuarioEspecialista.jsx`, `ManualUsuarioRepresentante.jsx`, `Herramientas.jsx` |
| **Optimización PatientManagement** | Filtro migrado a `useMemo` con `debouncedSearch`, dark mode duplicado eliminado |

---

## Priorización Actualizada

| Prioridad | Componente | Estado | Esfuerzo restante |
|-----------|-----------|--------|-------------------|
| **P1** | 1.1 + 1.2 (Modal + StatusBadge) | ✅ Completo | — |
| **P2** | 5.1–5.3 (Rediseño auditoría) | ✅ Completo | — |
| **P3** | 2.3 (ActivityTimeline) | ✅ Completo | — |
| **P4** | 2.1 + 2.2 (Middleware + trazabilidad por entidad) | ⬜ Pendiente | 3 días (backend + frontend) |
| **P5** | 3.1 + 3.2 (Calendarización + progreso PEI) | ⬜ Pendiente | 3 días |
| **P6** | 4.1 + 4.2 (Dashboard + exportación combinada) | ⬜ Pendiente | 2 días |
| **P7** | 1.3 + 1.4 (Protección + historial estados) | ⬜ Pendiente | 1 día |
| **P8** | 3.3 + 4.3 (Reporte por meta + herramientas) | ⬜ Pendiente | 2 días |

**Invertido:** ~4 días frontend. **Restante:** ~11 días (backend + frontend).

---

## Notas técnicas

- **Frontend**: Todos los componentes nuevos en `src/components/` siguiendo estructura existente.
- **Hooks**: `useDebounce` creado, `useIdleTimer` existente e integrado.
- **Estilo**: Design tokens de `tailwind.config.js` (`brand-*`, `radius-*`, fuentes). Dark mode vía `GlobalState`.
- **Backend**: El middleware de auditoría (2.1) y normalización `est_reg` (1.1) requieren cambios en el backend separado.
- **Estados**: Preferir `'Activo'|'Inactivo'` sobre booleanos para nuevos desarrollos.

## Archivos Relevantes

| Archivo | Propósito |
|---------|-----------|
| `src/components/StatusBadge.jsx` | Badge reutilizable de estado |
| `src/components/ConfirmDialog.jsx` | Modal de confirmación genérico |
| `src/components/ActivityTimeline.jsx` | Timeline visual para trazabilidad |
| `src/hooks/useDebounce.js` | Hook de debounce para búsquedas |
| `src/hooks/useIdleTimer.js` | Hook de detección de inactividad |
| `src/context/GlobalState.jsx` | Estado global + idle timeout |
| `src/api/axios.js` | Interceptor JWT + 401 handler mejorado |
| `src/components/admin/AdminActivityLog.jsx` | Auditoría visual con filtros y gráficos |
| `src/components/PatientManagement.jsx` | Búsqueda con debounce + limpiar filtros |

