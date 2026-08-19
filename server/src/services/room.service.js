import { supabaseAdmin } from '../config/supabase.js';
import { cache } from './cache.service.js';
import { generateRoomCode } from '../utils/roomCode.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const ROOM_TTL = 7200; // 2 hours

/**
 * Creates a new room in Supabase and caches its state in Redis.
 */
export async function createRoom({ hostId, topics, questionCount, difficulty, maxPlayers = 8 }) {
  const code = generateRoomCode();

  const { data: room, error } = await supabaseAdmin
    .from('rooms')
    .insert({
      code,
      host_id:        hostId,
      topics,
      question_count: questionCount,
      difficulty,
      max_players:    maxPlayers,
      status:         'waiting',
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create room: ${error.message}`);

  // Cache room state in Redis
  const roomState = {
    id:            room.id,
    code,
    hostId,
    topics,
    questionCount,
    difficulty,
    maxPlayers,
    status:        'waiting',
    players:       [],
    currentQuestion: 0,
    scores:        {},
    shareUrl:      `${env.CLIENT_URL}/join/${code}`,
  };

  await cache.set(`room:${room.id}:state`, roomState, ROOM_TTL);
  await cache.set(`room:code:${code}`, room.id, ROOM_TTL);   // code → id lookup

  logger.info(`Room created: ${code} by host ${hostId}`);
  return roomState;
}

/**
 * Looks up a room by its 6-char code. Returns the full state from Redis.
 */
export async function getRoomByCode(code) {
  const roomId = await cache.get(`room:code:${code.toUpperCase()}`);
  if (!roomId) return null;
  return getRoomById(roomId);
}

/**
 * Looks up a room by its UUID. Hits Redis first, falls back to Supabase.
 */
export async function getRoomById(roomId) {
  const cached = await cache.get(`room:${roomId}:state`);
  if (cached) return cached;

  const { data, error } = await supabaseAdmin
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Adds a player to a room's player list in Redis.
 */
export async function addPlayerToRoom(roomId, player) {
  const state = await cache.get(`room:${roomId}:state`);
  if (!state) throw new Error('Room not found');
  if (state.players.length >= state.maxPlayers) throw new Error('Room is full');
  if (state.status !== 'waiting') throw new Error('Game already in progress');

  const alreadyIn = state.players.find((p) => p.id === player.id);
  if (!alreadyIn) {
    state.players.push(player);
    state.scores[player.id] = 0;
    await cache.set(`room:${roomId}:state`, state, ROOM_TTL);
  }

  return state;
}

/**
 * Removes a player from a room.
 */
export async function removePlayerFromRoom(roomId, playerId) {
  const state = await cache.get(`room:${roomId}:state`);
  if (!state) return null;

  state.players = state.players.filter((p) => p.id !== playerId);
  await cache.set(`room:${roomId}:state`, state, ROOM_TTL);
  return state;
}

/**
 * Updates the room status (waiting | active | finished).
 */
export async function updateRoomStatus(roomId, status) {
  const state = await cache.get(`room:${roomId}:state`);
  if (!state) throw new Error('Room not found');

  state.status = status;
  await cache.set(`room:${roomId}:state`, state, ROOM_TTL);

  await supabaseAdmin.from('rooms').update({ status }).eq('id', roomId);
  return state;
}

/**
 * Cleans up all Redis keys for a room after it finishes.
 */
export async function cleanupRoom(roomId, code) {
  await cache.del(
    `room:${roomId}:state`,
    `room:${roomId}:questions`,
    `room:code:${code}`
  );
  await cache.delPattern(`room:${roomId}:answers:*`);
}
