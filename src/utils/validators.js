// Utilidades compartidas de sanitización, validación de campos y foco de errores

export const MOBILE_PHONE_VE_REGEX = /^(04\d{9}|\+584\d{9})$/;
export const INST_PHONE_VE_REGEX = /^(0[24]\d{9}|\+58[24]\d{9})$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const PERSON_NAME_REGEX = /^[\p{L}\s'\-.]+$/u;
export const CEDULA_VE_REGEX = /^\d{6,8}$/;
export const PASSPORT_REGEX = /^[A-Z0-9]{6,11}$/i;
export const LICENSE_REGEX = /^(CM|MPPS|MPP|\d{4,6})[- ]?\d{3,6}$/i;
export const RIF_OR_CODE_REGEX = /^([JGVEP]-\d{8}-\d|[A-Za-z0-9]{2,15})$/i;
export const ESC_CODI_REGEX = /^[A-Za-z0-9_-]{2,10}$/;

const pad2 = (n) => String(n).padStart(2, "0");

export function toLocalYMD(date = new Date()) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function subtractYearsYMD(years, baseDate = new Date()) {
  const targetYear = baseDate.getFullYear() - years;
  const month = baseDate.getMonth();
  const maxDayInMonth = new Date(targetYear, month + 1, 0).getDate();
  const day = Math.min(baseDate.getDate(), maxDayInMonth);
  return `${targetYear}-${pad2(month + 1)}-${pad2(day)}`;
}

/**
 * Rango YYYY-MM-DD en hora local para inputs <input type="date" min max />
 * por defecto 12 a 75 años para Especialistas y Representantes.
 */
export function getAdultOrYouthDateBounds(
  minAge = 12,
  maxAge = 75,
  baseDate = new Date(),
) {
  return {
    min: subtractYearsYMD(maxAge, baseDate),
    max: subtractYearsYMD(minAge, baseDate),
  };
}

export function getChildDateBounds(maxAge = 25, baseDate = new Date()) {
  return {
    min: subtractYearsYMD(maxAge, baseDate),
    max: toLocalYMD(baseDate),
  };
}

export function parseLocalYMD(value) {
  if (!value) return null;
  const raw = String(value).trim();
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(year, month - 1, day);
  if (
    Number.isNaN(probe.getTime()) ||
    probe.getFullYear() !== year ||
    probe.getMonth() + 1 !== month ||
    probe.getDate() !== day
  ) {
    return null;
  }
  return { year, month, day, date: probe };
}

export function calcAgeYears(value, refDate = new Date()) {
  const parsed = parseLocalYMD(value);
  if (!parsed) return null;
  let age = refDate.getFullYear() - parsed.year;
  const monthDiff = refDate.getMonth() + 1 - parsed.month;
  if (monthDiff < 0 || (monthDiff === 0 && refDate.getDate() < parsed.day)) {
    age -= 1;
  }
  return age;
}

export function formatYmdForInput(value) {
  if (!value) return "";
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
}

// ── Sanitizadores en tiempo real (máscaras onChange) ───────────────────────

export function sanitizeDocumento(value, tdoc = "V") {
  const raw = String(value || "");
  if (tdoc === "P") {
    return raw
      .replace(/[^A-Za-z0-9]/g, "")
      .toUpperCase()
      .slice(0, 11);
  }
  return raw.replace(/\D/g, "").slice(0, 8);
}

/**
 * Permite únicamente 04120000000 (11 dígitos) o +584120000000 (13 caracteres),
 * bloqueando espacios, guiones y letras mientras se escribe o pega.
 */
export function sanitizeTelefonoVE(value) {
  const raw = String(value || "");
  const hasPlus = raw.startsWith("+");
  const digits = raw.replace(/\D/g, "");
  if (hasPlus) {
    return `+${digits.slice(0, 12)}`;
  }
  return digits.slice(0, 11);
}

export function sanitizeNombrePersona(value, maxLen = 50) {
  return String(value || "")
    .replace(/[^\p{L}\s'\-.]/gu, "")
    .slice(0, maxLen);
}

export function sanitizeLicencia(value, maxLen = 20) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, maxLen);
}

export function sanitizeRifOrCode(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 15);
}

export function sanitizeEscCodi(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 10);
}

export function sanitizeIntegerInput(value, maxLen = 4) {
  return String(value ?? "")
    .replace(/\D/g, "")
    .slice(0, maxLen);
}

export function sanitizeDecimalInput(value, maxLen = 5) {
  const cleaned = String(value ?? "").replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  const normalized =
    parts.length > 1 ? `${parts[0]}.${parts.slice(1).join("")}` : cleaned;
  return normalized.slice(0, maxLen);
}

