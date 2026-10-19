import { describe, expect, it } from 'vitest';
import {
  missingForThreeStars,
  record,
  recordOf,
  starsFor,
  type History,
  type LevelRecord,
} from './history';
import type { Level } from './level';
import { NEW_SESSION } from './session';

const level: Level = {
  letters: ['S', 'A', 'L', 'T', 'O', 'P'],
  targets: ['PLATOS', 'SOL'],
  bonus: ['OLA', 'LOS', 'LAS', 'TOS'],
  tier: 'hard',
};
const all = ['PLATOS', 'SOL'];

describe('starsFor', () => {
  it('gives three stars with no hints and three bonus words', () => {
    expect(
      starsFor(level, { ...NEW_SESSION, found: [...all, 'OLA', 'LOS', 'LAS'], revealed: {} }),
    ).toBe(3);
  });

  it('gives two stars with no hints and fewer bonus words, or with one hint', () => {
    expect(starsFor(level, { ...NEW_SESSION, found: all, revealed: {} })).toBe(2);
    expect(
      starsFor(level, {
        ...NEW_SESSION,
        found: [...all, 'OLA', 'LOS', 'LAS'],
        revealed: { SOL: 1 },
      }),
    ).toBe(2);
  });

  it('gives one star with more hints', () => {
    expect(starsFor(level, { ...NEW_SESSION, found: all, revealed: { SOL: 1, PLATOS: 1 } })).toBe(
      1,
    );
  });
});

describe('missingForThreeStars', () => {
  it('counts the hints spent and the bonus words still to find', () => {
    expect(
      missingForThreeStars(level, { ...NEW_SESSION, found: [...all, 'OLA'], revealed: { SOL: 2 } }),
    ).toEqual({ hints: 2, bonus: 2 });
  });

  it('is nothing for a three-star play, however many bonus words past three', () => {
    expect(
      missingForThreeStars(level, {
        ...NEW_SESSION,
        found: [...all, 'OLA', 'LOS', 'LAS', 'TOS'],
        revealed: {},
      }),
    ).toEqual({ hints: 0, bonus: 0 });
  });
});

describe('recordOf', () => {
  it('sums up how the level went', () => {
    expect(
      recordOf(
        level,
        { ...NEW_SESSION, found: [...all, 'OLA'], revealed: { SOL: 1 } },
        'normal',
        4,
      ),
    ).toEqual({
      tier: 'hard',
      difficulty: 'normal',
      occurrence: 4,
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
    occurrence: 4,
    stars,
    hints,
    bonus,
    targets: 6,
  });

  it('adds a first result', () => {
    expect(record(none, 4, result(2))).toEqual({ 4: result(2) });
  });

  it('keeps the best of every play per level', () => {
    const history = record(none, 4, result(2, 1, 5));
    expect(record(history, 4, result(1, 3))).toBe(history);
    expect(record(history, 4, result(3, 0, 3))[4]).toEqual(result(3, 0, 5));
    expect(record(history, 4, result(2, 1, 6))[4]).toEqual(result(2, 1, 6));
  });
});
