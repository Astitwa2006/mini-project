import { fetchArticlesByTopics } from './rss.service.js';
import { batchGenerateQuestions } from './llm.service.js';
import { cache } from './cache.service.js';
import { topicsToHash, pickRandom } from '../utils/helpers.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const POOL_TTL = env.RSS_REFRESH_INTERVAL_MINUTES * 60; // seconds

/**
 * Returns a pool of LLM-generated questions for the given topics.
 * Serves from Redis cache when available; regenerates otherwise.
 *
 * @param {string[]} topics     - e.g. ['ai-ml', 'cloud']
 * @param {string}   difficulty - 'easy' | 'medium' | 'hard' | 'any'
 */
export async function getQuestionPool(topics, difficulty = 'any') {
  const hash    = topicsToHash(topics);
  const cacheKey = `questions:pool:${hash}`;

  // --- Cache hit ---
  const cached = await cache.get(cacheKey);
  if (cached && cached.length > 0) {
    logger.info(`Cache hit for question pool [${hash}] — ${cached.length} questions`);
    return difficulty === 'any'
      ? cached
      : cached.filter((q) => q.difficulty === difficulty);
  }

  // --- Cache miss: run the full pipeline ---
  logger.info(`Cache miss — fetching RSS for topics: ${topics.join(', ')}`);

  const articles = await fetchArticlesByTopics(topics, 6); // 6 articles per feed

  if (articles.length === 0) {
    logger.warn('No articles fetched — returning empty pool');
    return [];
  }

  const questions = await batchGenerateQuestions(articles, env.MAX_QUESTIONS_PER_GAME * 2);

  if (questions.length > 0) {
    await cache.set(cacheKey, questions, POOL_TTL);
    logger.info(`Cached ${questions.length} questions for [${hash}] — TTL ${POOL_TTL}s`);
  }

  return difficulty === 'any'
    ? questions
    : questions.filter((q) => q.difficulty === difficulty);
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

  const pool     = await getQuestionPool(topics, difficulty);
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
 * Pre-warms the question pool for common topic combos.
 * Called by the cron job on server startup.
 */
export async function prewarmCommonTopics() {
  const commonCombos = [
    ['ai-ml'],
    ['cybersecurity'],
    ['startups'],
    ['web-dev'],
    ['ai-ml', 'cybersecurity'],
    ['cloud', 'startups'],
  ];

  logger.info('Pre-warming question pools...');
  for (const topics of commonCombos) {
    try {
      await getQuestionPool(topics, 'any');
    } catch (err) {
      logger.warn(`Pre-warm failed for ${topics.join(',')}: ${err.message}`);
    }
  }
  logger.info('Pre-warm complete.');
}
