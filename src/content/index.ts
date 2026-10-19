/**
 * Loading the current language's word lists.
 * @module
 */

import { spanish } from '../core/spanish';
import curatedUrl from './es/argentina.txt?url';
import dictionaryUrl from './es/dictionary.txt?url';
import frequencyUrl from './es/frequency.txt?url';
import { buildWordList, parseWordList, type WordList } from './words';

async function fetchWordList(url: string): Promise<string[]> {
  // Low priority: the home screen (and its font) come first; only a level needs these.
  const response = await fetch(url, { priority: 'low' });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return parseWordList(await response.text());
}

/** Downloads the current language's word lists. Only Spanish exists for now. */
export async function loadWords(): Promise<WordList> {
  const [dictionary, frequency, curated] = await Promise.all([
    fetchWordList(dictionaryUrl),
    fetchWordList(frequencyUrl),
    fetchWordList(curatedUrl),
  ]);
  return buildWordList({ dictionary, frequency, curated }, spanish);
}
