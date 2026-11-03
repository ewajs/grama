import { DEFAULT_TAU, NEW_RATING } from '../../core/assessment/glicko2';
import { PERFORMANCE } from '../../core/assessment/performance';
import type { GramaRecord } from './payload';

/** Build and requested download time, supplied at the browser edge. */
export type ExportContext = { version: string; build: string; at: number };

/** Serializes original finalized observations and model settings, without calculating or altering ratings. */
export function historyFile(records: readonly GramaRecord[], context: ExportContext) {
  const exportedAt = new Date(context.at).toISOString();
  return {
    filename: `grama-historial-${exportedAt.slice(0, 10)}.json`,
    content: JSON.stringify(
      {
        format: 'grama-assessment-history',
        version: 1,
        exportedAt,
        app: { version: context.version, build: context.build },
        model: { ...PERFORMANCE, prior: NEW_RATING, tau: DEFAULT_TAU },
        records,
      },
      null,
      2,
    ),
  };
}

// Let the browser start reading the Blob before releasing its URL.
const DOWNLOAD_URL_LIFETIME = 1000;

/** Rereads all history; a failed read creates no partial file and never changes the store. */
export async function downloadHistory(
  read: () => Promise<GramaRecord[] | null>,
  context: ExportContext,
): Promise<boolean> {
  try {
    const records = await read();
    if (records === null) return false;
    const file = historyFile(records, context),
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
