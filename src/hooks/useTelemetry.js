import { useState, useEffect, useRef, useCallback } from 'react'
import { getSocket } from './socket'
import { generateInitialData } from '../utils/dashboardMocks'

export function useTelemetry(wsUrl = 'https://backend-siat.onrender.com') {
  const [liveBpm, setLiveBpm] = useState(74)
  const [liveStress, setLiveStress] = useState(25)
  const [liveMov, setLiveMov] = useState(1.2)
  const [isWebSocketActive, setIsWebSocketActive] = useState(false)
  const [telemetryHistory, setTelemetryHistory] = useState([])
  const [simulationMode, setSimulationMode] = useState(null)
  const intervalRef = useRef(null)

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setSimulationMode(null)
  }, [])

  useEffect(() => {
    if (simulationMode === null) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const tick = () => {
      const isCrisis = simulationMode === 'CRISIS'
      const newBpm = isCrisis
        ? Math.floor(Math.random() * (140 - 110 + 1) + 110)
        : Math.floor(Math.random() * (80 - 60 + 1) + 60)
      const newStress = isCrisis
        ? Math.floor(Math.random() * (100 - 76 + 1) + 76)
        : Math.floor(Math.random() * (30 - 5 + 1) + 5)
      const newMov = isCrisis
        ? +(Math.random() * (3 - 1.5) + 1.5).toFixed(1)
        : +(Math.random() * 1.2).toFixed(1)

      setIsWebSocketActive(true)
      setLiveBpm(newBpm)
      setLiveStress(newStress)
      setLiveMov(newMov)

      setTelemetryHistory(prev => {
        const history = prev.length > 0 ? prev : generateInitialData()
        const now = new Date()
        const newRecord = {
          time: now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          bpm: newBpm,
          mov: newMov,
          stress: newStress,
          calma: 100 - newStress,
          estres: newStress
        }
        return [...history.slice(1), newRecord]
      })
    }

    tick()
    intervalRef.current = setInterval(tick, 10000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [simulationMode])

  useEffect(() => {
    setTelemetryHistory(generateInitialData())

    const socket = getSocket()

    const onConnect = () => {
      console.log('✅ Conectado al stream de telemetría')
      setIsWebSocketActive(true)
    }

    const onDisconnect = () => {
      console.log('❌ Desconectado de la telemetría')
      setIsWebSocketActive(false)
    }

    const onTelemetry = (data) => {
      setIsWebSocketActive(true)
      stopSimulation()
      setLiveBpm(data.bpm)
      setLiveStress(data.stress)
      setLiveMov(data.mov)

      setTelemetryHistory(prev => {
        const history = prev.length > 0 ? prev : generateInitialData()
        const newRecord = {
          time: data.time,
          bpm: data.bpm,
          mov: data.mov,
          stress: data.stress,
          calma: 100 - data.stress,
          estres: data.stress
        }
        return [...history.slice(1), newRecord]
      })
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('new_telemetry', onTelemetry)

    if (socket.connected) {
      setIsWebSocketActive(true)
    }

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('new_telemetry', onTelemetry)
    }
  }, [stopSimulation])

  return { liveBpm, liveStress, liveMov, isWebSocketActive, telemetryHistory, simulationMode, setSimulationMode, stopSimulation }
}
