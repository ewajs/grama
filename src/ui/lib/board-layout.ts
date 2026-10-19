/** Space between tiles, and between rows, in pixels. */
export const TILE_GAP = 6;

/** Space between the board's columns, in pixels. */
export const COLUMN_GAP = 20;

/** Tiles never grow past this, even with room to spare. */
export const MAX_TILE = 56;

/** How to lay out the board's rows: in how many columns, and how big each tile is. */
export type BoardLayout = { columns: number; tile: number };

/**
 * Splits rows into `columns` groups, top to bottom then left to right; earlier columns get
 * the extra row when they can't be even.
 */
export function splitIntoColumns<T>(rows: readonly T[], columns: number): T[][] {
  const perColumn = Math.ceil(rows.length / columns);
  return Array.from({ length: columns }, (_, column) =>
    rows.slice(column * perColumn, (column + 1) * perColumn),
  ).filter((group) => group.length > 0);
}

function tileFor(lengths: readonly number[], columns: number, width: number, height: number) {
  const groups = splitIntoColumns(lengths, columns);
  // Each column is as wide as its longest row: L tiles and L - 1 gaps.
  const widest = groups.map((group) => Math.max(...group));
  const letters = widest.reduce((sum, length) => sum + length, 0);
  const fixedWidth =
    widest.reduce((sum, length) => sum + (length - 1) * TILE_GAP, 0) +
    (groups.length - 1) * COLUMN_GAP;
  const rows = Math.max(...groups.map((group) => group.length));
  const byWidth = (width - fixedWidth) / letters;
  const byHeight = (height - (rows - 1) * TILE_GAP) / rows;
  return Math.max(0, Math.min(MAX_TILE, byWidth, byHeight));
}

/**
 * The layout giving the biggest tiles that fit: one column, or two when the rows are many
 * and the space is short. One column wins ties.
 * @param lengths Letters in each row, in board order.
 * @param width Space available, in pixels.
 * @param height Space available, in pixels.
 */
export function boardLayout(
  lengths: readonly number[],
  width: number,
  height: number,
): BoardLayout {
  const one = tileFor(lengths, 1, width, height);
  const two = lengths.length > 1 ? tileFor(lengths, 2, width, height) : 0;
  return two > one ? { columns: 2, tile: Math.floor(two) } : { columns: 1, tile: Math.floor(one) };
}
