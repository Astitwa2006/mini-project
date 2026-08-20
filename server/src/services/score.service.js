import { supabaseAdmin } from '../config/supabase.js';
import { cache } from './cache.service.js';
import { calculateScore, calculatePartialCredit } from '../utils/helpers.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const ANSWERS_TTL = 7200;
const SENT_AT_TTL = 7200;
const STEALS_PER_GAME = 1;
const STEAL_AMOUNT = 200;

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
export async function recordAnswer({ roomId, questionIndex, playerId, selectedOption, timeRemainingMs, wager, stealTarget }) {
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
  const credit      = calculatePartialCredit(selectedOption, question.correct, question.type || 'single');
  const isCorrect   = credit === 1.0;
  const timeLimitMs = env.QUESTION_TIME_LIMIT_SECONDS * 1000;

  // Never trust the client's reported timeRemainingMs on its own — clamp it
  // to what the server clock actually allows, computed from when this
  // question was broadcast. A client can only end up scored *lower* than
  // it claims (e.g. due to its own network latency), never higher.
  const sentAt = await cache.get(`room:${roomId}:q:${questionIndex}:sentAt`);
  const serverRemainingMs = sentAt != null ? Math.max(0, timeLimitMs - (Date.now() - sentAt)) : timeRemainingMs;
  const authoritativeRemainingMs = Math.min(Math.max(0, timeRemainingMs), serverRemainingMs);

  // The "would-be" score if this answer had been correct, at this speed —
  // used both for the normal correct-answer payout and as the symmetric
  // wager risk (double on a correct wager, lose the same amount on a wrong
  // one, so wagering is an actual bet rather than a free upgrade).
  const timeBasedScore = calculateScore(authoritativeRemainingMs, timeLimitMs);
  let basePoints = credit > 0 ? timeBasedScore * credit : 0;
  let points = wager ? (isCorrect ? basePoints * 2 : -timeBasedScore) : basePoints;

  // Each player gets one steal attempt per game. The attempt (and its
  // single use) is consumed here, at answer time, regardless of whether it
  // ends up succeeding — success depends on the target's own answer and is
  // resolved later in resolveRoundModifiers, once everyone's answers are in.
  const state = await cache.get(stateKey);
  let resolvedStealTarget = null;
  if (state) {
    state.stealsUsed = state.stealsUsed || {};
    if (stealTarget && (state.stealsUsed[playerId] || 0) < STEALS_PER_GAME) {
      resolvedStealTarget = stealTarget;
      state.stealsUsed[playerId] = (state.stealsUsed[playerId] || 0) + 1;
    }
  }

  // Save this player's answer
  existing[playerId] = {
    selectedOption, isCorrect, points, timeRemainingMs: authoritativeRemainingMs,
    wager, stealTarget: resolvedStealTarget, credit,
  };
  await cache.set(answersKey, existing, ANSWERS_TTL);

  // Update player score (and correct-answer tally) in room state. Points
  // can be negative (a lost wager) — those must still apply, just floored
  // so a run of bad luck can't push a player's score below zero.
  if (state && points !== 0) {
    state.scores[playerId] = Math.max(0, (state.scores[playerId] || 0) + points);
    state.correctCounts = state.correctCounts || {};
    if (isCorrect) state.correctCounts[playerId] = (state.correctCounts[playerId] || 0) + 1;
    await cache.set(stateKey, state, ANSWERS_TTL);
  } else if (state) {
    await cache.set(stateKey, state, ANSWERS_TTL); // persist the stealsUsed increment even if points===0
  }

  logger.debug(`Answer recorded: player=${playerId} q=${questionIndex} correct=${isCorrect} pts=${points}`);
  return {
    isCorrect, points, correctAnswer: question.correct, explanation: question.explanation, credit,
    stealArmed: !!resolvedStealTarget,
    timeRemainingMs: authoritativeRemainingMs,
    timeLimitMs,
  };
}

/**
 * Resolves steals for the current question after time is up.
 */
export async function resolveRoundModifiers(roomId, questionIndex) {
  const answersKey = `room:${roomId}:answers:${questionIndex}`;
  const stateKey   = `room:${roomId}:state`;
  
  const [answers, state] = await Promise.all([
    cache.get(answersKey),
    cache.get(stateKey)
  ]);
  if (!answers || !state) return;
  
  // Process steals — succeeds only if the stealer answered correctly
  // themselves AND the target they named got it wrong. Getting it right is
  // what earns the steal; targeting someone who also got it right doesn't
  // cost them anything.
  for (const [playerId, ans] of Object.entries(answers)) {
    if (ans.stealTarget && ans.isCorrect && answers[ans.stealTarget]) {
       const targetAns = answers[ans.stealTarget];
       if (targetAns.credit === 0) {
          state.scores[playerId] = (state.scores[playerId] || 0) + STEAL_AMOUNT;
          state.scores[ans.stealTarget] = Math.max(0, (state.scores[ans.stealTarget] || 0) - STEAL_AMOUNT);
          logger.debug(`Steal successful: ${playerId} stole from ${ans.stealTarget}`);
       }
    }
  }
  await cache.set(stateKey, state, ANSWERS_TTL);
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
