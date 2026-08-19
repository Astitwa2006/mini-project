import Redis from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let client;

export function getRedisClient() {
  if (!client) {
    client = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: false,
    });

    client.on('connect', () => logger.info('✅ Redis connected'));
    client.on('error', (err) => logger.error('❌ Redis error:', err.message));
    client.on('reconnecting', () => logger.warn('⚠️  Redis reconnecting...'));
  }
  return client;
}

export async function closeRedis() {
  if (client) {
    await client.quit();
    client = null;
  }
}
