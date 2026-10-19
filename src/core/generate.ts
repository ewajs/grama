/**
 * The level generator: turns a word list, a level number, a tier and an occurrence into
 * a {@link core/level!Level | Level}, deterministically. Also how big levels are as the player
 * progresses. See the Difficulty guide for how seeds are chosen.
 * @module
 */

import { classify, levelScore, RECIPES, TIERS, type Tier } from './difficulty';
import { canSpell, MIN_WORD_LENGTH, type Level } from './level';
import { seededRandom, shuffled } from './random';

/** How big a level is. Grows with progress; how hard it is comes from its tier. */
export type LevelShape = {
  /** Letters on the wheel. */
  letters: number;
  /** Most targets on the board. */
  targets: number;
  /** Shortest target word; shorter words can still be bonus words. */
  shortestTarget: number;
};

/** Level sizes as the player progresses: each step applies from level `from` on. */
export const SIZES: readonly (LevelShape & { from: number })[] = [
  { from: 1, letters: 6, targets: 6, shortestTarget: 3 },
  { from: 6, letters: 6, targets: 7, shortestTarget: 3 },
  { from: 16, letters: 7, targets: 8, shortestTarget: 3 },
  // More targets than this won't fit a small phone with readable tiles.
  { from: 41, letters: 8, targets: 9, shortestTarget: 4 },
];

/** The shape of level `levelNumber`, from {@link SIZES}. */
export function levelShape(levelNumber: number): LevelShape {
  const step = SIZES.findLast(({ from }) => from <= levelNumber) ?? SIZES[0];
  if (!step) throw new Error('No level sizes defined');
  return step;
}

/** Fewest targets a generated level may have; fewer would make a dull board. */
export const MIN_TARGETS = 5;

/**
 * Seed words each level has to itself, in its tier's seed order: it looks for one that
 * makes a level of its tier among them. Levels never share a block, so a level only
 * comes back once its tier's whole order has been used.
 */
export const SEED_BLOCK = 3;

/**
 * When no seed in its block lands in its tier, how many seeds a level tries from the far
 * side of the order (used about half a cycle away) before settling for another tier.
 */
export const FAR_TRIES = 12;

type Ranked = { word: string; rank: number };

/** Letters a word uses, one bit each: a cheap first check before `canSpell`. */
function letterMask(word: string): number {
  let mask = 0;
  for (const letter of word) mask |= 1 << (letter === 'Ñ' ? 26 : letter.charCodeAt(0) - 65);
  return mask;
}

// Computed once per word list, then reused for every level.
const masks = new WeakMap<readonly string[], Uint32Array>();

function masksOf(words: readonly string[]): Uint32Array {
  let list = masks.get(words);
  if (!list) {
    list = Uint32Array.from(words, letterMask);
    masks.set(words, list);
  }
  return list;
}

// Seed orders per word list and kind of level ("tier:letters"), computed once each.
const seedOrders = new WeakMap<readonly string[], Map<string, string[]>>();

/**
 * The fixed order in which levels of a tier and size take their seed words. Each tier
 * draws seeds from its own band of the list (easy from the most common words, extra
 * hard from beyond hard's pool), and each set of letters appears once across all
 * tiers, so levels of different tiers never share letters.
 */
