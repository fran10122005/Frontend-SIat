import axios from "axios";
import { getErrorMessage } from "../utils/errorHandler";

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

function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userName");
  localStorage.removeItem("currentView");
}

function showGlobalToast(message) {
  window.dispatchEvent(
    new CustomEvent("global-toast", { detail: { message } }),
  );
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
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

    // Mensaje amigable resuelto una sola vez; los componentes pueden leerlo
    // desde err.userMessage para no volver a calcular el texto.
    error.userMessage = getErrorMessage(error);

    // Reintento con backoff para errores de red y 5xx transitorios (ej. Render "dormido")
    if (
      (isNetworkError || retriableStatus(error.response?.status)) &&
      (config._retry || 0) < MAX_RETRIES
    ) {
      config._retry = (config._retry || 0) + 1;
      const delay = 1000 * config._retry;
      await sleep(delay);
      return api.request(config);
    }

    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      clearAuth();
      showGlobalToast("⏱️ Sesión expirada. Redirigiendo al inicio...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
      return Promise.reject(error);
    }
    // Solo notificamos aquí errores de nivel de aplicación (no validaciones
    // de formulario, que cada vista maneja con su propio contexto).
    if (error.response?.status === 403) {
      showGlobalToast(
        "⛔ Acceso denegado. No tienes permisos para esta acción.",
      );
      console.warn("Acceso denegado por RBAC");
    }
    if (error.response?.status >= 500) {
      showGlobalToast(`⚠️ ${error.userMessage}`);
    }
    if (!error.response && !error.code?.startsWith("ERR_CANCELED")) {
      showGlobalToast(`🔌 ${error.userMessage}`);
    }
    return Promise.reject(error);
  },
);

export default api;
