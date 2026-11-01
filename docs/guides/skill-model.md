# Skill model candidates

Status: M23 validation work. Recording is live; estimates are not calculated during play
or displayed yet. Backup/restore and the remaining M22 data controls are deferred.

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

Next: implement comparable personal baselines and seeded evaluation tooling, then choose
an evidence model and period policy against published acceptance thresholds. Test plateau,
improvement, decline, challenge mix, assistance, missing evidence and repeated easy play.
Retain replay/unknown/timing exclusions already defined by `eligibilityOf`; unavailable
or ceiling-limited evidence must remain explicit before a numeric progress view ships.
