import { expect, it } from 'vitest';
import { NEW_RATING, ratePeriod } from './glicko2';
import { performanceMatch, summarizePerformance } from './performance';

const input = {
  difficulty: 2.75,
  targetLetters: 20,
  revealedLetters: 0,
  bonusWords: 0,
  activeMs: null,
};

it('uses unbounded difficulty-based opponents, with assistance normalized by workload', () => {
  expect(performanceMatch(input)).toEqual({
    opponent: { rating: 1400, deviation: 150 },
    score: 0.65,
  });
  expect(performanceMatch({ ...input, difficulty: 6 }).opponent.rating).toBe(2700);
  expect(performanceMatch({ ...input, revealedLetters: 4 }).score).toBeCloseTo(0.5);
  expect(performanceMatch({ ...input, targetLetters: 40, revealedLetters: 8 }).score).toBeCloseTo(
    0.5,
  );
  expect(performanceMatch({ ...input, revealedLetters: 20 }).score).toBeCloseTo(0.5);
});

it('rewards extras with diminishing returns and keeps speed secondary and optional', () => {
  const result = (bonusWords: number) => performanceMatch({ ...input, bonusWords }).score;
  expect(result(3)).toBeCloseTo(0.675);
  expect(result(6)).toBeGreaterThan(result(3));
  expect(result(6) - result(3)).toBeLessThan(result(3) - result(0));
  expect(result(10000)).toBeLessThan(0.7);
  expect(performanceMatch({ ...input, activeMs: 80000 }).score).toBeCloseTo(0.65);
  expect(performanceMatch({ ...input, activeMs: 40000 }).score).toBeCloseTo(0.7);
  expect(performanceMatch({ ...input, activeMs: 160000 }).score).toBeCloseTo(0.6);
  expect(performanceMatch({ ...input, activeMs: 1 }).score).toBeCloseTo(0.7);
  expect(performanceMatch({ ...input, activeMs: 1e12 }).score).toBeCloseTo(0.6);
  expect(performanceMatch({ ...input, targetLetters: 40, activeMs: 160000 }).score).toBeCloseTo(
    0.65,
  );
});

it('makes difficulty dominant, with perceptible but smaller secondary effects', () => {
  const update = (change: Partial<import('./performance').PerformanceInput>) =>
    ratePeriod(NEW_RATING, [performanceMatch({ ...input, ...change })]).rating;
  const base = update({}),
    harder = update({ difficulty: 3.75 });
  expect(harder).toBeGreaterThan(update({ bonusWords: 100, activeMs: null }));
  expect(base - update({ revealedLetters: 1 })).toBeGreaterThan(1);
  expect(update({ bonusWords: 3 })).toBeGreaterThan(base);
  expect(harder - base).toBeGreaterThan(base - update({ revealedLetters: 4 }));
});

it('starts immediately and repeated equivalent evidence settles instead of earning points indefinitely', () => {
  const match = performanceMatch(input);
  let player = ratePeriod(NEW_RATING, [match]);
  expect(summarizePerformance([player])).toEqual({ current: player, trend: null });
  for (let i = 0; i < 100; i++) player = ratePeriod(player, [match]);
  const before = player.rating;
  for (let i = 0; i < 100; i++) player = ratePeriod(player, [match]);
  expect(Math.abs(player.rating - before)).toBeLessThan(5);
  expect(player.deviation).toBeLessThan(NEW_RATING.deviation);
  // The scale is not bounded to 100 or 1500, even on the first result.
  expect(
    ratePeriod(NEW_RATING, [performanceMatch({ ...input, difficulty: 6 })]).rating,
  ).toBeGreaterThan(1500);
});

it.each([
  { difficulty: NaN },
  { targetLetters: 0 },
  { targetLetters: 2.5 },
  { revealedLetters: -1 },
  { revealedLetters: 21 },
  { bonusWords: -1 },
  { bonusWords: 0.5 },
  { activeMs: 0 },
  { activeMs: Infinity },
])('rejects invalid match input %j', (change) => {
  expect(() => performanceMatch({ ...input, ...change })).toThrow(RangeError);
});

it('uses the latest Glicko state, with trends after six updates and a neutral band', () => {
  const ratings = (values: number[]) => values.map((rating) => ({ ...NEW_RATING, rating }));
  expect(summarizePerformance([])).toEqual({ current: null, trend: null });
  expect(summarizePerformance(ratings([1500, 1600])).current?.rating).toBe(1600);
  expect(summarizePerformance(ratings([1500, 1500, 1500, 1600, 1600])).trend).toBeNull();
  expect(summarizePerformance(ratings([1500, 1500, 1500, 1515, 1515, 1515])).trend).toBe('up');
  expect(summarizePerformance(ratings([1500, 1500, 1500, 1485, 1485, 1485])).trend).toBe('down');
  expect(summarizePerformance(ratings([1500, 1500, 1500, 1510, 1510, 1510])).trend).toBe('steady');
});
