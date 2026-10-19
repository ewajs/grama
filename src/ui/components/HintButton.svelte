<!--
@component
The hint button: a light bulb with how many hints are left. The count pops when it
changes (a hint earned or spent).

- `count`: hints available.
- `disabled`: no hint can be used right now.
- `onhint()`: the player asked for a hint.
-->
<script lang="ts">
  import { backOut } from 'svelte/easing';
  import { strings } from '../../i18n';
  import { DURATION, scale } from '../lib/motion';

  type Props = { count: number; disabled: boolean; onhint: () => void };
  let { count, disabled, onhint }: Props = $props();
</script>

<button aria-label={strings.hint(count)} {disabled} onclick={onhint}>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z"
    />
  </svg>
  <!-- A new badge per count; intro transitions don't play on first render, only on change. -->
  {#key count}
    <span class="badge" in:scale={{ start: 0.3, duration: DURATION.slow, easing: backOut }}>
      {count}
    </span>
  {/key}
</button>

<style>
  button {
    position: relative;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    color: var(--color-bonus);
    cursor: pointer;
    transition:
      scale var(--dur-fast) var(--ease-out),
      opacity var(--dur-base);
  }

  button:active:not(:disabled) {
    scale: 0.92;
  }

  button:disabled {
    opacity: 0.45;
    cursor: default;
  }

  svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 20px;
    height: 20px;
    padding: 0 5px;
    border-radius: var(--radius-full);
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font-size: 12px;
    font-weight: var(--weight-bold);
    line-height: 20px;
  }
</style>
