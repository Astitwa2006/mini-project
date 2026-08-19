import { fetchArticlesByTopics } from './rss.service.js';
import { batchGenerateQuestions } from './llm.service.js';
import { cache } from './cache.service.js';
import { topicsToHash, pickRandom } from '../utils/helpers.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// How long a generated pool stays cached before the next request for that
// topic combo triggers a fresh RSS+LLM run. News doesn't move fast enough
// to need sub-hour refreshes for a quiz game, so this defaults much higher
// than the old "regenerate everything every 15 minutes" cadence.
const POOL_TTL = env.RSS_REFRESH_INTERVAL_MINUTES * 60; // seconds

// Coalesces concurrent requests for the same topic combo (e.g. two hosts
// picking "ai-ml" within the same few seconds) into a single RSS+LLM run
// instead of duplicating the work and the Gemini quota spend.
const inFlight = new Map();

/**
 * Returns a pool of LLM-generated questions for the given topics.
 * Serves from Redis cache when available; regenerates otherwise.
 *
 * @param {string[]} topics       - e.g. ['ai-ml', 'cloud']
 * @param {string}   difficulty   - 'easy' | 'medium' | 'hard' | 'any'
 * @param {number}   desiredCount - how many questions the caller actually
 *                                  needs — sizes generation instead of
 *                                  always maxing out at MAX_QUESTIONS*2
 */
export async function getQuestionPool(topics, difficulty = 'any', desiredCount = env.DEFAULT_QUESTIONS_PER_GAME) {
  const hash     = topicsToHash(topics);
  const cacheKey = `questions:pool:${hash}`;
  const usable   = (pool) => (difficulty === 'any' ? pool : pool.filter((q) => q.difficulty === difficulty));

  const cached = await cache.get(cacheKey);
  if (cached && usable(cached).length >= desiredCount) {
    logger.info(`Cache hit for question pool [${hash}] — ${cached.length} questions (${usable(cached).length} matching)`);
    return usable(cached);
  }

  if (inFlight.has(hash)) {
    logger.debug(`Question pool [${hash}] generation already in progress — waiting on it`);
    const questions = await inFlight.get(hash);
    return usable(questions);
  }

  // Either no cache yet, or the cached pool is smaller than this caller
  // actually needs (e.g. an earlier room asked for 8 questions and this
  // one wants 20 for the same topics) — generate more and merge instead
  // of silently handing back a too-small pool.
  const job = generatePool(topics, hash, desiredCount, cached || []).finally(() => inFlight.delete(hash));
  inFlight.set(hash, job);

  const questions = await job;
  return usable(questions);
}

async function generatePool(topics, hash, desiredCount, existing = []) {
  logger.info(`${existing.length ? `Topping up [${hash}] (have ${existing.length}) —` : 'Cache miss —'} fetching RSS for topics: ${topics.join(', ')}`);

  const articles = await fetchArticlesByTopics(topics, 6);
  if (articles.length === 0) {
    logger.warn('No articles fetched — returning existing pool as-is');
    return existing;
  }

  // A modest buffer over what's actually needed — covers difficulty
  // filtering and the occasional bad LLM response — instead of always
  // generating up to MAX_QUESTIONS_PER_GAME * 2 regardless of room size.
  const target = Math.min(Math.ceil(desiredCount * 1.5) + 3, env.MAX_QUESTIONS_PER_GAME * 2, articles.length);
  const freshlyGenerated = await batchGenerateQuestions(articles, target);

  // Merge with whatever was already cached, deduping by question text so
  // a top-up run adds to the pool instead of piling up near-duplicates.
  const seen   = new Set(existing.map((q) => q.question));
  const merged = [...existing, ...freshlyGenerated.filter((q) => !seen.has(q.question))];

  if (merged.length > 0) {
    await cache.set(`questions:pool:${hash}`, merged, POOL_TTL);
    logger.info(`Cached ${merged.length} questions for [${hash}] — TTL ${POOL_TTL}s`);
  }

  return merged;
}

/**
 * Fire-and-forget pool warm-up. Call this the moment a room is created
 * (topics are already known then) so the pipeline is running in the
 * background while players join the waiting room, instead of only
 * starting it — and making everyone wait — when the host clicks "Start".
 */
export function warmQuestionPool(topics, difficulty, desiredCount) {
  getQuestionPool(topics, difficulty, desiredCount).catch((err) =>
    logger.warn(`Pool warm-up failed for ${topics.join(',')}: ${err.message}`)
  );
}

/**
 * Picks a game-sized question set from the pool and locks it in Redis
 * under the room key so ALL players get the exact same questions.
 *
 * @param {string}   roomId
 * @param {string[]} topics
 * @param {number}   count      - Number of questions for this game
 * @param {string}   difficulty - 'easy' | 'medium' | 'hard' | 'any'
 */
export async function lockQuestionsForRoom(roomId, topics, count, difficulty = 'any') {
  const roomKey = `room:${roomId}:questions`;

  // If already locked (game restarted?), return existing set
  const existing = await cache.get(roomKey);
  if (existing) return existing;

  const pool     = await getQuestionPool(topics, difficulty, count);
  const selected = pickRandom(pool, Math.min(count, pool.length));

  if (selected.length === 0) {
    throw new Error('No questions available for the selected topics and difficulty');
  }

  // Lock for the session duration (2 hours)
  await cache.set(roomKey, selected, 7200);
  logger.info(`Locked ${selected.length} questions for room ${roomId}`);

  return selected;
}

/**
 * Clears locked questions for a room (called after game ends).
 */
export async function clearRoomQuestions(roomId) {
  await cache.del(`room:${roomId}:questions`);
}

/**
 * One-time light warm-up at server boot for the single most likely
 * default topic, so the very first room of the process isn't cold.
 * Deliberately NOT run on a recurring schedule — regenerating pools
 * nobody is using wastes LLM quota and, since games snapshot their
 * question set into Supabase, ends up churning DB writes for nothing.
 * Per-topic pools are otherwise generated lazily, on demand, per room.
 */
export function prewarmDefaultTopic() {
  warmQuestionPool(['startups'], 'any', env.DEFAULT_QUESTIONS_PER_GAME);
}
