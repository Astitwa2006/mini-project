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
 * Validates a raw {question, options, correct, explanation, difficulty}
 * object from the LLM, re-shuffles its options (so "correct" isn't always
 * the letter the model happened to pick), and shapes it into the app's
 * question format. Shared by both the single-article and batched paths.
 *
 * @returns {object|null} the finalized question, or null if invalid
 */
function finalizeQuestion(parsed, article) {
  if (!parsed?.question || !parsed?.options || !parsed?.correct || !parsed?.explanation) {
    logger.warn('LLM returned incomplete question schema', { title: article?.title });
    return null;
  }

  if (parsed.options.length !== 4) {
    logger.warn('LLM returned wrong number of options', { title: article?.title });
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
    topic:       parsed.topic || article?.topic,
    sourceUrl:   article?.url,
    generatedAt: new Date().toISOString(),
  };
}

/** Transient errors (server-side hiccups) are worth a retry; quota/rate-limit errors are not. */
function isTransientError(message = '') {
  return /503|overloaded|Service Unavailable/i.test(message);
}

/**
 * Converts a single article into a quiz question using one Gemini call.
 * Kept for cases that need exactly one question from exactly one article;
 * `batchGenerateQuestions` below uses the batched multi-article variant
 * instead, since it's far more quota-efficient for generating a pool.
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
    const parsed = JSON.parse(result.response.text());

    return finalizeQuestion(parsed, article);
  } catch (err) {
    if (isTransientError(err.message) && retriesLeft > 0) {
      await new Promise((r) => setTimeout(r, 800));
      return generateQuestionFromArticle(article, retriesLeft - 1);
    }
    logger.error(`LLM question generation failed for "${article.title}":`, err.message);
    return null;
  }
}

const BATCH_SYSTEM_PROMPT = `You are a quiz master generating tech trivia questions from real news articles.
Your output must always be a valid JSON object matching the schema exactly.
Do not include any markdown, explanation, or extra text outside the JSON.`;

const BATCH_PROMPT_TEMPLATE = (articles) => {
  const articleList = articles
    .map((a, i) => `${i + 1}. Title: "${a.title}"\n   Summary: "${a.summary}"\n   Topic: "${a.topic}"`)
    .join('\n\n');

  return `
Convert EACH of these ${articles.length} tech news articles into one multiple-choice quiz question.

${articleList}

Return ONLY a JSON object with this exact schema:
{
  "questions": [
    {
      "index": 1,
      "question": "A clear, self-contained question about the article content",
      "options": ["A. option text", "B. option text", "C. option text", "D. option text"],
      "correct": "A",
      "explanation": "1-2 sentence explanation of why the answer is correct",
      "difficulty": "easy" | "medium" | "hard",
      "topic": "the article's topic slug"
    }
  ]
}

Rules:
- Return exactly ${articles.length} question objects, one per article, in the same order
- "index" must match the article's number above (1-based)
- Each question must be answerable without reading the article
- All 4 options must be plausible; exactly one is correct
- "correct" is the letter (A-D) of the correct option
`;
};

/**
 * Generates one question per article using a SINGLE Gemini call for the
 * whole batch, instead of one call per article. This is the key lever for
 * working within a strict free-tier daily request quota — e.g. a model
 * capped at 20 requests/day yields only ~20 questions/day at one-call-per-
 * article, but ~20 * ARTICLES_PER_CALL questions/day batched like this.
 *
 * @param {object[]} articles - up to ~5-8 articles; keep batches modest so
 *   a single response doesn't get truncated by the output token limit
 * @param {number}   retriesLeft
 * @returns {object[]} valid questions generated from this batch (may be
 *   fewer than articles.length if some entries failed validation)
 */
export async function generateQuestionsBatch(articles, retriesLeft = 1) {
  if (articles.length === 0) return [];

  try {
    const model  = getGeminiModel();
    const prompt = `${BATCH_SYSTEM_PROMPT}\n\n${BATCH_PROMPT_TEMPLATE(articles)}`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());
    const items  = Array.isArray(parsed?.questions) ? parsed.questions : [];

    return items
      .map((item) => finalizeQuestion(item, articles[(item.index ?? 0) - 1] || articles[0]))
      .filter(Boolean);
  } catch (err) {
    if (isTransientError(err.message) && retriesLeft > 0) {
      await new Promise((r) => setTimeout(r, 800));
      return generateQuestionsBatch(articles, retriesLeft - 1);
    }
    const isQuota = /429|quota|Too Many Requests/i.test(err.message || '');
    logger.error(
      `LLM batch generation failed for ${articles.length} articles${isQuota ? ' — QUOTA EXCEEDED for this model; consider a model/tier with a larger free-tier request limit' : ''}:`,
      err.message
    );
    return [];
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

// How many articles get folded into a single Gemini call. Higher = fewer
// API calls (better for tight daily quotas) but a bigger prompt and a
// bigger JSON response to parse; keep this modest so responses don't risk
// truncation against the model's output token limit.
const ARTICLES_PER_LLM_CALL = 5;

/**
 * Batch-generates quiz questions from multiple articles by grouping them
 * into small chunks and generating a full chunk's worth of questions per
 * Gemini call (see generateQuestionsBatch), with a few chunks processed
 * concurrently. This is dramatically more quota-efficient than the old
 * one-question-per-call approach — a 20-requests/day free tier now yields
 * roughly 20 * ARTICLES_PER_LLM_CALL questions/day instead of just 20.
 *
 * @param {object[]} articles
 * @param {number}   targetCount - Stop once this many valid questions exist
 * @param {number}   concurrency - Max simultaneous Gemini calls
 */
export async function batchGenerateQuestions(articles, targetCount = 20, concurrency = 3) {
  // Cap how many articles we're willing to burn calls on — enough headroom
  // for some to fail/be rejected, without generating way more than needed.
  const candidates = articles.slice(0, targetCount * 2);
  const chunks = [];
  for (let i = 0; i < candidates.length; i += ARTICLES_PER_LLM_CALL) {
    chunks.push(candidates.slice(i, i + ARTICLES_PER_LLM_CALL));
  }

  const questions = [];
  await mapWithConcurrency(chunks, concurrency, async (chunk) => {
    if (questions.length >= targetCount) return; // already have enough
    const results = await generateQuestionsBatch(chunk);
    for (const q of results) {
      if (questions.length >= targetCount) break;
      questions.push(q);
      logger.debug(`✅ Generated question [${questions.length}/${targetCount}]: ${q.topic}`);
    }
  });

  logger.info(
    `LLM batch complete: ${questions.length} questions from ${candidates.length} articles ` +
    `(${chunks.length} API calls, ~${ARTICLES_PER_LLM_CALL}/call, concurrency=${concurrency})`
  );
  return questions;
}
