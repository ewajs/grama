import { describe, expect, it } from 'vitest';
import { NEW_GAME } from '../core/game';
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
  const saved = { ...NEW_GAME, levelNumber: 12, score: 480, found: ['CASA'] };

  it('continues the saved game, or starts a new one', () => {
    expect(startState(saved, null)).toBe(saved);
    expect(startState(null, null)).toEqual(NEW_GAME);
    expect(startState(null, null, 'relaxed').difficulty).toBe('relaxed');
  });

  it('jumps to the level in the URL, keeping the score', () => {
    expect(startState(saved, 40)).toMatchObject({ levelNumber: 40, score: 480, found: [] });
  });
});
