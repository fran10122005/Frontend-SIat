import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { generateInitialData } from '../utils/dashboardMocks'

export function useTelemetry(wsUrl = 'http://localhost:3000') {
  const [liveBpm, setLiveBpm] = useState(74)
  const [liveStress, setLiveStress] = useState(25)
  const [liveMov, setLiveMov] = useState(1.2)
  const [isWebSocketActive, setIsWebSocketActive] = useState(false)
  const [telemetryHistory, setTelemetryHistory] = useState([])

  useEffect(() => {
    setTelemetryHistory(generateInitialData())

    const socket = io(wsUrl)

    socket.on('connect', () => {
      console.log('✅ Conectado al stream de telemetría')
      setIsWebSocketActive(true)
    })

    socket.on('disconnect', () => {
      console.log('❌ Desconectado de la telemetría')
      setIsWebSocketActive(false)
    })

    socket.on('new_telemetry', (data) => {
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
    })

    return () => {
      socket.disconnect()
    }
  }, [wsUrl])

  return { liveBpm, liveStress, liveMov, isWebSocketActive, telemetryHistory }
}
