// All socket event name constants — single source of truth for client & documentation

export const SOCKET_EVENTS = {
  // Room
  ROOM_CREATE:       'room:create',
  ROOM_CREATED:      'room:created',
  ROOM_JOIN:         'room:join',
  ROOM_JOINED:       'room:joined',
  ROOM_LEAVE:        'room:leave',
  ROOM_PLAYER_JOINED:'room:player_joined',
  ROOM_PLAYER_LEFT:  'room:player_left',

  // Game
  GAME_START:        'game:start',
  GAME_STARTING:     'game:starting',
  GAME_QUESTION:     'game:question',
  GAME_TICK:         'game:tick',
  GAME_ANSWER:       'game:answer',
  GAME_ANSWER_RESULT:'game:answer_result',
  GAME_REVEAL:       'game:reveal',
  GAME_SCORE_UPDATE: 'game:score_update',
  GAME_FINISHED:     'game:finished',
  GAME_ERROR:        'game:error',

  // Chat
  CHAT_MESSAGE:      'chat:message',
  CHAT_NEW_MESSAGE:  'chat:new_message',

  // Errors
  ERROR:             'error',
};

export const TOPICS = {
  'ai-ml':         { label: '🤖 AI & Machine Learning', color: '#6366f1' },
  'cybersecurity': { label: '🔐 Cybersecurity',          color: '#ef4444' },
  'web-dev':       { label: '🌐 Web Development',        color: '#3b82f6' },
  'cloud':         { label: '☁️ Cloud & DevOps',          color: '#06b6d4' },
  'startups':      { label: '🚀 Startups & Tech',        color: '#f59e0b' },
  'hardware':      { label: '🖥️ Hardware & Chips',        color: '#8b5cf6' },
  'mobile':        { label: '📱 Mobile & Apps',           color: '#10b981' },
  'open-source':   { label: '🧩 Open Source',            color: '#f97316' },
};

export const DIFFICULTY = {
  any:    { label: 'Any',    color: '#94a3b8' },
  easy:   { label: 'Easy',   color: '#10b981' },
  medium: { label: 'Medium', color: '#f59e0b' },
  hard:   { label: 'Hard',   color: '#ef4444' },
};

export const GAME_PHASE = {
  WAITING:  'waiting',
  STARTING: 'starting',
  QUESTION: 'question',
  REVEAL:   'reveal',
  FINISHED: 'finished',
};

export const API_BASE = import.meta.env.VITE_API_URL || '/api';
