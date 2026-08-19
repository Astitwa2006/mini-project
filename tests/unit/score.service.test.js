import { topicsToHash, shuffle, calculateScore } from '../../server/src/utils/helpers.js';

describe('topicsToHash', () => {
  it('produces the same hash regardless of topic order', () => {
    expect(topicsToHash(['ai-ml', 'cloud'])).toBe(topicsToHash(['cloud', 'ai-ml']));
  });

  it('produces different hashes for different topic sets', () => {
    expect(topicsToHash(['ai-ml'])).not.toBe(topicsToHash(['cybersecurity']));
  });

  it('handles empty array', () => {
    expect(topicsToHash([])).toBeTruthy();
  });
});

describe('shuffle', () => {
  it('returns an array of the same length', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(shuffle(arr)).toHaveLength(arr.length);
  });

  it('does not mutate the original array', () => {
    const arr = [1, 2, 3];
    const original = [...arr];
    shuffle(arr);
    expect(arr).toEqual(original);
  });

  it('contains all original elements', () => {
    const arr = ['A', 'B', 'C', 'D'];
    const shuffled = shuffle(arr);
    expect(shuffled.sort()).toEqual(arr.sort());
  });
});

describe('calculateScore', () => {
  it('returns max score (1000) when full time remains', () => {
    expect(calculateScore(30000, 30000)).toBe(1000);
  });

  it('returns min score (500) when no time remains', () => {
    expect(calculateScore(0, 30000)).toBe(500);
  });

  it('returns a score between 500 and 1000 for mid-time answers', () => {
    const score = calculateScore(15000, 30000);
    expect(score).toBeGreaterThanOrEqual(500);
    expect(score).toBeLessThanOrEqual(1000);
  });
});
