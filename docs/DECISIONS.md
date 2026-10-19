# Decisions

Technical and product decisions worth remembering: what we chose, why, and when to look
at it again. Newest first. Refer to an entry by its number (e.g. "see D6").

When a decision is replaced, edit its entry to say so and link the new one; don't
delete it, the history is the point.

---

## D14 · Argentine words: generated voseo + a curated list — 2026-10-18

- **Decision:**
  - `scripts/voseo.ts` adds the dictionary's missing voseo present and imperative forms
    (podés, jugás), regular from each verb's infinitive.
  - `src/content/es/argentina.txt`, written by us (MIT): everyday Argentine words the
    dictionary lacks or ranks too low (pibe, bondi, subte, coima, laburo…), every form
    written out. Always valid, and ranked within the top 2,500 so they can be targets.
  - Only dictionary and curated words are valid. Words only in the frequency list (8,293:
    names, places, English, web noise like JAJAJA) no longer count.
- **Why:** Argentine words could only be bonus words or weren't accepted at all; the
  frequency list let names and English count.
- **Costs accepted:** some real words only the frequency list had are lost (diminutives
  like _carita_, loanwords like _shock_). The report button is how we find the ones
  that matter.

## D13 · Grama's code is MIT-licensed — 2026-10-18

- **Decision:** `LICENSE` (MIT) covers our code. Third-party data files keep their own
  licenses (D12) and say so in a header and in `NOTICE.md`.

## D12 · Word sources: RLA-ES es_AR + wordfreq — 2026-10-18

- **Decision:**
  - _Valid words:_ the RLA-ES Spanish (Argentina) Hunspell dictionary v2.9
    (github.com/sbosio/rla-es), affixes expanded at build time, used under **MPL-2.0**
    (chosen from its GPLv3+/LGPLv3+/MPL-1.1+ options).
  - _How common a word is:_ wordfreq 3.2 `large_es` (github.com/rspeer/wordfreq), data
    under **CC BY-SA 4.0**.
  - Shipped as **two files**, each under its own license with an attribution header;
    never merged into one. The app combines them when loading. A word is valid if it's in
    either; targets must be both frequent and in the dictionary (this drops names, which
    the lowercased frequency list mixes in) and not on our offensive-word blocklist.
- **Why:** RLA-ES es_AR has voseo (_tenés, sabés, vení, sos_) and Argentine words (_che,
  laburo, birra_); wordfreq fills its gaps (_podés, pibe, coima_) and ranks Rioplatense
  words well. Rejected: FrequencyWords (Argentine words rank far lower), SUBTLEX-ESP and
  RAE CREA/CORPES (no clear license).
- **Costs accepted:** about 500 KB compressed to download once; wordfreq's data is a
  frozen ~2021 snapshot; some names count as valid bonus words (harmless).
- **Spellings:** both files keep accents; the app compares without them and shows the
  stored spelling. Where a word has several, the dictionary's beats the frequency list's
  (which often drops accents), and the accented one wins unless it's over 3× rarer
  (`preferSpelling` in `scripts/words.ts`).
- **Neither license touches our code:** MPL is file-level; CC BY-SA applies to the
  adapted data file, not to code that loads it.

## D11 · Levels generated on the device, endlessly — 2026-10-18

- **Decision:** The app ships a word list and generates level N on demand with a pure
  `generateLevel(words, N)` seeded by N. Levels never run out, and level N is the same
  for everyone on every reload. Replaces D3 and D4.
- **Why:** Pre-1.0, being able to playtest any number of levels is worth more than a
  fixed, reviewed set. Seeding keeps levels reproducible ("level 37 has a weird word").
- **Costs accepted:** a word-list download (a few hundred KB compressed); changing the
  word list or the generator reshuffles all levels (fine under D5); no human reviews
  levels, so generator tests and word-list filters are the safety net.
