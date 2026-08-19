import { getRedisClient } from '../config/redis.js';
import { logger } from '../utils/logger.js';

const redis = () => getRedisClient();

export const cache = {
  /** Get a JSON value by key */
  async get(key) {
    const val = await redis().get(key);
    if (!val) return null;
    try { return JSON.parse(val); } catch { return val; }
  },

  /** Set a JSON value with optional TTL in seconds */
  async set(key, value, ttlSeconds = null) {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis().setex(key, ttlSeconds, serialized);
    } else {
      await redis().set(key, serialized);
    }
  },

  /** Delete one or more keys */
  async del(...keys) {
    if (keys.length) await redis().del(...keys);
  },

  /** Delete all keys matching a pattern (use sparingly) */
  async delPattern(pattern) {
    const keys = await redis().keys(pattern);
    if (keys.length) {
      await redis().del(...keys);
      logger.debug(`Deleted ${keys.length} keys matching "${pattern}"`);
    }
  },

  /** Check if a key exists */
  async exists(key) {
    return (await redis().exists(key)) === 1;
  },

  /** Append a value to a Redis list */
  async lpush(key, value) {
    await redis().lpush(key, JSON.stringify(value));
  },

  /** Get all items from a Redis list */
  async lrange(key, start = 0, stop = -1) {
    const items = await redis().lrange(key, start, stop);
    return items.map((i) => { try { return JSON.parse(i); } catch { return i; } });
  },

  /** Set TTL on an existing key */
  async expire(key, ttlSeconds) {
    await redis().expire(key, ttlSeconds);
  },
};
