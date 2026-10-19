<!--
@component
The top bar: the level number and the score, which counts up when points are won.

- `level`: level number as shown to the player.
- `score`: total points.
-->
<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import { strings } from '../../i18n';
  import { SCORE_COUNT_DURATION } from '../lib/motion';

  let { level, score }: { level: number; score: number } = $props();

  // Follows `score`, moving smoothly from the old value to the new one.
  const shown = Tween.of(() => score, { duration: SCORE_COUNT_DURATION, easing: cubicOut });
</script>

<header>
  <span>{strings.level(level)}</span>
  <span class="score" aria-label={strings.score}>
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" />
    </svg>
    {Math.round(shown.current)}
  </span>
</header>

<style>
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    align-self: stretch;
    font-size: var(--text-lg);
    font-weight: var(--weight-medium);
  }

  .score {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-variant-numeric: tabular-nums;
  }

  svg {
    width: 1.1em;
    height: 1.1em;
    fill: var(--color-bonus);
  }
</style>
