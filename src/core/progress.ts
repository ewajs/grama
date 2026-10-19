import type { Difficulty } from './cadence';
import type { Submission } from './evaluate';
import {
  BONUS_WORDS_PER_HINT,
  EXTRA_HARD_HINTS,
  hintTarget,
  revealLetter,
  STARTING_HINTS,
} from './hints';
import type { Level } from './level';
import { isComplete, NEW_SESSION, submitWord, type Session } from './session';

/** The player's progress. Plain data, so it can be saved as JSON. */
export type Progress = {
  /** The player's current level, starting at 1. Levels never run out. */
  levelNumber: number;
  /** Points across all levels. */
  score: number;
  /** Hints available to spend, on any level. */
  hints: number;
  /** Bonus words found toward the next hint (see `core/hints`). */
  bonusTowardHint: number;
  /** The player's difficulty when the current level began; it decides its tier. */
  difficulty: Difficulty;
  /** The current level as played so far. */
  session: Session;
};

/** Progress at the start of a new game. */
export const NEW_PROGRESS: Progress = {
  levelNumber: 1,
  score: 0,
  hints: STARTING_HINTS,
  bonusTowardHint: 0,
  difficulty: 'normal',
  session: NEW_SESSION,
};

/**
 * Plays a word on a level: the outcome, the session after it, and the player's progress
 * with what it earned: points, a step toward the next hint for a bonus word, and a hint
 * for finishing an extra-hard level. Unchanged objects are returned as they were.
 * @param session The level as played so far: the player's current one, or any other.
 */
export function playWord(
  progress: Progress,
  level: Level,
  session: Session,
  word: string,
): { submission: Submission; progress: Progress; session: Session } {
  const played = submitWord(session, level, word);
  const { submission } = played;
  if (submission.kind === 'invalid' || submission.kind === 'repeated') {
    return { submission, progress, session };
  }
  const scored = { ...progress, score: progress.score + submission.points };
  if (submission.kind === 'bonus') {
    return { submission, progress: countBonusWord(scored), session: played.session };
  }
  const earned = level.tier === 'extra' && isComplete(level, played.session);
  return {
    submission,
    progress: earned ? { ...scored, hints: scored.hints + EXTRA_HARD_HINTS } : scored,
    session: played.session,
  };
}

/** A step toward the next hint, or a hint earned. */
function countBonusWord(progress: Progress): Progress {
  const toward = progress.bonusTowardHint + 1;
  return toward < BONUS_WORDS_PER_HINT
    ? { ...progress, bonusTowardHint: toward }
    : { ...progress, bonusTowardHint: 0, hints: progress.hints + 1 };
}

/** Whether a hint can be spent on a level now: one is left and a letter can be revealed. */
export function canUseHint(progress: Progress, level: Level, session: Session): boolean {
  return progress.hints > 0 && hintTarget(level, session) !== null;
}

/**
 * Spends one of the player's hints to reveal a letter on a level (see `hintTarget`).
 * @returns Both unchanged when no hint can be spent.
 */
export function useHint(
  progress: Progress,
  level: Level,
  session: Session,
): { progress: Progress; session: Session } {
  if (!canUseHint(progress, level, session)) return { progress, session };
  return {
    progress: { ...progress, hints: progress.hints - 1 },
    session: revealLetter(session, level),
  };
}

/**
 * Moves on to the next level, keeping the score and hints.
 * @param difficulty The player's difficulty for the new level (it may have changed).
 */
export function nextLevel(progress: Progress, difficulty = progress.difficulty): Progress {
  return {
    ...progress,
    levelNumber: progress.levelNumber + 1,
    difficulty,
    session: NEW_SESSION,
  };
}
