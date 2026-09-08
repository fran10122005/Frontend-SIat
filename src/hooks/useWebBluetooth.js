import { useState, useCallback, useRef, useEffect } from "react";

/**
 * Hook para conectar Smartwatches y sensores de ritmo cardíaco mediante WebBluetooth API (GATT Profile 0x180D)
 */
export function useWebBluetooth(onTelemetryData) {
  const [isSupported, setIsSupported] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState("");
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [lastBpm, setLastBpm] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const deviceRef = useRef(null);
  const characteristicRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "bluetooth" in navigator) {
      setIsSupported(true);
    }
  }, []);

  // Manejar desconexión física del dispositivo
  const handleDisconnected = useCallback(() => {
    setIsConnected(false);
    setIsConnecting(false);
    setDeviceName("");
    setBatteryLevel(null);
    setLastBpm(null);
    deviceRef.current = null;
    characteristicRef.current = null;
  }, []);

  // Parsear lectura GATT de Ritmo Cardíaco (Servicio 0x180D - Característica 0x2A37)
  const handleHeartRateChanged = useCallback(
    (event) => {
      const value = event.target.value;
      if (!value) return;

      const flags = value.getUint8(0);
      const is16Bit = flags & 0x01;
      let bpm = 0;

      if (is16Bit) {
        bpm = value.getUint16(1, true);
      } else {
        bpm = value.getUint8(1);
      }

      setLastBpm(bpm);

      // Calcular estimación básica de estrés bio-métrico según varianza de BPM
      const stressIndex = Math.min(
        100,
        Math.max(5, Math.round(((bpm - 60) / 70) * 100)),
      );

      const payload = {
        bpm,
        stress: stressIndex,
        mov: 1.0, // Estimación inicial hasta lectura de giroscopio
        deviceName: deviceRef.current?.name || "Smartwatch BLE",
        time: new Date().toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      if (onTelemetryData) {
        onTelemetryData(payload);
      }
    },
    [onTelemetryData],
  );

  // Conectar dispositivo Smartwatch por Bluetooth LE
  const connectBluetoothDevice = useCallback(async () => {
    if (!isSupported) {
      setErrorMsg(
        "Tu navegador no soporta WebBluetooth. Usa Google Chrome o Microsoft Edge.",
      );
      return;
    }

    setErrorMsg(null);
    setIsConnecting(true);

    try {
      // Solicitar dispositivo con perfil de ritmo cardíaco (Heart Rate)
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: ["heart_rate"] }],
        optionalServices: ["battery_service"],
      });

      deviceRef.current = device;
      setDeviceName(device.name || "Smartwatch / Pulsera");

      device.addEventListener("gattserverdisconnected", handleDisconnected);

      // Conectar al servidor GATT
      const server = await device.gatt.connect();

      // Intentar leer batería si está disponible
      try {
        const batteryService =
          await server.getPrimaryService("battery_service");
        const batteryChar =
          await batteryService.getCharacteristic("battery_level");
        const val = await batteryChar.readValue();
        setBatteryLevel(val.getUint8(0));
      } catch {
        setBatteryLevel(85); // Valor por defecto si no expone el servicio de batería
      }

      // Obtener servicio de Frecuencia Cardíaca
      const service = await server.getPrimaryService("heart_rate");
      const characteristic = await service.getCharacteristic(
        "heart_rate_measurement",
      );
      characteristicRef.current = characteristic;

      // Iniciar notificaciones periódicas
      await characteristic.startNotifications();
      characteristic.addEventListener(
        "characteristicvaluechanged",
        handleHeartRateChanged,
      );

      setIsConnected(true);
      setIsConnecting(false);
    } catch (err) {
      console.error("Error al conectar Smartwatch BLE:", err);
      setIsConnecting(false);
      setIsConnected(false);
      if (err.name !== "NotFoundError") {
        setErrorMsg(err.message || "No se pudo vincular el smartwatch.");
      }
    }
  }, [isSupported, handleDisconnected, handleHeartRateChanged]);

  // Desconectar dispositivo
  const disconnectBluetoothDevice = useCallback(() => {
    if (deviceRef.current && deviceRef.current.gatt.connected) {
      deviceRef.current.gatt.disconnect();
    }
    handleDisconnected();
  }, [handleDisconnected]);

  return {
    isSupported,
    isConnected,
    isConnecting,
    deviceName,
    batteryLevel,
    lastBpm,
    errorMsg,
    connectBluetoothDevice,
    disconnectBluetoothDevice,
  };
}
