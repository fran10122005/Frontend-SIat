// Módulo centralizado para la gestión segura de tokens, sesión de usuario
// y persistencia de estado esencial (ej. niño seleccionado) en SIAT.

const AUTH_KEYS = {
  TOKEN: "token",
  REFRESH_TOKEN: "refreshToken",
  USER_ROLE: "userRole",
  USER_NAME: "userName",
  CURRENT_VIEW: "currentView",
  SELECTED_CHILD_ID: "siat_selected_child_id",
  SELECTED_CHILD_NAME: "siat_selected_child_name",
};

/**
 * Decodifica de forma segura la carga útil (payload) de un JSON Web Token (JWT)
 * sin requerir librerías externas.
 * @param {string} token
 * @returns {object|null} Payload decodificado o null si el token es inválido
 */
export function parseJwt(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const atobFn =
      typeof globalThis !== "undefined" && globalThis.atob
        ? globalThis.atob.bind(globalThis)
        : (str) =>
            typeof globalThis !== "undefined" && globalThis.Buffer
              ? globalThis.Buffer.from(str, "base64").toString("binary")
              : str;
    const jsonPayload = decodeURIComponent(
      atobFn(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.warn("No se pudo decodificar el payload del token JWT:", e);
    return null;
  }
}

/**
 * Verifica si un token JWT ha expirado o está por expirar dentro de una ventana de gracia.
 * @param {string} token
 * @param {number} gracePeriodSeconds Margen de seguridad en segundos (por defecto 10s)
 * @returns {boolean} true si está expirado o no es válido
 */
export function isTokenExpired(token, gracePeriodSeconds = 10) {
  if (!token) return true;
  const decoded = parseJwt(token);
  if (!decoded || typeof decoded.exp !== "number") return false;

  const now = Math.floor(Date.now() / 1000);
  return decoded.exp <= now + gracePeriodSeconds;
}

/**
 * Obtiene el token JWT actual almacenado.
 * @returns {string|null}
 */
export function getAuthToken() {
  try {
    return localStorage.getItem(AUTH_KEYS.TOKEN);
  } catch {
    return null;
  }
}

/**
 * Normaliza cualquier formato de rol (ej: ROL_ADM, ROL_ESP, ROL_REP)
 * a las constantes estándar de la aplicación.
 * @param {string|null} rawRole
 * @returns {string|null}
 */
export function normalizeRole(rawRole) {
  if (!rawRole || typeof rawRole !== "string") return null;
  const trimmed = rawRole.trim();
  if (trimmed === "ROL_ADM" || trimmed === "ADMIN_INSTITUCION")
    return "ADMIN_INSTITUCION";
  if (trimmed === "ROL_ESP" || trimmed === "ESPECIALISTA")
    return "ESPECIALISTA";
  if (trimmed === "ROL_REP" || trimmed === "REPRESENTANTE")
    return "REPRESENTANTE";
  return trimmed;
}

/**
 * Valida criptográficamente y verifica la sesión actual almacenada.
 * Comprueba:
 * 1. Existencia del token.
 * 2. Que el token no esté expirado.
 * 3. Que el payload del JWT sea válido y contenga un rol reconocido.
 * Si la sesión no es válida, limpia los restos de localStorage de forma preventiva.
 * @returns {{ isValid: boolean, token: string|null, role: string|null, decoded: object|null }}
 */
export function getValidSession() {
  const token = getAuthToken();
  if (!token || isTokenExpired(token, 0)) {
    if (token) clearAuthSession();
    return { isValid: false, token: null, role: null, decoded: null };
  }

  const decoded = parseJwt(token);
  if (!decoded) {
    clearAuthSession();
    return { isValid: false, token: null, role: null, decoded: null };
  }

  const tokenRole = normalizeRole(decoded.rol_codi);
  const localRole = normalizeRole(
    typeof localStorage !== "undefined"
      ? localStorage.getItem(AUTH_KEYS.USER_ROLE)
      : null,
  );
  const role = tokenRole || localRole;

  if (!role) {
    clearAuthSession();
    return { isValid: false, token: null, role: null, decoded: null };
  }

  try {
    if (typeof localStorage !== "undefined") {
      if (localStorage.getItem(AUTH_KEYS.USER_ROLE) !== role) {
        localStorage.setItem(AUTH_KEYS.USER_ROLE, role);
      }
    }
  } catch {}

  return { isValid: true, token, role, decoded };
}

/**
 * Establece la sesión del usuario de forma atómica en localStorage.
 * @param {object} params
 * @param {string} params.token - JWT principal
 * @param {string} [params.refreshToken] - Token de refresco opcional
 * @param {object} [params.user] - Datos del usuario
 * @param {string} [params.userRole] - Rol normalizado del usuario
 * @param {string} [params.userName] - Nombre a mostrar
 */
export function setAuthSession({
  token,
  refreshToken,
  user,
  userRole,
  userName,
}) {
  try {
    if (token) localStorage.setItem(AUTH_KEYS.TOKEN, token);
    if (refreshToken)
      localStorage.setItem(AUTH_KEYS.REFRESH_TOKEN, refreshToken);

    const resolvedRole =
      userRole ||
      (user?.rol_codi === "ROL_ADM"
        ? "ADMIN_INSTITUCION"
        : user?.rol_codi === "ROL_ESP"
          ? "ESPECIALISTA"
          : user?.rol_codi === "ROL_REP"
            ? "REPRESENTANTE"
            : undefined);

    if (resolvedRole) localStorage.setItem(AUTH_KEYS.USER_ROLE, resolvedRole);

    const resolvedName =
      userName ||
      user?.nombre ||
      (user?.usu_nomb
        ? `${user.usu_nomb} ${user.usu_apel || ""}`.trim()
        : "Usuario");

    if (resolvedName) localStorage.setItem(AUTH_KEYS.USER_NAME, resolvedName);
  } catch (e) {
    console.error("Error al guardar la sesión en almacenamiento local:", e);
  }
}

/**
 * Limpia por completo y de forma segura todos los datos de autenticación y sesión activa.
 */
export function clearAuthSession() {
  try {
    localStorage.removeItem(AUTH_KEYS.TOKEN);
    localStorage.removeItem(AUTH_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(AUTH_KEYS.USER_ROLE);
    localStorage.removeItem(AUTH_KEYS.USER_NAME);
    localStorage.removeItem(AUTH_KEYS.CURRENT_VIEW);
    localStorage.removeItem(AUTH_KEYS.SELECTED_CHILD_ID);
    localStorage.removeItem(AUTH_KEYS.SELECTED_CHILD_NAME);
  } catch (e) {
    console.error("Error al limpiar la sesión local:", e);
  }
}

/**
 * Determina si un rol autenticado debe conservar y restaurar su niño seleccionado
 * al recargar la página (F5). Al cerrar sesión o iniciar una nueva sesión, el valor
 * guardado se limpia explícitamente.
 * @param {string|null} role
 * @returns {boolean}
 */
export function shouldRestoreSavedChild(role) {
  const normalized = normalizeRole(role);
  return normalized === "REPRESENTANTE" || normalized === "ESPECIALISTA";
}

/**
 * Helpers para persistencia de la selección del niño (para que no se pierda al recargar)
 */
export function getSavedSelectedChild() {
  try {
    const id = localStorage.getItem(AUTH_KEYS.SELECTED_CHILD_ID);
    const name = localStorage.getItem(AUTH_KEYS.SELECTED_CHILD_NAME);
    return { id: id || null, name: name || null };
  } catch {
    return { id: null, name: null };
  }
}

export function saveSelectedChild(id, name) {
  try {
    if (id) {
      localStorage.setItem(AUTH_KEYS.SELECTED_CHILD_ID, String(id));
    } else {
      localStorage.removeItem(AUTH_KEYS.SELECTED_CHILD_ID);
    }
    if (name) {
      localStorage.setItem(AUTH_KEYS.SELECTED_CHILD_NAME, String(name));
    } else {
      localStorage.removeItem(AUTH_KEYS.SELECTED_CHILD_NAME);
    }
  } catch (e) {
    console.warn("No se pudo persistir el niño seleccionado:", e);
  }
}

/**
 * Escucha cambios en el almacenamiento local para sincronizar estados entre pestañas.
 * Si se cierra sesión en una pestaña, dispara el callback de logout en las demás.
 * @param {object} callbacks
 * @param {Function} callbacks.onLogout
 * @param {Function} callbacks.onLogin
 * @returns {Function} Función para desuscribirse
 */
export function setupAuthSync({ onLogout, onLogin }) {
  const handler = (event) => {
    if (event.key === AUTH_KEYS.TOKEN) {
      if (!event.newValue && event.oldValue) {
        // El token fue eliminado en otra pestaña -> cerrar sesión
        if (typeof onLogout === "function") onLogout();
      } else if (event.newValue && !event.oldValue) {
        // Se inició sesión en otra pestaña -> refrescar o notificar
        if (typeof onLogin === "function") onLogin(event.newValue);
      }
    }
  };

  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
