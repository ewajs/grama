import { describe, expect, it } from 'vitest';
import { inflateRating, NEW_RATING, ratePeriod, type Rating, type RatingResult } from './glicko2';

const player: Rating = { rating: 1500, deviation: 200, volatility: 0.06 };
const reference: readonly RatingResult[] = [
  { opponent: { rating: 1400, deviation: 30 }, score: 1 },
  { opponent: { rating: 1550, deviation: 100 }, score: 0 },
  { opponent: { rating: 1700, deviation: 300 }, score: 0 },
];
const equalOpponent = { rating: 1500, deviation: 80 };

describe('Glicko-2 candidate', () => {
  it('reproduces Glickman’s 2022 worked example without rounding intermediate values', () => {
    const result = ratePeriod(player, reference);
    // Published rounded output is 1464.06, 151.52 and 0.05999.
    expect(Math.abs(result.rating - 1464.06)).toBeLessThan(0.02);
    expect(Math.abs(result.deviation - 151.52)).toBeLessThan(0.01);
    expect(Math.abs(result.volatility - 0.05999)).toBeLessThan(0.00001);
    // Independent bisection of the volatility equation supplies the finer check.
    expect(result.rating).toBeCloseTo(1464.0506705390892, 8);
    expect(result.deviation).toBeCloseTo(151.5165241243043, 8);
    expect(result.volatility).toBeCloseTo(0.059995984400677826, 8);
  });

  it('handles the other volatility bracket when a strong favorite loses', () => {
    const result = ratePeriod({ ...player, deviation: 50 }, [
      { opponent: { rating: 2000, deviation: 30 }, score: 1 },
    ]);
    expect(result.rating).toBeGreaterThan(player.rating);
    expect(result.volatility).toBeGreaterThan(player.volatility);
    expect(result.deviation).toBeGreaterThan(50);
    expect(Object.values(result).every(Number.isFinite)).toBe(true);
  });

  it('treats symmetric wins and losses symmetrically, and accepts draws', () => {
    const win = ratePeriod(player, [{ opponent: equalOpponent, score: 1 }]);
    const loss = ratePeriod(player, [{ opponent: equalOpponent, score: 0 }]);
    expect(win.rating - player.rating).toBeCloseTo(player.rating - loss.rating, 10);
    expect(win.deviation).toBeCloseTo(loss.deviation, 10);
    expect(win.volatility).toBeCloseTo(loss.volatility, 10);
    const draw = ratePeriod(player, [{ opponent: equalOpponent, score: 0.5 }]);
    expect(draw.rating).toBe(player.rating);
    expect(draw.deviation).toBeLessThan(player.deviation);
  });

  it('learns less from an uncertain opponent than a well-established one', () => {
    const established = ratePeriod(player, [
      { opponent: { rating: 1500, deviation: 30 }, score: 1 },
    ]);
    const uncertain = ratePeriod(player, [
      { opponent: { rating: 1500, deviation: 350 }, score: 1 },
    ]);
    expect(uncertain.rating).toBeLessThan(established.rating);
    expect(uncertain.deviation).toBeGreaterThan(established.deviation);
  });

  it('is deterministic, order-independent within a period, and leaves inputs untouched', () => {
    const before = structuredClone(reference);
    const frozenPlayer = Object.freeze({ ...player });
    const result = ratePeriod(frozenPlayer, reference);
    expect(ratePeriod(frozenPlayer, reference)).toEqual(result);
    const reversed = ratePeriod(frozenPlayer, reference.toReversed());
    for (const key of ['rating', 'deviation', 'volatility'] as const)
      expect(reversed[key]).toBeCloseTo(result[key], 10);
    expect(reference).toEqual(before);
    expect(frozenPlayer).toEqual(player);
  });

  it('advances exactly one empty period and keeps mean/volatility unchanged', () => {
    expect(ratePeriod(player, [])).toEqual(inflateRating(player, 1));
    expect(inflateRating(player, 1)).toMatchObject({ rating: 1500, volatility: 0.06 });
    expect(inflateRating(player, 1).deviation).toBeCloseTo(200.27141669877065, 10);
    expect(inflateRating(player, 0)).toEqual(player);
  });

  it('composes whole idle periods and saturates uncertainty at the declared cap', () => {
    let repeated = player;
    for (let period = 0; period < 20; period++) repeated = ratePeriod(repeated, []);
    expect(inflateRating(player, 20).deviation).toBeCloseTo(repeated.deviation, 10);
    expect(inflateRating(player, 100000)).toEqual({ ...player, deviation: 350 });
    expect(inflateRating(NEW_RATING, 100000)).toEqual(NEW_RATING);
  });

  it.each([
    { rating: NaN },
    { rating: Infinity },
    { deviation: 0 },
    { deviation: -1 },
    { deviation: 351 },
    { deviation: Infinity },
    { volatility: 0 },
    { volatility: -0.1 },
    { volatility: Infinity },
  ])('rejects invalid player state %j', (change) => {
    expect(() => ratePeriod({ ...player, ...change }, reference)).toThrow(RangeError);
    expect(() => inflateRating({ ...player, ...change }, 1)).toThrow(RangeError);
  });

  it('extends fractional results continuously while preserving symmetry', () => {
    const update = (score: number) => ratePeriod(player, [{ opponent: equalOpponent, score }]);
    expect(update(0.25).rating).toBeGreaterThan(update(0).rating);
    expect(update(0.25).rating).toBeLessThan(update(0.5).rating);
    expect(update(0.25).rating + update(0.75).rating).toBeCloseTo(3000, 10);
    const batch = ratePeriod(player, [
      { opponent: equalOpponent, score: 0.2 },
      { opponent: equalOpponent, score: 0.8 },
    ]);
    const draws = ratePeriod(player, [
      { opponent: equalOpponent, score: 0.5 },
      { opponent: equalOpponent, score: 0.5 },
    ]);
    expect(batch.rating).toBeCloseTo(draws.rating, 10);
    expect(batch.deviation).toBeCloseTo(draws.deviation, 10);
    expect(batch.volatility).toBeCloseTo(draws.volatility, 10);
  });

  it.each([-1, 2, NaN, Infinity])('rejects invalid outcomes: %s', (score) => {
    const result = { opponent: equalOpponent, score } as RatingResult;
    expect(() => ratePeriod(player, [result])).toThrow(RangeError);
  });

  it.each([0, -1, NaN, Infinity, 1e-200, 1e200])('rejects invalid tau %s', (tau) => {
    expect(() => ratePeriod(player, reference, tau)).toThrow(RangeError);
  });

  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid idle periods %s',
    (periods) => {
      expect(() => inflateRating(player, periods)).toThrow(RangeError);
    },
  );

  it('rejects invalid opponents and fails explicitly for numerical extremes', () => {
    expect(() =>
      ratePeriod(player, [{ opponent: { rating: 1500, deviation: NaN }, score: 1 }]),
    ).toThrow(RangeError);
    expect(() =>
      ratePeriod(player, [{ opponent: { rating: 1e300, deviation: 30 }, score: 1 }]),
    ).toThrow(RangeError);
    expect(() => ratePeriod(player, reference, 1e-100)).toThrow(/converge/);
    expect(() => ratePeriod({ ...player, volatility: 1e300 }, reference)).toThrow(RangeError);
  });

  it('keeps numerical state finite across 1,000 deterministic valid-domain batches', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const state = {
        rating: 500 + (seed % 2000),
        deviation: 1 + (seed % 350),
        volatility: 0.01 + (seed % 20) / 100,
      };
      const batch = Array.from({ length: 1 + (seed % 15) }, (_, index) => ({
        opponent: {
          rating: 500 + ((seed * 7 + index * 131) % 2500),
          deviation: 1 + ((seed + index * 71) % 350),
        },
        score: ([0, 0.5, 1] as const)[(seed + index) % 3]!,
      }));
      const result = ratePeriod(state, batch, 0.2 + (seed % 11) / 10);
      expect(Object.values(result).every(Number.isFinite)).toBe(true);
      expect(result.deviation).toBeGreaterThan(0);
      expect(result.deviation).toBeLessThanOrEqual(350);
      expect(result.volatility).toBeGreaterThan(0);
    }
  });
});
