/**
 * Contrarreloj, the timed mode (D19): wheel after wheel against the clock, apart from the
 * main game. A run is plain data; time passes only when the app says so ({@link tick}),
 * and its wheels come from a seed the app picks at random.
 * @module
 */

import type { Tier } from './difficulty';
import type { Submission } from './evaluate';
import { generateLevel, type LevelShape } from './generate';
import type { Level } from './level';
import { isComplete, NEW_SESSION, submitWord, type Session } from './session';

/** Milliseconds a run starts with. */
export const START_TIME = 60_000;

/** Milliseconds each result adds, and finishing a wheel's board. */
export const TIME_FOR = { target: 3_000, bonus: 1_000, clear: 10_000 } as const;

/** Milliseconds _Pasar_ costs (skipping to a new wheel). */
export const PASS_COST = 10_000;

/**
 * How wheels get harder through a run: each step applies from wheel `from` on (counting
 * from 0, skipped wheels included). Boards are small, so a wheel fits in the time.
 */
export const RAMP: readonly { from: number; tier: Tier; shape: LevelShape }[] = [
  { from: 0, tier: 'easy', shape: { letters: 6, targets: 5, shortestTarget: 3 } },
  { from: 3, tier: 'medium', shape: { letters: 6, targets: 5, shortestTarget: 3 } },
  { from: 6, tier: 'medium', shape: { letters: 7, targets: 6, shortestTarget: 3 } },
  { from: 10, tier: 'hard', shape: { letters: 7, targets: 6, shortestTarget: 3 } },
  { from: 15, tier: 'hard', shape: { letters: 8, targets: 6, shortestTarget: 4 } },
];

// Wheels shuffle their letters with numbers of their own, apart from main levels' and
// dailies'.
const TRIAL_LEVEL_BASE = 3_000_000;

/** A run in play, or over. */
export type Run = {
  /** Picks the run's wheels; random, so every run is new. */
  seed: number;
  /** Which wheel is on, from 0; skipped wheels count. */
  wheel: number;
  /** The wheel on as played so far. */
  session: Session;
  /** Milliseconds left; the run is over at 0. */
  timeLeft: number;
  /** Points won: the run's score. */
  points: number;
  /** Wheels whose board was finished. */
  cleared: number;
  /** Words found, targets and bonus. */
  words: number;
};

/** A run's result, kept for the best score and the history. */
export type RunResult = Pick<Run, 'points' | 'cleared' | 'words'>;

/** A new run, from a seed the app picks at random. */
export function newRun(seed: number): Run {
  return {
    seed,
    wheel: 0,
    session: NEW_SESSION,
    timeLeft: START_TIME,
    points: 0,
    cleared: 0,
    words: 0,
  };
}

/** The wheel on: the same for the same seed and wheel, like every level. */
export function wheelOf(words: readonly string[], { seed, wheel }: Run): Level {
  const step = RAMP.findLast(({ from }) => from <= wheel) ?? RAMP[0];
  if (!step) throw new Error('No ramp defined');
  return generateLevel(
    words,
    TRIAL_LEVEL_BASE + ((seed + wheel) % 1_000_000),
    step.tier,
    seed + wheel,
    step.shape,
  );
}

/** Whether the run is over: no time left. */
export function isOver(run: Run): boolean {
  return run.timeLeft <= 0;
}

/** The run after `elapsed` milliseconds of play. */
export function tick(run: Run, elapsed: number): Run {
  return isOver(run) ? run : { ...run, timeLeft: Math.max(0, run.timeLeft - elapsed) };
}

/**
 * Plays a word on the wheel on: a target or a bonus word adds its points and time;
 * finishing the board adds more and brings the next wheel. Nothing counts once the run
 * is over.
 * @param level The wheel on (from {@link wheelOf}).
 */
export function playTrialWord(
  run: Run,
  level: Level,
  word: string,
): { submission: Submission; run: Run } {
  const { submission, session } = submitWord(run.session, level, word);
  if (isOver(run) || (submission.kind !== 'target' && submission.kind !== 'bonus')) {
    return { submission, run };
  }
  const played: Run = {
    ...run,
    session,
    points: run.points + submission.points,
    words: run.words + 1,
    timeLeft: run.timeLeft + TIME_FOR[submission.kind],
  };
  if (!isComplete(level, session)) return { submission, run: played };
  return {
    submission,
    run: {
      ...played,
      wheel: run.wheel + 1,
      session: NEW_SESSION,
      cleared: run.cleared + 1,
      timeLeft: played.timeLeft + TIME_FOR.clear,
    },
  };
}

/** Whether _Pasar_ is possible: it would leave time to play. */
export function canPass(run: Run): boolean {
  return run.timeLeft > PASS_COST;
}

/** _Pasar_: a new wheel, for {@link PASS_COST}; unchanged when it would end the run. */
export function pass(run: Run): Run {
  if (!canPass(run)) return run;
  return { ...run, wheel: run.wheel + 1, session: NEW_SESSION, timeLeft: run.timeLeft - PASS_COST };
}

/** The player's Contrarreloj record: plain data, saved apart from their progress. */
export type TrialRecord = {
  /** Runs played to the end. */
  runs: number;
  /** The run with the most points, if any. */
  best: RunResult | null;
  /** The most wheels finished in one run. */
  mostCleared: number;
};

/** A record before the first run. */
export const NEW_TRIAL_RECORD: TrialRecord = { runs: 0, best: null, mostCleared: 0 };

/** The record with a finished run in it. */
export function recordRun(record: TrialRecord, result: RunResult): TrialRecord {
  return {
    runs: record.runs + 1,
    best: !record.best || result.points > record.best.points ? result : record.best,
    mostCleared: Math.max(record.mostCleared, result.cleared),
  };
}
