import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // Apuntamos a nuestro nuevo backend
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar el JWT en cada peticion
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

// Interceptor para atrapar tokens expirados o inválidos (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // El token es inválido o expiró
      localStorage.clear();
      // Si estamos en el navegador, forzamos la redirección
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
