import { describe, expect, it } from 'vitest';
import { expand, parseAffixes } from './hunspell.ts';

const affixes = parseAffixes(`
SET UTF-8
FLAG UTF-8
SFX S Y 2
SFX S 0 s [aeiou]
SFX S 0 es [^aeiou]
SFX F Y 1
SFX F o a/S o
PFX R Y 1
PFX R 0 re .
SFX V N 1
SFX V er és er
`);

describe('expand', () => {
  it('keeps the stem of an entry without flags', () => {
    expect(expand('che', affixes)).toEqual(['che']);
  });

  it('applies suffixes whose condition matches', () => {
    expect(expand('casa/S', affixes).sort()).toEqual(['casa', 'casas']);
    expect(expand('flor/S', affixes).sort()).toEqual(['flor', 'flores']);
  });

  it('strips before adding', () => {
    expect(expand('tener/V', affixes).sort()).toEqual(['tener', 'tenés']);
  });

  it('applies the suffixes a suffix allows in turn', () => {
    expect(expand('gato/FS', affixes).sort()).toEqual(['gata', 'gatas', 'gato', 'gatos']);
  });

  it('combines prefixes with the stem and with cross-product suffixes', () => {
    expect(expand('mesa/SR', affixes).sort()).toEqual(['mesa', 'mesas', 'remesa', 'remesas']);
  });

  it('ignores morphological fields after the flags', () => {
    expect(expand('casa/S po:noun', affixes).sort()).toEqual(['casa', 'casas']);
  });
});
