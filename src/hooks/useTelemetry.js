import { useState, useEffect, useRef, useCallback } from "react";
import {
  getSocket,
  subscribeToSocket,
  getSocketConnectionState,
} from "./socket";

export function useTelemetry(wsUrl = "https://backend-siat.onrender.com") {
  const [liveBpm, setLiveBpm] = useState(74);
  const [liveStress, setLiveStress] = useState(25);
  const [liveMov, setLiveMov] = useState(1.2);
  const [isWebSocketActive, setIsWebSocketActive] = useState(false);
  const [telemetryHistory, setTelemetryHistory] = useState([]);
  const [simulationMode, setSimulationMode] = useState(null);
  const intervalRef = useRef(null);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setSimulationMode(null);
  }, []);

  useEffect(() => {
    if (simulationMode === null) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const tick = () => {
      const isCrisis = simulationMode === "CRISIS";
      const newBpm = isCrisis
        ? Math.floor(Math.random() * (140 - 110 + 1) + 110)
        : Math.floor(Math.random() * (80 - 60 + 1) + 60);
      const newStress = isCrisis
        ? Math.floor(Math.random() * (100 - 76 + 1) + 76)
        : Math.floor(Math.random() * (30 - 5 + 1) + 5);
      const newMov = isCrisis
        ? +(Math.random() * (3 - 1.5) + 1.5).toFixed(1)
        : +(Math.random() * 1.2).toFixed(1);

      setIsWebSocketActive(true);
      setLiveBpm(newBpm);
      setLiveStress(newStress);
      setLiveMov(newMov);

      setTelemetryHistory((prev) => {
        const history = prev.length > 0 ? prev : [];
        const now = new Date();
        const newRecord = {
          time: now.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
          bpm: newBpm,
          mov: newMov,
          stress: newStress,
          calma: 100 - newStress,
          estres: newStress,
        };
        return [...history.slice(1), newRecord];
      });
    };

    tick();
    intervalRef.current = setInterval(tick, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [simulationMode]);

  useEffect(() => {
    setTelemetryHistory([]);

    getSocket();

    const unsubConnect = subscribeToSocket("connect", () => {
      console.log("✅ Conectado al stream de telemetría");
      setIsWebSocketActive(true);
    });

    const unsubDisconnect = subscribeToSocket("disconnect", () => {
      console.log("❌ Desconectado de la telemetría");
      setIsWebSocketActive(false);
    });

    const handleIncomingData = (data) => {
      setIsWebSocketActive(true);
      stopSimulation();
      setLiveBpm(data.bpm);
      setLiveStress(data.stress);
      setLiveMov(data.mov || 1.2);

      setTelemetryHistory((prev) => {
        const newRecord = {
          time:
            data.time ||
            new Date().toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
          bpm: data.bpm,
          mov: data.mov || 1.2,
          stress: data.stress,
          calma: 100 - data.stress,
          estres: data.stress,
        };
        return [...prev.slice(-9), newRecord];
      });
    };

    const unsubTelemetry = subscribeToSocket(
      "new_telemetry",
      handleIncomingData,
    );
    const unsubTelemetryData = subscribeToSocket(
      "telemetry_data",
      handleIncomingData,
    );

    const handleLocalEvent = (e) => {
      if (e.detail) {
        handleIncomingData(e.detail);
      }
    };
    window.addEventListener("siat_local_telemetry", handleLocalEvent);

    if (getSocketConnectionState()) {
      setIsWebSocketActive(true);
    }

    return () => {
      unsubConnect();
      unsubDisconnect();
      unsubTelemetry();
      unsubTelemetryData();
      window.removeEventListener("siat_local_telemetry", handleLocalEvent);
    };
  }, [stopSimulation]);

  return {
    liveBpm,
    liveStress,
    liveMov,
    isWebSocketActive,
    telemetryHistory,
    simulationMode,
    setSimulationMode,
    stopSimulation,
  };
}
