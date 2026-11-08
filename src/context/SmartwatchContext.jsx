import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  getSocket,
  subscribeToSocket,
  getSocketConnectionState,
} from "../hooks/socket";
import { getSavedSelectedChild } from "../utils/authStorage";
import { saveTelemetry } from "../services/indexedDb";
import {
  startTelemetrySync,
  stopTelemetrySync,
} from "../services/telemetrySync";
import { Capacitor } from "@capacitor/core";
import {
  BleClient,
  numbersToDataView,
} from "@capacitor-community/bluetooth-le";
import HeartRateTelemetryService, {
  parseBluetoothSigHeartRate,
  parseOemHeartRateBytes,
} from "../services/heartRateTelemetryService";

const SmartwatchContext = createContext();

export const useSmartwatch = () => {
  const context = useContext(SmartwatchContext);
  if (!context) {
    throw new Error(
      "useSmartwatch debe ser usado dentro de un SmartwatchProvider",
    );
  }
  return context;
};

const STORAGE_KEY_DEVICE = "siat_smartwatch_device";
const STORAGE_KEY_CONNECTED = "siat_smartwatch_connected";
const STORAGE_KEY_BATTERY = "siat_smartwatch_battery";
const STORAGE_KEY_STREAM = "siat_smartwatch_stream";

// Helper robusto para convertir hex string a DataView
function hexStringToDataView(hexString) {
  if (!hexString || typeof hexString !== "string")
    return new DataView(new ArrayBuffer(0));
  const clean = hexString.replace(/[^0-9a-fA-F]/g, "");
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = parseInt(clean.substring(i, i + 2), 16);
  }
  return new DataView(bytes.buffer);
}

// UUIDs de servicios BLE conocidos en formato estándar estricto de 128-bit (compatible con WebBluetooth y BleClient)
const KNOWN_SERVICES = [
  "0000180d-0000-1000-8000-00805f9b34fb", // Heart Rate SIG standard
  "0000180f-0000-1000-8000-00805f9b34fb", // Battery Service SIG
  "0000180a-0000-1000-8000-00805f9b34fb", // Device Information SIG
  "00001800-0000-1000-8000-00805f9b34fb", // Generic Access
  "00001801-0000-1000-8000-00805f9b34fb", // Generic Attribute
  // IDO / VeryFit (IDW13, ID205, etc.) & Linwear
  "00000a00-0000-1000-8000-00805f9b34fb",
  "0000ea80-0000-1000-8000-00805f9b34fb",
  "0000feea-0000-1000-8000-00805f9b34fb",
  "0000fee7-0000-1000-8000-00805f9b34fb", // Wearfit / Telink / IDO / Umeox
  "0000fee0-0000-1000-8000-00805f9b34fb", // Moyoung / DaFit
  "0000ae00-0000-1000-8000-00805f9b34fb",
  "0000af00-0000-1000-8000-00805f9b34fb",
  "0000fff0-0000-1000-8000-00805f9b34fb", // Fitpro / HryFine / Qwatch
  "0000fff1-0000-1000-8000-00805f9b34fb",
  "0000fff2-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "0000fef5-0000-1000-8000-00805f9b34fb", // Dialog Semiconductor
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART (Da Fit / Wearfit / Jieli)
  "de5bf728-d711-4e47-af26-65e3012a5dc7", // Jieli / Umeox Smartband
];

// Comandos de activación en formato numérico puro para conversión universal (DataView / Uint8Array)
const RAW_ACTIVATION_COMMANDS = [
  [0x04, 0x01, 0x01], // Da Fit / Linwear HR trigger
  [0xcd, 0x00, 0x01, 0x01], // Fitpro HR sensor start
  [0xba, 0x01, 0x01], // Qwatch / Umeox HR measure trigger
  [0xcd, 0x00, 0x02, 0x04, 0x01], // Fitpro / HryFine Real-Time HR trigger
  [0xab, 0x00, 0x04, 0xff, 0x31, 0x09, 0x01], // Wearfit / Wearfit Pro HR start
  [0xd0, 0x01, 0x01], // IDO / VeryFit continuous HR
  [0x05, 0x01, 0x01], // IDO HR single trigger
  [0x01, 0x00, 0x01], // Generic Nordic UART start
  [0x01], // SIG Control Point reset / start
];

const ACTIVATION_COMMANDS = RAW_ACTIVATION_COMMANDS.map(
  (arr) => new Uint8Array(arr),
);

