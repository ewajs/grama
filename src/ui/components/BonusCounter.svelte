<!--
@component
How many bonus words the player has found on this level. Pulses when the count goes up.

- `count`: bonus words found.
- `glow`: briefly highlight it (the player spelled a bonus word again).
-->
<script lang="ts">
  import { strings } from '../../i18n';

  let { count, glow = false }: { count: number; glow?: boolean } = $props();
</script>

{#key count}
  <div class="counter" class:pulse={count > 0} class:glow aria-label={strings.bonus(count)}>
    +{count}
  </div>
{/key}

<style>
  .counter {
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
