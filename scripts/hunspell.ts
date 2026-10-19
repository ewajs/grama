/** One affix rule: when a word matches `condition`, remove `strip` and add `add`. */
type AffixRule = { strip: string; add: string; continuation: string[]; condition: RegExp };

/** A group of rules sharing a flag. `cross` lets prefixes and suffixes combine. */
type AffixClass = { kind: 'PFX' | 'SFX'; cross: boolean; rules: AffixRule[] };

/** Affix classes of a Hunspell `.aff` file, by flag. */
export type Affixes = Map<string, AffixClass>;

/**
 * Reads the prefix and suffix rules of a Hunspell `.aff` file with single-character flags
 * (`FLAG UTF-8`). Other directives are ignored: we only need to list words, not check them.
 */
export function parseAffixes(aff: string): Affixes {
  const affixes: Affixes = new Map();
  for (const line of aff.split('\n')) {
    const [kind, flag, a, b, c] = line.trim().split(/\s+/);
    if ((kind !== 'PFX' && kind !== 'SFX') || !flag || a === undefined || b === undefined) {
      continue;
    }
    const existing = affixes.get(flag);
    if (!existing) {
      // The first line of a class is its header: `SFX flag Y|N count`.
      affixes.set(flag, { kind, cross: a === 'Y', rules: [] });
      continue;
    }
    const [add = '', continuation = ''] = b.split('/');
    const pattern = c ?? '.';
    existing.rules.push({
      strip: a === '0' ? '' : a,
      add: add === '0' ? '' : add,
      continuation: [...continuation],
      condition: new RegExp(kind === 'PFX' ? `^${pattern}` : `${pattern}$`, 'u'),
    });
  }
  return affixes;
}

/** The word with one rule applied, or `null` when the rule doesn't fit it. */
function applyRule(word: string, rule: AffixRule, kind: AffixClass['kind']): string | null {
  if (!rule.condition.test(word)) return null;
  if (kind === 'SFX') {
    return word.endsWith(rule.strip)
      ? word.slice(0, word.length - rule.strip.length) + rule.add
      : null;
  }
  return word.startsWith(rule.strip) ? rule.add + word.slice(rule.strip.length) : null;
}

/** The word with each rule of a class applied, where they fit. */
function applyClass(word: string, affix: AffixClass): string[] {
  return affix.rules.flatMap((rule) => applyRule(word, rule, affix.kind) ?? []);
}

/**
 * Every word a `.dic` entry stands for: the stem, its suffixed forms (plus suffixes those
 * allow in turn), and prefixed forms of both where the classes allow combining.
 * @param entry A `.dic` line, e.g. `gato/FS`.
 * @example expand('casa/S', affixes) // ['casa', 'casas']
 */
export function expand(entry: string, affixes: Affixes): string[] {
  const [stem = '', flags = ''] = (entry.split(/\s/)[0] ?? '').split('/');
  const classes = [...flags].flatMap((flag) => affixes.get(flag) ?? []);
  const words = new Set([stem]);

  const suffixed = [{ word: stem, cross: true }];
  for (const suffix of classes.filter((affix) => affix.kind === 'SFX')) {
    for (const rule of suffix.rules) {
      const word = applyRule(stem, rule, 'SFX');
      if (word === null) continue;
      words.add(word);
      suffixed.push({ word, cross: suffix.cross });
      for (const flag of rule.continuation) {
        const next = affixes.get(flag);
        if (next?.kind === 'SFX') applyClass(word, next).forEach((more) => words.add(more));
      }
    }
  }
  for (const prefix of classes.filter((affix) => affix.kind === 'PFX')) {
    for (const { word, cross } of suffixed) {
      if (word === stem || (cross && prefix.cross)) {
        applyClass(word, prefix).forEach((more) => words.add(more));
      }
    }
  }
  return [...words];
}