export function SmartwatchProvider({ children }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStage, setConnectionStage] = useState(null); // 'scanning' | 'connecting_gatt' | 'discovering_services' | 'activating_sensor' | 'ready' | null
  const [errorMsg, setErrorMsg] = useState(null);

  // Estado real del dispositivo (nunca falso-positivo de localStorage)
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [connectedDeviceId, setConnectedDeviceId] = useState("");
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [lastRawPacket, setLastRawPacket] = useState(null);
  const [rawPacketsHistory, setRawPacketsHistory] = useState([]);
  const [discoveredServices, setDiscoveredServices] = useState([]);
  const [subscribedChars, setSubscribedChars] = useState([]);
  const [streamToCloud, setStreamToCloudState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_STREAM);
    return saved !== null ? saved === "true" : true;
  });

  const setStreamToCloud = useCallback((val) => {
    setStreamToCloudState(val);
    localStorage.setItem(STORAGE_KEY_STREAM, String(val));
  }, []);

  // Telemetría 100% Real (Sin datos simulados)
  const [liveBpm, setLiveBpm] = useState(null);
  const [liveStress, setLiveStress] = useState(null);
  const [liveMov, setLiveMov] = useState(null);
  const [lastBpm, setLastBpm] = useState(null);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [isWebSocketActive, setIsWebSocketActive] = useState(false);
  const [simulationMode, setSimulationModeState] = useState(null);
  const [sensorStatus, setSensorStatus] = useState("idle"); // 'idle', 'waiting_skin', 'streaming'
  const [activeSessionId, setActiveSessionIdState] = useState(null);

  // Arquitectura Híbrida de Telemetría (BLE Directo + Android Health Connect)
  const [telemetrySource, setTelemetrySource] = useState("NONE"); // 'BLE_DIRECT' | 'HEALTH_CONNECT' | 'NONE'
  const [lastReadingTimestamp, setLastReadingTimestamp] = useState(null);
  const [healthConnectAvailable, setHealthConnectAvailable] = useState(false);
  const [healthConnectAuthorized, setHealthConnectAuthorized] = useState(false);
  const [healthConnectPolling, setHealthConnectPolling] = useState(false);

  const deviceRef = useRef(null);
  const notifyCharRef = useRef(null);
  const notifyCharsRef = useRef([]);
  const writeCharRef = useRef(null);
  const writeCharsRef = useRef([]);
  const pingTimerRef = useRef(null);
  const simulationTimerRef = useRef(null);
  const lastProcessedTimeRef = useRef(0);
  const activeSessionIdRef = useRef(null);
  const lastCrisisBroadcastRef = useRef(0);
  const [isSimulating, setIsSimulating] = useState(false);

  const setActiveSessionId = useCallback((id) => {
    setActiveSessionIdState(id);
    activeSessionIdRef.current = id;
    HeartRateTelemetryService.setActiveSessionId(id);
  }, []);

  // Comprobar soporte para Bluetooth (WebBluetooth API en navegador o Capacitor BLE nativo en móvil)
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setIsSupported(true);
      BleClient.initialize().catch((err) => {
        console.warn("Fallo inicializando BLE nativo:", err);
      });
    } else if (typeof window !== "undefined" && "bluetooth" in navigator) {
      setIsSupported(true);
    }
  }, []);

  // Iniciar servicio de sincronización en segundo plano hacia el backend SIAT
  useEffect(() => {
    startTelemetrySync();
    return () => {
      stopTelemetrySync();
    };
  }, []);

  // Limpiar residuos de conexiones previas de localStorage al iniciar
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY_CONNECTED);
    localStorage.removeItem(STORAGE_KEY_DEVICE);
    localStorage.removeItem(STORAGE_KEY_BATTERY);
  }, []);

  // Actualizar historial de telemetría de forma atómica
  const appendTelemetryRecord = useCallback((record) => {
    setTelemetryHistory((prev) => [...prev.slice(-14), record]);
  }, []);

  // Sincronizar streamToCloud con HeartRateTelemetryService
  useEffect(() => {
    HeartRateTelemetryService.setStreamToCloud(streamToCloud);
  }, [streamToCloud]);

  // Suscripción al Servicio Unificado de Telemetría (BLE + Health Connect)
  useEffect(() => {
    const unsubReading = HeartRateTelemetryService.onReading((reading) => {
      setLiveBpm(reading.bpm);
      setLastBpm(reading.bpm);
      setLiveStress(reading.stress);
      setLiveMov(reading.mov);
      setTelemetrySource(reading.source);
      setLastReadingTimestamp(reading.timestamp);
      setSensorStatus("streaming");
      setIsWebSocketActive(true);
      if (reading.deviceName) {
        setDeviceName(reading.deviceName);
      }
      appendTelemetryRecord({
        time: reading.time,
        bpm: reading.bpm,
        mov: reading.mov,
        stress: reading.stress,
        calma: 100 - reading.stress,
        estres: reading.stress,
        source: reading.source,
      });
    });

    const unsubStatus = HeartRateTelemetryService.onStatusChange((status) => {
      if (status.healthConnectAvailable !== undefined) {
        setHealthConnectAvailable(status.healthConnectAvailable);
      }
      if (status.healthConnectAuthorized !== undefined) {
        setHealthConnectAuthorized(status.healthConnectAuthorized);
      }
      if (status.healthConnectPolling !== undefined) {
        setHealthConnectPolling(status.healthConnectPolling);
      }
      if (status.activeSource) {
        setTelemetrySource(status.activeSource);
      }
      if (
        status.bleConnected !== undefined &&
        status.activeSource === "BLE_DIRECT"
      ) {
        setIsConnected(status.bleConnected);
      }
    });

    HeartRateTelemetryService.checkHealthConnectAvailability()
      .then((res) => {
        if (res?.available) {
          HeartRateTelemetryService.checkHealthConnectPermissions();
        }
      })
      .catch(() => {});

    return () => {
      unsubReading();
      unsubStatus();
    };
  }, [appendTelemetryRecord]);

  // Difundir alerta de crisis en todo el sistema (Notificaciones, Diario de Hogar y Registro de Alertas)
  const broadcastCrisisAlert = useCallback((data) => {
    const alertId = `crisis_${Date.now()}`;
    const timestamp = new Date().toISOString();
    const bpm = data.bpm || 128;
    const stress = data.stress || 88;
    const child = getSavedSelectedChild();
    const childName = child?.name || "el paciente";

    const notif = {
      id: alertId,
      id_alert: alertId,
      type: "crisis",
      message: `🚨 Crisis de sobrecarga sensorial detectada (${bpm} BPM, ${stress}% estrés)`,
      time: timestamp,
      fec_hora: timestamp,
      est_dete: "SOBRECARGA_SENSORIAL",
      ale_meto: "SOBRECARGA_SENSORIAL",
      bpm_max: bpm,
      mov_max: data.mov || 3.4,
      stress_index: stress,
      fue_efec: null,
      read: false,
    };

    // 1. Guardar en notificaciones persistentes
    try {
      const raw = localStorage.getItem("siat_notifications");
      const list = raw ? JSON.parse(raw) : [];
      const updated = [notif, ...list.filter((n) => n.id !== alertId)].slice(
        0,
        30,
      );
      localStorage.setItem("siat_notifications", JSON.stringify(updated));
    } catch {}

    // 2. Guardar en alertas locales para Registro de Alertas (AlertCenter / ParentProfile)
    try {
      const raw = localStorage.getItem("siat_local_alerts");
      const list = raw ? JSON.parse(raw) : [];
      const updated = [
        notif,
        ...list.filter((a) => a.id_alert !== alertId),
      ].slice(0, 50);
      localStorage.setItem("siat_local_alerts", JSON.stringify(updated));
    } catch {}

    // 3. Emitir evento global en el navegador
    window.dispatchEvent(
      new CustomEvent("siat:crisis_alert", { detail: notif }),
    );

    // 4. Emitir por WebSocket si está conectado
    try {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit("telemetry_data", {
          nin_codi: child?.id || null,
          bpm,
          stress,
          mov: data.mov || 3.4,
          time: new Date().toLocaleTimeString("es-ES"),
        });
      }
    } catch {}
  }, []);

  // Publicar y procesar telemetría real recibida
  const processTelemetryData = useCallback(
    (data, source = "internal") => {
      const nowTs = Date.now();
      if (source === "socket" && nowTs - lastProcessedTimeRef.current < 300) {
        return;
      }
      lastProcessedTimeRef.current = nowTs;

      const bpm = Number(data.bpm);
      if (isNaN(bpm) || bpm <= 0) return;

      const stress =
        data.stress !== undefined
          ? Number(data.stress)
          : Math.min(100, Math.max(5, Math.round(((bpm - 60) / 70) * 100)));
      const mov = data.mov !== undefined ? Number(data.mov) : 1.0;
      const timeStr =
        data.time ||
        new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

      // Detección automática de crisis por umbral fisiológico
      if (bpm >= 115 && stress >= 75) {
        if (nowTs - lastCrisisBroadcastRef.current > 25000) {
          lastCrisisBroadcastRef.current = nowTs;
          broadcastCrisisAlert({ bpm, stress, mov });
        }
      }

      setLiveBpm(bpm);
      setLastBpm(bpm);
      setLiveStress(stress);
      setLiveMov(mov);
      setSensorStatus("streaming");
      setIsWebSocketActive(true);
      if (source === "ble") {
        setTelemetrySource("BLE_DIRECT");
      }

      appendTelemetryRecord({
        time: timeStr,
        bpm,
        mov,
        stress,
        calma: 100 - stress,
        estres: stress,
      });

      // Persistir inmediatamente en IndexedDB local (100% offline-ready)
      saveTelemetry({
        bpm,
        stress,
        mov,
        time: timeStr,
        deviceName: data.deviceName || deviceName || "Smartwatch BLE",
        nin_codi: data.nin_codi || getSavedSelectedChild()?.id || null,
        ses_codi: data.ses_codi || activeSessionIdRef.current || null,
      }).catch((dbErr) => {
        console.warn("Fallo guardando telemetría en IndexedDB:", dbErr);
      });

      // Transmisión al backend por WebSockets y REST si está habilitado
      if (source === "ble" && streamToCloud) {
        const savedChild = getSavedSelectedChild();
        const payload = {
          nin_codi: data.nin_codi || savedChild?.id || null,
          ses_codi: data.ses_codi || activeSessionIdRef.current || null,
          bpm,
          stress,
          mov,
          time: timeStr,
          tel_regi: bpm,
          tel_stress: stress,
          tel_mov: mov,
          deviceName: data.deviceName || deviceName || "Smartwatch BLE",
        };

        // 1. WebSocket en tiempo real
        try {
          const socket = getSocket();
          if (socket && socket.connected) {
            socket.emit("telemetry_data", payload);
          }
        } catch (err) {
          console.warn("Error enviando socket telemetry:", err);
        }

        // 2. Persistencia REST directa al backend (con endpoint oficial de monitoreo)
        try {
          const token = localStorage.getItem("token");
          const headers = { "Content-Type": "application/json" };
          if (token) headers["Authorization"] = `Bearer ${token}`;

          if (activeSessionIdRef.current) {
            fetch(
              "https://backend-siat.onrender.com/api/monitoreo/telemetria",
              {
                method: "POST",
                headers,
                body: JSON.stringify({
                  ses_codi: activeSessionIdRef.current,
                  con_codi: "CONF_STD",
                  tel_regi: bpm,
                  tel_marc: Math.floor(Date.now() / 1000),
                  tel_stress: stress,
                  tel_mov: mov,
                }),
              },
            ).catch(() => {});
          }
        } catch {}
      }
    },
    [streamToCloud, deviceName, appendTelemetryRecord],
  );

  // Manejar desconexión física del dispositivo
  const handleDisconnected = useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setIsSimulating(false);
    setIsConnected(false);
    setIsConnecting(false);
    setDeviceName("");
    setConnectedDeviceId("");
    setBatteryLevel(null);
    setLiveBpm(null);
    setLastBpm(null);
    setLiveStress(null);
    setLiveMov(null);
    setLastRawPacket(null);
    setDiscoveredServices([]);
    setSubscribedChars([]);
    setSensorStatus("idle");
    setConnectionStage(null);
    setTelemetrySource("NONE");
    deviceRef.current = null;
    notifyCharRef.current = null;
    notifyCharsRef.current = [];
    writeCharRef.current = null;
    writeCharsRef.current = [];
    try {
      HeartRateTelemetryService.disconnectBle().catch(() => {});
    } catch {}
  }, []);

  // Parser Universal para paquetes de bytes BLE (GATT estándar, IDW13, Fitpro, Wearfit Pro, Da Fit, Aiwa, Jieli, Qwatch/Umeox)
  const handleBleRawData = useCallback(
    (event, characteristicUuid = "") => {
      let dataView = null;
      if (event instanceof DataView) {
        dataView = event;
      } else if (event?.buffer instanceof ArrayBuffer) {
        dataView = new DataView(
          event.buffer,
          event.byteOffset || 0,
          event.byteLength,
        );
      } else if (event?.target?.value instanceof DataView) {
        dataView = event.target.value;
      } else if (event?.value instanceof DataView) {
        dataView = event.value;
      } else if (typeof event === "string") {
        dataView = hexStringToDataView(event);
      } else if (event?.value && typeof event.value === "string") {
        dataView = hexStringToDataView(event.value);
      }

      if (!dataView || dataView.byteLength === 0) return;

      const charUuid = (
        characteristicUuid ||
        event?.target?.uuid ||
        ""
      ).toLowerCase();

      // Si es paquete de nivel de batería (0x2A19), actualizar batería y terminar sin procesar como pulso
      if (charUuid.includes("2a19")) {
        const bat = dataView.getUint8(0);
        if (bat >= 0 && bat <= 100) {
          setBatteryLevel(bat);
        }
        return;
      }

      const bytes = new Uint8Array(
        dataView.buffer,
        dataView.byteOffset || 0,
        dataView.byteLength,
      );
      const hexStr = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
        .join(" ");

      let parsedBpm = null;

      // 1. Si proviene de la característica oficial 0x2A37, procesar con parser Bluetooth SIG estricto
      if (charUuid.includes("2a37")) {
        parsedBpm = parseBluetoothSigHeartRate(dataView);
      } else if (charUuid) {
        // Característica OEM o genérica: intentar primero parser adaptativo OEM para evitar falsos positivos de cabecera
        parsedBpm = parseOemHeartRateBytes(dataView);
        if (!parsedBpm) {
          parsedBpm = parseBluetoothSigHeartRate(dataView);
        }
      } else {
        // Sin UUID específico: primero SIG si cumple formato estricto, luego OEM
        parsedBpm = parseBluetoothSigHeartRate(dataView);
        if (!parsedBpm) {
          parsedBpm = parseOemHeartRateBytes(dataView);
        }
      }

      const packetInfo = {
        id: Date.now() + Math.random(),
        time: new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        hex: hexStr,
        length: bytes.length,
        parsedBpm:
          parsedBpm && parsedBpm >= 40 && parsedBpm <= 220 ? parsedBpm : null,
      };

      setLastRawPacket(packetInfo);
      setRawPacketsHistory((prev) => [packetInfo, ...prev.slice(0, 19)]);

      // Si obtuvimos un valor válido del sensor físico
      if (parsedBpm && parsedBpm >= 40 && parsedBpm <= 220) {
        processTelemetryData(
          {
            bpm: parsedBpm,
            mov: 1.0,
            deviceName:
              deviceRef.current?.name || deviceName || "Smartwatch BLE",
          },
          "ble",
        );
      } else {
        // Dispositivo conectado pero sensor aún sin lectura (ej. no está en la muñeca)
        setSensorStatus("waiting_skin");
      }
    },
    [deviceName, processTelemetryData],
  );

  // Enviar ráfaga de activación a todas las características de escritura encontradas (Web)
  const sendAllActivationCommands = async (chars) => {
    if (!chars || chars.length === 0) return;
    for (const char of chars) {
      for (const cmd of ACTIVATION_COMMANDS) {
        try {
          if (char.properties.writeWithoutResponse) {
            await char.writeValueWithoutResponse(cmd);
          } else if (char.properties.write) {
            await char.writeValueWithResponse(cmd);
          }
          await new Promise((r) => setTimeout(r, 20));
        } catch {
          // Ignorar incompatibilidades de comandos con characteristics específicos
        }
      }
    }
  };

  // Conectar dispositivo Smartwatch por Bluetooth LE (WebBluetooth API en Web o BLE Nativo en Android/Capacitor)
  const connectBluetoothDevice = useCallback(async () => {
    if (!isSupported) {
      setErrorMsg("Bluetooth no disponible en este dispositivo.");
      return;
    }

    setErrorMsg(null);
    setIsConnecting(true);
    setConnectionStage("scanning");

    // Rama Móvil Nativa (Android Capacitor)
    if (Capacitor.isNativePlatform()) {
      try {
        await BleClient.initialize();

        // 1. Verificar si Bluetooth está encendido en el sistema Android
        try {
          const isBtEnabled = await BleClient.isEnabled();
          if (!isBtEnabled) {
            await BleClient.requestEnable();
          }
        } catch {
          setErrorMsg(
            "Por favor enciende el Bluetooth de tu teléfono para vincular el reloj.",
          );
          setIsConnecting(false);
          setConnectionStage(null);
          return;
        }

        // 2. Verificar que Ubicación (GPS) esté activa para escaneo BLE en Android
        try {
          const isLocOn = await BleClient.isLocationEnabled();
          if (!isLocOn) {
            setErrorMsg(
              "Por favor activa la Ubicación (GPS) de tu teléfono. Android la requiere para escanear dispositivos Bluetooth cercanos.",
            );
            setIsConnecting(false);
            setConnectionStage(null);
            return;
          }
        } catch {}

        // 3. Abrir selector nativo de dispositivos BLE
        const device = await BleClient.requestDevice({
          optionalServices: KNOWN_SERVICES,
        });

        if (!device) {
          setIsConnecting(false);
          setConnectionStage(null);
          return;
        }

        deviceRef.current = device;
        setDeviceName(device.name || "Smartwatch BLE");
        setConnectedDeviceId(device.deviceId || "");

        // Conectar GATT directamente sin forzar bonding que provoca rechazos en smartwatches OEM
        setConnectionStage("connecting_gatt");
        try {
          await BleClient.disconnect(device.deviceId);
        } catch {}
        await new Promise((r) => setTimeout(r, 200));

        await BleClient.connect(device.deviceId, () => {
          console.log("[BLE] Desconexión detectada a nivel de hardware");
          handleDisconnected();
        });

        setConnectionStage("discovering_services");
        const services = await BleClient.getServices(device.deviceId);
        setDiscoveredServices(services || []);
        console.log("Servicios BLE descubiertos en dispositivo:", services);

        // Intentar leer nivel de batería
        try {
          const bat = await BleClient.read(
            device.deviceId,
            "0000180f-0000-1000-8000-00805f9b34fb",
            "00002a19-0000-1000-8000-00805f9b34fb",
          );
          if (bat && bat.byteLength > 0) {
            setBatteryLevel(bat.getUint8(0));
          }
        } catch {}

        const nativeWriteChars = [];
        const subs = [];

        // Verificar si existe la característica estándar de ritmo cardíaco (0x2A37)
        let foundStandardHr = false;
        for (const s of services) {
          if (!s.characteristics) continue;
          for (const c of s.characteristics) {
            if (c.uuid.toLowerCase().includes("2a37")) {
              foundStandardHr = true;
              break;
            }
          }
          if (foundStandardHr) break;
        }

        // Suscribir ordenadamente a las características necesarias
        for (const s of services) {
          if (!s.characteristics) continue;
          for (const c of s.characteristics) {
            const cUuid = c.uuid.toLowerCase();
            const isHrChar = cUuid.includes("2a37");
            const isBatteryChar = cUuid.includes("2a19");

            // Si el reloj soporta 0x2A37 estándar, SOLO suscribirse a 2A37 y 2A19 (batería)
            // Evitamos suscribir a canales de control/UART que emiten respuestas ACK (0x81 = 129)
            if (foundStandardHr && !isHrChar && !isBatteryChar) {
              continue;
            }

            if (c.properties?.notify || c.properties?.indicate) {
              try {
                await BleClient.startNotifications(
                  device.deviceId,
                  s.uuid,
                  c.uuid,
                  (value) => {
                    handleBleRawData(value, c.uuid);
                  },
                );
                subs.push({
                  service: s.uuid,
                  char: c.uuid,
                  type: c.properties?.notify ? "notify" : "indicate",
                });
                await new Promise((r) => setTimeout(r, 40));
              } catch (subErr) {
                console.warn(`No se pudo suscribir a ${c.uuid}:`, subErr);
              }
            }

            // Registrar canales de escritura para activación (únicamente para relojes OEM no estándar)
            if (
              !foundStandardHr &&
              (c.properties?.write || c.properties?.writeWithoutResponse)
            ) {
              nativeWriteChars.push({
                service: s.uuid,
                char: c.uuid,
                properties: c.properties,
              });
            }
          }
        }

        // VALIDACIÓN CRUCIAL: Si no se logró suscribir a ninguna característica de telemetría,
        // no marcar el reloj como conectado. Desconectar y guiar al usuario hacia Google Health.
        if (subs.length === 0) {
          try {
            await BleClient.disconnect(device.deviceId);
          } catch {}
          handleDisconnected();
          throw new Error(
            "El dispositivo no expone lecturas de ritmo cardíaco accesibles por Bluetooth directo. Te sugerimos sincronizarlo mediante la opción de Google Health.",
          );
        }

        setSubscribedChars(subs);

        // Enviar activación únicamente en relojes OEM propietarios (no estándar SIG)
        if (!foundStandardHr && nativeWriteChars.length > 0) {
          setConnectionStage("activating_sensor");
          const safeTriggers = [
            [0x04, 0x01, 0x01], // Da Fit / Linwear
            [0xcd, 0x00, 0x01, 0x01], // Fitpro
            [0xba, 0x01, 0x01], // Qwatch / Umeox
          ];
          for (const wc of nativeWriteChars) {
            if (wc.properties.writeWithoutResponse) {
              for (const cmdNums of safeTriggers) {
                try {
                  const cmdDataView = numbersToDataView(cmdNums);
                  await BleClient.writeWithoutResponse(
                    device.deviceId,
                    wc.service,
                    wc.char,
                    cmdDataView,
                  );
                  await new Promise((r) => setTimeout(r, 40));
                } catch {}
              }
            }
          }

          // Ping suave solo si no se reciben lecturas por más de 15 segundos
          pingTimerRef.current = setInterval(() => {
            const timeSinceLast =
              Date.now() - (lastProcessedTimeRef.current || 0);
            if (timeSinceLast > 15000 && nativeWriteChars.length > 0) {
              for (const wc of nativeWriteChars) {
                if (wc.properties.writeWithoutResponse) {
                  for (const cmdNums of safeTriggers) {
                    try {
                      const cmdDataView = numbersToDataView(cmdNums);
                      BleClient.writeWithoutResponse(
                        device.deviceId,
                        wc.service,
                        wc.char,
                        cmdDataView,
                      ).catch(() => {});
                    } catch {}
                  }
                }
              }
            }
          }, 12000);
        }

        setConnectionStage("ready");
        setIsConnected(true);
        setTelemetrySource("BLE_DIRECT");
        setIsConnecting(false);
        setSensorStatus("waiting_skin");
        return;
      } catch (nativeErr) {
        console.error("Error BLE nativo:", nativeErr);
        handleDisconnected();
        setIsConnecting(false);
        setIsConnected(false);
        setConnectionStage(null);
        if (nativeErr.message && !nativeErr.message.includes("cancelled")) {
          setErrorMsg(
            nativeErr.message || "Error al conectar por Bluetooth nativo",
          );
        }
        return;
      }
    }

    // Rama Web (Navegador Chrome / Edge en PC)
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: KNOWN_SERVICES,
      });

      deviceRef.current = device;
      const detectedName = device.name || "Smartwatch Bluetooth";
      setDeviceName(detectedName);

      device.addEventListener("gattserverdisconnected", handleDisconnected);

      if (!device.gatt) {
        throw new Error("El dispositivo no expone interfaz GATT.");
      }

      setConnectionStage("connecting_gatt");
      const server = await device.gatt.connect();

      setConnectionStage("discovering_services");
      // Intentar leer batería real
      try {
        const batteryService = await server.getPrimaryService(
          "0000180f-0000-1000-8000-00805f9b34fb",
        );
        const batteryChar = await batteryService.getCharacteristic(
          "00002a19-0000-1000-8000-00805f9b34fb",
        );
        const val = await batteryChar.readValue();
        setBatteryLevel(val.getUint8(0));
      } catch {
        setBatteryLevel(null);
      }

      // Descubrir y activar características de Notificación y Escritura
      const writeChars = [];
      const notifyChars = [];

      // 1. Intentar Servicio Estándar Heart Rate SIG (0x180D)
      try {
        const hrService = await server.getPrimaryService(
          "0000180d-0000-1000-8000-00805f9b34fb",
        );
        try {
          const hrChar = await hrService.getCharacteristic(
            "00002a37-0000-1000-8000-00805f9b34fb",
          );
          await hrChar.startNotifications();
          hrChar.addEventListener("characteristicvaluechanged", (e) =>
            handleBleRawData(e, "00002a37"),
          );
          notifyCharRef.current = hrChar;
          notifyChars.push(hrChar);
        } catch (hrNotifErr) {
          console.warn(
            "Fallo suscribiendo a heart_rate_measurement:",
            hrNotifErr,
          );
        }

        // Batería en modo estándar
        try {
          const batService = await server.getPrimaryService("battery_service");
          const batChar = await batService.getCharacteristic("battery_level");
          await batChar.startNotifications();
          batChar.addEventListener("characteristicvaluechanged", (e) =>
            handleBleRawData(e, "00002a19"),
          );
        } catch {}
      } catch {
        // Servicio Heart Rate estándar no presente
      }

      // 2. Si no es estándar SIG, descubrir servicios primarios para capturar canales propietarios (Fitpro, IDO, Da Fit, Wearfit)
      if (!notifyCharRef.current) {
        try {
          const services = await server.getPrimaryServices();
          for (const service of services) {
            try {
              const characteristics = await service.getCharacteristics();
              for (const char of characteristics) {
                if (char.properties.notify || char.properties.indicate) {
                  if (!notifyChars.includes(char)) {
                    try {
                      await char.startNotifications();
                      char.addEventListener("characteristicvaluechanged", (e) =>
                        handleBleRawData(e, char.uuid),
                      );
                      notifyChars.push(char);
                      if (!notifyCharRef.current) notifyCharRef.current = char;
                    } catch {
                      // Característica no suscriptible
                    }
                  }
                }
                if (
                  char.properties.write ||
                  char.properties.writeWithoutResponse
                ) {
                  if (!writeChars.includes(char)) {
                    writeChars.push(char);
                  }
                }
              }
            } catch (svcCharErr) {
              console.warn("Error leyendo características:", svcCharErr);
            }
          }
        } catch (allSvcErr) {
          console.warn("Error consultando servicios primarios:", allSvcErr);
        }

        writeCharsRef.current = writeChars;
        notifyCharsRef.current = notifyChars;
        if (writeChars.length > 0) {
          writeCharRef.current = writeChars[0];
        }

        // Enviar comando para activar el sensor óptico en el reloj OEM
        setConnectionStage("activating_sensor");
        if (writeChars.length > 0) {
          await sendAllActivationCommands(writeChars);
          // Enviar ping cada 12 segundos SOLO si no se reciben lecturas por más de 15s
          pingTimerRef.current = setInterval(() => {
            const timeSinceLast =
              Date.now() - (lastProcessedTimeRef.current || 0);
            if (
              timeSinceLast > 15000 &&
              writeCharsRef.current &&
              writeCharsRef.current.length > 0
            ) {
              sendAllActivationCommands(writeCharsRef.current).catch(() => {});
            }
          }, 12000);
        }
      }

      // Validación Web Bluetooth: asegurar que al menos un canal notifique lecturas
      if (!notifyCharRef.current && notifyChars.length === 0) {
        if (device.gatt?.connected) {
          device.gatt.disconnect();
        }
        handleDisconnected();
        throw new Error(
          "No se detectó un canal de ritmo cardíaco compatible en este reloj por Bluetooth Web. Te sugerimos sincronizarlo mediante la app móvil con Google Health.",
        );
      }

      setConnectionStage("ready");
      setIsConnected(true);
      setTelemetrySource("BLE_DIRECT");
      setIsConnecting(false);
      setSensorStatus("waiting_skin");
    } catch (err) {
      console.error("Error al conectar Smartwatch BLE:", err);
      handleDisconnected();
      setIsConnecting(false);
      setIsConnected(false);
      setConnectionStage(null);
      if (err.name !== "NotFoundError") {
        setErrorMsg(
          err.message || "No se pudo conectar el dispositivo Bluetooth.",
        );
      }
    }
  }, [isSupported, handleDisconnected, handleBleRawData]);

  // Desconectar dispositivo Bluetooth y detener telemetría
  const disconnectSmartwatch = useCallback(async () => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setIsSimulating(false);
    setSimulationModeState(null);

    try {
      await HeartRateTelemetryService.disconnectBle();
    } catch {}

    if (Capacitor.isNativePlatform() && deviceRef.current?.deviceId) {
      try {
        await BleClient.disconnect(deviceRef.current.deviceId);
      } catch {}
    } else if (
      deviceRef.current &&
      deviceRef.current.gatt &&
      deviceRef.current.gatt.connected
    ) {
      deviceRef.current.gatt.disconnect();
    }
    handleDisconnected();
    setTelemetrySource("NONE");
    setLiveBpm(null);
    setLastBpm(null);
    setLiveStress(null);
    setLiveMov(null);
    setSensorStatus("idle");
  }, [handleDisconnected]);

  // Métodos de Control para Android Health Connect
  const requestHealthConnectPermissions = useCallback(async () => {
    setErrorMsg(null);
    try {
      const granted =
        await HeartRateTelemetryService.requestHealthConnectPermissions();
      setHealthConnectAuthorized(granted);
      if (granted) {
        HeartRateTelemetryService.startHealthConnectPolling();
      }
      return granted;
    } catch (err) {
      setErrorMsg(
        err.message || "Error al solicitar permisos de Health Connect",
      );
      throw err;
    }
  }, []);

  const checkHealthConnectAvailability = useCallback(async () => {
    const res =
      await HeartRateTelemetryService.checkHealthConnectAvailability();
    setHealthConnectAvailable(Boolean(res?.available));
    return res;
  }, []);

  const checkHealthConnectPermissions = useCallback(async () => {
    const res = await HeartRateTelemetryService.checkHealthConnectPermissions();
    setHealthConnectAuthorized(Boolean(res));
    return res;
  }, []);

  const startHealthConnectPolling = useCallback((intervalSec = 25) => {
    HeartRateTelemetryService.startHealthConnectPolling(intervalSec);
    setHealthConnectPolling(true);
    setTelemetrySource("HEALTH_CONNECT");
  }, []);

  const stopHealthConnectPolling = useCallback(() => {
    HeartRateTelemetryService.stopHealthConnectPolling();
    setHealthConnectPolling(false);
    if (telemetrySource === "HEALTH_CONNECT") {
      setTelemetrySource("NONE");
    }
  }, [telemetrySource]);

  const fetchHealthConnectHeartRate = useCallback(async (minutes = 20) => {
    return await HeartRateTelemetryService.fetchHealthConnectHeartRate(minutes);
  }, []);

  const openHealthConnectSettings = useCallback(async () => {
    return await HeartRateTelemetryService.openHealthConnectSettings();
  }, []);

  const simulateHealthConnectBatch = useCallback(
    (bpmValues, customDeviceName) => {
      const res = HeartRateTelemetryService.simulateHealthConnectBatch(
        bpmValues,
        customDeviceName,
      );
      setTelemetrySource("HEALTH_CONNECT");
      return res;
    },
    [],
  );

  // Simulación Fisiológica Dinámica y Realista:
  // mode = "normal" (pulso normal 72-88 BPM) | "crisis" (taquicardia / crisis 118-144 BPM)
  const toggleRealisticSimulation = useCallback(
    (mode = "normal") => {
      const isCrisis = mode === "crisis";

      // Si ya está corriendo en este mismo modo, lo apagamos (toggle)
      if (simulationTimerRef.current && simulationMode === mode) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
        setIsSimulating(false);
        setSimulationModeState(null);
        handleDisconnected();
        setTelemetrySource("NONE");
        setLiveBpm(null);
        setLastBpm(null);
        setLiveStress(null);
        setLiveMov(null);
        setSensorStatus("idle");
        return false; // se apagó
      }

      // Si había un timer previo corriendo (ej. cambiando entre normal y crisis), limpiarlo
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
        simulationTimerRef.current = null;
      }

      setIsSimulating(true);
      setSimulationModeState(mode);
      setIsConnected(true);
      setTelemetrySource("HEALTH_CONNECT");
      setDeviceName(
        isCrisis
          ? "Smartwatch (Simulación Crisis)"
          : "Smartwatch (Simulación Normal)",
      );
      setSensorStatus("streaming");

      let currentBpm = isCrisis ? 128 : 78;
      let breathPhase = 0;
      let trend = 0;

      const emitNextSample = () => {
        if (isCrisis) {
          // Crisis de sobrecarga: Taquicardia, hiperventilación, estrés alto y agitación motora
          breathPhase += 0.55;
          const respiratoryEffect = Math.sin(breathPhase) * 4.2;
          if (Math.random() > 0.45) {
            trend = Math.max(
              -5,
              Math.min(6, trend + (Math.random() > 0.48 ? 1 : -1)),
            );
          }
          const microJitter = (Math.random() - 0.5) * 3.0;
          const rawBpm = Math.round(
            128 + respiratoryEffect + trend + microJitter,
          );
          currentBpm = Math.max(118, Math.min(145, rawBpm));

          const mov = parseFloat((2.8 + Math.random() * 1.6).toFixed(2));
          const stress = Math.max(
            82,
            Math.min(
              98,
              Math.round(85 + (currentBpm - 120) * 0.4 + Math.random() * 3),
            ),
          );

          const timeStr = new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          HeartRateTelemetryService.dispatchReading({
            bpm: currentBpm,
            timestamp: new Date().toISOString(),
            source: "HEALTH_CONNECT",
            deviceName: "Smartwatch (Simulación Crisis)",
            mov,
            stress,
            time: timeStr,
          });

          processTelemetryData(
            {
              bpm: currentBpm,
              stress,
              mov,
              time: timeStr,
              source: "HEALTH_CONNECT",
            },
            "simulation",
          );

          const nowSample = Date.now();
          if (nowSample - lastCrisisBroadcastRef.current > 25000) {
            lastCrisisBroadcastRef.current = nowSample;
            broadcastCrisisAlert({ bpm: currentBpm, stress, mov });
          }
        } else {
          // Pulso normal: Calma, respiración sinusal suave, estrés bajo y reposo motor
          breathPhase += 0.38;
          const respiratoryEffect = Math.sin(breathPhase) * 2.2;
          if (Math.random() > 0.55) {
            trend = Math.max(
              -3,
              Math.min(3, trend + (Math.random() > 0.5 ? 1 : -1)),
            );
          }
          const microJitter = (Math.random() - 0.5) * 1.6;
          const rawBpm = Math.round(
            79 + respiratoryEffect + trend + microJitter,
          );
          currentBpm = Math.max(72, Math.min(88, rawBpm));

          const mov = parseFloat((0.95 + Math.random() * 0.35).toFixed(2));
          const stress = Math.max(
            16,
            Math.min(34, Math.round(((currentBpm - 65) / 55) * 55)),
          );

          const timeStr = new Date().toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          HeartRateTelemetryService.dispatchReading({
            bpm: currentBpm,
            timestamp: new Date().toISOString(),
            source: "HEALTH_CONNECT",
            deviceName: "Smartwatch (Simulación Normal)",
            mov,
            stress,
            time: timeStr,
          });

          processTelemetryData(
            {
              bpm: currentBpm,
              stress,
              mov,
              time: timeStr,
              source: "HEALTH_CONNECT",
            },
            "simulation",
          );
        }
      };

      if (isCrisis) {
        lastCrisisBroadcastRef.current = Date.now();
        broadcastCrisisAlert({ bpm: currentBpm, stress: 92, mov: 3.2 });
      }

      // Emitir primera muestra de inmediato
      emitNextSample();

      // Actualizar continuamente: cada 1200ms en crisis, cada 1600ms en normal
      simulationTimerRef.current = setInterval(
        emitNextSample,
        isCrisis ? 1200 : 1600,
      );
      return true; // se encendió
    },
    [
      simulationMode,
      handleDisconnected,
      processTelemetryData,
      broadcastCrisisAlert,
    ],
  );

  // Control de modo de simulación clínica
  const setSimulationMode = useCallback((mode) => {
    setSimulationModeState(mode);
  }, []);

  const stopSimulation = useCallback(() => {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
    }
    setIsSimulating(false);
    setSimulationModeState(null);
    handleDisconnected();
    setTelemetrySource("NONE");
    setLiveBpm(null);
    setLastBpm(null);
    setLiveStress(null);
    setLiveMov(null);
    setSensorStatus("idle");
  }, [handleDisconnected]);

  // Escuchar stream WebSocket del servidor SIAT
  useEffect(() => {
    getSocket();

    const unsubConnect = subscribeToSocket("connect", () => {
      setIsWebSocketActive(true);
    });

    const unsubDisconnect = subscribeToSocket("disconnect", () => {
      setIsWebSocketActive(false);
    });

    const handleIncomingSocketData = (data) => {
      if (data && data.bpm) {
        processTelemetryData(data, "socket");
      }
    };

    const unsubTelemetry = subscribeToSocket(
      "new_telemetry",
      handleIncomingSocketData,
    );
    const unsubTelemetryData = subscribeToSocket(
      "telemetry_data",
      handleIncomingSocketData,
    );

    if (getSocketConnectionState()) {
      setIsWebSocketActive(true);
    }

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubTelemetry();
      unsubTelemetryData();
    };
  }, [processTelemetryData]);

  // Función para activar el sensor óptico en el reloj bajo demanda
  const triggerSensorActivation = useCallback(async () => {
    if (!isConnected) return;
    if (Capacitor.isNativePlatform() && deviceRef.current?.deviceId) {
      const devId = deviceRef.current.deviceId;
      for (const s of discoveredServices) {
        if (!s.characteristics) continue;
        for (const c of s.characteristics) {
          if (c.properties?.writeWithoutResponse || c.properties?.write) {
            for (const cmdNums of RAW_ACTIVATION_COMMANDS) {
              try {
                const cmdDataView = numbersToDataView(cmdNums);
                if (c.properties.writeWithoutResponse) {
                  await BleClient.writeWithoutResponse(
                    devId,
                    s.uuid,
                    c.uuid,
                    cmdDataView,
                  );
                } else {
                  await BleClient.write(devId, s.uuid, c.uuid, cmdDataView);
                }
                await new Promise((r) => setTimeout(r, 35));
              } catch {}
            }
          }
        }
      }
    } else if (writeCharsRef.current && writeCharsRef.current.length > 0) {
      await sendAllActivationCommands(writeCharsRef.current);
    }
  }, [isConnected, discoveredServices]);

  // Enviar comando manual hexadecimal a una característica específica
  const sendManualBleCommand = useCallback(
    async (serviceUuid, charUuid, bytesArray) => {
      if (!deviceRef.current?.deviceId) return;
      try {
        const dataView = numbersToDataView(bytesArray);
        if (Capacitor.isNativePlatform()) {
          try {
            await BleClient.writeWithoutResponse(
              deviceRef.current.deviceId,
              serviceUuid,
              charUuid,
              dataView,
            );
          } catch {
            await BleClient.write(
              deviceRef.current.deviceId,
              serviceUuid,
              charUuid,
              dataView,
            );
          }
        }
      } catch (cmdErr) {
        console.warn("Error enviando comando manual BLE:", cmdErr);
      }
    },
    [],
  );

  const value = {
    isSupported,
    isConnected,
    isConnecting,
    connectionStage,
    deviceName,
    connectedDeviceId,
    batteryLevel,
    lastBpm,
    lastRawPacket,
    rawPacketsHistory,
    discoveredServices,
    subscribedChars,
    liveBpm,
    liveStress,
    liveMov,
    sensorStatus,
    telemetryHistory,
    isWebSocketActive,
    activeSessionId,
    setActiveSessionId,
    simulationMode,
    streamToCloud,
    errorMsg,
    telemetrySource,
    lastReadingTimestamp,
    healthConnectAvailable,
    healthConnectAuthorized,
    healthConnectPolling,
    requestHealthConnectPermissions,
    checkHealthConnectAvailability,
    checkHealthConnectPermissions,
    startHealthConnectPolling,
    stopHealthConnectPolling,
    fetchHealthConnectHeartRate,
    openHealthConnectSettings,
    simulateHealthConnectBatch,
    setStreamToCloud,
    connectBluetoothDevice,
    disconnectSmartwatch,
    triggerSensorActivation,
    sendManualBleCommand,
    setSimulationMode,
    stopSimulation,
    isSimulating,
    toggleRealisticSimulation,
  };

  return (
    <SmartwatchContext.Provider value={value}>
      {children}
    </SmartwatchContext.Provider>
  );
}
