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
- [x] `evaluate(level, found, word)` → `invalid | target | bonus | repeated`, with points + tests
- [x] Game state: submitting a word updates found words and score; `isLevelComplete` + tests
- [x] Level progression: next level id, cycling after the last one + tests

**Verify:** unit tests cover every row of the result table in GAME.md.

### M2 — Letter wheel · `v0.3.0`

Goal: the input gesture feels great on a phone.

- [x] Wheel layout: N letters evenly on a circle (pure geometry fn + test)
- [x] Pointer-event drag: hit-testing letters, path line, current word pill
- [x] Backtrack by returning to the previous letter; cancel by releasing on the start
- [x] Emits `submit(word)` on release; no page scroll/zoom while dragging
- [x] Shuffle button (animated reposition)

**Verify:** on a real phone via Pages, words can be drawn quickly and reliably,
including fast diagonal swipes; desktop mouse drag works.

### M3 — Playable level · `v0.4.0` (first playable MVP)

Goal: wheel + board + rules = a complete level with fixture data.

- [x] Board: rows of tiles grouped by length; found words fill their row
- [x] Feedback per result (shake / fly-in + flip / bonus pulse / repeated glow)
- [x] Header with level number and animated score
- [x] Level-complete overlay → next level
- [x] E2E (local, see D10): draw a target word, see it on the board; finish a fixture level

**Verify:** a fixture level can be fully played on phone and desktop.

### M4 — Endless levels · `v0.5.0`

Goal: levels never run out, generated on the device (D11), good enough to playtest.

- [x] Choose word sources (common words + broad dictionary) and **verify licenses**;
      record the decision in DECISIONS.md. Must include Argentine usage (voseo forms like
      _tenés_, _sabés_; words like _che_, _pibe_) at least as valid bonus words
- [x] `scripts/prepare-words.ts`: normalize and filter the sources (length, proper nouns,
      offensive list) into a compact word list with frequency ranks, shipped as a static file
- [x] `src/core/generate.ts`: pure `generateLevel(words, levelNumber)`: seeded RNG, pick a
      seed word, find every word its letters spell, choose targets (common) vs bonus (rest);
      invariants tested (every level passes `levelProblems`)
- [x] App loads the word list and generates each level on demand; hand-written levels removed
- [x] Difficulty curve: letters 6→7→8, target count and lengths grow with the level number
- [~] Playtest helper: `?nivel=N` opens level N directly; manual playtest of a few dozen levels

**Verify:** level N is identical on every reload and device; playing 30 levels in a row
feels fair (no obscure targets, no offensive words, nothing unspellable).

### M5 — Persistence + PWA · `v0.6.0`

Goal: installable, works offline, never loses progress.

- [x] Versioned `localStorage` save (current level, score, found words); pre-1.0 an
      unknown version is simply discarded
- [x] Manifest, icons, theme color, `base` path for Pages
- [x] Service worker: precache app + word lists; update prompt on new version
- [x] Safe-area insets, standalone display, no pull-to-refresh/overscroll

**Verify:** install on Android and iOS; play offline in airplane mode; reload keeps progress.

### M6 — Helpers · `v0.7.0`

Goal: help when stuck, give bonus words a purpose, read like real Spanish, and make
playtest feedback easy to send.

- [x] Accented display of found words (`ÁRBOL`, `TENÉS`), still matched without accents
- [x] Hints: earned by finding bonus words, each reveals a letter of a target
- [x] Bonus words list: tap the bonus counter to see the ones found
- [x] Report button: opens a pre-filled GitHub issue (level, letters, words, recent
      rejected attempts)
- [x] Argentine supplement word list (hand-curated) so _pibe, coima, bondi, subte…_ can
      be targets

**Verify:** a stuck player can always progress with hints; a report reaches GitHub with
enough context to reproduce.

### M7 — Menu & settings · `v0.8.0`

Goal: one place for options, and a first launch that teaches the game.

- [x] Menu panel from the header, with settings saved apart from progress; theme
      (Automático / Claro / Oscuro); report moves here; reset progress; about (version,
      word-list credits)
- [x] Install the app: the browser's prompt where there is one, steps on iOS; hidden
      when already installed
- [x] Vibration on/off, with haptics while dragging and on results
- [x] Animated "Cómo jugar" tutorial: on first launch and from the menu

**Verify:** every option works and survives a reload; a new player gets the game from the
tutorial alone.

### M8 — Difficulty · `v0.9.0`

Goal: levels vary in difficulty with a deliberate rhythm, and players choose how hard.

- [x] Classify levels easy / medium / hard / extra hard from their targets (rarity, length),
      calibrated on thousands of generated levels
- [x] Generator builds a level of a requested tier; size (letters, targets) still grows
      with progress
- [x] Cadence: 7-level cycle (easy, medium, medium, hard, easy, medium, extra hard), easy
      after extra hard, no extra hard before level 15, harder mix with progress
- [x] Player setting in the menu (Relajada / Normal / Desafiante) shifts tiers (Relajada: one
      easier, no extra hard; Desafiante: one harder), from the next level
- [x] Tier badge; harder levels score more (×1.5, ×2) and extra hard earns a hint

**Verify:** tier shares over 1,000 levels match the cadence; extra-hard levels feel hard
but fair in playtests.

### M9 — Progress · `v0.10.0`

Goal: a reason to keep going: a record of every level, stars to earn, things to unlock.

- [x] Split the level being played (session) from the player's progress, so main levels,
      replays and daily challenges share the same rules
