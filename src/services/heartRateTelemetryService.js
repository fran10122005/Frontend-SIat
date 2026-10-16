/**
 * HeartRateTelemetryService - Servicio Unificado de Telemetría Cardíaca para SIAT
 *
 * Implementa una Arquitectura Híbrida de Captura de BPM para smartwatches y sensores:
 *  - Vía A: Modo Tiempo Real por Bluetooth Low Energy (BLE Estándar GATT 0x180D / 0x2A37 y OEM)
 *  - Vía B: Modo Puente Universal vía Android Health Connect (Samsung Health, Zepp, Da Fit, VeryFit, etc.)
 *
 * Interfaz Estandarizada emitida:
 *  {
 *    bpm: number,
 *    timestamp: string, // Formato ISO 8601
 *    source: 'BLE_DIRECT' | 'HEALTH_CONNECT',
 *    deviceName?: string,
 *    stress?: number,
 *    mov?: number,
 *    time?: string
 *  }
 */

import { Capacitor } from "@capacitor/core";
import {
  BleClient,
  numbersToDataView,
} from "@capacitor-community/bluetooth-le";
import { Health } from "@capgo/capacitor-health";
import { getSocket } from "../hooks/socket";
import { saveTelemetry } from "./indexedDb";
import { getSavedSelectedChild } from "../utils/authStorage";

// Constantes oficiales Bluetooth SIG
export const BLE_SIG_HEART_RATE_SERVICE =
  "0000180d-0000-1000-8000-00805f9b34fb"; // 0x180D
export const BLE_SIG_HEART_RATE_MEASUREMENT =
  "00002a37-0000-1000-8000-00805f9b34fb"; // 0x2A37
export const BLE_SIG_HEART_RATE_CONTROL_POINT =
  "00002a39-0000-1000-8000-00805f9b34fb"; // 0x2A39
export const BLE_SIG_BATTERY_SERVICE = "0000180f-0000-1000-8000-00805f9b34fb";
export const BLE_SIG_BATTERY_LEVEL = "00002a19-0000-1000-8000-00805f9b34fb";

// Lista ampliada de servicios conocidos para detección de relojes OEM (Aiwa, Fitpro, Da Fit, Wearfit, Jieli, etc.)
export const EXTENDED_BLE_SERVICES = [
  BLE_SIG_HEART_RATE_SERVICE,
  BLE_SIG_BATTERY_SERVICE,
  "0000180a-0000-1000-8000-00805f9b34fb", // Device Info
  "00000a00-0000-1000-8000-00805f9b34fb", // IDO / VeryFit
  "0000fee0-0000-1000-8000-00805f9b34fb", // Moyoung / DaFit
  "0000fff0-0000-1000-8000-00805f9b34fb", // Fitpro / HryFine / Qwatch
  "0000feea-0000-1000-8000-00805f9b34fb",
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART
];

// Parser estándar Bluetooth SIG para Heart Rate Measurement (0x2A37)
export function parseBluetoothSigHeartRate(dataView) {
  if (!dataView || dataView.byteLength < 2) return null;

  try {
    const flags = dataView.getUint8(0);
    // Bit 0: 0 = UINT8 (1 byte en offset 1), 1 = UINT16 (2 bytes Little-Endian en offset 1 y 2)
    const is16Bit = (flags & 0x01) !== 0;

    let bpm = 0;
    if (is16Bit) {
      if (dataView.byteLength >= 3) {
        bpm = dataView.getUint16(1, true); // true = Little-Endian
      } else {
        return null;
      }
    } else {
      bpm = dataView.getUint8(1);
    }

    if (bpm >= 35 && bpm <= 240) {
      return bpm;
    }
    return null;
  } catch (e) {
    console.warn("Fallo en parseBluetoothSigHeartRate:", e);
    return null;
  }
}

