import { describe, expect, it } from 'vitest';
import { seededRandom, shuffled } from './random';

/** A fake random source that returns the given numbers in turn. */
function sequence(...numbers: number[]): () => number {
  let next = 0;
  return () => numbers[next++ % numbers.length]!;
}

describe('shuffled', () => {
  it('reorders by the random keys', () => {
    expect(shuffled(['A', 'B', 'C'], sequence(0.9, 0.1, 0.5))).toEqual(['B', 'C', 'A']);
  });

  it('never returns the original order', () => {
    expect(shuffled(['A', 'B', 'C'], sequence(0.1, 0.2, 0.3))).toEqual(['B', 'C', 'A']);
  });

  it('leaves the input untouched', () => {
    const items = ['A', 'B', 'C'];
    shuffled(items);
    expect(items).toEqual(['A', 'B', 'C']);
  });

  it('handles empty and single-item lists', () => {
    expect(shuffled([])).toEqual([]);
    expect(shuffled(['A'])).toEqual(['A']);
  });
});

describe('seededRandom', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = seededRandom(37);
    const b = seededRandom(37);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('gives different sequences for different seeds', () => {
    expect(seededRandom(1)()).not.toBe(seededRandom(2)());
  });

  it('stays within [0, 1)', () => {
    const random = seededRandom(5);
    for (let i = 0; i < 1000; i++) {
      const value = random();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
