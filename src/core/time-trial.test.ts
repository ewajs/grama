import { describe, expect, it } from 'vitest';
import type { Level } from './level';
import {
  canPass,
  isOver,
  newRun,
  NEW_TRIAL_RECORD,
  recordRun,
  pass,
  PASS_COST,
  playTrialWord,
  START_TIME,
  tick,
  TIME_FOR,
  type Run,
} from './time-trial';

const level: Level = {
  letters: ['S', 'A', 'L', 'T', 'O', 'P'],
  targets: ['PLATOS', 'SOL', 'SAL'],
  bonus: ['OLA', 'LOS'],
  tier: 'easy',
};

const play = (run: Run, ...words: string[]) =>
  words.reduce((current, word) => playTrialWord(current, level, word).run, run);

describe('a run', () => {
  it(`starts with ${START_TIME / 1000} seconds and nothing won`, () => {
    expect(newRun(7)).toMatchObject({ timeLeft: START_TIME, points: 0, cleared: 0, wheel: 0 });
  });

  it('loses the time that passes, down to zero, and is then over', () => {
    const run = tick(newRun(7), 1_500);
    expect(run.timeLeft).toBe(START_TIME - 1_500);
    expect(isOver(tick(run, START_TIME))).toBe(true);
    expect(tick(run, START_TIME).timeLeft).toBe(0);
  });

  it('wins points and time for targets and bonus words, nothing for the rest', () => {
    const run = play(newRun(7), 'SOL', 'OLA', 'XYZ', 'SOL');
    expect(run.timeLeft).toBe(START_TIME + TIME_FOR.target + TIME_FOR.bonus);
    expect(run.points).toBe(30 + 6);
    expect(run.words).toBe(2);
  });

  it('brings the next wheel, and more time, when the board is done', () => {
    const run = play(newRun(7), 'SOL', 'SAL', 'PLATOS');
    expect(run).toMatchObject({ wheel: 1, cleared: 1 });
    expect(run.session.found).toEqual([]);
    expect(run.timeLeft).toBe(START_TIME + 3 * TIME_FOR.target + TIME_FOR.clear);
  });

  it('counts nothing once the time is up', () => {
    const over = tick(newRun(7), START_TIME);
    expect(play(over, 'SOL')).toBe(over);
  });
});

describe('pass', () => {
  it('skips to a new wheel for a price', () => {
    const run = pass(play(newRun(7), 'SOL'));
    expect(run).toMatchObject({ wheel: 1, cleared: 0 });
    expect(run.session.found).toEqual([]);
    expect(run.timeLeft).toBe(START_TIME + TIME_FOR.target - PASS_COST);
  });

  it('is not possible when it would end the run', () => {
    const late = tick(newRun(7), START_TIME - PASS_COST);
    expect(canPass(late)).toBe(false);
    expect(pass(late)).toBe(late);
  });
});

describe('recordRun', () => {
  it('counts runs and keeps the best points and the most wheels', () => {
    let record = recordRun(NEW_TRIAL_RECORD, { points: 300, cleared: 2, words: 12 });
    record = recordRun(record, { points: 200, cleared: 3, words: 10 });
    expect(record).toEqual({
      runs: 2,
      best: { points: 300, cleared: 2, words: 12 },
      mostCleared: 3,
    });
  });
});
