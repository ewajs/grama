---
title: Working on it
group: Guides
---

# Working on it

The full guidelines are in [CONTRIBUTING](https://github.com/ewajs/grama/blob/main/CONTRIBUTING.md); this is the short
version.

## Commands

| Command                     | Does                                                        |
| --------------------------- | ----------------------------------------------------------- |
| `npm run dev`               | The game, live (`--host` to open it from a phone)           |
| `npm run check`             | Lint, types and unit tests: what CI requires                |
| `npm run e2e`               | Browser tests against a production build (Chromium, WebKit) |
| `npm run build`             | The game, to `dist/`                                        |
| `npm run docs`              | These developer docs, to `dist/docs/`                       |
| `npm run guide`             | The player guide, to `dist/guia/` (`guide:dev` to preview)  |
| `npm run guide:screenshots` | Retake the guide's screenshots from the real game           |
| `npm run words`             | Rebuild the word lists from their pinned sources            |
| `npm run icons`             | Render the app icon to PNG                                  |

## How changes are made

One task from `docs/PLAN.md` per branch and PR, small enough to review in minutes. CI
runs `check`, the e2e suite (Chromium and WebKit, D20) and builds both doc sites on
every PR; merging to `main` runs `check` again and deploys the game, the guide
(`/grama/guia/`) and these docs (`/grama/docs/`) to GitHub Pages (D22). Run
`npm run e2e` locally too when a change touches input, flow or the PWA.

A non-obvious choice gets an entry in `docs/DECISIONS.md`; a rule change updates
`docs/GAME.md` in the same PR; a change players notice may need the guide (`guide/`)
updated too.

## Standards that show up everywhere

- **Pure core.** `src/core` is plain data and functions: easy to test, no surprises.
  Time, storage, randomness and the DOM live at the edges.
- **Documented exports.** Every exported function, type and constant has a TSDoc comment,
  and every module an overview (`@module`). Lint and this site's build fail without them.
- **Text in one place.** Player-facing text lives in `src/i18n`, in Rioplatense Spanish.
- **Tokens for looks.** Colors, sizes and timings come from `src/ui/styles/tokens.css`.
- **No backwards compatibility before 1.0** (D5, D15): replace, don't layer.

## Releases

At the end of a milestone: set `package.json`'s version to `0.N.0` (the app shows it in
Acerca de), add a changelog line in `docs/PLAN.md` and the players' news in `src/i18n`
(`news`), then tag `v0.N.0`.
