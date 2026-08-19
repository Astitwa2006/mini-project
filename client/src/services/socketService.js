import { io } from 'socket.io-client';

// Use explicit URL if provided. Otherwise, in dev fallback to localhost:3001. In prod, fallback to empty string (current origin).
const SERVER_URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? 'http://localhost:3001' : '');

let socket = null;

/**
 * Creates (or returns) the Socket.io client instance.
 * Passes the Supabase JWT in the handshake auth object.
 */
export function getSocket(token) {
  if (socket && socket.connected) return socket;

  socket = io(SERVER_URL, {
    auth:           { token },
    reconnection:   true,
    reconnectionAttempts: 5,
    reconnectionDelay:    1000,
    transports:     ['websocket'],
  });

  socket.on('connect',           () => console.log('[Socket] Connected:', socket.id));
  socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
  socket.on('connect_error',  (err) => console.error('[Socket] Error:', err.message));

  return socket;
}

/** Disconnects and nulls the socket instance */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
