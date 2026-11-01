import { RECIPES } from '../../core/difficulty';
import { LEVELS_VERSION } from '../../core/generate';
import {
  NEW_TIMING,
  updateTiming,
  type ClockSample,
  type TimingEvent,
} from '../../core/assessment/timing';
import type { WordList } from '../../content/words';
import { openAssessment, type AssessmentStore } from '../../storage/assessment';
import { hasAssessmentGap, markAssessmentGap } from '../../storage/assessment-coverage';
import { evidenceJson, type Checkpoint, type Finalized } from '../../storage/assessment-record';
import { describePuzzle } from './grama';
import {
  extendsSession,
  isPuzzlePayload,
  isPuzzleResult,
  placeKey,
  type PuzzleObservation,
  type PuzzlePayload,
  type PuzzleResult,
} from './puzzle';

/** How often visible play checkpoints known time, independently of player input. */
export const RECORDING_INTERVAL = 5_000;
const SUSPENSION_GAP = RECORDING_INTERVAL * 3;
const PREPARE_WAIT = 2_000;
const RULES_VERSION = 'puzzle:1';
type Store = AssessmentStore<PuzzlePayload, PuzzleResult>;
type Saved = Checkpoint<PuzzlePayload>;
type Queue = (work: () => Promise<void>) => void;

/** One visible puzzle encounter. Writes are serialized; failures stop recording, not play. */
export class PuzzleRecording {
  #saved: Saved;
  #store: Store;
  #queue: Queue;
  #sample: () => ClockSample;
  #latest: PuzzleObservation;
  #active = false;
  #closed = false;
  #stopped = false;
  #heartbeatPending = false;

  /** Created by PuzzleRecorder only after exposure has been committed. */
  constructor(
    saved: Checkpoint<PuzzlePayload>,
    store: AssessmentStore<PuzzlePayload, PuzzleResult>,
    queue: (work: () => Promise<void>) => void,
    sample: () => ClockSample,
    snapshot: PuzzleObservation,
  ) {
    this.#saved = saved;
    this.#store = store;
    this.#queue = queue;
    this.#sample = sample;
    this.#latest = snapshot;
  }

  /** Combines visibility and overlay state at the UI boundary. */
  active(value: boolean): void {
    if (this.#closed || value === this.#active) return;
    this.#active = value;
    this.#event(value ? 'resume' : 'pause');
  }

  /** Records an accepted word or hint; the first completion finalizes the encounter. */
  update(snapshot: PuzzleObservation): void {
    if (this.#closed) return;
    this.#latest = snapshot;
    this.#event(snapshot.complete ? 'finish' : 'checkpoint');
  }

  /** Heartbeat measures visible thinking time; a stalled observer marks an unmeasured gap. */
  checkpoint(): void {
    if (this.#active && !this.#closed && !this.#stopped && !this.#heartbeatPending) {
      this.#heartbeatPending = true;
      this.#event('checkpoint', true);
    }
  }

  /** Leaving a puzzle pauses it; an in-memory replay cannot be resumed and is abandoned. */
  close(): void {
    if (this.#closed) return;
    this.#active = false;
    this.#event(this.#latest.replay && !this.#latest.complete ? 'abandon' : 'pause');
    this.#closed = true;
  }

  #event(kind: 'resume' | 'pause' | 'checkpoint' | 'finish' | 'abandon', heartbeat = false) {
    const snapshot = this.#latest,
      sample = this.#sample(),
      endedAt = Date.now(),
      active = this.#active;
    this.#queue(async () => {
      if (heartbeat) this.#heartbeatPending = false;
      if (this.#stopped) return;
      const previous = this.#saved;
      if (placeKey(snapshot.place) !== placeKey(previous.payload.place)) {
        this.#stopped = true;
        return;
      }
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
        payload: { ...previous.payload, session: snapshot.session, presented: true },
        attempt: { ...previous.attempt, activeMs: clock.activeMs, timing: clock.timing },
      };
      if (clock.state === 'finished') {
        const attempt =
          kind === 'abandon'
            ? { ...next.attempt, status: 'abandoned' as const, endedAt }
            : {
                ...next.attempt,
                status: 'completed' as const,
                endedAt,
                result: {
                  kind: 'puzzle' as const,
                  found: snapshot.session.found,
                  revealed: snapshot.session.revealed,
                },
              };
        await this.#store.finalize({ ...next, clock: { ...clock, state: 'finished' }, attempt });
        this.#stopped = true;
      } else {
        const written = await this.#store.saveCheckpoint(next);
        if (written.ok) this.#saved = written.value;
        else this.#stopped = true;
      }
    });
  }
}

/** Browser-side puzzle recording coordinator; game rules and progress remain independent. */
export class PuzzleRecorder {
  #store: Promise<Store | null>;
  #tail: Promise<unknown> = Promise.resolve();
  #ranks: ReadonlyMap<string, number>;
  #visit = crypto.randomUUID();
  #disabled = false;

