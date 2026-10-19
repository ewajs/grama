import { expect, it } from 'vitest';
import type { History } from './history';
import { statsOf } from './stats';

it('adds up the history', () => {
  const history: History = {
    1: { tier: 'easy', difficulty: 'normal', stars: 3, hints: 0, bonus: 4, targets: 6 },
    2: { tier: 'extra', difficulty: 'normal', stars: 2, hints: 0, bonus: 1, targets: 9 },
    3: { tier: 'extra', difficulty: 'normal', stars: 1, hints: 3, bonus: 0, targets: 9 },
  };
  expect(statsOf(history)).toEqual({
    levels: 3,
    byTier: { easy: 1, medium: 0, hard: 0, extra: 2 },
    stars: 6,
    threeStars: 1,
    words: 24,
    bonus: 5,
    hints: 3,
    noHints: 2,
    extraNoHints: 1,
  });
});

it('is all zeros for a new player', () => {
  expect(statsOf({})).toMatchObject({ levels: 0, stars: 0, words: 0 });
});
