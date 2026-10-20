# Bitácora de Cambios: Telemetría, Interfaz y Experiencia Móvil SIAT

**Fecha:** 19 de Octubre de 2026  
**Proyecto:** SIAT — Sistema Inteligente de Acompañamiento Terapéutico (FUNAUTA)  
**Entornos:** Web Frontend (Vite/React) + Aplicación Móvil Android (Capacitor APK) + Backend Node/Express  

---

## 1. Resumen Ejecutivo

Durante esta sesión de trabajo se resolvieron problemas críticos de usabilidad, redundancia de interfaz, enlaces de telemetría IoT, visualización de progreso histórico y soporte multidispositivo móvil (APK). Los cambios optimizaron la experiencia de los padres de familia y especialistas garantizando que el sistema sea accesible, claro y técnicamente sólido.

---

## 2. Detalle de Cambios Realizados

### 1. Estrategia de Hardware y Telemetría IoT
* **Diagnóstico:** Se analizó si convenía atar la plataforma a una marca exclusiva de smartwatch o adoptar un modelo universal.
* **Decisión Técnica:** Se optó por una **estrategia híbrida** documentada en `docs/PLAN_ARQUITECTURA_TELEMETRIA_SMARTWATCH.md`:
  - Capa de comunicación universal basada en estándares abiertos (Bluetooth Low Energy GATT estándar para pulso `0x180D`, Health Connect API en Android, y WebSockets bidireccionales).
  - Homologación clínica comercial de 2-3 modelos recomendados por FUNAUTA para garantizar ergonomía táctil en niños con TEA y soporte post-venta.

---

### 2. Rediseño y Simplificación del Widget de Conexión
* **Archivo modificado:** [`src/components/shared/SmartwatchConnectWidget.jsx`](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/components/shared/SmartwatchConnectWidget.jsx)
* **Problema:** La interfaz abrumaba a los representantes legales con información hiper-técnica (UUIDs hexadecimales, dumps de paquetes BLE, selectores de Health Connect SDK en primer plano).
* **Solución:**
  - Rediseño con patrón de **3 estados limpios**:
    1. *Desconectado:* 1 solo botón principal de acción clara (`[ ⌚ Vincular Reloj Bluetooth ]`).
    2. *Conectado:* Cabina minimalista con pulso actual (BPM), estado de contacto con la piel y sincronización a la nube.
    3. *Opciones avanzadas:* Se colapsaron los analizadores BLE y herramientas de diagnóstico dentro de un acordeón plegable para soporte técnico.

---

### 3. Corrección del Binding de KPIs en Seguimiento en Vivo
* **Archivo modificado:** [`src/pages/HardwareInventory.jsx`](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/pages/HardwareInventory.jsx)
* **Problema:** En la pantalla `/portal/live-monitoring`, la gráfica de pulso en tiempo real dibujaba los datos correctamente, pero las tarjetas superiores mostraban `-- BPM`, `-- G` y `0%` de estrés.
* **Causa:** Las tarjetas de KPI estaban condicionadas a una bandera estricta `isConnected &&`, bloqueando la visualización cuando los datos entraban por Health Connect o WebSockets de la nube.
* **Solución:**
  - Se unificó la lectura con fallback al historial más reciente (`telemetryHistory[last]`).
  - Los estados del hardware ahora reflejan *"Telemetría Activa / En vivo"* dinámicamente cuando el flujo de datos está transmitiendo.

---

### 4. Eliminación de Redundancia en el Dashboard de Inicio
* **Archivos modificados:**
  - [`src/pages/MainDashboard.jsx`](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/pages/MainDashboard.jsx)
  - [`src/components/dashboard/ChildStatusBanner.jsx`](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/components/dashboard/ChildStatusBanner.jsx)
* **Problema:** El widget completo de conexión del reloj aparecía duplicado en la pantalla de inicio debajo del banner de estado del niño.
* **Solución:**
  - Se removió el widget duplicado de `MainDashboard.jsx`.
  - Se enriqueció `ChildStatusBanner.jsx` con un botón contextual directo `[ ⌚ Vincular Reloj ]` cuando el smartwatch no está transmitiendo, redirigiendo limpiamente a `/portal/live-monitoring`.

---

### 5. Supresión de Popups y Banners Molestos de PWA en APK y Web
* **Archivos modificados:**
  - [`src/App.jsx`](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/App.jsx)
  - [`src/components/shared/PwaInstallPrompt.jsx`](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/components/shared/PwaInstallPrompt.jsx)
  - [`src/components/shared/PwaUpdatePrompt.jsx`](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/components/shared/PwaUpdatePrompt.jsx)
  - [`vite.config.js`](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/vite.config.js)
