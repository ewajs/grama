/**
 * Judging a submitted word: invalid, repeated, bonus or target, with its points.
 * @module
 */

import type { Tier } from './difficulty';
import type { Level } from './level';

/** Points per letter of a found word, by kind. Tune scoring here. */
export const POINTS_PER_LETTER = { target: 10, bonus: 2 } as const;

/** Harder levels score more: points are multiplied by their tier's factor. */
export const TIER_MULTIPLIER: Readonly<Record<Tier, number>> = {
  easy: 1,
  medium: 1,
  hard: 1.5,
  extra: 2,
};

/** The outcome of submitting a word (docs/GAME.md › Core loop has the table). */
export type Submission =
  | {
      /** Not a word of the level. */
      kind: 'invalid';
      /** The word as submitted (normalized). */
      word: string;
    }
  | {
      /** Found already on this level. */
      kind: 'repeated';
      /** The word as submitted (normalized). */
      word: string;
    }
  | {
      /** One of the level's targets, or another valid word. */
      kind: 'target' | 'bonus';
      /** The word as submitted (normalized). */
      word: string;
      /** Points it scored, tier multiplier included. */
      points: number;
    };

/**
 * Classifies a word the player submitted on a level.
 * @param found Words already found on this level, targets and bonus alike.
 * @param word A normalized word, as spelled on the wheel.
 */
export function evaluate(level: Level, found: readonly string[], word: string): Submission {
  if (found.includes(word)) return { kind: 'repeated', word };
  if (level.targets.includes(word)) return scored('target', word, level.tier);
  if (level.bonus.includes(word)) return scored('bonus', word, level.tier);
  return { kind: 'invalid', word };
}

function scored(kind: 'target' | 'bonus', word: string, tier: Tier): Submission {
  const points = Math.round(POINTS_PER_LETTER[kind] * word.length * TIER_MULTIPLIER[tier]);
  return { kind, word, points };
}
