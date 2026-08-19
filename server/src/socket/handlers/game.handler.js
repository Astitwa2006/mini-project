import { getRoomById } from '../../services/room.service.js';
import { recordAnswer } from '../../services/score.service.js';
import { startGame } from '../gameEngine.js';
import { logger } from '../../utils/logger.js';

export function registerGameHandlers(io, socket) {
  const { user } = socket.data;

  // ── Start Game (host only) ───────────────────────────────────────
  socket.on('game:start', async () => {
    const { roomId } = socket.data;
    if (!roomId) return;

    try {
      const room = await getRoomById(roomId);
      if (!room) return socket.emit('error', { message: 'Room not found' });
      if (room.hostId !== user.id) return socket.emit('error', { message: 'Only the host can start the game' });
      if (room.status !== 'waiting') return socket.emit('error', { message: 'Game already started' });
      if (room.players.length < 1) return socket.emit('error', { message: 'Need at least 1 player to start' });

      // Fire and forget — game engine manages the full loop
      startGame(io, room).catch((err) =>
        logger.error(`startGame failed for room ${room.code}:`, err.message)
      );
    } catch (err) {
      socket.emit('error', { event: 'game:start', message: err.message });
    }
  });

  // ── Submit Answer ────────────────────────────────────────────────
  socket.on('game:answer', async ({ questionIndex, selectedOption, timeRemainingMs }) => {
    const { roomId } = socket.data;
    if (!roomId) return;

    try {
      const result = await recordAnswer({
        roomId,
        questionIndex,
        playerId:       user.id,
        selectedOption,
        timeRemainingMs: Math.max(0, timeRemainingMs),
      });

      if (result.alreadyAnswered) return;

      // Send result ONLY to the answering player
      socket.emit('game:answer_result', {
        questionIndex,
        isCorrect:   result.isCorrect,
        points:      result.points,
        correctAnswer: result.correctAnswer,
        explanation: result.explanation,
      });
    } catch (err) {
      socket.emit('error', { event: 'game:answer', message: err.message });
    }
  });
}
