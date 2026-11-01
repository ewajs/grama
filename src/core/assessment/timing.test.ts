import { expect, it } from 'vitest';
import { NEW_TIMING, updateTiming, type ClockSample, type TimingEvent } from './timing';

const sample = (ms: number, visit = 'visit-1'): ClockSample => ({ ms, visit });
const event = (
  kind: 'resume' | 'checkpoint' | 'pause' | 'finish',
  ms: number,
  visit = 'visit-1',
): TimingEvent => ({ kind, sample: sample(ms, visit) });

it('counts visible thinking time, excluding pauses and repeated resume events', () => {
  let clock = updateTiming(NEW_TIMING, event('resume', 100));
  clock = updateTiming(clock, event('resume', 150));
  clock = updateTiming(clock, event('checkpoint', 200));
  clock = updateTiming(clock, event('checkpoint', 200));
  expect(clock.activeMs).toBe(100);
  clock = updateTiming(clock, event('pause', 250));
  clock = updateTiming(clock, event('pause', 300));
  clock = updateTiming(clock, event('resume', 1000));
  clock = updateTiming(clock, event('finish', 1100));
  expect(clock).toEqual({ state: 'finished', activeMs: 250, timing: 'reliable' });
  expect(updateTiming(clock, event('finish', 1200))).toBe(clock);
  expect(updateTiming(clock, event('resume', 1300))).toBe(clock);
  expect(NEW_TIMING.activeMs).toBe(0);
});

it('restores paused checkpoints across visits without subtracting unrelated clock samples', () => {
  const running = updateTiming(NEW_TIMING, event('resume', 5000));
  const paused = updateTiming(running, event('pause', 5100));
  expect(updateTiming(paused, { kind: 'restore' })).toBe(paused);
  const resumed = updateTiming(paused, event('resume', 5, 'visit-2'));
  expect(updateTiming(resumed, event('finish', 55, 'visit-2'))).toEqual({
    state: 'finished',
    activeMs: 150,
    timing: 'reliable',
  });
});

it.each(['restore', 'interrupt'] as const)(
  'preserves known time and marks a running %s uncertain',
  (kind) => {
    const running = updateTiming(
      updateTiming(NEW_TIMING, event('resume', 10)),
      event('checkpoint', 30),
    );
    const restored = updateTiming(running, { kind });
    expect(restored).toEqual({ state: 'paused', activeMs: 20, timing: 'uncertain' });
    const resumed = updateTiming(restored, event('resume', 1, 'visit-2'));
    expect(updateTiming(resumed, event('finish', 11, 'visit-2')).timing).toBe('uncertain');
  },
);

it.each([sample(9), sample(Number.NaN), sample(Infinity), sample(-1), sample(100, 'visit-2')])(
  'does not invent elapsed time for a discontinuous clock: %j',
  (at) => {
    const running = updateTiming(NEW_TIMING, event('resume', 10));
    expect(updateTiming(running, { kind: 'checkpoint', sample: at })).toEqual({
      state: 'paused',
      activeMs: 0,
      timing: 'uncertain',
    });
  },
);

it('rejects a new clock domain during duplicate resume instead of hiding an unmeasured gap', () => {
  const running = updateTiming(NEW_TIMING, event('resume', 100));
  expect(updateTiming(running, event('resume', 200, 'visit-2')).timing).toBe('uncertain');
});

it('does not count paused checkpoints or lose uncertainty on invalid resume', () => {
  expect(updateTiming(NEW_TIMING, event('checkpoint', 100))).toBe(NEW_TIMING);
  expect(updateTiming(NEW_TIMING, event('resume', -1))).toEqual({
    state: 'paused',
    activeMs: 0,
    timing: 'uncertain',
  });
});