// Parser adaptativo secundario para relojes OEM (Da Fit, Fitpro, Aiwa, Wearfit) cuando el paquete no es 0x2A37 estándar
export function parseOemHeartRateBytes(dataView) {
  if (!dataView || dataView.byteLength < 2) return null;
  const bytes = new Uint8Array(
    dataView.buffer,
    dataView.byteOffset || 0,
    dataView.byteLength,
  );

  // Da Fit / Moyoung / Oplayer
  if ((bytes[0] === 0x04 || bytes[0] === 0x05) && bytes.length >= 3) {
    if (bytes[2] >= 45 && bytes[2] <= 215) return bytes[2];
    if (bytes[1] >= 45 && bytes[1] <= 215) return bytes[1];
  }

  // Fitpro / HryFine: [0xCD, 0x00, 0x02, bpm, ...]
  if (bytes[0] === 0xcd && bytes.length >= 4) {
    if (bytes[3] >= 45 && bytes[3] <= 215) return bytes[3];
    if (bytes[2] >= 45 && bytes[2] <= 215) return bytes[2];
  }

  // Wearfit / Wearfit Pro
  if (bytes[0] === 0xab && bytes.length >= 4) {
    for (let i = 2; i < bytes.length; i++) {
      if (
        bytes[i] >= 45 &&
        bytes[i] <= 215 &&
        bytes[i] !== 0x31 &&
        bytes[i] !== 0x32
      ) {
        return bytes[i];
      }
    }
  }

  // Qwatch / Umeox: [0xBA, ...]
  if (bytes[0] === 0xba && bytes.length >= 3) {
    for (let i = 2; i < bytes.length; i++) {
      if (bytes[i] >= 45 && bytes[i] <= 215) return bytes[i];
    }
  }

  return null;
}

// Convertidor genérico de fuentes a DataView
function toDataView(source) {
  if (!source) return null;
  if (source instanceof DataView) return source;
  if (source.buffer instanceof ArrayBuffer) {
    return new DataView(
      source.buffer,
      source.byteOffset || 0,
      source.byteLength,
    );
  }
  if (source?.target?.value instanceof DataView) return source.target.value;
  if (source?.value instanceof DataView) return source.value;
  return null;
}

class HeartRateTelemetryServiceImpl {
  constructor() {
    this.listeners = new Set();
    this.statusListeners = new Set();
    this.lastReading = null;
    this.activeSource = "NONE"; // 'NONE' | 'BLE_DIRECT' | 'HEALTH_CONNECT'

    // Estado BLE
    this.bleDevice = null;
    this.bleConnected = false;
    this.bleConnecting = false;
    this.bleAutoReconnect = true;
    this.bleReconnectAttempts = 0;
    this.bleReconnectTimer = null;
    this.bleLastDeviceId = null;
    this.bleLastDeviceName = null;

    // Estado Health Connect
    this.healthConnectAvailable = false;
    this.healthConnectAuthorized = false;
    this.healthConnectPolling = false;
    this.healthConnectIntervalId = null;
    this.healthConnectIntervalSeconds = 25; // 25s polling
    this.processedSampleTimestamps = new Set();
    this.lastHealthConnectFetchTime = null;

    // Control de nube y sesiones
    this.streamToCloud = true;
    this.activeSessionId = null;
    this.lastDispatchedTs = 0;
  }

