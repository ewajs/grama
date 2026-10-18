import { describe, expect, it } from 'vitest';
import { spanish } from './spanish';

describe('spanish.normalize', () => {
  it('uppercases', () => {
    expect(spanish.normalize('mate')).toBe('MATE');
  });

  it('removes acute accents', () => {
    expect(spanish.normalize('árbol')).toBe('ARBOL');
    expect(spanish.normalize('camión')).toBe('CAMION');
    expect(spanish.normalize('ÉXITO')).toBe('EXITO');
    expect(spanish.normalize('país')).toBe('PAIS');
    expect(spanish.normalize('tenés')).toBe('TENES');
    expect(spanish.normalize('útil')).toBe('UTIL');
  });

  it('removes the diaeresis', () => {
    expect(spanish.normalize('pingüino')).toBe('PINGUINO');
  });

  it('keeps Ñ as its own letter', () => {
    expect(spanish.normalize('ñandú')).toBe('ÑANDU');
    expect(spanish.normalize('AÑO')).toBe('AÑO');
  });

  it('handles accents written as separate combining marks', () => {
    const decomposed = 'árbol ñandu'; // á and ñ as letter + mark
    expect(spanish.normalize(decomposed)).toBe('ARBOL ÑANDU');
  });

  it('is idempotent', () => {
    const once = spanish.normalize('Ñandú');
    expect(spanish.normalize(once)).toBe(once);
  });
});
