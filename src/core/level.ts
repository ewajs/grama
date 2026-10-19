/** A puzzle: the letters on the wheel and the words they spell. Words are normalized. */
export type Level = {
  /** Letters on the wheel. A letter may repeat, e.g. two `A`s for `ASADO`. */
  letters: readonly string[];
  /** Words the player must find to complete the level. They make up the board. */
  targets: readonly string[];
  /** Other valid words the letters spell. Worth points, but not required. */
  bonus: readonly string[];
};

/** Shortest word the game accepts. */
export const MIN_WORD_LENGTH = 3;

/** Fewest letters a level's wheel can have. */
export const MIN_LEVEL_LETTERS = 6;

/**
 * Whether `word` can be spelled with `letters`, using each letter at most once.
 * @example canSpell(['S', 'O', 'L'], 'LOS') // true
 * @example canSpell(['S', 'O', 'L'], 'SOLO') // false: only one O
 */
export function canSpell(letters: readonly string[], word: string): boolean {
  const available = [...letters];
  for (const letter of word) {
    const index = available.indexOf(letter);
    if (index === -1) return false;
    available.splice(index, 1);
  }
  return true;
}

/**
 * Lists what makes a level unplayable or unfair (rules in docs/GAME.md › Level shape).
 * @returns Human-readable problems; empty when the level is valid.
 */
export function levelProblems(level: Level): string[] {
  const problems: string[] = [];
  const words = [...level.targets, ...level.bonus];

  if (level.letters.length < MIN_LEVEL_LETTERS) {
    problems.push(`has ${level.letters.length} letters, needs at least ${MIN_LEVEL_LETTERS}`);
  }
  for (const word of words) {
    if (word.length < MIN_WORD_LENGTH) problems.push(`${word} is too short`);
    if (!canSpell(level.letters, word)) problems.push(`${word} can't be spelled`);
  }
  const seen = new Set<string>();
  for (const word of words) {
    if (seen.has(word)) problems.push(`${word} appears twice`);
    seen.add(word);
  }
  if (!level.targets.some((word) => word.length === level.letters.length)) {
    problems.push('no target uses every letter');
  }
  return problems;
}
