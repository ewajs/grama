# Grama

Word game PWA (Svelte 5 + TS + Vite, static on GitHub Pages). How we work:

@CONTRIBUTING.md

Read these when the task needs them (they're not loaded up front):

- `docs/GAME.md`: the rules and UX as they are. Read before changing gameplay or anything
  players see.
- `docs/PLAN.md`: milestones and tasks; the next unchecked task is the work.
- `docs/DECISIONS.md`: why things are the way they are (D1…D25).
- `docs/guides/`: how the code fits together (published at https://ewajs.github.io/grama/docs/).
- `guide/`: the players' guide, "Todo sobre Grama" (Spanish, VitePress).

## Invariants

- `src/core` stays pure: no DOM, clock, storage or randomness.
- A rule changes → `docs/GAME.md` in the same PR, and the player guide (`guide/`) if
  players would notice. Code the developer guides describe changes → keep them true.
- `Progress` (anything saved) changes shape → bump `VERSION` in `src/storage/save.ts`.
- The generator, its numbers or the word lists change any level → bump `LEVELS_VERSION`
  (`src/core/generate.ts`) and the golden hash in `src/content/es/words.test.ts`.
- Player-facing text only in `src/i18n` (Rioplatense, voseo); colors and durations are
  tokens, set per theme in `tokens.css`; status- or accent-colored text uses the `-strong`
  tokens.
- Never merge red: `npm run check` passes locally (check its exit code, not just its
  output) and CI is green (check, e2e, docs) before merging.

## Notes for agents

- One PLAN.md task per cycle and PR; stop at the end of the cycle for review unless the
  owner said to keep going.
- CI runs e2e on every PR; also run `npm run e2e` locally when touching input, page flow
  or PWA behavior.
- The owner is learning Svelte: when a PR uses a Svelte concept for the first time
  (runes, snippets, transitions, attachments…), explain it briefly, tied to the code.