function seedOrder(words: readonly string[], tier: Tier, letters: number): string[] {
  const cache = seedOrders.get(words) ?? new Map<string, string[]>();
  seedOrders.set(words, cache);
  const key = `${tier}:${letters}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const index = TIERS.indexOf(tier);
  const previous = TIERS[index - 1];
  const bandStart = previous ? RECIPES[previous].pool : 0;
  const sorted = (word: string) => [...word].sort().join('');
  const taken = new Set(
    words
      .slice(0, bandStart)
      .filter((word) => word.length === letters)
      .map(sorted),
  );
  const band: string[] = [];
  for (const word of words.slice(bandStart, RECIPES[tier].pool)) {
    if (word.length !== letters || taken.has(sorted(word))) continue;
    taken.add(sorted(word));
    band.push(word);
  }
  // A list too small to have words in this band (as in tests) uses the whole pool.
  const seeds =
    band.length > 0
      ? band
      : words.slice(0, RECIPES[tier].pool).filter((word) => word.length === letters);
  const order = shuffled(seeds, seededRandom(letters * TIERS.length + index));
  cache.set(key, order);
  return order;
}

/** Every word the letters spell, with its rank. */
function wordsSpelled(words: readonly string[], letters: readonly string[]): Ranked[] {
  const wordMasks = masksOf(words);
  const available = letterMask(letters.join(''));
  const spelled: Ranked[] = [];
  for (const [rank, word] of words.entries()) {
    if (word.length < MIN_WORD_LENGTH || word.length > letters.length) continue;
    if (((wordMasks[rank] ?? 0) & ~available) !== 0) continue;
    if (canSpell(letters, word)) spelled.push({ word, rank });
  }
  return spelled;
}

/** The level a seed word makes with a tier's recipe, or `null` if too few targets. */
function buildLevel(
  words: readonly string[],
  seed: string,
  shape: LevelShape,
  recipe: { pool: number; longFirst: boolean },
  random: () => number,
): Level | null {
  const letters = shuffled([...seed], random);
  const spelled = wordsSpelled(words, letters);
  const candidates = spelled.filter(
    ({ word, rank }) => rank < recipe.pool && word.length >= shape.shortestTarget && word !== seed,
  );
  if (candidates.length + 1 < MIN_TARGETS) return null;

  // Stable sort: equally long words stay most common first.
  const ordered = recipe.longFirst
    ? candidates.toSorted((a, b) => b.word.length - a.word.length)
    : candidates;
  const seedRanked = spelled.find(({ word }) => word === seed) ?? { word: seed, rank: 0 };
  const chosen = [seedRanked, ...ordered].slice(0, shape.targets);
  const targets = chosen.map(({ word }) => word);
  const score = levelScore(
    chosen.map(({ word, rank }) => ({ length: word.length, rank })),
    letters.length,
  );
  return {
    letters,
    targets,
    bonus: spelled.map(({ word }) => word).filter((word) => !targets.includes(word)),
    tier: classify(score),
  };
}

/**
 * Builds level `levelNumber` of a tier from a word list; the same arguments always give
 * the same level. Its letters are a seed word's (see `seedOrder`), shuffled; targets
 * follow the tier's recipe (`RECIPES`) and every other word the letters spell is a bonus
 * word. Each level tries the seeds of its own block of its tier's order (see
 * {@link SEED_BLOCK}), then a few from the far side ({@link FAR_TRIES}), for one whose
 * level lands in the tier; otherwise it takes the first workable one, whatever its tier.
 * @param words Normalized words, most common first, no repeats.
 * @param occurrence How many earlier levels share this one's tier and size (`occurrence`
 * in `core/cadence`): which block of seeds it gets.
 * @param shape Its size; by default the one for its number ({@link levelShape}).
 */
export function generateLevel(
  words: readonly string[],
  levelNumber: number,
  tier: Tier = 'medium',
  occurrence = 0,
  shape: LevelShape = levelShape(levelNumber),
): Level {
  const recipe = RECIPES[tier];
  const order = seedOrder(words, tier, shape.letters);
  const blocks = Math.max(1, Math.floor(order.length / SEED_BLOCK));
  const start = (occurrence % blocks) * SEED_BLOCK;
  // Its own block first. Failing that, it looks for its tier on the far side of the order:
  // seeds last used about half a cycle ago, not by a neighbor.
  const far = (start + Math.floor(order.length / 2)) % Math.max(order.length, 1);
  const seeds = [
    ...order.slice(start, start + SEED_BLOCK),
    ...order.slice(far),
    ...order.slice(0, far),
  ];
  const random = seededRandom(levelNumber);

  let fallback: Level | null = null;
  for (const [index, seed] of seeds.entries()) {
    if (index >= SEED_BLOCK + FAR_TRIES && fallback) break;
    const level = buildLevel(words, seed, shape, recipe, random);
    if (!level) continue;
    if (level.tier === tier) return level;
    fallback ??= level;
  }
  if (fallback) return fallback;
  throw new Error(`No ${shape.letters}-letter word makes a level with this word list`);
}
