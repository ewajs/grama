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

// Dailies take seeds from further along each tier's order than the main levels reach,
// and shuffle letters with their own numbers, so they don't repeat a main level.
const DAILY_OCCURRENCE_BASE = 40;
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

/** A date's daily challenge: the same level for everyone on that date. */
export function generateDaily(words: readonly string[], key: string): Level {
  const number = dailyNumber(key);
  return generateLevel(
    words,
    DAILY_LEVEL_BASE + number,
    dailyTier(key),
    DAILY_OCCURRENCE_BASE + number,
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

/**
 * Consecutive days with the daily completed, up to today, or to yesterday while today's
 * isn't done yet (the streak is still alive until the day ends).
 * @param dailies Completed dailies by date.
 */
export function streak(dailies: Readonly<Record<string, LevelRecord>>, today: string): number {
  let day = today in dailies ? today : previousDay(today);
  let count = 0;
  while (day in dailies) {
    count++;
    day = previousDay(day);
  }
  return count;
}

/** The longest run of consecutive days with the daily completed. */
export function bestStreak(dailies: Readonly<Record<string, LevelRecord>>): number {
  let best = 0;
  for (const day of Object.keys(dailies)) {
    // Count runs from their first day only.
    if (previousDay(day) in dailies) continue;
    let length = 0;
    for (
      let next = day;
      next in dailies;
      next = new Date(utc(next) + DAY).toISOString().slice(0, 10)
    ) {
      length++;
    }
    best = Math.max(best, length);
  }
  return best;
}
