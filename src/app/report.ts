import { strings } from '../i18n';

/** Where reports go: a new issue on the project's GitHub. */
export const ISSUES_URL = 'https://github.com/ewajs/grama/issues/new';

/** What the player wants to report. */
export type ReportKind = 'missing' | 'wrong' | 'other';

/** What a report carries so the level can be reproduced. Words as written. */
export type ReportContext = {
  levelNumber: number;
  letters: readonly string[];
  targets: readonly string[];
  found: readonly string[];
  /** Recent words the game said aren't valid: likely "this should count!" cases. */
  rejected: readonly string[];
  build: string;
};

/** A link that opens a new GitHub issue, pre-filled with the report. */
export function reportUrl(kind: ReportKind, context: ReportContext): string {
  const params = new URLSearchParams({
    title: strings.reportIssueTitle(kind, context.levelNumber),
    body: strings.reportIssueBody(context),
  });
  return `${ISSUES_URL}?${params}`;
}
