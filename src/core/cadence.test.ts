import { describe, expect, it } from 'vitest';
import { CYCLE, FIRST_EXTRA, HARDER_FROM, occurrence, tierFor } from './cadence';

const tiers = (from: number, count: number, difficulty: 'relaxed' | 'normal' | 'challenging') =>
  Array.from({ length: count }, (_, index) => tierFor(from + index, difficulty));

describe('tierFor', () => {
  it('follows the 7-level cycle', () => {
    expect(tiers(15, 7, 'normal')).toEqual(CYCLE);
  });

  it('has no extra hard before level 15', () => {
    expect(tiers(1, FIRST_EXTRA - 1, 'normal')).not.toContain('extra');
    expect(tierFor(7, 'normal')).toBe('hard');
  });

  it('always follows an extra hard with an easy level', () => {
    const run = tiers(15, 200, 'normal');
    run.forEach((tier, index) => {
      if (tier === 'extra' && index + 1 < run.length) expect(run[index + 1]).toBe('easy');
    });
  });

  it('gets harder with progress', () => {
    const early = tiers(15, 7, 'normal').filter((tier) => tier === 'easy').length;
    const later = tiers(HARDER_FROM + 6, 7, 'normal').filter((tier) => tier === 'easy').length;
    expect(later).toBeLessThan(early);
  });

  it('is one tier easier when relaxed, never extra hard', () => {
    expect(tiers(15, 7, 'relaxed')).toEqual([
      'easy',
      'easy',
      'easy',
      'medium',
      'easy',
      'easy',
      'hard',
    ]);
    expect(tiers(1, 300, 'relaxed')).not.toContain('extra');
  });

  it('is one tier harder when challenging', () => {
    expect(tiers(15, 7, 'challenging')).toEqual([
      'medium',
      'hard',
      'hard',
      'extra',
      'medium',
      'hard',
      'extra',
    ]);
  });
});

describe('occurrence', () => {
  it('counts earlier levels of the same tier and size', () => {
    // Levels 1, 5 and 8 are easy, all with 6 letters.
    expect(occurrence(1, 'normal')).toBe(0);
    expect(occurrence(5, 'normal')).toBe(1);
    expect(occurrence(8, 'normal')).toBe(2);
  });

  it('starts over when the size changes', () => {
    // Level 16 is the first with 7 letters.
    expect(occurrence(16, 'normal')).toBe(0);
  });
});
