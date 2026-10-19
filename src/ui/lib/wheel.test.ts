import { describe, expect, it } from 'vitest';
import {
  extendPath,
  HIT_RADIUS,
  LETTER_RADIUS,
  letterAt,
  letterPositions,
  RING_RADIUS,
  type Point,
} from './wheel';

describe('letterPositions', () => {
  it('places the first letter at the top and goes clockwise', () => {
    const [top, right, bottom, left] = letterPositions(4);
    expect(top?.x).toBeCloseTo(0.5);
    expect(top?.y).toBeCloseTo(0.5 - RING_RADIUS);
    expect(right?.x).toBeCloseTo(0.5 + RING_RADIUS);
    expect(bottom?.y).toBeCloseTo(0.5 + RING_RADIUS);
    expect(left?.x).toBeCloseTo(0.5 - RING_RADIUS);
  });

  it('keeps letters from overlapping, even with 10 of them', () => {
    const [first, second] = letterPositions(10);
    const gap = Math.hypot(first!.x - second!.x, first!.y - second!.y);
    expect(gap).toBeGreaterThan(2 * LETTER_RADIUS);
  });
});

describe('dragging straight from letter to letter', () => {
  // Closest a point of segment a-b gets to point p.
  function distanceToSegment(p: Point, a: Point, b: Point) {
    const [dx, dy] = [b.x - a.x, b.y - a.y];
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(a.x + t * dx - p.x, a.y + t * dy - p.y);
  }

  it.each([6, 7, 8])('never passes over a third letter with %i letters', (count) => {
    const positions = letterPositions(count);
    for (const [i, a] of positions.entries())
      for (const [j, b] of positions.entries())
        for (const [k, other] of positions.entries()) {
          if (k === i || k === j || i === j) continue;
          expect(distanceToSegment(other, a, b), `${i}→${j} over ${k}`).toBeGreaterThan(HIT_RADIUS);
        }
  });
});

describe('letterAt', () => {
  const positions = letterPositions(6);

  it('finds the letter under the point', () => {
    const third = positions[2]!;
    expect(letterAt({ x: third.x + 0.05, y: third.y }, positions)).toBe(2);
  });

  it('finds nothing in the center or between letters', () => {
    expect(letterAt({ x: 0.5, y: 0.5 }, positions)).toBeNull();
    const [a, b] = positions;
    expect(letterAt({ x: (a!.x + b!.x) / 2, y: (a!.y + b!.y) / 2 }, positions)).toBeNull();
  });
});

describe('extendPath', () => {
  it('adds a new letter', () => {
    expect(extendPath([0, 3], 5)).toEqual([0, 3, 5]);
  });

  it('undoes the last letter when going back to the previous one', () => {
    expect(extendPath([0, 3, 5], 3)).toEqual([0, 3]);
  });

  it('ignores the current letter, gaps between letters and letters already used', () => {
    const path = [0, 3, 5];
    expect(extendPath(path, 5)).toBe(path);
    expect(extendPath(path, null)).toBe(path);
    expect(extendPath(path, 0)).toBe(path);
  });
});
