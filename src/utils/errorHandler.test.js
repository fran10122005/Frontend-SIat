import { describe, it, expect } from "vitest";
import {
  getErrorMessage,
  extractServerMessage,
  friendlyMessage,
  NETWORK_FALLBACK,
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
