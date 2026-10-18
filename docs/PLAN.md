# Implementation plan

Living document. Each task is one **cycle**: small, PR-sized, independently
verifiable, merged to `main` and deployed. Tick the box in the same PR that
completes it. Status legend: `[ ]` todo · `[~]` in progress · `[x]` done.

Each milestone ends with a tag (`v0.N.0`) and a short note in the changelog
section at the bottom.

## Stack

| Concern       | Choice                                    | Why                                                                                                |
| ------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Language      | TypeScript (strict)                       | Types document the domain; safe refactors as features grow.                                        |
| UI            | Svelte 5 + Vite (plain SPA, no SvelteKit) | Little boilerplate, tiny bundle, built-in transitions/springs for snappy motion. No router needed. |
| Rendering     | DOM + SVG                                 | Crisp at any DPI, accessible, easy to animate. A canvas/game engine would be overkill.             |
| Game logic    | Framework-free TS in `src/core`           | Pure functions, trivially unit-tested, portable if the UI layer ever changes.                      |
| Unit tests    | Vitest                                    | Shares Vite config, fast.                                                                          |
| E2E tests     | Playwright (mobile + desktop viewport)    | A few smoke tests of the real gesture flow.                                                        |
| Lint / format | ESLint + Prettier + `svelte-check`        | One `npm run check` gate.                                                                          |
| PWA           | `vite-plugin-pwa` (Workbox)               | Manifest + offline service worker with minimal config.                                             |
| Content       | Node script (`scripts/`) → static JSON    | Levels generated offline, committed, reproducible from a seed.                                     |
| Hosting / CI  | GitHub Pages + GitHub Actions             | No backend needed; every push to `main` deploys.                                                   |
| Runtime       | Node 24 LTS, npm                          | Already installed; no extra tooling.                                                               |

