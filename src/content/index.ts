import dictionaryUrl from './es/dictionary.txt?url';
import frequencyUrl from './es/frequency.txt?url';
import { spanish } from '../core/spanish';
import { buildWordList, parseWordList, type WordList } from './words';

async function fetchWordList(url: string): Promise<string[]> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return parseWordList(await response.text());
}

/** Downloads the current language's word lists. Only Spanish exists for now. */
export async function loadWords(): Promise<WordList> {
  const [dictionary, frequency] = await Promise.all([
    fetchWordList(dictionaryUrl),
    fetchWordList(frequencyUrl),
  ]);
  return buildWordList(dictionary, frequency, spanish);
}
