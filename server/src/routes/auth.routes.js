import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

// Upsert profile after Google OAuth (called by client after sign-in), and
// again after the onboarding step to save nickname/tile-color/topic-follows.
router.post('/profile', requireAuth, async (req, res, next) => {
  try {
    const { username, tileColor, favTopics, onboarded } = req.body;
    const patch = {
      id:          req.user.id,
      avatar_url:  req.user.user_metadata?.avatar_url || null,
    };
    // Only touch these columns when the caller actually sent them, so the
    // plain post-login upsert (no body) never resets a nickname the user
    // already chose back to the auto-generated default — the on-signup DB
    // trigger already seeds a starting username for brand-new profiles.
    if (username  !== undefined) patch.username  = username || req.user.email?.split('@')[0];
    if (tileColor !== undefined) patch.tile_color = tileColor;
    if (favTopics !== undefined) patch.fav_topics = favTopics;
    if (onboarded !== undefined) patch.onboarded  = onboarded;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(patch, { onConflict: 'id' })
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