// ── Validadores puros ──────────────────────────────────────────────────────

export function validateRequiredText(
  value,
  label = "Este campo",
  { min = 1, max = 255 } = {},
) {
  const text = String(value ?? "").trim();
  if (!text) return `${label} es obligatorio`;
  if (text.length < min)
    return `${label} debe tener al menos ${min} caracteres`;
  if (text.length > max) return `${label} no puede exceder ${max} caracteres`;
  return "";
}

export function validateNombrePersona(
  value,
  label = "Este campo",
  { required = true, max = 50 } = {},
) {
  const text = String(value ?? "").trim();
  if (!text) return required ? `${label} es obligatorio` : "";
  if (text.length < 2) return `${label} debe tener al menos 2 caracteres`;
  if (text.length > max) return `${label} no puede exceder ${max} caracteres`;
  if (!PERSON_NAME_REGEX.test(text))
    return `${label} solo debe contener letras`;
  return "";
}

export function validateDocumento(value, tdoc = "V", { required = true } = {}) {
  const doc = String(value ?? "")
    .trim()
    .toUpperCase();
  if (!doc) {
    return required ? "El número de documento es obligatorio" : "";
  }
  if (tdoc === "P") {
    return PASSPORT_REGEX.test(doc)
      ? ""
      : "El pasaporte debe tener entre 6 y 11 caracteres alfanuméricos (Ej. P1234567)";
  }
  return CEDULA_VE_REGEX.test(doc)
    ? ""
    : "La cédula debe contener entre 6 y 8 dígitos (Ej. 12345678)";
}

export function validateEmail(value, { required = true, max = 50 } = {}) {
  const text = String(value ?? "").trim();
  if (!text) return required ? "El correo electrónico es obligatorio" : "";
  if (text.length > max) return `El correo no puede exceder ${max} caracteres`;
  if (!EMAIL_REGEX.test(text))
    return "Ingresa un correo electrónico válido (Ej. usuario@clinica.com)";
  return "";
}

export function validateEmailList(value, { max = 500 } = {}) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (text.length > max)
    return `La lista de correos no puede exceder ${max} caracteres`;
  const items = text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const invalid = items.find((email) => !EMAIL_REGEX.test(email));
  if (invalid) return `Correo inválido en la lista: "${invalid}"`;
  return "";
}

export function validateTelefonoMovilVE(value, { required = false } = {}) {
  const text = String(value ?? "").trim();
  if (!text) return required ? "El número de teléfono es obligatorio" : "";
  return MOBILE_PHONE_VE_REGEX.test(text)
    ? ""
    : "Formato válido: 04120000000 o +584120000000";
}

export function validateTelefonoInstVE(value, { required = true } = {}) {
  const text = String(value ?? "").trim();
  if (!text) return required ? "El teléfono institucional es obligatorio" : "";
  return INST_PHONE_VE_REGEX.test(text)
    ? ""
    : "Formato válido sin espacios ni guiones: 02121234567, 04120000000 o +58...";
}

export function validateFechaRangoEdad(
  value,
  {
    minAge = 12,
    maxAge = 75,
    required = false,
    label = "La fecha de nacimiento",
    baseDate = new Date(),
  } = {},
) {
  const raw = String(value ?? "").trim();
  if (!raw) return required ? `${label} es obligatoria` : "";

  const parsed = parseLocalYMD(raw);
  if (!parsed) return `${label} es inválida`;

  const todayYmd = toLocalYMD(baseDate);
  const rawYmd = `${parsed.year}-${pad2(parsed.month)}-${pad2(parsed.day)}`;
  if (rawYmd > todayYmd) return `${label} no puede ser futura`;

  const age = calcAgeYears(raw, baseDate);
  if (age === null) return `${label} es inválida`;
  if (age < minAge) return `La edad mínima permitida es ${minAge} años`;
  if (age > maxAge) return `La edad máxima permitida es ${maxAge} años`;
  return "";
}

export function validateFechaPaciente(
  value,
  { required = true, maxAge = 25, baseDate = new Date() } = {},
) {
  const raw = String(value ?? "").trim();
  if (!raw) return required ? "La fecha de nacimiento es obligatoria" : "";
  const parsed = parseLocalYMD(raw);
  if (!parsed) return "Fecha de nacimiento inválida";
  const todayYmd = toLocalYMD(baseDate);
  const rawYmd = `${parsed.year}-${pad2(parsed.month)}-${pad2(parsed.day)}`;
  if (rawYmd > todayYmd) return "La fecha de nacimiento no puede ser futura";
  const age = calcAgeYears(raw, baseDate);
  if (age !== null && age > maxAge)
    return `Verifica el año de nacimiento del paciente (máximo ${maxAge} años)`;
  return "";
}

