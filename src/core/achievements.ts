/**
 * The achievements: each one a stat reaching a goal.
 * @module
 */

import type { Stats } from './stats';

/** Something to unlock: reached when a stat gets to `goal`. */
export type Achievement = {
  /** Stable name, also the key of its title and description in the UI strings. */
  id: AchievementId;
  /** The value to reach. */
  goal: number;
  /** Where the player stands toward the goal. */
  value: (stats: Stats) => number;
};

/** Every achievement's id. */
export type AchievementId =
  | 'firstLevel'
  | 'levels10'
  | 'levels50'
  | 'levels100'
  | 'threeStars'
  | 'threeStars10'
  | 'stars100'
  | 'extra'
  | 'extra10'
  | 'extraNoHints'
  | 'noHints10'
  | 'words100'
  | 'words1000'
  | 'bonus50'
  | 'bonus500'
  | 'daily'
  | 'streak3'
  | 'streak7'
  | 'streak30'
  | 'trial'
  | 'trialPoints'
  | 'trialWheels';

/** All achievements, roughly from first to last earned. */
export const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'firstLevel', goal: 1, value: (stats) => stats.levels },
  { id: 'daily', goal: 1, value: (stats) => stats.dailies },
  { id: 'levels10', goal: 10, value: (stats) => stats.levels },
  { id: 'streak3', goal: 3, value: (stats) => stats.bestStreak },
  { id: 'trial', goal: 1, value: (stats) => stats.trialRuns },
  { id: 'threeStars', goal: 1, value: (stats) => stats.threeStars },
  { id: 'words100', goal: 100, value: (stats) => stats.words },
  { id: 'extra', goal: 1, value: (stats) => stats.byTier.extra },
  { id: 'noHints10', goal: 10, value: (stats) => stats.noHints },
  { id: 'bonus50', goal: 50, value: (stats) => stats.bonus },
  { id: 'levels50', goal: 50, value: (stats) => stats.levels },
  { id: 'trialPoints', goal: 500, value: (stats) => stats.trialPoints },
  { id: 'extraNoHints', goal: 1, value: (stats) => stats.extraNoHints },
  { id: 'threeStars10', goal: 10, value: (stats) => stats.threeStars },
  { id: 'stars100', goal: 100, value: (stats) => stats.stars },
  { id: 'streak7', goal: 7, value: (stats) => stats.bestStreak },
  { id: 'extra10', goal: 10, value: (stats) => stats.byTier.extra },
  { id: 'levels100', goal: 100, value: (stats) => stats.levels },
  { id: 'trialWheels', goal: 10, value: (stats) => stats.trialWheels },
  { id: 'words1000', goal: 1000, value: (stats) => stats.words },
  { id: 'bonus500', goal: 500, value: (stats) => stats.bonus },
  { id: 'streak30', goal: 30, value: (stats) => stats.bestStreak },
];

/** The ids of the achievements reached with these stats, in {@link ACHIEVEMENTS} order. */
export function unlocked(stats: Stats): AchievementId[] {
  return ACHIEVEMENTS.filter(({ goal, value }) => value(stats) >= goal).map(({ id }) => id);
}

/** How far along an achievement is, from 0 to 1. */
export function achievementProgress({ goal, value }: Achievement, stats: Stats): number {
  return Math.min(value(stats) / goal, 1);
}
