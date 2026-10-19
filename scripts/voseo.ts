const VOWELS = /[aeiouáéíóú]/u;

// The accented vowel of each conjugation: hablás / comés / vivís, hablá / comé / viví.
const STRESSED = { a: 'á', e: 'é', i: 'í' } as const;

// Verbs whose voseo isn't built from the infinitive (ser → sos, ir → vas, andá).
const IRREGULAR = new Set(['ser', 'ir', 'haber']);

/**
 * Whether `word` is a verb's infinitive: it ends in -ar/-er/-ir and the dictionary has its
 * gerund or imperfect too (hablando, hablaba; comiendo, comía). Rules out look-alikes
 * such as mujer; the imperfect catches stem-changing verbs (poder → podía, not podiendo).
 */
function isInfinitive(word: string, words: ReadonlySet<string>): boolean {
  const match = /^(.+)([aeií])r$/u.exec(word);
  if (!match) return false;
  const [, stem = '', vowel] = match;
  const endings = vowel === 'a' ? ['ando', 'aba'] : ['iendo', 'yendo', 'ía'];
  return endings.some((ending) => words.has(stem + ending));
}

/**
 * The Rioplatense voseo forms of every verb in `words` that it lacks: present (`vos
 * podés`) and imperative (`vení`). The dictionary has some (tenés) but not others
 * (podés, jugás). Voseo present and imperative are regular even for irregular verbs, so
 * they come straight from the infinitive; ser, ir and haber are the exceptions.
 * @param words Every word of the dictionary, lowercase, accents kept.
 * @example voseoForms(new Set(['poder', 'podía'])) // ['podés', 'podé']
 */
export function voseoForms(words: ReadonlySet<string>): string[] {
  const forms: string[] = [];
  for (const word of words) {
    if (IRREGULAR.has(word) || !isInfinitive(word, words)) continue;
    const stem = word.slice(0, -2);
    // One-syllable forms take no accent and already exist: dar → das, ver → ves.
    if (!VOWELS.test(stem)) continue;
    const vowel = word.at(-2) === 'a' ? 'a' : word.at(-2) === 'e' ? 'e' : 'i';
    for (const form of [stem + STRESSED[vowel] + 's', stem + STRESSED[vowel]]) {
      if (!words.has(form)) forms.push(form);
    }
  }
  return forms;
}
