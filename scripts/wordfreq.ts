/**
 * Words of a wordfreq frequency file, most common first. The decoded file is a header
 * followed by buckets of words that share a frequency, from most to least frequent.
 * @param decoded The file's content after gunzip and msgpack decoding.
 */
export function rankedWords(decoded: unknown): string[] {
  if (!Array.isArray(decoded)) throw new Error('Unexpected wordfreq data: not a list');
  return decoded
    .slice(1)
    .flatMap((bucket: unknown) => (Array.isArray(bucket) ? bucket : []))
    .filter((word): word is string => typeof word === 'string');
}
