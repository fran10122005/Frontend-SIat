# 🐳 Manual de Comandos Docker para SIAT (Frontend & Backend)

Este documento es una guía práctica y de referencia rápida para gestionar de forma autónoma los contenedores de Docker del proyecto SIAT (**Frontend PWA** y **Backend API**).

---

## 📌 1. Nombres y Puertos de los Contenedores

| Servicio | Nombre del Contenedor | Imagen | Puerto Local / Host | Puerto Interno |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend (PWA / Nginx)** | `siat-frontend-pwa` | `diseno-frontend` | `http://localhost:8080` | `80` |
| **Backend (API / Node/Express)** | `siat-backend` | `diseno-backend` | `http://localhost:3000` | `3000` |

---

## ⚡ 2. Comandos Esenciales de Control

> [!NOTE]
> El comando `docker start` requiere obligatoriamente el **nombre** o **ID** del contenedor que deseas iniciar (por ejemplo: `docker start siat-backend`). También puedes pasar múltiples nombres separados por un espacio para encender ambos a la vez.

### Tabla de Comandos Rápidos

| Acción | Frontend (`siat-frontend-pwa`) | Backend (`siat-backend`) | Ambos a la vez |
| :--- | :--- | :--- | :--- |
| **Ver estado actual** | `docker ps` *(o `docker ps -a` para ver los apagados)* | | |
| **Iniciar contenedor** | `docker start siat-frontend-pwa` | `docker start siat-backend` | `docker start siat-frontend-pwa siat-backend` |
| **Detener contenedor** | `docker stop siat-frontend-pwa` | `docker stop siat-backend` | `docker stop siat-frontend-pwa siat-backend` |
| **Reiniciar contenedor** | `docker restart siat-frontend-pwa` | `docker restart siat-backend` | `docker restart siat-frontend-pwa siat-backend` |
| **Pausar (Congelar)** | `docker pause siat-frontend-pwa` | `docker pause siat-backend` | `docker pause siat-frontend-pwa siat-backend` |
| **Despausar (Reactivar)** | `docker unpause siat-frontend-pwa` | `docker unpause siat-backend` | `docker unpause siat-frontend-pwa siat-backend` |
| **Ver Logs en vivo** | `docker logs -f siat-frontend-pwa` | `docker logs -f siat-backend` | *(ver uno por terminal)* |
| **Eliminar contenedor** | `docker rm -f siat-frontend-pwa` | `docker rm -f siat-backend` | `docker rm -f siat-frontend-pwa siat-backend` |

---

## 🔄 3. Flujo de Recompilación tras Cambios de Código

### A. Si modificaste el Frontend (React / Vite)
```powershell
# Compilar imagen y recrear contenedor
docker build -t diseno-frontend . ; docker stop siat-frontend-pwa ; docker rm siat-frontend-pwa ; docker run -d --name siat-frontend-pwa -p 8080:80 diseno-frontend
```

### B. Si modificaste el Backend (Node.js / Express)
*(Ejecutar desde la carpeta raíz del backend)*
```powershell
# Compilar imagen y recrear contenedor
docker build -t diseno-backend . ; docker stop siat-backend ; docker rm siat-backend ; docker run -d --name siat-backend -p 3000:3000 diseno-backend
```

---

## 🔍 4. Monitoreo y Diagnóstico

### Ver Registros / Logs en Vivo
```powershell
# Ver logs del Backend en tiempo real (Ctrl + C para salir)
docker logs -f siat-backend

# Ver logs del Frontend en tiempo real
docker logs -f siat-frontend-pwa

# Ver sólo las últimas 50 líneas
docker logs --tail 50 siat-backend
```

### Ver Consumo de Recursos (CPU / Memoria RAM de todos los contenedores)
```powershell
docker stats
```

### Entrar a la Terminal interna del Contenedor
```powershell
# Entrar al backend
docker exec -it siat-backend sh

# Entrar al frontend (Nginx)
docker exec -it siat-frontend-pwa sh
```
*(Para salir de la consola interna, escribe `exit`).*

---

## 🧹 5. Mantenimiento y Limpieza de Disco

Con el tiempo, Docker acumula imágenes antiguas y capas no utilizadas:

```powershell
# Eliminar imágenes intermedias o sin nombre (<none>)
docker image prune -f

# Limpieza general profunda (contenedores apagados, redes y caché)
docker system prune -f
```

---

## 🌐 6. Resumen de Puertos y Accesos

- **Frontend en Docker:** [http://localhost:8080](http://localhost:8080)
- **Backend API en Docker:** [http://localhost:3000](http://localhost:3000)
- **Frontend en Desarrollo Local (Vite):** [http://localhost:5173](http://localhost:5173)

---

## 💡 7. Preguntas Frecuentes y Solución de Problemas

#### ❓ ¿Por qué `docker start` me dio error de argumento?
Porque Docker necesita saber qué contenedor encender. Debes especificar el nombre:
```powershell
docker start siat-backend
# o ambos:
docker start siat-frontend-pwa siat-backend
```

#### ❓ ¿Qué hacer si dice `port is already allocated` al iniciar?
Significa que el puerto (`3000` o `8080`) ya está siendo usado por otro proceso o contenedor.
1. Ejecuta `docker ps` para ver qué contenedor usa el puerto.
2. Elimínalo con `docker rm -f siat-backend` (o el nombre correspondiente).
3. Vuelve a ejecutar el comando `docker run`.
