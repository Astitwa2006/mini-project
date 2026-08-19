import crypto from 'crypto';

/**
 * Creates a stable cache key from an array of topic slugs.
 * Sorted so ["ai-ml","cloud"] and ["cloud","ai-ml"] produce the same key.
 */
export function topicsToHash(topics = []) {
  const sorted = [...topics].sort().join(',');
  return crypto.createHash('md5').update(sorted).digest('hex').slice(0, 8);
}

/**
 * Shuffles an array in-place using Fisher-Yates.
 */
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Picks N random items from an array without repetition.
 */
export function pickRandom(array, n) {
  return shuffle(array).slice(0, n);
}

/**
 * Calculates score for a correct answer based on time remaining.
 * Faster answers earn more points (max 1000).
 */
export function calculateScore(timeRemainingMs, totalTimeMs) {
  const ratio = timeRemainingMs / totalTimeMs;
  return Math.round(500 + 500 * ratio); // 500–1000 pts
}

/**
 * Delays execution for ms milliseconds.
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
