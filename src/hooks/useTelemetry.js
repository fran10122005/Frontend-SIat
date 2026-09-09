import { useSmartwatch } from "../context/SmartwatchContext";

export function useTelemetry() {
  const {
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
