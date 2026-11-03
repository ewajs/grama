<!-- @component Personal Glicko rating, recent history and separate trial scores. Props: recorder, onback. -->
<script lang="ts">
  import type { GramaRecorder } from '../../app/assessment/recorder';
  import type { GramaRecord } from '../../app/assessment/payload';
  import { performanceHistory } from '../../app/assessment/performance';
  import { bonusWords, hintsUsed } from '../../core/session';
  import { strings } from '../../i18n';
  import RatingChart from './RatingChart.svelte';
  import ScreenHeader from './ScreenHeader.svelte';

  let { recorder, onback }: { recorder: GramaRecorder | null; onback: () => void } = $props();
  let overview = $state<ReturnType<typeof performanceHistory> | null>(null);
  let phase = $state<'loading' | 'ready' | 'failed'>('loading');
  let retry = $state(0);
  const chart = $derived(
    overview?.puzzles
      .flatMap((entry) =>
        entry.rating ? [{ label: title(entry.record), rating: entry.rating.rating }] : [],
      )
      .slice(-10) ?? [],
  );
  $effect(() => {
    void retry;
    const source = recorder;
    let cancelled = false;
    phase = 'loading';
    void (async () => {
      try {
        const records = await source?.history();
        if (cancelled) return;
        if (!records) throw new Error('History unavailable');
        overview = performanceHistory(records);
        phase = 'ready';
      } catch {
        if (!cancelled) phase = 'failed';
      }
    })();
    return () => {
      cancelled = true;
    };
  });
  function title(record: GramaRecord): string {
    const payload = record.payload;
    return 'place' in payload
      ? payload.place.kind === 'level'
        ? strings.level(payload.place.levelNumber)
        : strings.dailyChallenge
      : strings.trial;
  }
  function practice(record: GramaRecord): boolean {
    return (
      ('place' in record.payload && record.payload.replay) ||
      record.attempt.exposures.some((exposure) => exposure.kind === 'repeat')
    );
  }
</script>

<main>
  <ScreenHeader title={strings.progressTitle} {onback} />
  {#if phase === 'loading'}
    <p role="status">{strings.loading}</p>
  {:else if phase === 'failed'}
    <p role="alert">{strings.progressUnavailable}</p>
    <button class="secondary" onclick={() => retry++}>{strings.progressRetry}</button>
  {:else if overview}
    {#if overview.puzzles.length === 0 && overview.trials.length === 0}
      <p>{strings.progressEmpty}</p>
    {/if}
    {#if overview.puzzles.length > 0}
      <section aria-label={strings.progressSolving}>
        <article class="summary">
          <h2>{strings.progressRating}</h2>
          {#if overview.current}
            <strong class="rating" aria-label={strings.progressRatingValue(overview.current.rating)}
              >{Math.round(overview.current.rating).toLocaleString('es-AR')}</strong
            >
            <p class="trend">
              {overview.trend ? strings.progressTrend[overview.trend] : strings.progressEarly}
            </p>
            <RatingChart values={chart} />
          {:else}<p>{strings.progressNoRating}</p>{/if}
        </article>
        <details>
          <summary>{strings.progressHelp}</summary>
          <p>{strings.progressExplanation}</p>
          <p>{strings.progressTimingNote}</p>
          <p>{strings.progressScaleNote}</p>
        </details>
        <section aria-label={strings.progressRecent}>
          <h2>{strings.progressRecent}</h2>
          <ol>
            {#each overview.puzzles
              .slice(-10)
              .toReversed() as { record, rating } (record.attempt.id)}
              <li>
                <div class="row">
                  <b>{title(record)}</b><time>{strings.progressDate(record.attempt.endedAt)}</time>
                </div>
                {#if 'place' in record.payload}
                  <p class="muted">
                    {strings.tiers[record.payload.level.tier]} · {strings.progressHints(
                      hintsUsed(record.payload.session),
                    )} · {strings.progressBonus(
                      bonusWords(record.payload.level, record.payload.session).length,
                    )}
                  </p>
                {/if}
                <div class="row">
                  <span
                    >{rating
                      ? strings.progressRatingValue(rating.rating)
                      : practice(record)
                        ? strings.progressPractice
                        : strings.progressUnrated}</span
                  >
                  {#if record.attempt.timing === 'reliable' && record.attempt.activeMs > 0}
                    <span class="muted"
                      >{strings.clock(Math.ceil(record.attempt.activeMs / 1000))}</span
                    >
                  {/if}
                </div>
              </li>
            {/each}
          </ol>
        </section>
      </section>
    {/if}
    {#if overview.trials.length > 0}
      <section aria-label={strings.trial}>
        <h2>{strings.trial}</h2>
        <article>
          <p class="muted">{strings.progressTrialBest}</p>
          <strong class="best">{strings.points(overview.trialBest ?? 0)}</strong>
        </article>
        <p class="muted">{strings.progressTrialNote}</p>
        <ol>
          {#each overview.trials.slice(-5).toReversed() as record (record.attempt.id)}
            {#if 'kind' in record.payload}
              <li>
                <div class="row">
                  <b>{strings.points(record.payload.points)}</b><time
                    >{strings.progressDate(record.attempt.endedAt)}</time
                  >
                </div>
                <p class="muted">{strings.wheelsCleared(record.payload.cleared)}</p>
              </li>
            {/if}
          {/each}
        </ol>
      </section>
    {/if}
    <p class="muted local">{strings.progressHistoryNote}</p>
  {/if}
</main>

<style>
  main {
    max-width: 480px;
    margin: 0 auto;
    padding: max(var(--space-3), env(safe-area-inset-top)) var(--space-4)
      max(var(--space-6), env(safe-area-inset-bottom));
  }
  .muted,
  time {
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }
  h2 {
    margin: var(--space-5) 0 var(--space-2);
    font-size: var(--text-lg);
  }
  p {
    margin: var(--space-2) 0;
  }
  article,
  li {
    padding: var(--space-4);
    margin: var(--space-2) 0;
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
  }
  .summary h2 {
    margin-top: 0;
    font-size: var(--text-md);
  }
  .rating {
    display: block;
    color: var(--color-accent-strong);
    font-size: var(--text-2xl);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }
  .trend {
    color: var(--color-accent-strong);
  }
  .best {
    font-size: var(--text-xl);
  }
  .row {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: var(--space-2);
  }
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  details {
    margin-top: var(--space-5);
  }
  summary {
    min-height: 44px;
    padding: var(--space-3) 0;
    cursor: pointer;
    color: var(--color-accent-strong);
  }
  summary:focus-visible {
    outline: 2px solid var(--color-accent-strong);
    outline-offset: 2px;
  }
  .secondary {
    min-height: 44px;
  }
  .local {
    margin-top: var(--space-4);
  }
</style>
