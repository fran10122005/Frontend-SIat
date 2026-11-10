import { describe, it, expect, vi } from "vitest";
import {
  getErrorMessage,
  extractServerMessage,
  extractFieldErrors,
  friendlyMessage,
  NETWORK_FALLBACK,
  toastError,
} from "./errorHandler";

const err = (overrides = {}) => ({
  response: { status: 400, data: {} },
  ...overrides,
});

describe("extractServerMessage", () => {
  it("extrae el campo error como string", () => {
    expect(
      extractServerMessage(
        err({ response: { status: 400, data: { error: "ya existe" } } }),
      ),
    ).toBe("ya existe");
  });

  it("extrae el campo message", () => {
    expect(
      extractServerMessage(
        err({ response: { status: 400, data: { message: "fallo" } } }),
      ),
    ).toBe("fallo");
  });

  it("extrae detalles como arreglo de mensajes", () => {
    const data = {
      detalles: [
        { mensaje: "Correo inválido" },
        { mensaje: "Nombre requerido" },
      ],
    };
    expect(extractServerMessage(err({ response: { status: 422, data } }))).toBe(
      "Correo inválido. Nombre requerido",
    );
  });

  it("extrae error anidado como objeto", () => {
    const data = { error: { message: "token expirado" } };
    expect(extractServerMessage(err({ response: { status: 400, data } }))).toBe(
      "token expirado",
    );
  });

  it("devuelve string plano cuando el body es texto", () => {
    expect(
      extractServerMessage(err({ response: { status: 400, data: "malo" } })),
    ).toBe("malo");
  });

  it("devuelve vacío sin respuesta", () => {
    expect(extractServerMessage({ message: "Network Error" })).toBe("");
  });
});

describe("friendlyMessage", () => {
  it("mapea correo duplicado", () => {
    const msg = friendlyMessage(
      "El correo electrónico ya existe en el sistema",
    );
    expect(msg).toMatch(/correo electrónico ya está registrado/i);
  });

  it("mapea nombre duplicado", () => {
    const msg = friendlyMessage("El nombre de la especialidad ya existe");
    expect(msg).toMatch(/nombre ya está registrado/i);
  });

  it("mapea duplicado genérico", () => {
    const msg = friendlyMessage("Duplicate entry 'x' for key");
    expect(msg).toMatch(/ya existe un registro/i);
  });
});

describe("getErrorMessage", () => {
  it("reutiliza err.userMessage si el interceptor lo resolvió", () => {
    const e = {
      userMessage: "mensaje del interceptor",
      response: { status: 500, data: {} },
    };
    expect(getErrorMessage(e)).toBe("mensaje del interceptor");
  });

  it("aplica fallback por status cuando no hay mensaje del servidor", () => {
    const e = err({ response: { status: 404, data: {} } });
    expect(getErrorMessage(e)).toMatch(/no se encontró/i);
  });

  it("aplica fallback genérico para status no mapeado", () => {
    const e = err({ response: { status: 418, data: {} } });
    expect(getErrorMessage(e, "fallback custom")).toBe("fallback custom");
  });

  it("devuelve mensaje de red sin respuesta", () => {
    expect(getErrorMessage({ message: "Network Error" })).toBe(
      NETWORK_FALLBACK,
    );
  });

  it("respeta el fallback pasado por el llamador", () => {
    const e = err({ response: { status: 400, data: {} } });
    expect(getErrorMessage(e, "Contexto específico")).toMatch(
      /solicitud inválida/i,
    );
  });
});

describe("toastError — deduplicación de toasts", () => {
  it("muestra el toast y marca _toastShown cuando no ha sido mostrado", () => {
    const mockShowToast = vi.fn();
    const errorObj = { message: "Network Error" };

    toastError(errorObj, mockShowToast);

    expect(mockShowToast).toHaveBeenCalledTimes(1);
    expect(mockShowToast).toHaveBeenCalledWith(`❌ ${NETWORK_FALLBACK}`);
    expect(errorObj._toastShown).toBe(true);
  });

  it("suprime el toast si _toastShown ya es true (evita duplicación con interceptor global)", () => {
    const mockShowToast = vi.fn();
    const errorObj = { message: "Network Error", _toastShown: true };

    toastError(errorObj, mockShowToast);

    expect(mockShowToast).not.toHaveBeenCalled();
  });
});

describe("extractFieldErrors — Mapeo de errores Zod 400 y duplicados 409", () => {
  it("limpia prefijos body./query./params. de Zod detalles y aplica fieldMap", () => {
    const errorObj = err({
      response: {
        status: 400,
        data: {
          error: "Error de validación",
          detalles: [
            {
              campo: "body.usu_clve",
              mensaje: "La contraseña debe tener al menos 8 caracteres",
            },
            { campo: "body.esp_telf", mensaje: "Formato de teléfono inválido" },
            { campo: "body.usu_clve", mensaje: "Otro error secundario" },
          ],
        },
      },
    });

    const mapped = extractFieldErrors(errorObj, { usu_clve: "password" });

    expect(mapped).toEqual({
      password: "La contraseña debe tener al menos 8 caracteres",
      esp_telf: "Formato de teléfono inválido",
    });
  });

  it("extrae el campo único en respuestas 409 con mensaje amigable", () => {
    const errorObj = err({
      response: {
        status: 409,
        data: {
          error: "El correo electrónico ya está registrado en el sistema.",
          campo: "usu_crro",
        },
      },
    });

    expect(extractFieldErrors(errorObj)).toEqual({
      usu_crro:
        "El correo electrónico ya está registrado. Prueba con otro o usa la opción «¿Olvidaste tu contraseña?».",
    });
  });

  it("devuelve objeto vacío cuando el error no contiene response.data", () => {
    expect(extractFieldErrors({ message: "Network Error" })).toEqual({});
  });
});
