import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env.js';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * Returns the configured Gemini generative model.
 * Using gemini-2.0-flash — the latest free-tier model.
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
