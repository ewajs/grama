import { readFileSync } from 'node:fs';
import { buildWordList, parseWordList } from '../../src/content/words';
import { spanish } from '../../src/core/spanish';
import { occurrence, tierFor } from '../../src/core/cadence';
import { dateKey, dailyNumber, generateDaily } from '../../src/core/daily';
import { generateLevel } from '../../src/core/generate';
import type { Level } from '../../src/core/level';

const read = (file: string) => parseWordList(readFileSync(`src/content/es/${file}`, 'utf8'));
const { words, spellings } = buildWordList(
  {
    dictionary: read('dictionary.txt'),
    frequency: read('frequency.txt'),
    curated: read('argentina.txt'),
  },
  spanish,
);

/** Level `number` exactly as the app generates it, so tests know its words. */
export function level(number: number): Level {
  return generateLevel(words, number, tierFor(number, 'normal'), occurrence(number, 'normal'));
}

/** Today's daily challenge, exactly as the app generates it, and its number. */
export function todaysDaily(): { level: Level; number: number } {
  const date = dateKey(new Date());
  return { level: generateDaily(words, date), number: dailyNumber(date) };
}

/** How the app writes a word, with its accents. */
export function written(word: string): string {
  return spellings.get(word) ?? word;
}

/** Three of the level's letters that don't spell any of its words. */
export function nonWord({ letters, targets, bonus }: Level): string {
  for (const a of letters.keys())
    for (const b of letters.keys())
      for (const c of letters.keys()) {
        if (a === b || b === c || a === c) continue;
        const word = `${letters[a]}${letters[b]}${letters[c]}`;
        if (!targets.includes(word) && !bonus.includes(word)) return word;
      }
  throw new Error('Every three-letter combination is a word');
}
