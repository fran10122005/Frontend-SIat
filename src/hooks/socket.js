import { io } from "socket.io-client";

let socket = null;
const listeners = [];
const stateListeners = new Set();

// Deriva el origen del backend para Socket.io (sin el sufijo /api)
function socketURL() {
  const raw =
    import.meta.env.VITE_API_URL || "https://backend-siat.onrender.com/api";
  return raw.replace(/\/api\/?$/, "").replace(/\/+$/, "");
}

function getToken() {
  return localStorage.getItem("token");
}

function emitState(state) {
  stateListeners.forEach((cb) => cb(state));
}

export function onSocketStateChange(cb) {
  stateListeners.add(cb);
  return () => stateListeners.delete(cb);
}

export function getSocketConnectionState() {
  return socket ? socket.connected : false;
}

export function getSocket() {
  const token = getToken();
  if (!socket) {
    socket = io(socketURL(), {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      randomizationFactor: 0.5,
      pingInterval: 25000,
      pingTimeout: 10000,
    });

    // Reflejar conectividad (para el indicador Conectado/Reconectando...)
    socket.on("connect", () => {
      emitState("connected");
      // Re-suscribirse a las salas según el rol (reescucha tras reconexión)
      socket.emit("resync_rooms");
    });
    socket.on("disconnect", (reason) => {
      emitState(
        reason === "io client disconnect" ? "disconnected" : "reconnecting",
      );
    });
    socket.on("connect_error", () => emitState("reconnecting"));
  }

  if (!socket.connected) socket.connect();
  return socket;
}

// Suscribirse a eventos con re-suscripción tras reconexión
export function subscribeToSocket(event, handler) {
  listeners.push({ event, handler });
  if (socket) socket.on(event, handler);
  return () => {
    const idx = listeners.indexOf({ event, handler });
    if (idx >= 0) listeners.splice(idx, 1);
    if (socket) socket.off(event, handler);
  };
}

// Pedir unirse a la sala de un niño concreto (validado en el servidor)
export function joinChildRoom(ninCodi) {
  if (!socket || !socket.connected) return;
  socket.emit("join_child", ninCodi);
}

export function resyncSocketRooms() {
  if (socket && socket.connected) socket.emit("resync_rooms");
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  emitState("disconnected");
}
