import axios from 'axios';

const rawBase = import.meta.env.VITE_API_URL || 'https://backend-siat.onrender.com/api';
const API_BASE = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`;

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 45000,
});

function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('currentView');
}

function showGlobalToast(message) {
  window.dispatchEvent(new CustomEvent('global-toast', { detail: { message } }));
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isRedirecting) {
      isRedirecting = true;
      clearAuth();
      showGlobalToast('⏱️ Sesión expirada. Redirigiendo al inicio...');
      setTimeout(() => { window.location.href = '/login'; }, 2000);
      return Promise.reject(error);
    }
    if (error.response?.status === 403) {
      showGlobalToast('⛔ Acceso denegado. No tienes permisos para esta acción.');
      console.warn('Acceso denegado por RBAC');
    }
    if (error.response?.status >= 500) {
      showGlobalToast('⚠️ Error del servidor. Intenta de nuevo más tarde.');
    }
    if (!error.response) {
      showGlobalToast('🔌 Error de conexión. Verifica tu red.');
    }
    return Promise.reject(error);
  }
);

export default api;
