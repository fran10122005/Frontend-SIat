# Plan de Mejora — Panel Admin SIAT

**Contexto:** Fundación (tipo Funauta) que recibe niños con autismo y gestiona su
atención integral. El panel admin debe sentirse profesional, no sencillo.

**Regla general:** priorizar aprovechar el backend que ya existe antes de construir
algo nuevo. Casi todos los módulos de datos ya están desplegados.

---

## Lo que el panel YA cubre (no tocar)

- Especialistas: CRUD, activar/desactivar, reset pass, export PDF/Excel.
- Representantes: listado, edición, export.
- Asignaciones: crear caso, toggle estado, export.
- Usuarios: toggle, reset pass, export.
- Historial Clínico: incidentes globales (filas expandibles), export.
- Auditoría (actividad), Infraestructura (health API/DB/WS), Mi Fundación
  (RIF editable, email/web), especialidades CRUD, registro de pacientes,
  exports, toasts unificados, responsive.

---

## Brechas detectadas (orden de prioridad)

### Iteración A — Núcleo operativo (alto valor, backend listo)

1. **Tab "Pacientes"** — El negocio no tiene gestión de pacientes.
   - Listado con estado (activo / inactivo / egresado), búsqueda y paginación.
   - Ver ficha: `GET /ninos/:id/ficha` (ya existe).
   - Historial completo del niño: `GET /reportes/historial-completo/:nin_codi` (ya existe).
   - Metas del niño: `GET /metas/:nin_codi` (ya existe).
   - Cambiar representante y ver sesiones del paciente.

2. **Sesiones / horas de terapia reales** — Hoy la métrica está hardcodeada.
   - `admin.service.js getMetricasDashboard`: `horasTerapia += 8` (estimado fijo).
     Reemplazar por cálculo real desde sesiones cerradas del módulo `sesiones`.
   - Vista de horas por paciente / especialista / mes.

### Iteración B — Autismo + monitoreo

3. **IoT / dispositivos por paciente** — El backend `monitoreo` (telemetría) y
   `HardwareInventory.jsx` existen; el admin solo ve "Infraestructura" (servidor).
   - Inventario de pulseras/sensores por niño, estado, batería, vinculación.
   - Reutilizar `monitoreo` (recibir/telemetría, simular-estado).

4. **Alertas fisiológicas reales** — El dashboard usa `MOCK_INCIDENTES`.
   - Mostrar `tr_alert` reales por severidad con estado y resolución.
   - Reutilizar `POST /reportes/alertas/:ale_codi/feedback`.

### Iteración C — Clínico-administrativo

5. **Metas / PEI global** — Progreso global por paciente y por especialista
   (módulo `metas` con ensayos).

6. **Consentimientos informados** — Vista del estado (firmado / pendiente /
   versión LOPNNA) por paciente. Módulo `consentimiento` existe.

7. **Bitácoras del hogar** — Cumplimiento de tareas en casa por paciente
   (`POST /ninos/bitacora` de DiarioHogar) como parte del reporte evolutivo.

---

## Mejoras transversales ya planificadas (de sesiones previas)

- Gráfica Balance Emocional: siempre cubrir últimos 7 días (real + mock).
- Leyenda chart conductual: `flex-wrap`.
- Botones calendario/reporte en el header.
- Toasts vía `showToast` (GlobalState), nunca mensajes inline.
- Exports PDF/Excel consistentes en cada tab.
