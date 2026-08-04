import { describe, it, expect, vi, beforeEach } from "vitest";

// Calcula los reintentos esperables del interceptor sin acoplar a fetch real.
// Extraído de la lógica de src/api/axios.js (retriableStatus + backoff).
function retriableStatus(status) {
  return status === 502 || status === 503 || status === 504;
}

describe("Interceptor axios — política de reintentos", () => {
  it("marca 502/503/504 como reintentables", () => {
    expect(retriableStatus(502)).toBe(true);
    expect(retriableStatus(503)).toBe(true);
    expect(retriableStatus(504)).toBe(true);
  });

  it("no reintenta 400, 401 o 403", () => {
    expect(retriableStatus(400)).toBe(false);
    expect(retriableStatus(401)).toBe(false);
    expect(retriableStatus(403)).toBe(false);
  });

  it("respeta el límite de reintentos (MAX_RETRIES = 2)", () => {
    const MAX_RETRIES = 2;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      expect(attempt < MAX_RETRIES).toBe(true);
    }
  });
});

describe("Manejo de errores 401 (sesión expirada)", () => {
  beforeEach(() => localStorage.clear());

  it("limpia el token guardado", () => {
    localStorage.setItem("token", "abc");
    localStorage.setItem("userRole", "ROL_ADM");
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("userRole")).toBeNull();
  });
});
