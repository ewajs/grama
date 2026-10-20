import { describe, expect, it } from 'vitest';
import blocklistText from '../../../scripts/blocklist-es.txt?raw';
import { occurrence, tierFor } from '../../core/cadence';
import { DAILY_EPOCH, dailyTier, generateDaily } from '../../core/daily';
import { RECIPES, TIERS } from '../../core/difficulty';
import { generateLevel, levelShape, LEVELS_VERSION } from '../../core/generate';
import { THREE_STAR_BONUS } from '../../core/history';
import { newRun, pass, RAMP, wheelOf } from '../../core/time-trial';
import { levelProblems } from '../../core/level';
import { spanish } from '../../core/spanish';
import { buildWordList, parseWordList } from '../words';
import curatedText from './argentina.txt?raw';
import dictionaryText from './dictionary.txt?raw';
import frequencyText from './frequency.txt?raw';

// The shipped Spanish lists, checked together with the generator on real data.
const lists = {
  dictionary: parseWordList(dictionaryText),
  frequency: parseWordList(frequencyText),
  curated: parseWordList(curatedText),
};
const { words, spellings } = buildWordList(lists, spanish);
const normalized = (list: readonly string[]) => new Set(list.map(spanish.normalize));
const dictionary = normalized(lists.dictionary);
const curated = normalized(lists.curated);

