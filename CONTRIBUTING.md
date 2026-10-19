# Development guidelines

Browsable at https://ewajs.github.io/grama/docs/ (guides, diagrams, API reference).
Read with [`docs/GAME.md`](docs/GAME.md) (what the game does),
[`docs/PLAN.md`](docs/PLAN.md) (what we're building next) and
[`docs/DECISIONS.md`](docs/DECISIONS.md) (why things are the way they are).

## Principles

Everything below follows from these. When a rule and a principle disagree, the
principle wins, and we fix the rule.

1. **Simple over complex.** Build the simplest thing that solves today's problem.
   No abstraction, option or extension point until a second real use needs it.
   Deleting code is a feature.
2. **Logic is separated and isolated.** Game rules are pure functions with no knowledge
   of the screen, storage, time or randomness; those live at the edges and are passed in.
   Each module has one job and a small surface.
3. **Code is read far more than written.** Someone new to the codebase (or to Svelte)
   should follow a file top to bottom. Plain names from the game's vocabulary, short
   functions, explicit over clever.
4. **Code documents itself.** Types and TSDoc comments on exports are the reference
   documentation (see _Documentation_); prose docs describe the game and decisions,
   never restate the code.

## Working cycle

Every change follows the same loop, kept small enough to review in minutes:

1. Pick the next unchecked task in `docs/PLAN.md` (mark it `[~]`).
2. Branch from `main`: `feat/wheel-backtrack`, `fix/score-overflow`, `chore/ci-cache`.
3. Implement with tests (see _Testing_). If a rule changes, update `docs/GAME.md` too.
4. `npm run check` green locally; try it in the browser at a phone viewport.
5. Open a PR; CI must pass. Tick the task `[x]` in the same PR.
6. Merge (squash) → `main` deploys to GitHub Pages → verify on a real device
   when the change touches input, layout or PWA behavior.

A task that grows beyond ~a day or ~400 changed lines gets split in `PLAN.md` first.
Non-obvious choices (a library, a data source, a trade-off) get an entry in `DECISIONS.md`.

## Architecture

```
src/
  core/        Pure game logic. No DOM, no Svelte, no storage. Plain functions + types.
  content/     Word lists per language (content/es/…) and their loader.
  i18n/        UI strings per language (es.ts). All player-facing text lives here.
  storage/     Persistence (versioned localStorage). Only place touching storage APIs.
  app/         Game state wiring core + content + storage (Svelte runes store).
  ui/
    components/  Svelte components. Render state, emit intents. No game rules here.
    lib/         UI helpers (geometry, haptics). Pure where possible.
    styles/      Design tokens and global CSS.
  main.ts, App.svelte
scripts/       Offline tooling (level generator). Never imported by the app.
tests/e2e/     Playwright tests.
```

Folders appear when their first file does. Dependency direction:
`ui → app → (core, content, storage)`. `core` imports nothing from the rest.
Unit tests live next to the code: `evaluate.ts` + `evaluate.test.ts`.

## Code style

- TypeScript `strict`. No `any`; prefer `type` aliases and discriminated unions
  (e.g. `{ kind: 'target', word, points }`) over flags and classes.
- Functions in `core` are pure: inputs in, new values out, no mutation of arguments.
- Name things after the game's vocabulary in GAME.md: _level, wheel, board, target,
  bonus, submit, evaluate_. Code identifiers in English; player-facing text only
  through `src/i18n`, never hard-coded in components.
- Components stay small; extract logic to `ui/lib` or `core` once it needs a test.
- Comments explain _why_, not _what_. No commented-out code, no dead code, no TODOs
  without a matching PLAN.md entry.
- Tunable numbers (scores, timings, difficulty) live in one named constant each.
- Add a dependency only when it removes real complexity; note it in the PR.
- **Pre-1.0 there is no backwards compatibility** (D5). When something is replaced,
  delete the old version: no migrations, deprecated aliases, fallbacks or flags.
- Prettier decides formatting; ESLint warnings are errors.

## Documentation

- Every **exported** function, type and constant gets a TSDoc comment (`/** … */`):
  one line saying what it is or does, plus `@param` / `@returns` / `@example` only when
  the signature doesn't already make it obvious. Editors show these on hover, and
  lint fails when one is missing.
- Every Svelte component starts with a `<!-- @component … -->` comment: what it shows,
  its props and the events it emits. Svelte's editor tooling shows it on hover.
- Unexported helpers only get a comment when the _why_ isn't obvious.
- Player-facing Spanish is Rioplatense (voseo) with Argentine references (D8).

```ts
/**
 * Brings a word to the form used for comparison: uppercase, accents removed, `Ñ` kept.
 * @example spanish.normalize('Árbol') // 'ARBOL'
 */
```

## Testing

Two suites, each run where it pays off (D10):

| Suite      | Tool       | Covers                                         | Runs                                                     |
| ---------- | ---------- | ---------------------------------------------- | -------------------------------------------------------- |
| Unit       | Vitest     | `core`, `scripts`, pure helpers in `ui/lib`    | `npm run check`, locally and in CI on every PR           |
| End-to-end | Playwright | Real flows in a browser (drag a word, a level) | Locally, `npm run e2e`, when touching input, flow or PWA |

- Unit-test every rule and edge case in `core`: that's where bugs hurt most and tests
  are cheapest.
- No component unit tests or snapshots. A handful of e2e flows cover the UI.
- A bug fix starts with a failing test when practical.

## UI and motion

- Use design tokens (`var(--color-accent)`, `var(--dur-fast)`); no ad-hoc colors or durations.
- Mobile first; test at 375×667 and desktop. Respect safe areas.
- Animations: transform/opacity only, 120–250 ms, never block input.
  Honor `prefers-reduced-motion`.
- Touch targets ≥ 44px. Use pointer events (one code path for touch and mouse).

## Commands

| Command                     | Does                                                                    |
| --------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`               | Dev server (`--host` to test on a phone on the same Wi-Fi)              |
| `npm run check`             | Lint + typecheck + unit tests (the PR gate)                             |
| `npm test`                  | Unit tests in watch mode                                                |
| `npm run e2e`               | Playwright tests against a production build                             |
| `npm run build`             | Production build to `dist/`                                             |
| `npm run docs`              | Developer docs (guides + API reference) to `dist/docs/`                 |
| `npm run words`             | Rebuild the word lists in `src/content/` from pinned sources (D12)      |
| `npm run icons`             | Render the app icon (`public/icons/*.svg`) to the PNGs installs need    |
| `npm run guide`             | Build the player guide to `dist/guia/` (`guide:dev` to preview it live) |
| `npm run guide:screenshots` | Retake the guide's screenshots from the real game                       |

First-time setup: `npm install`, plus `npx playwright install chromium` to run e2e.

## Commits and releases

- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- At the end of each milestone: set `package.json`'s version to `0.N.0` (the app shows it
  in Acerca de), add a changelog line in PLAN.md and the players' news in `src/i18n` (`news`),
  then tag `v0.N.0`.
