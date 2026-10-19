import { describe, expect, it } from 'vitest';
import { occurrence } from '../core/cadence';
import { currentPlace, NEW_PROGRESS } from '../core/progress';
import { NEW_SESSION } from '../core/session';
import { levelFromUrl, startState } from './start';

describe('levelFromUrl', () => {
  it('reads ?nivel=', () => {
    expect(levelFromUrl('?nivel=37')).toBe(37);
  });

  it('is null when missing or not a positive whole number', () => {
    for (const search of ['', '?nivel=', '?nivel=0', '?nivel=-3', '?nivel=2.5', '?nivel=abc']) {
      expect(levelFromUrl(search)).toBeNull();
    }
  });
});

describe('startState', () => {
  const saved = {
    ...NEW_PROGRESS,
    levelNumber: 12,
    score: 480,
    session: { ...NEW_SESSION, found: ['CASA'], revealed: {} },
  };

  it('continues the saved game, or starts a new one', () => {
    expect(startState(saved, null)).toBe(saved);
    expect(startState(null, null)).toEqual(NEW_PROGRESS);
    expect(startState(null, null, 'relaxed').difficulty).toBe('relaxed');
  });

  it('jumps to the level in the URL, keeping the score', () => {
    const jumped = startState(saved, 40);
    expect(jumped).toMatchObject({ levelNumber: 40, score: 480 });
    expect(jumped.session.found).toEqual([]);
    expect(currentPlace(jumped).occurrence).toBe(occurrence(40, 'normal'));
  });
});
