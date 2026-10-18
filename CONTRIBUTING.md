# Development guidelines

Read with [`docs/GAME.md`](docs/GAME.md) (what the game does) and
[`docs/PLAN.md`](docs/PLAN.md) (what we're building next).

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

## Architecture

```
src/
  core/        Pure game logic. No DOM, no Svelte, no storage. Plain functions + types.
  content/     Generated level data per language (content/es/…) and its loader.
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

Dependency direction: `ui → app → (core, content, storage)`. `core` imports nothing
from the rest. Unit tests live next to the code: `evaluate.ts` + `evaluate.test.ts`.

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
- **Pre-1.0 there is no backwards compatibility.** When something is replaced, delete the
  old version: no migrations, deprecated aliases, fallbacks or feature flags kept for old
  data or old code paths. Breaking saves or level data between versions is fine.
- Prettier decides formatting; ESLint warnings are errors in CI.

## Testing

Test sensibly, not exhaustively:

- **`core` and `scripts`**: unit-test every rule and edge case (this is where bugs
  hurt most and tests are cheapest).
- **`ui/lib`** pure helpers (geometry, hit-testing): unit tests.
- **Components**: no snapshot tests. Cover behavior through a few Playwright flows
  (draw a word, complete a level, persistence after reload) on a mobile and a
  desktop viewport.
- A bug fix starts with a failing test when practical.

## UI and motion

- Use design tokens (`var(--color-accent)`, `var(--dur-fast)`); no ad-hoc colors or durations.
- Mobile first; test at 375×667 and desktop. Respect safe areas.
- Animations: transform/opacity only, 120–250 ms, never block input.
  Honor `prefers-reduced-motion`.
- Touch targets ≥ 44px. Use pointer events (one code path for touch and mouse).

## Commands

| Command          | Does                                                       |
| ---------------- | ---------------------------------------------------------- |
| `npm run dev`    | Dev server (`--host` to test on a phone on the same Wi-Fi) |
| `npm run check`  | Lint + typecheck + unit tests (the PR gate)                |
| `npm test`       | Unit tests in watch mode                                   |
| `npm run e2e`    | Playwright tests                                           |
| `npm run build`  | Production build to `dist/`                                |
| `npm run levels` | Regenerate level data (from M4)                            |

First-time setup: `npm install` and `npx playwright install chromium`. `npm run levels` arrives with M4.

## Commits and releases

- Conventional commits: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Tag `v0.N.0` at the end of each milestone and add a changelog line in PLAN.md.
- Record any non-obvious decision (library, data source, rule change) in the
  PLAN.md decision log.
