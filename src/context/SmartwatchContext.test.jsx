import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { SmartwatchProvider, useSmartwatch } from "./SmartwatchContext";
import { setAuthSession, saveSelectedChild } from "../utils/authStorage";
import {
  loadUserNotifications,
  loadUserLocalAlerts,
} from "../utils/notificationStorage";

vi.mock("../hooks/socket", () => ({
  getSocket: vi.fn(() => ({ connected: false, emit: vi.fn() })),
  subscribeToSocket: vi.fn(() => () => {}),
  getSocketConnectionState: vi.fn(() => false),
}));

vi.mock("../services/indexedDb", () => ({
  saveTelemetry: vi.fn(() => Promise.resolve()),
}));

vi.mock("../services/telemetrySync", () => ({
  startTelemetrySync: vi.fn(),
  stopTelemetrySync: vi.fn(),
}));

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
}));

vi.mock("@capacitor-community/bluetooth-le", () => ({
  BleClient: { initialize: vi.fn(() => Promise.resolve()) },
  numbersToDataView: vi.fn(),
}));

vi.mock("../services/heartRateTelemetryService", () => ({
  parseBluetoothSigHeartRate: vi.fn(),
  parseOemHeartRateBytes: vi.fn(),
  default: {
    setActiveSessionId: vi.fn(),
    setStreamToCloud: vi.fn(),
    onReading: vi.fn(() => () => {}),
    onStatusChange: vi.fn(() => () => {}),
    checkHealthConnectAvailability: vi.fn(() =>
      Promise.resolve({ available: false }),
    ),
    checkHealthConnectPermissions: vi.fn(() => Promise.resolve(false)),
    stopHealthConnectPolling: vi.fn(),
    disconnectBle: vi.fn(() => Promise.resolve()),
    dispatchReading: vi.fn(),
  },
}));

import HeartRateTelemetryService from "../services/heartRateTelemetryService";

