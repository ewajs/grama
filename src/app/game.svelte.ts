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
import { BONUS_WORDS_PER_HINT, hintTarget, revealLetter } from '../core/hints';
import { boardRows, type BoardRow } from '../core/board';
import type { Level } from '../core/level';
import type { WordList } from '../content/words';
import { reportUrl, type ReportKind } from './report';

/**
 * The running game: the rules from `core` plus reactive state the UI reads.
 * Getters read `$state`, so whatever displays them re-renders when the state changes.
 */
export class Game {
  #state: GameState;
  #onchange: (state: GameState) => void;
  #spellings: ReadonlyMap<string, string>;
  /** Words rejected on this level, most recent last; kept for reports, not saved. */
  #rejected = $state<string[]>([]);
  /** The level being played, generated once per level number. */
  readonly level: Level;

  /**
   * @param words The language's words (from `loadWords`).
   * @param state Where to start: a saved game, or a new one.
   * @param onchange Called with the new state after every change, e.g. to save it.
   */
  constructor(words: WordList, state: GameState, onchange: (state: GameState) => void = () => {}) {
    this.#state = $state(state);
    this.#onchange = onchange;
    this.#spellings = words.spellings;
    this.level = $derived(generateLevel(words.words, this.#state.levelNumber));
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

  /** The board's rows, with words as written (accents included). */
  get board(): BoardRow[] {
    return boardRows(this.level, this.#state.found, this.#state.revealed).map((row) => ({
      ...row,
      word: row.word && this.written(row.word),
    }));
  }

  /** Hints available to spend. */
  get hints(): number {
    return this.#state.hints;
  }

  /** Progress toward the next hint, from 0 to 1. */
  get hintProgress(): number {
    return this.#state.bonusTowardHint / BONUS_WORDS_PER_HINT;
  }

  /** Bonus words still to find for the next hint. */
  get bonusUntilHint(): number {
    return BONUS_WORDS_PER_HINT - this.#state.bonusTowardHint;
  }

  /** Whether a hint can be spent now: one is available and a letter is left to reveal. */
  get canHint(): boolean {
    const { hints, found, revealed } = this.#state;
    return hints > 0 && hintTarget(this.level, found, revealed) !== null;
  }

  /** Bonus words found on the current level, as written, in the order found. */
  get bonusWords(): string[] {
    return this.#state.found
      .filter((word) => !this.level.targets.includes(word))
      .map((word) => this.written(word));
  }

  /** How many bonus words the current level has. */
  get bonusTotal(): number {
    return this.level.bonus.length;
  }

  /** Words found on the current level, in the order found. */
  get found(): readonly string[] {
    return this.#state.found;
  }

  /** How a word is written, with its accents: `TENES` → `TENÉS`. */
  written(word: string): string {
    return this.#spellings.get(word) ?? word;
  }

  /** Submits a word spelled on the wheel and returns how it went. */
  submit(word: string): Submission {
    const { submission, state } = submitWord(this.#state, this.level, word);
    if (submission.kind === 'invalid') {
      this.#rejected = [...this.#rejected.filter((other) => other !== word), word].slice(-10);
    }
    this.#update(state);
    return submission;
  }

  /** Spends a hint to reveal a letter on the board. */
  hint(): void {
    this.#update(revealLetter(this.#state, this.level));
  }

  /** Starts over from level 1, as a new game. */
  reset(): void {
    this.#rejected = [];
    this.#update(NEW_GAME);
  }

  /** Moves on to the next level. */
  next(): void {
    this.#rejected = [];
    this.#update(nextLevel(this.#state));
  }

  /** A link to report a problem with the current level on GitHub. */
  reportUrl(kind: ReportKind): string {
    return reportUrl(kind, {
      levelNumber: this.#state.levelNumber,
      letters: this.level.letters,
      targets: this.level.targets.map((word) => this.written(word)),
      found: this.#state.found.map((word) => this.written(word)),
      rejected: this.#rejected,
      build: __BUILD__,
    });
  }

  #update(state: GameState) {
    if (state === this.#state) return;
    this.#state = state;
    this.#onchange(state);
  }
}
