/**
 * Where a visit starts: the saved game, or the level asked for in the URL.
 * @module
 */

import { occurrencesBefore, type Difficulty } from '../core/cadence';
import { NEW_PROGRESS, type Progress } from '../core/progress';
import { NEW_SESSION } from '../core/session';

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
 * Where the game starts: the saved game (or a new one at the player's difficulty), moved
 * to the level in the URL when there is one, keeping the score. A level from the URL is
 * the one a player gets by playing every level before it at that difficulty.
 */
export function startState(
  saved: Progress | null,
  levelInUrl: number | null,
  difficulty: Difficulty = 'normal',
): Progress {
  const progress = saved ?? { ...NEW_PROGRESS, difficulty };
  return levelInUrl === null
    ? progress
    : {
        ...progress,
        levelNumber: levelInUrl,
        occurrences: occurrencesBefore(levelInUrl, progress.difficulty),
        session: NEW_SESSION,
      };
}
