/**
 * The words of a shipped word-list file: one per line; `#` lines are its license header.
 */
export function parseWordList(text: string): string[] {
  return text.split('\n').filter((line) => line !== '' && !line.startsWith('#'));
}

/**
 * Combines a language's two lists into the generator's input: every valid word, most
 * common first. Frequent words that are also in the dictionary lead, in frequency order;
 * they're the only ones common enough to be targets (D12). The rest follow: dictionary
 * words, then frequent words the dictionary lacks (often names), valid but never targets.
 * @param dictionary Every valid word.
 * @param frequency Frequent words, most frequent first.
 */
export function rankWords(dictionary: readonly string[], frequency: readonly string[]): string[] {
  const valid = new Set(dictionary);
  const common = frequency.filter((word) => valid.has(word));
  const ranked = new Set(common);
  return [
    ...common,
    ...dictionary.filter((word) => !ranked.has(word)),
    ...frequency.filter((word) => !valid.has(word)),
  ];
}
