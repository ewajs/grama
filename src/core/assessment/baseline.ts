/** One eligible original observation; higher values mean better performance within its cohort. */
export type BaselineSample = { id: string; sequence: number; cohort: string; value: number };

/** Personal ordinal comparison with provenance; pair counts are never independent sample counts. */
export type BaselineComparison = {
  cohort: string;
  samples: number;
  referenceIds: readonly string[];
  recentIds: readonly string[];
  recentScores: readonly number[];
  comparison: number | null;
};

/** Experimental reference/recent window size, in distinct eligible attempts per cohort. */
export const BASELINE_WINDOW = 10;

/**
 * Compares the last window against the first, non-overlapping reference window per cohort.
 * Each recent score averages ordinal wins (1), ties (0.5) and losses (0) against reference.
 * A summary needs two full windows. Duplicate identities do not create extra observations;
 * conflicting identities/sequences fail rather than choosing evidence by input order.
 */
export function compareBaselines(
  samples: readonly BaselineSample[],
  window = BASELINE_WINDOW,
): BaselineComparison[] {
  if (!Number.isSafeInteger(window) || window < 1) throw new RangeError('Invalid baseline window');
  const unique = new Map<string, BaselineSample>(),
    sequences = new Map<number, string>();
  for (const sample of samples) {
    if (
      !sample.id ||
      !sample.cohort ||
      !Number.isSafeInteger(sample.sequence) ||
      sample.sequence < 1 ||
      !Number.isFinite(sample.value)
    )
      throw new RangeError('Invalid baseline sample');
    const before = unique.get(sample.id),
      owner = sequences.get(sample.sequence);
    if (
      (before &&
        (before.sequence !== sample.sequence ||
          before.cohort !== sample.cohort ||
          before.value !== sample.value)) ||
      (owner !== undefined && owner !== sample.id)
    )
      throw new RangeError('Conflicting baseline identity');
    unique.set(sample.id, sample);
    sequences.set(sample.sequence, sample.id);
  }
  const cohorts = new Map<string, BaselineSample[]>();
  for (const sample of [...unique.values()].sort((a, b) => a.sequence - b.sequence)) {
    const group = cohorts.get(sample.cohort) ?? [];
    group.push(sample);
    cohorts.set(sample.cohort, group);
  }
  return [...cohorts]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([cohort, group]) => {
      const reference = group.slice(0, window),
        recent = group.slice(window).slice(-window);
      const recentScores = recent.map(
        (sample) =>
          reference.reduce(
            (sum, old) =>
              sum + (sample.value > old.value ? 1 : sample.value === old.value ? 0.5 : 0),
            0,
          ) / reference.length,
      );
      return {
        cohort,
        samples: group.length,
        referenceIds: reference.map((s) => s.id),
        recentIds: recent.map((s) => s.id),
        recentScores,
        comparison:
          recent.length === window ? recentScores.reduce((a, b) => a + b, 0) / window : null,
      };
    });
}
