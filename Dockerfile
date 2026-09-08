# Etapa 1: Build de la PWA React con Node.js 20
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm install

# Copiar código fuente y compilar producción PWA
COPY . .
RUN npm run build

# Etapa 2: Servidor web de producción ligero con Nginx
FROM nginx:alpine AS runner

# Copiar configuración personalizada de Nginx para SPA y PWA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar bundle de distribución compilado
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
