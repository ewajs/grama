/** The persisted profile keys; explicit selection excludes other apps on the same origin. */
export const PROFILE_KEYS = [
  'grama.save',
  'grama.settings',
  'grama.words',
  'grama.trials',
  'grama.assessment-gap',
] as const;

/** Exact saved values, including save/content versions; null means no saved value. */
export type StoredProfile = Record<(typeof PROFILE_KEYS)[number], string | null>;

/** Reads saved data without substituting defaults; blocked storage must fail the export. */
export function readProfile(storage: Pick<Storage, 'getItem'> = localStorage): StoredProfile {
  return Object.fromEntries(
    PROFILE_KEYS.map((key) => [key, storage.getItem(key)]),
  ) as StoredProfile;
}

/** Replaces only Grama's saved keys; restores previous values on failure and returns an undo. */
export function replaceProfile(
  profile: StoredProfile,
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = localStorage,
): () => void {
  const before = readProfile(storage);
  const write = (values: StoredProfile) => {
    for (const key of PROFILE_KEYS) storage.removeItem(key);
    for (const key of PROFILE_KEYS) {
      const value = values[key];
      if (value !== null) storage.setItem(key, value);
    }
  };
  try {
    write(profile);
  } catch (error) {
    write(before);
    throw error;
  }
  return () => write(before);
}