Considered and rejected for now: React (more ceremony and an extra animation
library for the same result), Phaser/canvas (fights against crisp text and
accessibility), SvelteKit (routing/SSR we don't need).

## Milestones

### M0 — Foundation · `v0.1.0`

Goal: an empty but real app, live on GitHub Pages, with the quality gates in place.

- [x] Scaffold Vite + Svelte 5 + TS strict with quality gates: ESLint, Prettier,
      `svelte-check`, Vitest, Playwright smoke test; `npm run check` runs lint + types + unit tests
- [x] GitHub Actions: `check` + `e2e` + `build` on PRs; deploy to Pages on `main`
- [ ] Design tokens (`src/ui/styles/tokens.css`): colors (light/dark), type scale, radii, durations
- [ ] Player-facing text read from a per-language strings module (`src/i18n/es.ts`), never inline

**Verify:** the Pages URL loads on a phone and desktop; a PR with a failing test is blocked.

### M1 — Core rules · `v0.2.0`

Goal: the whole game logic, tested, with no UI.

- [ ] `Language` definition (code, alphabet, `normalize`) with the Spanish one (accents, `Ñ`, case) + tests
- [ ] `Level` type and a handful of hand-written fixture levels
- [ ] `evaluate(level, state, word)` → `invalid | target | bonus | repeated` + tests
- [ ] Scoring and `isComplete(level, state)` + tests
- [ ] Level progression: next level id, cycling after the last one + tests

**Verify:** `npm test` covers every row of the result table in GAME.md.

### M2 — Letter wheel · `v0.3.0`

Goal: the input gesture feels great on a phone.

- [ ] Wheel layout: N letters evenly on a circle (pure geometry fn + test)
- [ ] Pointer-event drag: hit-testing letters, path line, current word pill
- [ ] Backtrack by returning to the previous letter; cancel by releasing on the start
- [ ] Emits `submit(word)` on release; no page scroll/zoom while dragging
- [ ] Shuffle button (animated reposition)

**Verify:** on a real phone via Pages, words can be drawn quickly and reliably,
including fast diagonal swipes; desktop mouse drag works.

### M3 — Playable level · `v0.4.0` (first playable MVP)

Goal: wheel + board + rules = a complete level with fixture data.

- [ ] Board: rows of tiles grouped by length; found words fill their row
- [ ] Feedback per result (shake / fly-in + flip / bonus pulse / repeated glow)
- [ ] Header with level number and animated score
- [ ] Level-complete overlay → next level
- [ ] E2E: draw a target word, see it on the board; finish a fixture level

**Verify:** a fixture level can be fully played on phone and desktop.

### M4 — Content pipeline · `v0.5.0`

Goal: hundreds of good Spanish levels, reproducibly generated.

- [ ] Choose word sources (common words + broad dictionary) and **verify licenses**;
      record the decision below
- [ ] `scripts/prepare-words.ts`: normalize and filter the sources (length, proper nouns,
      offensive list) into a compact word list with frequency ranks
- [ ] `src/core/generate.ts`: pure `generateLevel(words, seed, index)`: pick seed word,
      compute sub-anagrams, choose targets vs bonus, seeded RNG
- [ ] `scripts/build-levels.ts`: run the generator for N levels, write chunked JSON
- [ ] Difficulty curve: letters 6→7→8, target count and lengths grow with level index
- [ ] Generator invariants tested (every target formable, one full-length target, no dupes)
- [ ] Ship generated levels; manual playtest of the first ~30

**Verify:** `npm run levels` regenerates byte-identical output; first 30 levels feel fair.

### M5 — Persistence + PWA · `v0.6.0`

Goal: installable, works offline, never loses progress.

- [ ] Versioned `localStorage` save (current level, score, found words); pre-1.0 an
      unknown version is simply discarded
- [ ] Manifest, icons, theme color, `base` path for Pages
- [ ] Service worker: precache app + levels; update prompt on new version
- [ ] Safe-area insets, standalone display, no pull-to-refresh/overscroll

**Verify:** install on Android and iOS; play offline in airplane mode; reload keeps progress.

### M6 — Polish & release · `v1.0.0`

- [ ] Visual design pass (spacing, motion timing, dark mode, level-complete moment)
- [ ] Haptics; `prefers-reduced-motion`; accessible labels and contrast check
- [ ] Performance budget: < 100 KB JS gz, Lighthouse PWA/perf ≥ 90 on mobile
- [ ] Minimal "how to play" on first launch

**Verify:** fresh-install playthrough of levels 1–10 on a mid-range phone with no rough edges.

## Backlog (post-MVP, unordered)

- Hints / power-ups (reveal a letter, reveal a word) and a coin economy
- Keyboard input on desktop (type + Enter)
- Statistics screen, streaks, daily puzzle
- Crossword-style board layout
- Sound effects with mute toggle
- English (or other) language packs + language picker (the structure is in place from M0/M1)
- Accented display of found words (show `ÁRBOL`, match `ARBOL`)
- Share results

## Decision log

Short entries, newest first: date — decision — reason.

- 2026-10-18 — Pre-1.0 we break freely: no save migrations, no compatibility shims, no
  keeping old code paths alive. Replace, don't layer. — There are no players to protect
  yet; every shim is code we'd maintain for nobody. Revisit at v1.0.0.
- 2026-10-18 — Levels are generated ahead of time (option B), but the generator is a pure
  function in `src/core` so it could later run on-device for infinite play. — Frozen,
  reviewable, testable data; word-list fixes don't reshuffle levels under players.
- 2026-10-18 — Spanish first, organized as a language pack (rules + levels + UI strings)
  from day one. — Adding a language and a picker later must not need a refactor;
  the cost now is one strings module and a `Language` type.
- 2026-10-18 — Levels carry their own `bonus` list; no dictionary shipped. —
  Keeps the download tiny and validation trivial; bonus words are only ever
  formed from that level's letters.
- 2026-10-18 — Svelte 5 + Vite + TS, DOM/SVG rendering, static hosting on Pages. — See Stack.

## Changelog

_Nothing released yet._
