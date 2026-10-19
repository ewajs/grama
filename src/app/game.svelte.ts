import { boardRows, type BoardRow } from '../core/board';
import { occurrence, tierFor, type Difficulty } from '../core/cadence';
import type { Tier } from '../core/difficulty';
import type { Submission } from '../core/evaluate';
import { generateLevel } from '../core/generate';
import { BONUS_WORDS_PER_HINT } from '../core/hints';
import type { History, Stars } from '../core/history';
import type { Level } from '../core/level';
import {
  canUseHint,
  NEW_PROGRESS,
  nextLevel,
  playWord,
  useHint,
  type Progress,
} from '../core/progress';
import { starsFor } from '../core/history';
import { statsOf, type Stats } from '../core/stats';
import { unlocked, type AchievementId } from '../core/achievements';
import { bonusWords, isComplete, NEW_SESSION, sessionPoints, type Session } from '../core/session';
import type { WordList } from '../content/words';
import { reportUrl, type ReportKind } from './report';

/**
 * The running game: the rules from `core` plus reactive state the UI reads.
 * Getters read `$state`, so whatever displays them re-renders when the state changes.
 */
export class Game {
  #progress: Progress;
  #onchange: (progress: Progress) => void;
  #spellings: ReadonlyMap<string, string>;
  /** Words rejected on this level, most recent last; kept for reports, not saved. */
  #rejected = $state<string[]>([]);
  /** A completed level being played again, if any; not saved. */
  #replay = $state<{ levelNumber: number; difficulty: Difficulty; session: Session } | null>(null);
  /** The level being played, generated once per level number. */
  readonly level: Level;

  /**
   * @param words The language's words (from `loadWords`).
   * @param progress Where to start: a saved game, or a new one.
   * @param onchange Called with the new progress after every change, e.g. to save it.
   */
  constructor(
    words: WordList,
    progress: Progress,
    onchange: (progress: Progress) => void = () => {},
  ) {
    this.#progress = $state(progress);
    this.#onchange = onchange;
    this.#spellings = words.spellings;
    // Progress is replaced on every word, which re-runs this. Returning the same Level
    // object until the level actually changes matters: Svelte only updates what depends
    // on a derived when its value changes (===), so the wheel keeps a shuffled order.
    let current: { key: string; level: Level } | null = null;
    this.level = $derived.by(() => {
      const { levelNumber, difficulty } = this.#playing;
      const key = `${levelNumber}:${difficulty}`;
      if (current?.key !== key) {
        const tier = tierFor(levelNumber, difficulty);
        const occurs = occurrence(levelNumber, difficulty);
        current = { key, level: generateLevel(words.words, levelNumber, tier, occurs) };
      }
      return current.level;
    });
  }

