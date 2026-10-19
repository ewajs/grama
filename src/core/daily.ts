/**
 * The daily challenge: one level per date for everyone, its weekday tier, and streaks.
 * @module
 */

import { generateLevel, type LevelShape } from './generate';
import type { Tier } from './difficulty';
import type { LevelRecord } from './history';
import type { Level } from './level';
import { NEW_SESSION, type Session } from './session';

/** The first daily challenge's date: number 1. */
export const DAILY_EPOCH = '2026-10-19';

/** A daily challenge's size: the same every day. */
export const DAILY_SHAPE: LevelShape = { letters: 7, targets: 8, shortestTarget: 3 };

/** Tiers by weekday, Monday first: easy at the start of the week, extra hard on Sunday. */
export const DAILY_TIERS: readonly Tier[] = [
  'easy',
  'easy',
  'medium',
  'medium',
  'hard',
  'hard',
  'extra',
];

// Dailies shuffle letters with numbers of their own, far from the main levels'.
const DAILY_LEVEL_BASE = 1_000_000;

const DAY = 24 * 60 * 60 * 1000;

/** A date as `YYYY-MM-DD`, in the player's own time zone: when "today" changes for them. */
export function dateKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Midnight UTC of a `YYYY-MM-DD` date, to count days without time zones or DST. */
function utc(key: string): number {
  const [year = 0, month = 1, day = 1] = key.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

/** The day before, as `YYYY-MM-DD`. */
export function previousDay(key: string): string {
  return new Date(utc(key) - DAY).toISOString().slice(0, 10);
}

/** The daily challenge's number for a date: 1 on {@link DAILY_EPOCH}. */
export function dailyNumber(key: string): number {
  return Math.round((utc(key) - utc(DAILY_EPOCH)) / DAY) + 1;
}

/** How hard a date's daily challenge is, from its weekday (see {@link DAILY_TIERS}). */
export function dailyTier(key: string): Tier {
  const monday = (new Date(utc(key)).getUTCDay() + 6) % 7;
  return DAILY_TIERS[monday] ?? 'medium';
}

/** How many dailies before a date (from {@link DAILY_EPOCH}) share its tier. */
export function dailyOccurrence(key: string): number {
  const tier = dailyTier(key);
  const before = Math.max(dailyNumber(key) - 1, 0);
  const perWeek = DAILY_TIERS.filter((other) => other === tier).length;
  let count = Math.floor(before / 7) * perWeek;
  // The rest of the last week: the days just before this one.
  for (let day = key, left = before % 7; left > 0; left--) {
    day = previousDay(day);
    if (dailyTier(day) === tier) count++;
  }
  return count;
}

/**
 * A date's daily challenge: the same level for everyone on that date. Each tier's dailies
 * take seeds from the end of its order backwards, while main levels take them from the
 * start, so a daily never repeats a main level or a recent daily.
 */
export function generateDaily(words: readonly string[], key: string): Level {
  return generateLevel(
    words,
    DAILY_LEVEL_BASE + dailyNumber(key),
    dailyTier(key),
    -1 - dailyOccurrence(key),
    DAILY_SHAPE,
  );
}

/** The daily challenge in play: its date, and how far along it is. */
export type DailyPlay = {
  /** Its date, `YYYY-MM-DD`; empty before the first daily is played. */
  date: string;
  /** How far along it is. */
  session: Session;
};

/** Today's daily in play: the one saved if it's today's, or a fresh one. */
export function dailyFor(saved: DailyPlay, today: string): DailyPlay {
  return saved.date === today ? saved : { date: today, session: NEW_SESSION };
}

/** Consecutive days with the daily completed that earn a streak freeze. */
export const DAYS_PER_FREEZE = 7;

/** Most streak freezes held at once: a freeze covers one missed day, never two in a row. */
export const MAX_FREEZES = 1;

/** The daily streak: how it stands, the best it's been, and freezes in hand. */
export type Streak = {
  /** Consecutive days completed up to today, or to yesterday while today's isn't done. */
  current: number;
  /** The longest the streak has ever been. */
  best: number;
  /** Freezes in hand: each lets one missed day pass without breaking the streak. */
  freezes: number;
};

/**
 * The daily streak as of `today`, replayed day by day from the first daily completed:
 * each completed day adds one; every {@link DAYS_PER_FREEZE} completed days in a row earn
 * a freeze (up to {@link MAX_FREEZES}); a missed day uses a freeze if there is one (the
 * streak holds) and otherwise ends the streak. Today counts as missed only once it's over.
 * Nothing extra is saved: the completed dailies say it all.
 * @param dailies Completed dailies by date.
 */
export function streakOf(dailies: Readonly<Record<string, LevelRecord>>, today: string): Streak {
  const days = Object.keys(dailies).sort();
  const first = days[0];
  const result: Streak = { current: 0, best: 0, freezes: 0 };
  if (!first) return result;
  let toward = 0;
  for (let day = first; day <= today; day = nextDay(day)) {
    if (day in dailies) {
      result.current++;
      result.best = Math.max(result.best, result.current);
      if (++toward === DAYS_PER_FREEZE) {
        toward = 0;
        result.freezes = Math.min(result.freezes + 1, MAX_FREEZES);
      }
    } else if (day === today) {
      // Still time to play it.
    } else if (result.freezes > 0 && result.current > 0) {
      result.freezes--;
    } else {
      result.current = 0;
      toward = 0;
    }
  }
  return result;
}

/** The day after, as `YYYY-MM-DD`. */
function nextDay(key: string): string {
  return new Date(utc(key) + DAY).toISOString().slice(0, 10);
}
