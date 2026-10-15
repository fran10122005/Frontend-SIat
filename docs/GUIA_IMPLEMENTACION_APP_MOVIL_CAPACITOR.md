# 📱 Plan de Implementación: App Móvil Puente SIAT (Capacitor)

Este documento detalla la arquitectura definitiva para conectar smartwatches comerciales cerrados (como el **Aiwa AWSF13B**, Samsung Galaxy Watch, Da Fit, Wearfit, Huawei, etc.) con la plataforma web **SIAT** mediante una **App Móvil Puente** desarrollada con **Capacitor**.

---

## 🏗️ 1. Diagrama de Flujo del Ecosistema

Dado que los smartwatches comerciales no emiten el protocolo abierto Bluetooth SIG hacia navegadores de escritorio (PC), el teléfono celular actúa como el **puente de enlace inteligente**:

```
 ┌──────────────────────┐
 │ Smartwatch Comercial │  (Aiwa AWSF13B)
 └──────────┬───────────┘
            │  Bluetooth Propietario (Fabricante)
            ▼
 ┌──────────────────────┐
 │ App del Fabricante   │  (Aiwa Wear / Da Fit / Samsung Health)
 └──────────┬───────────┘
            │  Sincronización Automática
            ▼
 ┌──────────────────────┐
 │ Android Health /     │  (Almacén Seguro de Salud de Android)
 │ Health Connect       │
 └──────────┬───────────┘
            │  Lectura de Frecuencia Cardíaca
            ▼
 ┌──────────────────────┐
 │ App Móvil SIAT       │  (Capacitor + React Frontend)
 └──────────┬───────────┘
            │  HTTPS / WebSockets en Tiempo Real
            ▼
 ┌──────────────────────┐
 │ Backend SIAT         │  (Express + PostgreSQL / TimescaleDB en Render)
 └──────────┬───────────┘
            │  Socket.io: new_telemetry
            ▼
 ┌──────────────────────┐
 │ Panel Especialista   │  (PC / Web en Netlify / Localhost)
 └──────────────────────┘  ¡Gráficos de Estrés y BPM en Vivo!
```

---

## 🚀 2. Pasos para Configurar Capacitor en SIAT

### Paso 1: Instalar dependencias de Capacitor en el proyecto Frontend
En la raíz de `SIAT`:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Paso 2: Inicializar la configuración de Capacitor
```bash
npx cap init "SIAT" "com.siat.app" --web-dir "dist"
```

Esto generará el archivo `capacitor.config.json` o `capacitor.config.ts`.

### Paso 3: Agregar la plataforma Android
```bash
npm run build
npx cap add android
```

### Paso 4: Instalar el plugin de Salud (Health / Health Connect)
Para leer las pulsaciones que el reloj Aiwa registra en el teléfono:
```bash
npm install @capawesome/capacitor-health-connect
```
*(O el plugin `@perfood/capacitor-healthkit` para soporte iOS/Apple Health).*

---

## ⚡ 3. Código del Servicio de Telemetría Móvil en SIAT

Se integra un listener dentro de `src/services/mobileTelemetryBridge.js`:

```javascript
import { HealthConnect } from '@capawesome/capacitor-health-connect';
import { getSocket } from '../hooks/socket';
import { getSavedSelectedChild } from '../utils/authStorage';

let syncInterval = null;

export const startMobileHealthBridge = async () => {
  try {
    // 1. Verificar disponibilidad de Health Connect en Android
    const isAvailable = await HealthConnect.isAvailable();
    if (!isAvailable.available) {
      console.warn('Health Connect no disponible en este dispositivo');
      return;
    }

    // 2. Solicitar permisos de lectura de frecuencia cardíaca
    await HealthConnect.requestPermissions({
      read: ['HeartRate'],
      write: []
    });

    // 3. Monitorear periódicamente lecturas recientes del reloj
    syncInterval = setInterval(async () => {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000);

      const records = await HealthConnect.readRecords({
        recordType: 'HeartRate',
        timeRangeFilter: {
          startTime: oneMinuteAgo.toISOString(),
          endTime: now.toISOString()
        }
      });

      if (records && records.records && records.records.length > 0) {
        const latestSample = records.records[records.records.length - 1];
        const bpm = latestSample.samples[latestSample.samples.length - 1]?.beatsPerMinute;

        if (bpm) {
          const child = getSavedSelectedChild();
          const socket = getSocket();

          // Enviar inmediatamente al backend SIAT
          if (socket && socket.connected) {
            socket.emit('telemetry_data', {
              nin_codi: child?.id || null,
              bpm: Number(bpm),
              stress: Math.min(100, Math.max(5, Math.round(((bpm - 60) / 70) * 100))),
              mov: 1.0,
              deviceName: 'Smartwatch (Mobile Bridge)',
              time: new Date().toLocaleTimeString('es-ES')
            });
          }
        }
      }
    }, 3000); // Consulta cada 3 segundos
  } catch (error) {
    console.error('Error en mobile health bridge:', error);
  }
};

export const stopMobileHealthBridge = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};
```

---

## 🎯 4. Ventajas de esta Arquitectura

1. **Universal para cualquier reloj comercial:** No importa si es Aiwa, Samsung, Xiaomi, Huawei o Apple Watch; todos guardan sus pulsaciones en el sistema de salud del teléfono.
2. **Sin botones simulados ni trucos:** Las lecturas son 100% reales provenientes del sensor del reloj.
3. **Libertad de movimiento para el niño:** El niño puede estar en cualquier lugar del aula o consultorio con el reloj puesto y el teléfono cerca; los datos viajan por Wi-Fi o datos móviles a la pantalla del especialista en la PC.
4. **Cero configuraciones complicadas en la PC:** El especialista solo abre su navegador en la computadora y ve la gráfica en vivo.
