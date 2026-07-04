# Sistema de Notificaciones — SIAT

## Archivo modificado

**`src/components/layout/NotificationBell.jsx`** — refactor completo (antes 201 líneas, ahora 291).

---

## ¿Qué cambió?

El componente original solo funcionaba para el rol **REPRESENTANTE**: cargaba alertas desde `/reportes/alertas-representante` y escuchaba eventos WebSocket `new_alert`. Para **ADMIN** y **ESPECIALISTA** el componente se renderizaba pero no mostraba nada útil.

Ahora el componente es **multi-rol** y cada rol recibe notificaciones relevantes:

---

### ADMIN (Administrador de Institución)

| Tipo de notificación | Origen | Descripción |
|---|---|---|
| Crisis de pacientes | WebSocket `new_alert` | Alerta en tiempo real con sonido + badge + toast |
| Nuevo especialista | GET `/admin/users` (últimos 7 días) | "Nuevo especialista registrado: Nombre Apellido" |
| Nuevo representante | GET `/admin/users` (últimos 7 días) | "Nuevo representante registrado: Nombre Apellido" |

### ESPECIALISTA

| Tipo de notificación | Origen | Descripción |
|---|---|---|
| Crisis de pacientes asignados | WebSocket `new_alert` | Alerta en tiempo real con sonido + badge + toast |
| Alertas históricas | GET `/reportes/alertas-representante` | Carga alertas recientes al montar el componente |

### REPRESENTANTE (sin cambios)

| Tipo de notificación | Origen | Descripción |
|---|---|---|
| Alertas de su hijo | GET `/reportes/alertas-representante` | Carga historial al montar |
| Crisis en tiempo real | WebSocket `new_alert` | Alerta con sonido + badge + toast |

---

## Funcionalidades transversales

- **Badge animado**: contador rojo con número de no leídos (99+ max)
- **Sonido**: tono B5→E6 vía Web Audio API en cada alerta WebSocket
- **Animación bounce**: el icono de campana vibra 1s al recibir alerta
- **Marcar como leído**: clic en una notificación → se marca individual
- **Marcar todas leídas**: botón `CheckCircle` en el header del dropdown
- **Limpiar todo**: botón `Trash2` para vaciar todas las notificaciones
- **Persistencia**: las notificaciones se guardan en `localStorage` (clave `siat_notifications`, máx 30 items)
- **Formato relativo**: "Ahora", "5 min", "3h", "12/03" según antigüedad
- **Cierre al hacer clic fuera**: el dropdown se cierra al hacer clic fuera de él
- **Iconos por tipo**: cada tipo de notificación tiene su propio icono y color:
  - Crisis → `AlertTriangle` (rosa)
  - Nuevo especialista → `UserPlus` (azul)
  - Nuevo representante → `UserPlus` (verde)
  - Sistema → `ServerCrash` (ámbar)
  - Incidente → `ShieldAlert` (rojo)
  - Advertencia → `Activity` (amarillo)

---

## Arquitectura

```
[WebSocket backend] ─── event 'new_alert' ──► NotificationBell
                                                  │
                                                  ├─ playAlertSound()
                                                  ├─ setIsVibrating(true)
                                                  ├─ addNotification() ──► localStorage
                                                  └─ showToast()

[API REST] ─── GET /reportes/alertas-representante ──► NotificationBell (todos los roles)
              GET /admin/users                     ──► NotificationBell (solo ADMIN)
```

---

## Dependencias

- `lucide-react`: Bell, AlertTriangle, Trash2, UserPlus, Activity, ShieldAlert, ServerCrash, CheckCircle
- `socket.io-client`: WebSocket vía `getSocket()` hook
- `api/axios`: llamadas REST
- `context/GlobalState`: `userRole`, `showToast`
