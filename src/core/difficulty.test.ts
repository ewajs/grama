import { describe, expect, it } from 'vitest';
import { classify, levelScore, TIER_STARTS } from './difficulty';

describe('levelScore', () => {
  it('grows with rarer targets', () => {
    const common = [{ length: 4, rank: 50 }];
    const rare = [{ length: 4, rank: 15000 }];
    expect(levelScore(rare, 6)).toBeGreaterThan(levelScore(common, 6));
  });

  it('grows with longer targets', () => {
    expect(levelScore([{ length: 6, rank: 99 }], 6)).toBeGreaterThan(
      levelScore([{ length: 3, rank: 99 }], 6),
    );
  });

  it('evens out bigger wheels, where long words come naturally', () => {
    const targets = [{ length: 5, rank: 999 }];
    expect(levelScore(targets, 8)).toBeLessThan(levelScore(targets, 6));
  });

  it('averages over targets', () => {
    // log10(100) = 2, plus 0.25 per letter beyond 3.
    const targets = [
      { length: 3, rank: 99 },
      { length: 5, rank: 99 },
    ];
    expect(levelScore(targets, 6)).toBeCloseTo(2.25);
  });
});

describe('classify', () => {
  it('places scores in tiers by where each tier begins', () => {
    expect(classify(TIER_STARTS.medium - 0.01)).toBe('easy');
    expect(classify(TIER_STARTS.medium)).toBe('medium');
    expect(classify(TIER_STARTS.hard)).toBe('hard');
    expect(classify(TIER_STARTS.extra)).toBe('extra');
    expect(classify(9)).toBe('extra');
  });
});
