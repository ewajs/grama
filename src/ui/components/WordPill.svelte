<!--
@component
Shows the word being spelled and, once submitted, briefly how it went: a target's letters
fly into the board (see `ui/lib/fly`), a word that's not valid shakes red, a bonus word
flies to the bonus counter, one already found fades grey.

- `word`: the word being spelled; takes over whenever it's not empty.
- `result`: the last submission to show, as written, with an `id` so the same word can
  replay.
-->
<script lang="ts">
  import type { Submission } from '../../core/evaluate';
  import { fade } from 'svelte/transition';
  import { sendLetter } from '../lib/fly';
  import { DURATION } from '../lib/motion';

  type Props = {
    word: string;
    result: { id: number; kind: Submission['kind']; word: string } | null;
  };
  let { word, result }: Props = $props();
</script>

<div class="slot">
  {#if word}
    <!-- The pill fades at once; its letters' tiles fly on to the board meanwhile. -->
    <div class="pill" out:fade={{ duration: DURATION.fast }}>
      <!-- |global: these letters fly even though the whole pill is what goes away. -->
      {#each [...word] as letter, index (index)}
        <span out:sendLetter|global={{ key: index }}>{letter}</span>
      {/each}
    </div>
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

  span {
    display: inline-block;
  }

  .invalid {
    background: var(--color-danger);
    animation:
      shake var(--dur-slow) var(--ease-in-out),
      fade-out var(--dur-base) var(--dur-slow) forwards;
  }

  .bonus {
    background: var(--color-bonus);
    animation: to-bonus var(--dur-slow) var(--dur-fast) var(--ease-in-out) forwards;
  }

  .repeated {
    background: var(--color-text-muted);
    animation: fade-out var(--dur-base) var(--dur-slow) forwards;
  }

  @keyframes shake {
    20%,
    60% {
      translate: -8px;
    }
    40%,
    80% {
      translate: 8px;
    }
  }

  @keyframes fade-out {
    to {
      opacity: 0;
    }
  }

  /* Towards the bonus counter, at the lower right of the wheel just below. */
  @keyframes to-bonus {
    to {
      translate: calc(var(--wheel-size) / 2) calc(var(--wheel-size) + var(--space-6));
      scale: 0.3;
      opacity: 0;
    }
  }
</style>
