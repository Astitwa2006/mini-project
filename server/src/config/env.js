import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001'),
  CLIENT_URL: z.string().url(),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // Gemini
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash-lite'),

  // Question pipeline
  RSS_REFRESH_INTERVAL_MINUTES: z.string().default('60'),
  DEFAULT_QUESTIONS_PER_GAME: z.string().default('10'),
  MAX_QUESTIONS_PER_GAME: z.string().default('20'),
  QUESTION_TIME_LIMIT_SECONDS: z.string().default('30'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  PORT: parseInt(parsed.data.PORT, 10),
  RSS_REFRESH_INTERVAL_MINUTES: parseInt(parsed.data.RSS_REFRESH_INTERVAL_MINUTES, 10),
  DEFAULT_QUESTIONS_PER_GAME: parseInt(parsed.data.DEFAULT_QUESTIONS_PER_GAME, 10),
  MAX_QUESTIONS_PER_GAME: parseInt(parsed.data.MAX_QUESTIONS_PER_GAME, 10),
  QUESTION_TIME_LIMIT_SECONDS: parseInt(parsed.data.QUESTION_TIME_LIMIT_SECONDS, 10),
};
