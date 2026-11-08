import { describe, it, expect, vi } from "vitest";
import {
  parseBluetoothSigHeartRate,
  parseOemHeartRateBytes,
  HeartRateTelemetryService,
} from "./heartRateTelemetryService";

describe("HeartRateTelemetryService & SIG 0x2A37 Parser", () => {
  it("debe parsear correctamente formato UINT8 según Bluetooth SIG (Flag bit 0 = 0)", () => {
    // Flag: 0x00 (bit 0 = 0 => UINT8), BPM: 72 (0x48)
    const buffer = new Uint8Array([0x00, 72]);
    const dataView = new DataView(buffer.buffer);

    const bpm = parseBluetoothSigHeartRate(dataView);
    expect(bpm).toBe(72);
  });

  it("debe parsear correctamente formato UINT16 Little-Endian según Bluetooth SIG (Flag bit 0 = 1)", () => {
    // Flag: 0x01 (bit 0 = 1 => UINT16 Little Endian), 85 BPM = 0x0055 => [0x55, 0x00]
    const buffer = new Uint8Array([0x01, 0x55, 0x00]);
    const dataView = new DataView(buffer.buffer);

    const bpm = parseBluetoothSigHeartRate(dataView);
    expect(bpm).toBe(85);
  });

  it("debe descartar valores fisiológicamente inválidos (<35 o >240 BPM)", () => {
    const bufferTooLow = new Uint8Array([0x00, 20]);
    const bufferTooHigh = new Uint8Array([0x00, 255]);

    expect(
      parseBluetoothSigHeartRate(new DataView(bufferTooLow.buffer)),
    ).toBeNull();
    expect(
      parseBluetoothSigHeartRate(new DataView(bufferTooHigh.buffer)),
    ).toBeNull();
  });

  it("debe parsear paquetes propietarios OEM (Da Fit, Fitpro) como fallback adaptativo", () => {
    // Da Fit: [0x04, 0x01, bpm]
    const daFitBuffer = new Uint8Array([0x04, 0x01, 82]);
    expect(parseOemHeartRateBytes(new DataView(daFitBuffer.buffer))).toBe(82);

    // Da Fit lectura real 89 BPM cuando el reloj muestra 89
    const daFit89 = new Uint8Array([0x04, 0x01, 89]);
    expect(parseOemHeartRateBytes(new DataView(daFit89.buffer))).toBe(89);

    // Da Fit respuesta ACK [0x04, 0x81, 0x01] NO debe confundirse con 129 BPM (0x81 = 129)
    const daFitAck = new Uint8Array([0x04, 0x81, 0x01]);
    expect(parseOemHeartRateBytes(new DataView(daFitAck.buffer))).toBeNull();
    expect(
      parseBluetoothSigHeartRate(new DataView(daFitAck.buffer)),
    ).toBeNull();

    // Fitpro: [0xCD, 0x00, 0x02, bpm]
    const fitproBuffer = new Uint8Array([0xcd, 0x00, 0x02, 90]);
    expect(parseOemHeartRateBytes(new DataView(fitproBuffer.buffer))).toBe(90);

    // Fitpro ACK [0xCD, 0x81, 0x01] NO debe confundirse con 129 BPM
    const fitproAck = new Uint8Array([0xcd, 0x81, 0x01]);
    expect(parseOemHeartRateBytes(new DataView(fitproAck.buffer))).toBeNull();
    expect(
      parseBluetoothSigHeartRate(new DataView(fitproAck.buffer)),
    ).toBeNull();

    // Paquete corto ACK genérico [0x81, 0x01] NO debe confundirse con 129 BPM
    const genericAck = new Uint8Array([0x81, 0x01]);
    expect(parseOemHeartRateBytes(new DataView(genericAck.buffer))).toBeNull();
    expect(
      parseBluetoothSigHeartRate(new DataView(genericAck.buffer)),
    ).toBeNull();

    // Pulso real de 129 BPM en formato estándar Bluetooth SIG 0x2A37 debe ser aceptado
    const legitimate129Sig = new Uint8Array([0x06, 129]);
    expect(
      parseBluetoothSigHeartRate(new DataView(legitimate129Sig.buffer)),
    ).toBe(129);
  });

  it("debe emitir lecturas bajo la interfaz estandarizada con source BLE_DIRECT y HEALTH_CONNECT", () => {
    const callback = vi.fn();
    const unsubscribe = HeartRateTelemetryService.onReading(callback);

    HeartRateTelemetryService.dispatchReading({
      bpm: 78,
      timestamp: "2026-10-16T10:00:00.000Z",
      source: "BLE_DIRECT",
      deviceName: "Samsung Galaxy Watch",
    });

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        bpm: 78,
        source: "BLE_DIRECT",
        deviceName: "Samsung Galaxy Watch",
        timestamp: "2026-10-16T10:00:00.000Z",
      }),
    );

    HeartRateTelemetryService.dispatchReading({
      bpm: 88,
      timestamp: "2026-10-16T10:05:00.000Z",
      source: "HEALTH_CONNECT",
      deviceName: "Xiaomi Smart Band (Zepp)",
    });

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        bpm: 88,
        source: "HEALTH_CONNECT",
        deviceName: "Xiaomi Smart Band (Zepp)",
        timestamp: "2026-10-16T10:05:00.000Z",
      }),
    );

    unsubscribe();
  });

  it("debe inyectar un lote simulado de 3 muestras de Health Connect para desarrollo", () => {
    const readings = [];
    const unsubscribe = HeartRateTelemetryService.onReading((r) =>
      readings.push(r),
    );

    const result = HeartRateTelemetryService.simulateHealthConnectBatch(
      [78, 85, 92],
      "Samsung Galaxy Watch (Health Connect)",
    );

    expect(result.newReadings).toHaveLength(3);
    expect(result.lastSample.bpm).toBe(92);
    expect(result.lastSample.source).toBe("HEALTH_CONNECT");
    expect(
      readings.some((r) => r.bpm === 78 && r.source === "HEALTH_CONNECT"),
    ).toBe(true);
    expect(
      readings.some((r) => r.bpm === 85 && r.source === "HEALTH_CONNECT"),
    ).toBe(true);
    expect(
      readings.some((r) => r.bpm === 92 && r.source === "HEALTH_CONNECT"),
    ).toBe(true);

    unsubscribe();
  });
});
