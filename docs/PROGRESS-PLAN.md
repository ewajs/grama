# Personal progress: replacement plan

Decision: [D37](./DECISIONS.md). Cycle 1 is implemented; cycles 2–3 remain planned.
The existing beta screen remains unchanged until cycle 2 ships.

## Outcome

A player completes one ordinary puzzle and gets an understandable performance result.
After a few puzzles they see their recent direction, without collecting twenty matching
games or interpreting recording diagnostics. Friends test by playing normally.

## Cycle 1 — Implement the provisional metric

Implemented in `core/assessment/performance` and `app/assessment/performance`.
The [metric guide](./guides/skill-model.md#performance-version-1) records the exact
formula, assumptions and worked examples.

Deliver a pure, versioned calculation plus the Grama history adapter in one PR.

- Use the stored difficulty descriptor to put numbered levels and dailies on one scale;
  normalize hint assistance by target letters so different board sizes remain usable.
- Pick an explicit score range, difficulty mapping, hint penalty and time adjustment in
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
- Start with the mean of the latest five scored completions (use those available from
  the first). After six scored completions, compare the latest three with the previous
  three. Define a small neutral band in the implementation and use up/steady/down wording;
  no confidence interval, percentage improvement or absolute ability claim.
- Keep Contrarreloj as raw recent points and recorded personal bests, separate from the
  puzzle metric. Include practice runs in ordinary score history.
- Test ordering, duplicate handling, replay exclusion, unknown exposure, missing timing,
  hints, bounded time influence, harder independent solves, sparse history and smoothing.
  Inspect the worked examples for incentives such as rushing or avoiding useful hints.

This is implementation work, not a new model-research or approval milestone. The
formula and constants are concrete and reviewable in the PR; they can change later.

## Cycle 2 — Replace the beta screen

- Show the current puzzle score immediately, the trend when available, and an accessible
  small recent-score chart with a text equivalent and recent results.
- Explain that difficulty, hints and time affect performance in a short expandable help
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

- Add an accessible, user-triggered local history download with original observations,
  export/metric versions and enough context to reproduce calculations. Clearly state
  what it contains before download; upload nothing automatically.
- Test export completeness, pagination and failed reads. This is diagnostic export,
  not full-profile backup/restore or a prerequisite for using progress.
- Ask friends: “Jugá como siempre. ¿El progreso refleja más o menos cómo te fue? Si algo
  te parece raro, mandame una captura.” Request the optional file only for investigation.

## Follow-ups

Keep bounded retention, explicit assessment deletion and full-profile backup/restore in
M22/M24. Retention must define what happens to replay recognition and recalculation
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
