import { describe, it, expect, vi } from "vitest";
import {
  sanitizeDocumento,
  validateDocumento,
  sanitizeTelefonoVE,
  validateTelefonoMovilVE,
  validateTelefonoInstVE,
  getAdultOrYouthDateBounds,
  subtractYearsYMD,
  validateFechaRangoEdad,
  validatePasswordStrong,
  getPasswordStrength,
  focusFirstError,
} from "./validators";

describe("validators — Documentos (V / E / P)", () => {
  it("bloquea letras como 'ik' cuando el tipo de documento es V o E", () => {
    expect(sanitizeDocumento("ik", "V")).toBe("");
    expect(sanitizeDocumento("ik12a3456b", "E")).toBe("123456");
    expect(sanitizeDocumento("1234567890", "V")).toBe("12345678");
  });

  it("permite alfanuméricos en mayúscula hasta 11 caracteres cuando tdoc es Pasaporte (P)", () => {
    expect(sanitizeDocumento("p12-3ab", "P")).toBe("P123AB");
    expect(sanitizeDocumento("ab123456789xyz", "P")).toBe("AB123456789");
  });

  it("valida cédula V/E (6-8 dígitos) y pasaporte P (6-11 alfanuméricos)", () => {
    expect(validateDocumento("12345678", "V")).toBe("");
    expect(validateDocumento("123456", "E")).toBe("");
    expect(validateDocumento("ik", "V")).toMatch(/6 y 8 dígitos/i);
    expect(validateDocumento("12345", "V")).toMatch(/6 y 8 dígitos/i);
    expect(validateDocumento("P123AB", "P")).toBe("");
    expect(validateDocumento("AB12", "P")).toMatch(/6 y 11 caracteres/i);
    expect(validateDocumento("", "V", { required: false })).toBe("");
    expect(validateDocumento("", "V", { required: true })).toMatch(
      /obligatorio/i,
    );
  });
});

describe("validators — Teléfono VE estricto (04120000000 o +584120000000)", () => {
  it("sanitiza espacios, guiones y limita longitud en tiempo real", () => {
    expect(sanitizeTelefonoVE("0412-000 0000")).toBe("04120000000");
    expect(sanitizeTelefonoVE("+58 412-0000000")).toBe("+584120000000");
    expect(sanitizeTelefonoVE("+584120000000999")).toBe("+584120000000");
    expect(sanitizeTelefonoVE("0412000000099")).toBe("04120000000");
    expect(sanitizeTelefonoVE("04abc12")).toBe("0412");
  });

  it("acepta únicamente móviles locales 04XXXXXXXXX o +584XXXXXXXXX", () => {
    expect(validateTelefonoMovilVE("04120000000")).toBe("");
    expect(validateTelefonoMovilVE("+584120000000")).toBe("");
    expect(validateTelefonoMovilVE("+58 412-0000000")).toMatch(
      /04120000000 o \+584120000000/,
    );
    expect(validateTelefonoMovilVE("0412-0000000")).toMatch(/04120000000/);
    expect(validateTelefonoMovilVE("02121234567")).toMatch(/04120000000/);
    expect(validateTelefonoMovilVE("", { required: true })).toMatch(
      /obligatorio/i,
    );
    expect(validateTelefonoMovilVE("", { required: false })).toBe("");
  });

  it("valida teléfonos institucionales fijos/móviles sin espacios ni guiones", () => {
    expect(validateTelefonoInstVE("02121234567")).toBe("");
    expect(validateTelefonoInstVE("+582121234567")).toBe("");
    expect(validateTelefonoInstVE("04141234567")).toBe("");
    expect(validateTelefonoInstVE("0212-1234567")).toMatch(
      /sin espacios ni guiones/i,
    );
  });
});

describe("validators — Calendario 12 a 75 años y años bisiestos", () => {
  const ref = new Date(2026, 4, 10); // 10 de mayo de 2026

  it("calcula límites min/max exactos para 12–75 años en hora local", () => {
    const bounds = getAdultOrYouthDateBounds(12, 75, ref);
    expect(bounds).toEqual({
      min: "1951-05-10",
      max: "2014-05-10",
    });
  });

  it("maneja correctamente el 29 de febrero en años bisiestos y no bisiestos", () => {
    const leapRef = new Date(2024, 1, 29);
    expect(subtractYearsYMD(12, leapRef)).toBe("2012-02-29");
    expect(subtractYearsYMD(13, leapRef)).toBe("2011-02-28");
  });

  it("rechaza edades menores a 12, mayores a 75 y fechas futuras", () => {
    expect(
      validateFechaRangoEdad("2014-05-10", {
        minAge: 12,
        maxAge: 75,
        required: true,
        baseDate: ref,
      }),
    ).toBe("");

    expect(
      validateFechaRangoEdad("2014-05-11", {
        minAge: 12,
        maxAge: 75,
        required: true,
        baseDate: ref,
      }),
    ).toMatch(/mínima permitida es 12 años/i);

    expect(
      validateFechaRangoEdad("1951-05-10", {
        minAge: 12,
        maxAge: 75,
        required: true,
        baseDate: ref,
      }),
    ).toBe("");

    expect(
      validateFechaRangoEdad("1950-05-09", {
        minAge: 12,
        maxAge: 75,
        required: true,
        baseDate: ref,
      }),
    ).toMatch(/máxima permitida es 75 años/i);

    expect(
      validateFechaRangoEdad("2027-01-01", {
        minAge: 12,
        maxAge: 75,
        required: true,
        baseDate: ref,
      }),
    ).toMatch(/futura/i);
  });
});

describe("validators — Política unificada de contraseñas y focusFirstError", () => {
  it("exige mínimo 8 caracteres, minúscula, mayúscula y número", () => {
    expect(validatePasswordStrong("")).toMatch(/obligatoria/i);
    expect(validatePasswordStrong("Abc12")).toMatch(/al menos 8 caracteres/i);
    expect(validatePasswordStrong("Abcdefg!")).toMatch(/número/i);
    expect(validatePasswordStrong("abcdefg1")).toMatch(/mayúscula/i);
    expect(validatePasswordStrong("ABCDEFG1")).toMatch(/minúscula/i);
    expect(validatePasswordStrong("Segura123")).toBe("");

    const strength = getPasswordStrength("Segura123");
    expect(strength.score).toBe(4);
    expect(strength.isValid).toBe(true);
    expect(getPasswordStrength("Abcdefg!").isValid).toBe(false);
  });

  it("enfoca, hace scroll y añade pulso visual al primer campo con error", () => {
    const form = document.createElement("form");
    const firstInput = document.createElement("input");
    firstInput.setAttribute("name", "esp_cedu");
    firstInput.scrollIntoView = vi.fn();
    firstInput.focus = vi.fn();

    const secondInput = document.createElement("input");
    secondInput.setAttribute("name", "esp_nomb");
    secondInput.scrollIntoView = vi.fn();
    secondInput.focus = vi.fn();

    form.appendChild(firstInput);
    form.appendChild(secondInput);
    document.body.appendChild(form);

    const focused = focusFirstError(
      { esp_nomb: "Obligatorio", esp_cedu: "Obligatorio" },
      form,
    );

    expect(focused).toBe(true);
    expect(firstInput.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(firstInput.focus).toHaveBeenCalledTimes(1);
    expect(firstInput.classList.contains("form-error-focus")).toBe(true);
    expect(secondInput.focus).not.toHaveBeenCalled();

    document.body.removeChild(form);
  });
});
