import { jest } from '@jest/globals';

// Mock the Gemini model
jest.unstable_mockModule('../../server/src/config/llm.js', () => ({
  getGeminiModel: () => ({
    generateContent: jest.fn().mockResolvedValue({
      response: {
        text: () => JSON.stringify({
          question:    'What does WebAssembly (Wasm) primarily enable in browsers?',
          options:     ['A. Server-side rendering', 'B. Near-native performance for compiled code', 'C. CSS animations', 'D. Database queries'],
          correct:     'B',
          explanation: 'WebAssembly allows code written in languages like C/C++/Rust to run at near-native speed in the browser.',
          difficulty:  'medium',
          topic:       'web-dev',
        }),
      },
    }),
  }),
}));

jest.unstable_mockModule('../../server/src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { generateQuestionFromArticle } = await import('../../server/src/services/llm.service.js');

describe('generateQuestionFromArticle', () => {
  const mockArticle = {
    title:   'WebAssembly 2.0 Released With Major Performance Improvements',
    summary: 'The W3C has finalized the WebAssembly 2.0 specification...',
    topic:   'web-dev',
    url:     'https://example.com/wasm',
  };

  it('returns a valid question object', async () => {
    const q = await generateQuestionFromArticle(mockArticle);
    expect(q).not.toBeNull();
    expect(q).toHaveProperty('question');
    expect(q).toHaveProperty('options');
    expect(q).toHaveProperty('correct');
    expect(q).toHaveProperty('explanation');
    expect(q).toHaveProperty('difficulty');
    expect(q).toHaveProperty('topic', 'web-dev');
  });

  it('returns exactly 4 options', async () => {
    const q = await generateQuestionFromArticle(mockArticle);
    expect(q.options).toHaveLength(4);
  });

  it('correct letter is one of A, B, C, D', async () => {
    const q = await generateQuestionFromArticle(mockArticle);
    expect(['A', 'B', 'C', 'D']).toContain(q.correct);
  });

  it('assigns a unique id to each question', async () => {
    const q1 = await generateQuestionFromArticle(mockArticle);
    const q2 = await generateQuestionFromArticle(mockArticle);
    expect(q1.id).not.toBe(q2.id);
  });
});
