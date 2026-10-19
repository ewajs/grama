import { describe, expect, it } from 'vitest';
import { record, recordOf, starsFor, type History, type LevelRecord } from './history';
import type { Level } from './level';

const level: Level = {
  letters: ['S', 'A', 'L', 'T', 'O', 'P'],
  targets: ['PLATOS', 'SOL'],
  bonus: ['OLA', 'LOS', 'LAS', 'TOS'],
  tier: 'hard',
};
const all = ['PLATOS', 'SOL'];

describe('starsFor', () => {
  it('gives three stars with no hints and three bonus words', () => {
    expect(starsFor(level, { found: [...all, 'OLA', 'LOS', 'LAS'], revealed: {} })).toBe(3);
  });

  it('gives two stars with no hints and fewer bonus words, or with one hint', () => {
    expect(starsFor(level, { found: all, revealed: {} })).toBe(2);
    expect(starsFor(level, { found: [...all, 'OLA', 'LOS', 'LAS'], revealed: { SOL: 1 } })).toBe(2);
  });

  it('gives one star with more hints', () => {
    expect(starsFor(level, { found: all, revealed: { SOL: 1, PLATOS: 1 } })).toBe(1);
  });
});

describe('recordOf', () => {
  it('sums up how the level went', () => {
    expect(recordOf(level, { found: [...all, 'OLA'], revealed: { SOL: 1 } }, 'normal')).toEqual({
      tier: 'hard',
      difficulty: 'normal',
      stars: 2,
      hints: 1,
      bonus: 1,
      targets: 2,
    });
  });
});

describe('record', () => {
  const none: History = {};
  const result = (stars: 1 | 2 | 3, hints = 0, bonus = 0): LevelRecord => ({
    tier: 'easy',
    difficulty: 'normal',
    stars,
    hints,
    bonus,
    targets: 6,
  });

  it('adds a first result', () => {
    expect(record(none, 4, result(2))).toEqual({ 4: result(2) });
  });

  it('keeps the best result per level', () => {
    const history = record(none, 4, result(2, 1));
    expect(record(history, 4, result(1))).toBe(history);
    expect(record(history, 4, result(3))[4]).toEqual(result(3));
    expect(record(history, 4, result(2, 0))[4]).toEqual(result(2, 0));
  });
});
