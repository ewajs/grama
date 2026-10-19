import { describe, expect, it } from 'vitest';
import type { Level } from './level';
import {
  bonusWords,
  hintsUsed,
  isComplete,
  NEW_SESSION,
  sessionPoints,
  submitWord,
} from './session';

const level: Level = {
  letters: ['S', 'A', 'L', 'T', 'O', 'P'],
  targets: ['SOL', 'PLATOS'],
  bonus: ['OLA'],
  tier: 'medium',
};

describe('submitWord', () => {
  it('adds targets and bonus words to the words found', () => {
    const { session } = submitWord(NEW_SESSION, level, 'SOL');
    expect(submitWord(session, level, 'OLA').session.found).toEqual(['SOL', 'OLA']);
  });

  it('leaves the session untouched for invalid and repeated words', () => {
    const session = { ...NEW_SESSION, found: ['SOL'] };
    expect(submitWord(session, level, 'XYZ').session).toBe(session);
    expect(submitWord(session, level, 'SOL').session).toBe(session);
  });

  it('reports the outcome', () => {
    expect(submitWord(NEW_SESSION, level, 'OLA').submission.kind).toBe('bonus');
  });
});

describe('isComplete', () => {
  it('is complete once every target is found, in any order', () => {
    expect(isComplete(level, { ...NEW_SESSION, found: ['PLATOS', 'SOL'] })).toBe(true);
  });

  it('is not complete with targets missing, whatever bonus words were found', () => {
    expect(isComplete(level, { ...NEW_SESSION, found: ['SOL', 'OLA'] })).toBe(false);
  });
});

describe('a session in numbers', () => {
  const session = { found: ['SOL', 'OLA'], revealed: { PLATOS: 2, SOL: 1 } };

  it('adds up the points of every word found', () => {
    expect(sessionPoints(level, session)).toBe(36);
  });

  it('lists the bonus words found', () => {
    expect(bonusWords(level, session)).toEqual(['OLA']);
  });

  it('counts the hints spent', () => {
    expect(hintsUsed(session)).toBe(3);
  });
});
