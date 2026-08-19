import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// Global leaderboard — top 20 players by total_score
router.get('/leaderboard', async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, username, avatar_url, total_score, games_played')
      .order('total_score', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ leaderboard: data });
  } catch (err) { next(err); }
});

// My game history
router.get('/history', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('scores')
      .select('*, game_sessions(topics, started_at, ended_at)')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    res.json({ history: data });
  } catch (err) { next(err); }
});

export default router;
