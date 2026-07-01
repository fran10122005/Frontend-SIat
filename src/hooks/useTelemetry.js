import { useState, useEffect } from 'react'
import { getSocket } from './socket'
import { generateInitialData } from '../utils/dashboardMocks'

export function useTelemetry(wsUrl = 'https://backend-siat.onrender.com') {
  const [liveBpm, setLiveBpm] = useState(74)
  const [liveStress, setLiveStress] = useState(25)
  const [liveMov, setLiveMov] = useState(1.2)
  const [isWebSocketActive, setIsWebSocketActive] = useState(false)
  const [telemetryHistory, setTelemetryHistory] = useState([])

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
  }, [])

  return { liveBpm, liveStress, liveMov, isWebSocketActive, telemetryHistory }
}