describe('Spanish word lists', () => {
  it('know how words are written', () => {
    expect(spellings.get('TENES')).toBe('TENÉS');
    expect(spellings.get('PODES')).toBe('PODÉS');
    expect(spellings.get('ARBOL')).toBe('ÁRBOL');
    expect(spellings.get('CHABON')).toBe('CHABÓN');
  });

  it('only offer dictionary or curated words as targets', () => {
    const targetable = words.slice(0, RECIPES.extra.pool);
    expect(targetable.every((word) => dictionary.has(word) || curated.has(word))).toBe(true);
  });

  it('let every curated Argentine word be a target', () => {
    const targetable = new Set(words.slice(0, RECIPES.extra.pool));
    expect([...curated].filter((word) => !targetable.has(word))).toEqual([]);
  });

  it('accept only real words: names, English and web noise from the frequency list are out', () => {
    const valid = new Set(words);
    for (const junk of ['THE', 'AND', 'MADRID', 'GARCIA', 'JAJAJA', 'GOOGLE']) {
      expect(valid.has(junk), junk).toBe(false);
    }
  });

  it('keep blocked words out of the curated list', () => {
    const blocked = normalized(parseWordList(blocklistText));
    expect([...curated].filter((word) => blocked.has(word))).toEqual([]);
  });

  it('generate valid levels of every size and tier', () => {
    const numbers = [...Array(20).keys()].map((index) => index + 1);
    for (const number of [...numbers, 25, 40, 41, 60, 100, 500, 1000]) {
      for (const tier of TIERS) {
        const level = generateLevel(words, number, tier);
        const shape = levelShape(number, tier);
        expect(levelProblems(level), `level ${number} ${tier}`).toEqual([]);
        expect(level.letters).toHaveLength(shape.letters);
        expect(level.targets.length).toBeLessThanOrEqual(shape.targets);
        expect(level.targets.every((word) => word.length >= shape.shortestTarget)).toBe(true);
      }
    }
  });

  it('ask harder tiers for more targets, on average', () => {
    const average = (tier: (typeof TIERS)[number]) => {
      let total = 0;
      for (let number = 41; number < 71; number++) {
        total += generateLevel(words, number, tier, number).targets.length;
      }
      return total / 30;
    };
    const averages = TIERS.map(average);
    expect(averages, averages.join(' < ')).toEqual(averages.toSorted((a, b) => a - b));
    expect(new Set(averages).size).toBe(TIERS.length);
  });

  // 600 levels take ~4 s, past Vitest's 5 s default when the machine is busy.
  it('never repeat a level within 50 levels', { timeout: 15_000 }, () => {
    const lastSeen = new Map<string, number>();
    for (let number = 1; number <= 600; number++) {
      const tier = tierFor(number, 'normal');
      const level = generateLevel(words, number, tier, occurrence(number, 'normal'));
      const letters = level.letters.toSorted().join('');
      const previous = lastSeen.get(letters);
      if (previous !== undefined) expect(number - previous, `level ${number}`).toBeGreaterThan(50);
      lastSeen.set(letters, number);
    }
  });

  it('almost always land in the tier the cadence asks for, quickly', () => {
    const start = performance.now();
    let hits = 0;
    const count = 210;
    for (let number = 1; number <= count; number++) {
      if (
        generateLevel(words, number, tierFor(number, 'normal')).tier === tierFor(number, 'normal')
      )
        hits++;
    }
    const perLevel = (performance.now() - start) / count;
    expect(hits / count).toBeGreaterThan(0.98);
    expect(perLevel).toBeLessThan(150);
  });

  it('make a valid daily challenge of the right tier every day, never a recent one', () => {
    // Main 7-letter levels (16-40) at every difficulty: a daily must not be one of them.
    const key = (letters: readonly string[]) => letters.toSorted().join('');
    const main = new Set<string>();
    for (const difficulty of ['relaxed', 'normal', 'challenging'] as const) {
      for (let number = 16; number <= 40; number++) {
        const tier = tierFor(number, difficulty);
        main.add(key(generateLevel(words, number, tier, occurrence(number, difficulty)).letters));
      }
    }
    const seen = new Set<string>();
    // About seven months: how long each weekday tier lasts before a daily repeats (D19).
    for (let number = 1; number <= 200; number++) {
      const date = new Date(Date.UTC(2026, 9, 18 + number)).toISOString().slice(0, 10);
      const daily = generateDaily(words, date);
      expect(levelProblems(daily), date).toEqual([]);
      expect(daily.letters).toHaveLength(7);
      expect(daily.tier, date).toBe(dailyTier(date));
      expect(daily.bonus.length, date).toBeGreaterThanOrEqual(THREE_STAR_BONUS);
      expect(main.has(key(daily.letters)), date).toBe(false);
      expect(seen.has(key(daily.letters)), date).toBe(false);
      seen.add(key(daily.letters));
    }
  });

  it('make valid Contrarreloj wheels that get harder, quickly', () => {
    const start = performance.now();
    for (const seed of [1, 4242, 987_654_321]) {
      let run = newRun(seed);
      for (let wheel = 0; wheel < 20; wheel++) {
        const level = wheelOf(words, run);
        const step = RAMP.findLast(({ from }) => from <= wheel);
        expect(levelProblems(level), `${seed}/${wheel}`).toEqual([]);
        expect(level.letters).toHaveLength(step?.shape.letters ?? 0);
        run = pass({ ...run, timeLeft: 60_000 });
      }
    }
    expect((performance.now() - start) / 60).toBeLessThan(50);
  });

  it('make the same levels until LEVELS_VERSION says otherwise', () => {
    const levels = [];
    for (let number = 1; number <= 100; number++) {
      const tier = tierFor(number, 'normal');
      levels.push(generateLevel(words, number, tier, occurrence(number, 'normal')));
    }
    const epoch = Date.parse(DAILY_EPOCH);
    for (let day = 0; day < 60; day++) {
      const date = new Date(epoch + day * 86_400_000).toISOString().slice(0, 10);
      levels.push(generateDaily(words, date));
    }
    // A new hash means players would get other levels: if that's intended, bump
    // LEVELS_VERSION (saves then drop their levels in play) and update both numbers here.
    expect({ LEVELS_VERSION, hash: hash(JSON.stringify(levels)) }).toEqual({
      LEVELS_VERSION: 2,
      hash: '7e3cd055',
    });
  });
});

/** A short fingerprint of a text (FNV-1a, 32 bits): enough to notice any change. */
function hash(text: string): string {
  let value = 0x811c9dc5;
  for (let index = 0; index < text.length; index++) {
    value = Math.imul(value ^ text.charCodeAt(index), 0x01000193) >>> 0;
  }
  return value.toString(16).padStart(8, '0');
}
