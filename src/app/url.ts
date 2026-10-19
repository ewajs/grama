/**
 * The level to open from the page's query string: `?nivel=37` opens level 37, handy for
 * playtesting and bug reports. Anything else opens level 1.
 * @param search `location.search`.
 */
export function levelFromUrl(search: string): number {
  const level = Number(new URLSearchParams(search).get('nivel'));
  return Number.isInteger(level) && level >= 1 ? level : 1;
}
