import type { GameState } from '../core/game';

const KEY = 'grama.save';

/** Bump whenever `GameState` changes shape. Pre-1.0 an older save is discarded (D5). */
const VERSION = 1;

type Save = { version: number; state: GameState };

/**
 * The saved game, or `null` when there is none or it can't be used (another version,
 * corrupted, or storage blocked as in some private browsing modes).
 * @param storage Where saves live; `localStorage` unless a test passes another.
 */
export function loadGame(storage: Pick<Storage, 'getItem'> = localStorage): GameState | null {
  try {
    const saved: unknown = JSON.parse(storage.getItem(KEY) ?? 'null');
    return isSave(saved) ? saved.state : null;
  } catch {
    return null;
  }
}

/**
 * Saves the game. If storage is full or blocked the game simply goes on unsaved.
 * @param storage Where saves live; `localStorage` unless a test passes another.
 */
export function saveGame(state: GameState, storage: Pick<Storage, 'setItem'> = localStorage) {
  try {
    storage.setItem(KEY, JSON.stringify({ version: VERSION, state } satisfies Save));
  } catch {
    // Playing on without saving beats interrupting the player.
  }
}

function isSave(value: unknown): value is Save {
  if (typeof value !== 'object' || value === null) return false;
  const { version, state } = value as Partial<Save>;
  return (
    version === VERSION &&
    Number.isInteger(state?.levelNumber) &&
    (state?.levelNumber ?? 0) >= 1 &&
    typeof state?.score === 'number' &&
    Array.isArray(state.found) &&
    state.found.every((word) => typeof word === 'string')
  );
}
