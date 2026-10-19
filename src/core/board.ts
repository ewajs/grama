import type { Level } from './level';

/** One row of the board: a slot for a target word of `length` letters. */
export type BoardRow = {
  length: number;
  /** The target shown in this row, or `null` while the slot is still empty. */
  word: string | null;
};

/**
 * The board for a level: one row per target, shortest first. Found targets fill the
 * rows of their length in the order they were found, so the board never reveals
 * which word goes where.
 * @param found Words found on the level; bonus words are ignored.
 */
export function boardRows(level: Level, found: readonly string[]): BoardRow[] {
  const lengths = [...new Set(level.targets.map((word) => word.length))].sort((a, b) => a - b);
  return lengths.flatMap((length) => {
    const slots = level.targets.filter((word) => word.length === length).length;
    const filled = found.filter((word) => word.length === length && level.targets.includes(word));
    return Array.from({ length: slots }, (_, index) => ({ length, word: filled[index] ?? null }));
  });
}
