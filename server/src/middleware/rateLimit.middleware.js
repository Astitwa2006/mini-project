import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute window
  max:      100,         // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please slow down.' },
});

// Stricter limiter for auth endpoints
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max:      10,
  message: { error: 'Too many auth attempts. Try again later.' },
});
