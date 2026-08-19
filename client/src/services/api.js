import { API_BASE } from '../utils/constants.js';

async function request(path, options = {}) {
  const token = localStorage.getItem('sb-token');

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  // Auth
  upsertProfile: (body)           => request('/auth/profile', { method: 'POST', body: JSON.stringify(body) }),
  getMe:         ()               => request('/auth/me'),

  // Rooms
  getRoom:       (code)           => request(`/rooms/${code}`),

  // Questions
  getTopics:     ()               => request('/questions/topics'),
  previewQuestions: (topics, difficulty) =>
    request(`/questions/preview?topics=${topics.join(',')}&difficulty=${difficulty}`),

  // Scores
  getLeaderboard: ()              => request('/scores/leaderboard'),
  getMyHistory:   ()              => request('/scores/history'),
};
