import { supabaseAdmin } from '../config/supabase.js';
import { cache } from './cache.service.js';
import { calculateScore } from '../utils/helpers.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const ANSWERS_TTL = 7200;
const SENT_AT_TTL = 7200;

/**
 * Records the server-side timestamp at which a question was broadcast to a
 * room. recordAnswer() uses this as the source of truth for scoring instead
 * of trusting the client's self-reported time remaining — otherwise anyone
 * could intercept the `game:answer` socket call and simply claim maximum
 * points on every answer regardless of how long they actually took.
 */
export async function recordQuestionSentAt(roomId, questionIndex) {
  await cache.set(`room:${roomId}:q:${questionIndex}:sentAt`, Date.now(), SENT_AT_TTL);
}

/**
 * Records a player's answer for a question.
 * Returns { isCorrect, points, correctAnswer, explanation } on a fresh
 * submission, or { alreadyAnswered: true } if this player already answered.
 */
export async function recordAnswer({ roomId, questionIndex, playerId, selectedOption, timeRemainingMs }) {
  const answersKey = `room:${roomId}:answers:${questionIndex}`;
  const stateKey   = `room:${roomId}:state`;

  // Check for duplicate submission
  const existing = await cache.get(answersKey) || {};
  if (existing[playerId]) {
    return { alreadyAnswered: true };
  }

  // Get the question to validate correctness
  const questions = await cache.get(`room:${roomId}:questions`);
  if (!questions || !questions[questionIndex]) {
    throw new Error('Question not found');
  }

  const question    = questions[questionIndex];
  const isCorrect   = selectedOption === question.correct;
  const timeLimitMs = env.QUESTION_TIME_LIMIT_SECONDS * 1000;

  // Never trust the client's reported timeRemainingMs on its own — clamp it
  // to what the server clock actually allows, computed from when this
  // question was broadcast. A client can only end up scored *lower* than
  // it claims (e.g. due to its own network latency), never higher.
  const sentAt = await cache.get(`room:${roomId}:q:${questionIndex}:sentAt`);
  const serverRemainingMs = sentAt != null ? Math.max(0, timeLimitMs - (Date.now() - sentAt)) : timeRemainingMs;
  const authoritativeRemainingMs = Math.min(Math.max(0, timeRemainingMs), serverRemainingMs);

  const points = isCorrect
    ? calculateScore(authoritativeRemainingMs, timeLimitMs)
    : 0;

  // Save this player's answer
  existing[playerId] = { selectedOption, isCorrect, points, timeRemainingMs: authoritativeRemainingMs };
  await cache.set(answersKey, existing, ANSWERS_TTL);

  // Update player score (and correct-answer tally) in room state
  if (isCorrect) {
    const state = await cache.get(stateKey);
    if (state) {
      state.scores[playerId] = (state.scores[playerId] || 0) + points;
      state.correctCounts = state.correctCounts || {};
      state.correctCounts[playerId] = (state.correctCounts[playerId] || 0) + 1;
      await cache.set(stateKey, state, ANSWERS_TTL);
    }
  }

  logger.debug(`Answer recorded: player=${playerId} q=${questionIndex} correct=${isCorrect} pts=${points}`);
  return { isCorrect, points, correctAnswer: question.correct, explanation: question.explanation };
}

/**
 * Checks if all active players have answered the current question.
 */
export async function allPlayersAnswered(roomId, questionIndex) {
  const [state, answers] = await Promise.all([
    cache.get(`room:${roomId}:state`),
    cache.get(`room:${roomId}:answers:${questionIndex}`),
  ]);

  if (!state || !answers) return false;
  return state.players.every((p) => answers[p.id] !== undefined);
}

/**
 * Returns the current leaderboard sorted by score.
 */
export async function getLeaderboard(roomId) {
  const state = await cache.get(`room:${roomId}:state`);
  if (!state) return [];

  return state.players
    .map((p) => ({
      ...p,
      score:        state.scores[p.id] || 0,
      correctCount: state.correctCounts?.[p.id] || 0,
    }))
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}

/**
 * Persists final scores to Supabase after the game ends.
 */
export async function persistFinalScores(roomId, sessionId) {
  const leaderboard = await getLeaderboard(roomId);

  const scoreRows = leaderboard.map((p) => ({
    session_id:    sessionId,
    user_id:       p.id,
    score:         p.score,
    rank:          p.rank,
    correct_count: p.correctCount || 0,
  }));

  const { error } = await supabaseAdmin.from('scores').insert(scoreRows);
  if (error) logger.error('Failed to persist scores:', error.message);

  // Update total_score on profiles
  for (const p of leaderboard) {
    await supabaseAdmin.rpc('increment_total_score', {
      uid:   p.id,
      delta: p.score,
    });
  }

  logger.info(`Persisted scores for session ${sessionId}: ${leaderboard.length} players`);
  return leaderboard;
}
