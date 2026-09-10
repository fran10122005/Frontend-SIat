# 🔄 Protocolo de Rollback para la PWA de SIAT

Este documento detalla el procedimiento operativo estándar (SOP) para ejecutar un **rollback de emergencia** en caso de desplegar una versión de la PWA con un error crítico en producción.

---

## 🎯 1. Entendiendo el Ciclo de Vida del Service Worker en SIAT

La PWA de SIAT utiliza `vite-plugin-pwa` con Workbox en modo `autoUpdate`:

1. **Detección:** Cuando se despliega un nuevo build, el navegador descarga el nuevo archivo `sw.js` (cuyo header HTTP en Nginx es `Cache-Control: "no-cache, no-store, must-revalidate"`).
2. **Instalación en Segundo Plano:** El nuevo Service Worker descarga y almacena en caché los nuevos assets (`workbox-*.js`, `.js`, `.css`).
3. **Activación (`skipWaiting`):** Al finalizar la descarga, el nuevo Service Worker toma el control de los clientes activos y reemplaza la versión anterior.

---

## 🚨 2. Procedimiento de Rollback Paso a Paso

### Escenario A: Rollback Rápido por Re-Despliegue del Build Anterior (Recomendado)

1. **Revertir el commit o checkout al tag estable:**
   ```bash
   git checkout tags/v1.0.0 # o el commit del release estable anterior
   ```

2. **Reconstruir la aplicación:**
   ```bash
   npm run build
   ```
   *Esto generará un nuevo hash de compilación en `sw.js` y `workbox-*.js` que restaurará los assets sanos.*

3. **Subir a Producción / Recrear Contenedor Docker:**
   ```bash
   # Si usas Docker Compose:
   docker compose up -d --build frontend
   ```

4. **Resultado en los clientes:** En la próxima navegación o recarga, el navegador detectará el cambio de bytes en `sw.js`, descargará el bundle sano anterior y purgará los assets con error.

---

### Escenario B: Purgar Forzadamente Cachés de Clientes desde Código (Bypass de Emergencia)

Si un bug crítico rompe la inicialización de JavaScript y el Service Worker queda en un estado corrupto que impide la recarga normal, se puede activar la purga programática en `src/main.jsx`:

```javascript
// Protocolo de Purga de Emergencia (Descomentar sólo si hay bloqueo de SW)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister();
    }
  });
  caches.keys().then((keys) => {
    keys.forEach((key) => caches.delete(key));
  });
}
```

---

## 📱 3. Instrucciones de Recuperación para Usuarios Finales

Si un terapeuta o representante reporta que su dispositivo móvil sigue mostrando una pantalla congelada:

### En Android / Chrome:
1. Abrir la App SIAT.
2. Ir a **Ajustes de Chrome** (o del teléfono) > **Aplicaciones** > **SIAT**.
3. Seleccionar **Almacenamiento** > **Borrar Caché** (NO es necesario borrar datos de usuario).
4. Reabrir la aplicación.

### En iPhone / iPad (Safari PWA):
1. Cerrar la app desde el multitarea de iOS (deslizar hacia arriba).
2. Ir a **Configuración** > **Safari** > **Avanzado** > **Datos de sitios web**.
3. Buscar `siat` y presionar **Eliminar**.
4. Reabrir la aplicación desde la pantalla de inicio.

---

## 🛡️ 4. Lista de Verificación Post-Rollback

- [ ] Verificar que `https://tudominio.com/sw.js` responda con código HTTP `200` y cabeceras `no-cache`.
- [ ] Validar en DevTools (pestaña *Application* > *Service Workers*) que el estado sea `activated and is running`.
- [ ] Comprobar que las peticiones a la API `/api/*` respondan correctamente sin interceptaciones erróneas de caché.
- [ ] Notificar al equipo clínico sobre el restablecimiento de la versión estable.
