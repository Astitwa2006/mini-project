import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import { useGameSocket } from '../hooks/useGameSocket.js';
import { useGame } from '../context/GameContext.jsx';
import { SOCKET_EVENTS } from '../utils/constants.js';
import { useSocket } from '../context/SocketContext.jsx';
import Loader from '../components/ui/Loader.jsx';

/**
 * JoinPage handles both:
 * 1. Direct link: /join/ABC123
 * 2. Manual code entry redirected from LobbyPage
 *
 * If the user isn't logged in, it stores the intended code in sessionStorage
 * and redirects to /login, which will redirect back here after auth.
 */
export default function JoinPage() {
  const { code } = useParams();
  const navigate  = useNavigate();
  const { user, loading } = useAuth();
  const { socket } = useSocket();
  const { dispatch } = useGame();
  useGameSocket(); // keeps room/game listeners live during the brief join window

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Not logged in — save code and redirect to login
      sessionStorage.setItem('pendingJoinCode', code);
      navigate(`/login?redirect=/join/${code}`, { replace: true });
      return;
    }

    if (!socket) return;

    // Look up room info first (to validate code before socket join)
    api.getRoom(code)
      .then((data) => {
        dispatch({ type: 'SET_ROOM', payload: data.room });

        // Join via socket
        socket.emit(SOCKET_EVENTS.ROOM_JOIN, { code });

        socket.once(SOCKET_EVENTS.ROOM_JOINED, (roomData) => {
          dispatch({ type: 'SET_ROOM', payload: roomData });
          navigate(`/room/${roomData.roomId}`, { replace: true });
        });

        socket.once(SOCKET_EVENTS.ERROR, ({ message }) => {
          alert(`Could not join: ${message}`);
          navigate('/lobby', { replace: true });
        });
      })
      .catch(() => {
        alert('Room not found or has expired.');
        navigate('/lobby', { replace: true });
      });
  }, [user, loading, socket, code, dispatch, navigate]);

  return <Loader fullScreen />;
}
