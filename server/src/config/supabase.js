import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

// Public client — used by auth middleware to verify JWTs
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

// Admin client — used for server-side DB operations (bypasses RLS)
export const supabaseAdmin = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
