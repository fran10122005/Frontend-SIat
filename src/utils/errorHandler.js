// Centralización del manejo de errores de API.
// Extrae el mensaje real del backend (en cualquier formato) y lo convierte
// en un texto claro y accionable para el usuario final.

export const FALLBACK_BY_STATUS = {
  400: "Solicitud inválida. Revisa los datos ingresados e inténtalo nuevamente.",
  401: "Tu sesión expiró. Vuelve a iniciar sesión.",
  403: "No tienes permisos para realizar esta acción.",
  404: "El recurso solicitado no se encontró.",
  409: "El registro ya existe o está en conflicto con la información actual.",
  422: "Los datos enviados no son válidos. Revisa los campos e inténtalo nuevamente.",
  429: "Demasiadas solicitudes. Espera unos segundos e inténtalo nuevamente.",
};

export const NETWORK_FALLBACK =
  "No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo nuevamente.";

export const TIMEOUT_FALLBACK =
  "La solicitud tardó demasiado en responder. Inténtalo nuevamente.";

export const GENERIC_FALLBACK =
  "Ocurrió un error inesperado. Inténtalo nuevamente.";

// Limpia ruido de mensajes crudos de axios/Express/Node.
function cleanRaw(raw) {
  return String(raw)
    .replace(/^Error:\s*/i, "")
    .replace(/^AxiosError[^:]*:\s*/i, "")
    .replace(/^Request failed with status code \d+$/i, "")
    .replace(/^Network Error$/i, "")
    .trim();
}

// Patrones conocidos del backend → mensaje amigable.
// Ordenados de lo más específico a lo más genérico.
// Nota: la propiedad se llama `pattern`, no `test`, para no sombrear el
// método RegExp.prototype.test (un RegExp no es invocable).
const KNOWN_PATTERNS = [
  {
    pattern:
      /(correo|email).*(ya\s*existe|ya\s*registrad|ya\s*est[áa]\s*registrad|ya\s*se\s*encuentr|en\s*uso|ocupad|utilizad|vinculad|duplicad)/i,
    msg: "El correo electrónico ya está registrado. Prueba con otro o usa la opción «¿Olvidaste tu contraseña?».",
  },
  {
    pattern:
      /(nombre|denominaci[oó]n|descripci[oó]n).*(ya\s*existe|ya\s*registrad|ya\s*se\s*encuentr|en\s*uso|ocupad|repetid|duplicad)/i,
    msg: "Ese nombre ya está registrado en el sistema. Usa otro o modifícalo.",
  },
  {
    pattern:
      /(c[eé]dula|documento|rif|id\s*de).*(ya\s*existe|ya\s*registrad|ya\s*se\s*encuentr|en\s*uso|ocupad|repetid|duplicad)/i,
    msg: "Ese documento de identidad ya está registrado en el sistema.",
  },
  {
    pattern:
      /(ya\s*existe|already\s*exist|duplicate|duplicad|ya\s*registrad|ya\s*est[áa]\s*registrad|ya\s*se\s*encuentr|repetid)/i,
    msg: "Ya existe un registro con esos datos. Verifica el correo, el nombre o el documento e inténtalo nuevamente.",
  },
  {
    pattern:
      /(credenciales|contrase[ñn]a|password|clave).*(incorrect|inv[aá]lid|no\s*coincid|wrong)/i,
    msg: "Correo o contraseña incorrectos. Verifica e inténtalo nuevamente.",
  },
  {
    pattern:
      /(token\s*inv|token\s*expi|inv[aá]lid\s*token|enlace\s*inv|enlace\s*expi|ha\s*expirado|expirado)/i,
    msg: "El enlace o token es inválido o ha expirado. Solicita uno nuevo.",
  },
  {
    pattern:
      /(no\s*encontrad|not\s*found|no\s*existe|ya\s*no\s*est[áa]\s*disponible)/i,
    msg: "El recurso solicitado no existe o ya no está disponible.",
  },
  {
    pattern:
      /(requerid|obligatori|no\s*puede\s*estar\s*vac[ií]o|completa.*campo)/i,
    msg: "Hay campos requeridos sin completar. Revisa el formulario e inténtalo nuevamente.",
  },
];

export function friendlyMessage(raw) {
  if (!raw) return "";
  for (const p of KNOWN_PATTERNS) {
    if (p.pattern.test(String(raw))) return p.msg;
  }
  return cleanRaw(raw);
}

// Extrae el mensaje del body de error del backend sin importar su formato.
export function extractServerMessage(err) {
  const data = err?.response?.data;
  if (!data) return "";

  if (typeof data === "string") return cleanRaw(data);

  if (typeof data.message === "string") return cleanRaw(data.message);

  if (data.error) {
    if (typeof data.error === "string") return cleanRaw(data.error);
    if (typeof data.error === "object") {
      if (typeof data.error.message === "string")
        return cleanRaw(data.error.message);
      if (typeof data.error.msg === "string") return cleanRaw(data.error.msg);
      if (typeof data.error.error === "string")
        return cleanRaw(data.error.error);
    }
  }

  if (typeof data.msg === "string") return cleanRaw(data.msg);
  if (typeof data.mensaje === "string") return cleanRaw(data.mensaje);
  if (typeof data.detail === "string") return cleanRaw(data.detail);

  if (Array.isArray(data.detalles)) {
    const parts = data.detalles
      .map((d) =>
        typeof d === "string" ? d : d?.mensaje || d?.message || d?.error || "",
      )
      .filter(Boolean);
    if (parts.length) return cleanRaw(parts.join(". "));
  }

  if (Array.isArray(data.errors)) {
    const parts = data.errors
      .map((d) =>
        typeof d === "string" ? d : d?.message || d?.msg || d?.error || "",
      )
      .filter(Boolean);
    if (parts.length) return cleanRaw(parts.join(". "));
  }

  return "";
}

// Obtiene el mejor mensaje posible para mostrar al usuario.
export function getErrorMessage(err, fallback) {
  if (!err) return fallback || GENERIC_FALLBACK;

  // El interceptor ya resolvió un mensaje amigable para este error.
  if (err.userMessage) return err.userMessage;

  const serverMsg = extractServerMessage(err);
  const friendly = friendlyMessage(serverMsg);
  if (friendly) return friendly;

  if (!err.response) {
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT")
      return TIMEOUT_FALLBACK;
    if (err.code === "ERR_CANCELED") return "";
    return NETWORK_FALLBACK;
  }

  const status = err.response.status;
  if (FALLBACK_BY_STATUS[status]) return FALLBACK_BY_STATUS[status];

  return fallback || GENERIC_FALLBACK;
}

// Muestra el error a través de un toast (convención del proyecto).
export function toastError(err, showToast, fallback) {
  const message = getErrorMessage(err, fallback);
  if (!message) return;
  showToast(`❌ ${message}`);
}
