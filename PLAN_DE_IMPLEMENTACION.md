# Plan de Implementación — Mejoras SIAT

> **Sistema Integrado de Asistencia Terapéutica**
> Julio 2026

---

## 🔴 Prioridad Crítica

### 1. Corrección de bugs documentados

| Bug | Causa raíz | Solución propuesta |
|-----|-----------|-------------------|
| `TrendingUp is not defined` | Falta importación de lucide-react en SpecialistDashboard.jsx | Agregar `import { TrendingUp } from 'lucide-react'` |
| Agenda en blanco al seleccionar paciente | Desajuste entre estructura de datos mock y API real (`nin_codi` vs `id`) | Normalizar nomenclatura de campos en el mapeo de datos |
| Validación perfil ADMIN envía campos incorrectos | Nombres de campo distintos entre frontend (`usu_crro`) y lo que espera la API | Alinear payload del formulario con el contrato de la API |
| Gráfica de latencia rota | `dataKey="time"` en XAxis pero mock data usa clave `name` | Unificar claves de datos entre mocks y componentes |

**Por qué:** Estos son errores en producción que afectan directamente la experiencia de usuario. Un sistema clínico no puede tener funcionalidades rotas.

---

### 2. Infraestructura de pruebas (Vitest + Testing Library)

**Estado actual:** Cero archivos de prueba en todo el proyecto.

**Implementación:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Archivos a crear:
- `src/setupTests.js` — Configuración global de testing
- `src/components/__tests__/Auth.test.jsx` — Pruebas de autenticación
- `src/components/__tests__/RBAC.test.jsx` — Pruebas de control de acceso por rol
- `src/hooks/__tests__/useTelemetry.test.js` — Pruebas de lógica de telemetría
- `src/components/dashboard/__tests__/TelemetryChart.test.jsx` — Pruebas de renderizado de gráficas

Script en `package.json`: `"test": "vitest", "test:ui": "vitest --ui"`

**Por qué:** Sin pruebas, cada cambio es un riesgo. Para un SaaS clínico que maneja datos sensibles y tiene múltiples roles con diferentes vistas, las regresiones son peligrosas. Vitest se integra nativamente con Vite (cero configuración extra) y corre en milisegundos.

---

### 3. Refactorización de GlobalState (Contextos separados)

**Estado actual:** `src/context/GlobalState.jsx` tiene 576 líneas y maneja:
- Autenticación (usuario, rol, token)
- Datos clínicos (niños, citas, sesiones)
- Hardware y telemetría
- UI (tema oscuro, sidebar, notificaciones)
- Navegación
- Temporizador de inactividad

**Implementación propuesta:**

```
src/context/
├── AuthContext.jsx        # Autenticación, JWT, rol, usuario
├── ClinicalContext.jsx    # Datos de pacientes, citas, sesiones
├── HardwareContext.jsx    # Dispositivos IoT, telemetría en vivo
├── UIContext.jsx          # Tema oscuro, sidebar, notificaciones toast
└── AppProvider.jsx        # Composición de todos los providers
```

Cada contexto tendrá ~80-120 líneas con una responsabilidad única.

**Por qué:** Un contexto monolítico causa:
- **Re-renderizados innecesarios**: cualquier cambio en el estado global (ej. abrir el sidebar) fuerza re-render de todos los consumidores.
- **Dificultad de testing**: no se puede probar la lógica de autenticación sin mockear todo el estado clínico.
- **Acoplamiento**: mezclar navegación con datos clínicos crea dependencias ocultas.

---

### 4. Axios timeout y manejo de errores

**Estado actual:** Timeout de 15 segundos sin indicador de carga ni reintento.

**Implementación:**
```js
// src/api/axios.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,
  retry: 3,
  retryDelay: 1000
})
```

Agregar interceptor de respuesta que muestre un toast de error genérico cuando el backend esté caído, y un componente `ServerWarmup` que dé feedback visual durante el arranque de Render.

