import { describe, expect, it } from 'vitest';
import { boardLayout, COLUMN_GAP, MAX_TILE, splitIntoColumns, TILE_GAP } from './board-layout';

describe('splitIntoColumns', () => {
  it('fills columns top to bottom, the first taking the odd row', () => {
    expect(splitIntoColumns([1, 2, 3, 4, 5], 2)).toEqual([
      [1, 2, 3],
      [4, 5],
    ]);
  });

  it('never makes an empty column', () => {
    expect(splitIntoColumns([1], 2)).toEqual([[1]]);
  });
});

describe('boardLayout', () => {
  const rows = [3, 3, 3, 4, 4, 5, 6, 6];

  it('uses one column when there is height to spare', () => {
    expect(boardLayout(rows, 600, 1000)).toEqual({ columns: 1, tile: MAX_TILE });
  });

  it('switches to two columns when height is short, for bigger tiles', () => {
    const layout = boardLayout(rows, 360, 260);
    expect(layout.columns).toBe(2);
    expect(layout.tile).toBeGreaterThan(boardLayoutOneColumnTile(rows, 360, 260));
  });

  it('fits the widest columns within the width', () => {
    const { tile } = boardLayout(rows, 360, 260);
    // Columns: [3,3,3,4] and [4,5,6,6]: widest rows of 4 and 6 letters.
    const width = 10 * tile + 8 * TILE_GAP + COLUMN_GAP;
    expect(width).toBeLessThanOrEqual(360);
  });
});

/** Tile size if forced into one column: limited by the number of rows. */
function boardLayoutOneColumnTile(lengths: number[], width: number, height: number) {
  const byHeight = (height - (lengths.length - 1) * TILE_GAP) / lengths.length;
  const longest = Math.max(...lengths);
  const byWidth = (width - (longest - 1) * TILE_GAP) / longest;
  return Math.min(byHeight, byWidth);
}
