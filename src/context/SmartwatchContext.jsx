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

// UUIDs de servicios BLE conocidos (Estándar, Fitpro, Wearfit Pro, Nordic UART)
const KNOWN_SERVICES = [
  "heart_rate",
  "battery_service",
  "device_information",
  "0000180d-0000-1000-8000-00805f9b34fb", // Heart Rate SIG
  "0000180f-0000-1000-8000-00805f9b34fb", // Battery Service
  "0000fff0-0000-1000-8000-00805f9b34fb", // Fitpro / HryFine
  "0000fee7-0000-1000-8000-00805f9b34fb", // Wearfit / Telink
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e", // Nordic UART (Da Fit / Wearfit)
];

// Comandos de activación para encender el sensor óptico PPG (LED verde)
const ACTIVATION_COMMANDS = [
  new Uint8Array([0xcd, 0x00, 0x01, 0x01]), // Fitpro HR start
  new Uint8Array([0xab, 0x00, 0x04, 0xff, 0x31, 0x09, 0x01]), // Wearfit HR start
  new Uint8Array([0x01, 0x00, 0x01]), // Generic UART start
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

  const deviceRef = useRef(null);
  const notifyCharRef = useRef(null);
  const writeCharRef = useRef(null);
  const pingTimerRef = useRef(null);
  const lastProcessedTimeRef = useRef(0);

  // Comprobar soporte para WebBluetooth API
  useEffect(() => {
    if (typeof window !== "undefined" && "bluetooth" in navigator) {
      setIsSupported(true);
    }
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

      // Transmisión al backend por WebSockets si está habilitado
      if (source === "ble" && streamToCloud) {
        try {
          const socket = getSocket();
          if (socket && socket.connected) {
            socket.emit("telemetry_data", {
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
    deviceRef.current = null;
    notifyCharRef.current = null;
    writeCharRef.current = null;
  }, []);

  // Parser Universal para paquetes de bytes BLE (GATT estándar, Fitpro, Wearfit Pro)
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
      } catch (err) {
        // Ignorar si no es estructura estándar
      }

      // 2. Caso Fitpro / HryFine / Wearfit Pro (Tramas con cabeceras 0xCD, 0xAB o paquetes de telemetría)
      if (!parsedBpm || parsedBpm < 30 || parsedBpm > 240) {
        const bytes = new Uint8Array(dataView.buffer);
        // Buscar un byte en rango fisiológico válido (40 - 220 BPM)
        for (let i = 0; i < bytes.length; i++) {
          const b = bytes[i];
          if (b >= 45 && b <= 210) {
            // Comprobación de cabecera o posición
            if (
              i >= 1 &&
              (bytes[0] === 0xcd || bytes[0] === 0xab || bytes[0] === 0xff)
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

  // Enviar comando de activación para encender el LED verde del sensor óptico
  const sendActivationCommand = async (writeChar) => {
    if (!writeChar) return;
    for (const cmd of ACTIVATION_COMMANDS) {
      try {
        if (writeChar.properties.writeWithoutResponse) {
          await writeChar.writeValueWithoutResponse(cmd);
        } else if (writeChar.properties.write) {
          await writeChar.writeValueWithResponse(cmd);
        }
        break;
      } catch (err) {
        // Intentar siguiente comando de activación
      }
    }
  };

  // Conectar dispositivo Smartwatch por Bluetooth LE (WebBluetooth API Real)
  const connectBluetoothDevice = useCallback(async () => {
    if (!isSupported) {
      setErrorMsg(
        "Tu navegador no soporta WebBluetooth. Usa Google Chrome o Microsoft Edge sobre HTTPS o localhost.",
      );
      return;
    }

    setErrorMsg(null);
    setIsConnecting(true);
    setConnectionStage("scanning");

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
        const batteryService =
          await server.getPrimaryService("battery_service");
        const batteryChar =
          await batteryService.getCharacteristic("battery_level");
        const val = await batteryChar.readValue();
        setBatteryLevel(val.getUint8(0));
      } catch {
        setBatteryLevel(null);
      }

      // Buscar características de Notificación y Escritura en los servicios disponibles
      let foundNotify = false;

      // 1. Intentar Servicio Estándar Heart Rate
      try {
        const hrService = await server.getPrimaryService("heart_rate");
        const hrChar = await hrService.getCharacteristic(
          "heart_rate_measurement",
        );
        await hrChar.startNotifications();
        hrChar.addEventListener("characteristicvaluechanged", handleBleRawData);
        notifyCharRef.current = hrChar;
        foundNotify = true;
      } catch (err) {
        // Probar servicios propietarios Fitpro / Wearfit
      }

      // 2. Intentar Servicios Propietarios Fitpro / Wearfit / Da Fit si el estándar no está
      if (!foundNotify) {
        const services = await server.getPrimaryServices();
        for (const service of services) {
          try {
            const characteristics = await service.getCharacteristics();
            for (const char of characteristics) {
              if (char.properties.notify || char.properties.indicate) {
                await char.startNotifications();
                char.addEventListener(
                  "characteristicvaluechanged",
                  handleBleRawData,
                );
                notifyCharRef.current = char;
                foundNotify = true;
              }
              if (
                char.properties.write ||
                char.properties.writeWithoutResponse
              ) {
                writeCharRef.current = char;
              }
            }
          } catch {
            // Continuar explorando servicios
          }
        }
      }

      // Enviar comando para activar el sensor óptico en el reloj
      setConnectionStage("activating_sensor");
      if (writeCharRef.current) {
        await sendActivationCommand(writeCharRef.current);
        // Enviar ping cada 15 segundos para mantener el sensor activo en modelos Fitpro/Wearfit
        pingTimerRef.current = setInterval(() => {
          if (writeCharRef.current) {
            sendActivationCommand(writeCharRef.current).catch(() => {});
          }
        }, 15000);
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
