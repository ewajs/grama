import { describe, expect, it } from 'vitest';
import { shuffled } from './shuffle';

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
