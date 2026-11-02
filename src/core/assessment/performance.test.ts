import { expect, it } from 'vitest';
import { performanceScore, summarizePerformance } from './performance';

const input = { difficulty: 2.75, targetLetters: 20, revealedLetters: 0, activeMs: null };

it('scores difficulty and normalized assistance immediately, independently of board size', () => {
  expect(performanceScore(input)).toBe(61.25);
  expect(performanceScore({ ...input, difficulty: 3.75 })).toBe(76.25);
  expect(performanceScore({ ...input, revealedLetters: 4 })).toBe(51.25);
  expect(performanceScore({ ...input, targetLetters: 40, revealedLetters: 8 })).toBe(51.25);
  expect(performanceScore({ ...input, difficulty: -10, revealedLetters: 20 })).toBe(0);
  expect(performanceScore({ ...input, difficulty: 100 })).toBe(95);
});

it('caps speed at ±3, with a neutral assumed pace and no adjustment for unavailable time', () => {
  expect(performanceScore({ ...input, activeMs: 80000 })).toBe(61.25);
  expect(performanceScore({ ...input, activeMs: 40000 })).toBe(64.25);
  expect(performanceScore({ ...input, activeMs: 160000 })).toBe(58.25);
  expect(performanceScore({ ...input, activeMs: 1 })).toBe(64.25);
  expect(performanceScore({ ...input, activeMs: 1e12 })).toBe(58.25);
  expect(performanceScore({ ...input, targetLetters: 40, activeMs: 160000 })).toBe(61.25);
  // Half a difficulty point outweighs the entire possible speed swing.
  expect(performanceScore({ ...input, difficulty: 3.25, activeMs: 1e12 })).toBeGreaterThan(
    performanceScore({ ...input, activeMs: 1 }),
  );
});

it.each([
  { difficulty: NaN },
  { targetLetters: 0 },
  { targetLetters: 2.5 },
  { revealedLetters: -1 },
  { revealedLetters: 21 },
  { activeMs: 0 },
  { activeMs: Infinity },
])('rejects invalid scoring input %j', (change) => {
  expect(() => performanceScore({ ...input, ...change })).toThrow(RangeError);
});

it('uses available results from the first completion and only the most recent five', () => {
  expect(summarizePerformance([])).toEqual({ current: null, trend: null });
  expect(summarizePerformance([60])).toEqual({ current: 60, trend: null });
  expect(summarizePerformance([40, 60])).toEqual({ current: 50, trend: null });
  expect(summarizePerformance([0, 50, 50, 50, 50, 50]).current).toBe(50);
});

it('compares disjoint three-result windows after six scores, with a three-point neutral band', () => {
  expect(summarizePerformance([50, 50, 50, 60, 60]).trend).toBeNull();
  expect(summarizePerformance([50, 50, 50, 53, 53, 53]).trend).toBe('up');
  expect(summarizePerformance([50, 50, 50, 47, 47, 47]).trend).toBe('down');
  expect(summarizePerformance([50, 50, 50, 52, 52, 52]).trend).toBe('steady');
  expect(summarizePerformance([0, 50, 50, 50, 50, 50, 50]).trend).toBe('steady');
  expect(() => summarizePerformance([NaN])).toThrow(RangeError);
});
