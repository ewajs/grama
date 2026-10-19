<!--
@component
A level's stars: three, filled as earned. They can land one after another.

- `stars`: earned, from 0 to 3.
- `size`: in pixels.
- `delay`: milliseconds before landing; omit to show them right away.
-->
<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { strings } from '../../i18n';
  import { DURATION, fly, STAR_STAGGER } from '../lib/motion';

  type Props = { stars: number; size?: number; delay?: number };
  let { stars, size = 20, delay }: Props = $props();
</script>

<span class="stars" style:--size="{size}px" role="img" aria-label={strings.starsLabel(stars)}>
  {#each [1, 2, 3] as star (star)}
    <svg
      viewBox="0 0 24 24"
      class:earned={star <= stars}
      in:fly={{
        y: -size / 2,
        duration: delay === undefined ? 0 : DURATION.slow * 1.5,
        delay: (delay ?? 0) + (star - 1) * STAR_STAGGER,
        easing: cubicOut,
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
