import type { Level } from './level';
import type { Session } from './session';

/** One row of the board: a slot for a target word of `length` letters. */
export type BoardRow = {
  length: number;
  /** The target in this row, or `null` while the slot is empty. */
  word: string | null;
  /** How many of its letters show: all once found, some when revealed by hints. */
  shown: number;
};

/**
 * The board for a level: one row per target, shortest first. Within a length, found
 * targets come first, in the order found, then targets with letters revealed by hints,
 * then empty rows, so the board never reveals which word goes where.
 * @param session Words found (bonus words are ignored) and letters revealed by hints.
 */
export function boardRows(level: Level, { found, revealed }: Session): BoardRow[] {
  const lengths = [...new Set(level.targets.map((word) => word.length))].sort((a, b) => a - b);
  return lengths.flatMap((length) => {
    const targets = level.targets.filter((word) => word.length === length);
    const rows: BoardRow[] = [
      ...found
        .filter((word) => targets.includes(word))
        .map((word) => ({ length, word, shown: length })),
      ...targets
        .filter((word) => !found.includes(word) && (revealed[word] ?? 0) > 0)
        .map((word) => ({ length, word, shown: revealed[word] ?? 0 })),
    ];
    while (rows.length < targets.length) rows.push({ length, word: null, shown: 0 });
    return rows;
  });
}
