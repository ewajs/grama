import { describe, expect, it } from 'vitest';
import { tierFor } from '../core/cadence';
import { NEW_PROGRESS } from '../core/progress';
import { NEW_SESSION } from '../core/session';
import { NEW_TRIAL_RECORD } from '../core/time-trial';
import { Game } from './game.svelte';

// A small list, most common first, with enough 6-letter words for the first levels.
const words = {
  words: [
    'SOL',
    'SAL',
    'PATO',
    'SOPA',
    'ALTO',
    'PLATO',
    'SALTO',
    'PLATOS',
    'CAMINO',
    'MANO',
    'CIMA',
    'COMA',
    'AMO',
    'CAMION',
    'ROSA',
    'DOS',
    'SODA',
    'ASADOR',
    'ROSADA',
    'DAR',
    'POSTAL',
    'LAPSO',
    'OLA',
    'TOS',
    'IMAN',
    'ANIMO',
    'COIMA',
    'ARADO',
    'ASADO',
    'ODA',
  ],
  spellings: new Map<string, string>(),
};

/** A game on the small list, with a clock that says whatever `date.now` says. */
function newGame() {
  const date = { now: '2026-10-19' };
  const game = new Game(NEW_PROGRESS, { clock: () => date.now });
  game.words = words;
  return { game, date };
}

/** Finds every target of the level on screen. */
function finish(game: Game) {
  for (const word of game.level.targets) game.submit(word);
}

describe('Game', () => {
  it('waits for its words before a level can be played', () => {
    const game = new Game(NEW_PROGRESS);
    expect(game.ready).toBe(false);
    expect(game.currentLevel).toBe(1);
    game.words = words;
    expect(game.ready).toBe(true);
    expect(game.level.letters).toHaveLength(6);
  });

  it('plays a replay apart from the current level, which it never moves', () => {
    const { game } = newGame();
    finish(game);
    game.next('normal');
    const score = game.score;

    game.replay(1);
    expect(game).toMatchObject({ replaying: true, levelNumber: 1, currentLevel: 2 });
    game.submit(game.level.targets[0] ?? '');
    expect(game.board.some((row) => row.word !== null)).toBe(true);
    expect(game.score).toBe(score);

    game.playCurrent();
    expect(game).toMatchObject({ replaying: false, levelNumber: 2 });
    expect(game.board.every((row) => row.word === null)).toBe(true);
  });

  it('tells the current level and its tier whatever is on screen', () => {
    const { game } = newGame();
    finish(game);
    game.next('challenging');
    game.replay(1);
    expect(game.currentLevel).toBe(2);
    expect(game.currentTier).toBe(tierFor(2, 'challenging'));
    game.playDaily();
    expect(game.currentLevel).toBe(2);
  });

  it('reads the date from its clock, again when asked', () => {
    const { game, date } = newGame();
    expect(game.today).toMatchObject({ date: '2026-10-19', number: 1, tier: 'easy' });
    date.now = '2026-10-21';
    expect(game.today.date).toBe('2026-10-19');
    game.refreshDate();
    expect(game.today).toMatchObject({ date: '2026-10-21', number: 3, tier: 'medium' });
  });

  it('keeps the daily on screen when the day changes', () => {
    const { game, date } = newGame();
    expect(game.dailyOnScreen).toBeNull();
    game.playDaily();
    date.now = '2026-10-20';
    game.refreshDate();
    expect(game.dailyOnScreen).toMatchObject({ date: '2026-10-19', number: 1 });
    expect(game.today.date).toBe('2026-10-20');
  });

  it('keeps Contrarreloj runs apart from the main progress, for stats and achievements', () => {
    let saved = NEW_TRIAL_RECORD;
    const game = new Game(NEW_PROGRESS, { ontrials: (trials) => (saved = trials) });
    game.recordRun({ points: 520, cleared: 3, words: 20 });
    expect(game.trialBest?.points).toBe(520);
    expect(saved.runs).toBe(1);
    expect(game.score).toBe(0);
    expect(game.achievements).toEqual(expect.arrayContaining(['trial', 'trialPoints']));
  });

  it('collects every word found in the dictionary, replays included', () => {
    let saved: readonly string[] = [];
    const game = new Game(NEW_PROGRESS, { ondictionary: (dictionary) => (saved = dictionary) });
    game.words = words;
    const [target] = game.level.targets;
    game.submit(target!);
    game.submit(target!);
    game.submit('XYZ');
    expect(game.dictionary).toEqual([target]);
    finish(game);
    game.next('normal');
    game.replay(1);
    const [bonus] = game.level.bonus;
    game.submit(bonus!);
    expect(game.dictionary).toEqual([...game.level.targets, bonus]);
    expect(saved).toEqual(game.dictionary);
  });

  it('takes Contrarreloj words, each once, telling which were new', () => {
    let saves = 0;
    const game = new Game(NEW_PROGRESS, { dictionary: ['SOL'], ondictionary: () => saves++ });
    expect(game.addToDictionary('SAL')).toBe(true);
    expect(game.addToDictionary('SOL')).toBe(false);
    expect(game.dictionary).toEqual(['SOL', 'SAL']);
    expect(saves).toBe(1);
  });

  it('tells which words were new to the dictionary on the level on screen', () => {
    const { game } = newGame();
    const [first, second] = game.level.targets;
    game.addToDictionary(first!);
    game.submit(first!);
    game.submit(second!);
    expect(game.newWords).toEqual([second]);
    expect(game.stats.dictionary).toBe(2);
    finish(game);
    game.next('normal');
    expect(game.newWords).toEqual([]);
  });

  it('starts with the words of the levels in play, saving only if that adds any', () => {
    let saved: readonly string[] | null = null;
    const progress = {
      ...NEW_PROGRESS,
      session: { ...NEW_SESSION, found: ['SOL', 'SAL'] },
      daily: { date: '2026-10-19', session: { ...NEW_SESSION, found: ['SAL', 'PATO'] } },
    };
    const game = new Game(progress, { ondictionary: (dictionary) => (saved = dictionary) });
    expect(game.dictionary).toEqual(['SOL', 'SAL', 'PATO']);
    expect(saved).toEqual(['SOL', 'SAL', 'PATO']);
    saved = null;
    new Game(progress, { dictionary: ['PATO', 'SOL', 'SAL'], ondictionary: (d) => (saved = d) });
    expect(saved).toBeNull();
  });
});
