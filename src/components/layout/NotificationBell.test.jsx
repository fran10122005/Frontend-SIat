import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import NotificationBell from "./NotificationBell";
import { setAuthSession } from "../../utils/authStorage";
import { loadReadNotificationIds } from "../../utils/notificationStorage";

const socketHandlers = new Map();
const mockApiGet = vi.fn();
const mockShowToast = vi.fn();
let mockGlobalState = {
  showToast: mockShowToast,
  userRole: "ADMIN_INSTITUCION",
  listaNinos: [],
};

vi.mock("../../api/axios", () => ({
  default: {
    get: (...args) => mockApiGet(...args),
  },
}));

vi.mock("../../hooks/socket", () => ({
  getSocket: vi.fn(() => ({ connected: true })),
  subscribeToSocket: vi.fn((event, handler) => {
    socketHandlers.set(event, handler);
    return () => socketHandlers.delete(event);
  }),
}));

vi.mock("../../context/GlobalState", () => ({
  useGlobalContext: () => mockGlobalState,
}));

function createMockJwt(payload) {
  const btoaFn = (str) => globalThis.btoa(str);
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${btoaFn(JSON.stringify({ alg: "HS256" }))}.${btoaFn(
    JSON.stringify({ exp, ...payload }),
  )}.sig`;
}

describe("NotificationBell — aislamiento estricto por módulo y rol", () => {
  beforeEach(() => {
    localStorage.clear();
    socketHandlers.clear();
    vi.clearAllMocks();
  });

  it("ADMIN_INSTITUCION consulta /admin/notificaciones y NO escucha new_alert ni siat:crisis_alert", async () => {
    setAuthSession({
      token: createMockJwt({ usu_codi: "U_ADM", rol_codi: "ROL_ADM" }),
    });
    mockGlobalState = {
      showToast: mockShowToast,
      userRole: "ADMIN_INSTITUCION",
      listaNinos: [],
    };
    mockApiGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: "ops_unassigned_3",
            type: "operational_warning",
            category: "Asignaciones",
            message: "⚠️ Hay 3 paciente(s) sin especialista activo asignado",
            time: new Date().toISOString(),
          },
        ],
      },
    });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith("/admin/notificaciones");
    });

    // Solo escucha admin_notification
    expect(socketHandlers.has("admin_notification")).toBe(true);
    expect(socketHandlers.has("new_alert")).toBe(false);
    expect(socketHandlers.has("parent_notification")).toBe(false);
    expect(socketHandlers.has("specialist_notification")).toBe(false);

    // Una crisis emitida localmente debe ser ignorada por completo en Admin
    act(() => {
      window.dispatchEvent(
        new CustomEvent("siat:crisis_alert", {
          detail: {
            id: "crisis_leak",
            type: "crisis",
            nin_codi: "N001",
            message: "Crisis infantil",
          },
        }),
      );
    });
    expect(mockShowToast).not.toHaveBeenCalled();

    // Debe procesar admin_notification
    act(() => {
      socketHandlers.get("admin_notification")({
        id: "adm_evt_1",
        type: "assignment",
        category: "Personal Clínico",
        message: "🩺 Nuevo especialista registrado",
        time: new Date().toISOString(),
      });
    });
    expect(mockShowToast).toHaveBeenCalledWith(
      "🔔 🩺 Nuevo especialista registrado",
    );
  });

  it("REPRESENTANTE carga /reportes/notificaciones-representante y filtra alertas por niño propio", async () => {
    setAuthSession({
      token: createMockJwt({ usu_codi: "U_REP", rol_codi: "ROL_REP" }),
    });
    mockGlobalState = {
      showToast: mockShowToast,
      userRole: "REPRESENTANTE",
      listaNinos: [{ nin_codi: "N001", nom_nino: "Leo" }],
    };
    mockApiGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: "ind_01",
            type: "indication",
            nin_codi: "N001",
            nin_nomb: "Leo",
            message: "📋 Nueva indicación",
            time: new Date().toISOString(),
          },
        ],
      },
    });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith(
        "/reportes/notificaciones-representante",
      );
    });
    expect(socketHandlers.has("new_alert")).toBe(true);
    expect(socketHandlers.has("parent_notification")).toBe(true);

    // Alerta de un niño ajeno no debe mostrarse
    act(() => {
      socketHandlers.get("new_alert")({
        id_alert: "AL_OTHER",
        nin_codi: "N999",
        nin_nomb: "Ajeno",
        est_dete: "SOBRECARGA",
      });
    });
    expect(mockShowToast).not.toHaveBeenCalled();

    // Alerta del niño propio sí se procesa
    act(() => {
      socketHandlers.get("new_alert")({
        id_alert: "AL_OWN",
        nin_codi: "N001",
        nin_nomb: "Leo",
        est_dete: "SOBRECARGA",
        bpm_max: 130,
      });
    });
    expect(mockShowToast).toHaveBeenCalled();

    // Cierre de sesión limpia notificaciones en pantalla
    act(() => {
      window.dispatchEvent(new CustomEvent("siat:session-ended"));
    });
    expect(screen.getByLabelText("Notificaciones").textContent).toBe("");
  });

  it("ESPECIALISTA carga /especialista/notificaciones y persiste lectura por usu_codi", async () => {
    setAuthSession({
      token: createMockJwt({ usu_codi: "U_ESP", rol_codi: "ROL_ESP" }),
    });
    mockGlobalState = {
      showToast: mockShowToast,
      userRole: "ESPECIALISTA",
      listaNinos: [{ nin_codi: "N002", nom_nino: "Sofía" }],
    };
    mockApiGet.mockResolvedValueOnce({
      data: {
        data: [
          {
            id: "home_B1",
            type: "home_crisis",
            nin_codi: "N002",
            nin_nomb: "Sofía",
            message: "🏡 Bitácora crítica en el hogar de Sofía",
            time: new Date().toISOString(),
          },
        ],
      },
    });

    render(<NotificationBell />);

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith("/especialista/notificaciones");
    });

    const bellBtn = screen.getByLabelText("Notificaciones");
    act(() => {
      bellBtn.click();
    });

    const item = await screen.findByText(
      /Bitácora crítica en el hogar de Sofía/i,
    );
    act(() => {
      item.click();
    });

    expect(loadReadNotificationIds("U_ESP").has("home_B1")).toBe(true);
  });
});
