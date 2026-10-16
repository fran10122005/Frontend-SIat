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
import { BleClient } from "@capacitor-community/bluetooth-le";

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

// Comandos de activación para encender el sensor óptico PPG (LED verde) en múltiples chipsets
const ACTIVATION_COMMANDS = [
  new Uint8Array([0xcd, 0x00, 0x02, 0x04, 0x01]), // Fitpro / HryFine Real-Time HR trigger
  new Uint8Array([0xcd, 0x00, 0x01, 0x01]), // Fitpro HR sensor start
  new Uint8Array([0xab, 0x00, 0x04, 0xff, 0x31, 0x09, 0x01]), // Wearfit / Wearfit Pro HR start
  new Uint8Array([0xab, 0x00, 0x04, 0xff, 0x32, 0x80, 0x01]), // Wearfit continuous mode
  new Uint8Array([0xd0, 0x01, 0x01]), // IDO / VeryFit (IDW13, ID205) continuous HR
  new Uint8Array([0x05, 0x01, 0x01]), // IDO HR single trigger
  new Uint8Array([0x08, 0x01, 0x00, 0x01]), // IDO continuous monitor
  new Uint8Array([0x04, 0x01, 0x01]), // Da Fit / MoYoung start
  new Uint8Array([0x01, 0x00, 0x01]), // Generic Nordic UART start
  new Uint8Array([0x01]), // SIG Control Point reset / start
];

export function SmartwatchProvider({ children }) {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStage, setConnectionStage] = useState(null); // 'scanning' | 'connecting_gatt' | 'discovering_services' | 'activating_sensor' | 'ready' | null
  const [errorMsg, setErrorMsg] = useState(null);

  // Estado del dispositivo
  const [isConnected, setIsConnected] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_CONNECTED) === "true";
  });
  const [deviceName, setDeviceName] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_DEVICE) || "";
  });
  const [batteryLevel, setBatteryLevel] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_BATTERY);
    return saved ? Number(saved) : null;
  });
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

  // Persistir estado de conexión en localStorage
  useEffect(() => {
    if (isConnected && deviceName) {
      localStorage.setItem(STORAGE_KEY_CONNECTED, "true");
      localStorage.setItem(STORAGE_KEY_DEVICE, deviceName);
      if (batteryLevel !== null) {
        localStorage.setItem(STORAGE_KEY_BATTERY, String(batteryLevel));
      }
    } else {
      localStorage.removeItem(STORAGE_KEY_CONNECTED);
      localStorage.removeItem(STORAGE_KEY_DEVICE);
      localStorage.removeItem(STORAGE_KEY_BATTERY);
    }
  }, [isConnected, deviceName, batteryLevel]);

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

      // Transmisión al backend por WebSockets si está habilitado
      if (source === "ble" && streamToCloud) {
        try {
          const socket = getSocket();
          if (socket && socket.connected) {
            const savedChild = getSavedSelectedChild();
            socket.emit("telemetry_data", {
              nin_codi: data.nin_codi || savedChild?.id || null,
              ses_codi: data.ses_codi || activeSessionIdRef.current || null,
              bpm,
              stress,
              mov,
              time: timeStr,
              deviceName: data.deviceName || deviceName || "Smartwatch BLE",
            });
          }
        } catch (err) {
          console.warn("Error enviando socket telemetry:", err);
        }
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
    setSensorStatus("idle");
    setConnectionStage(null);
    deviceRef.current = null;
    notifyCharRef.current = null;
    notifyCharsRef.current = [];
    writeCharRef.current = null;
    writeCharsRef.current = [];
  }, []);

  // Parser Universal para paquetes de bytes BLE (GATT estándar, IDW13, Fitpro, Wearfit Pro, Da Fit)
  const handleBleRawData = useCallback(
    (event) => {
      const dataView = event.target.value;
      if (!dataView || dataView.byteLength === 0) return;

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

      // 2. Caso Propietario IDO / VeryFit / Fitpro / Wearfit / Da Fit
      if (!parsedBpm || parsedBpm < 35 || parsedBpm > 240) {
        const bytes = new Uint8Array(dataView.buffer);
        // Buscar un byte en rango fisiológico válido (40 - 220 BPM), omitiendo bytes de comando conocidos
        for (let i = 0; i < bytes.length; i++) {
          const b = bytes[i];
          if (
            b >= 40 &&
            b <= 215 &&
            b !== 0xcd &&
            b !== 0xab &&
            b !== 0xd0 &&
            b !== 0xd1 &&
            b !== 0xff
          ) {
            parsedBpm = b;
            break;
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

  // Enviar ráfaga de activación a todas las características de escritura encontradas
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
        const device = await BleClient.requestDevice({
          optionalServices: KNOWN_SERVICES,
        });

        if (!device) {
          setIsConnecting(false);
          setConnectionStage(null);
          return;
        }

        setDeviceName(device.name || "Smartwatch BLE");
        setConnectionStage("connecting_gatt");

        await BleClient.connect(device.deviceId, () => {
          handleDisconnected();
        });

        setConnectionStage("discovering_services");
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
        } catch {
          // Batería no disponible
        }

        // Suscribirse al sensor óptico de ritmo cardíaco
        try {
          await BleClient.startNotifications(
            device.deviceId,
            "0000180d-0000-1000-8000-00805f9b34fb",
            "00002a37-0000-1000-8000-00805f9b34fb",
            (value) => {
              handleBleRawData({ target: { value } });
            },
          );
        } catch (subErr) {
          console.warn("No se pudo suscribir a Heart Rate estándar:", subErr);
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
  const disconnectSmartwatch = useCallback(() => {
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
    if (
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
