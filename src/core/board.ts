/**
 * The board: which word shows in which row, and how many of its letters.
 * @module
 */

import type { Level } from './level';
import type { Session } from './session';

/** One row of the board: a slot for a target word of `length` letters. */
export type BoardRow = {
  /** Letters in the row's word: its number of tiles. */
  length: number;
  /** The target in this row, or `null` while the slot is empty. */
  word: string | null;
  /** How many of its letters show: all once found, some when revealed by hints. */
  shown: number;
};

/**
 * Orders words as the board does: shortest first, then alphabetically (`Ñ` after `N`).
 * @example ['TAX', 'CASA', 'CAT', 'CAN'].toSorted(byBoardOrder) // ['CAN', 'CAT', 'TAX', 'CASA']
 */
export function byBoardOrder(a: string, b: string): number {
  return a.length - b.length || a.localeCompare(b, 'es');
}

/**
 * The board for a level: one row per target, in board order ({@link byBoardOrder}).
 * Each target has its own row from the start, so where a found word lands is a small
 * clue to the words around it.
 * @param session Words found (bonus words are ignored) and letters revealed by hints.
 */
export function boardRows(level: Level, { found, revealed }: Session): BoardRow[] {
  return level.targets.toSorted(byBoardOrder).map((word) => {
    const shown = found.includes(word) ? word.length : (revealed[word] ?? 0);
    return { length: word.length, word: shown > 0 ? word : null, shown };
  });
}
