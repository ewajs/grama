/**
 * The player's progress (level, score, hints, history, dailies) and the moves that change
 * it: playing a word on any level, spending a hint, moving on. Plain data, saved as JSON.
 * @module
 */

import type { Difficulty } from './cadence';
import type { Submission } from './evaluate';
import {
  BONUS_WORDS_PER_HINT,
  EXTRA_HARD_HINTS,
  hintTarget,
  revealLetter,
  STARTING_HINTS,
} from './hints';
import type { DailyPlay } from './daily';
import { record, recordOf, type History, type LevelRecord } from './history';
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
  /** Every completed level's best result. */
  history: History;
  /** The daily challenge in play, if one was started (see `core/daily`). */
  daily: DailyPlay;
  /** Completed daily challenges' best results, by date. */
  dailies: Readonly<Record<string, LevelRecord>>;
};

/** Where a level being played belongs: a numbered level, or a date's daily challenge. */
export type Place =
  | {
      kind: 'level';
      /** The level's number. */
      levelNumber: number;
      /** The difficulty it's played at; with the number, it decides the level. */
      difficulty: Difficulty;
    }
  | {
      kind: 'daily';
      /** The daily challenge's date, `YYYY-MM-DD`. */
      date: string;
    };

/** Progress at the start of a new game. */
export const NEW_PROGRESS: Progress = {
  levelNumber: 1,
  score: 0,
  hints: STARTING_HINTS,
  bonusTowardHint: 0,
  difficulty: 'normal',
  session: NEW_SESSION,
  history: {},
  daily: { date: '', session: NEW_SESSION },
  dailies: {},
};

/**
 * Plays a word on a level: the outcome, the session after it, and the player's progress
 * with what it earned: points, a step toward the next hint for a bonus word, and on
 * finishing the level its record (in the history, or the dailies), plus a hint the first
 * time an extra-hard level is finished. Unchanged objects are returned as they were.
 * @param place Which level it is, for its record.
 * @param session The level as played so far: the player's current one, a replay, a daily.
 */
export function playWord(
  progress: Progress,
  level: Level,
  place: Place,
  session: Session,
  word: string,
): { submission: Submission; progress: Progress; session: Session } {
  const { submission, session: after } = submitWord(session, level, word);
  if (submission.kind === 'invalid' || submission.kind === 'repeated') {
    return { submission, progress, session };
  }
  const scored = { ...progress, score: progress.score + submission.points };
  if (submission.kind === 'bonus') {
    return { submission, progress: countBonusWord(scored), session: after };
  }
  if (!isComplete(level, after)) return { submission, progress: scored, session: after };

  const recorded =
    place.kind === 'level'
      ? {
          ...scored,
          history: record(
            scored.history,
            place.levelNumber,
            recordOf(level, after, place.difficulty),
          ),
        }
      : {
          ...scored,
          dailies: record(scored.dailies, place.date, recordOf(level, after, 'normal')),
        };
  const firstTime =
    place.kind === 'level'
      ? !(place.levelNumber in progress.history)
      : !(place.date in progress.dailies);
  const reward = firstTime && level.tier === 'extra' ? EXTRA_HARD_HINTS : 0;
  return { submission, progress: { ...recorded, hints: recorded.hints + reward }, session: after };
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
