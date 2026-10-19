import { expect, it } from 'vitest';
import { notesOf } from './sound';

it("climbs a scale as a word's letters are added, up to a top note", () => {
  const pitches = [1, 2, 3, 4, 12].map((step) => notesOf('letter', step)[0]?.frequency ?? 0);
  expect(pitches.slice(0, 4)).toEqual([...pitches.slice(0, 4)].sort((a, b) => a - b));
  expect(pitches[4]).toBe(notesOf('letter', 9)[0]?.frequency);
});

it('gives every sound short notes', () => {
  for (const kind of ['letter', 'target', 'bonus', 'invalid', 'complete'] as const) {
    const notes = notesOf(kind);
    expect(notes.length).toBeGreaterThan(0);
    expect(Math.max(...notes.map(({ at, duration }) => at + duration))).toBeLessThan(1);
  }
});
