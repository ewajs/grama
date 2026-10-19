<!--
@component
A card over the dimmed, blurred game: the frame every dialog shares. What goes inside is
passed as children, e.g. `<Dialog title="…">content</Dialog>`.

- `title`: heading, also the dialog's accessible name.
- `onclose()`: when given, tapping outside the card or pressing Escape closes it.
- `delay`: milliseconds to wait before appearing.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { backOut } from 'svelte/easing';
  import { fade, scale } from 'svelte/transition';
  import { strings } from '../../i18n';
  import { DURATION } from '../lib/motion';

  type Props = { title: string; onclose?: () => void; delay?: number; children: Snippet };
  let { title, onclose, delay = 0, children }: Props = $props();

  // A unique id, so the card can point at its heading.
  const titleId = $props.id();
</script>

<svelte:window onkeydown={(event) => event.key === 'Escape' && onclose?.()} />

<div class="backdrop" transition:fade={{ duration: DURATION.base, delay }}>
  {#if onclose}
    <button class="scrim" aria-label={strings.close} onclick={onclose}></button>
  {/if}
  <div
    class="card"
    role="dialog"
    aria-modal="true"
    aria-labelledby={titleId}
    in:scale={{ start: 0.8, duration: DURATION.slow, delay, easing: backOut }}
  >
    <h2 id={titleId}>{title}</h2>
    {@render children()}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    padding: var(--space-6);
    background: rgb(0 0 0 / 0.35);
    backdrop-filter: blur(4px);
  }

  .scrim {
    position: absolute;
    inset: 0;
    border: none;
    background: none;
    cursor: default;
  }

  .card {
    position: relative;
    display: grid;
    gap: var(--space-3);
    width: min(100%, 340px);
    max-height: 100%;
    overflow-y: auto;
    padding: var(--space-8) var(--space-6) var(--space-6);
    border-radius: var(--radius-md);
    background: var(--color-surface);
    box-shadow: var(--shadow-md);
    text-align: center;
  }

  h2 {
    margin: 0;
    font-size: var(--text-2xl);
    color: var(--color-accent);
  }
</style>
