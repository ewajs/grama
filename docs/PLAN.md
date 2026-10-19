# Implementation plan

Living document. Each task is one **cycle**: small, PR-sized, independently
verifiable, merged to `main` and deployed. Tick the box in the same PR that
completes it. Status legend: `[ ]` todo · `[~]` in progress · `[x]` done.

Each milestone ends with a tag (`v0.N.0`) and a short note in the changelog
section at the bottom.

Technical decisions and the stack live in [`DECISIONS.md`](DECISIONS.md).

## Milestones

### M0 — Foundation · `v0.1.0`

Goal: an empty but real app, live on GitHub Pages, with the quality gates in place.

- [x] Scaffold Vite + Svelte 5 + TS strict with quality gates: ESLint, Prettier,
      `svelte-check`, Vitest, Playwright smoke test; `npm run check` runs lint + types + unit tests
- [x] GitHub Actions: `check` + `e2e` + `build` on PRs; deploy to Pages on `main`
- [x] Design tokens (`src/ui/styles/tokens.css`): colors (light/dark), type scale, radii, durations
- [x] Player-facing text read from a per-language strings module (`src/i18n/es.ts`), never inline

**Verify:** the Pages URL loads on a phone and desktop; a PR with a failing test shows red checks.

### M1 — Core rules · `v0.2.0`

Goal: the whole game logic, tested, with no UI.

- [x] `Language` definition (code, `normalize`) with the Spanish one (accents, `Ñ`, case) + tests
- [x] `Level` type and a handful of hand-written fixture levels
- [ ] `evaluate(level, state, word)` → `invalid | target | bonus | repeated` + tests
- [ ] Scoring and `isComplete(level, state)` + tests
- [ ] Level progression: next level id, cycling after the last one + tests

**Verify:** unit tests cover every row of the result table in GAME.md.

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
- [ ] E2E (local, see D10): draw a target word, see it on the board; finish a fixture level

**Verify:** a fixture level can be fully played on phone and desktop.

### M4 — Content pipeline · `v0.5.0`

Goal: hundreds of good Spanish levels, reproducibly generated.

- [ ] Choose word sources (common words + broad dictionary) and **verify licenses**;
      record the decision in DECISIONS.md. Must include Argentine usage (voseo forms like
      _tenés_, _sabés_; words like _che_, _pibe_) at least as valid bonus words
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

## Changelog

- **v0.1.0** (M0) — Svelte 5 + TS scaffold, quality gates, CI, auto-deploy to GitHub Pages, design tokens (light/dark), Spanish UI strings.
