import { jest } from '@jest/globals';

// A minimal in-memory stand-in for cache.service.js — recordAnswer/
// recordQuestionSentAt only ever call get/set, so this is enough.
const store = new Map();
const fakeCache = {
  async get(key) { return store.has(key) ? store.get(key) : null; },
  async set(key, value) { store.set(key, value); },
  async del(...keys) { keys.forEach((k) => store.delete(k)); },
};

jest.unstable_mockModule('../../server/src/services/cache.service.js', () => ({
  cache: fakeCache,
}));

jest.unstable_mockModule('../../server/src/config/env.js', () => ({
  env: { QUESTION_TIME_LIMIT_SECONDS: 30 },
}));

jest.unstable_mockModule('../../server/src/config/supabase.js', () => ({
  supabaseAdmin: {
    from: () => ({ insert: async () => ({ error: null }) }),
    rpc: async () => ({}),
  },
}));

jest.unstable_mockModule('../../server/src/utils/logger.js', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

const { recordAnswer, recordQuestionSentAt } = await import('../../server/src/services/score.service.js');

const ROOM_ID = 'room-1';

beforeEach(async () => {
  store.clear();
  await fakeCache.set(`room:${ROOM_ID}:questions`, [
    { correct: 'A', explanation: 'because A is right' },
    { correct: 'A', explanation: 'because A is right' },
  ]);
});

describe('recordAnswer — server-authoritative timing', () => {
  it('clamps a fabricated timeRemainingMs to what the server clock actually allows', async () => {
    await recordQuestionSentAt(ROOM_ID, 0);
    // Back-date the recorded broadcast time to simulate ~29s of the 30s
    // limit having genuinely elapsed before this "answer" arrives.
    const sentAt = await fakeCache.get(`room:${ROOM_ID}:q:0:sentAt`);
    await fakeCache.set(`room:${ROOM_ID}:q:0:sentAt`, sentAt - 29000);

    const result = await recordAnswer({
      roomId: ROOM_ID,
      questionIndex: 0,
      playerId: 'cheater',
      selectedOption: 'A',
      timeRemainingMs: 999999999, // lies: claims to have answered instantly
    });

    expect(result.isCorrect).toBe(true);
    // ~1s truly remained out of 30s -> points should sit just above the 500
    // floor, nowhere near the ~1000 an unclamped fabricated claim would give.
    expect(result.points).toBeGreaterThanOrEqual(500);
    expect(result.points).toBeLessThan(650);
  });

  it('still awards near-max points for a genuinely fast, honest answer', async () => {
    await recordQuestionSentAt(ROOM_ID, 0);

    const result = await recordAnswer({
      roomId: ROOM_ID,
      questionIndex: 0,
      playerId: 'honest-player',
      selectedOption: 'A',
      timeRemainingMs: 29500, // answered almost immediately, honestly
    });

    expect(result.isCorrect).toBe(true);
    expect(result.points).toBeGreaterThan(950);
  });

  it('never awards points outside [500, 1000] for a correct answer, even without a recorded sentAt', async () => {
    // No recordQuestionSentAt call — exercises the fallback path.
    const result = await recordAnswer({
      roomId: ROOM_ID,
      questionIndex: 0,
      playerId: 'no-sentat-player',
      selectedOption: 'A',
      timeRemainingMs: 15000,
    });

    expect(result.isCorrect).toBe(true);
    expect(result.points).toBeGreaterThanOrEqual(500);
    expect(result.points).toBeLessThanOrEqual(1000);
  });

  it('awards 0 points for a wrong answer regardless of claimed timing', async () => {
    await recordQuestionSentAt(ROOM_ID, 0);

    const result = await recordAnswer({
      roomId: ROOM_ID,
      questionIndex: 0,
      playerId: 'wrong-answer-player',
      selectedOption: 'B',
      timeRemainingMs: 999999999,
    });

    expect(result.isCorrect).toBe(false);
    expect(result.points).toBe(0);
  });

  it('rejects a second submission from the same player for the same question', async () => {
    await recordQuestionSentAt(ROOM_ID, 0);
    await recordAnswer({
      roomId: ROOM_ID, questionIndex: 0, playerId: 'p1', selectedOption: 'A', timeRemainingMs: 20000,
    });

    const second = await recordAnswer({
      roomId: ROOM_ID, questionIndex: 0, playerId: 'p1', selectedOption: 'A', timeRemainingMs: 20000,
    });

    expect(second.alreadyAnswered).toBe(true);
  });
});

describe('recordAnswer — wager', () => {
  it('doubles points on a correct wagered answer', async () => {
    await recordQuestionSentAt(ROOM_ID, 0);
    const result = await recordAnswer({
      roomId: ROOM_ID, questionIndex: 0, playerId: 'p1', selectedOption: 'A',
      timeRemainingMs: 30000, wager: true,
    });

    expect(result.isCorrect).toBe(true);
    // Un-wagered max is 1000 (calculateScore's ceiling) -> wagered should be ~2000.
    expect(result.points).toBeGreaterThan(1900);
  });

  it('applies a real, symmetric penalty (not just 0) on a wrong wagered answer, and it debits room state', async () => {
    await fakeCache.set(`room:${ROOM_ID}:state`, { scores: { p1: 1000 }, correctCounts: {} });
    await recordQuestionSentAt(ROOM_ID, 0);

    const result = await recordAnswer({
      roomId: ROOM_ID, questionIndex: 0, playerId: 'p1', selectedOption: 'B', // wrong — correct is 'A'
      timeRemainingMs: 30000, wager: true,
    });

    expect(result.isCorrect).toBe(false);
    expect(result.points).toBeLessThan(0);

    const state = await fakeCache.get(`room:${ROOM_ID}:state`);
    expect(state.scores.p1).toBe(1000 + result.points);
  });

  it("floors a player's score at 0 even after a large wager loss", async () => {
    await fakeCache.set(`room:${ROOM_ID}:state`, { scores: { p1: 100 }, correctCounts: {} });
    await recordQuestionSentAt(ROOM_ID, 0);

    await recordAnswer({
      roomId: ROOM_ID, questionIndex: 0, playerId: 'p1', selectedOption: 'B',
      timeRemainingMs: 30000, wager: true, // near-max timing -> near-max (large) penalty
    });

    const state = await fakeCache.get(`room:${ROOM_ID}:state`);
    expect(state.scores.p1).toBe(0);
  });
});

describe('recordAnswer — steal cap', () => {
  it('consumes the single per-game steal attempt and ignores a second one', async () => {
    await fakeCache.set(`room:${ROOM_ID}:state`, { scores: {}, correctCounts: {} });
    await recordQuestionSentAt(ROOM_ID, 0);
    await recordQuestionSentAt(ROOM_ID, 1);

    const first = await recordAnswer({
      roomId: ROOM_ID, questionIndex: 0, playerId: 'p1', selectedOption: 'A',
      timeRemainingMs: 20000, stealTarget: 'p2',
    });
    const second = await recordAnswer({
      roomId: ROOM_ID, questionIndex: 1, playerId: 'p1', selectedOption: 'A',
      timeRemainingMs: 20000, stealTarget: 'p2',
    });

    expect(first.stealArmed).toBe(true);
    expect(second.stealArmed).toBe(false);
  });
});
