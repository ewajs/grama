/** A monotonic millisecond sample, with a new visit ID for each clock domain/reload. */
export type ClockSample = { visit: string; ms: number };

/** Checkpointable active time; samples are meaningful only within the same visit. */
export type Timing = { activeMs: number; timing: 'reliable' | 'uncertain' } & (
  { state: 'running'; sample: ClockSample } | { state: 'paused' | 'finished' }
);

/** App intents; restore recovers a saved checkpoint, interrupt reports an unmeasured gap. */
export type TimingEvent =
  | { kind: 'resume' | 'checkpoint' | 'pause' | 'finish'; sample: ClockSample }
  | { kind: 'restore' | 'interrupt' };

/** Waiting for a ready, visible, interactive challenge; no clock is read here. */
export const NEW_TIMING: Timing = { state: 'paused', activeMs: 0, timing: 'reliable' };

/**
 * Accumulates only observed running intervals. Call pause before hiding/covering a
 * challenge; an unexplained suspension uses interrupt. Restoring a running checkpoint
 * keeps known time but never invents the missing tail. Uncertainty is irreversible.
 */
export function updateTiming(clock: Timing, event: TimingEvent): Timing {
  if (clock.state === 'finished') return clock;
  if (!('sample' in event)) {
    return clock.state === 'running'
      ? { state: 'paused', activeMs: clock.activeMs, timing: 'uncertain' }
      : clock;
  }
  const { sample } = event;
  if (clock.state === 'paused' && event.kind !== 'resume') {
    return event.kind === 'finish' ? { ...clock, state: 'finished' } : clock;
  }
  const valid = Number.isFinite(sample.ms) && sample.ms >= 0 && sample.visit !== '';
  const continuous =
    clock.state !== 'running' ||
    (sample.visit === clock.sample.visit && sample.ms >= clock.sample.ms);
  const elapsed = clock.state === 'running' ? sample.ms - clock.sample.ms : 0;
  const activeMs = clock.activeMs + elapsed;
  if (!valid || !continuous || !Number.isFinite(activeMs)) {
    return {
      state: event.kind === 'finish' ? 'finished' : 'paused',
      activeMs: clock.activeMs,
      timing: 'uncertain',
    };
  }
  const state =
    event.kind === 'finish' ? 'finished' : event.kind === 'pause' ? 'paused' : 'running';
  return state === 'running'
    ? { state, activeMs, timing: clock.timing, sample: { ...sample } }
    : { state, activeMs, timing: clock.timing };
}
