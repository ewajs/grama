import { describe, expect, it } from 'vitest';
import { isLevelComplete, NEW_GAME, nextLevel, submitWord } from './game';
import type { Level } from './level';

const level: Level = {
  letters: ['S', 'A', 'L', 'T', 'O', 'P'],
  targets: ['SOL', 'PLATOS'],
  bonus: ['OLA'],
};

describe('submitWord', () => {
  it('adds a target to the found words and its points to the score', () => {
    const { state } = submitWord(NEW_GAME, level, 'SOL');
    expect(state).toEqual({ levelIndex: 0, score: 30, found: ['SOL'] });
  });

  it('adds a bonus word the same way', () => {
    const { state } = submitWord({ ...NEW_GAME, score: 30, found: ['SOL'] }, level, 'OLA');
    expect(state).toEqual({ levelIndex: 0, score: 36, found: ['SOL', 'OLA'] });
  });

  it('leaves the state untouched for invalid and repeated words', () => {
    const state = { ...NEW_GAME, found: ['SOL'] };
    expect(submitWord(state, level, 'XYZ').state).toBe(state);
    expect(submitWord(state, level, 'SOL').state).toBe(state);
  });

  it('reports the outcome', () => {
    expect(submitWord(NEW_GAME, level, 'OLA').submission.kind).toBe('bonus');
  });
});

describe('isLevelComplete', () => {
  it('is complete once every target is found, in any order', () => {
    expect(isLevelComplete(level, ['PLATOS', 'SOL'])).toBe(true);
  });

  it('is not complete with targets missing, whatever bonus words were found', () => {
    expect(isLevelComplete(level, ['SOL', 'OLA'])).toBe(false);
  });
});

describe('nextLevel', () => {
  it('moves to the next level, clearing found words and keeping the score', () => {
    const state = { levelIndex: 0, score: 120, found: ['SOL', 'PLATOS'] };
    expect(nextLevel(state, 3)).toEqual({ levelIndex: 1, score: 120, found: [] });
  });

  it('starts over after the last level', () => {
    expect(nextLevel({ ...NEW_GAME, levelIndex: 2 }, 3).levelIndex).toBe(0);
  });
});
