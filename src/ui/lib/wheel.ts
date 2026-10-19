/** A point on the wheel, as fractions of its width and height: (0, 0) is the top-left corner. */
export type Point = { x: number; y: number };

/** Distance from the wheel's center to each letter's center, as a fraction of the wheel. */
export const RING_RADIUS = 0.34;

/** Radius of a letter, as a fraction of the wheel. Also how close the pointer must get. */
export const LETTER_RADIUS = 0.1;

/** Center of letter `index` of `count`, spread evenly on the ring: the first at the top, clockwise. */
export function letterPosition(index: number, count: number): Point {
  const angle = -Math.PI / 2 + (2 * Math.PI * index) / count;
  return { x: 0.5 + RING_RADIUS * Math.cos(angle), y: 0.5 + RING_RADIUS * Math.sin(angle) };
}

/** Centers of all `count` letters on the ring (see {@link letterPosition}). */
export function letterPositions(count: number): Point[] {
  return Array.from({ length: count }, (_, index) => letterPosition(index, count));
}

/** Index of the letter under `point`, or `null` when the point is between letters. */
export function letterAt(point: Point, positions: readonly Point[]): number | null {
  const index = positions.findIndex(
    (center) => Math.hypot(center.x - point.x, center.y - point.y) <= LETTER_RADIUS,
  );
  return index === -1 ? null : index;
}

/**
 * The selected letters after the pointer reaches letter `index` while dragging.
 * A new letter is added; going back to the previous one undoes the last; anything else
 * (no letter, the current one, one already used) changes nothing.
 * @param path Indices of the selected letters, in order.
 */
export function extendPath(path: readonly number[], index: number | null): readonly number[] {
  if (index === null || index === path.at(-1)) return path;
  if (index === path.at(-2)) return path.slice(0, -1);
  if (path.includes(index)) return path;
  return [...path, index];
}
