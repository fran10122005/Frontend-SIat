# SIAT — Flujo de Sesiones de Terapia (Terapias y Actividades)

Especificación funcional del flujo de ejecución de rutinas/sesiones en vivo.
Archivo principal: `src/pages/Routines.jsx` · Endpoints: `/sesiones/iniciar`, `/sesiones/{cod}/cerrar`.

---

## 1. Catálogo → Vista Previa (antes de iniciar)

Al hacer clic en una tarjeta de terapia **NO se inicia la sesión directamente**: se abre un modal de **Vista Previa** (`previewRoutine`) que permite decidir con información completa.

### Contenido del modal
| Elemento | Descripción |
|---|---|
| Etiqueta | "VISTA PREVIA DE LA SESIÓN" (uppercase, azul) |
| Título | Nombre de la terapia (`act_trea`) |
| Subtítulo | `{categoría} • {dificultad}` — sin datos del paciente (ya viene seleccionado en el contexto global) |
| Descripción | Texto clínico de la actividad (`act_desc`) |
| Materiales necesarios | Chips generados separando `act_meta` por comas (solo si existe) |
| Lista de pasos | Numerados (círculo azul), texto del paso + tiempo individual por paso |
| Pie de lista | `{N} pasos` · `Duración estimada: MM:SS` (suma de tiempos) |
| Botones | `Cancelar` (borde) / `▶ Iniciar Sesión` (degradado brand→azul) |

- Cierre por backdrop o botón ✕.
- Los pasos se obtienen con `getEffectiveSteps(routine)`.

## 2. Parser de pasos tolerante

`parseSteps(inst)` procesa el campo guía (`act_guia`):
- Acepta saltos `\r\n` o `\n`; ignora líneas vacías.
- Formato canónico: `"1. texto (2 min)"`.
- Tolerante también a `"1) texto"`, `"- texto"`, `"• texto"` y líneas sin tiempo (tiempo por defecto 60 s).
- `parseTimeToSeconds` entiende `"X min"`, `"X seg"`, `"X h"` o número suelto (= minutos).

**Fallback garantizado:** si no hay guía parseable, `getEffectiveSteps()` genera **un paso único** con `descripción → guía → título` y duración = `act_time` (mín. 1 min). El reproductor nunca queda sin pasos.

## 3. Reproductor de sesión en vivo

Contenedor centrado `max-w-3xl` (no ocupa todo el ancho en PC). Estructura vertical:

### 3.1 Franja superior (una unidad)
- Izquierda: indicador de estado + título de la terapia.
  - En curso: punto rojo pulsante + "MONITOREO EN CURSO" (azul).
  - Pausada: punto ámbar fijo + "SESIÓN EN PAUSA" (ámbar).
- Derecha (alineada): botón ⏸/▶ **Pausar/Reanudar** (cuadrado, borde gris), chip de tiempo total transcurrido `MM:SS` (tabular-nums), botón **Detener** (blanco con borde rosa, ícono Square).

### 3.2 Timeline navegable de pasos
- Segmentos finos (`h-1.5 flex-1`), uno por paso, clic para **saltar** a ese paso.
- Estados: completado = `bg-blue-600` · actual = `bg-blue-400` · pendiente = gris (hover más oscuro).
- Sustituye a la barra genérica de progreso; convive con la lógica de auto-avance.

### 3.3 Contenido del paso (centrado)
1. Fila integrada: `PASO X DE Y` (izq, azul) + `RESTANTE −MM:SS` (der, gris).
2. Barra de progreso del paso (`h-2`, azul, misma anchura máx `max-w-lg` que el contenido).
3. Cronómetro grande del paso (`text-6xl sm:text-7xl`, mono): rojo pulsante ≤10 s; atenuado en pausa.
4. Caption "TIEMPO RESTANTE DEL PASO".
5. Instrucción del paso (texto bold, `max-w-lg`).
6. Multimedia opcional (video `<video controls>` o imagen, `max-w-sm`, h-40).

### 3.4 Controles inferiores (justify-between)
- Izquierda: `← Anterior` (borde gris; deshabilitado en paso 1).
- Derecha: `Siguiente paso →` (azul sólido) **o**, en el último paso, `Finalizar sesión ✓` (azul institucional oscuro `brand-700` con borde, estilo sobrio).

## 4. Pausa (nueva)

- Motivo clínico: disrregulación/crisis sin abortar la sesión.
- El intervalo del reloj solo corre con `activeSession && !isFinishing && !isPaused`.
- Al pausar: cronómetro atenuado, estado ámbar en franja superior; auto-avance se congela naturalmente (no avanza el tiempo).
- Se reinicia a "reanudar" al iniciar cualquier nueva sesión.

## 5. Cierre de sesión

Trigger: botón Finalizar (último paso), Detener, o agotamiento del último paso (auto-cierre cuando `sessionTime >= duración total`).

Pantalla de cierre muestra:
- Chips de resumen: `⏱ tiempo total` · `Pasos X/Y alcanzados`.
- **Nivel de Cooperación 1–5 estrellas** (obligatorio para guardar).
- Notas u observaciones (textarea opcional).
- Botones: `Volver` (reanudar edición del cierre) / `Guardar Bitácora` (azul).

**Guardado:** `PUT /sesiones/{ses_codi}/cerrar` con nota estructurada:
```
[Cooperación: X/5 · Pasos: N/M] {notas opcionales}
```
Toast de confirmación con tiempo y cooperación. Si falla el backend, toast de error y la sesión local se cierra igualmente.

## 6. Reglas de auto-avance (integridad)

- `naturalIdxRef` guarda el índice "natural" que el reloj ha alcanzado; el paso visible es `max(paso manual, natural)` — retroceder manualmente no pelea con el reloj.
- Saltos manuales por timeline actualizan `naturalIdxRef` al destino (el auto-avance continúa desde ahí).
- Auto-cierre solo cuando el último paso está activo Y el tiempo global supera la duración total.

## 7. Permisos

- Especialista / Admin institución (`isGestion`): catálogo clicable → vista previa → sesión. Además Editar/Eliminar/Crear terapias y gestionar categorías.
- Representante: NO inicia sesiones desde este módulo (su flujo equivalente vive en *Día a Día*); tampoco ve FAB de creación ni acciones de gestión.
