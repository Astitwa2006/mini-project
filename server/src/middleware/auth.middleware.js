import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

/**
 * Verifies the Supabase JWT from the Authorization header.
 * Attaches the user to req.user on success.
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    logger.warn('Auth failed:', error?.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = data.user;
  next();
}
