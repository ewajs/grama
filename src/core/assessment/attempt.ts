/** One presentation of challenge content; resuming retains its encounter ID and classification. */
export type Exposure = {
  encounterId: string;
  key: string;
  kind: 'first' | 'repeat' | 'unknown';
};

/** Original performance evidence. IDs, clocks and versions are supplied by the app. */
export type Attempt<Result> = {
  id: string;
  /** Local sequence, independent of wall-clock corrections. */
  sequence: number;
  game: string;
  track: string;
  mode: string;
  rulesVersion: string;
  contentVersion: string;
  startedAt: number;
  activeMs: number;
  timing: 'reliable' | 'uncertain';
  exposures: readonly Exposure[];
} & (
  | { status: 'active' }
  | { status: 'completed'; endedAt: number; result: Result }
  | { status: 'abandoned'; endedAt: number }
);

/** Whether an attempt supplies fresh evidence; eligibility does not itself award a rating. */
export type Eligibility =
  | { eligible: true }
  | {
      eligible: false;
      reason: 'unfinished' | 'repeated-content' | 'unknown-exposure' | 'uncertain-timing';
    };

/**
 * Classifies a presentation before its content is shown. Persist the returned exposure
 * even if the player submits nothing. Coverage is partial when older exposure is unknown.
 * Encounter IDs survive resume and must be new on restart, including after a game reset.
 */
export function exposureFor(
  key: string,
  encounterId: string,
  history: readonly Exposure[],
  coverage: 'complete' | 'partial',
): Exposure {
  const resumed = history.find((entry) => entry.key === key && entry.encounterId === encounterId);
  if (resumed) return resumed;
  const seen = history.some((entry) => entry.key === key);
  return {
    key,
    encounterId,
    kind: seen ? 'repeat' : coverage === 'complete' ? 'first' : 'unknown',
  };
}

/** Conservative admission rule for future skill models, shared across games. */
export function eligibilityOf<Result>(attempt: Attempt<Result>): Eligibility {
  if (attempt.status !== 'completed') return { eligible: false, reason: 'unfinished' };
  if (attempt.exposures.some(({ kind }) => kind === 'repeat')) {
    return { eligible: false, reason: 'repeated-content' };
  }
  if (!attempt.exposures.length || attempt.exposures.some(({ kind }) => kind === 'unknown')) {
    return { eligible: false, reason: 'unknown-exposure' };
  }
  if (attempt.timing === 'uncertain') return { eligible: false, reason: 'uncertain-timing' };
  return { eligible: true };
}
