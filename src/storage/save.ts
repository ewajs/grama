/**
 * Saving and loading the player's progress in the browser.
 * @module
 */

import { TIERS } from '../core/difficulty';
import { BONUS_WORDS_PER_HINT } from '../core/hints';
import { LEVELS_VERSION } from '../core/generate';
import type { Progress } from '../core/progress';
import { NEW_SESSION } from '../core/session';

const KEY = 'grama.save';

/** Bump whenever `Progress` changes shape. Pre-1.0 an older save is discarded (D5). */
const VERSION = 10;

type Save = { version: number; levels: number; progress: Progress };

/**
 * The saved game, or `null` when there is none or it can't be used (another version,
 * corrupted, or storage blocked as in some private browsing modes). Saved with other
 * levels (see `LEVELS_VERSION`), it keeps the progress but starts the levels in play over.
 * @param storage Where saves live; `localStorage` unless a test passes another.
 */
export function loadGame(storage?: Pick<Storage, 'getItem'>): Progress | null {
  try {
    const saved: unknown = JSON.parse((storage ?? localStorage).getItem(KEY) ?? 'null');
    if (!isSave(saved)) return null;
    const { levels, progress } = saved;
    return levels === LEVELS_VERSION
      ? progress
      : { ...progress, session: NEW_SESSION, daily: { ...progress.daily, session: NEW_SESSION } };
  } catch {
    return null;
  }
}

/**
 * Saves the game. If storage is full or blocked the game simply goes on unsaved.
 * @param storage Where saves live; `localStorage` unless a test passes another.
 */
export function saveGame(progress: Progress, storage?: Pick<Storage, 'setItem'>) {
  try {
    const save: Save = { version: VERSION, levels: LEVELS_VERSION, progress };
    (storage ?? localStorage).setItem(KEY, JSON.stringify(save));
  } catch {
    // Playing on without saving beats interrupting the player.
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isDifficulty(value: unknown): boolean {
  return value === 'relaxed' || value === 'normal' || value === 'challenging';
}

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isSession(value: unknown): boolean {
  return (
    isObject(value) &&
    Array.isArray(value.found) &&
    value.found.every((word) => typeof word === 'string') &&
    isObject(value.revealed) &&
    Object.values(value.revealed).every(isCount) &&
    isCount(value.points) &&
    isCount(value.hintsWon)
  );
}

function isRecord(value: unknown): boolean {
  return (
    isObject(value) &&
    TIERS.some((tier) => tier === value.tier) &&
    isDifficulty(value.difficulty) &&
    isCount(value.occurrence) &&
    (value.stars === 1 || value.stars === 2 || value.stars === 3) &&
    isCount(value.hints) &&
    isCount(value.bonus) &&
    isCount(value.targets) &&
    value.targets > 0
  );
}

function isSave(value: unknown): value is Save {
  if (!isObject(value)) return false;
  const { version, levels, progress } = value;
  if (!isObject(progress)) return false;
  return (
    version === VERSION &&
    isCount(levels) &&
    isCount(progress.levelNumber) &&
    progress.levelNumber >= 1 &&
    isCount(progress.score) &&
    isCount(progress.hints) &&
    isCount(progress.hintsSpent) &&
    isCount(progress.bonusTowardHint) &&
    progress.bonusTowardHint < BONUS_WORDS_PER_HINT &&
    isDifficulty(progress.difficulty) &&
    isObject(progress.occurrences) &&
    Object.values(progress.occurrences).every(isCount) &&
    isSession(progress.session) &&
    isObject(progress.history) &&
    Object.entries(progress.history).every(
      ([key, record]) =>
        /^[1-9]\d*$/.test(key) && Number.isSafeInteger(Number(key)) && isRecord(record),
    ) &&
    isObject(progress.daily) &&
    (progress.daily.date === '' || isDate(progress.daily.date)) &&
    isSession(progress.daily.session) &&
    isObject(progress.dailies) &&
    Object.entries(progress.dailies).every(([date, record]) => isDate(date) && isRecord(record))
  );
}
