import { jest } from '@jest/globals';

// A fixed 3-question batch response, reused across every mocked call —
// what matters for these tests is call *count*, not response variety.
const mockGenerateContent = jest.fn().mockResolvedValue({
  response: {
    text: () => JSON.stringify({
      questions: [
        { index: 1, question: 'Q1?', options: ['A. one', 'B. two', 'C. three', 'D. four'], correct: 'A', explanation: 'because', difficulty: 'easy',   topic: 'web-dev' },
        { index: 2, question: 'Q2?', options: ['A. one', 'B. two', 'C. three', 'D. four'], correct: 'B', explanation: 'because', difficulty: 'medium', topic: 'web-dev' },
        { index: 3, question: 'Q3?', options: ['A. one', 'B. two', 'C. three', 'D. four'], correct: 'C', explanation: 'because', difficulty: 'hard',   topic: 'web-dev' },
      ],
    }),
  },
});

jest.unstable_mockModule('../../server/src/config/llm.js', () => ({
  getGeminiModel: () => ({ generateContent: mockGenerateContent }),
}));

jest.unstable_mockModule('../../server/src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { generateQuestionsBatch, batchGenerateQuestions } = await import('../../server/src/services/llm.service.js');

const makeArticles = (n) => Array.from({ length: n }, (_, i) => ({
  title:   `Article ${i + 1} title long enough to pass the upstream length filter`,
  summary: `Summary for article ${i + 1}, long enough to pass the minimum length filter used by the RSS pipeline.`,
  topic:   'web-dev',
  url:     `https://example.com/${i + 1}`,
}));

beforeEach(() => mockGenerateContent.mockClear());

describe('generateQuestionsBatch', () => {
  it('returns one finalized question per item in the response', async () => {
    const qs = await generateQuestionsBatch(makeArticles(3));
    expect(qs).toHaveLength(3);
    expect(qs[0]).toHaveProperty('question');
    expect(qs[0]).toHaveProperty('options');
    expect(['A', 'B', 'C', 'D']).toContain(qs[0].correct);
  });

  it('uses exactly ONE Gemini call for the whole batch, not one per article', async () => {
    await generateQuestionsBatch(makeArticles(3));
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });
});

describe('batchGenerateQuestions', () => {
  it('uses far fewer Gemini calls than the number of articles (the point of batching)', async () => {
    const articles = makeArticles(9); // 9 articles, 5-per-call -> 2 chunks
    await batchGenerateQuestions(articles, 9, 3);
    expect(mockGenerateContent.mock.calls.length).toBeLessThan(articles.length);
    expect(mockGenerateContent.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('still returns well-formed questions', async () => {
    const questions = await batchGenerateQuestions(makeArticles(6), 6, 3);
    expect(questions.length).toBeGreaterThan(0);
    for (const q of questions) {
      expect(q.options).toHaveLength(4);
      expect(['A', 'B', 'C', 'D']).toContain(q.correct);
    }
  });
});
