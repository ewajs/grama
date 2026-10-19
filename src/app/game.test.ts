import { describe, expect, it } from 'vitest';
import { tierFor } from '../core/cadence';
import { NEW_PROGRESS } from '../core/progress';
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
  const game = new Game(
    words,
    NEW_PROGRESS,
    () => {},
    () => date.now,
  );
  return { game, date };
}

/** Finds every target of the level on screen. */
function finish(game: Game) {
  for (const word of game.level.targets) game.submit(word);
}

describe('Game', () => {
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
});
