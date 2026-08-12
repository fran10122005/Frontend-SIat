# Plan de Mejora Visual: Colores, Contrastes y Acabado Profesional

Después de auditar los componentes principales, he identificado varias áreas donde los colores, contrastes y acabados visuales pueden refinarse para lograr una estética clínica de grado profesional — no "bonita" sino **seria, madura y confiable**.

## Diagnóstico

| Problema | Dónde | Impacto |
|----------|-------|---------|
| Emojis como indicadores de estado (`🟢🟡🔴`) | `ChildStatusBanner` | Se siente infantil para un sistema clínico |
| Botones con estilos inline muy variados | Múltiples vistas | Inconsistencia visual entre pantallas |
| Footer genérico y plano | `Footer.jsx` | Pierde la oportunidad de dar un cierre profesional |
| Tarjetas KPI con gradiente naranja intenso para alertas | `AdminKPIs.jsx` | Rompe la armonía de la paleta azul/slate |
| Sombras `shadow-xl` excesivas en tarjetas oscuras (SOS, Wearable) | `MainDashboard.jsx` | Sobrecarga visual |
| Fondo del body `#F8FAFC` vs `#F4F7F9` inconsistente | `index.css` vs páginas | Parpadeo sutil entre vistas |

## Proposed Changes

### 1. Paleta de colores refinada y fondo unificado
#### [MODIFY] [index.css](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/index.css)
- Unificar el fondo del `body` a un solo tono: `#F8FAFC` (claro) y `#0B1120` (oscuro).
- Refinar las sombras de tarjetas: más sutiles, con tono azulado corporativo en lugar de negro puro.
- Añadir clase `.section-heading` para headings de sección dentro de tarjetas (ej. "Foco Clínico", "Últimos Eventos").
- Añadir clase `.btn-secondary` para botones secundarios con estilo uniforme.

### 2. ChildStatusBanner: indicadores clínicos, no emojis
#### [MODIFY] [ChildStatusBanner.jsx](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/components/dashboard/ChildStatusBanner.jsx)
- Reemplazar emojis (`🟢🟡🔴`) por indicadores SVG con punto de color + pulso sutil.
- Aplicar gradientes más sobrios (no saturados al 100%).

### 3. Footer profesional
#### [MODIFY] [Footer.jsx](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/components/layout/Footer.jsx)
- Añadir versión del sistema, año dinámico y un look más corporativo con borde superior sutil.

### 4. AdminKPIs: tarjeta de alertas coherente
#### [MODIFY] [AdminKPIs.jsx](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/components/admin/AdminKPIs.jsx)
- Cambiar el gradiente naranja intenso de la tarjeta de alertas a un fondo `rose`/`red` más tenue que se integre con la paleta general sin romper la armonía.

### 5. Fondo de HistoryProgress coherente
#### [MODIFY] [HistoryProgress.jsx](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/pages/HistoryProgress.jsx)
- Cambiar `bg-[#F4F7F9]` a `bg-[#F8FAFC]` para que coincida con el resto del sistema.

### 6. Topbar: separador visual más fino
#### [MODIFY] [Topbar.jsx](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/components/layout/Topbar.jsx)
- Agregar el nombre de la institución o "SIAT" como breadcrumb ligero en el lado izquierdo del Topbar (visible en desktop), para que no quede vacío a la izquierda.

## Verification Plan

### Manual Verification
- Verificar consistencia de fondos entre todas las vistas (sin parpadeo al cambiar de pantalla).
- Inspeccionar el banner de estado del niño para confirmar que ya no tiene emojis.
- Confirmar que la tarjeta de alertas en AdminKPIs armoniza con el resto.
- Validar build de producción sin errores.