**Por qué:** Render (free tier) se duerme tras 15 min de inactividad y tarda 30-60s en reanimarse. El timeout actual de 15s frustra al usuario sin feedback. Con 30s + 3 reintentos + indicador visual, la experiencia mejora drásticamente.

---

## 🟡 Prioridad Alta

### 5. TypeScript (migración progresiva)

**Estado actual:** 100% JavaScript (.jsx). ~22,000 líneas.

**Implementación:**
1. Renombrar `vite.config.js` a `vite.config.ts`
2. Instalar `typescript`, `@types/react`, `@types/react-dom`
3. Crear `tsconfig.json` con `allowJs: true` para migración gradual
4. Migrar primero la capa de datos: `src/api/axios.js` → `axios.ts`
5. Migrar hooks: `useTelemetry.js`, `useClinicalData.js`
6. Migrar contextos refactorizados
7. Finalmente, los componentes de UI (comenzando por los críticos: Auth, RBAC en App.jsx)

**Por qué:** Los errores de tipo como `dataKey="time"` vs `"name"` y `TrendingUp is not defined` desaparecen en tiempo de compilación. Para un dominio clínico con tipos de datos complejos (umbrales, sesiones, alertas), TypeScript es el estándar de la industria y previene bugs antes de que lleguen a producción.

---

### 6. TanStack Query (React Query)

**Estado actual:** Múltiples `useEffect` + `fetch`/`axios` esparcidos por los componentes, sin caché, sin sincronización, sin estado de carga consistente.

**Implementación:**
```bash
npm install @tanstack/react-query
```

Crear `src/api/queryClient.js` y envolver la app con `QueryClientProvider`.

Ejemplo de query:
```js
const { data: pacientes, isLoading, error } = useQuery({
  queryKey: ['pacientes', insCodi],
  queryFn: () => api.get(`/pacientes?ins_codi=${insCodi}`),
  staleTime: 5 * 60 * 1000, // 5 min antes de revalidar
  retry: 3
})
```

**Por qué:** React Query elimina el boilerplate de loading/error/data, cachea peticiones, revalida en background cuando la ventana recupera el foco, y maneja reintentos automáticos. En un sistema con datos clínicos que cambian lentamente (metas PEI, historial) pero también tienen componentes en tiempo real (telemetría), permite mezclar ambos modelos sin fricción.

---

### 7. WebSockets con reconexión robusta

**Estado actual:** `src/hooks/socket.js` conecta a Socket.IO sin manejo de reconexión exponencial, heartbeat, cola de mensajes, ni indicador de conectividad.

**Implementación:**
```js
const socket = io(URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  randomizationFactor: 0.5,
  heartbeatInterval: 25000,
  heartbeatTimeout: 10000
})
```

Agregar un indicador visual "Conectado / Desconectado / Reconectando..." en el Topbar y una cola de mensajes local que se reenvíen al restablecer la conexión.

**Por qué:** Para telemetría IoT en tiempo real (BPM, aceleración, estrés), una conexión WebSocket confiable es crítica. Si el wearable envía datos de crisis y el WebSocket está caído, el sistema falla en su propósito principal: detectar sobrecarga sensorial.

---

### 8. PWA (Progressive Web App)

**Estado actual:** Sin Service Worker, sin manifiesto, sin soporte offline.

**Implementación:**
```bash
npm install -D vite-plugin-pwa
```

Configurar en `vite.config.js`:
```js
import { VitePWA } from 'vite-plugin-pwa'

VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [{
      urlPattern: /^https:\/\/backend-siat\.onrender\.com\/api\/.*/,
      handler: 'NetworkFirst',
      options: { cacheName: 'api-cache', expiration: { maxEntries: 50 } }
    }]
  },
  manifest: {
    name: 'SIAT - Sistema Integrado de Asistencia Terapéutica',
    short_name: 'SIAT',
    description: 'Plataforma SaaS de telemonitoreo clínico para niños con TEA',
    theme_color: '#1e3a5f',
    icons: [{ src: '/Logo.png', sizes: '192x192', type: 'image/png' }]
  }
})
```

