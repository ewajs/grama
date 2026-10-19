import { NEW_GAME, type GameState } from '../core/game';

/**
 * The level asked for in the page's query string: `?nivel=37` asks for level 37, handy
 * for playtesting and bug reports. `null` when absent or not a positive whole number.
 * @param search `location.search`.
 */
export function levelFromUrl(search: string): number | null {
  const level = Number(new URLSearchParams(search).get('nivel'));
  return Number.isInteger(level) && level >= 1 ? level : null;
}

/**
 * Where the game starts: the saved game (or a new one), moved to the level in the URL
 * when there is one, keeping the score.
 */
export function startState(saved: GameState | null, levelInUrl: number | null): GameState {
  const state = saved ?? NEW_GAME;
  return levelInUrl === null
    ? state
    : { ...state, levelNumber: levelInUrl, found: [], revealed: {} };
}
