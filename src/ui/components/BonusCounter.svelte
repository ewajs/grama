<!--
@component
How many bonus words the player has found on this level, with a ring that fills toward
the next hint. Pulses when the count goes up.

- `count`: bonus words found on this level.
- `progress`: how far along toward the next hint, from 0 to 1.
- `untilHint`: bonus words still to find for the next hint.
- `glow`: briefly highlight it (the player spelled a bonus word again).
-->
<script lang="ts">
  import { strings } from '../../i18n';

  type Props = { count: number; progress: number; untilHint: number; glow?: boolean };
  let { count, progress, untilHint, glow = false }: Props = $props();

  // The ring's length, so `progress` can be drawn as a share of it.
  const CIRCUMFERENCE = 2 * Math.PI * 22;
</script>

{#key count}
  <div
    class="counter"
    class:pulse={count > 0}
    class:glow
    aria-label={strings.bonus(count, untilHint)}
  >
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle class="track" cx="24" cy="24" r="22" />
      <circle
        class="progress"
        cx="24"
        cy="24"
        r="22"
        stroke-dasharray={CIRCUMFERENCE}
        stroke-dashoffset={CIRCUMFERENCE * (1 - progress)}
      />
    </svg>
    +{count}
  </div>
{/key}

<style>
  .counter {
    position: relative;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    color: var(--color-bonus);
    font-weight: var(--weight-bold);
  }

  svg {
    position: absolute;
    inset: 0;
    rotate: -90deg;
    fill: none;
    stroke-width: 3;
  }

  .track {
    stroke: var(--color-tile-border);
  }

  .progress {
    stroke: var(--color-bonus);
    stroke-linecap: round;
    transition: stroke-dashoffset var(--dur-slow) var(--ease-out);
  }

  .pulse {
    animation: pulse var(--dur-slow) calc(var(--dur-slow) + var(--dur-fast)) var(--ease-out);
  }

  .glow {
    animation: pulse var(--dur-slow) var(--ease-in-out) 2;
  }

  @keyframes pulse {
    50% {
      scale: 1.2;
      background: var(--color-bonus);
      color: var(--color-accent-contrast);
    }
  }
</style>
