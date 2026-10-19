<!--
@component
A level's stars: three, filled as earned. They can pop in one after another.

- `stars`: earned, from 0 to 3.
- `size`: in pixels.
- `delay`: milliseconds before popping in; omit to show them right away.
-->
<script lang="ts">
  import { backOut } from 'svelte/easing';
  import { scale } from 'svelte/transition';
  import { strings } from '../../i18n';
  import { DURATION } from '../lib/motion';

  type Props = { stars: number; size?: number; delay?: number };
  let { stars, size = 20, delay }: Props = $props();
</script>

<span class="stars" style:--size="{size}px" role="img" aria-label={strings.starsLabel(stars)}>
  {#each [1, 2, 3] as star (star)}
    <svg
      viewBox="0 0 24 24"
      class:earned={star <= stars}
      in:scale={{
        start: 0.2,
        duration: delay === undefined ? 0 : DURATION.slow * 1.5,
        delay: (delay ?? 0) + star * 150,
        easing: backOut,
      }}
    >
      <path d="m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z" />
    </svg>
  {/each}
</span>

<style>
  .stars {
    display: inline-flex;
    gap: calc(var(--size) * 0.15);
  }

  svg {
    width: var(--size);
    height: var(--size);
    fill: var(--color-tile-border);
  }

  .earned {
    fill: var(--color-bonus);
  }
</style>
