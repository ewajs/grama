import { expect, it } from 'vitest';
import { levelFromUrl } from './url';

it('opens the level in ?nivel=', () => {
  expect(levelFromUrl('?nivel=37')).toBe(37);
});

it('opens level 1 when missing or not a positive whole number', () => {
  for (const search of ['', '?nivel=', '?nivel=0', '?nivel=-3', '?nivel=2.5', '?nivel=abc']) {
    expect(levelFromUrl(search)).toBe(1);
  }
});
