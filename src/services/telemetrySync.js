/**
 * Sincronizador en Segundo Plano de Telemetría SIAT
 * Lee registros locales de IndexedDB y los sincroniza hacia el backend SIAT
 * vía WebSocket (tiempo real) o REST API (resguardo/batch).
 */

import { getSocket } from "../hooks/socket";
import api from "../api/axios";
import {
  getUnsyncedTelemetry,
  markTelemetrySynced,
  cleanOldSyncedTelemetry,
  getTelemetryStats,
} from "./indexedDb";
import { getAuthToken, getSavedSelectedChild } from "../utils/authStorage";

let syncInterval = null;
let isSyncing = false;

/**
 * Ejecuta un ciclo de sincronización de registros pendientes
 */
export async function syncPendingTelemetry() {
  if (isSyncing) return;
  if (typeof navigator !== "undefined" && !navigator.onLine) return;

  const token = getAuthToken();
  if (!token) return; // Requiere sesión activa del especialista / representante

  isSyncing = true;
  try {
    const unsynced = await getUnsyncedTelemetry(25);
    if (!unsynced || unsynced.length === 0) {
      isSyncing = false;
      return;
    }

    const socket = getSocket();
    const isSocketReady = socket && socket.connected;
    const syncedIds = [];
    const savedChild = getSavedSelectedChild();

    for (const record of unsynced) {
      let sent = false;

      // 1. Prioridad: Vía WebSocket en tiempo real si el socket está conectado
      if (isSocketReady) {
        try {
          socket.emit("telemetry_data", {
            nin_codi: record.nin_codi || savedChild?.id || null,
            ses_codi: record.ses_codi || null,
            bpm: record.bpm,
            stress: record.stress,
            mov: record.mov,
            time: record.time,
            timestamp: record.timestamp,
            deviceName: record.deviceName,
            is_offline_sync: true,
          });
          sent = true;
        } catch (sockErr) {
          console.warn("Fallo al sincronizar registro por socket:", sockErr);
        }
      }

      // 2. Si no hay socket o si hay sesión formal registrada, intentar REST si ses_codi y con_codi existen
      if (!sent && record.ses_codi && record.con_codi) {
        try {
          await api.post("/monitoreo/telemetria", {
            ses_codi: record.ses_codi,
            con_codi: record.con_codi,
            tel_regi: record.bpm,
            tel_marc: record.timestamp,
            tel_mov: record.mov,
            tel_stress: record.stress,
            tel_calid: 95,
          });
          sent = true;
        } catch {
          // Si el backend responde error (ej. sesión cerrada o endpoint no disponible), continuar
        }
      } else if (sent) {
        // Marcado como enviado por socket
      }

      if (sent) {
        syncedIds.push(record.id);
      }
    }

    if (syncedIds.length > 0) {
      await markTelemetrySynced(syncedIds);
      const stats = await getTelemetryStats();

      // Notificar a la UI del progreso de sincronización
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("siat:telemetry-sync-status", {
            detail: {
              syncedCount: syncedIds.length,
              remainingUnsynced: stats.unsynced,
              total: stats.total,
            },
          }),
        );
      }
    }

    // Limpieza esporádica de datos antiguos
    cleanOldSyncedTelemetry(7).catch(() => {});
  } catch (err) {
    console.error("Error durante sincronización de telemetría:", err);
  } finally {
    isSyncing = false;
  }
}

/**
 * Inicia el cron/worker de sincronización periódica
 */
export function startTelemetrySync(intervalMs = 12000) {
  if (syncInterval) return;

  // Ejecutar un intento inmediato
  syncPendingTelemetry();

  // Escuchar eventos de red del navegador y de la app
  if (typeof window !== "undefined") {
    window.addEventListener("online", syncPendingTelemetry);
    window.addEventListener("siat:online", syncPendingTelemetry);
  }

  syncInterval = setInterval(() => {
    syncPendingTelemetry();
  }, intervalMs);
}

/**
 * Detiene el sincronizador
 */
export function stopTelemetrySync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
  if (typeof window !== "undefined") {
    window.removeEventListener("online", syncPendingTelemetry);
    window.removeEventListener("siat:online", syncPendingTelemetry);
  }
}

/**
 * Forzar sincronización manual inmediata
 */
export function triggerManualSync() {
  return syncPendingTelemetry();
}
