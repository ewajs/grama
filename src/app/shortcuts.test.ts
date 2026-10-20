import { describe, expect, it } from 'vitest';
import { shortcutFromUrl } from './shortcuts';

describe('shortcutFromUrl', () => {
  it('reads ?ir=', () => {
    expect(shortcutFromUrl('?ir=desafio')).toBe('daily');
    expect(shortcutFromUrl('?ir=contrarreloj')).toBe('trial');
    expect(shortcutFromUrl('?ir=diccionario')).toBe('dictionary');
  });

  it('is null when missing or unknown', () => {
    for (const search of ['', '?ir=', '?ir=mapa', '?nivel=3', '?ir=toString']) {
      expect(shortcutFromUrl(search)).toBeNull();
    }
  });
});
