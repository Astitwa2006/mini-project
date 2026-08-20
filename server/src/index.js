import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { env } from './config/env.js';
import { getRedisClient, closeRedis } from './config/redis.js';
import { createSocketServer } from './socket/index.js';
import { prewarmDefaultTopic } from './services/question.service.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { rateLimiter } from './middleware/rateLimit.middleware.js';

import authRoutes     from './routes/auth.routes.js';
import roomRoutes     from './routes/room.routes.js';
import questionRoutes from './routes/question.routes.js';
import scoreRoutes    from './routes/score.routes.js';

import { logger } from './utils/logger.js';

// ── Express setup ────────────────────────────────────────────────
const app = express();

// Trust the reverse proxy (Render) so rate limiting uses correct IPs
app.set('trust proxy', 1);

app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(rateLimiter);

// ── REST Routes ──────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/rooms',     roomRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/scores',    scoreRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

if (env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDistPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use(errorHandler);

// ── HTTP + Socket.io servers ─────────────────────────────────────
const httpServer = createServer(app);
createSocketServer(httpServer);

// ── Startup ──────────────────────────────────────────────────────
async function start() {
  // Verify Redis connection
  getRedisClient();

  // Warm just one default topic pool in the background so the very first
  // room isn't cold. Everything else is generated on demand per room (see
  // room:create handler) and cached for RSS_REFRESH_INTERVAL_MINUTES —
  // deliberately not on a recurring cron, since regenerating pools nobody
  // is using wastes LLM quota and bloats the DB for no benefit.
  prewarmDefaultTopic();

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
    logger.info(`🌍 Allowing client: ${env.CLIENT_URL}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});

// ── Graceful shutdown ─────────────────────────────────────────────
// PaaS platforms (Render, Railway, Fly.io, etc.) send SIGTERM before
// force-killing a container during redeploys/scaling — stop accepting
// new connections and close Redis cleanly instead of dropping games mid-flight.
async function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully...`);
  httpServer.close(async () => {
    await closeRedis();
    logger.info('Shutdown complete.');
    process.exit(0);
  });
  // Force-exit if close hangs (e.g. sockets refusing to drain)
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
