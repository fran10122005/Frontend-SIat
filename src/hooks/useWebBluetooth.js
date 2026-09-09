import { useSmartwatch } from "../context/SmartwatchContext";

/**
 * Hook para conectar Smartwatches y sensores de ritmo cardíaco mediante WebBluetooth API (GATT Profile 0x180D)
 * Ahora centralizado en el SmartwatchContext para persistencia y sincronía global.
 */
export function useWebBluetooth() {
  const {
    isSupported,
    isConnected,
    isConnecting,
    deviceName,
    batteryLevel,
    lastBpm,
    errorMsg,
    connectBluetoothDevice,
    disconnectSmartwatch,
  } = useSmartwatch();

  return {
    isSupported,
    isConnected,
    isConnecting,
    deviceName,
    batteryLevel,
    lastBpm,
    errorMsg,
    connectBluetoothDevice,
    disconnectBluetoothDevice: disconnectSmartwatch,
  };
}
