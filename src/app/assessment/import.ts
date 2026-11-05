import { loadGame } from '../../storage/save';
import { loadSettings, DEFAULT_SETTINGS } from '../../storage/settings';
import { loadDictionary } from '../../storage/dictionary';
import { loadTrials } from '../../storage/trials';
import { PROFILE_KEYS, type StoredProfile } from '../../storage/profile';
import { isAssessmentSnapshot } from '../../storage/assessment';
import { evidenceJson } from '../../storage/assessment-record';
import { isObject, isCount } from '../../storage/guards';
import { NEW_PROGRESS } from '../../core/progress';
import { isGramaPayload, isGramaResult } from './payload';
import type { GramaSnapshot } from './export';
import { GRAMA_RULES } from './grama';

/** Caps the file before reading it into memory on a phone. */
export const MAX_IMPORT_BYTES = 20 * 1024 * 1024;

/** A validated full-profile file and the short preview shown before replacement. */
export type ProfileImport = {
  profile: StoredProfile;
  snapshot: GramaSnapshot;
  summary: { level: number; points: number; words: number; matches: number };
};

/** Parses supported exports without writing data or trusting their model settings. */
export function parseProfileImport(content: string): ProfileImport | null {
  try {
    const file: unknown = JSON.parse(content);
    if (
      !isObject(file) ||
      file.format !== 'grama-assessment-history' ||
      file.version !== 2 ||
      !isObject(file.profile) ||
      !isObject(file.assessment)
    )
      return null;
    const raw = file.profile;
    if (
      Object.keys(raw).length !== PROFILE_KEYS.length ||
      !PROFILE_KEYS.every((k) => raw[k] === null || typeof raw[k] === 'string')
    )
      return null;
    const profile = raw as StoredProfile;
    const storage = { getItem: (key: string) => profile[key as keyof StoredProfile] ?? null };
    const game = loadGame(storage);
    if (profile['grama.save'] !== null && !game) return null;
    for (const key of ['grama.words', 'grama.trials'] as const) {
      if (
        profile[key] !== null &&
        evidenceJson(JSON.parse(profile[key])) !==
          evidenceJson(key === 'grama.words' ? loadDictionary(storage) : loadTrials(storage))
      )
        return null;
    }
    const trials = loadTrials(storage);
    if (
      !isCount(trials.runs) ||
      !isCount(trials.mostCleared) ||
      (trials.best && ![trials.best.points, trials.best.cleared, trials.best.words].every(isCount))
    )
      return null;
    if (profile['grama.settings'] !== null) {
      const settings: unknown = JSON.parse(profile['grama.settings']);
      const decoded = loadSettings(storage);
      if (
        !isObject(settings) ||
        !Object.entries(settings).every(
          ([k, v]) =>
            Object.hasOwn(DEFAULT_SETTINGS, k) && decoded[k as keyof typeof decoded] === v,
        )
      )
        return null;
    }
    if (profile['grama.assessment-gap'] !== null && profile['grama.assessment-gap'] !== '1')
      return null;
    const snapshot = { ...file.assessment, records: file.records };
    if (!isAssessmentSnapshot(snapshot, isGramaPayload, isGramaResult)) return null;
    for (const { attempt, payload } of [...snapshot.records, ...snapshot.checkpoints]) {
      const puzzle = 'place' in payload;
      if (
        attempt.game !== 'grama' ||
        attempt.track !== (puzzle ? 'word-solving' : 'time-trial') ||
        attempt.mode !== (puzzle ? payload.place.kind : 'trial') ||
        attempt.rulesVersion !== (puzzle ? GRAMA_RULES.puzzle : GRAMA_RULES.trial)
      )
        return null;
    }
    return {
      profile,
      snapshot,
      summary: {
        level: (game ?? NEW_PROGRESS).levelNumber,
        points: (game ?? NEW_PROGRESS).score,
        words: loadDictionary(storage).length,
        matches: snapshot.records.length,
      },
    };
  } catch {
    return null;
  }
}
