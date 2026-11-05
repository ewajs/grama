import { DEFAULT_TAU, NEW_RATING } from '../../core/assessment/glicko2';
import { PERFORMANCE } from '../../core/assessment/performance';
import type { AssessmentSnapshot } from '../../storage/assessment';
import { readProfile, type StoredProfile } from '../../storage/profile';
import type { GramaPayload } from './payload';
import type { GramaResult } from './grama';

/** Original persisted recording state, copied together for a complete Grama export. */
export type GramaSnapshot = AssessmentSnapshot<GramaPayload, GramaResult>;

/** Build and requested download time, supplied at the browser edge. */
export type ExportContext = { version: string; build: string; at: number };

/** Serializes saved progress and original recording state, retaining their existing formats. */
export function historyFile(
  snapshot: GramaSnapshot,
  profile: StoredProfile,
  context: ExportContext,
) {
  const exportedAt = new Date(context.at).toISOString();
  return {
    filename: `grama-historial-${exportedAt.slice(0, 10)}.json`,
    content: JSON.stringify(
      {
        format: 'grama-assessment-history',
        version: 2,
        exportedAt,
        app: { version: context.version, build: context.build },
        model: { ...PERFORMANCE, prior: NEW_RATING, tau: DEFAULT_TAU },
        records: snapshot.records,
        profile,
        assessment: {
          version: snapshot.version,
          checkpoints: snapshot.checkpoints,
          exposures: snapshot.exposures,
          sequence: snapshot.sequence,
        },
      },
      null,
      2,
    ),
  };
}

// Let the browser start reading the Blob before releasing its URL.
const DOWNLOAD_URL_LIFETIME = 1000;

/** Rereads all saved data; a failed read creates no partial file and never changes storage. */
export async function downloadHistory(
  read: () => Promise<GramaSnapshot | null>,
  context: ExportContext,
): Promise<boolean> {
  try {
    const snapshot = await read();
    if (snapshot === null) return false;
    const file = historyFile(snapshot, readProfile(), context),
      url = URL.createObjectURL(new Blob([file.content], { type: 'application/json' })),
      link = document.createElement('a');
    try {
      link.href = url;
      link.download = file.filename;
      document.body.append(link);
      link.click();
    } finally {
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME);
    }
    return true;
  } catch {
    return false;
  }
}
