# Decisions

Technical and product decisions worth remembering: what we chose, why, and when to look
at it again. Newest first. Refer to an entry by its number (e.g. "see D6").

When a decision is replaced, edit its entry to say so and link the new one; don't
delete it, the history is the point.

---

## D19 · Contrarreloj: wheel after wheel, apart from the main game — 2026-10-19

- **Decision:** a timed mode. A run starts with 60 seconds; a target adds 3, a bonus word
  1, and finishing a board adds 10 and brings the next wheel, bigger and harder (6 easy
  letters first, up to 8). _Pasar_ skips to a new wheel for −10 seconds; there are no
  hints. The run ends at zero; its score is its points. The clock pauses while the app is
  hidden. All numbers are tunable constants.
- **Wheels:** a new random seed every run, passed into core like any other input, so
  runs are endless and replayable; the player competes with their own best.
- **Apart from the main game:** its own best score, history and three achievements; it
  never touches the main score, hints, stars or level.
- **Why:** the fastest-feeling way to reuse the generator, wheel and board; keeping it
  separate means it can't be farmed for hints or points (the M12 review's replay problem).
- **Rejected:** one wheel for 90 seconds (no sense of progress), a fixed number of wheels
  against the clock (one slow wheel sinks the run), a seeded daily run (one meaningful run
  a day; can come later).

## D18 · Docs: VitePress for players, TypeDoc for developers — 2026-10-19

- **Decision:** two separate sites deployed with the game, as in lighting-simulator:
  - _Todo sobre Grama_ (`guide/`, VitePress 1.6, Spanish) at `/grama/guia/`: how the game
    works for a curious player. Screenshots are taken from the real game by Playwright
    (`npm run guide:screenshots`) and committed.
  - Developer docs (TypeDoc, English) at `/grama/docs/`: the API reference plus
    hand-written guides with SVG diagrams.
  - Both build on every PR (the `docs` CI job) so broken links fail early.
- **Why:** different readers, different tools; both are what worked in lighting-simulator.
- **Costs accepted:** VitePress 1.6 bundles an older Vite whose dev server has known
  advisories (`npm audit`); they only affect `vitepress dev` locally, not the static site.

## D17 · A home screen, stars from hints and bonus words, replays, a weekday daily — 2026-10-18

- **Navigation:** the app opens on a home screen (play, daily challenge, map,
  achievements); the game has a way back. Chosen over header shortcuts (crowded) and a
  tab bar (takes room from the board).
- **Stars:** ★★★ no hints and at least 3 bonus words; ★★ at most one hint; ★ completed.
- **Replays:** completed levels can be replayed from the map, for better stars; a replay
  never moves the player's current level.
- **Daily challenge:** 7 letters, difficulty by weekday (Monday easy … Sunday extra hard),
  the same for everyone so results can be compared.

## D16 · Difficulty tiers: scored targets, calibrated recipes, a 7-level cadence — 2026-10-18

- **Score** (`core/difficulty.ts`): a level's difficulty is the average over its targets
  of log₁₀(rank + 1) + 0.25 × (length − 3), minus 0.25 per wheel letter beyond 6 (bigger
  wheels make long words natural). Tiers start at 2.75 (medium), 3.25 (hard), 3.75
  (extra hard).
- **Recipes**, calibrated on generated levels (median score): easy = top 1,500 words,
  most common first (2.49); medium = top 3,000, longest first (2.98); hard = top 8,000,
  longest first (3.51); extra hard = top 20,000, longest first (4.00). The cut-offs sit
  between those medians; the generator retries seeds until the level's score matches.
  Over 600 levels, 100% land in the requested tier.
- **Size and difficulty are separate**: letters and target count grow with progress
  (`SIZES`); the tier only changes which words are targets.
- **Cadence** (`core/cadence.ts`): easy, medium, medium, hard, easy, medium, extra hard,
  repeating; no extra hard before level 15; from level 50 the middle easy becomes medium.
- **No repeats nearby**: each tier draws seeds from its own band of ranks, each letter set
  once across tiers, in a fixed order; each level gets its own block of 3 seeds in it
  (`occurrence`). A level comes back only after its tier's whole order is used (about
  180 levels at 8 letters).
- **Why:** variety and a felt rhythm of challenge and relief, while keeping level N
  reproducible.

## D15 · Stay on 0.x while we experiment — 2026-10-18

- **Decision:** Milestones keep bumping the minor version (0.8, 0.9, 0.10…). There's no
  1.0 on the roadmap; it comes only after a lot more iteration and playtesting.
- **Why:** 1.0 would end D5's freedom to change saves, rules and data at will, and we
  still want to experiment.

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
  https://ewajs.github.io/grama/docs/ (with hand-written guides since D18)

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
- **Revisit:** At v1.0.0, which is deliberately far off (D15).

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
