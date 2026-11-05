import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  parseJwt,
  isTokenExpired,
  getAuthToken,
  setAuthSession,
  clearAuthSession,
  getSavedSelectedChild,
  saveSelectedChild,
  setupAuthSync,
  normalizeRole,
  getValidSession,
} from "./authStorage";

// Helper para generar tokens JWT de prueba sin librerías externas
function createMockJwt(payload) {
  const btoaFn =
    typeof globalThis !== "undefined" && globalThis.btoa
      ? globalThis.btoa.bind(globalThis)
      : (str) =>
          typeof globalThis !== "undefined" && globalThis.Buffer
            ? globalThis.Buffer.from(str, "binary").toString("base64")
            : str;
  const header = btoaFn(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoaFn(JSON.stringify(payload));
  const signature = "mockSignature123";
  return `${header}.${body}.${signature}`;
}

describe("authStorage - Manejo de JWT", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("parseJwt decodifica correctamente el payload de un token JWT", () => {
    const payload = { userId: "123", email: "test@siat.com", role: "ROL_ESP" };
    const token = createMockJwt(payload);

    const parsed = parseJwt(token);
    expect(parsed).toEqual(expect.objectContaining(payload));
  });

  it("parseJwt devuelve null para tokens malformados o vacíos", () => {
    expect(parseJwt("")).toBeNull();
    expect(parseJwt(null)).toBeNull();
    expect(parseJwt("invalido.token")).toBeNull();
    expect(parseJwt("a.b.c.d")).toBeNull();
  });

  it("isTokenExpired detecta correctamente tokens expirados", () => {
    const pastExp = Math.floor(Date.now() / 1000) - 60; // 1 minuto en el pasado
    const expiredToken = createMockJwt({ exp: pastExp });

    expect(isTokenExpired(expiredToken)).toBe(true);
  });

  it("isTokenExpired devuelve false para tokens vigentes", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hora en el futuro
    const validToken = createMockJwt({ exp: futureExp });

    expect(isTokenExpired(validToken)).toBe(false);
  });

  it("isTokenExpired aplica ventana de gracia", () => {
    // Expira en 5 segundos
    const soonExp = Math.floor(Date.now() / 1000) + 5;
    const soonToken = createMockJwt({ exp: soonExp });

    // Con ventana de 10s de gracia, debe considerarse expirado
    expect(isTokenExpired(soonToken, 10)).toBe(true);
    // Sin ventana de gracia (0s), sigue vigente
    expect(isTokenExpired(soonToken, 0)).toBe(false);
  });
});

describe("authStorage - Sesión y localStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("setAuthSession almacena token, rol normalizado y nombre", () => {
    const user = {
      rol_codi: "ROL_ESP",
      usu_nomb: "Dra. María",
      usu_apel: "González",
    };
    setAuthSession({ token: "token-123", user });

    expect(getAuthToken()).toBe("token-123");
    expect(localStorage.getItem("userRole")).toBe("ESPECIALISTA");
    expect(localStorage.getItem("userName")).toBe("Dra. María González");
  });

  it("clearAuthSession borra todas las claves de autenticación y selección", () => {
    setAuthSession({
      token: "token-123",
      userRole: "ADMIN_INSTITUCION",
      userName: "Admin",
    });
    saveSelectedChild("NIN_99", "Pedrito");

    clearAuthSession();

    expect(getAuthToken()).toBeNull();
    expect(localStorage.getItem("userRole")).toBeNull();
    expect(localStorage.getItem("userName")).toBeNull();
    expect(getSavedSelectedChild().id).toBeNull();
  });

  it("saveSelectedChild y getSavedSelectedChild persisten la selección de niño", () => {
    saveSelectedChild("NIN_50", "Carlos Ruiz");

    const saved = getSavedSelectedChild();
    expect(saved.id).toBe("NIN_50");
    expect(saved.name).toBe("Carlos Ruiz");

    saveSelectedChild(null, null);
    expect(getSavedSelectedChild().id).toBeNull();
  });
});

describe("authStorage - setupAuthSync", () => {
  it("ejecuta onLogout cuando el token es removido en otra pestaña", () => {
    const onLogout = vi.fn();
    const onLogin = vi.fn();
    const cleanup = setupAuthSync({ onLogout, onLogin });

    // Simular evento storage de otra pestaña (token eliminado)
    const StorageEventClass =
      (typeof globalThis !== "undefined" && globalThis.StorageEvent) ||
      (typeof window !== "undefined" && window.StorageEvent) ||
      (typeof globalThis !== "undefined" && globalThis.Event) ||
      (typeof window !== "undefined" && window.Event);
    const storageEvent = new StorageEventClass("storage", {
      key: "token",
      oldValue: "token-anterior",
      newValue: null,
    });
    window.dispatchEvent(storageEvent);

    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(onLogin).not.toHaveBeenCalled();

    cleanup();
  });
});

describe("authStorage - normalizeRole y getValidSession", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("normalizeRole mapea códigos de rol del backend y cadenas de rol", () => {
    expect(normalizeRole("ROL_ADM")).toBe("ADMIN_INSTITUCION");
    expect(normalizeRole("ADMIN_INSTITUCION")).toBe("ADMIN_INSTITUCION");
    expect(normalizeRole("ROL_ESP")).toBe("ESPECIALISTA");
    expect(normalizeRole("ESPECIALISTA")).toBe("ESPECIALISTA");
    expect(normalizeRole("ROL_REP")).toBe("REPRESENTANTE");
    expect(normalizeRole("REPRESENTANTE")).toBe("REPRESENTANTE");
    expect(normalizeRole(null)).toBeNull();
    expect(normalizeRole("")).toBeNull();
  });

  it("getValidSession retorna isValid: false si no hay token", () => {
    const session = getValidSession();
    expect(session.isValid).toBe(false);
    expect(session.role).toBeNull();
    expect(session.token).toBeNull();
  });

  it("getValidSession retorna isValid: false y limpia si el token está expirado", () => {
    const pastExp = Math.floor(Date.now() / 1000) - 300;
    const expiredToken = createMockJwt({ rol_codi: "ROL_ADM", exp: pastExp });
    localStorage.setItem("token", expiredToken);
    localStorage.setItem("userRole", "ADMIN_INSTITUCION");

    const session = getValidSession();
    expect(session.isValid).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("userRole")).toBeNull();
  });

  it("getValidSession retorna isValid: true y extrae el rol de un token válido", () => {
    const futureExp = Math.floor(Date.now() / 1000) + 7200;
    const validToken = createMockJwt({
      usu_codi: "USU_1",
      rol_codi: "ROL_ADM",
      exp: futureExp,
    });
    localStorage.setItem("token", validToken);

    const session = getValidSession();
    expect(session.isValid).toBe(true);
    expect(session.role).toBe("ADMIN_INSTITUCION");
    expect(session.token).toBe(validToken);
    expect(localStorage.getItem("userRole")).toBe("ADMIN_INSTITUCION");
  });
});
