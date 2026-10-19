<!--
@component
A card over the dimmed, blurred game: the frame every dialog shares. What goes inside is
passed as children, e.g. `<Dialog title="…">content</Dialog>`. It's a native modal
`<dialog>`: focus moves into it and stays there, the game behind can't be reached, and
focus goes back where it was when it closes.

- `title`: heading, also the dialog's accessible name.
- `onclose()`: when given, tapping outside the card or pressing Escape closes it.
- `delay`: milliseconds to wait before appearing.
- `behind`: drawn over the whole screen behind the card (Level Complete's confetti).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { backOut } from 'svelte/easing';
  import { fade } from 'svelte/transition';
  import { strings } from '../../i18n';
  import { DURATION, scale } from '../lib/motion';

  type Props = {
    title: string;
    onclose?: () => void;
    delay?: number;
    behind?: Snippet;
    children: Snippet;
  };
  let { title, onclose, delay = 0, behind, children }: Props = $props();

  // A unique id, so the card can point at its heading.
  const titleId = $props.id();
  let dialog: HTMLDialogElement;
  let heading: HTMLHeadingElement;

  // Open as a modal (the browser keeps focus in it and the page behind inert), with focus
  // on the title (read out first, and no ring on a button the player didn't pick); when
  // it goes away, focus returns to what had it, like the menu button.
  $effect(() => {
    const before = document.activeElement;
    dialog.showModal();
    heading.focus();
    return () => {
      if (before instanceof HTMLElement) before.focus();
    };
  });
</script>

<!-- The delay is for appearing only: leaving is quick, so the next screen isn't covered. -->
<dialog
  bind:this={dialog}
  class="backdrop"
  aria-labelledby={titleId}
  oncancel={(event) => {
    event.preventDefault();
    onclose?.();
  }}
  onclose={() => (onclose ? onclose() : dialog.showModal())}
  in:fade={{ duration: DURATION.base, delay }}
  out:fade={{ duration: DURATION.fast }}
>
  {#if onclose}
    <button class="scrim" aria-label={strings.close} onclick={onclose}></button>
  {/if}
  {@render behind?.()}
  <div class="card" in:scale={{ start: 0.8, duration: DURATION.slow, delay, easing: backOut }}>
    <h2 id={titleId} tabindex="-1" bind:this={heading}>{title}</h2>
    {@render children()}
  </div>
</dialog>

<style>
  /* The <dialog> itself is the full-screen backdrop; the card sits in it. */
  .backdrop {
    width: 100%;
    max-width: none;
    height: 100%;
    max-height: none;
    margin: 0;
    padding: var(--space-6);
    border: none;
    background: rgb(0 0 0 / 0.35);
    backdrop-filter: blur(4px);
    color: inherit;
  }

  /* One row as tall as the screen, so a long card scrolls inside it instead of running
     off a short (landscape) screen. */
  .backdrop[open] {
    display: grid;
    grid-template-rows: minmax(0, 1fr);
    place-items: center;
  }

  .backdrop::backdrop {
    background: none;
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
    outline: none;
  }

  @media (max-height: 500px) {
    .backdrop {
      padding: var(--space-3);
    }

    .card {
      gap: var(--space-2);
      padding: var(--space-4);
    }

    h2 {
      font-size: var(--text-xl);
    }
  }
</style>
