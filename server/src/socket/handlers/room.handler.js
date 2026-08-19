import { getRoomByCode, addPlayerToRoom, removePlayerFromRoom } from '../../services/room.service.js';
import { createRoom } from '../../services/room.service.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

/**
 * Handles all room-related socket events.
 */
export function registerRoomHandlers(io, socket) {
  const { user } = socket.data; // set by auth middleware

  // ── Create Room ──────────────────────────────────────────────────
  socket.on('room:create', async ({ topics, questionCount, difficulty, maxPlayers }) => {
    try {
      const count = Math.min(
        Math.max(questionCount || env.DEFAULT_QUESTIONS_PER_GAME, 5),
        env.MAX_QUESTIONS_PER_GAME
      );

      const room = await createRoom({
        hostId:        user.id,
        topics:        topics || ['startups'],
        questionCount: count,
        difficulty:    difficulty || 'any',
        maxPlayers:    maxPlayers || 8,
      });

      await addPlayerToRoom(room.id, {
        id:        user.id,
        username:  user.username,
        avatarUrl: user.avatar_url,
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
        isHost:    false,
      });

      socket.join(`room:${room.id}`);
      socket.data.roomId = room.id;

      // Confirm join to the joiner
      socket.emit('room:joined', {
        roomId:   room.id,
        code:     room.code,
        shareUrl: `${env.CLIENT_URL}/join/${room.code}`,
        players:  updatedRoom.players,
        topics:   room.topics,
        status:   room.status,
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
