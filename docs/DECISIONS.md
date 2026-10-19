# Decisions

Technical and product decisions worth remembering: what we chose, why, and when to look
at it again. Newest first. Refer to an entry by its number (e.g. "see D6").

When a decision is replaced, edit its entry to say so and link the new one; don't
delete it, the history is the point.

---

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

## D4 · Levels generated ahead of time — 2026-10-18

- **Decision:** A script generates levels into static JSON that ships with the app. The
  generator itself is a pure function in `src/core`, so it could later run on the device
  for truly infinite play.
- **Why:** Fixed, reviewable, testable data; word-list fixes don't reshuffle levels
  under players. On-device generation would need a shipped dictionary and versioning.

## D3 · Levels carry their own bonus words; no dictionary shipped — 2026-10-18

- **Why:** Keeps the download tiny and validation trivial; bonus words are only ever
  formed from that level's letters.

## D2 · Language packs from day one, Spanish first — 2026-10-18

- **Decision:** A language = word rules (`Language` in `src/core`) + level data
  (`src/content/<lang>`) + UI strings (`src/i18n/<lang>.ts`).
- **Why:** Adding a language and a picker later must not need a refactor. The cost now
  is one type and one strings module.

## D1 · Stack — 2026-10-18

| Concern       | Choice                                    | Why                                                                              |
| ------------- | ----------------------------------------- | -------------------------------------------------------------------------------- |
| Language      | TypeScript (strict)                       | Types document the domain; safe refactors as features grow.                      |
| UI            | Svelte 5 + Vite (plain SPA, no SvelteKit) | Little boilerplate, tiny bundle, built-in transitions/springs. No router needed. |
| Rendering     | DOM + SVG                                 | Crisp at any DPI, accessible, easy to animate.                                   |
| Game logic    | Framework-free TS in `src/core`           | Pure functions, trivially unit-tested, independent of the UI layer.              |
| Unit tests    | Vitest                                    | Shares Vite config, fast.                                                        |
| E2E tests     | Playwright (mobile + desktop viewport)    | A few smoke tests of the real gesture flow (see D10).                            |
| Lint / format | ESLint + Prettier + `svelte-check`        | One `npm run check` gate.                                                        |
| PWA           | `vite-plugin-pwa` (Workbox)               | Manifest + offline service worker with minimal config.                           |
| Content       | Node script (`scripts/`) → static JSON    | See D4.                                                                          |
| Hosting / CI  | GitHub Pages + GitHub Actions             | No backend needed; every push to `main` deploys.                                 |
| Runtime       | Node 24 LTS, npm                          | No extra tooling.                                                                |

Rejected: React (more ceremony plus an animation library for the same result),
Phaser/canvas (fights crisp text and accessibility), SvelteKit (routing/SSR we don't need).
