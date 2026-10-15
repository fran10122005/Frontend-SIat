/**
 * IndexedDB Service para Almacenamiento Local Offline de Telemetría SIAT
 * Almacena lecturas biométricas reales del smartwatch de forma persistente.
 * Funciona 100% offline y permite sincronización posterior con el backend.
 */

const DB_NAME = "siat_telemetry_db";
const DB_VERSION = 1;
const STORE_NAME = "telemetry_records";

let dbInstance = null;

/**
 * Abre y prepara la base de datos IndexedDB
 */
export function openTelemetryDb() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB no soportado en este entorno"));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("synced", "synced", { unique: false });
        store.createIndex("ses_codi", "ses_codi", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error("Error abriendo IndexedDB SIAT:", event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Guarda una lectura biométrica en IndexedDB
 * @param {Object} data - Objeto con datos de telemetría { bpm, stress, mov, nin_codi, ses_codi, deviceName, time }
 */
export async function saveTelemetry(data) {
  try {
    const db = await openTelemetryDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      const record = {
        bpm: Number(data.bpm) || 0,
        stress: Number(data.stress) || 0,
        mov: Number(data.mov) || 1.0,
        timestamp: data.timestamp || Date.now(),
        time:
          data.time ||
          new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        deviceName: data.deviceName || "Smartwatch BLE",
        nin_codi: data.nin_codi || null,
        ses_codi: data.ses_codi || null,
        synced: 0, // 0 = no sincronizado, 1 = sincronizado
        createdAt: new Date().toISOString(),
      };

      const req = store.add(record);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn("No se pudo guardar telemetría en IndexedDB:", err);
    return null;
  }
}

/**
 * Obtiene registros no sincronizados
 * @param {number} limit - Cantidad máxima de registros a recuperar
 */
export async function getUnsyncedTelemetry(limit = 50) {
  try {
    const db = await openTelemetryDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("synced");
      const request = index.getAll(0); // 0 = no sincronizado

      request.onsuccess = () => {
        const results = request.result || [];
        resolve(results.slice(0, limit));
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Error obteniendo telemetría no sincronizada:", err);
    return [];
  }
}

/**
 * Marca una lista de registros por ID como sincronizados
 * @param {number[]} ids - Array de IDs de registros
 */
export async function markTelemetrySynced(ids) {
  if (!ids || ids.length === 0) return;
  try {
    const db = await openTelemetryDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);

      ids.forEach((id) => {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          if (getReq.result) {
            const updated = { ...getReq.result, synced: 1 };
            store.put(updated);
          }
        };
      });

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error("Error marcando telemetría como sincronizada:", err);
  }
}

/**
 * Obtiene el historial reciente para gráficos locales (últimos N registros)
 * @param {number} limit
 */
export async function getRecentTelemetry(limit = 30) {
  try {
    const db = await openTelemetryDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.openCursor(null, "prev"); // Orden descendente
      const results = [];

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && results.length < limit) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results.reverse()); // Devolver cronológico
        }
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("Error leyendo historial de telemetría:", err);
    return [];
  }
}

/**
 * Retorna estadísticas de telemetría local
 */
export async function getTelemetryStats() {
  try {
    const db = await openTelemetryDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const countReq = store.count();
      const unsyncedIndex = store.index("synced");
      const unsyncedReq = unsyncedIndex.count(0);

      tx.oncomplete = () => {
        resolve({
          total: countReq.result || 0,
          unsynced: unsyncedReq.result || 0,
        });
      };
      tx.onerror = () => resolve({ total: 0, unsynced: 0 });
    });
  } catch {
    return { total: 0, unsynced: 0 };
  }
}

/**
 * Limpia registros sincronizados con más de N días de antigüedad
 * @param {number} days
 */
export async function cleanOldSyncedTelemetry(days = 7) {
  try {
    const db = await openTelemetryDb();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("timestamp");
    const KeyRange =
      typeof window !== "undefined"
        ? window.IDBKeyRange || window.webkitIDBKeyRange
        : null;
    const range = KeyRange ? KeyRange.upperBound(cutoff) : null;

    const req = range ? index.openCursor(range) : index.openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        if (cursor.value.synced === 1) {
          store.delete(cursor.primaryKey);
        }
        cursor.continue();
      }
    };
  } catch (err) {
    console.warn("Error en limpieza de telemetría antigua:", err);
  }
}
