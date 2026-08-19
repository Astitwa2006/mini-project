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
 * @returns {object|null} Parsed question object or null if generation failed
 */
export async function generateQuestionFromArticle(article) {
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
    logger.error(`LLM question generation failed for "${article.title}":`, err.message);
    return null;
  }
}

/**
 * Batch-generates quiz questions from multiple articles.
 * Processes them sequentially to respect API rate limits.
 *
 * @param {object[]} articles
 * @param {number}   targetCount - Stop after this many valid questions
 */
export async function batchGenerateQuestions(articles, targetCount = 20) {
  const questions = [];

  for (const article of articles) {
    if (questions.length >= targetCount) break;

    const q = await generateQuestionFromArticle(article);
    if (q) {
      questions.push(q);
      logger.debug(`✅ Generated question [${questions.length}/${targetCount}]: ${q.topic}`);
    }

    // Small delay to avoid hitting rate limits
    await new Promise((r) => setTimeout(r, 300));
  }

  logger.info(`LLM batch complete: ${questions.length} questions from ${articles.length} articles`);
  return questions;
}
