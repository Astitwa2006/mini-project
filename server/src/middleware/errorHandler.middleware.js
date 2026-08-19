import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, _next) {
  logger.error(`[${req.method}] ${req.path} — ${err.message}`);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error:   err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
