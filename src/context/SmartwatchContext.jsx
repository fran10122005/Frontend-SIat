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
  "0000fee7-0000-1000-8000-00805f9b34fb", // Wearfit / Telink / IDO
  "0000ae00-0000-1000-8000-00805f9b34fb",
  "0000af00-0000-1000-8000-00805f9b34fb",
  "0000fff0-0000-1000-8000-00805f9b34fb", // Fitpro / HryFine
  "0000fff1-0000-1000-8000-00805f9b34fb",
  "0000fff2-0000-1000-8000-00805f9b34fb",
  "0000ff00-0000-1000-8000-00805f9b34fb",
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART (Da Fit / Wearfit)
];

// Comandos de activación en formato numérico puro para conversión universal (DataView / Uint8Array)
const RAW_ACTIVATION_COMMANDS = [
  [0xcd, 0x00, 0x02, 0x04, 0x01], // Fitpro / HryFine Real-Time HR trigger
  [0xcd, 0x00, 0x01, 0x01], // Fitpro HR sensor start
  [0xab, 0x00, 0x04, 0xff, 0x31, 0x09, 0x01], // Wearfit / Wearfit Pro HR start
  [0xab, 0x00, 0x04, 0xff, 0x32, 0x80, 0x01], // Wearfit continuous mode
  [0xd0, 0x01, 0x01], // IDO / VeryFit (IDW13, ID205) continuous HR
  [0x05, 0x01, 0x01], // IDO HR single trigger
  [0x08, 0x01, 0x00, 0x01], // IDO continuous monitor
  [0x04, 0x01, 0x01], // Da Fit / MoYoung start
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
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [lastRawPacket, setLastRawPacket] = useState(null);
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

        // 2. Persistencia REST directa al backend
        try {
          fetch("https://backend-siat.onrender.com/api/telemetry", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).catch(() => {});
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
    setBatteryLevel(null);
    setLiveBpm(null);
    setLastBpm(null);
    setLiveStress(null);
    setLiveMov(null);
    setLastRawPacket(null);
    setSensorStatus("idle");
    setConnectionStage(null);
    deviceRef.current = null;
    notifyCharRef.current = null;
    notifyCharsRef.current = [];
    writeCharRef.current = null;
    writeCharsRef.current = [];
  }, []);

  // Parser Universal para paquetes de bytes BLE (GATT estándar, IDW13, Fitpro, Wearfit Pro, Da Fit, Aiwa, Jieli)
  const handleBleRawData = useCallback(
    (event) => {
      const dataView =
        event?.target?.value ||
        (event instanceof DataView
          ? event
          : event?.buffer
            ? new DataView(event.buffer)
            : null);
      if (!dataView || dataView.byteLength === 0) return;

      const bytes = new Uint8Array(
        dataView.buffer,
        dataView.byteOffset || 0,
        dataView.byteLength,
      );
      const hexStr = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
        .join(" ");

      setLastRawPacket({ hex: hexStr, time: Date.now(), length: bytes.length });

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

      // 2. Patrones específicos de fabricantes (Aiwa, Da Fit, Fitpro, Wearfit, Jieli)
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

        // Búsqueda general en payload fisiológico (omitiendo byte 0 de comando/cabecera)
        if (!parsedBpm) {
          const startIdx = bytes.length > 2 ? 1 : 0;
          for (let i = startIdx; i < bytes.length; i++) {
            const b = bytes[i];
            if (
              b >= 45 &&
              b <= 210 &&
              b !== 0xcd &&
              b !== 0xab &&
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

        // 4. Vincular a nivel de sistema Android (Bonding)
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

        // 8. Suscribir a todas las características notificables
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
                console.log(
                  `Suscrito a notificaciones en: ${s.uuid} / ${c.uuid}`,
                );
              } catch (subErr) {
                console.warn(`No se pudo suscribir a ${c.uuid}:`, subErr);
              }
            }

            // Registrar canales de escritura para ráfaga de activación
            if (c.properties?.write || c.properties?.writeWithoutResponse) {
              nativeWriteChars.push({
                service: s.uuid,
                char: c.uuid,
                properties: c.properties,
              });
            }
          }
        }

        // 9. Enviar ráfaga de activación en formato DataView para encender sensor óptico
        if (nativeWriteChars.length > 0) {
          setConnectionStage("activating_sensor");
          for (const wc of nativeWriteChars) {
            for (const cmdNums of RAW_ACTIVATION_COMMANDS) {
              try {
                const cmdDataView = numbersToDataView(cmdNums);
                if (wc.properties.writeWithoutResponse) {
                  await BleClient.writeWithoutResponse(
                    device.deviceId,
                    wc.service,
                    wc.char,
                    cmdDataView,
                  );
                } else {
                  await BleClient.write(
                    device.deviceId,
                    wc.service,
                    wc.char,
                    cmdDataView,
                  );
                }
                await new Promise((r) => setTimeout(r, 20));
              } catch {}
            }
          }

          // Mantener ping periódico cada 12 segundos
          pingTimerRef.current = setInterval(async () => {
            for (const wc of nativeWriteChars) {
              for (const cmdNums of RAW_ACTIVATION_COMMANDS) {
                try {
                  const cmdDataView = numbersToDataView(cmdNums);
                  if (wc.properties.writeWithoutResponse) {
                    await BleClient.writeWithoutResponse(
                      device.deviceId,
                      wc.service,
                      wc.char,
                      cmdDataView,
                    );
                  } else {
                    await BleClient.write(
                      device.deviceId,
                      wc.service,
                      wc.char,
                      cmdDataView,
                    );
                  }
                } catch {}
              }
            }
          }, 12000);
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

  const value = {
    isSupported,
    isConnected,
    isConnecting,
    connectionStage,
    deviceName,
    batteryLevel,
    lastBpm,
    lastRawPacket,
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
    setSimulationMode,
    stopSimulation,
  };

  return (
    <SmartwatchContext.Provider value={value}>
      {children}
    </SmartwatchContext.Provider>
  );
}
