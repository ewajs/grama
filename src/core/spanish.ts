import type { Language } from './language';

// Ñ is a letter of its own in Spanish, so it is deliberately absent here.
const WITHOUT_ACCENT: Record<string, string> = {
  Á: 'A',
  É: 'E',
  Í: 'I',
  Ó: 'O',
  Ú: 'U',
  Ü: 'U',
};

/**
 * Spanish word rules: words compare uppercase and without accents, keeping `Ñ`.
 * @example spanish.normalize('pingüino') // 'PINGUINO'
 * @example spanish.normalize('Ñandú') // 'ÑANDU'
 */
export const spanish: Language = {
  code: 'es',
  normalize: (word) =>
    word
      // Some sources write 'á' as 'a' + a separate accent mark; join them first.
      .normalize('NFC')
      .toLocaleUpperCase('es')
      .replace(/[ÁÉÍÓÚÜ]/g, (letter) => WITHOUT_ACCENT[letter] ?? letter),
};
