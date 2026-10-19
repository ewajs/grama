import { describe, expect, it } from 'vitest';
import { BONUS_WORDS_PER_HINT, EXTRA_HARD_HINTS, STARTING_HINTS } from './hints';
import type { Level } from './level';
import { NEW_PROGRESS, nextLevel, playWord, useHint } from './progress';
import { NEW_SESSION, type Session } from './session';

const level: Level = {
  letters: ['S', 'A', 'L', 'T', 'O', 'P'],
  targets: ['PLATOS', 'SOL', 'PATO', 'SAL'],
  bonus: ['OLA', 'LOS', 'LAS', 'TOS', 'ASO', 'OSA'],
  tier: 'medium',
};

/** Plays words in turn, returning the final progress and session. */
function play(words: readonly string[], on = level) {
  let progress = NEW_PROGRESS;
  let session: Session = NEW_SESSION;
  for (const word of words) ({ progress, session } = playWord(progress, on, session, word));
  return { progress, session };
}

describe('playWord', () => {
  it('adds a word to the session and its points to the score', () => {
    const { progress, session } = play(['SOL', 'OLA']);
    expect(session.found).toEqual(['SOL', 'OLA']);
    expect(progress.score).toBe(36);
  });

  it('leaves both untouched for invalid and repeated words', () => {
    const { progress, session } = play(['SOL']);
    const again = playWord(progress, level, session, 'SOL');
    expect(again.progress).toBe(progress);
    expect(again.session).toBe(session);
    expect(playWord(progress, level, session, 'XYZ').progress).toBe(progress);
  });

  it('starts the game with a few hints', () => {
    expect(NEW_PROGRESS.hints).toBe(STARTING_HINTS);
  });

  it(`earns a hint every ${BONUS_WORDS_PER_HINT} bonus words`, () => {
    const { progress } = play(level.bonus.slice(0, BONUS_WORDS_PER_HINT));
    expect(progress.hints).toBe(STARTING_HINTS + 1);
    expect(progress.bonusTowardHint).toBe(0);
    expect(play(level.bonus.slice(0, 1)).progress.bonusTowardHint).toBe(1);
  });

  it('does not count targets toward hints', () => {
    expect(play(['SOL']).progress.bonusTowardHint).toBe(0);
  });

  it('earns a hint for finishing an extra-hard level', () => {
    const extra = { ...level, tier: 'extra' as const };
    expect(play(extra.targets, extra).progress.hints).toBe(STARTING_HINTS + EXTRA_HARD_HINTS);
    expect(play(level.targets).progress.hints).toBe(STARTING_HINTS);
  });
});

describe('useHint', () => {
  it('spends a hint to show one more letter', () => {
    const { progress, session } = useHint(NEW_PROGRESS, level, NEW_SESSION);
    expect(progress.hints).toBe(STARTING_HINTS - 1);
    expect(session.revealed).toEqual({ SOL: 1 });
  });

  it('does nothing without hints or anything left to reveal', () => {
    const broke = { ...NEW_PROGRESS, hints: 0 };
    expect(useHint(broke, level, NEW_SESSION).progress).toBe(broke);
    const done = { ...NEW_SESSION, found: level.targets };
    expect(useHint(NEW_PROGRESS, level, done).session).toBe(done);
  });
});

describe('nextLevel', () => {
  it('moves on with a fresh session, keeping the score and hints', () => {
    const { progress } = play(['SOL']);
    const used = useHint(progress, level, progress.session).progress;
    const next = nextLevel({ ...used, session: { found: ['SOL'], revealed: { SAL: 1 } } });
    expect(next).toMatchObject({ levelNumber: 2, score: 30, hints: STARTING_HINTS - 1 });
    expect(next.session).toBe(NEW_SESSION);
  });

  it('takes the difficulty for the new level', () => {
    expect(nextLevel(NEW_PROGRESS, 'challenging').difficulty).toBe('challenging');
  });
});
