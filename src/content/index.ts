import dictionaryUrl from './es/dictionary.txt?url';
import frequencyUrl from './es/frequency.txt?url';
import { parseWordList, rankWords } from './words';

async function fetchWordList(url: string): Promise<string[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return parseWordList(await response.text());
}

/**
 * Downloads the current language's word lists (only Spanish exists for now) and returns
 * every valid word, most common first: the input `generateLevel` expects.
 */
export async function loadWords(): Promise<string[]> {
  const [dictionary, frequency] = await Promise.all([
    fetchWordList(dictionaryUrl),
    fetchWordList(frequencyUrl),
  ]);
  return rankWords(dictionary, frequency);
}
