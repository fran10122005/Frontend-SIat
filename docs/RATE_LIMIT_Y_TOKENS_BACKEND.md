# 🛡️ Guía de Arquitectura e Implementación de Rate Limiting y Tokens para el Backend (`siat-backend`)

Este documento describe la especificación y recomendaciones de implementación en el backend Node.js / Express (`siat-backend`) para proteger la API contra ataques de fuerza bruta, saturación (DDoS / flooding) y garantizar el ciclo de vida seguro de los tokens JWT.

---

## 1. Implementación de Rate Limiting en Express

Se recomienda utilizar el paquete estándar `express-rate-limit`.

### A. Instalación en el Backend
```bash
npm install express-rate-limit
```

### B. Configuración de Middlewares Específicos por Ruta

Crea un archivo `src/middlewares/rateLimiter.js` en tu backend:

```javascript
import rateLimit from "express-rate-limit";

/**
 * 1. Rate Limiter General para toda la API
 * Permite hasta 150 peticiones por ventana de 1 minuto por IP.
 */
export const generalApiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 150, // Límite de solicitudes por IP
  standardHeaders: true, // Devuelve cabeceras estándar RateLimit-*
  legacyHeaders: false, // Deshabilita cabeceras X-RateLimit-* antiguas
  message: {
    success: false,
    error: {
      message: "Demasiadas solicitudes desde esta IP. Por favor espera un momento.",
      retryAfter: 60,
    },
  },
  statusCode: 429,
});

/**
 * 2. Rate Limiter Estricto para Autenticación (Login, Registro, Recuperación)
 * Previene ataques de fuerza bruta en contraseñas o intentos de adivinanza.
 * Permite 5 intentos fallidos cada 15 minutos por IP.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Si el login fue exitoso, no consume cuota
  message: {
    success: false,
    error: {
      message: "Has superado el límite de intentos de acceso. Por seguridad, espera 15 minutos.",
      retryAfter: 900,
    },
  },
  statusCode: 429,
});

/**
 * 3. Rate Limiter para Ingesta de Telemetría / Sensores Smartwatch
 * Diseñado para paquetes periódicos de datos de hardware.
 */
export const telemetryLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 300, // Permite tráfico continuo de alta frecuencia
  standardHeaders: true,
  legacyHeaders: false,
});
```

### C. Aplicación en las Rutas de Express

En `src/app.js` o `src/routes/index.js`:

```javascript
import express from "express";
import { generalApiLimiter, authLimiter } from "./middlewares/rateLimiter.js";
import authRoutes from "./routes/auth.routes.js";
import apiRoutes from "./routes/api.routes.js";

const app = express();

// Si está detrás de un Reverse Proxy (Nginx / Render / Cloudflare / Docker):
app.set("trust proxy", 1);

// Aplicar a rutas de autenticación
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

// Aplicar limiter general al resto de la API
app.use("/api", generalApiLimiter);
```

---

## 2. Buenas Prácticas en la Emisión de Tokens JWT

1. **Tiempo de Expiración (`expiresIn`)**:
   - Para sesiones clínicas o de especialistas: `8h` o `12h`.
   - Para tokens de reseteo de contraseña o invitación: `15m` o `1h`.
   ```javascript
   const token = jwt.sign(
     { id: user.usu_codi, rol: user.rol_codi, email: user.usu_crro },
     process.env.JWT_SECRET,
     { expiresIn: "8h" }
   );
   ```

2. **Cabecera `Retry-After` en respuestas 429**:
   - `express-rate-limit` inyecta automáticamente el encabezado estándar `Retry-After: <segundos>` en las respuestas HTTP 429.
   - El cliente Frontend de SIAT lee este encabezado de forma transparente y le muestra al usuario la cuenta regresiva en segundos.

---

## 3. Comportamiento Integrado Frontend ↔ Backend

```
Cliente SIAT (Frontend)                     Servidor Express (Backend)
        |                                                |
        |--- Petición API con Bearer Token ------------> |
        |                                                | (Verifica rate limit de IP/Token)
        |<-- HTTP 429 Too Many Requests -----------------| (Incluye Retry-After: 30)
        |                                                |
 (Frontend muestra Toast:                                |
  "⏳ Espera 30s...")                                    |
```
