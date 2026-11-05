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
