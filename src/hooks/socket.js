import { io } from 'socket.io-client'

let socket = null
let listeners = []

function getToken() {
  return localStorage.getItem('token')
}

export function getSocket() {
  const token = getToken()
  if (!socket || !socket.connected) {
    if (socket) socket.removeAllListeners()
    socket = io('http://localhost:3000', {
      auth: { token }
    })
  }
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners()
    socket.disconnect()
    socket = null
  }
}