  // --- REGISTRO DE EVENTOS Y CALLBACKS ---
  onReading(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  notifyStatus(extra = {}) {
    const status = {
      activeSource: this.activeSource,
      bleConnected: this.bleConnected,
      bleConnecting: this.bleConnecting,
      bleDeviceName: this.bleDevice?.name || this.bleLastDeviceName || null,
      healthConnectAvailable: this.healthConnectAvailable,
      healthConnectAuthorized: this.healthConnectAuthorized,
      healthConnectPolling: this.healthConnectPolling,
      lastReading: this.lastReading,
      ...extra,
    };
    for (const listener of this.statusListeners) {
      try {
        listener(status);
      } catch (err) {
        console.warn("Error en listener de status:", err);
      }
    }
  }

  setActiveSessionId(sessionId) {
    this.activeSessionId = sessionId;
  }

  setStreamToCloud(enabled) {
    this.streamToCloud = Boolean(enabled);
  }

  getLastReading() {
    return this.lastReading;
  }

  getActiveSource() {
    return this.activeSource;
  }

  // --- DISPATCHER CENTRAL DE TELEMETRÍA ---
  dispatchReading({ bpm, timestamp, source, deviceName, stress, mov }) {
    if (!bpm || isNaN(bpm) || bpm <= 0) return;

    const isoTimestamp = timestamp || new Date().toISOString();
    const timeStr = new Date(isoTimestamp).toLocaleTimeString("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const calculatedStress =
      stress !== undefined
        ? Number(stress)
        : Math.min(100, Math.max(5, Math.round(((bpm - 60) / 70) * 100)));
    const calculatedMov = mov !== undefined ? Number(mov) : 1.0;

    const standardized = {
      bpm: Math.round(bpm),
      timestamp: isoTimestamp,
      source, // 'BLE_DIRECT' | 'HEALTH_CONNECT'
      deviceName:
        deviceName ||
        (source === "BLE_DIRECT" ? "Smartwatch BLE" : "Health Connect"),
      stress: calculatedStress,
      mov: calculatedMov,
      time: timeStr,
    };

    this.lastReading = standardized;
    this.activeSource = source;

    // 1. Guardar localmente en IndexedDB (100% offline-first)
    const child = getSavedSelectedChild();
    saveTelemetry({
      bpm: standardized.bpm,
      stress: standardized.stress,
      mov: standardized.mov,
      time: standardized.time,
      timestamp: standardized.timestamp,
      deviceName: standardized.deviceName,
      nin_codi: child?.id || null,
      ses_codi: this.activeSessionId || null,
      source: standardized.source,
    }).catch((e) =>
      console.warn("Error guardando telemetría en IndexedDB:", e),
    );

    // 2. Transmisión al WebSocket y REST si corresponde
    if (this.streamToCloud) {
      const now = Date.now();
      // Throttling mínimo de 250ms para evitar saturación de red
      if (now - this.lastDispatchedTs > 250) {
        this.lastDispatchedTs = now;
        try {
          const socket = getSocket();
          if (socket && socket.connected) {
            socket.emit("telemetry_data", {
              nin_codi: child?.id || null,
              ses_codi: this.activeSessionId || null,
              bpm: standardized.bpm,
              stress: standardized.stress,
              mov: standardized.mov,
              time: standardized.time,
              timestamp: standardized.timestamp,
              deviceName: standardized.deviceName,
              source: standardized.source,
            });
          }
        } catch (sockErr) {
          console.warn("Error al emitir socket de telemetría:", sockErr);
        }

        // Si hay una sesión activa, enviar por REST como respaldo
        if (this.activeSessionId) {
          try {
            const token = localStorage.getItem("token");
            const headers = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            fetch(
              "https://backend-siat.onrender.com/api/monitoreo/telemetria",
              {
                method: "POST",
                headers,
                body: JSON.stringify({
                  ses_codi: this.activeSessionId,
                  con_codi: "CONF_STD",
                  tel_regi: standardized.bpm,
                  tel_marc: Math.floor(Date.now() / 1000),
                  tel_stress: standardized.stress,
                  tel_mov: standardized.mov,
                  source: standardized.source,
                }),
              },
            ).catch(() => {});
          } catch {}
        }
      }
    }

    // 3. Notificar a todos los suscriptores UI en la app
    for (const listener of this.listeners) {
      try {
        listener(standardized);
      } catch (err) {
        console.warn("Error en listener de telemetría:", err);
      }
    }

    // 4. Disparar CustomEvent global en window
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("siat:heartrate-reading", { detail: standardized }),
      );
    }

    this.notifyStatus();
  }

  // =========================================================================
  // VÍA A: MODO TIEMPO REAL POR BLUETOOTH DIRECTO (BLE GATT 0x180D / 0x2A37)
  // =========================================================================

  async checkBlePrerequisites() {
    if (!Capacitor.isNativePlatform()) {
      return typeof navigator !== "undefined" && "bluetooth" in navigator;
    }

    try {
      await BleClient.initialize();
      const isEnabled = await BleClient.isEnabled();
      if (!isEnabled) {
        await BleClient.requestEnable();
      }
      return true;
    } catch (err) {
      console.warn("Fallo verificando prerrequisitos BLE:", err);
      return false;
    }
  }