**Por qué:** En entornos clínicos reales (hospitales, centros terapéuticos, hogares), la conectividad no es garantizada. Una PWA permite:
- Seguir viendo datos del paciente sin internet
- Sincronizar reportes del hogar al reconectar
- Experiencia "nativa" en tablets que usan terapeutas y padres
- Instalación directa desde el navegador sin pasar por app stores

---

## 🟢 Prioridad Media

### 9. Memorización y rendimiento (React.memo, useMemo, useCallback)

**Estado actual:** Componentes pesados como `AdminDashboard.jsx` (738 líneas), tablas de pacientes, y gráficas Recharts se renderizan en cada cambio de estado global.

**Implementación:**
- Envolver tablas y listas con `React.memo`
- Memorizar datos transformados con `useMemo` (especialmente datos para gráficas Recharts)
- Memorizar callbacks con `useCallback` en handlers pasados como props
- Usar `React DevTools Profiler` para identificar cuellos de botella

**Por qué:** El contexto monolítico actual causa re-renderizados en cadena. Sin memorización, componentes como `HistoryProgress.jsx` o `AdminDashboard.jsx` se recalcula cada vez que cambia el tema oscuro o cualquier otra variable de estado global.

---

### 10. Sistema de roles extensible (RBAC declarativo)

**Estado actual:** `App.jsx` tiene un `switch`/`if-else` con las rutas permitidas por rol.

**Implementación:**
```js
// src/config/rbac.js
export const permissions = {
  ROL_ADM: {
    routes: ['admin', 'profile', 'inventario'],
    actions: ['create:specialist', 'delete:specialist', 'assign:patient', 'view:audit']
  },
  ROL_ESP: {
    routes: ['dashboard', 'patients', 'historial', 'agenda', 'profile'],
    actions: ['create:soap', 'create:incident', 'calibrate:sensor']
  },
  ROL_REP: {
    routes: ['dashboard', 'diario_hogar', 'agenda', 'perfil_padre', 'profile'],
    actions: ['request:appointment', 'report:daily']
  }
}
```

**Por qué:** El switch actual es frágil y difícil de extender. Si mañana se agrega un rol `ASISTENTE` o `DIRECTOR_MEDICO`, hay que modificar el switch en lugar de solo agregar una entrada al objeto de permisos.

---

### 11. Internacionalización (i18n)

**Estado actual:** Todo el texto de la UI está hardcodeado en español en cada componente.

**Implementación:**
```bash
npm install react-i18next i18next
```

Crear `src/i18n/locales/es.json` y `en.json`. Envolver la app con `I18nextProvider`. Reemplazar textos con `{t('welcome')}`.

**Por qué:** Si el sistema se expande a otras regiones (ej. clínicas en USA con terapeutas bilingües), refactorizar 60+ archivos para extraer strings será mucho más costoso que hacerlo ahora. Arrancar con i18n desde el principio cuesta ~5% del esfuerzo de hacerlo después.

---

### 12. Storybook (biblioteca de componentes)

**Implementación:**
```bash
npx storybook@latest init
```

Documentar componentes compartidos: `StatusBadge`, `EmptyState`, `ConfirmDialog`, `Skeleton`, `NotificationBell`, `Sidebar`.

**Por qué:** Un sistema de 60+ componentes necesita documentación visual. Storybook permite:
- Desarrollar y probar componentes de forma aislada
- Facilitar la incorporación de nuevos desarrolladores
- Detectar visualmente cambios no deseados (con Chromatic o regresión visual)

---

### 13. Módulo de reportes avanzados y exportación programada

**Estado actual:** Exportación manual a PDF/Excel mediante botones.

