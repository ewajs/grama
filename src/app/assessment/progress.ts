import { compareBaselines } from '../../core/assessment/baseline';
import { baselineSample } from './baseline';
import type { GramaRecord } from './payload';

/** Builds beta comparisons and recent original results without changing eligibility or saved data. */
export function progressOverview(records: readonly GramaRecord[]) {
  const byId = new Map(records.map((record) => [record.attempt.id, record]));
  const samples = records.flatMap((record) => {
    const sample = baselineSample(record);
    return sample ? [sample] : [];
  });
  return {
    comparableIds: new Set(samples.map((sample) => sample.id)),
    recent: records.toSorted((a, b) => b.attempt.sequence - a.attempt.sequence).slice(0, 10),
    groups: compareBaselines(samples)
      .flatMap((report) => {
        const id = report.recentIds.at(-1) ?? report.referenceIds.at(-1);
        const record = byId.get(id ?? '');
        return record ? [{ report, record }] : [];
      })
      .sort((a, b) => b.record.attempt.sequence - a.record.attempt.sequence),
  };
}
