import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * Returns the configured Gemini generative model (see GEMINI_MODEL in
 * .env.example for which model and why — free-tier daily quotas vary
 * wildly between models, and some older ones are fully retired).
 */
export function getGeminiModel() {
  return genAI.getGenerativeModel({
    model: env.GEMINI_MODEL,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
    },
  });
}