- [x] History of completed levels with stars (★★★ no hints and 3+ bonus words; ★★ at most
      one hint; ★ completed)
- [x] Home screen: Jugar · Nivel N, Desafío del día, Mapa, Logros; back from the game
- [x] Level map: every level so far with its tier and stars; replay a completed one (keeps
      the best stars, never moves progress)
- [x] Stats screen: levels by tier, stars, words and bonus words found, hints used
- [x] Achievements: ~15 to unlock, shown on the stats screen, with a toast when earned

**Verify:** history and stars survive reloads; replaying never changes the current level.

### M10 — Daily challenge · `v0.11.0`

- [x] One 7-letter level per day, the same for everyone, harder through the week (Monday
      easy … Sunday extra hard), with its own progress
- [x] Streak of consecutive days; daily stats and achievements
- [x] Share the result (Web Share, or copy): "Grama #142 · ★★★ · 0 pistas · 🔥5"

**Verify:** two devices get the same daily level; the streak survives reloads and breaks
after a missed day.

### M11 — Feel · `v0.12.0`

- [x] Level-complete celebration: confetti, and a recap of the words found
- [x] Found letters fly from the wheel into their row on the board
- [x] Tap a found word for a link to its definition (RAE dictionary)

**Verify:** feels good on a phone; respects reduced motion.

### M12 — Docs & clarity · `v0.13.0`

Goal: calmer feedback, a tidier menu, a guide for curious players and docs for developers.

- [x] Feedback for invalid, repeated and bonus words plays in place (no flying, no jumps)
- [x] Menu: small links (Todo sobre Grama · Reportar un problema · Acerca de); Acerca de
      window with version, novedades, "Buscar actualizaciones", credits and licenses
- [x] Player guide "Todo sobre Grama" (VitePress, Spanish) at `/grama/guia/`: how to
      play, which words count, how levels and difficulty work, hints, stars, achievements,
      the daily challenge, FAQ; screenshots generated with Playwright
- [ ] Developer docs (TypeDoc, English) at `/grama/docs/`: API reference plus guides (how
      it works with walkthroughs, words pipeline, difficulty, working on it) with SVG
      diagrams; module overviews; links validated
- [ ] Both doc sites built on every PR as checks and deployed with the game

**Verify:** a player can answer "why didn't my word count?" from the guide; a developer
can follow a word from the wheel to the score from the docs alone.

### M13 — Polish · `v0.14.0`

- [ ] Visual design pass (level-complete moment, landscape and tablet layouts)
- [ ] `prefers-reduced-motion`; accessible labels and contrast check
- [ ] Keyboard input on desktop (type + Enter)
- [ ] Performance budget: < 100 KB JS gz, Lighthouse ≥ 90 on mobile
- [ ] Real-device checklist: install and offline on Android and iOS

**Verify:** fresh-install playthrough of levels 1–20 on a mid-range phone with no rough edges.

## Backlog (post-MVP, unordered)

- More power-ups (reveal a whole word) and a coin economy
- Statistics screen, streaks, daily puzzle
- Crossword-style board layout
- Sound effects with mute toggle
- English (or other) language packs + language picker (the structure is in place from M0/M1)
- Share results

## Changelog

- **v0.12.0** (M11) — Confetti and a recap of the words on completion; a target's letters fly
  into the board; definitions (RAE) for any found word.
- **v0.11.0** (M10) — Daily challenge: one 7-letter level per date, Monday easy to Sunday
  extra hard, saved as you go, streaks, sharing, 4 new achievements.
- **v0.10.0** (M9) — Home screen; history of completed levels with 1-3 stars; level map with
  replays; stats; 15 achievements with toasts. Levels always land in their tier.
- **v0.9.0** (M8) — Difficulty: levels scored and generated as easy / medium / hard / extra
  hard, 7-level cadence, no nearby repeats, Relajada / Normal / Desafiante setting, badge,
  ×1.5 / ×2 points and a hint for extra hard. Level generation ~5× faster.
- **v0.8.0** (M7) — Menu: theme (auto/light/dark), install the app, vibration, how to play,
  report, start over, credits. Animated first-launch tutorial.
- **v0.7.0** (M6) — Found words shown with accents; hints earned with bonus words; bonus
  words list; report button (pre-filled GitHub issue); Argentine words (generated voseo +
  curated list) and only real words count.
- **v0.6.0** (M5) — Progress saved across reloads; installable app with its own icon,
  playable offline (app and word lists cached), update prompt, safe areas, no overscroll.
- **v0.5.0** (M4) — Endless levels generated on the device from Spanish word lists (RLA-ES
  es_AR + wordfreq), difficulty curve from 6 to 8 letters, `?nivel=N`, bigger board that
  never jumps, reliable swipes on 8-letter wheels. MIT license and third-party notices.
- **v0.4.0** (M3) — First playable MVP: board, feedback for every result, bonus counter,
  animated score, level-complete celebration and next level. Three hand-written levels.
- **v0.3.0** (M2) — Letter wheel: drag across letters with touch or mouse, backtrack, release
  to submit; animated shuffle. Header with level and score.
- **v0.2.0** (M1) — Game rules in `src/core`: Spanish normalization, levels and their validity
  rules, word evaluation and scoring, game state and level progression. Three hand-written levels.
- **v0.1.0** (M0) — Svelte 5 + TS scaffold, quality gates, CI, auto-deploy to GitHub Pages, design tokens (light/dark), Spanish UI strings.