function createMockJwt(payload) {
  const btoaFn = (str) => globalThis.btoa(str);
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${btoaFn(JSON.stringify({ alg: "HS256" }))}.${btoaFn(
    JSON.stringify({ exp, ...payload }),
  )}.sig`;
}

function Harness({ onReady }) {
  const sw = useSmartwatch();
  onReady(sw);
  return null;
}

describe("SmartwatchContext — ciclo de vida seguro de simulación de pulso", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("bloquea la simulación para rol ADMIN_INSTITUCION", () => {
    setAuthSession({
      token: createMockJwt({ usu_codi: "U_ADM", rol_codi: "ROL_ADM" }),
    });
    saveSelectedChild("N001", "Leo");

    const toastSpy = vi.fn();
    window.addEventListener("global-toast", toastSpy);

    let ctx;
    render(
      <SmartwatchProvider>
        <Harness
          onReady={(v) => {
            ctx = v;
          }}
        />
      </SmartwatchProvider>,
    );

    let started;
    act(() => {
      started = ctx.toggleRealisticSimulation("normal");
    });

    expect(started).toBe(false);
    expect(ctx.isSimulating).toBe(false);
    expect(toastSpy).toHaveBeenCalled();
    window.removeEventListener("global-toast", toastSpy);
  });

  it("bloquea la simulación si no hay un paciente seleccionado", () => {
    setAuthSession({
      token: createMockJwt({ usu_codi: "U_ESP", rol_codi: "ROL_ESP" }),
    });
    saveSelectedChild(null, null);

    let ctx;
    render(
      <SmartwatchProvider>
        <Harness
          onReady={(v) => {
            ctx = v;
          }}
        />
      </SmartwatchProvider>,
    );

    let started;
    act(() => {
      started = ctx.toggleRealisticSimulation("normal");
    });

    expect(started).toBe(false);
    expect(ctx.isSimulating).toBe(false);
  });

  it("inicia en sesión clínica con niño activo y se detiene ante cambio de niño o fin de sesión", () => {
    setAuthSession({
      token: createMockJwt({ usu_codi: "U_ESP", rol_codi: "ROL_ESP" }),
    });
    saveSelectedChild("N001", "Leo");

    let ctx;
    render(
      <SmartwatchProvider>
        <Harness
          onReady={(v) => {
            ctx = v;
          }}
        />
      </SmartwatchProvider>,
    );

    act(() => {
      ctx.toggleRealisticSimulation("crisis");
    });

    expect(ctx.isSimulating).toBe(true);
    expect(ctx.simulationRemainingSec).toBe(300);
    expect(loadUserNotifications("U_ESP")).toHaveLength(1);
    expect(loadUserNotifications("U_ESP")[0].nin_codi).toBe("N001");
    expect(loadUserLocalAlerts("U_ESP")[0].nin_codi).toBe("N001");
    expect(localStorage.getItem("siat_notifications")).toBeNull();

    // Cambio de paciente debe detener la simulación automáticamente
    act(() => {
      window.dispatchEvent(
        new CustomEvent("siat:child-changed", { detail: { childId: "N002" } }),
      );
    });
    expect(ctx.isSimulating).toBe(false);

    // Reiniciar y validar cierre de sesión
    act(() => {
      saveSelectedChild("N002", "Mia");
      ctx.toggleRealisticSimulation("normal");
    });
    expect(ctx.isSimulating).toBe(true);

    act(() => {
      window.dispatchEvent(new CustomEvent("siat:session-ended"));
    });
    expect(ctx.isSimulating).toBe(false);
  });

  it("se detiene automáticamente al alcanzar el límite de seguridad de 5 minutos", () => {
    setAuthSession({
      token: createMockJwt({ usu_codi: "U_REP", rol_codi: "ROL_REP" }),
    });
    saveSelectedChild("N001", "Leo");

    let ctx;
    render(
      <SmartwatchProvider>
        <Harness
          onReady={(v) => {
            ctx = v;
          }}
        />
      </SmartwatchProvider>,
    );

    act(() => {
      ctx.toggleRealisticSimulation("normal");
    });
    expect(ctx.isSimulating).toBe(true);

    act(() => {
      vi.advanceTimersByTime(5 * 60 * 1000);
    });

    expect(ctx.isSimulating).toBe(false);
    expect(ctx.simulationRemainingSec).toBe(0);
  });

  it("mide y emite pulsaciones simuladas cada 5 segundos (5000 ms) en normal y crisis", () => {
    setAuthSession({
      token: createMockJwt({ usu_codi: "U_ESP", rol_codi: "ROL_ESP" }),
    });
    saveSelectedChild("N001", "Yonny Alejandro");

    let ctx;
    render(
      <SmartwatchProvider>
        <Harness
          onReady={(v) => {
            ctx = v;
          }}
        />
      </SmartwatchProvider>,
    );

    act(() => {
      ctx.toggleRealisticSimulation("crisis");
    });

    // 1 lectura inmediata al activar
    expect(HeartRateTelemetryService.dispatchReading).toHaveBeenCalledTimes(1);

    // Antes de 5s no debe emitir nueva lectura
    act(() => {
      vi.advanceTimersByTime(4900);
    });
    expect(HeartRateTelemetryService.dispatchReading).toHaveBeenCalledTimes(1);

    // Al cumplirse 5s emite la segunda y a los 10s la tercera
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(HeartRateTelemetryService.dispatchReading).toHaveBeenCalledTimes(2);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(HeartRateTelemetryService.dispatchReading).toHaveBeenCalledTimes(3);

    // Cambiar a modo normal mantiene también la frecuencia de 5 segundos
    HeartRateTelemetryService.dispatchReading.mockClear();
    act(() => {
      ctx.toggleRealisticSimulation("normal");
    });
    expect(HeartRateTelemetryService.dispatchReading).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(HeartRateTelemetryService.dispatchReading).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(HeartRateTelemetryService.dispatchReading).toHaveBeenCalledTimes(2);
  });
});
