import { Server } from 'socket.io';
import { supabase } from '../config/supabase.js';
import { registerRoomHandlers } from './handlers/room.handler.js';
import { registerGameHandlers } from './handlers/game.handler.js';
import { registerChatHandlers } from './handlers/chat.handler.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin:      env.CLIENT_URL,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  // ── Auth Middleware ──────────────────────────────────────────────
  // Verifies the Supabase JWT passed in socket handshake auth
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return next(new Error('Invalid token'));

    // Fetch extended profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .eq('id', data.user.id)
      .single();

    socket.data.user = {
      id:         data.user.id,
      email:      data.user.email,
      username:   profile?.username || data.user.email?.split('@')[0],
      avatar_url: profile?.avatar_url || data.user.user_metadata?.avatar_url,
    };

    next();
  });

  // ── Connection Handler ───────────────────────────────────────────
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id} — user: ${socket.data.user?.username}`);

    registerRoomHandlers(io, socket);
    registerGameHandlers(io, socket);
    registerChatHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} — reason: ${reason}`);
    });
  });

  return io;
}
