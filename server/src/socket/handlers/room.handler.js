import { getRoomByCode, addPlayerToRoom, removePlayerFromRoom } from '../../services/room.service.js';
import { createRoom } from '../../services/room.service.js';
import { warmQuestionPool } from '../../services/question.service.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

/**
 * Handles all room-related socket events.
 */
export function registerRoomHandlers(io, socket) {
  const { user } = socket.data; // set by auth middleware

  // ── Create Room ──────────────────────────────────────────────────
  socket.on('room:create', async ({ topics, questionCount, difficulty, maxPlayers, questionTimeSeconds }) => {
    try {
      const count = Math.min(
        Math.max(questionCount || env.DEFAULT_QUESTIONS_PER_GAME, 5),
        env.MAX_QUESTIONS_PER_GAME
      );
      // Only a few fixed choices are offered client-side — clamp instead of
      // trusting the raw number so a tampered payload can't shrink/inflate
      // the timer past what the UI ever actually offers.
      const seconds = [5, 10, 20].includes(questionTimeSeconds)
        ? questionTimeSeconds
        : env.QUESTION_TIME_LIMIT_SECONDS;

      const room = await createRoom({
        hostId:        user.id,
        topics:        topics || ['startups'],
        questionCount: count,
        difficulty:    difficulty || 'any',
        maxPlayers:    maxPlayers || 8,
        questionTimeSeconds: seconds,
      });

      await addPlayerToRoom(room.id, {
        id:        user.id,
        username:  user.username,
        avatarUrl: user.avatar_url,
        tileColor: user.tile_color,
        isHost:    true,
      });

      socket.join(`room:${room.id}`);
      socket.data.roomId = room.id;

      socket.emit('room:created', {
        roomId:   room.id,
        code:     room.code,
        shareUrl: room.shareUrl,
        ...room,
      });

      // Kick off question generation now (topics are already known) so the
      // pipeline runs in the background while players join the waiting
      // room, instead of only starting — and making everyone wait — once
      // the host clicks "Start Game".
      warmQuestionPool(room.topics, room.difficulty, room.questionCount);

      logger.info(`Room ${room.code} created by ${user.username}`);
    } catch (err) {
      socket.emit('error', { event: 'room:create', message: err.message });
    }
  });

  // ── Join Room ────────────────────────────────────────────────────
  socket.on('room:join', async ({ code }) => {
    try {
      const room = await getRoomByCode(code);
      if (!room) return socket.emit('error', { event: 'room:join', message: 'Room not found' });

      const updatedRoom = await addPlayerToRoom(room.id, {
        id:        user.id,
        username:  user.username,
        avatarUrl: user.avatar_url,
        tileColor: user.tile_color,
        isHost:    false,
      });

      socket.join(`room:${room.id}`);
      socket.data.roomId = room.id;

      // Confirm join to the joiner — send the full room state (mirrors room:created)
      // so the waiting-room UI has hostId/maxPlayers/questionCount/difficulty too.
      socket.emit('room:joined', {
        ...updatedRoom,
        roomId:   room.id,
        code:     room.code,
        shareUrl: `${env.CLIENT_URL}/join/${room.code}`,
      });

      // Notify everyone else
      socket.to(`room:${room.id}`).emit('room:player_joined', {
        player:  { id: user.id, username: user.username, avatarUrl: user.avatar_url },
        players: updatedRoom.players,
      });

      logger.info(`${user.username} joined room ${room.code}`);
    } catch (err) {
      socket.emit('error', { event: 'room:join', message: err.message });
    }
  });

  // ── Leave Room ───────────────────────────────────────────────────
  socket.on('room:leave', () => handleLeave(io, socket));
  socket.on('disconnect', () => handleLeave(io, socket));
}

async function handleLeave(io, socket) {
  const { roomId, user } = socket.data;
  if (!roomId || !user) return;

  try {
    const state = await removePlayerFromRoom(roomId, user.id);
    socket.leave(`room:${roomId}`);
    socket.data.roomId = null;

    io.to(`room:${roomId}`).emit('room:player_left', {
      playerId: user.id,
      players:  state?.players || [],
    });

    logger.info(`${user.username} left room ${roomId}`);
  } catch (err) {
    logger.warn(`handleLeave error: ${err.message}`);
  }
}
