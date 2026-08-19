import { getGeminiModel } from '../config/llm.js';
import { logger } from '../utils/logger.js';
import { shuffle } from '../utils/helpers.js';

const SYSTEM_PROMPT = `You are a quiz master generating tech trivia questions from real news articles.
Your output must always be a valid JSON object matching the schema exactly.
Do not include any markdown, explanation, or extra text outside the JSON.`;

const USER_PROMPT_TEMPLATE = (article) => `
Convert this tech news article into a multiple-choice quiz question.

Article title: "${article.title}"
Summary: "${article.summary}"
Topic: "${article.topic}"

Return ONLY a JSON object with this exact schema:
{
  "question": "A clear, self-contained question about the article content",
  "options": ["A. option text", "B. option text", "C. option text", "D. option text"],
  "correct": "A",
  "explanation": "1-2 sentence explanation of why the answer is correct",
  "difficulty": "easy" | "medium" | "hard",
  "topic": "${article.topic}"
}

Rules:
- The question must be answerable without reading the article
- All 4 options must be plausible (no obviously wrong answers)
- Exactly one option is correct
- "correct" must be the letter (A, B, C, or D) of the correct option
- difficulty: easy = general knowledge, medium = requires some tech knowledge, hard = specialist knowledge
`;

/**
 * Converts a single article into a quiz question using Gemini 2.0 Flash.
 *
 * @param {object} article - { title, summary, topic, url }
 * @param {number} retriesLeft - internal: retries remaining for transient errors
 * @returns {object|null} Parsed question object or null if generation failed
 */
export async function generateQuestionFromArticle(article, retriesLeft = 1) {
  try {
    const model = getGeminiModel();
    const prompt = `${SYSTEM_PROMPT}\n\n${USER_PROMPT_TEMPLATE(article)}`;

    const result = await model.generateContent(prompt);
    const text   = result.response.text();

    const parsed = JSON.parse(text);

    // Validate required fields
    if (!parsed.question || !parsed.options || !parsed.correct || !parsed.explanation) {
      logger.warn('LLM returned incomplete question schema', { title: article.title });
      return null;
    }

    if (parsed.options.length !== 4) {
      logger.warn('LLM returned wrong number of options', { title: article.title });
      return null;
    }

    const validLetters = ['A', 'B', 'C', 'D'];
    if (!validLetters.includes(parsed.correct)) {
      logger.warn('LLM returned invalid correct letter', { correct: parsed.correct });
      return null;
    }

    // Shuffle options while keeping track of the correct answer text
    const correctOptionText = parsed.options.find((o) => o.startsWith(`${parsed.correct}.`));
    const shuffledOptions   = shuffle(parsed.options);

    // Re-assign letters after shuffling
    const lettered = shuffledOptions.map((opt, i) => {
      const letter = validLetters[i];
      const text   = opt.replace(/^[A-D]\.\s*/, ''); // strip old letter
      return `${letter}. ${text}`;
    });

    const newCorrect = lettered.find((o) =>
      o.replace(/^[A-D]\.\s*/, '') === correctOptionText?.replace(/^[A-D]\.\s*/, '')
    );

    return {
      id:          crypto.randomUUID(),
      question:    parsed.question,
      options:     lettered,
      correct:     newCorrect?.charAt(0) || 'A',
      explanation: parsed.explanation,
      difficulty:  parsed.difficulty || 'medium',
      topic:       article.topic,
      sourceUrl:   article.url,
      generatedAt: new Date().toISOString(),
    };
  } catch (err) {
    // Gemini's free tier occasionally 503s under load ("model overloaded") —
    // that's transient, so retry once before giving up on this article.
    const isTransient = /503|overloaded|Service Unavailable/i.test(err.message || '');
    if (isTransient && retriesLeft > 0) {
      await new Promise((r) => setTimeout(r, 800));
      return generateQuestionFromArticle(article, retriesLeft - 1);
    }
    logger.error(`LLM question generation failed for "${article.title}":`, err.message);
    return null;
  }
}

/**
 * Runs async worker `fn` over `items` with at most `limit` in flight at once.
 */
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Batch-generates quiz questions from multiple articles, running several
 * Gemini calls concurrently instead of one-at-a-time. Concurrency is capped
 * (rather than firing all requests at once) to stay under free-tier rate
 * limits while still cutting wall-clock time dramatically.
 *
 * @param {object[]} articles
 * @param {number}   targetCount - Stop once this many valid questions exist
 * @param {number}   concurrency - Max simultaneous Gemini calls
 */
export async function batchGenerateQuestions(articles, targetCount = 20, concurrency = 4) {
  // Cap how many articles we're willing to burn calls on — enough headroom
  // for some to fail/be rejected, without generating way more than needed.
  const candidates = articles.slice(0, targetCount * 2);
  const questions = [];

  await mapWithConcurrency(candidates, concurrency, async (article) => {
    if (questions.length >= targetCount) return; // already have enough
    const q = await generateQuestionFromArticle(article);
    if (q && questions.length < targetCount) {
      questions.push(q);
      logger.debug(`✅ Generated question [${questions.length}/${targetCount}]: ${q.topic}`);
    }
  });

  logger.info(`LLM batch complete: ${questions.length} questions from ${candidates.length} articles (concurrency=${concurrency})`);
  return questions;
}
