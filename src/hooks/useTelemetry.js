import { useSmartwatch } from "../context/SmartwatchContext";

export function useTelemetry() {
  const {
    isConnected,
    liveBpm,
    liveStress,
    liveMov,
    isWebSocketActive,
    telemetryHistory,
    simulationMode,
    setSimulationMode,
    stopSimulation,
  } = useSmartwatch();

  return {
    isConnected,
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
