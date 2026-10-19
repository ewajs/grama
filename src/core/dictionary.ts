/**
 * Tu diccionario: every word the player has found, on any level, daily or Contrarreloj
 * run, each once.
 * @module
 */

/** The words a player has found, normalized, each once, in the order found. */
export type Dictionary = readonly string[];

/** A dictionary with no words yet. */
export const NEW_DICTIONARY: Dictionary = [];

/**
 * Adds the words it doesn't have yet, at the end, in the order given.
 * @returns The same dictionary when none of them is new.
 * @example collect(['SOL'], ['SAL', 'SOL', 'SAL']) // ['SOL', 'SAL']
 */
export function collect(dictionary: Dictionary, words: readonly string[]): Dictionary {
  const known = new Set(dictionary);
  const added: string[] = [];
  for (const word of words) {
    if (known.has(word)) continue;
    known.add(word);
    added.push(word);
  }
  return added.length === 0 ? dictionary : [...dictionary, ...added];
}
