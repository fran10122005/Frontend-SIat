import { io } from "socket.io-client";

// Singleton global: una única instancia de socket por sesión de usuario.
// Si cambia el token (login/logout) la instancia se recrea para no conservar
// la identidad del usuario anterior.
let socket = null;
let socketToken = null;
const listeners = new Map(); // event → Set<handler>
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

// Re-aplica los suscriptores activos a la instancia actual (útil cuando se
// recrea el socket tras un cambio de token o una reconexión del servidor).
function reapplyListeners() {
  if (!socket) return;
  listeners.forEach((handlers, event) => {
    handlers.forEach((handler) => socket.on(event, handler));
  });
}

function createSocket(token) {
  socket = io(socketURL(), {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 30000,
    randomizationFactor: 0.5,
  });

  // Reflejar conectividad (para el indicador Conectado/Reconectando...)
  socket.on("connect", () => {
    emitState("connected");
    // No emitir `resync_rooms` aquí: el servidor sincroniza las salas en cada
    // `connection`, así que hacerlo también duplicaría las uniones a salas.
  });
  socket.on("disconnect", (reason) => {
    emitState(
      reason === "io client disconnect" ? "disconnected" : "reconnecting",
    );
  });
  socket.on("connect_error", () => emitState("reconnecting"));

  reapplyListeners();
}

function destroySocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = null;
  socketToken = null;
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
  if (socket && token !== socketToken) {
    // Cambió el usuario/sesión: cerrar el socket anterior para no conservar
    // sus salas ni su identidad.
    destroySocket();
  }
  if (!socket) {
    socketToken = token;
    createSocket(token);
  }
  if (!socket.connected) socket.connect();
  return socket;
}

// Suscribirse a un evento con limpieza y re-suscripción automática si el
// socket se recrea (cambio de token). Devuelve una función para desuscribirse.
export function subscribeToSocket(event, handler) {
  let handlers = listeners.get(event);
  if (!handlers) {
    handlers = new Set();
    listeners.set(event, handlers);
  }
  const isNew = !handlers.has(handler);
  handlers.add(handler);
  if (socket && isNew) socket.on(event, handler);

  return () => {
    handlers.delete(handler);
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
  destroySocket();
  emitState("disconnected");
}
