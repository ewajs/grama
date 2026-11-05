# Personal performance and skill model experiments

Status: D38 selects the existing Glicko-2 engine with a provisional benchmark adapter.
The progress screen uses the versioned calculation/history projection. Complete persisted-profile export is available; import, formal calibration and remaining M22 controls are deferred.

## Performance version 2

`core/assessment/performance` converts a completed puzzle into one fractional Glicko
result. `app/assessment/performance.performanceHistory` validates, deduplicates and sorts
original history, then calls the existing `ratePeriod` once per rated puzzle. The prior
is 1500 / RD 350 / volatility 0.06, with tau 0.5. There is no ceiling or floor on the
player rating. Glicko smooths the updates; no additional recent-five average is applied.
Version 2 replaces the unpublished bounded version 1; no derived score was persisted.

All game-model constants live in `PERFORMANCE`. For stored difficulty `d`, total target
letters `L`, revealed hint letters `H`, bonus words found `B`, and reliable active time:

```text
opponent.rating = 1500 + 400 × (d − 3)
opponent.deviation = 150
hintPenalty = 0.15 × min(1, H / (0.2 × L))
bonusAdjustment = 0.05 × B / (B + 3)
referenceMs = L × 4000 × 2^(d − 2.75)
timeAdjustment = 0.05 × clamp(log2(referenceMs / activeMs), −1, 1)
result = 0.65 − hintPenalty + bonusAdjustment + timeAdjustment
```

Missing, zero or uncertain timing gives a neutral time adjustment. The calculation uses
log space for the assumed pace. Four seconds per target letter at difficulty 2.75 is a
starting assumption, not an established par time. Twice as fast contributes +0.05, twice
as slow −0.05; larger differences have no further influence. Hints cost proportionally
to board size, up to −0.15 when 20% of target letters have been revealed. Three extras
contribute +0.025; further extras have diminishing returns toward +0.05. Ordinary game
reward points never enter the formula.

These defaults deliberately make difficulty primary: one difficulty point moves the
opponent by 400 rating points. The fractional result stays between 0.45 and 0.75; that
bounded match outcome does not bound the player's Glicko rating. The completion baseline
of 0.65 rewards an independent solve more than a draw. A sustained equivalent performance
settles near an implied benchmark level rather than awarding accumulating points forever.
A strong player can lose rating on an easy solve that supplies weaker evidence than their
current estimate. This is performance estimation, not an XP counter or a completion reward.

Worked examples with twenty target letters, starting with no extras:

| Difficulty | Hints | Time                | Opponent rating | Fractional result |
| ---------- | ----- | ------------------- | --------------- | ----------------- |
| 2.5 (easy) | 0     | unavailable         | 1300            | 0.65              |
| 3.5 (hard) | 0     | unavailable         | 1700            | 0.65              |
| 2.75       | 0     | unavailable or 80 s | 1400            | 0.65              |
| 2.75       | 1     | unavailable or 80 s | 1400            | 0.6125            |
| 2.75       | 4     | unavailable or 80 s | 1400            | 0.50              |
| 2.75       | 0     | 40 s or faster      | 1400            | 0.70              |
| 2.75       | 0     | 160 s or slower     | 1400            | 0.60              |

At difficulty 2.75, three extras and neutral timing give 0.675. Difficulty and opponent
RD are heuristic, not population calibration. Fractional outcomes are an explicit
extension of the published binary/draw model: the same equations accept finite results
in [0,1], retaining the reference-tested discrete behavior. They are neither win
probabilities nor independent matches against multiple ghosts.

### History, uncertainty and trend

- Combine numbered/daily puzzles across content versions using their original descriptors.
  Require a supported protocol, presented complete puzzle and matching result/exposure
  identity. Collapse identical IDs; reject conflicting IDs/sequences. Sort once by saved
  sequence and rate once per admitted completion. Numerical failures propagate as errors;
  never substitute an unchanged estimate or average only surviving results.
- Known repeats/replays and missing difficulty remain in completed history with no match
  or rating update. Unknown exposure is admitted provisionally without rewriting the flag.
  Abandoned attempts are not losses; past sessions are not reconstructed.
