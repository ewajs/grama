import { expect, it } from 'vitest';
import { evaluate } from './evaluate.ts';

const report = evaluate();
const scenario = (name: string) => report.find((result) => result.scenario === name)!;

it('reproduces seeded reports and directional changes without selecting a live model', () => {
  expect(evaluate(4)).toEqual(evaluate(4));
  expect(evaluate(4, 128)).not.toEqual(evaluate(4));
  expect(evaluate(4, 128)).toEqual(evaluate(4, 128));
  expect(scenario('improvement').comparisons.standard).toBeGreaterThan(
    scenario('stable').comparisons.standard!,
  );
  expect(scenario('decline').comparisons.standard).toBeLessThan(
    scenario('stable').comparisons.standard!,
  );
  expect(scenario('perfect-easy').comparisons.easy).toBe(0.5);
  expect(scenario('perfect-easy').ratingDrift).toBeGreaterThan(0);
});

it('preserves independent counts, cohort boundaries and inactive means', () => {
  expect(scenario('missing').observations).toBe(40);
  expect(scenario('duplicate').observations).toBe(scenario('stable').observations);
  expect(scenario('duplicate').comparisons).toEqual(scenario('stable').comparisons);
  expect(Object.keys(scenario('cohort-shift').comparisons).sort()).toEqual(['easy', 'standard']);
  expect(scenario('inactivity').ratingDrift).toBe(scenario('stable').ratingDrift);
  expect(scenario('inactivity').idleDeviationGain).toBeGreaterThan(0);
});

it('exposes artificial confidence and numerical failures in the naive twenty-copy negative control', () => {
  const duplicate = scenario('duplicate');
  expect(duplicate.naiveFirstDeviation!).toBeLessThan(duplicate.singleFirstDeviation!);
  expect(duplicate.naiveGhostFailures).toBeGreaterThan(0);
  expect(duplicate.naiveGhostDeviation).toBeNull();
});

it.each([0, -1, 0.5, Infinity])('rejects invalid evaluation size %s', (seeds) => {
  expect(() => evaluate(seeds)).toThrow(RangeError);
});

it('rejects invalid or wrapping seed ranges', () => {
  expect(() => evaluate(2, -1)).toThrow(RangeError);
  expect(() => evaluate(2, 0.5)).toThrow(RangeError);
  expect(() => evaluate(2, 2 ** 32 - 1)).toThrow(RangeError);
});
