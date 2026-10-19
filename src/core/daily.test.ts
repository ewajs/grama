import { describe, expect, it } from 'vitest';
import {
  DAILY_EPOCH,
  DAYS_PER_FREEZE,
  MAX_FREEZES,
  dailyFor,
  dailyNumber,
  dailyOccurrence,
  dailyTier,
  dateKey,
  previousDay,
  streakOf,
} from './daily';
import type { LevelRecord } from './history';
import { NEW_SESSION } from './session';

const done: LevelRecord = {
  tier: 'easy',
  difficulty: 'normal',
  occurrence: 0,
  stars: 2,
  hints: 0,
  bonus: 1,
  targets: 8,
};
const days = (...keys: string[]) => Object.fromEntries(keys.map((key) => [key, done]));

describe('dates', () => {
  it('formats a date in the local time zone', () => {
    expect(dateKey(new Date(2026, 9, 5, 23, 59))).toBe('2026-10-05');
  });

  it('goes back a day across months and years', () => {
    expect(previousDay('2026-11-01')).toBe('2026-10-31');
    expect(previousDay('2027-01-01')).toBe('2026-12-31');
  });

  it('numbers dailies from the first one', () => {
    expect(dailyNumber(DAILY_EPOCH)).toBe(1);
    expect(dailyNumber('2026-10-20')).toBe(2);
    expect(dailyNumber('2027-10-19')).toBe(366);
  });
});

describe('dailyTier', () => {
  it('goes from easy on Monday to extra hard on Sunday', () => {
    // 2026-10-19 is a Monday.
    const week = ['19', '20', '21', '22', '23', '24', '25'].map((day) =>
      dailyTier(`2026-10-${day}`),
    );
    expect(week).toEqual(['easy', 'easy', 'medium', 'medium', 'hard', 'hard', 'extra']);
  });
});

describe('dailyOccurrence', () => {
  it('counts the earlier dailies of the same tier', () => {
    // The epoch is a Monday: Monday and Tuesday are easy, Sunday extra hard.
    expect(dailyOccurrence('2026-10-19')).toBe(0);
    expect(dailyOccurrence('2026-10-20')).toBe(1);
    expect(dailyOccurrence('2026-10-25')).toBe(0);
    expect(dailyOccurrence('2026-10-26')).toBe(2);
    expect(dailyOccurrence('2026-11-01')).toBe(1);
    expect(dailyOccurrence('2027-10-18')).toBe(52 * 2);
  });
});

describe('dailyFor', () => {
  it("keeps today's daily, and starts fresh on a new day", () => {
    const today = { date: '2026-10-19', session: { ...NEW_SESSION, found: ['SOL'], revealed: {} } };
    expect(dailyFor(today, '2026-10-19')).toBe(today);
    expect(dailyFor(today, '2026-10-20')).toEqual({ date: '2026-10-20', session: NEW_SESSION });
  });
});

describe('streakOf', () => {
  /** Every day from `from` for `count` days, skipping the ones in `missed`. */
  const run = (from: string, count: number, ...missed: number[]) => {
    const keys = [];
    for (let index = 0; index < count; index++) {
      if (missed.includes(index)) continue;
      keys.push(new Date(Date.parse(from) + index * 86_400_000).toISOString().slice(0, 10));
    }
    return days(...keys);
  };

  it('counts consecutive days up to today', () => {
    expect(streakOf(days('2026-10-18', '2026-10-19', '2026-10-20'), '2026-10-20').current).toBe(3);
  });

  it("stays alive through yesterday while today's isn't done", () => {
    expect(streakOf(days('2026-10-18', '2026-10-19'), '2026-10-20').current).toBe(2);
  });

  it('breaks after a missed day without a freeze', () => {
    expect(streakOf(days('2026-10-17', '2026-10-18'), '2026-10-20')).toEqual({
      current: 0,
      best: 2,
      freezes: 0,
    });
  });

  it(`earns a freeze every ${DAYS_PER_FREEZE} days in a row, up to ${MAX_FREEZES}`, () => {
    expect(streakOf(run('2026-10-01', 7), '2026-10-07').freezes).toBe(1);
    expect(streakOf(run('2026-10-01', 14), '2026-10-14').freezes).toBe(MAX_FREEZES);
  });

  it('spends the freeze on a missed day, and the streak holds', () => {
    // 7 days, a miss on day 8, then days 9 and 10.
    expect(streakOf(run('2026-10-01', 10, 7), '2026-10-10')).toEqual({
      current: 9,
      best: 9,
      freezes: 0,
    });
  });

  it('never covers two missed days in a row', () => {
    expect(streakOf(run('2026-10-01', 7), '2026-10-10').current).toBe(0);
  });

  it('finds the longest run', () => {
    const history = days('2026-10-01', '2026-10-02', '2026-10-05', '2026-10-06', '2026-10-07');
    expect(streakOf(history, '2026-10-07').best).toBe(3);
    expect(streakOf({}, '2026-10-07')).toEqual({ current: 0, best: 0, freezes: 0 });
  });
});
