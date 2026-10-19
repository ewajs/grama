import { evaluate, type Submission } from './evaluate';
import { countBonusWord, STARTING_HINTS } from './hints';
import type { Level } from './level';

/** Everything that changes while playing. Plain data, so it can be saved as JSON. */
export type GameState = {
  /** The level being played, starting at 1. Levels never run out. */
  levelNumber: number;
  /** Points across all levels. */
  score: number;
  /** Words found on the current level, targets and bonus, in the order found. */
  found: readonly string[];
  /** Hints available to spend, on any level. */
  hints: number;
  /** Bonus words found toward the next hint (see `core/hints`). */
  bonusTowardHint: number;
  /** Letters revealed by hints on the current level, by target. */
  revealed: Readonly<Record<string, number>>;
};

/** State at the start of a new game. */
export const NEW_GAME: GameState = {
  levelNumber: 1,
  score: 0,
  found: [],
  hints: STARTING_HINTS,
  bonusTowardHint: 0,
  revealed: {},
};

/**
 * Submits a word on the current level.
 * @returns The outcome, and the state after it (the same object when nothing changed).
 */
export function submitWord(
  state: GameState,
  level: Level,
  word: string,
): { submission: Submission; state: GameState } {
  const submission = evaluate(level, state.found, word);
  if (submission.kind === 'invalid' || submission.kind === 'repeated') {
    return { submission, state };
  }
  const scored = {
    ...state,
    score: state.score + submission.points,
    found: [...state.found, word],
  };
  return { submission, state: submission.kind === 'bonus' ? countBonusWord(scored) : scored };
}

/** Whether every target of the level has been found. Bonus words don't count. */
export function isLevelComplete(level: Level, found: readonly string[]): boolean {
  return level.targets.every((target) => found.includes(target));
}

/** Points won on a level so far: the sum over every word found on it. */
export function levelPoints(level: Level, found: readonly string[]): number {
  return found.reduce((sum, word) => {
    const submission = evaluate(level, [], word);
    return submission.kind === 'target' || submission.kind === 'bonus'
      ? sum + submission.points
      : sum;
  }, 0);
}

/** Moves on to the next level, keeping the score and hints. */
export function nextLevel(state: GameState): GameState {
  return { ...state, levelNumber: state.levelNumber + 1, found: [], revealed: {} };
}
