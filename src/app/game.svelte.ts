/**
 * The running game: {@link app/game.svelte!Game | Game} wraps the pure rules in reactive state
 * for the UI, and knows what's on screen (the current level, a replay or a daily).
 * @module
 */

import { unlocked, type AchievementId } from '../core/achievements';
import { boardRows, type BoardRow } from '../core/board';
import { occurrence, tierFor, type Difficulty } from '../core/cadence';
import { dailyFor, dailyNumber, dailyTier, generateDaily, streak } from '../core/daily';
import type { Tier } from '../core/difficulty';
import type { Submission } from '../core/evaluate';
import { generateLevel } from '../core/generate';
import { BONUS_WORDS_PER_HINT } from '../core/hints';
import { starsFor, type History, type LevelRecord, type Stars } from '../core/history';
import type { Level } from '../core/level';
import {
  canUseHint,
  currentPlace,
  NEW_PROGRESS,
  nextLevel,
  playWord,
  useHint,
  type Place,
  type Progress,
} from '../core/progress';
import { bonusWords, hintsUsed, isComplete, NEW_SESSION, type Session } from '../core/session';
import { statsOf, type Stats } from '../core/stats';
import type { WordList } from '../content/words';
import { today } from './clock';
import { reportUrl, type ReportKind } from './report';

/** A numbered level's place. */
type LevelPlace = Extract<Place, { kind: 'level' }>;

/** What's being played: the player's current level, a replay of an earlier one, or a daily. */
type Mode =
  | { kind: 'current' }
  | { kind: 'replay'; place: LevelPlace; session: Session }
  | { kind: 'daily'; date: string };

/** A day's daily challenge, as the home screen shows it and the share text tells it. */
export type DailySummary = {
  /** The daily's number: 1 for the first one. */
  number: number;
  /** Its date, `YYYY-MM-DD`. */
  date: string;
  /** How hard it is (it depends on the weekday). */
  tier: Tier;
  /** Its best result, once completed. */
  result: LevelRecord | undefined;
  /** Consecutive days completed up to it, still alive through the day before. */
  streak: number;
};

/**
 * The running game: the rules from `core` plus reactive state the UI reads.
 * Getters read `$state`, so whatever displays them re-renders when the state changes.
 */
export class Game {
  #progress: Progress;
  #onchange: (progress: Progress) => void;
  #words = $state<WordList | null>(null);
  #clock: () => string;
  /** Today's date, read from the clock when the game starts and on {@link refreshDate}. */
  #today: string;
  #mode = $state<Mode>({ kind: 'current' });
  /** Words rejected on this level, most recent last; kept for reports, not saved. */
  #rejected = $state<string[]>([]);
  /** The level being played, generated once per level (or date). */
  readonly level: Level;

  /**
   * The game starts without its words, so the home screen can show at once; the level on
   * screen needs them (see {@link ready}).
   * @param progress Where to start: a saved game, or a new one.
   * @param onchange Called with the new progress after every change, e.g. to save it.
   * @param clock Today's date as `YYYY-MM-DD`; the device's clock unless a test passes one.
   */
  constructor(
    progress: Progress,
    onchange: (progress: Progress) => void = () => {},
    clock: () => string = today,
  ) {
    this.#progress = $state(progress);
    this.#onchange = onchange;
    this.#clock = clock;
    this.#today = $state(clock());
    // Progress is replaced on every word, which re-runs this. Returning the same Level
    // object until the level actually changes matters: Svelte only updates what depends
    // on a derived when its value changes (===), so the wheel keeps a shuffled order.
    let current: { key: string; level: Level } | null = null;
    this.level = $derived.by(() => {
      const words = this.#words;
      if (!words) throw new Error('The level needs the words: check `ready` first');
      const { place } = this.#playing;
      const key =
        place.kind === 'daily'
          ? place.date
          : `${place.levelNumber}:${place.difficulty}:${place.occurrence}`;
      if (current?.key !== key) current = { key, level: generate(words.words, place) };
      return current.level;
    });
  }