  async connectBleDevice() {
    this.bleConnecting = true;
    this.notifyStatus({ bleStage: "scanning" });

    try {
      if (Capacitor.isNativePlatform()) {
        await BleClient.initialize();

        // 1. Verificar Bluetooth activo
        const isBtEnabled = await BleClient.isEnabled();
        if (!isBtEnabled) {
          await BleClient.requestEnable();
        }

        // 2. Escaneo buscando Heart Rate Service (0x180D) y servicios OEM compatibles
        this.notifyStatus({ bleStage: "request_device" });
        const device = await BleClient.requestDevice({
          optionalServices: EXTENDED_BLE_SERVICES,
        });

        if (!device) {
          this.bleConnecting = false;
          this.notifyStatus({ bleStage: null });
          return null;
        }

        this.bleDevice = device;
        this.bleLastDeviceId = device.deviceId;
        this.bleLastDeviceName = device.name || "Smartwatch BLE";

        return await this._establishBleGattConnection(device.deviceId);
      } else {
        // En entorno Web (Chrome / Edge en PC para pruebas)
        if (!navigator.bluetooth) {
          throw new Error("WebBluetooth no está soportado en este navegador.");
        }

        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: EXTENDED_BLE_SERVICES,
        });

        this.bleDevice = device;
        this.bleLastDeviceId = device.id;
        this.bleLastDeviceName = device.name || "Smartwatch BLE Web";

        device.addEventListener("gattserverdisconnected", () => {
          this._handleBleDisconnected();
        });

        this.notifyStatus({ bleStage: "connecting_gatt" });
        const server = await device.gatt.connect();

        this.notifyStatus({ bleStage: "subscribing" });
        await this._subscribeWebBleHeartRate(server);

        this.bleConnected = true;
        this.bleConnecting = false;
        this.activeSource = "BLE_DIRECT";
        this.notifyStatus({ bleStage: "ready" });

        return device;
      }
    } catch (err) {
      this.bleConnecting = false;
      this.bleConnected = false;
      this.notifyStatus({ bleStage: null, bleError: err.message });
      throw err;
    }
  }

  async _establishBleGattConnection(deviceId) {
    this.notifyStatus({ bleStage: "connecting_gatt" });

    // Desconectar previamente para limpiar socket nativo y evitar error GATT 133
    try {
      await BleClient.disconnect(deviceId);
    } catch {}
    await new Promise((r) => setTimeout(r, 300));

    // Conectar con callback de desconexión
    await BleClient.connect(deviceId, () => {
      this._handleBleDisconnected();
    });

    this.notifyStatus({ bleStage: "discovering_services" });
    const services = await BleClient.getServices(deviceId);
    console.log("Servicios BLE descubiertos en dispositivo:", services);

    // Suscribir a Heart Rate Measurement (0x2A37) o características notificables
    let subscribedToHr = false;

    for (const service of services) {
      if (!service.characteristics) continue;

      const isHrService =
        service.uuid.toLowerCase().includes("180d") ||
        service.uuid.toLowerCase() === BLE_SIG_HEART_RATE_SERVICE;

      for (const char of service.characteristics) {
        const isHrChar =
          char.uuid.toLowerCase().includes("2a37") ||
          char.uuid.toLowerCase() === BLE_SIG_HEART_RATE_MEASUREMENT;

        if (
          isHrChar ||
          (isHrService &&
            (char.properties?.notify || char.properties?.indicate))
        ) {
          try {
            await BleClient.startNotifications(
              deviceId,
              service.uuid,
              char.uuid,
              (rawVal) => {
                this._processBlePacket(rawVal, this.bleLastDeviceName);
              },
            );
            subscribedToHr = true;
            console.log(
              `Suscrito con éxito al canal estándar HR: ${char.uuid}`,
            );
            break;
          } catch (e) {
            console.warn(
              `Error al suscribir a característica HR ${char.uuid}:`,
              e,
            );
          }
        }
      }
      if (subscribedToHr) break;
    }

    // Si el reloj no expuso el servicio 0x180D estándar (reloj OEM cerrado como Aiwa o Fitpro),
    // suscribir a todas las características notificables para capturar telemetría adaptativa
    if (!subscribedToHr) {
      console.log(
        "Servicio 0x180D no detectado de forma directa. Activando modo adaptativo OEM...",
      );
      for (const s of services) {
        if (!s.characteristics) continue;
        for (const c of s.characteristics) {
          if (c.properties?.notify || c.properties?.indicate) {
            try {
              await BleClient.startNotifications(
                deviceId,
                s.uuid,
                c.uuid,
                (rawVal) => {
                  this._processBlePacket(rawVal, this.bleLastDeviceName);
                },
              );
              await new Promise((r) => setTimeout(r, 40));
            } catch {}
          }
          // Enviar comando suave de encendido de sensor si es canal de escritura
          if (c.properties?.writeWithoutResponse) {
            try {
              const startTriggers = [
                [0x04, 0x01, 0x01],
                [0xcd, 0x00, 0x01, 0x01],
                [0xba, 0x01, 0x01],
                [0x01],
              ];
              for (const cmd of startTriggers) {
                await BleClient.writeWithoutResponse(
                  deviceId,
                  s.uuid,
                  c.uuid,
                  numbersToDataView(cmd),
                );
                await new Promise((r) => setTimeout(r, 20));
              }
            } catch {}
          }
        }
      }
    }

    this.bleConnected = true;
    this.bleConnecting = false;
    this.bleReconnectAttempts = 0;
    this.activeSource = "BLE_DIRECT";
    this.notifyStatus({ bleStage: "ready" });

    return this.bleDevice;
  }

  async _subscribeWebBleHeartRate(server) {
    try {
      const hrService = await server.getPrimaryService(
        BLE_SIG_HEART_RATE_SERVICE,
      );
      const hrChar = await hrService.getCharacteristic(
        BLE_SIG_HEART_RATE_MEASUREMENT,
      );
      await hrChar.startNotifications();
      hrChar.addEventListener("characteristicvaluechanged", (event) => {
        this._processBlePacket(event.target.value, this.bleLastDeviceName);
      });
      return;
    } catch {
      // Intentar suscripción abierta en Web
      const services = await server.getPrimaryServices();
      for (const s of services) {
        try {
          const chars = await s.getCharacteristics();
          for (const c of chars) {
            if (c.properties.notify || c.properties.indicate) {
              await c.startNotifications();
              c.addEventListener("characteristicvaluechanged", (ev) => {
                this._processBlePacket(ev.target.value, this.bleLastDeviceName);
              });
            }
          }
        } catch {}
      }
    }
  }

  _processBlePacket(rawEvent, deviceName) {
    const dataView = toDataView(rawEvent);
    if (!dataView) return;

    // 1. Intentar parser oficial Bluetooth SIG (0x2A37)
    let parsedBpm = parseBluetoothSigHeartRate(dataView);

    // 2. Si no es formato estándar SIG, intentar parser adaptativo OEM
    if (!parsedBpm) {
      parsedBpm = parseOemHeartRateBytes(dataView);
    }

    if (parsedBpm && parsedBpm >= 40 && parsedBpm <= 220) {
      this.dispatchReading({
        bpm: parsedBpm,
        timestamp: new Date().toISOString(),
        source: "BLE_DIRECT",
        deviceName: deviceName || "Smartwatch BLE",
        mov: 1.0,
      });
    }
  }

  _handleBleDisconnected() {
    console.warn("Dispositivo BLE desconectado.");
    this.bleConnected = false;
    this.bleConnecting = false;

    if (this.activeSource === "BLE_DIRECT") {
      this.activeSource = "NONE";
    }

    this.notifyStatus({ bleStage: "disconnected" });

    // Reconexión automática si el niño se aleja y se pierde señal
    if (
      this.bleAutoReconnect &&
      this.bleLastDeviceId &&
      this.bleReconnectAttempts < 5
    ) {
      const delay = Math.min(
        10000,
        2000 * Math.pow(1.5, this.bleReconnectAttempts),
      );
      this.bleReconnectAttempts++;
      console.log(
        `Intento de reconexión BLE ${this.bleReconnectAttempts}/5 en ${Math.round(delay / 1000)}s...`,
      );
      this.notifyStatus({
        bleStage: "reconnecting",
        attempt: this.bleReconnectAttempts,
      });

      clearTimeout(this.bleReconnectTimer);
      this.bleReconnectTimer = setTimeout(() => {
        if (
          !this.bleConnected &&
          this.bleLastDeviceId &&
          Capacitor.isNativePlatform()
        ) {
          this._establishBleGattConnection(this.bleLastDeviceId).catch((e) => {
            console.warn("Reintento fallido de conexión BLE:", e);
          });
        }
      }, delay);
    }
  }

  async disconnectBle() {
    this.bleAutoReconnect = false;
    clearTimeout(this.bleReconnectTimer);

    if (Capacitor.isNativePlatform() && this.bleLastDeviceId) {
      try {
        await BleClient.disconnect(this.bleLastDeviceId);
      } catch {}
    } else if (this.bleDevice?.gatt?.connected) {
      this.bleDevice.gatt.disconnect();
    }

    this.bleConnected = false;
    this.bleConnecting = false;
    this.bleDevice = null;
    if (this.activeSource === "BLE_DIRECT") {
      this.activeSource = "NONE";
    }
    this.notifyStatus({ bleStage: null });
  }

  // =========================================================================
  // VÍA B: MODO PUENTE UNIVERSAL VÍA ANDROID HEALTH CONNECT
  // =========================================================================

  /**
   * Comprueba si Health Connect está disponible y soportado en el dispositivo actual
   */
  async checkHealthConnectAvailability() {
    if (!Capacitor.isNativePlatform()) {
      this.healthConnectAvailable = false;
      this.notifyStatus();
      return {
        available: false,
        platform: "web",
        reason:
          "Health Connect solo está disponible en dispositivos Android nativos.",
      };
    }

    try {
      const result = await Health.isAvailable();
      this.healthConnectAvailable = Boolean(result.available);
      this.notifyStatus();
      return result;
    } catch (err) {
      console.warn("Error comprobando Health Connect:", err);
      this.healthConnectAvailable = false;
      this.notifyStatus();
      return {
        available: false,
        platform: "android",
        reason: err.message || "No se pudo consultar el SDK de Health Connect.",
      };
    }
  }

  /**
   * Abre la pantalla del sistema de Ajustes o Instalación de Health Connect
   */
  async openHealthConnectSettings() {
    try {
      await Health.openHealthConnectSettings();
    } catch (err) {
      console.warn("No se pudo abrir Ajustes de Health Connect:", err);
      if (typeof window !== "undefined") {
        window.open(
          "https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata",
          "_system",
        );
      }
    }
  }

  /**
   * Solicita permisos de lectura de frecuencia cardíaca (READ_HEART_RATE) al padre/representante
   */
  async requestHealthConnectPermissions() {
    if (!Capacitor.isNativePlatform()) {
      throw new Error(
        "Health Connect requiere ejecutarse en la APK de Android.",
      );
    }

    try {
      const auth = await Health.requestAuthorization({
        read: ["heartRate"],
      });

      const granted =
        Array.isArray(auth.readAuthorized) &&
        auth.readAuthorized.includes("heartRate");

      this.healthConnectAuthorized = granted;
      this.notifyStatus();
      return granted;
    } catch (err) {
      console.error("Error solicitando permisos de Health Connect:", err);
      this.healthConnectAuthorized = false;
      this.notifyStatus();
      throw err;
    }
  }

  /**
   * Comprueba si los permisos de lectura de Heart Rate ya están concedidos
   */
  async checkHealthConnectPermissions() {
    if (!Capacitor.isNativePlatform()) return false;
    try {
      const auth = await Health.checkAuthorization({
        read: ["heartRate"],
      });
      const isGranted =
        Array.isArray(auth.readAuthorized) &&
        auth.readAuthorized.includes("heartRate");
      this.healthConnectAuthorized = isGranted;
      this.notifyStatus();
      return isGranted;
    } catch (err) {
      console.warn("Error verificando autorización Health Connect:", err);
      return false;
    }
  }

  /**
   * Consulta los registros de HeartRateRecord de los últimos minutos en Health Connect
   * y los extrae deduplicando contra lecturas ya procesadas.
   * Retorna objeto con { newReadings, totalSamplesFound, lastSample }
   */
  async fetchHealthConnectHeartRate(minutesBack = 20) {
    if (!Capacitor.isNativePlatform()) {
      return {
        newReadings: [],
        totalSamplesFound: 0,
        lastSample: null,
      };
    }

    try {
      const now = new Date();
      const startDate = new Date(
        now.getTime() - minutesBack * 60 * 1000,
      ).toISOString();
      const endDate = now.toISOString();

      const result = await Health.readSamples({
        dataType: "heartRate",
        startDate,
        endDate,
        limit: 50,
        ascending: true,
      });

      const samples = result?.samples || [];
      const newReadings = [];

      for (const sample of samples) {
        const uniqueKey = `${sample.platformId || ""}_${sample.startDate}_${sample.value}`;

        if (!this.processedSampleTimestamps.has(uniqueKey)) {
          this.processedSampleTimestamps.add(uniqueKey);

          // Limitar tamaño del cache de deduplicación
          if (this.processedSampleTimestamps.size > 2000) {
            const arr = Array.from(this.processedSampleTimestamps);
            this.processedSampleTimestamps = new Set(
              arr.slice(arr.length - 1000),
            );
          }

          const reading = {
            bpm: Math.round(sample.value),
            timestamp: sample.startDate,
            source: "HEALTH_CONNECT",
            deviceName: sample.sourceName || "Health Connect (Smartwatch)",
            mov: 1.0,
          };

          newReadings.push(reading);
          this.dispatchReading(reading);
        }
      }

      this.lastHealthConnectFetchTime = new Date().toISOString();

      let latestSample = null;
      if (samples.length > 0) {
        const sorted = [...samples].sort(
          (a, b) => new Date(b.startDate) - new Date(a.startDate),
        );
        const s = sorted[0];
        latestSample = {
          bpm: Math.round(s.value),
          timestamp: s.startDate,
          sourceName: s.sourceName || "Health Connect",
        };
      }

      return {
        newReadings,
        totalSamplesFound: samples.length,
        lastSample:
          latestSample ||
          (newReadings.length > 0 ? newReadings[newReadings.length - 1] : null),
      };
    } catch (err) {
      console.warn("Error leyendo samples de Health Connect:", err);
      return {
        newReadings: [],
        totalSamplesFound: 0,
        lastSample: null,
        error: err.message,
      };
    }
  }

  /**
   * Simula la inyección de un lote de lecturas de Health Connect para pruebas de desarrollo
   * Inyecta 3 lecturas escalonadas (hace 3m, 2m, 1m) con source: 'HEALTH_CONNECT'
   */
  simulateHealthConnectBatch(
    bpmValues = [78, 85, 92],
    customDeviceName = "Simulador Health Connect (Test)",
  ) {
    const now = Date.now();
    const injected = [];

    bpmValues.forEach((bpm, index) => {
      const minutesAgo = bpmValues.length - index;
      const sampleTs = new Date(now - minutesAgo * 60 * 1000).toISOString();
      const reading = {
        bpm: Number(bpm),
        timestamp: sampleTs,
        source: "HEALTH_CONNECT",
        deviceName: customDeviceName,
        mov: 1.0,
      };
      this.dispatchReading(reading);
      injected.push(reading);
    });

    this.notifyStatus({
      activeSource: "HEALTH_CONNECT",
      lastHealthConnectSyncCount: injected.length,
    });

    return {
      newReadings: injected,
      totalSamplesFound: injected.length,
      lastSample: injected[injected.length - 1],
    };
  }

  /**
   * Inicia el ciclo periódico de sincronización automática de Health Connect
   */
  startHealthConnectPolling(intervalSeconds = 25) {
    this.healthConnectIntervalSeconds = intervalSeconds;
    this.stopHealthConnectPolling();

    this.healthConnectPolling = true;
    this.notifyStatus();

    // Consulta inicial inmediata
    this.fetchHealthConnectHeartRate(30).catch(() => {});

    this.healthConnectIntervalId = setInterval(() => {
      this.fetchHealthConnectHeartRate(15).catch((err) => {
        console.warn("Fallo en ciclo de polling Health Connect:", err);
      });
    }, intervalSeconds * 1000);
  }

  /**
   * Detiene el polling de Health Connect
   */
  stopHealthConnectPolling() {
    if (this.healthConnectIntervalId) {
      clearInterval(this.healthConnectIntervalId);
      this.healthConnectIntervalId = null;
    }
    this.healthConnectPolling = false;
    if (this.activeSource === "HEALTH_CONNECT") {
      this.activeSource = "NONE";
    }
    this.notifyStatus();
  }
}

// Exportar instancia singleton
export const HeartRateTelemetryService = new HeartRateTelemetryServiceImpl();
export default HeartRateTelemetryService;
