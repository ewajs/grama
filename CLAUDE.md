# Grama

Word game PWA (Svelte 5 + TS + Vite, static on GitHub Pages). Follow these:

@CONTRIBUTING.md
@docs/GAME.md
@docs/PLAN.md
@docs/DECISIONS.md

How the code fits together: `docs/guides/` (published with the API reference at
https://ewajs.github.io/grama/docs/). Keep the guides true when changing what they describe.

Notes for agents:

- Work one PLAN.md task per cycle; stop at the end of the cycle for review
  instead of starting the next task.
- Run `npm run check` before calling a task done, and report failures as they are.
  Run `npm run e2e` only when the change touches input, page flow or PWA behavior (D10).
- Keep `core` pure; if game rules change, update GAME.md in the same change.
- The project owner is learning Svelte through this project. When a change introduces a
  Svelte concept for the first time (runes, snippets, transitions, actions…), explain it
  briefly in the cycle summary, tied to the actual code in the PR.
