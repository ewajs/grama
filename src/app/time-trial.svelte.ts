/**
 * A Contrarreloj run as reactive state for the screen: {@link app/time-trial.svelte!Trial | Trial}
 * wraps `core/time-trial`, picks each run's random seed and keeps the wheel on.
 * @module
 */

import { boardRows, type BoardRow } from '../core/board';
import type { Submission } from '../core/evaluate';
import type { Level } from '../core/level';
import {
  canPass,
  isOver,
  newRun,
  pass,
  playTrialWord,
  tick,
  wheelOf,
  type Run,
  type RunResult,
} from '../core/time-trial';
import type { WordList } from '../content/words';

/** A Contrarreloj run on screen. Getters read `$state`, so the screen follows along. */
export class Trial {
  #words: WordList;
  #random: () => number;
  #run: Run;
  /** The wheel on, generated once per wheel. */
  readonly level: Level;

  /**
   * @param words The language's words.
   * @param random Picks each run's seed; `Math.random` unless a test passes another.
   */
  constructor(words: WordList, random: () => number = Math.random) {
    this.#words = words;
    this.#random = random;
    this.#run = $state(newRun(this.#seed()));
    // Same idea as Game.level: the same Level object until the wheel changes, so the
    // letters keep a shuffled order while the player finds words.
    let current: { key: string; level: Level } | null = null;
    this.level = $derived.by(() => {
      const run = this.#run;
      const key = `${run.seed}:${run.wheel}`;
      if (current?.key !== key) current = { key, level: wheelOf(words.words, run) };
      return current.level;
    });
  }

  /** Milliseconds left. */
  get timeLeft(): number {
    return this.#run.timeLeft;
  }

  /** Whether the time is up. */
  get over(): boolean {
    return isOver(this.#run);
  }

  /** Points won in this run. */
  get points(): number {
    return this.#run.points;
  }

  /** Which wheel is on, from 1. */
  get wheelNumber(): number {
    return this.#run.wheel + 1;
  }

  /** How the run went: what's kept for the best score and the history. */
  get result(): RunResult {
    const { points, cleared, words } = this.#run;
    return { points, cleared, words };
  }

  /** The board's rows, with words as written (accents included). */
  get board(): BoardRow[] {
    return boardRows(this.level, this.#run.session).map((row) => ({
      ...row,
      word: row.word && this.written(row.word),
    }));
  }

  /** Whether _Pasar_ can be used now. */
  get canPass(): boolean {
    return canPass(this.#run);
  }

  /** How a word is written, with its accents. */
  written(word: string): string {
    return this.#words.spellings.get(word) ?? word;
  }

  /** Lets `elapsed` milliseconds of play pass. */
  elapse(elapsed: number): void {
    if (!this.over) this.#run = tick(this.#run, elapsed);
  }

  /** Submits a word spelled on the wheel and returns how it went. */
  submit(word: string): Submission {
    const played = playTrialWord(this.#run, this.level, word);
    this.#run = played.run;
    return played.submission;
  }

  /** _Pasar_: a new wheel, for some time. */
  pass(): void {
    this.#run = pass(this.#run);
  }

  /** Starts a new run, with new wheels. */
  restart(): void {
    this.#run = newRun(this.#seed());
  }

  #seed(): number {
    return Math.floor(this.#random() * 2 ** 31);
  }
}
