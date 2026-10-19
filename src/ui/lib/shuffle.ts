/**
 * A copy of `items` in a random order, always different from the original when there
 * are two or more items (so pressing "shuffle" visibly does something).
 * @param random Source of numbers in [0, 1); replaceable in tests.
 */
export function shuffled<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = items
    .map((item) => ({ item, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
  const unchanged = result.every((item, index) => item === items[index]);
  return unchanged && items.length > 1 ? [...result.slice(1), ...result.slice(0, 1)] : result;
}
