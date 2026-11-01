import { describe, expect, it } from 'vitest';
import { eligibilityOf, exposureFor, type Attempt, type Exposure } from './attempt';

const fresh = exposureFor('puzzle', 'encounter-1', [], 'complete');
const completed: Attempt<{ solved: number }> = {
  id: 'attempt-1',
  sequence: 1,
  game: 'example',
  track: 'solving',
  mode: 'practice',
  rulesVersion: '1',
  contentVersion: '1',
  startedAt: 100,
  activeMs: 50,
  timing: 'reliable',
  exposures: [fresh],
  status: 'completed',
  endedAt: 150,
  result: { solved: 5 },
};

describe('exposure', () => {
  it('records exposure before completion and excludes restarting an inspected puzzle', () => {
    expect(fresh.kind).toBe('first');
    const restarted = exposureFor('puzzle', 'encounter-2', [fresh], 'complete');
    expect(restarted.kind).toBe('repeat');
    expect(eligibilityOf({ ...completed, exposures: [restarted] })).toEqual({
      eligible: false,
      reason: 'repeated-content',
    });
  });

  it('retains the original classification on reload, interruption and resume', () => {
    expect(exposureFor('puzzle', 'encounter-1', [fresh], 'partial')).toBe(fresh);
    const unknown = exposureFor('legacy', 'encounter-2', [fresh], 'partial');
    expect(unknown.kind).toBe('unknown');
    expect(exposureFor('legacy', 'encounter-2', [unknown], 'complete')).toBe(unknown);
  });

  it('keeps repeats known even with incomplete history or a new game attempt', () => {
    expect(exposureFor('puzzle', 'after-reset', [fresh], 'partial').kind).toBe('repeat');
    expect(exposureFor('different-puzzle', 'new', [fresh], 'complete').kind).toBe('first');
  });
});

describe('evidence eligibility', () => {
  it('admits a completed fresh performance; assistance is for the future outcome model', () => {
    expect(eligibilityOf(completed)).toEqual({ eligible: true });
    expect(eligibilityOf({ ...completed, result: { solved: 2 } })).toEqual({ eligible: true });
  });

  it.each(['active', 'abandoned'] as const)('does not treat %s as a loss', (status) => {
    expect(eligibilityOf({ ...completed, status })).toEqual({
      eligible: false,
      reason: 'unfinished',
    });
  });

  it('excludes a trial with any repeated wheel, including within the same run', () => {
    const repeated = exposureFor('puzzle', 'wheel-2', [fresh], 'complete');
    expect(eligibilityOf({ ...completed, exposures: [fresh, repeated] })).toEqual({
      eligible: false,
      reason: 'repeated-content',
    });
  });

  it.each<{ exposures: readonly Exposure[] }>([
    { exposures: [] },
    { exposures: [{ ...fresh, kind: 'unknown' }] },
  ])('excludes missing or uncertain historical exposure: %j', ({ exposures }) => {
    expect(eligibilityOf({ ...completed, exposures })).toEqual({
      eligible: false,
      reason: 'unknown-exposure',
    });
  });

  it('excludes uncertain timing without changing the recorded performance', () => {
    const uncertain = { ...completed, timing: 'uncertain' as const };
    expect(eligibilityOf(uncertain)).toEqual({ eligible: false, reason: 'uncertain-timing' });
    expect(uncertain.result).toEqual(completed.result);
  });
});
