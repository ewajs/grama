import { describe, expect, it } from 'vitest';
import { achievementProgress, ACHIEVEMENTS, unlocked } from './achievements';
import { NEW_PROGRESS } from './progress';
import { statsOf } from './stats';

const fresh = statsOf(NEW_PROGRESS);
const after = statsOf({
  ...NEW_PROGRESS,
  history: {
    1: {
      tier: 'extra',
      difficulty: 'normal',
      occurrence: 0,
      stars: 3,
      hints: 0,
      bonus: 3,
      targets: 9,
    },
  },
});

describe('unlocked', () => {
  it('has nothing for a new player', () => {
    expect(unlocked(fresh)).toEqual([]);
  });

  it('lists what the stats reach', () => {
    expect(unlocked(after)).toEqual(['firstLevel', 'threeStars', 'extra', 'extraNoHints']);
  });

  it('counts Tu diccionario', () => {
    expect(unlocked({ ...fresh, dictionary: 500 })).toEqual(['dictionary100', 'dictionary500']);
  });
});

describe('achievementProgress', () => {
  const levels10 = ACHIEVEMENTS.find(({ id }) => id === 'levels10')!;

  it('is the share of the goal reached, at most 1', () => {
    expect(achievementProgress(levels10, after)).toBeCloseTo(0.1);
    expect(achievementProgress(levels10, { ...after, levels: 25 })).toBe(1);
  });
});

it('has unique ids', () => {
  const ids = ACHIEVEMENTS.map(({ id }) => id);
  expect(new Set(ids).size).toBe(ids.length);
});
