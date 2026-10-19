/**
 * Reporting a problem with a level as a pre-filled GitHub issue.
 * @module
 */

import type { Tier } from '../core/difficulty';
import type { Place } from '../core/progress';
import { strings } from '../i18n';

/** Where reports go: a new issue on the project's GitHub. */
export const ISSUES_URL = 'https://github.com/ewajs/grama/issues/new';

/** What the player wants to report. */
export type ReportKind = 'missing' | 'wrong' | 'other';

/** What a report carries so the level can be reproduced. Words as written. */
export type ReportContext = {
  /** Which level: number, difficulty and seed block, or the daily's date. */
  place: Place;
  /** How hard it is. */
  tier: Tier;
  /** The wheel's letters. */
  letters: readonly string[];
  /** The level's words. */
  targets: readonly string[];
  /** What the player found. */
  found: readonly string[];
  /** Recent words the game said aren't valid: likely "this should count!" cases. */
  rejected: readonly string[];
  /** The build's commit, to know which version it happened on. */
  build: string;
};

/** A link that opens a new GitHub issue, pre-filled with the report. */
export function reportUrl(kind: ReportKind, context: ReportContext): string {
  const params = new URLSearchParams({
    title: strings.reportIssueTitle(kind, context.place),
    body: strings.reportIssueBody(context),
  });
  return `${ISSUES_URL}?${params}`;
}
