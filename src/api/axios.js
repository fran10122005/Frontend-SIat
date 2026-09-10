import axios from "axios";
import { getErrorMessage } from "../utils/errorHandler";
import {
  getAuthToken,
  clearAuthSession,
  isTokenExpired,
} from "../utils/authStorage";

const rawBase =
  import.meta.env.VITE_API_URL || "https://backend-siat.onrender.com/api";
const API_BASE = rawBase.endsWith("/api")
  ? rawBase
  : `${rawBase.replace(/\/+$/, "")}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 45000,
});

function showGlobalToast(message) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("global-toast", { detail: { message } }),
    );
  }
}

// Extrae el tiempo de espera en segundos del encabezado Retry-After si existe
function parseRetryAfter(headers) {
  if (!headers) return null;
  const retryVal = headers["retry-after"] || headers["Retry-After"];
  if (!retryVal) return null;

  const numeric = Number(retryVal);
  if (!isNaN(numeric) && numeric > 0) {
    return numeric;
  }

  const dateMs = Date.parse(retryVal);
  if (!isNaN(dateMs)) {
    const diffSec = Math.ceil((dateMs - Date.now()) / 1000);
    return diffSec > 0 ? diffSec : 1;
  }

  return null;
}

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      // Verificación proactiva de token: si ya expiró, no enviamos la petición con credencial caduca
      const isAuthEndpoint = /\/auth\//.test(config.url || "");
      if (!isAuthEndpoint && isTokenExpired(token, 0)) {
        console.warn(
          "Token JWT expirado en cliente antes de enviar la petición.",
        );
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRedirecting = false;
const MAX_RETRIES = 2;

const retriableStatus = (status) =>
  status === 502 || status === 503 || status === 504;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {};
    const isNetworkError = !error.response;
    const status = error.response?.status;

    // Mensaje amigable resuelto una sola vez; los componentes pueden leerlo
    // desde err.userMessage para no volver a calcular el texto.
    error.userMessage = getErrorMessage(error);

    // Manejo específico de HTTP 429 (Rate Limit / Demasiadas solicitudes)
    if (status === 429) {
      const retrySeconds = parseRetryAfter(error.response?.headers);
      const limitMessage = retrySeconds
        ? `⏳ Demasiados intentos. Por favor espera ${Math.ceil(retrySeconds / 60)} min antes de reintentar.`
        : "⏳ Demasiados intentos. Por motivos de seguridad, espera 15 minutos antes de reintentar.";

      error.userMessage = limitMessage;
      showGlobalToast(limitMessage);
      // No reintentar automáticamente en caso de 429 para no saturar al servidor
      return Promise.reject(error);
    }

    // Reintento con backoff para errores de red y 5xx transitorios (ej. Render "dormido")
    if (
      (isNetworkError || retriableStatus(status)) &&
      (config._retry || 0) < MAX_RETRIES
    ) {
      config._retry = (config._retry || 0) + 1;
      const delay = 1000 * config._retry;
      await sleep(delay);
      return api.request(config);
    }

    const requestUrl = config.url || "";
    const isAuthEndpoint =
      /\/auth\/login$/.test(requestUrl) || requestUrl.includes("/auth/login");

    // Un 401 del login significa "credenciales inválidas", no sesión expirada.
    // No redirigir ni tocar el estado: el componente Login muestra el error.
    if (status === 401 && !isAuthEndpoint && !isRedirecting) {
      isRedirecting = true;
      clearAuthSession();
      showGlobalToast("⏱️ Sesión expirada. Redirigiendo al inicio...");
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }, 1800);
      return Promise.reject(error);
    }

    // Solo notificamos aquí errores de nivel de aplicación (no validaciones
    // de formulario, que cada vista maneja con su propio contexto).
    if (status === 403) {
      showGlobalToast(
        "⛔ Acceso denegado. No tienes permisos para esta acción.",
      );
      console.warn("Acceso denegado por RBAC");
    }
    if (status >= 500) {
      showGlobalToast(`⚠️ ${error.userMessage}`);
    }
    if (!error.response && !error.code?.startsWith("ERR_CANCELED")) {
      showGlobalToast(`🔌 ${error.userMessage}`);
    }
    return Promise.reject(error);
  },
);

export default api;
