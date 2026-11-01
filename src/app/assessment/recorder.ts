import { RECIPES } from '../../core/difficulty';
import { LEVELS_VERSION } from '../../core/generate';
import { NEW_TIMING, updateTiming } from '../../core/assessment/timing';
import type { WordList } from '../../content/words';
import { openAssessment, type AssessmentStore } from '../../storage/assessment';
import { hasAssessmentGap, markAssessmentGap } from '../../storage/assessment-coverage';
import { evidenceJson, type Checkpoint, type Finalized } from '../../storage/assessment-record';
import { describePuzzle } from './grama';
import {
  extendsSession,
  isPuzzlePayload,
  placeKey,
  type PuzzleObservation,
  type PuzzlePayload,
  type PuzzleResult,
} from './puzzle';

import { Recording } from './recording';
import { isGramaPayload, isGramaResult, type GramaPayload } from './payload';
import type { GramaResult } from './grama';
import { describeTrial, trialResult, type TrialObservation } from './trial';
import type { Exposure } from '../../core/assessment/attempt';

export { RECORDING_INTERVAL } from './recording';
/** Recording handle used by numbered/daily screens. */
export type PuzzleRecording = Recording<PuzzleObservation>;
/** Recording handle for a single Contrarreloj run. */
export type TrialRecording = Recording<TrialObservation>;
const PREPARE_WAIT = 2_000;
const RULES_VERSION = 'puzzle:1';
type Store = AssessmentStore<GramaPayload, GramaResult>;
type Saved = Checkpoint<PuzzlePayload>;

/** Browser-side recording coordinator for both Grama tracks; game rules and progress remain independent. */
export class GramaRecorder {
  #store: Promise<Store | null>;
  #tail: Promise<unknown> = Promise.resolve();
  #ranks: ReadonlyMap<string, number>;
  #visit = crypto.randomUUID();
  #disabled = false;
  #coverage: 'complete' | 'partial' = 'partial';

  /** Opens assessment in parallel with Home; legacy history is never assumed complete. */
  constructor(words: WordList, legacy: boolean) {
    this.#ranks = new Map(
      words.words.slice(0, RECIPES.extra.pool).map((word, rank) => [word, rank]),
    );
    this.#store = openAssessment(isGramaPayload, isGramaResult)
      .then(async (opened) => {
        if (!opened.ok) return null;
        const coverage = await opened.value.initializeCoverage(legacy ? 'partial' : 'complete');
        if (!coverage.ok) {
          opened.value.close();
          return null;
        }
        this.#coverage = coverage.value;
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
    return this.#prepare((cancelled) =>
      this.#queue(async () => {
        const store = await this.#store;
        if (cancelled()) return null;
        if (!store) return unavailable();
        const pending = await store.checkpoints();
        if (cancelled()) return null;
        if (!pending.ok) return unavailable();
        const descriptor = describePuzzle(snapshot.level, this.#ranks);
        const saved = pending.value
          .flatMap((cp) => (isPuzzlePayload(cp.payload) ? [{ ...cp, payload: cp.payload }] : []))
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
          if (snapshot.complete || cancelled()) return null;
          const partial =
            snapshot.session.found.length > 0 || Object.keys(snapshot.session.revealed).length > 0;
          const timing = partial ? ('uncertain' as const) : ('reliable' as const);
          const exposure = this.#exposure(descriptor.exposureKey);
          if (snapshot.replay || snapshot.playedBefore || saved) exposure.kind = 'repeat';
          else if (partial) exposure.kind = 'unknown';
          checkpoint = this.#start(
            {
              version: 1,
              place: snapshot.place,
              level: snapshot.level,
              descriptor,
              session: snapshot.session,
              replay: snapshot.replay,
              presented: false,
            },
            exposure,
            timing,
          );
        }
        const written = await store.saveCheckpoint(checkpoint);
        if (cancelled()) return null;
        if (!written.ok) return unavailable();
        return new Recording(
          written.value,
          store,
          (work) => this.#queue(work),
          () => ({ visit: this.#visit, ms: performance.now() }),
          snapshot,
          (observation: PuzzleObservation) => ({
            payload: { ...written.value.payload, session: observation.session, presented: true },
            result: observation.complete
              ? {
                  kind: 'puzzle',
                  found: observation.session.found,
                  revealed: observation.session.revealed,
                }
              : null,
          }),
          snapshot.replay,
        );
      }),
    );
  }

  #start<Payload extends GramaPayload>(
    payload: Payload,
    exposure: Exposure,
    timing: 'reliable' | 'uncertain' = 'reliable',
  ): Checkpoint<Payload> {
    const puzzle = 'place' in payload;
    return {
      version: 2,
      revision: 0,
      clock: { ...NEW_TIMING, timing },
      payload,
      attempt: {
        id: crypto.randomUUID(),
        sequence: 0,
        game: 'grama',
        track: puzzle ? 'word-solving' : 'time-trial',
        mode: puzzle ? payload.place.kind : 'trial',
        rulesVersion: puzzle ? RULES_VERSION : 'trial:1',
        contentVersion: String(LEVELS_VERSION),
        startedAt: Date.now(),
        activeMs: 0,
        timing,
        status: 'active',
        exposures: [exposure],
      },
    };
  }

  #exposure(key: string): Exposure {
    return {
      encounterId: crypto.randomUUID(),
      key,
      kind: this.#coverage === 'partial' || hasAssessmentGap() ? 'unknown' : 'first',
    };
  }

  /** Begins a run or atomically appends a new wheel to its existing recording. */
  async prepareTrial(
    snapshot: TrialObservation,
    recording: TrialRecording | null,
  ): Promise<TrialRecording | null> {
    return this.#prepare(async (cancelled) => {
      const payload = describeTrial(snapshot, this.#ranks);
      const wheel = payload.wheels.at(-1);
      if (!wheel) return unavailable();
      const exposure = this.#exposure(wheel.descriptor.exposureKey);
      if (recording) {
        const written = await recording.present(snapshot, exposure);
        return written && !cancelled() ? recording : unavailable();
      }
      return this.#queue(async () => {
        const store = await this.#store;
        if (cancelled()) return null;
        if (!store) return unavailable();
        // Coverage becomes known when the store opens, before constructing the first exposure.
        const initial = this.#start({ ...payload, presented: false }, this.#exposure(exposure.key));
        const written = await store.saveCheckpoint(initial);
        if (cancelled()) return null;
        if (!written.ok) return unavailable();
        return new Recording(
          written.value,
          store,
          (work) => this.#queue(work),
          () => ({ visit: this.#visit, ms: performance.now() }),
          snapshot,
          (observation: TrialObservation) => ({
            payload: describeTrial(observation, this.#ranks),
            result: observation.timeLeft === 0 ? trialResult(observation) : null,
          }),
          true,
        );
      });
    });
  }

  async #prepare<Observation>(
    work: (cancelled: () => boolean) => Promise<Recording<Observation> | null>,
  ): Promise<Recording<Observation> | null> {
    if (this.#disabled) return null;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const operation = work(() => cancelled).catch(() => unavailable());
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

function unavailable(): null {
  markAssessmentGap();
  return null;
}
