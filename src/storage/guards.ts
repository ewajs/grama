/** Shared predicates for decoding saved progress and assessment evidence. @module */

/** A non-null object, excluding arrays. */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** A non-negative safe integer. */
export function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** One of the game's difficulty settings. */
export function isDifficulty(value: unknown): boolean {
  return value === 'relaxed' || value === 'normal' || value === 'challenging';
}

/** A real calendar date written as YYYY-MM-DD. */
export function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
