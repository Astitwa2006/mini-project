import crypto from 'crypto';
import { getGeminiModel } from '../config/llm.js';
import { logger } from '../utils/logger.js';
import { shuffle } from '../utils/helpers.js';

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
  if (!parsed?.question || !parsed?.type) {
    logger.warn('LLM returned invalid question format', { parsed });
    return null;
  }

  let processedOptions = parsed.options || [];
  let processedCorrect = parsed.correct;

  // Normalize and shuffle options for types that need it
  if (parsed.type === 'single' || parsed.type === 'multi') {
    const rawOptions = (parsed.options || []).map(o => o.replace(/^[A-F]\.\s*/, ''));
    
    const correctTexts = [];
    if (parsed.type === 'single') {
      const cIndex = (parsed.options || []).findIndex(o => o.startsWith(parsed.correct + '.') || o === parsed.correct);
      correctTexts.push(rawOptions[cIndex >= 0 ? cIndex : 0]);
    } else {
      for (const c of (parsed.correct || [])) {
         const cIndex = (parsed.options || []).findIndex(o => o.startsWith(c + '.') || o === c);
         if (cIndex >= 0) correctTexts.push(rawOptions[cIndex]);
      }
    }

    const shuffled = shuffle(rawOptions);
    processedOptions = shuffled.map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}`); 
    
    if (parsed.type === 'single') {
      const newIdx = shuffled.indexOf(correctTexts[0]);
      processedCorrect = String.fromCharCode(65 + (newIdx >= 0 ? newIdx : 0));
    } else {
      processedCorrect = correctTexts.map(t => String.fromCharCode(65 + shuffled.indexOf(t)));
    }
  } else if (parsed.type === 'rank') {
     processedOptions = shuffle((parsed.options || []).map(o => o.replace(/^[A-D]\.\s*/, '')));
     processedCorrect = (parsed.correct || []).map(o => o.replace(/^[A-D]\.\s*/, ''));
  } else if (parsed.type === 'swipe') {
     processedOptions = ['True', 'False']; 
     processedCorrect = parsed.correct === 'True' || parsed.correct === true || parsed.correct === 'true' ? 'True' : 'False';
  } else if (parsed.type === 'type-in') {
     processedOptions = [];
     processedCorrect = String(parsed.correct || '').toLowerCase().trim();
  }

  return {
    id:          crypto.randomUUID(),
    question:    parsed.question,
    type:        parsed.type,
    options:     processedOptions,
    correct:     processedCorrect,
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
    // Re-use BATCH logic for single article to keep prompts unified
    const prompt = `${BATCH_SYSTEM_PROMPT}\n\n${BATCH_PROMPT_TEMPLATE([article])}`;

    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text());

    const item = Array.isArray(parsed?.questions) ? parsed.questions[0] : parsed;
    return finalizeQuestion(item, article);
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
Convert EACH of these ${articles.length} tech news articles into ONE quiz question.
Randomly vary the question format between 'single', 'multi', 'rank', 'swipe', and 'type-in'.

${articleList}

Return ONLY a JSON object with this exact schema:
{
  "questions": [
    {
      "index": 1,
      "type": "single" | "multi" | "rank" | "swipe" | "type-in",
      "question": "A clear, self-contained question about the article content",
      "options": ["Array of options (if type is single, multi, or rank. Empty for swipe and type-in)"],
      "correct": "The correct answer. (For single: a letter A-D. For multi: array of letters. For rank: array of the exact option strings in correct order. For swipe: 'True' or 'False'. For type-in: a short string answer).",
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
- Try to mix up the types so that not all questions are the same format.
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
