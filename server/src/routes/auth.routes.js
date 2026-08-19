import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// Upsert profile after Google OAuth (called by client after sign-in)
router.post('/profile', requireAuth, async (req, res, next) => {
  try {
    const { username } = req.body;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id:          req.user.id,
        username:    username || req.user.email?.split('@')[0],
        avatar_url:  req.user.user_metadata?.avatar_url || null,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) throw error;
    res.json({ profile: data });
  } catch (err) { next(err); }
});

// Get current user's profile
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;
    res.json({ profile: data });
  } catch (err) { next(err); }
});

export default router;
