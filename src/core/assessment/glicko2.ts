/** Published Glicko-2 candidate math; no game-specific evidence conversion or clock reads. @module */

/** Mean, rating deviation and volatility on the original Glicko rating scale. */
export type Rating = { rating: number; deviation: number; volatility: number };

/** An independent result within one period, against a pre-period opponent snapshot. */
export type RatingResult = {
  opponent: Pick<Rating, 'rating' | 'deviation'>;
  score: 0 | 0.5 | 1;
};

/** Unrated prior; its scale does not yet represent calibrated Grama ability. */
export const NEW_RATING: Readonly<Rating> = { rating: 1500, deviation: 350, volatility: 0.06 };
const SCALE = 173.7178;
const DEFAULT_TAU = 0.5;
const MAX_DEVIATION = NEW_RATING.deviation;
const TOLERANCE = 0.000001;
const MAX_ITERATIONS = 100;

function checkRating(rating: number, deviation: number): void {
  if (
    !Number.isFinite(rating) ||
    !Number.isFinite(deviation) ||
    deviation <= 0 ||
    deviation > MAX_DEVIATION
  )
    throw new RangeError('Rating must be finite, with deviation in (0, 350]');
}

function checkPlayer(player: Readonly<Rating>): void {
  checkRating(player.rating, player.deviation);
  if (!Number.isFinite(player.volatility) || player.volatility <= 0)
    throw new RangeError('Volatility must be finite and positive');
}

function finite(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError('Glicko-2 numerical range exceeded');
  return value;
}

/**
 * Adds uncertainty for supplied whole idle periods. Mean and volatility never decay.
 * Period length belongs to the caller; never mix session and calendar-day diffusion.
 */
export function inflateRating(player: Readonly<Rating>, periods: number): Rating {
  checkPlayer(player);
  if (!Number.isSafeInteger(periods) || periods < 0)
    throw new RangeError('Idle periods must be a non-negative safe integer');
  return {
    ...player,
    deviation: Math.min(
      MAX_DEVIATION,
      Math.hypot(player.deviation, SCALE * player.volatility * Math.sqrt(periods)),
    ),
  };
}

/**
 * Updates once for a batch of independent win/draw/loss results using pre-period ratings.
 * Empty input advances exactly one idle period. Invalid or numerically unresolved input
 * throws instead of returning a corrupt estimate. Fractional performance needs a separate
 * validated outcome model. See https://www.glicko.net/glicko/glicko2.pdf (2022).
 */
export function ratePeriod(
  player: Readonly<Rating>,
  results: readonly RatingResult[],
  tau = DEFAULT_TAU,
): Rating {
  checkPlayer(player);
  if (!Number.isFinite(tau) || tau <= 0 || !Number.isFinite(tau * tau) || tau * tau === 0)
    throw new RangeError('Tau and its square must be finite and positive');
  if (results.length === 0) return inflateRating(player, 1);
  const mu = (player.rating - NEW_RATING.rating) / SCALE;
  const phi = player.deviation / SCALE;
  let information = 0,
    residual = 0;
  for (const { opponent, score } of results) {
    checkRating(opponent.rating, opponent.deviation);
    if (score !== 0 && score !== 0.5 && score !== 1)
      throw new RangeError('A Glicko-2 result must be a loss, draw or win');
    const g = 1 / Math.sqrt(1 + (3 * (opponent.deviation / SCALE) ** 2) / Math.PI ** 2);
    const logOdds = g * (mu - (opponent.rating - NEW_RATING.rating) / SCALE);
    const tail = Math.exp(-Math.abs(logOdds));
    // Avoid cancellation in E(1-E) when E rounds to one for a very uneven pairing.
    const expected = logOdds >= 0 ? 1 / (1 + tail) : tail / (1 + tail);
    information += (g * g * tail) / (1 + tail) ** 2;
    residual += g * (score - expected);
  }
  const variance = finite(1 / information);
  const delta = finite(variance * residual);
  const volatility = solveVolatility(phi, variance, delta, player.volatility, tau);
  const prior = Math.hypot(phi, volatility);
  const deviation = Math.sqrt(1 / (1 / prior ** 2 + information));
  const next = {
    rating: finite(NEW_RATING.rating + SCALE * (mu + deviation ** 2 * residual)),
    deviation: Math.min(MAX_DEVIATION, SCALE * deviation),
    volatility,
  };
  checkPlayer(next);
  return next;
}

function solveVolatility(
  phi: number,
  variance: number,
  delta: number,
  sigma: number,
  tau: number,
): number {
  const a = 2 * Math.log(sigma);
  const deltaSquared = finite(delta * delta);
  const base = finite(phi * phi + variance);
  const f = (x: number) => {
    const exponential = finite(Math.exp(x));
    const total = finite(base + exponential);
    return finite(((exponential / total) * (deltaSquared / total - 1)) / 2 - (x - a) / (tau * tau));
  };
  let left = a,
    right = a;
  let fLeft = f(left);
  if (fLeft === 0) return sigma;
  if (deltaSquared > base) right = Math.log(deltaSquared - base);
  else {
    let bracketed = false;
    for (let k = 1; k <= MAX_ITERATIONS; k++) {
      right = a - k * tau;
      if (f(right) >= 0) {
        bracketed = true;
        break;
      }
    }
    if (!bracketed) throw new RangeError('Glicko-2 volatility bracket did not converge');
  }
  let fRight = f(right);
  for (let step = 0; step < MAX_ITERATIONS; step++) {
    if (Math.abs(right - left) <= TOLERANCE) return finite(Math.exp(left / 2));
    const point = finite(left + (left - right) * (fLeft / (fRight - fLeft)));
    const fPoint = f(point);
    // Multiplying tiny residuals could underflow to zero and falsely signal a sign change.
    if (fPoint === 0 || fRight === 0 || Math.sign(fPoint) !== Math.sign(fRight)) {
      left = right;
      fLeft = fRight;
    } else fLeft /= 2;
    right = point;
    fRight = fPoint;
  }
  throw new RangeError('Glicko-2 volatility solver did not converge');
}
