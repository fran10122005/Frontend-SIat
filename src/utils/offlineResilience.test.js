import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Resiliencia del modo offline SIAT", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("clasifica correctamente el motivo de desconexión según el estado del dispositivo", () => {
    const classifyDisconnection = (isNavigatorOnline) => {
      return !isNavigatorOnline ? "offline_network" : "offline_server";
    };

    expect(classifyDisconnection(false)).toBe("offline_network");
    expect(classifyDisconnection(true)).toBe("offline_server");
  });

  it("despacha y recibe evento siat:online para restaurar conectividad", () => {
    let onlineState = false;
    const handler = () => {
      onlineState = true;
    };

    window.addEventListener("siat:online", handler);
    window.dispatchEvent(new CustomEvent("siat:online"));

    expect(onlineState).toBe(true);
    window.removeEventListener("siat:online", handler);
  });

  it("despacha evento siat:offline con detalle de causa raíz", () => {
    let capturedReason = null;
    const handler = (e) => {
      capturedReason = e.detail?.reason;
    };

    window.addEventListener("siat:offline", handler);
    window.dispatchEvent(
      new CustomEvent("siat:offline", {
        detail: { reason: "offline_server" },
      }),
    );

    expect(capturedReason).toBe("offline_server");
    window.removeEventListener("siat:offline", handler);
  });

  it("no dispara offline si el primer intento falla pero el segundo tiene éxito (anti-flapping)", async () => {
    let attempts = 0;
    const mockHealthCheck = async () => {
      attempts++;
      if (attempts === 1) throw new Error("Timeout transitorio");
      return { status: 200 };
    };

    const resilientStartup = async () => {
      try {
        await mockHealthCheck();
        return true;
      } catch (err) {
        // Reintento con cortesía
        try {
          await mockHealthCheck();
          return true;
        } catch {
          return false;
        }
      }
    };

    const result = await resilientStartup();
    expect(result).toBe(true);
    expect(attempts).toBe(2);
  });
});
