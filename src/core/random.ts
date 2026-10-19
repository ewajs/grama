/**
 * Repeatable randomness: a seeded generator, so level N is the same on every device, and
 * a shuffle.
 * @module
 */

/**
 * A source of random numbers in [0, 1) that always yields the same sequence for the same
 * seed, so level N is identical on every device (mulberry32 algorithm).
 */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A copy of `items` in a random order, always different from the original when there
 * are two or more items (so pressing "shuffle" visibly does something).
 * @param random Source of numbers in [0, 1); pass a seeded one for repeatable results.
 */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = items
    .map((item) => ({ item, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
  const unchanged = result.every((item, index) => item === items[index]);
  return unchanged && items.length > 1 ? [...result.slice(1), ...result.slice(0, 1)] : result;
}
