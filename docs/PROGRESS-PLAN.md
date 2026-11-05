# Personal progress: replacement plan

Decision: D38 (amending D37 in `docs/DECISIONS.md`). Cycles 1–3 are implemented. D41/D42 deliver full persisted-profile export and confirmed import; retention/deletion remain follow-ups.
The player screen now uses the Glicko rating and recent history.

## Outcome

A player completes one ordinary puzzle and gets an understandable performance result.
After a few puzzles they see their recent direction, without collecting twenty matching
games or interpreting recording diagnostics. Friends test by playing normally.

## Cycle 1 — Implement the provisional metric

Implemented in `core/assessment/performance` and `app/assessment/performance`.
The [metric guide](./guides/skill-model.md#performance-version-2) records the exact
formula, assumptions and worked examples.

Deliver a pure, versioned calculation plus the Grama history adapter in one PR.

- Use the stored difficulty descriptor to put numbered levels and dailies on one scale;
  normalize hint assistance by target letters so different board sizes remain usable.
- Reuse Glicko-2 with an unbounded rating, difficulty-based opponent, modest hint penalty,
  diminishing extra-word bonus and small optional speed adjustment in
  this cycle. Difficulty and independence dominate; cap the influence of time in both
  directions. Document worked easy/hard, hinted/unhinted and fast/slow examples in the PR
  and skill-model guide. These are product assumptions, not fitted population norms.
- Missing/uncertain time gives no time adjustment. Unknown historical exposure does not
  prevent an otherwise usable completion from contributing; retain the original flags.
  Known repeated puzzles are practice. Missing difficulty produces history without a
  score, not an invented descriptor. An incomplete attempt is never a zero or a loss.
- Deduplicate by attempt identity and order by saved sequence. Recompute from original
  records without changing storage schema, eligibilityOf or the old observations.
  Use a dedicated performance projection rather than loosening research eligibility.
- Start with the existing Glicko prior and update once per rated puzzle, from the first.
  After six updates, compare the latest three rating snapshots with the previous three,
  using a 15-point neutral band and up/steady/down wording;
  no confidence interval, percentage improvement or absolute ability claim.
- Keep Contrarreloj as raw recent points and recorded personal bests, separate from the
  puzzle metric. Include practice runs in ordinary score history.
- Test ordering, duplicate handling, replay exclusion, unknown exposure, missing timing,
  hints, extras, bounded time influence, harder independent solves, sparse history,
  fractional Glicko behavior and stable repeated performance.
  Inspect the worked examples for incentives such as rushing or avoiding useful hints.

This is implementation work, not a new model-research or approval milestone. The
formula and constants are concrete and reviewable in the PR; they can change later.

## Cycle 2 — Replace the beta screen

Implemented in `ProgressScreen` and `RatingChart`, with player docs and browser checks.

- Show the current Glicko rating immediately, the trend when available, and an accessible
  small recent-score chart with a text equivalent and recent results.
- Explain that difficulty, hints, extra words and time affect performance in a short expandable help
  section. Early history says simply that the score will settle as the player plays.
- Remove cohort cards, 1-of-20 quotas, ordinal comparison percentages, research exclusion
  labels and the GitHub feedback requirement. Keep recording details out of normal play.
- Load current history on entry; preserve loading/error handling and ordinary play when
  assessment storage is unavailable. Remove the manual refresh from the normal flow.
- Show Contrarreloj's recent points/best only when there are recorded runs. Label a
  history-derived best accurately if it differs from the existing all-time saved record.
- Replace obsolete cohort-projection code/tests if no active consumer remains. Keep
  isolated research candidates only where useful; do not maintain parallel UI modes.
- Update player rules, copy, guide and screenshots together. Test first completion,
  existing history, sparse/missing timing, practice, empty modes, storage failure and
  navigation in Playwright; check phone, landscape and desktop layouts/accessibility.

Cycle 2 delivers the user-visible feature. Do not hold it for cycle 3, extensive beta
feedback, a Glicko decision or the deferred backup project.

## Cycle 3 — Make voluntary feedback easy

Implemented as a local JSON download in `app/assessment/export` and `ProgressScreen`.

- Add an accessible, user-triggered local history download with original observations,
  export/metric versions and enough context to reproduce calculations. Clearly state
  what it contains before download; upload nothing automatically.
- Test export completeness, pagination and failed reads. This is diagnostic export,
  not full-profile backup/restore or a prerequisite for using progress.
- Ask friends: “Jugá como siempre. ¿El progreso refleja más o menos cómo te fue? Si algo
  te parece raro, mandame una captura.” Request the optional file only for investigation.

## Follow-ups

M22 now delivers complete export before import: saved game, dictionary, trial records,
settings and recording coverage, plus original finalized records, unfinished checkpoints,
the exposure ledger and sequence counter. Confirmed import replaces the profile after
validation and a short preview; historical version-1 files contain only finalized history
and cannot restore full progress. Keep bounded retention and explicit
assessment deletion in M22/M24. Retention must define what happens to replay recognition and recalculation
before deleting exposure evidence. Defer recommendations, formal rating research and
platform extraction until the progress feature has proved useful in ordinary play.

## Documents to update

| Document                                                                        | Change                                                                                                                                               | When                                |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `docs/DECISIONS.md`                                                             | Record D37, preserving earlier decisions as history                                                                                                  | This planning change                |
| `docs/PLAN.md`                                                                  | Replace research-first sequencing with the three delivery cycles; retain deferred tasks                                                              | This planning change                |
| `docs/PROGRESS-PLAN.md`                                                         | Implementation scope and documentation checklist; mark delivered cycles as they ship                                                                 | This planning change and each cycle |
| `docs/guides/skill-model.md`                                                    | Separate research candidates from the shipped metric; document exact formula, constants, versions, worked examples, smoothing, trend and limitations | Cycle 1                             |
| `docs/GAME.md`                                                                  | Replace beta/cohort behavior with the shipped score, practice, missing-time and timed-mode rules                                                     | Cycle 2                             |
| `docs/guides/how-it-works.md`                                                   | Explain original observations → versioned performance projection → progress UI; update component map                                                 | Cycles 1–2                          |
| `guide/progreso.md`                                                             | Replace comparison methodology with score/trend help and ordinary-play examples                                                                      | Cycle 2                             |
| `guide/contrarreloj.md`, `guide/preguntas.md`                                   | Align timed-mode history, storage and progress explanations; describe export when shipped                                                            | Cycles 2–3                          |
| `guide/` screenshots                                                            | Regenerate affected progress/Home illustrations from the real app                                                                                    | Cycle 2                             |
| `src/i18n/es.ts`                                                                | Replace beta/research copy with concise Rioplatense score/trend/help text; export copy in cycle 3                                                    | Cycles 2–3                          |
| `docs/PLAN.md` changelog, `package.json`, lockfile, player news and release tag | Summarize and version the delivered feature at its milestone release                                                                                 | Release                             |

Do not rewrite current-behavior documentation as though the feature already exists.
README and contribution/agent rules need no architectural change for this decision.

## Verification and release

Run `npm run check` for each cycle. For UI/export flows run local `npm run e2e`, build
the developer docs/player guide, and check the production JavaScript budget. CI must be
green before merge. One cycle per PR; stop for review under the existing working rules.
After deployment verify on a real phone, including a profile with existing observations.
Do not change game saves, level content versions, stars, rewards or generation.

## Home and completion polish

Implemented in the Home/completion polish PR; screenshots cover light/dark, rating changes and mode-specific actions.

Keep Jugar as the single dominant Home action. Reuse the current visual language,
spacing, typography and colors. No rating chart or additional stat pills on Home.

### Layout and behavior

- Use the existing logo row for a labeled Guide link on the left and a 44px menu control
  on the right. Keep the logo centered; avoid an extra toolbar/footer row. The guide
  remains available from the menu and rating help as well.
- Reuse the menu/settings/tutorial/about flows from Home and gameplay. Close returns to
  the current screen, with correct labels and focus. Home menu access must not wait for
  word-list loading or create a puzzle exposure; reports must use appropriate available
  context rather than pretending a level is on screen.
- Rebalance the existing progress area into three rows: a full-width Tu progreso card
  with its current Nivel de juego; compact Map/Logros cards together; Tu diccionario.
  Preserve useful summaries when they fit. A profile without a rating gets a friendly
  first-completion prompt, not a displayed earned 1500. Storage failure must not block Home.
- Add one compact rating line to Level Complete, below rewards and above the word recap:
  “Nivel de juego 1.658 · +14”. Vertically center the row; use an explicit sign with green
  for increases, red for decreases and ordinary text for zero. Round the before/after
  values consistently so the visible change reconciles.
  The first rating says “Tu primer nivel de juego …” without implying a prior earned rating.
- Show the update for that exact finalized attempt, using the existing history projection
  and attempt identity. Retain full internal precision. No new formula, persisted rating,
  artificial zero change, history reconstruction or repeated polling. Completion/navigation
  stays responsive while saving; unavailable or unrated evidence omits the numeric update.
- Normal completion keeps Next as primary and adds Inicio as secondary. Returning Home
  advances the completed main level once, preserves rewards and does not present/consume
  the next wheel. Replays keep Back to Map plus Home; dailies retain Share/Home without
  duplicate Home buttons. Contrarreloj keeps its separate score.

### Wiring, documentation and verification

Share a small in-memory rating summary between Home/progress/completion where useful.
Refresh on entry and after finalized play, not on every word or animation frame. The
completion delta comes from the matching attempt's before/after Glicko states, rather
than subtracting two potentially unrelated global summaries (including across tabs).

Update GAME.md, affected developer architecture guidance, player Home/progress/how-to-play
pages and screenshots, plus Rioplatense UI strings. Record any non-obvious integration
choice in DECISIONS.md. Keep all saves, generation, recording eligibility and rating rules.

Focused checks: Home menu settings/help/focus and closing; guide destination; rating after
first/new play and graceful storage failure; positive/negative changes and no replay
update; Next/Home/Map/daily actions preserve progress without reopening the completion
modal or exposing a hidden next board. Check 375×667, 390×844, 844×390 and desktop, light
and dark, reduced motion and keyboard targets. Preserve reading room; allow ordinary
scrolling on short screens instead of shrinking text or touch targets to force a fit.
Run the normal code checks, affected browser flows, both doc builds and size budget.
Open one review PR and stop before merge under the existing working cycle.