  /** What's on screen: where it belongs and how far along it is. */
  get #playing(): { place: Place; session: Session } {
    const mode = this.#mode;
    const progress = this.#progress;
    if (mode.kind === 'daily') {
      return {
        place: { kind: 'daily', date: mode.date },
        session: dailyFor(progress.daily, mode.date).session,
      };
    }
    return mode.kind === 'replay'
      ? mode
      : { place: currentPlace(progress), session: progress.session };
  }

  /** The player's current level's tier, whatever is on screen. */
  get currentTier(): Tier {
    return tierFor(this.#progress.levelNumber, this.#progress.difficulty);
  }

  /** The number of the level on screen; for a daily challenge, the daily's number. */
  get levelNumber(): number {
    const { place } = this.#playing;
    return place.kind === 'daily' ? dailyNumber(place.date) : place.levelNumber;
  }

  /** Whether the words have loaded, so the level on screen can be played. */
  get ready(): boolean {
    return this.#words !== null;
  }

  /** Gives the game its words, once loaded (from `loadWords`). */
  set words(words: WordList) {
    this.#words = words;
  }

  /** The player's current level: the furthest reached. */
  get currentLevel(): number {
    return this.#progress.levelNumber;
  }

  /** Whether the level on screen is a replay of an earlier one. */
  get replaying(): boolean {
    return this.#mode.kind === 'replay';
  }

  /** Whether the level on screen is a daily challenge. */
  get daily(): boolean {
    return this.#mode.kind === 'daily';
  }

  /** Today's daily challenge: its number, tier, result and the streak. */
  get today(): DailySummary {
    return this.#dailySummary(this.#today);
  }

  /** The daily challenge on screen (maybe yesterday's, if played past midnight), or `null`. */
  get dailyOnScreen(): DailySummary | null {
    return this.#mode.kind === 'daily' ? this.#dailySummary(this.#mode.date) : null;
  }

  /** Reads the clock again: after the app comes back, it may be another day. */
  refreshDate(): void {
    this.#today = this.#clock();
  }

  /** Every completed level's best result. */
  get history(): History {
    return this.#progress.history;
  }

  /** The player's totals, from the history, the daily challenges and the hints spent. */
  get stats(): Stats {
    return statsOf(this.#progress);
  }

  /** The achievements the player has reached. */
  get achievements(): AchievementId[] {
    return unlocked(this.stats);
  }

  /** How hard the level on screen is. */
  get tier(): Tier {
    return this.level.tier;
  }

  /** Whether every target of the level on screen has been found. */
  get complete(): boolean {
    return isComplete(this.level, this.#playing.session);
  }

  /** Stars the level on screen earns as played so far (final once complete). */
  get stars(): Stars {
    return starsFor(this.level, this.#playing.session);
  }

  /** Hints spent on the level on screen. */
  get hintsUsed(): number {
    return hintsUsed(this.#playing.session);
  }

  /** Points across all levels. */
  get score(): number {
    return this.#progress.score;
  }

  /** Points the level on screen has paid so far (none on a replay). */
  get levelPoints(): number {
    return this.#playing.session.points;
  }

  /** Hints finishing the level on screen earned (an extra-hard level, the first time). */
  get hintsWon(): number {
    return this.#playing.session.hintsWon;
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

  /** Bonus words found on the level on screen, as written, in the order found. */
  get bonusWords(): string[] {
    return bonusWords(this.level, this.#playing.session).map((word) => this.written(word));
  }

  /** The targets of the level on screen, as written, in board order (shortest first). */
  get targetWords(): string[] {
    return this.level.targets
      .toSorted((a, b) => a.length - b.length)
      .map((word) => this.written(word));
  }

  /** How many bonus words have been found on the level on screen. */
  get bonusFound(): number {
    return bonusWords(this.level, this.#playing.session).length;
  }

  /** How many bonus words the level on screen has. */
  get bonusTotal(): number {
    return this.level.bonus.length;
  }

  /** How a word is written, with its accents: `TENES` → `TENÉS`. */
  written(word: string): string {
    return this.#words?.spellings.get(word) ?? word;
  }

  /** Submits a word spelled on the wheel and returns how it went. */
  submit(word: string): Submission {
    const { place, session } = this.#playing;
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

  /** Back to the player's current level (from a replay or a daily). */
  playCurrent(): void {
    if (this.#mode.kind !== 'current') this.#rejected = [];
    this.#mode = { kind: 'current' };
  }

  /**
   * Plays an earlier level again, as it was generated (for better stars). It shares the
   * player's score, hints and history, but never changes their current level.
   */
  replay(levelNumber: number): void {
    if (levelNumber >= this.#progress.levelNumber) return this.playCurrent();
    // Without a record (levels skipped with ?nivel=N), as if played at today's difficulty.
    const { difficulty, occurrence: block } = this.#progress.history[levelNumber] ?? {
      difficulty: this.#progress.difficulty,
      occurrence: occurrence(levelNumber, this.#progress.difficulty),
    };
    this.#rejected = [];
    this.#mode = {
      kind: 'replay',
      place: { kind: 'level', levelNumber, difficulty, occurrence: block },
      session: NEW_SESSION,
    };
  }

  /** Plays today's daily challenge, picking up where it was left. */
  playDaily(): void {
    this.#rejected = [];
    this.#mode = { kind: 'daily', date: this.#today };
  }

  /** Starts over from level 1, as a new game at the given difficulty. */
  reset(difficulty: Difficulty): void {
    this.#rejected = [];
    this.#mode = { kind: 'current' };
    this.#update({ ...NEW_PROGRESS, difficulty });
  }

  /** Moves on to the next level, at the player's current difficulty. */
  next(difficulty: Difficulty): void {
    this.#rejected = [];
    this.#update(nextLevel(this.#progress, difficulty));
  }

  /** A link to report a problem with the level on screen on GitHub. */
  reportUrl(kind: ReportKind): string {
    return reportUrl(kind, {
      place: this.#playing.place,
      tier: this.level.tier,
      letters: this.level.letters,
      targets: this.level.targets.map((word) => this.written(word)),
      found: this.#playing.session.found.map((word) => this.written(word)),
      rejected: this.#rejected,
      build: __BUILD__,
    });
  }

  #dailySummary(date: string): DailySummary {
    return {
      number: dailyNumber(date),
      date,
      tier: dailyTier(date),
      result: this.#progress.dailies[date],
      streak: streak(this.#progress.dailies, date),
    };
  }

  /** Applies a played word or hint: the session goes where the level on screen belongs. */
  #apply(progress: Progress, session: Session) {
    const mode = this.#mode;
    if (mode.kind === 'replay') {
      this.#mode = { ...mode, session };
      this.#update(progress);
    } else if (mode.kind === 'daily') {
      this.#update({ ...progress, daily: { date: mode.date, session } });
    } else {
      this.#update({ ...progress, session });
    }
  }

  #update(progress: Progress) {
    this.#progress = progress;
    this.#onchange(progress);
  }
}

/** Generates the level at a place: a numbered level at its tier, or a date's daily. */
function generate(words: readonly string[], place: Place): Level {
  if (place.kind === 'daily') return generateDaily(words, place.date);
  const { levelNumber, difficulty } = place;
  return generateLevel(words, levelNumber, tierFor(levelNumber, difficulty), place.occurrence);
}
