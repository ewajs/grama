/**
 * One level in play: the words found and the letters revealed, what it has paid, and
 * what follows from them (complete? bonus words?). Main levels, replays and dailies all
 * use it.
 * @module
 */

import { evaluate, type Submission } from './evaluate';
import type { Level } from './level';

/** One level in play: the words found on it, the letters hints revealed, what it paid. */
export type Session = {
  /** Words found, targets and bonus, in the order found. */
  found: readonly string[];
  /** Letters revealed by hints, by target. */
  revealed: Readonly<Record<string, number>>;
  /** Points it has paid; a replay pays none (see `playWord`). */
  points: number;
  /** Hints its completion earned: an extra-hard level's, the first time. */
  hintsWon: number;
};

/** A level not played yet. */
export const NEW_SESSION: Session = { found: [], revealed: {}, points: 0, hintsWon: 0 };

/**
 * Submits a word on a level.
 * @returns The outcome, and the session after it (the same object when nothing changed).
 */
export function submitWord(
  session: Session,
  level: Level,
  word: string,
): { submission: Submission; session: Session } {
  const submission = evaluate(level, session.found, word);
  if (submission.kind === 'invalid' || submission.kind === 'repeated') {
    return { submission, session };
  }
  return { submission, session: { ...session, found: [...session.found, word] } };
}

/** Whether every target of the level has been found. Bonus words don't count. */
export function isComplete(level: Level, session: Session): boolean {
  return level.targets.every((target) => session.found.includes(target));
}

/** Bonus words found on the level, in the order found. */
export function bonusWords(level: Level, session: Session): string[] {
  return session.found.filter((word) => !level.targets.includes(word));
}

/** How many hints were spent on the level: one per revealed letter. */
export function hintsUsed(session: Session): number {
  return Object.values(session.revealed).reduce((sum, letters) => sum + letters, 0);
}
