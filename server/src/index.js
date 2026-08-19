import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import cron from 'node-cron';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import { env } from './config/env.js';
import { getRedisClient } from './config/redis.js';
import { createSocketServer } from './socket/index.js';
import { prewarmCommonTopics } from './services/question.service.js';
import { errorHandler } from './middleware/errorHandler.middleware.js';
import { rateLimiter } from './middleware/rateLimit.middleware.js';

import authRoutes     from './routes/auth.routes.js';
import roomRoutes     from './routes/room.routes.js';
import questionRoutes from './routes/question.routes.js';
import scoreRoutes    from './routes/score.routes.js';

import { logger } from './utils/logger.js';

// ── Express setup ────────────────────────────────────────────────
const app = express();

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

  // Pre-warm popular question pools on startup
  await prewarmCommonTopics();

  // Refresh question pool every N minutes via cron
  cron.schedule(`*/${env.RSS_REFRESH_INTERVAL_MINUTES} * * * *`, async () => {
    logger.info('Cron: refreshing question pools...');
    await prewarmCommonTopics();
  });

  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${env.PORT}`);
    logger.info(`🌍 Allowing client: ${env.CLIENT_URL}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
