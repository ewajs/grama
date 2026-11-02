# Skill model candidates

Status: M23 validation continues alongside the M24 beta. Personal comparisons and recent
observations are now visible in Tu progreso; absolute skill ratings remain undisplayed. Backup/restore and the remaining M22 data controls are deferred.

## Glicko-2 candidate

`core/assessment/glicko2` implements [Glickman's 2022 reference](https://www.glicko.net/glicko/glicko2.pdf).
`ratePeriod` consumes pre-period opponent snapshots and independent win/draw/loss results,
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
  one Grama session per period remains a hypothesis for evaluation.
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

The candidate accepts only 0, 0.5 and 1 outcomes. Fractional performance and weighted ghost
comparisons require an evaluated extension; no conversion is silently applied here.
Ghost ratings derived from the same player's history also do not establish an absolute
external scale. Keep personal baseline comparisons distinct from calibrated ability.

Next: choose an evidence model and period policy against published acceptance thresholds. Test plateau,
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
selection remains the next task; the projection below applies the existing eligibility
rules before comparing stored observations.

## Grama evidence projection

`app/assessment/baseline.baselineSample` reuses the existing record/payload validators and
`eligibilityOf`. It accepts only completed, acknowledged, positive-duration observations
with matching result, track, mode, protocol and exposure keys. Unsupported, incomplete,
replayed, unknown-exposure or uncertain-timing records produce no baseline sample.

The experimental `grama-baseline:1` cohort key includes scoring/content/payload versions.
Numbered levels and dailies stay separate. Word solving compares active duration (lower
is better), matching tier, wheel size, target count, quarter-point difficulty band, hint
letters and bonus-word count. Changing the number of bonus words does not feed the
same speed comparison. Trial observations compare ordinary points within one unchanged protocol;
random wheel difficulty remains a noise source. Shared `GRAMA_RULES` versions identify
protocol changes without changing rewards or existing saved observations.

Saved-record-shaped fixtures exercise projection and the existing baseline together,
including unique fresh wheels and duplicate IDs. They verify data consistency and group
boundaries, not empirical equivalence of every puzzle in a band. These cohorts remain
provisional; sparse groups have no comparison and no absolute ability rating is inferred.

## Beta feedback loop

The owner prioritized player testing over another pre-UI acceptance phase. `ProgressScreen`
loads history through the existing recorder queue and `progressOverview` applies the
existing adapter/baseline functions. Recent original outcomes stay visible even when
unknown exposure or sparse cohorts prevent comparisons. A manual refresh rereads all pages;
connections and record validation remain owned by the existing assessment store.

The beta uses the existing Grama deployment and adds a Home entry and a GitHub feedback
link. No history is uploaded. Model-selection gates remain open; beta feedback about
clarity, missing comparisons and perceived usefulness informs that next decision.

Everyone on the current deployment has access. Exposure tracking starts with recorded
play, regardless of prior game saves. There is one eligibility policy, with no opt-in,
legacy comparison model or reconstruction of past sessions. Existing observations and
ordinary game progress remain untouched.
