import { updateTiming, type ClockSample, type TimingEvent } from '../../core/assessment/timing';
import type { Attempt, Exposure } from '../../core/assessment/attempt';
import type { AssessmentStore } from '../../storage/assessment';
import type { Checkpoint } from '../../storage/assessment-record';
import type { GramaPayload } from './payload';
import type { GramaResult } from './grama';

/** How often visible play checkpoints known time, independently of player input. */
export const RECORDING_INTERVAL = 5_000;
const SUSPENSION_GAP = RECORDING_INTERVAL * 3;
type Store = AssessmentStore<GramaPayload, GramaResult>;
type Saved = Checkpoint<GramaPayload>;
type Queue = (work: () => Promise<boolean>) => Promise<boolean | null>;

/** One observed attempt. Writes are serialized; failures stop recording, not play. */
export class Recording<Observation> {
  #saved: Saved;
  #store: Store;
  #queue: Queue;
  #sample: () => ClockSample;
  #latest: Observation;
  #evidence: (snapshot: Observation) => { payload: GramaPayload; result: GramaResult | null };
  #abandon: boolean;
  #active = false;
  #closed = false;
  #stopped = false;
  #heartbeatPending = false;

  /** Created by GramaRecorder only after exposure has been committed. */
  constructor(
    saved: Checkpoint<GramaPayload>,
    store: AssessmentStore<GramaPayload, GramaResult>,
    queue: (work: () => Promise<boolean>) => Promise<boolean | null>,
    sample: () => ClockSample,
    snapshot: Observation,
    evidence: (snapshot: Observation) => { payload: GramaPayload; result: GramaResult | null },
    abandon: boolean,
  ) {
    this.#saved = saved;
    this.#store = store;
    this.#queue = queue;
    this.#sample = sample;
    this.#latest = snapshot;
    this.#evidence = evidence;
    this.#abandon = abandon;
  }

  /** Immutable identity used to associate a completion with its own rating update. */
  get id(): string {
    return this.#saved.attempt.id;
  }

  /** Combines visibility and overlay state at the UI boundary. */
  active(value: boolean): void {
    if (this.#closed || value === this.#active) return;
    this.#active = value;
    this.#event(value ? 'resume' : 'pause');
  }

  /** Records accepted play; resolves with write success, including finalization on completion. */
  update(snapshot: Observation): Promise<boolean | null> {
    if (this.#closed) return Promise.resolve(false);
    this.#latest = snapshot;
    const complete = this.#evidence(snapshot).result !== null;
    const settled = this.#event(complete ? 'finish' : 'checkpoint');
    if (complete) this.#closed = true;
    return settled;
  }

  /** Heartbeat measures visible thinking time; a stalled observer marks an unmeasured gap. */
  checkpoint(snapshot?: Observation): void {
    if (snapshot !== undefined) this.#latest = snapshot;
    if (this.#active && !this.#closed && !this.#stopped && !this.#heartbeatPending) {
      this.#heartbeatPending = true;
      this.#event('checkpoint', true);
    }
  }

  /** Leaving ordinary puzzles pauses them; replays and trial runs are abandoned. */
  close(): void {
    if (this.#closed) return;
    this.#active = false;
    void this.#event(this.#abandon ? 'abandon' : 'pause');
    this.#closed = true;
  }

  /** Commits a newly presented wheel and its exposure together before input resumes. */
  present(snapshot: Observation, exposure: Exposure): Promise<boolean | null> {
    if (this.#closed || this.#stopped) return Promise.resolve(false);
    this.#latest = snapshot;
    return this.#event('checkpoint', false, exposure);
  }

  #event(
    kind: 'resume' | 'pause' | 'checkpoint' | 'finish' | 'abandon',
    heartbeat = false,
    exposure?: Exposure,
  ) {
    const snapshot = this.#latest,
      sample = this.#sample(),
      endedAt = Date.now(),
      active = this.#active;
    return this.#queue(async () => {
      if (heartbeat) this.#heartbeatPending = false;
      if (this.#stopped) return false;
      const previous = this.#saved;
      const evidence = this.#evidence(snapshot);
      let clock = previous.clock;
      if (clock.state === 'running' && sample.ms - clock.sample.ms > SUSPENSION_GAP) {
        clock = updateTiming(clock, { kind: 'interrupt' });
        if (active && kind === 'checkpoint')
          clock = updateTiming(clock, { kind: 'resume', sample });
      }
      const event: TimingEvent = { kind: kind === 'abandon' ? 'finish' : kind, sample };
      clock = updateTiming(clock, event);
      const next = {
        ...previous,
        clock,
        payload: exposure ? { ...evidence.payload, presented: false } : evidence.payload,
        attempt: {
          ...previous.attempt,
          activeMs: clock.activeMs,
          timing: clock.timing,
          exposures: exposure
            ? [...previous.attempt.exposures, exposure]
            : previous.attempt.exposures,
        },
      };
      if (clock.state === 'finished') {
        let attempt: Exclude<Attempt<GramaResult>, { status: 'active' }>;
        if (kind === 'abandon') {
          attempt = { ...next.attempt, status: 'abandoned', endedAt };
        } else {
          if (evidence.result === null) return false;
          attempt = { ...next.attempt, status: 'completed', endedAt, result: evidence.result };
        }
        const written = await this.#store.finalize({
          ...next,
          clock: { ...clock, state: 'finished' },
          attempt,
        });
        this.#stopped = true;
        return written.ok;
      } else {
        const written = await this.#store.saveCheckpoint(next);
        if (written.ok) this.#saved = written.value;
        else this.#stopped = true;
        return written.ok;
      }
    });
  }
}
