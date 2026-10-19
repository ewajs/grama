import type { Level } from './level';

/** Points per letter of a found word, by kind. Tune scoring here. */
export const POINTS_PER_LETTER = { target: 10, bonus: 2 } as const;

/** The outcome of submitting a word (docs/GAME.md › Core loop has the table). */
export type Submission =
  | { kind: 'invalid'; word: string }
  | { kind: 'repeated'; word: string }
  | { kind: 'target' | 'bonus'; word: string; points: number };

/**
 * Classifies a word the player submitted on a level.
 * @param found Words already found on this level, targets and bonus alike.
 * @param word A normalized word, as spelled on the wheel.
 */
export function evaluate(level: Level, found: readonly string[], word: string): Submission {
  if (found.includes(word)) return { kind: 'repeated', word };
  if (level.targets.includes(word)) return scored('target', word);
  if (level.bonus.includes(word)) return scored('bonus', word);
  return { kind: 'invalid', word };
}

function scored(kind: 'target' | 'bonus', word: string): Submission {
  return { kind, word, points: POINTS_PER_LETTER[kind] * word.length };
}
