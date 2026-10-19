import type { Submission } from '../core/evaluate';
import { isLevelComplete, NEW_GAME, nextLevel, submitWord, type GameState } from '../core/game';
import type { Level } from '../core/level';

/**
 * The running game: the rules from `core` plus reactive state the UI reads.
 * Getters read `$state`, so whatever displays them re-renders when the state changes.
 */
export class Game {
  #levels: readonly Level[];
  #state = $state<GameState>(NEW_GAME);

  /** @param levels Levels in play order; must not be empty. */
  constructor(levels: readonly Level[]) {
    this.#levels = levels;
  }

  /** The level being played. */
  get level(): Level {
    return levelAt(this.#levels, this.#state.levelIndex);
  }

  /** Whether every target of the current level has been found. */
  get complete(): boolean {
    return isLevelComplete(this.level, this.#state.found);
  }

  /** The current level's number as shown to the player, starting at 1. */
  get levelNumber(): number {
    return this.#state.levelIndex + 1;
  }

  /** Points across all levels. */
  get score(): number {
    return this.#state.score;
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
    this.#state = nextLevel(this.#state, this.#levels.length);
  }
}

function levelAt(levels: readonly Level[], index: number): Level {
  const level = levels[index];
  if (!level) throw new Error(`No level at index ${index}`);
  return level;
}
