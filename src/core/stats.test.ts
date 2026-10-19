import { expect, it } from 'vitest';
import { record, type History } from './history';
import { NEW_PROGRESS } from './progress';
import { statsOf } from './stats';

it('adds up the history', () => {
  const history: History = {
    1: {
      tier: 'easy',
      difficulty: 'normal',
      occurrence: 0,
      stars: 3,
      hints: 0,
      bonus: 4,
      targets: 6,
    },
    2: {
      tier: 'extra',
      difficulty: 'normal',
      occurrence: 0,
      stars: 2,
      hints: 0,
      bonus: 1,
      targets: 9,
    },
    3: {
      tier: 'extra',
      difficulty: 'normal',
      occurrence: 0,
      stars: 1,
      hints: 3,
      bonus: 0,
      targets: 9,
    },
  };
  expect(statsOf({ history, dailies: {}, hintsSpent: 7 })).toEqual({
    levels: 3,
    byTier: { easy: 1, medium: 0, hard: 0, extra: 2 },
    stars: 6,
    threeStars: 1,
    words: 24,
    bonus: 5,
    hints: 7,
    noHints: 2,
    extraNoHints: 1,
    dailies: 0,
    bestStreak: 0,
    trialRuns: 0,
    trialPoints: 0,
    trialWheels: 0,
  });
});

it('is all zeros for a new player', () => {
  expect(statsOf(NEW_PROGRESS)).toMatchObject({ levels: 0, stars: 0, words: 0, hints: 0 });
});

const daily = {
  tier: 'easy',
  difficulty: 'normal',
  occurrence: 0,
  stars: 2,
  hints: 0,
  bonus: 0,
  targets: 8,
} as const;

it('counts daily challenges and the best streak', () => {
  const done = {
    tier: 'easy',
    difficulty: 'normal',
    occurrence: 0,
    stars: 2,
    hints: 0,
    bonus: 0,
    targets: 8,
  } as const;
  const dailies = { '2026-10-19': done, '2026-10-20': done, '2026-10-22': done };
  const stats = statsOf({ ...NEW_PROGRESS, dailies });
  expect(stats).toMatchObject({ dailies: 3, bestStreak: 2, levels: 0 });
});

it('counts dailies toward stars, words and tiers', () => {
  const sunday = { ...daily, tier: 'extra', stars: 3, bonus: 4 } as const;
  const stats = statsOf({ ...NEW_PROGRESS, dailies: { '2026-10-25': sunday } });
  expect(stats).toMatchObject({ stars: 3, threeStars: 1, words: 8, bonus: 4, extraNoHints: 1 });
  expect(stats.byTier.extra).toBe(1);
});

it('never goes down when a level is replayed', () => {
  const first = { ...daily, stars: 2, hints: 1, bonus: 6 } as const;
  const replay = { ...daily, stars: 3, hints: 0, bonus: 3 } as const;
  const none: History = {};
  const before = statsOf({ ...NEW_PROGRESS, history: record(none, 1, first) });
  const after = statsOf({ ...NEW_PROGRESS, history: record(record(none, 1, first), 1, replay) });
  for (const key of ['stars', 'threeStars', 'words', 'bonus', 'noHints'] as const) {
    expect(after[key], key).toBeGreaterThanOrEqual(before[key]);
  }
});

it('counts the Contrarreloj record', () => {
  const trials = { runs: 4, best: { points: 610, cleared: 5, words: 22 }, mostCleared: 6 };
  expect(statsOf(NEW_PROGRESS, trials)).toMatchObject({
    trialRuns: 4,
    trialPoints: 610,
    trialWheels: 6,
  });
});