export function validateLicencia(value, { required = false } = {}) {
  const text = String(value ?? "").trim();
  if (!text) return required ? "La licencia es obligatoria" : "";
  return LICENSE_REGEX.test(text)
    ? ""
    : "Formato válido: CM-90800 o MPPS-123456";
}

export function validateUrl(value, { required = false } = {}) {
  const text = String(value ?? "").trim();
  if (!text) return required ? "La URL es obligatoria" : "";
  try {
    const parsed = new URL(text);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "La URL debe iniciar por http:// o https://";
    }
    return "";
  } catch {
    return "Ingresa una URL válida (Ej. https://ejemplo.com)";
  }
}

export function validateRifOrCode(value, { required = true } = {}) {
  const text = String(value ?? "").trim();
  if (!text) return required ? "El RIF o código es obligatorio" : "";
  if (text.length < 2 || text.length > 15)
    return "Debe tener entre 2 y 15 caracteres";
  return RIF_OR_CODE_REGEX.test(text)
    ? ""
    : "Formato válido: J-50493821-0 o código institucional alfanumérico";
}

export function getPasswordStrength(pwd) {
  const raw = String(pwd || "");
  if (!raw) {
    return {
      score: 0,
      label: "Muy débil",
      color: "bg-slate-200 w-0",
      criteria: {
        minLength: false,
        lowercase: false,
        uppercase: false,
        number: false,
      },
      isValid: false,
    };
  }

  const criteria = {
    minLength: raw.length >= 8,
    lowercase: /[a-z]/.test(raw),
    uppercase: /[A-Z]/.test(raw),
    number: /[0-9]/.test(raw),
  };

  let score = 0;
  if (criteria.minLength) score += 1;
  if (criteria.lowercase) score += 1;
  if (criteria.uppercase) score += 1;
  if (criteria.number) score += 1;

  let label = "Débil";
  let color = "bg-red-500 w-1/4";
  if (score === 2) {
    label = "Regular";
    color = "bg-orange-500 w-2/4";
  } else if (score === 3) {
    label = "Buena";
    color = "bg-yellow-500 w-3/4";
  } else if (score === 4) {
    label = "Excelente";
    color = "bg-emerald-500 w-full";
  }

  return {
    score,
    label,
    color,
    criteria,
    isValid: score === 4 && raw.length <= 60,
  };
}

export function validatePasswordStrong(value, { required = true } = {}) {
  const raw = String(value || "");
  if (!raw) return required ? "La contraseña es obligatoria" : "";
  if (raw.length < 8) return "La contraseña debe tener al menos 8 caracteres";
  if (raw.length > 60) return "La contraseña no puede exceder 60 caracteres";
  if (!/[a-z]/.test(raw)) return "Debe incluir al menos una letra minúscula";
  if (!/[A-Z]/.test(raw)) return "Debe incluir al menos una letra mayúscula";
  if (!/[0-9]/.test(raw)) return "Debe incluir al menos un número";
  return "";
}

// ── Navegación automática hacia el primer error ─────────────────────────────

export function focusFirstError(errorsMap = {}, container = null) {
  const invalidKeys = Object.keys(errorsMap || {}).filter((k) =>
    Boolean(errorsMap[k]),
  );
  if (!invalidKeys.length) return false;

  const root =
    container?.current ||
    container ||
    (typeof document !== "undefined" ? document : null);
  if (!root || typeof root.querySelectorAll !== "function") return false;

  const invalidSet = new Set(invalidKeys);
  let target = null;

  const tagged = root.querySelectorAll("[data-field], [name]");
  for (const el of tagged) {
    const key = el.getAttribute("data-field") || el.getAttribute("name");
    if (key && invalidSet.has(key)) {
      target = el;
      break;
    }
  }

  if (!target) {
    for (const k of invalidKeys) {
      target = root.querySelector(`[data-field="${k}"], [name="${k}"]`);
      if (target) break;
    }
  }

  if (!target) return false;

  const focusable = target.matches(
    "input, select, textarea, button, [tabindex]",
  )
    ? target
    : target.querySelector("input, select, textarea, button, [tabindex]");

  const scrollTarget = focusable || target;
  if (typeof scrollTarget.scrollIntoView === "function") {
    scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  if (focusable && typeof focusable.focus === "function") {
    try {
      focusable.focus({ preventScroll: true });
    } catch {
      focusable.focus();
    }
  }

  const pulseTarget = focusable || target;
  pulseTarget.classList?.add("form-error-focus");
  setTimeout(() => pulseTarget.classList?.remove("form-error-focus"), 1400);
  return true;
}
