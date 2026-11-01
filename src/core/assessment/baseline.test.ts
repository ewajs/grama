import { expect, it } from 'vitest';
import { compareBaselines, type BaselineSample } from './baseline';

const samples = (values: number[], cohort = 'same'): BaselineSample[] =>
  values.map((value, index) => ({ id: String(index), sequence: index + 1, cohort, value }));

it('keeps a fixed reference, disjoint recent window and one score per new attempt', () => {
  const history = samples([1, 3, 2, 4, 100, 100, 4, 2]);
  const [report] = compareBaselines(history, 2);
  expect(report).toMatchObject({
    samples: 8,
    referenceIds: ['0', '1'],
    recentIds: ['6', '7'],
    recentScores: [1, 0.5],
    comparison: 0.75,
  });
  expect(compareBaselines(history.toReversed(), 2)).toEqual([report]);
  expect(history.map((sample) => sample.sequence)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
});

it('does not interpret ties as progress or overlapping/sparse observations as a comparison', () => {
  expect(compareBaselines(samples([1, 1, 1, 1]), 2)[0]?.comparison).toBe(0.5);
  expect(compareBaselines(samples([1, 2, 3]), 2)[0]).toMatchObject({
    referenceIds: ['0', '1'],
    recentIds: ['2'],
    comparison: null,
  });
  expect(compareBaselines([])).toEqual([]);
});

it('does not compare an easier cohort against the harder reference', () => {
  const history = samples([1, 2, 10, 20]).map((sample, index) => ({
    ...sample,
    cohort: index < 2 ? 'hard' : 'easy',
  }));
  const reports = compareBaselines(history, 2);
  expect(reports).toHaveLength(2);
  expect(reports.every((report) => report.comparison === null)).toBe(true);
});

it('deduplicates copied evidence without changing score, windows or independent sample counts', () => {
  const history = samples([1, 2, 3, 4]);
  expect(
    compareBaselines(
      history.flatMap((sample) => Array.from({ length: 20 }, () => ({ ...sample }))),
      2,
    ),
  ).toEqual(compareBaselines(history, 2));
});

it.each([{ value: 9 }, { cohort: 'different' }, { sequence: 5 }])(
  'rejects conflicting identity rather than choosing by order: %j',
  (change) => {
    const first = samples([1])[0]!;
    expect(() => compareBaselines([first, { ...first, ...change }])).toThrow(/Conflicting/);
  },
);

it('rejects duplicate sequences owned by another identity', () => {
  const first = samples([1])[0]!;
  expect(() => compareBaselines([first, { ...first, id: 'other' }])).toThrow(/Conflicting/);
});

it.each([0, -1, 1.5, NaN, Infinity])('rejects invalid window %s', (window) => {
  expect(() => compareBaselines([], window)).toThrow(RangeError);
});

it.each([
  { id: '' },
  { cohort: '' },
  { sequence: 0 },
  { sequence: 0.5 },
  { value: NaN },
  { value: Infinity },
])('rejects invalid sample %j', (change) => {
  expect(() => compareBaselines([{ ...samples([1])[0]!, ...change }])).toThrow(RangeError);
});
