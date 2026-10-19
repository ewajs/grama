/**
 * Saving and loading the player's progress in the browser.
 * @module
 */

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
export function loadGame(storage: Pick<Storage, 'getItem'> = localStorage): Progress | null {
  try {
    const saved: unknown = JSON.parse(storage.getItem(KEY) ?? 'null');
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
export function saveGame(progress: Progress, storage: Pick<Storage, 'setItem'> = localStorage) {
  try {
    const save: Save = { version: VERSION, levels: LEVELS_VERSION, progress };
    storage.setItem(KEY, JSON.stringify(save));
  } catch {
    // Playing on without saving beats interrupting the player.
  }
}

function isSave(value: unknown): value is Save {
  if (typeof value !== 'object' || value === null) return false;
  const { version, levels, progress } = value as Partial<Save>;
  const session = progress?.session;
  return (
    version === VERSION &&
    typeof levels === 'number' &&
    Number.isInteger(progress?.levelNumber) &&
    (progress?.levelNumber ?? 0) >= 1 &&
    typeof progress?.score === 'number' &&
    Number.isInteger(progress.hints) &&
    Number.isInteger(progress.hintsSpent) &&
    Number.isInteger(progress.bonusTowardHint) &&
    ['relaxed', 'normal', 'challenging'].includes(progress.difficulty) &&
    typeof progress.occurrences === 'object' &&
    progress.occurrences !== null &&
    Array.isArray(session?.found) &&
    session.found.every((word) => typeof word === 'string') &&
    typeof session.points === 'number' &&
    typeof session.revealed === 'object' &&
    session.revealed !== null &&
    typeof progress.history === 'object' &&
    progress.history !== null &&
    typeof progress.daily?.date === 'string' &&
    Array.isArray(progress.daily.session?.found) &&
    typeof progress.dailies === 'object' &&
    progress.dailies !== null
  );
}