**Implementación:**
- Agregar programación de reportes recurrentes (diarios, semanales, mensuales) que se envíen por email desde el backend
- Dashboard embebido estilo Power BI para analítica institucional
- Vista comparativa multi-paciente para especialistas

**Por qué:** Los especialistas necesitan reportes periódicos sin intervención manual. La capacidad de comparar pacientes en una sola vista (ej. evolución de crisis por semana) es una funcionalidad de alto valor clínico que actualmente no existe.

---

### 14. Mejoras de UX en autenticación y registro

**Estado actual:** La pantalla de registro contiene jerga técnica ("multi-tenant", "telemetría cardíaca") que confunde a padres.

**Implementación:**
- Simplificar textos para el flujo de registro de representantes
- Agregar validación en tiempo real con Zod (ya está en dependencias pero no se usa activamente)
- Mejorar el feedback visual de contraseñas (requisitos, fortaleza)

**Por qué:** La primera impresión del sistema es la pantalla de login/registro. Si confunde a los usuarios, genera tickets de soporte y abandono. Zod ya está instalado pero infrautilizado.

---

### 15. Husky + lint-staged + ESLint

**Estado actual:** `.husky/` existe pero no hay configuración de ESLint ni Prettier.

**Implementación:**
```bash
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks prettier lint-staged
```

Configurar husky pre-commit para ejecutar `npx lint-staged` y evitar commits con errores.

**Por qué:** Ya tienes husky instalado pero no está haciendo cumplir calidad de código. Un pre-commit que ejecute ESLint y formatee con Prettier previene los errores de sintaxis (como `TrendingUp is not defined`) antes de que lleguen al repositorio.

---

## Resumen de esfuerzo vs. impacto

| # | Mejora | Esfuerzo | Impacto | Dependencias |
|---|--------|----------|---------|-------------|
| 1 | Corregir bugs HIGH | ⭐ (1-2h) | 🔴 Crítico | Ninguna |
| 2 | Tests (Vitest) | ⭐⭐⭐ (1-2d) | 🔴 Crítico | Vite (ya instalado) |
| 3 | Refactor GlobalState | ⭐⭐⭐⭐ (3-5d) | 🔴 Crítico | Context API |
| 4 | Axios timeout + errores | ⭐ (2-3h) | 🟡 Alto | Axios |
| 5 | TypeScript | ⭐⭐⭐⭐⭐ (1-2sem) | 🟡 Alto | Vite |
| 6 | TanStack Query | ⭐⭐⭐ (2-3d) | 🟡 Alto | React Query |
| 7 | WebSockets robustos | ⭐⭐ (4-6h) | 🟡 Alto | Socket.IO |
| 8 | PWA | ⭐⭐ (4-6h) | 🟡 Alto | vite-plugin-pwa |
| 9 | Memorización | ⭐⭐ (4-6h) | 🟢 Medio | — |
| 10 | RBAC declarativo | ⭐ (2-3h) | 🟢 Medio | — |
| 11 | i18n | ⭐⭐⭐⭐ (3-5d) | 🟢 Medio | react-i18next |
| 12 | Storybook | ⭐⭐ (1-2d) | 🟢 Medio | Storybook |
| 13 | Reportes avanzados | ⭐⭐⭐ (2-3d) | 🟢 Medio | Backend |
| 14 | UX autenticación | ⭐ (3-4h) | 🟢 Medio | Zod (ya instalado) |
| 15 | ESLint + Husky | ⭐ (2-3h) | 🟢 Medio | Husky (ya instalado) |

---

**Leyenda de esfuerzo:**
- ⭐ = horas, ⭐⭐ = medio día, ⭐⭐⭐ = días, ⭐⭐⭐⭐ = varios días, ⭐⭐⭐⭐⭐ = semanas

**Secuencia recomendada:** 1 → 4 → 2 → 3 → 6 → 7 → 8 → 5 (trabajos en paralelo posibles: 2 y 4 no tienen dependencias entre sí)