* **Problema:** En cada recarga y dentro de la aplicación Android (APK nativa instalada) seguían apareciendo avisos flotantes molestos pidiendo *"Instalar App SIAT"* y *"Nueva versión disponible"*.
* **Solución:**
  - Se desmontaron los banners flotantes globales de `App.jsx`.
  - Se implementó la verificación `Capacitor.isNativePlatform()`; si el usuario ya está dentro de la app móvil compilada, los componentes retornan `null` de inmediato.
  - Se actualizó la configuración de Vite con `registerType: 'autoUpdate'` y se desactivaron los mensajes intrusivos en desarrollo (`devOptions.enabled = false`).

---

### 6. Corrección de la Pantalla de Progreso del Niño (Historial y Calma)
* **Archivos modificados:**
  - [`src/pages/HistoryProgress.jsx`](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/pages/HistoryProgress.jsx)
  - [`src/context/GlobalState.jsx`](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/context/GlobalState.jsx)
* **Problema:** En `/portal/child-progress`, la vista mostraba `0% Promedio de Calma`, `0 Sesiones` y `Sin registros históricos disponibles`, a pesar de haber simulado sesiones.
* **Causas identificadas:**
  1. El filtro temporal `dateRange` tenía por defecto `"7days"`. En la base de datos, las sesiones de prueba de Yonny Alejandro estaban fechadas entre el 9 y el 13 de octubre, quedando fuera del rango de los últimos 7 días.
  2. Incompatibilidad de formateo de fechas con strings ISO y años de 2 dígitos.
  3. Desconexión en el script de simulación que enviaba datos al ID `NIN_1` en lugar del ID real del niño en base de datos (`NxEWoE5KoR`).
* **Solución:**
  - Se cambió el rango inicial por defecto a `"all"` (Todo el historial), permitiendo ver de inmediato las 5 sesiones clínicas registradas con un **95% de promedio de calma**.
  - Se corrigió la función `parseFecRepo` para parsear timestamps ISO (`YYYY-MM-DDTHH:mm:ss`) y fechas estándar.
  - Se vinculó el historial de bitácoras del hogar como respaldo analítico.

---

### 7. Intercambio de Niños en Versión Móvil y APK (Unificado y sin duplicaciones)
* **Archivo modificado:** [`src/components/layout/Topbar.jsx`](file:///c:/Users/WinterOS/Documents/Francisco/Diseno/SIAT/src/components/layout/Topbar.jsx)
* **Problema:** En la versión móvil (navegador en celulares y APK de Android), los padres de familia no podían cambiar entre sus niños (ej. Yonny Alejandro y Maria Paula) porque el contenedor de la barra superior estaba condicionado con `hidden sm:flex`.
* **Solución Definitiva:**
  - **Cero Duplicación:** El selector reside exclusivamente en la barra superior (`Topbar.jsx`). Se eliminó cualquier bloque redundante en el menú lateral (`Sidebar.jsx`).
  - **Estilo Original Unificado:** Se preservó exactamente el diseño original elegante de píldoras (`[ 👶 Yonny Alejandro ] [ 👶 Maria Paula ]`) con sus nombres completos, sin recortes ni estilos secundarios extraños.
  - **Soporte Móvil Nativo:** El contenedor ahora es completamente visible en dispositivos móviles con deslizamiento horizontal suave (`overflow-x-auto no-scrollbar`), evitando que se desborde o corte en pantallas estrechas.
  - **Sincronización Total:** Cada selección actualiza de inmediato el estado global (`selectedChildId`, `nomNino`) y persiste en el almacenamiento local (`saveSelectedChild`), sincronizando la telemetría y los reportes al instante.


---

## 3. Verificación de Compilación y Calidad

El proyecto fue sometido a prueba de compilación de producción con Vite:
```bash
npm run build
```
* **Resultado:** Exitoso (código de salida 0).
* **Módulos procesados:** 3,424 módulos transformados y empaquetados sin errores sintácticos.
* **Integración PWA:** Manifiesto y Service Worker generados correctamente en modo auto-actualización.

---

## 4. Próximas Recomendaciones Opcionales

1. **Simulador de Wearable (`Backend SIAT/scripts/wearable_simulator.js`):**
   - Parametrizar el ID del niño por consola (`node wearable_simulator.js NxEWoE5KoR`) para que las simulaciones apunten directamente al niño que se esté probando.
2. **Cierre Automático de Sesión Wearable:**
   - Si se desea que cada conexión de smartwatch genere una sesión clínica en la tabla `tr_sesio`, enlazar el botón de inicio de telemetría con `POST /api/sesiones/iniciar` y el cierre con `PUT /api/sesiones/:id/cerrar`.
