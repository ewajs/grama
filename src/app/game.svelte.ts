import type { Submission } from '../core/evaluate';
import {
  isLevelComplete,
  levelPoints,
  NEW_GAME,
  nextLevel,
  submitWord,
  type GameState,
} from '../core/game';
import { generateLevel } from '../core/generate';
import type { Level } from '../core/level';

/**
 * The running game: the rules from `core` plus reactive state the UI reads.
 * Getters read `$state`, so whatever displays them re-renders when the state changes.
 */
export class Game {
  #state: GameState;
  /** The level being played, generated once per level number. */
  readonly level: Level;

  /**
   * @param words Every valid word, most common first (from `loadWords`).
   * @param levelNumber Level to start on.
   */
  constructor(words: readonly string[], levelNumber = 1) {
    this.#state = $state({ ...NEW_GAME, levelNumber });
    this.level = $derived(generateLevel(words, this.#state.levelNumber));
  }

  /** The current level's number, starting at 1. */
  get levelNumber(): number {
    return this.#state.levelNumber;
  }

  /** Whether every target of the current level has been found. */
  get complete(): boolean {
    return isLevelComplete(this.level, this.#state.found);
  }

  /** Points across all levels. */
  get score(): number {
    return this.#state.score;
  }

  /** Points won on the current level so far. */
  get levelPoints(): number {
    return levelPoints(this.level, this.#state.found);
  }

  /** How many bonus words have been found on the current level. */
  get bonusFound(): number {
    return this.#state.found.filter((word) => !this.level.targets.includes(word)).length;
  }

  /** Words found on the current level, in the order found. */
  get found(): readonly string[] {
    return this.#state.found;
  }

  /** Submits a word spelled on the wheel and returns how it went. */
  submit(word: string): Submission {
    const { submission, state } = submitWord(this.#state, this.level, word);
    this.#state = state;
    return submission;
  }

  /** Moves on to the next level. */
  next(): void {
    this.#state = nextLevel(this.#state);
  }
}
