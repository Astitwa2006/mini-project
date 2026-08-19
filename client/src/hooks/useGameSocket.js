import { useEffect, useCallback } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { useGame } from '../context/GameContext.jsx';
import { SOCKET_EVENTS } from '../utils/constants.js';

/**
 * Attaches all game-related socket listeners and wires them to GameContext dispatch.
 * Call this once inside GamePage / WaitingRoomPage.
 */
export function useGameSocket() {
  const { socket } = useSocket();
  const { dispatch } = useGame();

  useEffect(() => {
    if (!socket) return;

    const handlers = {
      [SOCKET_EVENTS.ROOM_PLAYER_JOINED]: (data) => dispatch({ type: 'PLAYER_JOINED', payload: data }),
      [SOCKET_EVENTS.ROOM_PLAYER_LEFT]:   (data) => dispatch({ type: 'PLAYER_LEFT',   payload: data }),
      [SOCKET_EVENTS.GAME_STARTING]:      (data) => dispatch({ type: 'GAME_STARTING', payload: data }),
      [SOCKET_EVENTS.GAME_QUESTION]:      (data) => dispatch({ type: 'NEW_QUESTION',  payload: data }),
      [SOCKET_EVENTS.GAME_ANSWER_RESULT]: (data) => dispatch({ type: 'MY_ANSWER',     payload: data }),
      [SOCKET_EVENTS.GAME_REVEAL]:        (data) => dispatch({ type: 'REVEAL',         payload: data }),
      [SOCKET_EVENTS.GAME_SCORE_UPDATE]:  (data) => dispatch({ type: 'SCORE_UPDATE',  payload: data }),
      [SOCKET_EVENTS.GAME_FINISHED]:      (data) => dispatch({ type: 'GAME_FINISHED', payload: data }),
      [SOCKET_EVENTS.CHAT_NEW_MESSAGE]:   (data) => dispatch({ type: 'CHAT_MESSAGE',  payload: data }),
    };

    Object.entries(handlers).forEach(([event, handler]) => socket.on(event, handler));
    return () => Object.entries(handlers).forEach(([event, handler]) => socket.off(event, handler));
  }, [socket, dispatch]);

  // Emit helpers
  const emit = useCallback((event, data) => socket?.emit(event, data), [socket]);

  const startGame   = useCallback(() => emit(SOCKET_EVENTS.GAME_START), [emit]);
  const joinRoom    = useCallback((code) => emit(SOCKET_EVENTS.ROOM_JOIN, { code }), [emit]);
  const leaveRoom   = useCallback(() => emit(SOCKET_EVENTS.ROOM_LEAVE), [emit]);
  const submitAnswer = useCallback((questionIndex, selectedOption, timeRemainingMs) =>
    emit(SOCKET_EVENTS.GAME_ANSWER, { questionIndex, selectedOption, timeRemainingMs }), [emit]);
  const sendChat    = useCallback((message) => emit(SOCKET_EVENTS.CHAT_MESSAGE, { message }), [emit]);
  const createRoom  = useCallback((opts) => emit(SOCKET_EVENTS.ROOM_CREATE, opts), [emit]);

  return { startGame, joinRoom, leaveRoom, submitAnswer, sendChat, createRoom };
}
