<!--
@component
Shows the word being spelled and, once submitted, briefly how it went, in place: a
target's letters fly into the board (see `ui/lib/fly`); a word that's not valid shakes
red, a bonus word pops amber, one already found fades grey.

- `word`: the word being spelled; takes over whenever it's not empty.
- `waiting`: the word was tapped or typed and waits: the pill shows a check, and tapping
  it calls `onsubmit()`.
- `result`: the last submission to show, as written, with an `id` so the same word can
  replay.
-->
<script lang="ts">
  import type { Submission } from '../../core/evaluate';
  import { fade } from 'svelte/transition';
  import { sendLetter } from '../lib/fly';
  import { strings } from '../../i18n';
  import { DURATION } from '../lib/motion';

  type Props = {
    word: string;
    waiting?: boolean;
    onsubmit?: () => void;
    result: { id: number; kind: Submission['kind']; word: string } | null;
  };
  let { word, waiting = false, onsubmit, result }: Props = $props();
</script>

<div class="slot">
  {#if word}
    <!-- The pill fades at once; its letters' tiles fly on to the board meanwhile. -->
    <!-- A button only while the word waits; while dragging, the finger is on the wheel. -->
    <button
      class="pill"
      class:waiting
      tabindex={waiting ? 0 : -1}
      aria-label={strings.submitWord(word)}
      onclick={() => waiting && onsubmit?.()}
      out:fade={{ duration: DURATION.fast }}
    >
      <!-- |global: these letters fly even though the whole pill is what goes away. -->
      {#each [...word] as letter, index (index)}
        <span out:sendLetter|global={{ key: index }}>{letter}</span>
      {/each}
      {#if waiting}
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
      {/if}
    </button>
  {:else if result && result.kind !== 'target'}
    {#key result.id}
      <div class="pill {result.kind}">{result.word}</div>
    {/key}
  {/if}
</div>

<style>
  .slot {
    /* Fixed, so showing the pill never moves the board above. */
    display: grid;
    place-items: center;
    height: var(--pill-height);
    flex-shrink: 0;
  }

  /* One spot for every pill: the next one shows on top of the one leaving, never below. */
  .slot > :global(*) {
    grid-area: 1 / 1;
  }

  .pill {
    display: flex;
    padding: 0 var(--space-4);
    line-height: var(--pill-height);
    border-radius: var(--radius-full);
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    letter-spacing: 0.08em;
  }

  button.pill {
    align-items: center;
    border: none;
    font-family: inherit;
    cursor: default;
  }

  .pill.waiting {
    cursor: pointer;
  }

  span {
    display: inline-block;
  }

  svg {
    width: 1.1em;
    height: 1.1em;
    margin-left: var(--space-2);
    fill: none;
    stroke: currentColor;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .invalid {
    background: var(--color-danger-strong);
    animation:
      shake var(--dur-slow) var(--ease-in-out),
      fade-out var(--dur-base) calc(var(--dur-slow) * 2) forwards;
  }

  .bonus {
    background: var(--color-bonus-strong);
    animation:
      pop var(--dur-slow) var(--ease-out),
      fade-out var(--dur-base) calc(var(--dur-slow) * 2) forwards;
  }

  .repeated {
    background: var(--color-text-muted);
    animation: fade-out var(--dur-base) calc(var(--dur-slow) * 2) forwards;
  }

  @keyframes shake {
    25% {
      translate: -5px;
    }
    50% {
      translate: 5px;
    }
    75% {
      translate: -3px;
    }
  }

  @keyframes pop {
    40% {
      scale: 1.08;
    }
  }

  @keyframes fade-out {
    to {
      opacity: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .invalid,
    .bonus {
      animation: fade-out var(--dur-base) var(--dur-slow) forwards;
    }
  }
</style>
