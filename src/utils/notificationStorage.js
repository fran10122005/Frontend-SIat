import { getValidSession } from "./authStorage";

const LEGACY_KEYS = ["siat_notifications", "siat_local_alerts"];
const NOTIF_PREFIX = "siat_notifications_";
const LOCAL_ALERT_PREFIX = "siat_local_alerts_";
const READ_IDS_PREFIX = "siat_notif_read_";
const DISMISSED_IDS_PREFIX = "siat_notif_dismissed_";
const PREFS_KEY = "siat_notif_prefs";

const MAX_NOTIFICATIONS = 30;
const MAX_LOCAL_ALERTS = 50;
const MAX_TRACKED_IDS = 200;

export function getActiveNotificationUserId(overrideUserId) {
  if (overrideUserId) return String(overrideUserId);
  try {
    const session = getValidSession();
    if (session?.isValid && session?.decoded?.usu_codi) {
      return String(session.decoded.usu_codi);
    }
  } catch {}
  return null;
}

export function cleanupLegacyGlobalNotificationKeys() {
  try {
    if (typeof localStorage === "undefined") return;
    LEGACY_KEYS.forEach((key) => {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
      }
    });
  } catch {}
}

function readJsonList(key) {
  try {
    if (typeof localStorage === "undefined" || !key) return [];
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeJsonList(key, list, maxItems) {
  try {
    if (typeof localStorage === "undefined" || !key) return;
    const safeList = Array.isArray(list) ? list.slice(0, maxItems) : [];
    localStorage.setItem(key, JSON.stringify(safeList));
  } catch {}
}

export function loadUserNotifications(overrideUserId) {
  cleanupLegacyGlobalNotificationKeys();
  const usuCodi = getActiveNotificationUserId(overrideUserId);
  if (!usuCodi) return [];
  return readJsonList(`${NOTIF_PREFIX}${usuCodi}`);
}

export function saveUserNotifications(list, overrideUserId) {
  cleanupLegacyGlobalNotificationKeys();
  const usuCodi = getActiveNotificationUserId(overrideUserId);
  if (!usuCodi) return;
  writeJsonList(`${NOTIF_PREFIX}${usuCodi}`, list, MAX_NOTIFICATIONS);
}

export function appendUserNotification(notif, overrideUserId) {
  if (!notif || !notif.id) return [];
  const usuCodi = getActiveNotificationUserId(overrideUserId);
  if (!usuCodi) return [];
  const current = loadUserNotifications(usuCodi);
  const updated = [notif, ...current.filter((n) => n.id !== notif.id)].slice(
    0,
    MAX_NOTIFICATIONS,
  );
  saveUserNotifications(updated, usuCodi);
  return updated;
}

export function loadUserLocalAlerts(overrideUserId) {
  cleanupLegacyGlobalNotificationKeys();
  const usuCodi = getActiveNotificationUserId(overrideUserId);
  if (!usuCodi) return [];
  return readJsonList(`${LOCAL_ALERT_PREFIX}${usuCodi}`);
}

export function saveUserLocalAlerts(list, overrideUserId) {
  cleanupLegacyGlobalNotificationKeys();
  const usuCodi = getActiveNotificationUserId(overrideUserId);
  if (!usuCodi) return;
  writeJsonList(`${LOCAL_ALERT_PREFIX}${usuCodi}`, list, MAX_LOCAL_ALERTS);
}

export function appendUserLocalAlert(alert, overrideUserId) {
  if (!alert || !alert.id_alert) return [];
  const usuCodi = getActiveNotificationUserId(overrideUserId);
  if (!usuCodi) return [];
  const current = loadUserLocalAlerts(usuCodi);
  const updated = [
    alert,
    ...current.filter((a) => a.id_alert !== alert.id_alert),
  ].slice(0, MAX_LOCAL_ALERTS);
  saveUserLocalAlerts(updated, usuCodi);
  return updated;
}

export function loadReadNotificationIds(overrideUserId) {
  const usuCodi = getActiveNotificationUserId(overrideUserId);
  if (!usuCodi) return new Set();
  return new Set(readJsonList(`${READ_IDS_PREFIX}${usuCodi}`).map(String));
}

export function markNotificationIdsRead(ids, overrideUserId) {
  const usuCodi = getActiveNotificationUserId(overrideUserId);
  if (!usuCodi) return new Set();
  const incoming = Array.isArray(ids) ? ids : [ids];
  const merged = [
    ...new Set([
      ...readJsonList(`${READ_IDS_PREFIX}${usuCodi}`).map(String),
      ...incoming.filter(Boolean).map(String),
    ]),
  ].slice(-MAX_TRACKED_IDS);
  try {
    localStorage.setItem(
      `${READ_IDS_PREFIX}${usuCodi}`,
      JSON.stringify(merged),
    );
  } catch {}
  return new Set(merged);
}

export function loadDismissedNotificationIds(overrideUserId) {
  const usuCodi = getActiveNotificationUserId(overrideUserId);
  if (!usuCodi) return new Set();
  return new Set(readJsonList(`${DISMISSED_IDS_PREFIX}${usuCodi}`).map(String));
}

export function dismissNotificationIds(ids, overrideUserId) {
  const usuCodi = getActiveNotificationUserId(overrideUserId);
  if (!usuCodi) return new Set();
  const incoming = Array.isArray(ids) ? ids : [ids];
  const merged = [
    ...new Set([
      ...readJsonList(`${DISMISSED_IDS_PREFIX}${usuCodi}`).map(String),
      ...incoming.filter(Boolean).map(String),
    ]),
  ].slice(-MAX_TRACKED_IDS);
  try {
    localStorage.setItem(
      `${DISMISSED_IDS_PREFIX}${usuCodi}`,
      JSON.stringify(merged),
    );
  } catch {}
  return new Set(merged);
}

export function clearUserNotificationCache(overrideUserId) {
  cleanupLegacyGlobalNotificationKeys();
  const usuCodi = getActiveNotificationUserId(overrideUserId);
  if (!usuCodi || typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(`${NOTIF_PREFIX}${usuCodi}`);
  } catch {}
}

export function getNotificationPrefs() {
  try {
    if (typeof localStorage === "undefined") {
      return { alertas_push: true, recordatorios_sesiones: true };
    }
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { alertas_push: true, recordatorios_sesiones: true };
    return {
      alertas_push: true,
      recordatorios_sesiones: true,
      ...JSON.parse(raw),
    };
  } catch {
    return { alertas_push: true, recordatorios_sesiones: true };
  }
}
