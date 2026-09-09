# 🐳 Manual de Comandos Docker para SIAT (Frontend & Fullstack)

Este documento es una guía práctica y de referencia rápida para gestionar de forma autónoma los contenedores de Docker del proyecto SIAT.

---

## 📌 1. Comandos Esenciales de Control

| Acción | Comando PowerShell | Descripción |
| :--- | :--- | :--- |
| **Ver contenedores activos** | `docker ps` | Muestra contenedores en ejecución, puertos y nombres. |
| **Ver todos los contenedores** | `docker ps -a` | Muestra todos los contenedores (activos y apagados). |
| **Detener contenedor** | `docker stop siat-frontend-pwa` | Apaga el contenedor de forma segura. |
| **Iniciar contenedor apagado** | `docker start siat-frontend-pwa` | Vuelve a encender el contenedor existente. |
| **Reiniciar contenedor** | `docker restart siat-frontend-pwa` | Reinicia el servicio rápidamente. |
| **Pausar (Congelar)** | `docker pause siat-frontend-pwa` | Congela los procesos sin apagar el contenedor. |
| **Despausar (Reactivar)** | `docker unpause siat-frontend-pwa` | Descongela el contenedor pausado. |
| **Eliminar contenedor** | `docker rm siat-frontend-pwa` | Elimina el contenedor (debe estar detenido antes). |
| **Forzar eliminación** | `docker rm -f siat-frontend-pwa` | Detiene y elimina el contenedor en un solo paso. |

---

## 🔄 2. Flujo de Trabajo: ¿Cómo actualizar Docker tras hacer cambios de código?

Cuando modifiques código en React/Vite y quieras ver los cambios reflejados en tu contenedor Docker de producción, sigue estos 3 pasos:

### Opción A: Paso a Paso
```powershell
# 1. Situarse en la carpeta del frontend (SIAT)
# 2. Compilar la nueva imagen de Docker
docker build -t diseno-frontend .

# 3. Detener y eliminar el contenedor anterior
docker stop siat-frontend-pwa
docker rm siat-frontend-pwa

# 4. Lanzar el nuevo contenedor con la imagen actualizada
docker run -d --name siat-frontend-pwa -p 8080:80 diseno-frontend
```

### Opción B: Comando "Todo en Uno" (Recomendado)
Puedes copiar y pegar esta única línea en tu terminal PowerShell para hacer todo el proceso automáticamente:

```powershell
docker build -t diseno-frontend . ; docker stop siat-frontend-pwa ; docker rm siat-frontend-pwa ; docker run -d --name siat-frontend-pwa -p 8080:80 diseno-frontend
```

---

## 🔍 3. Monitoreo y Diagnóstico

### Ver Registros / Logs en Vivo
Si la aplicación no carga o quieres ver las peticiones que llegan al servidor Nginx:
```powershell
# Ver logs en tiempo real (Ctrl + C para salir)
docker logs -f siat-frontend-pwa

# Ver sólo las últimas 50 líneas
docker logs --tail 50 siat-frontend-pwa
```

### Ver Consumo de Recursos (CPU / Memoria RAM)
```powershell
docker stats siat-frontend-pwa
```

### Entrar a la Terminal interna del Contenedor
Si necesitas inspeccionar los archivos dentro del contenedor Nginx:
```powershell
docker exec -it siat-frontend-pwa sh
```
*(Para salir, escribe `exit`).*

---

## 🧹 4. Mantenimiento y Limpieza de Disco

Con el tiempo, Docker acumula imágenes antiguas y capas no utilizadas:

```powershell
# Eliminar imágenes intermedias o sin nombre (<none>)
docker image prune -f

# Limpieza general profunda (contenedores apagados, redes y caché)
docker system prune -f
```

---

## 🌐 5. Resumen de Puertos y Accesos

- **Entorno Docker de Producción (Nginx + PWA):** [http://localhost:8080](http://localhost:8080)
- **Entorno Local de Desarrollo (Vite HMR):** [http://localhost:5173](http://localhost:5173)

---

## 💡 6. Preguntas Frecuentes y Solución de Problemas

#### ❓ ¿Qué hacer si dice `port is already allocated` al iniciar?
Significa que el puerto `8080` ya está siendo usado por otro proceso o contenedor anterior.
1. Ejecuta `docker ps` para ver qué contenedor usa el puerto.
2. Elimínalo con `docker rm -f <nombre_o_id_del_contenedor>`.
3. O cambia el puerto externo: `docker run -d --name siat-frontend-pwa -p 8085:80 diseno-frontend` (abriría en el puerto 8085).

#### ❓ ¿Por qué no veo mis cambios de inmediato en Docker?
A diferencia de `npm run dev` que usa Vite con recarga en caliente en vivo, Docker construye un paquete de producción optimizado dentro de Nginx. Por ello, **siempre debes recompilar la imagen** (`docker build -t diseno-frontend .`) tras hacer cambios en el código.
