const KEY = 'grama.assessment-gap';

/** A durable recording gap makes otherwise unseen content's history unknown. */
export function hasAssessmentGap(): boolean {
  try {
    return localStorage.getItem(KEY) !== null;
  } catch {
    return true;
  }
}

/** Best-effort marker outside IndexedDB, so a failed database cannot hide missed play. */
export function markAssessmentGap(): void {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    // Gameplay remains available even when both browser stores are unavailable.
  }
}