  /** The level on screen: a replay, or else the player's current one. */
  get #playing(): { levelNumber: number; difficulty: Difficulty; session: Session } {
    return this.#replay ?? this.#progress;
  }

  /** The number of the level on screen, starting at 1. */
  get levelNumber(): number {
    return this.#playing.levelNumber;
  }

  /** The player's current level: the furthest reached. */
  get currentLevel(): number {
    return this.#progress.levelNumber;
  }

  /** Whether the level on screen is a replay of an earlier one. */
  get replaying(): boolean {
    return this.#replay !== null;
  }

  /** Every completed level's best result. */
  get history(): History {
    return this.#progress.history;
  }

  /** The player's totals, from the history. */
  get stats(): Stats {
    return statsOf(this.#progress.history);
  }

  /** The achievements the player has reached. */
  get achievements(): AchievementId[] {
    return unlocked(this.stats);
  }

  /** How hard the current level is. */
  get tier(): Tier {
    return this.level.tier;
  }

  /** Whether every target of the current level has been found. */
  get complete(): boolean {
    return isComplete(this.level, this.#playing.session);
  }

  /** Stars the current level earns as played so far (final once complete). */
  get stars(): Stars {
    return starsFor(this.level, this.#playing.session);
  }

  /** Points across all levels. */
  get score(): number {
    return this.#progress.score;
  }

  /** Points won on the current level so far. */
  get levelPoints(): number {
    return sessionPoints(this.level, this.#playing.session);
  }

  /** The board's rows, with words as written (accents included). */
  get board(): BoardRow[] {
    return boardRows(this.level, this.#playing.session).map((row) => ({
      ...row,
      word: row.word && this.written(row.word),
    }));
  }

  /** Hints available to spend. */
  get hints(): number {
    return this.#progress.hints;
  }

  /** Progress toward the next hint, from 0 to 1. */
  get hintProgress(): number {
    return this.#progress.bonusTowardHint / BONUS_WORDS_PER_HINT;
  }

  /** Bonus words still to find for the next hint. */
  get bonusUntilHint(): number {
    return BONUS_WORDS_PER_HINT - this.#progress.bonusTowardHint;
  }

  /** Whether a hint can be spent now: one is available and a letter is left to reveal. */
  get canHint(): boolean {
    return canUseHint(this.#progress, this.level, this.#playing.session);
  }

  /** Bonus words found on the current level, as written, in the order found. */
  get bonusWords(): string[] {
    return bonusWords(this.level, this.#playing.session).map((word) => this.written(word));
  }

  /** How many bonus words have been found on the current level. */
  get bonusFound(): number {
    return bonusWords(this.level, this.#playing.session).length;
  }

  /** How many bonus words the current level has. */
  get bonusTotal(): number {
    return this.level.bonus.length;
  }

  /** How a word is written, with its accents: `TENES` → `TENÉS`. */
  written(word: string): string {
    return this.#spellings.get(word) ?? word;
  }

  /** Submits a word spelled on the wheel and returns how it went. */
  submit(word: string): Submission {
    const { levelNumber, difficulty, session } = this.#playing;
    const place = { kind: 'level', levelNumber, difficulty } as const;
    const played = playWord(this.#progress, this.level, place, session, word);
    if (played.submission.kind === 'invalid') {
      this.#rejected = [...this.#rejected.filter((other) => other !== word), word].slice(-10);
    }
    if (played.session !== session) this.#apply(played.progress, played.session);
    return played.submission;
  }

  /** Spends a hint to reveal a letter on the board. */
  hint(): void {
    const { session } = this.#playing;
    const used = useHint(this.#progress, this.level, session);
    if (used.session !== session) this.#apply(used.progress, used.session);
  }

  /** Starts over from level 1, as a new game at the given difficulty. */
  reset(difficulty: Difficulty): void {
    this.#rejected = [];
    this.#replay = null;
    this.#update({ ...NEW_PROGRESS, difficulty });
  }

  /**
   * Plays an earlier level again, as it was generated (for better stars). It shares the
   * player's score, hints and history, but never changes their current level.
   */
  replay(levelNumber: number): void {
    if (levelNumber >= this.#progress.levelNumber) return this.endReplay();
    const difficulty = this.#progress.history[levelNumber]?.difficulty ?? this.#progress.difficulty;
    this.#rejected = [];
    this.#replay = { levelNumber, difficulty, session: NEW_SESSION };
  }

  /** Back to the player's current level. */
  endReplay(): void {
    if (this.#replay) this.#rejected = [];
    this.#replay = null;
  }

  /** Moves on to the next level, at the player's current difficulty. */
  next(difficulty: Difficulty): void {
    this.#rejected = [];
    this.#update(nextLevel(this.#progress, difficulty));
  }

  /** A link to report a problem with the current level on GitHub. */
  reportUrl(kind: ReportKind): string {
    return reportUrl(kind, {
      levelNumber: this.levelNumber,
      letters: this.level.letters,
      targets: this.level.targets.map((word) => this.written(word)),
      found: this.#playing.session.found.map((word) => this.written(word)),
      rejected: this.#rejected,
      build: __BUILD__,
    });
  }

  /** Applies a played word or hint: the session goes to the replay or the current level. */
  #apply(progress: Progress, session: Session) {
    if (this.#replay) {
      this.#replay = { ...this.#replay, session };
      this.#update(progress);
    } else {
      this.#update({ ...progress, session });
    }
  }

  #update(progress: Progress) {
    this.#progress = progress;
    this.#onchange(progress);
  }
}
