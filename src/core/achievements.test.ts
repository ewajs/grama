import { describe, expect, it } from 'vitest';
import { achievementProgress, ACHIEVEMENTS, unlocked } from './achievements';
import { statsOf } from './stats';

const fresh = statsOf({});
const after = statsOf({
  1: { tier: 'extra', difficulty: 'normal', stars: 3, hints: 0, bonus: 3, targets: 9 },
});

describe('unlocked', () => {
  it('has nothing for a new player', () => {
    expect(unlocked(fresh)).toEqual([]);
  });

  it('lists what the stats reach', () => {
    expect(unlocked(after)).toEqual(['firstLevel', 'threeStars', 'extra', 'extraNoHints']);
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