- Return a rating snapshot for every rated puzzle and the latest as current, immediately
  after the first completion. After six updates, compare the mean of the latest three
  ratings with the previous three: ±15 rating points is up/down, otherwise steady. This
  is a descriptive trend, not a confidence claim or percentage improvement.
- Carry Glicko deviation/volatility internally. One completion is one active period;
  filtered evidence is not an idle period. No calendar inactivity inflation is applied
  in version 2, so there is no invented session-to-day conversion or rating decay.
- Contrarreloj retains chronological raw points and its recorded-history best separately,
  including practice runs and uncertain timing. This best can differ from the older
  all-time game record. Trial results do not update the puzzle rating.
- Recompute from original records when policy changes and bump `PERFORMANCE.version`.
  No schema, exposure, generator or game-save changes. Projection is O(n log n) time,
  O(n) memory, with bounded work per update and no pairwise comparison groups.

Speed can partly offset a small hint penalty; extra-word hunting takes time but earns a
small bonus. Those are documented initial tradeoffs. The metric estimates personal game
performance, not a calibrated cognitive ability or population percentile. Friends need
no prescribed test workload. The player screen now shows the rating, chart and recent results.

## Glicko-2 engine

`core/assessment/glicko2` implements [Glickman's 2022 reference](https://www.glicko.net/glicko/glicko2.pdf).
`ratePeriod` consumes pre-period opponent snapshots and independent results (including the fractional game extension),
then returns an unrounded mean, deviation and volatility. Game payloads and rewards do
not enter this module. The official example is checked alongside an independently
bisected volatility root, symmetry, uncertainty, inactivity and numerical boundaries.

The experimental prior is 1500 / RD 350 / volatility 0.06, with tau 0.5. Our operational
policy caps RD at 350 and requires input RD in (0, 350]; this cap is explicit policy,
not an extra claim from the reference. Invalid input, out-of-range arithmetic or a
volatility search exceeding 100 bracket/solver iterations throws `RangeError`. Callers
must retain original evidence and report an unavailable estimate rather than persist
NaN, silently drop a result or substitute an unchanged rating on numerical failure.

## Period and uncertainty policy

- A period is supplied by the caller. The module makes no session/day or wall-clock
  assumption. The reference recommends batches averaging at least 10–15 results;
  version 2 deliberately uses one rated puzzle per period for responsive updates.
- One active update includes its own volatility diffusion. Empty results advance one
  idle period; `inflateRating` advances an explicit whole number of idle periods.
  Neither inactivity operation changes mean or volatility. Do not inflate the same
  active period twice or mix daily and session diffusion with the same uncalibrated sigma.
- Filtering a replay, unknown exposure or unfinished attempt does not itself create
  an idle period. The application must define elapsed periods independently of eligibility.
- All results use the ratings at the start of the period. Calling the update repeatedly
  within a batch implements a different period policy, even with the same results.
- The mathematical module cannot detect duplicated/correlated evidence. Comparing one
  run to twenty ghosts does not supply twenty independent new runs. Identity, eligibility
  and observation weighting remain responsibilities of the evidence model.
- Mean ± 2 RD is a model-dependent uncertainty interval, not a guaranteed skill range;
  mean − 2 RD must not be described as an assured minimum ability.

## What still needs validation

Grama observations do not yet constitute calibrated opponents or match outcomes. The
levelScore-to-rating mapping and fixed challenge RD proposed in the handoff are hypotheses.
A deterministic difficulty formula does not establish low calibration uncertainty.
Hint-free completion can saturate on easy boards; Glicko-2 alone does not prevent repeated
easy wins from implying unsupported ability. Solve-time comparisons need a justified
reference distribution rather than an invented par time or arbitrary hint/time blend.

The engine accepts finite fractional results in [0,1] for the explicit version-2 adapter.
This extension does not authorize treating correlated ghost comparisons as independent evidence.
Ghost ratings derived from the same player's history also do not establish an absolute
external scale. Keep personal baseline comparisons distinct from calibrated ability.

If calibrated rating research resumes: choose an evidence model and period policy against published acceptance thresholds. Test plateau,
improvement, decline, challenge mix, assistance, missing evidence and repeated easy play.
Retain replay/unknown/timing exclusions already defined by `eligibilityOf`; unavailable
or ceiling-limited evidence must remain explicit before a numeric progress view ships.

## Personal baseline experiment

`core/assessment/baseline` takes eligible samples in caller-supplied comparable cohorts.
It retains the first ten distinct attempts as reference and the latest ten subsequent
attempts as recent evidence. Each recent attempt gets one ordinal win/tie/loss average
against reference. The summary waits for both windows; its sample count is ten recent
attempts, not one hundred independent comparisons. IDs and sequence order are retained,
exact duplicates collapse, conflicts fail, and separate cohorts never share a baseline.
Late-arriving older evidence can change the reference on recomputation; provenance stays
visible. This is a descriptive comparison, with no ability scale or confidence interval.

Run `npm run assessment:evaluate` for reproducible JSON (128 seeds, 60 attempts each).
Optional arguments select seed count and starting seed, so later acceptance tests can use
a disjoint range. The report embeds protocol constants. Synthetic skill changes by ±200
after the reference window; performance has logistic noise of scale 200. Each distinct
attempt is one experimental Glicko period. These choices are not calibrated Grama policy.

Exploratory seeds 0–127 give mean baseline comparisons 0.4941 for stable performance,
0.6594 after improvement, and 0.3355 after decline. Separate easy/hard cohorts remain
near 0.5 when only the challenge mix changes. Perfect easy outcomes tie at 0.5, while
the fixed-challenge Glicko hypothesis gains 138.15 points after its reference period:
censored completion cannot identify a ceiling or establish unchanged latent ability.

Duplicating inputs leaves baseline windows/counts unchanged. The deliberately invalid
negative control treats each result as twenty identical independent matches: first-period
RD falls from 247.19 to 76.17, and all 128 runs later hit the numerical failure guard.
Failures are counted and the final mean is withheld, rather than averaging surviving
runs or substituting unchanged ratings. This is not an evaluation of every ghost design.
Inactivity keeps the mean unchanged; ninety supplied idle periods add uncertainty.

These are exploratory checks, not acceptance thresholds or real-world validation. Model
selection is deferred by D37; the research projection below applies the existing eligibility
rules before comparing stored observations.

## Player progress view

`ProgressScreen` loads all validated history through the recorder queue on entry and
calls `performanceHistory` once per successful load. It renders current Glicko state,
a trend, the latest ten rated puzzles in `RatingChart`, the latest ten completed puzzles,
and separate trial history/best. The chart includes a spoken label for every value;
its scale uses 50-point ticks with padding so tiny changes do not fill the chart.
Read or calculation errors produce a retry action without disrupting play.

The retired cohort UI/projection and Grama cohort adapter have been removed. Pure
baseline comparisons remain isolated in the offline evaluation experiment above.
There are no cohort quotas, normal-flow refresh button or GitHub feedback form.
Known practice remains visible without rating updates; uncertain time is omitted from
the rows while the rest of the completion can count. Observations are never uploaded.
`app/assessment/export.historyFile` creates format `grama-assessment-history`, version 2.
It retains top-level original finalized `records`, export time, app version/build,
`PERFORMANCE`, Glicko prior and tau. `profile` holds the exact five Grama localStorage
values (null for absent keys), preserving the existing save/content versions. `assessment`
contains schema version, unfinished checkpoints, exposure ownership and sequence counter.
`downloadHistory` reads a consistent recording snapshot behind queued writes, then reads
the saved profile and creates a local JSON Blob/download link. It releases the URL after
the browser starts reading it. Null or failed reads create no partial file; blocked
localStorage never silently substitutes defaults. This exports persisted state rather
than unsaved memory, and is not a transaction across tabs and both storage systems.
The UI describes the contents and notes that import is not available yet. Model changes
can still be investigated from the original `records` with the corresponding source/build.

## Player learning guide

The Spanish VitePress pages [Tu nivel de juego](https://ewajs.github.io/grama/guia/tu-nivel)
and [El cálculo, paso a paso](https://ewajs.github.io/grama/guia/calculo-del-nivel) explain
rating/RD/volatility, benchmark assumptions, every update equation and a reproducible
worked example. `RatingLab.vue` imports the actual core functions for its hypothetical
single-update calculator; its graph illustrates the expected-result equation. It never
reads or writes player history. VitePress renders math at build time with MathJax,
including SVG and assistive MathML; no remote rendering service is needed.
