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

  const deviceRef = useRef(null);
  const notifyCharRef = useRef(null);
  const notifyCharsRef = useRef([]);
  const writeCharRef = useRef(null);
  const writeCharsRef = useRef([]);
  const pingTimerRef = useRef(null);
  const lastProcessedTimeRef = useRef(0);
  const activeSessionIdRef = useRef(null);

  const setActiveSessionId = useCallback((id) => {
    setActiveSessionIdState(id);
    activeSessionIdRef.current = id;
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

      setLiveBpm(bpm);
      setLastBpm(bpm);
      setLiveStress(stress);
      setLiveMov(mov);
      setSensorStatus("streaming");
      setIsWebSocketActive(true);

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
    deviceRef.current = null;
    notifyCharRef.current = null;
    notifyCharsRef.current = [];
    writeCharRef.current = null;
    writeCharsRef.current = [];
  }, []);

  // Parser Universal para paquetes de bytes BLE (GATT estándar, IDW13, Fitpro, Wearfit Pro, Da Fit, Aiwa, Jieli, Qwatch/Umeox)
  const handleBleRawData = useCallback(
    (event) => {
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

      const bytes = new Uint8Array(
        dataView.buffer,
        dataView.byteOffset || 0,
        dataView.byteLength,
      );
      const hexStr = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
        .join(" ");

      let parsedBpm = null;

      // 1. Caso Estándar SIG 0x2A37 (Heart Rate Measurement)
      try {
        const flags = dataView.getUint8(0);
        const is16Bit = flags & 0x01;
        if (is16Bit && dataView.byteLength >= 3) {
          parsedBpm = dataView.getUint16(1, true);
        } else if (dataView.byteLength >= 2) {
          parsedBpm = dataView.getUint8(1);
        }
      } catch {
        // Ignorar si no es estructura estándar
      }

      // 2. Patrones específicos de fabricantes (Aiwa / Umeox, Da Fit, Fitpro, Wearfit, Jieli, Qwatch)
      if (!parsedBpm || parsedBpm < 35 || parsedBpm > 240) {
        // Da Fit / MoYoung / Oplayer: [0x04, 0x01, bpm, ...] o [0x05, 0x01, bpm, ...]
        if ((bytes[0] === 0x04 || bytes[0] === 0x05) && bytes.length >= 3) {
          if (bytes[2] >= 45 && bytes[2] <= 215) parsedBpm = bytes[2];
          else if (bytes[1] >= 45 && bytes[1] <= 215) parsedBpm = bytes[1];
        }
        // Fitpro / HryFine: [0xCD, 0x00, 0x02, bpm, ...]
        else if (bytes[0] === 0xcd && bytes.length >= 4) {
          if (bytes[3] >= 45 && bytes[3] <= 215) parsedBpm = bytes[3];
          else if (bytes[2] >= 45 && bytes[2] <= 215) parsedBpm = bytes[2];
        }
        // Wearfit / Wearfit Pro: [0xAB, len, ..., bpm]
        else if (bytes[0] === 0xab && bytes.length >= 4) {
          for (let i = 2; i < bytes.length; i++) {
            if (
              bytes[i] >= 45 &&
              bytes[i] <= 215 &&
              bytes[i] !== 0x31 &&
              bytes[i] !== 0x32
            ) {
              parsedBpm = bytes[i];
              break;
            }
          }
        }
        // Qwatch / Umeox: [0xBA, len, ..., bpm]
        else if (bytes[0] === 0xba && bytes.length >= 3) {
          for (let i = 2; i < bytes.length; i++) {
            if (bytes[i] >= 45 && bytes[i] <= 215) {
              parsedBpm = bytes[i];
              break;
            }
          }
        }

        // Búsqueda adaptativa en payload fisiológico (omitiendo encabezados de control comunes)
        if (!parsedBpm || parsedBpm < 35 || parsedBpm > 240) {
          const startIdx = bytes.length > 2 ? 1 : 0;
          for (let i = startIdx; i < bytes.length; i++) {
            const b = bytes[i];
            if (
              b >= 45 &&
              b <= 210 &&
              b !== 0xcd &&
              b !== 0xab &&
              b !== 0xba &&
              b !== 0xd0 &&
              b !== 0xd1 &&
              b !== 0xff &&
              b !== 0x31 &&
              b !== 0x32 &&
              b !== 0x5a &&
              b !== 0xaa &&
              b !== 0x55
            ) {
              parsedBpm = b;
              break;
            }
          }
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

        // 4. Vincular a nivel de sistema Android (Bonding opcional)
        setConnectionStage("connecting_gatt");
        try {
          const isBonded = await BleClient.isBonded(device.deviceId);
          if (!isBonded) {
            await BleClient.createBond(device.deviceId);
          }
        } catch (bondErr) {
          console.warn("Aviso al vincular (bonding):", bondErr);
        }

        // 5. Pre-desconectar para limpiar cualquier socket anterior y evitar GATT 133
        try {
          await BleClient.disconnect(device.deviceId);
        } catch {}
        await new Promise((r) => setTimeout(r, 350));

        // 6. Conectar GATT con reintento automático si Android reporta colisión
        try {
          await BleClient.connect(device.deviceId, () => {
            handleDisconnected();
          });
        } catch (firstErr) {
          console.warn("Reintentando conexión tras reset de GATT...", firstErr);
          await new Promise((r) => setTimeout(r, 700));
          await BleClient.connect(device.deviceId, () => {
            handleDisconnected();
          });
        }

        setConnectionStage("discovering_services");
        const services = await BleClient.getServices(device.deviceId);
        setDiscoveredServices(services || []);
        console.log("Servicios BLE descubiertos en dispositivo:", services);

        // 7. Intentar leer nivel de batería
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

        // 8. Suscribir ordenadamente a todas las características notificables (con delay para evitar colisiones CCCD)
        for (const s of services) {
          if (!s.characteristics) continue;
          for (const c of s.characteristics) {
            if (c.properties?.notify || c.properties?.indicate) {
              try {
                await BleClient.startNotifications(
                  device.deviceId,
                  s.uuid,
                  c.uuid,
                  (value) => {
                    handleBleRawData(value);
                  },
                );
                subs.push({
                  service: s.uuid,
                  char: c.uuid,
                  type: c.properties?.notify ? "notify" : "indicate",
                });
                await new Promise((r) => setTimeout(r, 50));
              } catch (subErr) {
                console.warn(`No se pudo suscribir a ${c.uuid}:`, subErr);
              }
            }

            // Registrar canales de escritura para activación
            if (c.properties?.write || c.properties?.writeWithoutResponse) {
              nativeWriteChars.push({
                service: s.uuid,
                char: c.uuid,
                properties: c.properties,
              });
            }
          }
        }

        setSubscribedChars(subs);

        // 9. Enviar un pulso inicial suave de activación a características de escritura rápida
        if (nativeWriteChars.length > 0) {
          setConnectionStage("activating_sensor");
          const safeTriggers = [
            [0x04, 0x01, 0x01], // Da Fit / Linwear
            [0xcd, 0x00, 0x01, 0x01], // Fitpro
            [0xba, 0x01, 0x01], // Qwatch / Umeox
            [0x01], // SIG Control Point
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
        }

        setConnectionStage("ready");
        setIsConnected(true);
        setIsConnecting(false);
        setSensorStatus("waiting_skin");
        return;
      } catch (nativeErr) {
        console.error("Error BLE nativo:", nativeErr);
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
          hrChar.addEventListener(
            "characteristicvaluechanged",
            handleBleRawData,
          );
          notifyCharRef.current = hrChar;
          notifyChars.push(hrChar);
        } catch (hrNotifErr) {
          console.warn(
            "Fallo suscribiendo a heart_rate_measurement:",
            hrNotifErr,
          );
        }

        try {
          const hrCtrl = await hrService.getCharacteristic(
            "heart_rate_control_point",
          );
          writeChars.push(hrCtrl);
        } catch {
          // Opcional en el perfil Heart Rate
        }
      } catch {
        // Servicio Heart Rate estándar no presente
      }

      // 2. Descubrir TODOS los servicios primarios para capturar canales propietarios (Fitpro, IDO, Da Fit, Wearfit)
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
                    char.addEventListener(
                      "characteristicvaluechanged",
                      handleBleRawData,
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

      // Enviar comando para activar el sensor óptico en el reloj
      setConnectionStage("activating_sensor");
      if (writeChars.length > 0) {
        await sendAllActivationCommands(writeChars);
        // Enviar ping cada 12 segundos para mantener el sensor activo
        pingTimerRef.current = setInterval(() => {
          if (writeCharsRef.current && writeCharsRef.current.length > 0) {
            sendAllActivationCommands(writeCharsRef.current).catch(() => {});
          }
        }, 12000);
      }

      setConnectionStage("ready");
      setIsConnected(true);
      setIsConnecting(false);
      setSensorStatus("waiting_skin");
    } catch (err) {
      console.error("Error al conectar Smartwatch BLE:", err);
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

  // Desconectar dispositivo Bluetooth
  const disconnectSmartwatch = useCallback(async () => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
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
  }, [handleDisconnected]);

  // Control de modo de simulación clínica (solo si el especialista lo activa explícitamente)
  const setSimulationMode = useCallback((mode) => {
    setSimulationModeState(mode);
  }, []);

  const stopSimulation = useCallback(() => {
    setSimulationModeState(null);
  }, []);

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
    setStreamToCloud,
    connectBluetoothDevice,
    disconnectSmartwatch,
    triggerSensorActivation,
    sendManualBleCommand,
    setSimulationMode,
    stopSimulation,
  };

  return (
    <SmartwatchContext.Provider value={value}>
      {children}
    </SmartwatchContext.Provider>
  );
}
