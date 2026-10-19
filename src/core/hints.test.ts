import { describe, expect, it } from 'vitest';
import { NEW_GAME, nextLevel, submitWord } from './game';
import {
  BONUS_WORDS_PER_HINT,
  EXTRA_HARD_HINTS,
  hintTarget,
  revealLetter,
  STARTING_HINTS,
} from './hints';
import type { Level } from './level';

const level: Level = {
  letters: ['S', 'A', 'L', 'T', 'O', 'P'],
  targets: ['PLATOS', 'SOL', 'PATO', 'SAL'],
  bonus: ['OLA', 'LOS', 'LAS', 'TOS', 'ASO', 'OSA'],
  tier: 'medium',
};

describe('earning hints', () => {
  it('starts the game with a few', () => {
    expect(NEW_GAME.hints).toBe(STARTING_HINTS);
  });

  it(`earns one every ${BONUS_WORDS_PER_HINT} bonus words`, () => {
    let state = NEW_GAME;
    for (const word of level.bonus.slice(0, BONUS_WORDS_PER_HINT)) {
      state = submitWord(state, level, word).state;
    }
    expect(state.hints).toBe(STARTING_HINTS + 1);
    expect(state.bonusTowardHint).toBe(0);
    state = submitWord(state, level, level.bonus[BONUS_WORDS_PER_HINT]!).state;
    expect(state.bonusTowardHint).toBe(1);
  });

  it('earns one for finishing an extra-hard level', () => {
    const extra = { ...level, tier: 'extra' as const };
    let state = NEW_GAME;
    for (const word of extra.targets) state = submitWord(state, extra, word).state;
    expect(state.hints).toBe(STARTING_HINTS + EXTRA_HARD_HINTS);
    let easy = NEW_GAME;
    for (const word of level.targets) easy = submitWord(easy, level, word).state;
    expect(easy.hints).toBe(STARTING_HINTS);
  });

  it('does not count targets', () => {
    expect(submitWord(NEW_GAME, level, 'SOL').state.bonusTowardHint).toBe(0);
  });
});

describe('hintTarget', () => {
  it('picks the target showing the fewest letters, shortest first', () => {
    expect(hintTarget(level, [], {})).toBe('SOL');
    expect(hintTarget(level, [], { SOL: 1 })).toBe('SAL');
    expect(hintTarget(level, [], { SOL: 1, SAL: 1 })).toBe('PATO');
  });

  it('skips found targets', () => {
    expect(hintTarget(level, ['SOL'], {})).toBe('SAL');
  });

  it('never reveals the last letter of a word', () => {
    const almost = { SOL: 2, SAL: 2, PATO: 3, PLATOS: 5 };
    expect(hintTarget(level, [], almost)).toBeNull();
  });
});

describe('revealLetter', () => {
  it('spends a hint to show one more letter', () => {
    const state = revealLetter(NEW_GAME, level);
    expect(state.hints).toBe(STARTING_HINTS - 1);
    expect(state.revealed).toEqual({ SOL: 1 });
  });

  it('does nothing without hints or anything left to reveal', () => {
    const broke = { ...NEW_GAME, hints: 0 };
    expect(revealLetter(broke, level)).toBe(broke);
    const done = { ...NEW_GAME, found: ['PLATOS', 'SOL', 'PATO', 'SAL'] };
    expect(revealLetter(done, level)).toBe(done);
  });

  it('keeps hints, but not revealed letters, for the next level', () => {
    const state = nextLevel(revealLetter(NEW_GAME, level));
    expect(state.hints).toBe(STARTING_HINTS - 1);
    expect(state.revealed).toEqual({});
  });
});
