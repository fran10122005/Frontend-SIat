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

const toastHistory = new Map();
function showGlobalToast(message) {
  if (typeof window === "undefined" || !message) return;
  const now = Date.now();
  const lastTime = toastHistory.get(message) || 0;
  if (now - lastTime < 5000) return; // Deduplicar mismo mensaje dentro de 5s

  if (message.includes("No se pudo conectar") || message.includes("🔌")) {
    const lastNet = toastHistory.get("__network_toast__") || 0;
    if (now - lastNet < 6000) return; // Máximo 1 toast de red cada 6s
    toastHistory.set("__network_toast__", now);
  }

  toastHistory.set(message, now);
  window.dispatchEvent(
    new CustomEvent("global-toast", { detail: { message } }),
  );
}

let consecutiveNetworkFailures = 0;
let lastOnlineDispatch = 0;
let lastOfflineDispatch = 0;

export function resetNetworkFailureCount() {
  consecutiveNetworkFailures = 0;
}

function dispatchOnlineEvent() {
  if (typeof window !== "undefined") {
    consecutiveNetworkFailures = 0;
    const now = Date.now();
    if (now - lastOnlineDispatch > 2500) {
      lastOnlineDispatch = now;
      window.dispatchEvent(new CustomEvent("siat:online"));
    }
  }
}

function dispatchOfflineEvent(reason) {
  if (typeof window !== "undefined") {
    const now = Date.now();
    if (now - lastOfflineDispatch > 4000) {
      lastOfflineDispatch = now;
      window.dispatchEvent(
        new CustomEvent("siat:offline", { detail: { reason } }),
      );
    }
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
  (response) => {
    // Si la petición tuvo éxito (2xx), confirmamos conectividad activa
    dispatchOnlineEvent();
    return response;
  },
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
      error._toastShown = true;
      // No reintentar automáticamente en caso de 429 para no saturar al servidor
      return Promise.reject(error);
    }

    // Reintento con backoff para errores de red y 5xx transitorios (ej. Render "dormido")
    if (
      !config._skipRetry &&
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
      error._toastShown = true;
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
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
      error._toastShown = true;
      console.warn("Acceso denegado por RBAC");
    }
    if (status >= 500) {
      showGlobalToast(`⚠️ ${error.userMessage}`);
      error._toastShown = true;
    }
    if (!error.response && !error.code?.startsWith("ERR_CANCELED")) {
      const isDeviceOffline =
        typeof navigator !== "undefined" && !navigator.onLine;

      if (isDeviceOffline) {
        consecutiveNetworkFailures = 0;
        dispatchOfflineEvent("offline_network");
        if (!config._skipNetworkInterceptor) {
          showGlobalToast(`🔌 ${error.userMessage}`);
          error._toastShown = true;
        }
      } else if (!config._skipOfflineDispatch) {
        consecutiveNetworkFailures++;
        // Anti-flapping: Requiere al menos 2 fallos consecutivos antes de
        // activar el modo offline del servidor, evitando falsos positivos por latencia o micro-cortes.
        if (consecutiveNetworkFailures >= 2) {
          dispatchOfflineEvent("offline_server");
          if (!config._skipNetworkInterceptor) {
            showGlobalToast(`🔌 ${error.userMessage}`);
            error._toastShown = true;
          }
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
