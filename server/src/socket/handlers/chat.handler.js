import { supabaseAdmin } from '../../config/supabase.js';
import { logger } from '../../utils/logger.js';

export function registerChatHandlers(io, socket) {
  const { user } = socket.data;

  socket.on('chat:message', async ({ message }) => {
    const { roomId } = socket.data;
    if (!roomId || !message?.trim()) return;

    const trimmed = message.trim().slice(0, 200); // max 200 chars

    const chatMessage = {
      id:        crypto.randomUUID(),
      roomId,
      userId:    user.id,
      username:  user.username,
      avatarUrl: user.avatar_url,
      message:   trimmed,
      createdAt: new Date().toISOString(),
    };

    // Broadcast to all players in the room
    io.to(`room:${roomId}`).emit('chat:new_message', chatMessage);

    // Persist to Supabase asynchronously
    supabaseAdmin.from('chat_messages').insert({
      room_id:    roomId,
      user_id:    user.id,
      message:    trimmed,
      created_at: chatMessage.createdAt,
    }).then(({ error }) => {
      if (error) logger.warn('Chat persist failed:', error.message);
    });
  });
}
