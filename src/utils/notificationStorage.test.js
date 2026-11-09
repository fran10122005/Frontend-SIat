import { describe, it, expect, beforeEach } from "vitest";
import { setAuthSession } from "./authStorage";
import {
  loadUserNotifications,
  saveUserNotifications,
  appendUserNotification,
  loadUserLocalAlerts,
  appendUserLocalAlert,
  loadReadNotificationIds,
  markNotificationIdsRead,
  loadDismissedNotificationIds,
  dismissNotificationIds,
  cleanupLegacyGlobalNotificationKeys,
  clearUserNotificationCache,
} from "./notificationStorage";

function createMockJwt(payload) {
  const btoaFn = (str) => globalThis.btoa(str);
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${btoaFn(JSON.stringify({ alg: "HS256" }))}.${btoaFn(
    JSON.stringify({ exp, ...payload }),
  )}.sig`;
}

describe("notificationStorage — aislamiento multiusuario y limpieza legada", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("elimina claves globales legadas siat_notifications y siat_local_alerts", () => {
    localStorage.setItem("siat_notifications", JSON.stringify([{ id: "old" }]));
    localStorage.setItem(
      "siat_local_alerts",
      JSON.stringify([{ id_alert: "old_al" }]),
    );

    cleanupLegacyGlobalNotificationKeys();

    expect(localStorage.getItem("siat_notifications")).toBeNull();
    expect(localStorage.getItem("siat_local_alerts")).toBeNull();
  });

  it("aísla notificaciones y alertas locales por usu_codi", () => {
    setAuthSession({
      token: createMockJwt({ usu_codi: "U_ESP1", rol_codi: "ROL_ESP" }),
    });
    appendUserNotification({ id: "notif_esp_1", message: "Crisis niño 1" });
    appendUserLocalAlert({ id_alert: "al_esp_1", nin_codi: "N1" });

    // Cambiar a sesión de administrador en el mismo navegador
    setAuthSession({
      token: createMockJwt({ usu_codi: "U_ADM1", rol_codi: "ROL_ADM" }),
    });
    expect(loadUserNotifications()).toEqual([]);
    expect(loadUserLocalAlerts()).toEqual([]);

    saveUserNotifications([{ id: "notif_adm_1", message: "Auditoria" }]);
    expect(loadUserNotifications()).toHaveLength(1);
    expect(loadUserNotifications("U_ESP1")[0].id).toBe("notif_esp_1");
  });

  it("persiste IDs leídos y descartados de forma independiente por usuario", () => {
    markNotificationIdsRead(["A1", "A2"], "U_REP1");
    dismissNotificationIds(["A2"], "U_REP1");

    expect(loadReadNotificationIds("U_REP1").has("A1")).toBe(true);
    expect(loadDismissedNotificationIds("U_REP1").has("A2")).toBe(true);

    expect(loadReadNotificationIds("U_ESP1").size).toBe(0);
    expect(loadDismissedNotificationIds("U_ESP1").size).toBe(0);

    clearUserNotificationCache("U_REP1");
    expect(loadUserNotifications("U_REP1")).toEqual([]);
  });
});
