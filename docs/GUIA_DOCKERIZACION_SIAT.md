# 📘 Tutorial Completo: Guía de Dockerización de Proyectos Fullstack (React PWA + Node.js + Prisma + Nginx)

Este tutorial sirve como referencia práctica para dockerizar cualquier arquitectura web moderna compuesta por un **Frontend SPA/PWA (React + Vite)** y un **Backend API (Node.js + Express + Prisma ORM)**.

---

## 📂 1. Estructura de Archivos Recomendada

Para un proyecto fullstack con frontend y backend en carpetas separadas:

```text
mi-proyecto/
├── docker-compose.yml              <-- Orquestador global
├── frontend/                       <-- Aplicación React + Vite
│   ├── Dockerfile                  <-- Construcción Multi-etapa + Nginx
│   ├── nginx.conf                  <-- Servidor web de producción
│   ├── .dockerignore
│   ├── package.json
│   └── vite.config.js
└── backend/                        <-- API Node.js Express
    ├── Dockerfile                  <-- Entorno Node.js + Prisma
    ├── .dockerignore
    ├── package.json
    └── prisma/
        └── schema.prisma
```

---

## ⚛️ 2. Paso 1: Dockerizar el Frontend (React + Vite PWA + Nginx)

El frontend utiliza una **construcción multi-etapa (Multi-Stage Build)**. La primera etapa compila el código JS/PWA y la segunda etapa utiliza **Nginx** (un servidor web ultraligero y rápido) para servir la app en producción.

### A. Archivo `frontend/Dockerfile`

```dockerfile
# Etapa 1: Compilación de producción con Node.js
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar paquetes e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el código fuente y compilar la PWA/dist
COPY . .
RUN npm run build

# Etapa 2: Servidor de producción ligero con Nginx
FROM nginx:alpine AS runner

# Copiar la configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar los archivos compilados en la Etapa 1 a Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### B. Archivo `frontend/nginx.conf`

> ⚠️ **Importante para React Router**: El bloque `try_files $uri $uri/ /index.html;` es fundamental para evitar errores 404 al recargar pantallas internas de la aplicación.

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Compresión Gzip para acelerar la carga de la PWA
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 256;

    # Redirección de rutas SPA (React Router)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Desactivar caché para el Service Worker (Permite actualizaciones instantáneas de PWA)
    location /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires 0;
    }

    # Caché estática prolongada para imágenes y bundles JS/CSS
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

### C. Archivo `frontend/.dockerignore`

```dockerignore
node_modules
dist
.git
.gitignore
.env
.env.local
npm-debug.log*
```

---

## 🟢 3. Paso 2: Dockerizar el Backend (Node.js + Express + Prisma ORM)

El backend requiere soporte para los motores compilados en C++ de **Prisma ORM**.

### A. Archivo `backend/Dockerfile`

> 💡 **Tip**: Usar `node:20-slim` e instalar `openssl ca-certificates` con `apt-get` evita errores de compatibilidad con las librerías binarias `.so` de Prisma en Linux.

```dockerfile
FROM node:20-slim

# Instalar OpenSSL requerido por el Query Engine de Prisma
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar manifiestos y la carpeta prisma ANTES de 'npm install'
# (Esto asegura que el script postinstall 'prisma generate' encuentre el schema.prisma)
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Copiar el código fuente del backend
COPY . .

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "index.js"]
```

### B. Archivo `backend/.dockerignore`

```dockerignore
node_modules
coverage
.git
.gitignore
.env
.env.local
npm-debug.log*
```

---

## 🐙 4. Paso 3: Orquestar con Docker Compose

El archivo `docker-compose.yml` une ambos contenedores en una misma red virtual (`siat-network`) y mapea los puertos para acceso local o servidor.

### Archivo `docker-compose.yml`

```yaml
services:
  # Servicio de API Backend
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: mi-proyecto-backend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - DATABASE_URL=postgresql://usuario:password@host_base_datos:5432/nombre_bd?sslmode=require
      - JWT_SECRET=tu_clave_secreta_jwt
    networks:
      - mi-red-network

  # Servicio de Frontend PWA
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: mi-proyecto-frontend
    restart: always
    ports:
      - "8080:80"   # Mapea el puerto 80 del contenedor Nginx al 8080 de tu PC/servidor
    depends_on:
      - backend
    networks:
      - mi-red-network

networks:
  mi-red-network:
    driver: bridge
```

---

## 💻 5. Comandos Frecuentes para Operar Docker

| Acción | Comando Terminal |
| :--- | :--- |
| **Construir las imágenes** | `docker compose build` |
| **Levantar todo en segundo plano** | `docker compose up -d` |
| **Ver estado de los contenedores** | `docker compose ps` |
| **Ver logs en tiempo real** | `docker compose logs -f` |
| **Ver logs de un servicio específico** | `docker compose logs -f backend` |
| **Detener todos los servicios** | `docker compose down` |
| **Reconstruir 1 solo servicio** | `docker compose build backend && docker compose up -d backend` |

---

## 🛠️ 6. Problemas Comunes y Soluciones (Gotchas)

### ❓ Problema 1: `Prisma schema not found` durante `npm install` en Docker
* **Causa**: Prisma ejecuta `prisma generate` de forma automática en el gancho `postinstall` de `npm install`. Si en el Dockerfile solo copiaste `package.json`, la carpeta `prisma/` aún no existe.
* **Solución**: Asegúrate de poner `COPY prisma ./prisma/` **antes** de la línea `RUN npm install`.

### ❓ Problema 2: Error `libssl.so.1.1: No such file or directory` con Prisma
* **Causa**: Las imágenes Alpine o Slim muy reducidas no vienen con las librerías compartidas de OpenSSL que Prisma usa para conectarse a PostgreSQL.
* **Solución**: Usar `node:20-slim` e instalar OpenSSL vía `apt-get install -y openssl ca-certificates`.

### ❓ Problema 3: Error 404 al recargar pantallas en React Router
* **Causa**: Nginx intenta buscar un archivo físico para rutas dinámicas de React (como `/pacientes/123`).
* **Solución**: En el `nginx.conf`, configurar `try_files $uri $uri/ /index.html;` para que Nginx siempre devuelva `index.html` y deje a React Router manejar la vista.

### ❓ Problema 4: `Workbox maximumFileSizeToCacheInBytes` al compilar PWA con Vite
* **Causa**: El bundle JavaScript principal excede el límite por defecto de Workbox (2 MB).
* **Solución**: En `vite.config.js`, agregar `workbox: { maximumFileSizeToCacheInBytes: 5 * 1024 * 1024 }`.
Iniciar Docker docker compose -f ..\docker-compose.yml up -d