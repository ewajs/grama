<!-- @component Beta personal progress: reads local history and shows recent outcomes and matched comparisons. Props: recorder, onback. -->
<script lang="ts">
  import type { GramaRecorder } from '../../app/assessment/recorder';
  import type { GramaRecord } from '../../app/assessment/payload';
  import { progressOverview } from '../../app/assessment/progress';
  import { isPuzzlePayload } from '../../app/assessment/puzzle';
  import { eligibilityOf } from '../../core/assessment/attempt';
  import { BASELINE_WINDOW } from '../../core/assessment/baseline';
  import { bonusWords, hintsUsed } from '../../core/session';
  import { strings } from '../../i18n';
  import ScreenHeader from './ScreenHeader.svelte';

  let { recorder, onback }: { recorder: GramaRecorder | null; onback: () => void } = $props();
  let records = $state.raw<GramaRecord[]>([]);
  let phase = $state<'loading' | 'ready' | 'failed'>('loading');
  let refresh = $state(0);
  const overview = $derived(progressOverview(records));
  const tracks = [
    { id: 'word-solving', title: strings.progressSolving },
    { id: 'time-trial', title: strings.trial },
  ];
  const feedback = `https://github.com/ewajs/grama/issues/new?title=${encodeURIComponent(strings.progressFeedbackTitle)}&body=${encodeURIComponent(strings.progressFeedbackPrompt)}`;
  $effect(() => {
    const request = refresh;
    let cancelled = false;
    phase = 'loading';
    void (recorder?.history() ?? Promise.resolve(null)).then((value) => {
      if (cancelled || request !== refresh) return;
      records = value ?? [];
      phase = value === null ? 'failed' : 'ready';
    });
    return () => {
      cancelled = true;
    };
  });
  function title(record: GramaRecord): string {
    const payload = record.payload;
    return isPuzzlePayload(payload)
      ? payload.place.kind === 'level'
        ? strings.level(payload.place.levelNumber)
        : strings.dailyChallenge
      : strings.trial;
  }
  function status(record: GramaRecord): string {
    const eligibility = eligibilityOf(record.attempt);
    return overview.comparableIds.has(record.attempt.id)
      ? strings.progressComparable
      : eligibility.eligible
        ? strings.progressOther
        : strings.progressExcluded[eligibility.reason];
  }
</script>

<main>
  <ScreenHeader title={strings.progressTitle} {onback} />
  <p class="intro"><b>{strings.progressBeta}</b> · {strings.progressIntro}</p>
  <button class="secondary refresh" disabled={phase === 'loading'} onclick={() => refresh++}
    >{strings.progressRefresh}</button
  >
  {#if phase === 'loading'}
    <p role="status">{strings.loading}</p>
  {:else if phase === 'failed'}
    <p role="alert">{strings.progressUnavailable}</p>
  {:else if records.length === 0}
    <p>{strings.progressEmpty}</p>
  {:else}
    {#each tracks as track (track.id)}
      {@const groups = overview.groups
        .filter((group) => group.record.attempt.track === track.id)
        .slice(0, 3)}
      <section aria-label={track.title}>
        <h2>{track.title}</h2>
        <p class="muted">
          {strings.progressRecorded(
            records.filter(
              (record) =>
                record.attempt.track === track.id && record.attempt.status === 'completed',
            ).length,
          )}
        </p>
        {#if groups.length === 0}<p>{strings.progressNoComparable}</p>{/if}
        {#each groups as { report, record } (report.cohort)}
          <article>
            <h3>{title(record)}</h3>
            {#if isPuzzlePayload(record.payload)}
              <p class="muted">
                {strings.tiers[record.payload.level.tier]} · {strings.progressShape(
                  record.payload.descriptor.wheelSize,
                  record.payload.descriptor.targetCount,
                )} · {strings.progressHints(hintsUsed(record.payload.session))} · {strings.progressBonus(
                  bonusWords(record.payload.level, record.payload.session).length,
                )}
              </p>
            {/if}
            {#if report.comparison === null}
              <p>{strings.progressCollecting(report.samples, BASELINE_WINDOW * 2)}</p>
            {:else}
              <strong class="comparison">{strings.progressComparison(report.comparison)}</strong>
              <p class="muted">
                {strings.progressWindows(report.referenceIds.length, report.recentIds.length)}
              </p>
            {/if}
          </article>
        {/each}
      </section>
    {/each}
    <p class="muted">{strings.progressMeaning} {strings.progressHistoryNote}</p>
    <section aria-label={strings.progressRecent}>
      <h2>{strings.progressRecent}</h2>
      <ol>
        {#each overview.recent as record (record.attempt.id)}
          <li>
            <div class="row">
              <b>{title(record)}</b><time>{strings.progressDate(record.attempt.endedAt)}</time>
            </div>
            <p>
              {#if isPuzzlePayload(record.payload)}
                {record.attempt.timing === 'reliable'
                  ? strings.progressTime
                  : strings.progressPartialTime}: {strings.clock(
                  Math.ceil(record.attempt.activeMs / 1000),
                )} · {strings.progressHints(hintsUsed(record.payload.session))}
              {:else}{strings.points(record.payload.points)} · {strings.wheelsCleared(
                  record.payload.cleared,
                )}{/if}
            </p>
            <small>{status(record)}</small>
          </li>
        {/each}
      </ol>
    </section>
  {/if}
  <a class="feedback" href={feedback} target="_blank" rel="noopener noreferrer"
    >{strings.progressFeedback}</a
  >
</main>

<style>
  main {
    max-width: 480px;
    margin: 0 auto;
    padding: max(var(--space-3), env(safe-area-inset-top)) var(--space-4)
      max(var(--space-6), env(safe-area-inset-bottom));
  }
  .intro,
  .muted,
  small,
  time {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
  h2 {
    margin: var(--space-6) 0 var(--space-2);
    font-size: var(--text-lg);
  }
  h3,
  p {
    margin: var(--space-2) 0;
  }
  h3 {
    font-size: var(--text-md);
  }
  article,
  li {
    padding: var(--space-3);
    margin: var(--space-2) 0;
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
  }
  .comparison {
    display: block;
    margin: var(--space-2) 0;
    color: var(--color-accent-strong);
    font-size: var(--text-xl);
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: var(--space-2);
  }
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .refresh {
    min-height: 44px;
    font-size: var(--text-md);
  }
  .refresh:disabled {
    opacity: 0.6;
  }
  .feedback {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    margin-top: var(--space-4);
    color: var(--color-accent-strong);
  }
</style>