  /** Opens assessment in parallel with Home; legacy history is never assumed complete. */
  constructor(words: WordList, legacy: boolean) {
    this.#ranks = new Map(
      words.words.slice(0, RECIPES.extra.pool).map((word, rank) => [word, rank]),
    );
    this.#store = openAssessment(isPuzzlePayload, isPuzzleResult)
      .then(async (opened) => {
        if (!opened.ok) return null;
        const coverage = await opened.value.initializeCoverage(legacy ? 'partial' : 'complete');
        if (!coverage.ok) {
          opened.value.close();
          return null;
        }
        return opened.value;
      })
      .catch(() => null);
  }

  #queue<Value>(work: () => Promise<Value>): Promise<Value | null> {
    const result = this.#tail.then(work).catch(() => {
      markAssessmentGap();
      return null;
    });
    this.#tail = result;
    return result;
  }

  /** Commits exposure before presentation; unavailable/slow storage falls back to ordinary play. */
  async prepare(snapshot: PuzzleObservation, forceNew = false): Promise<PuzzleRecording | null> {
    if (this.#disabled) return null;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unavailable = () => {
      markAssessmentGap();
      return null;
    };
    const operation = this.#queue(async () => {
      const store = await this.#store;
      if (cancelled) return null;
      if (!store) return unavailable();
      const pending = await store.checkpoints();
      if (cancelled) return null;
      if (!pending.ok) return unavailable();
      const descriptor = describePuzzle(snapshot.level, this.#ranks);
      const saved = pending.value
        .filter(
          (cp) =>
            placeKey(cp.payload.place) === placeKey(snapshot.place) &&
            cp.payload.replay === snapshot.replay,
        )
        .toSorted((a, b) => b.attempt.sequence - a.attempt.sequence)[0];
      let checkpoint: Saved;
      const resumes =
        saved &&
        !forceNew &&
        !snapshot.replay &&
        saved.payload.descriptor.challengeId === descriptor.challengeId &&
        saved.attempt.contentVersion === String(LEVELS_VERSION) &&
        extendsSession(saved.payload.session, snapshot.session);
      if (resumes) {
        let clock = updateTiming(saved.clock, { kind: 'restore' });
        if (
          !saved.payload.presented ||
          snapshot.complete ||
          evidenceJson(saved.payload.session) !== evidenceJson(snapshot.session)
        )
          clock = { ...clock, timing: 'uncertain' };
        checkpoint = {
          ...saved,
          clock,
          payload: { ...saved.payload, session: snapshot.session, presented: false },
          attempt: { ...saved.attempt, activeMs: clock.activeMs, timing: clock.timing },
        };
      } else {
        if (saved) {
          const clock = updateTiming(updateTiming(saved.clock, { kind: 'restore' }), {
            kind: 'finish',
            sample: { visit: this.#visit, ms: performance.now() },
          });
          if (clock.state !== 'finished') return unavailable();
          const abandoned: Finalized<PuzzlePayload, PuzzleResult> = {
            ...saved,
            clock: { ...clock, state: 'finished' },
            attempt: {
              ...saved.attempt,
              activeMs: clock.activeMs,
              timing: clock.timing,
              status: 'abandoned',
              endedAt: Date.now(),
            },
          };
          const result = await store.finalize(abandoned);
          if (!result.ok) return unavailable();
        }
        // A completed pre-existing game is not a newly observed performance.
        if (snapshot.complete || cancelled) return null;
        const coverage = await store.initializeCoverage('partial');
        if (!coverage.ok) return unavailable();
        const partial =
          snapshot.session.found.length > 0 || Object.keys(snapshot.session.revealed).length > 0;
        const timing = partial ? ('uncertain' as const) : ('reliable' as const);
        checkpoint = {
          version: 2,
          revision: 0,
          clock: { ...NEW_TIMING, timing },
          attempt: {
            id: crypto.randomUUID(),
            sequence: 0,
            game: 'grama',
            track: 'word-solving',
            mode: snapshot.place.kind,
            rulesVersion: RULES_VERSION,
            contentVersion: String(LEVELS_VERSION),
            startedAt: Date.now(),
            activeMs: 0,
            timing,
            status: 'active',
            exposures: [
              {
                encounterId: crypto.randomUUID(),
                key: descriptor.exposureKey,
                kind:
                  snapshot.replay || snapshot.playedBefore || saved
                    ? 'repeat'
                    : partial || coverage.value === 'partial' || hasAssessmentGap()
                      ? 'unknown'
                      : 'first',
              },
            ],
          },
          payload: {
            version: 1,
            place: snapshot.place,
            level: snapshot.level,
            descriptor,
            session: snapshot.session,
            replay: snapshot.replay,
            presented: false,
          },
        };
      }
      const written = await store.saveCheckpoint(checkpoint);
      if (cancelled) return null;
      if (!written.ok) return unavailable();
      return new PuzzleRecording(
        written.value,
        store,
        (work) => {
          void this.#queue(work);
        },
        () => ({ visit: this.#visit, ms: performance.now() }),
        snapshot,
      );
    });
    try {
      return await Promise.race([
        operation,
        new Promise<null>((resolve) => {
          timer = setTimeout(() => {
            cancelled = true;
            this.#disabled = true;
            resolve(unavailable());
          }, PREPARE_WAIT);
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
}