- **Revisit:** Before 1.0, if level quality needs curation: a script can run the same
  function and freeze the output as static levels (D4's approach) without new logic.

## D10 · E2E tests run locally, not in CI — 2026-10-18

- **Decision:** CI runs only `npm run check` (lint, types, unit tests). Playwright runs
  locally, on demand, when a change touches input, page flow or PWA behavior.
- **Why:** Browser tests are slow (> 1 min in CI) and cover almost nothing yet. Unit
  tests on pure logic catch most bugs for a fraction of the cost.
- **Revisit:** When the e2e suite guards flows we'd be upset to break silently
  (likely around M3/M5), consider running it in CI only for PRs that touch `src/ui`.

## D9 · Code documents itself with TSDoc — 2026-10-18

- **Decision:** Every exported function, type and constant has a `/** … */` TSDoc comment;
  every Svelte component starts with a `<!-- @component … -->` comment. Editors show
  these on hover, and they can be turned into a reference site with TypeDoc.
- **Why:** Documentation that lives next to the code is the only kind that stays current.
- **Enforced:** `eslint-plugin-jsdoc` fails `npm run check` when an export in `src/**/*.ts`
  has no doc comment.
- **Published:** TypeDoc builds a reference site from these comments on every deploy:
  https://ewajs.github.io/grama/api/

## D8 · Rioplatense Spanish, Argentine flavor — 2026-10-18

- **Decision:** Player-facing text uses voseo ("Uní las letras", "Encontrá"). Any
  Spanish-specific imagery, examples or cultural references are Argentine.
- **Why:** That's our audience.

## D7 · Self-hosted font (Outfit via Fontsource) — 2026-10-18

- **Decision:** Fonts are npm packages bundled into the build, not loaded from Google Fonts.
- **Why:** Works offline for the PWA, no third-party requests.

## D6 · No branch protection on `main` for now — 2026-10-18

- **Why:** Solo project; red checks on a PR are enough of a signal.
- **Revisit:** When more people contribute.

## D5 · Pre-1.0 we break freely — 2026-10-18

- **Decision:** No save migrations, compatibility shims, deprecated aliases or old code
  paths kept alive. Replace, don't layer.
- **Why:** There are no players to protect yet; every shim is code we'd maintain for nobody.
- **Revisit:** At v1.0.0.

## D4 · Levels generated ahead of time — 2026-10-18 · _replaced by D11_

- **Decision:** A script generates levels into static JSON that ships with the app. The
  generator itself is a pure function in `src/core`, so it could later run on the device
  for truly infinite play.
- **Why:** Fixed, reviewable, testable data; word-list fixes don't reshuffle levels
  under players. On-device generation would need a shipped dictionary and versioning.

## D3 · Levels carry their own bonus words; no dictionary shipped — 2026-10-18 · _replaced by D11_

- **Why:** Keeps the download tiny and validation trivial; bonus words are only ever
  formed from that level's letters.

## D2 · Language packs from day one, Spanish first — 2026-10-18

- **Decision:** A language = word rules (`Language` in `src/core`) + level data
  (word list in `src/content/<lang>`) + UI strings (`src/i18n/<lang>.ts`).
- **Why:** Adding a language and a picker later must not need a refactor. The cost now
  is one type and one strings module.

## D1 · Stack — 2026-10-18

| Concern       | Choice                                                   | Why                                                                              |
| ------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Language      | TypeScript (strict)                                      | Types document the domain; safe refactors as features grow.                      |
| UI            | Svelte 5 + Vite (plain SPA, no SvelteKit)                | Little boilerplate, tiny bundle, built-in transitions/springs. No router needed. |
| Rendering     | DOM + SVG                                                | Crisp at any DPI, accessible, easy to animate.                                   |
| Game logic    | Framework-free TS in `src/core`                          | Pure functions, trivially unit-tested, independent of the UI layer.              |
| Unit tests    | Vitest                                                   | Shares Vite config, fast.                                                        |
| E2E tests     | Playwright (mobile + desktop viewport)                   | A few smoke tests of the real gesture flow (see D10).                            |
| Lint / format | ESLint + Prettier + `svelte-check`                       | One `npm run check` gate.                                                        |
| PWA           | `vite-plugin-pwa` (Workbox)                              | Manifest + offline service worker with minimal config.                           |
| Content       | Word list (`scripts/` prepares it) + on-device generator | See D11.                                                                         |
| Hosting / CI  | GitHub Pages + GitHub Actions                            | No backend needed; every push to `main` deploys.                                 |
| Runtime       | Node 24 LTS, npm                                         | No extra tooling.                                                                |

Rejected: React (more ceremony plus an animation library for the same result),
Phaser/canvas (fights crisp text and accessibility), SvelteKit (routing/SSR we don't need).
