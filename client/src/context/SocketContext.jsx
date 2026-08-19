import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { getSocket, disconnectSocket } from '../services/socketService.js';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    const socket = getSocket(token);
    socketRef.current = socket;

    const handleConnect    = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    socket.on('connect',    handleConnect);
    socket.on('disconnect', handleDisconnect);

    // Pass the exact handler refs — socket.off(event) with no handler
    // would remove EVERY listener for that event (including the
    // debug-logging ones socketService.js attaches once at socket
    // creation), not just the ones registered here.
    return () => {
      socket.off('connect',    handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [token]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside <SocketProvider>');
  return ctx;
}
