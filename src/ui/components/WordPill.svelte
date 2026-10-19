<!--
@component
Shows the word being spelled and, once submitted, briefly how it went: shakes red when
it's not valid, rises green for a target, flies to the bonus counter for a bonus word,
fades grey when it was already found.

- `word`: the word being spelled; takes over whenever it's not empty.
- `result`: the last submission to show, with an `id` so the same word can replay.
-->
<script lang="ts">
  import type { Submission } from '../../core/evaluate';

  type Props = { word: string; result: { id: number; submission: Submission } | null };
  let { word, result }: Props = $props();
</script>

<div class="slot">
  {#if word}
    <div class="pill">{word}</div>
  {:else if result}
    {#key result.id}
      <div class="pill {result.submission.kind}">{result.submission.word}</div>
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
    padding: 0 var(--space-4);
    line-height: var(--pill-height);
    border-radius: var(--radius-full);
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font-size: var(--text-xl);
    font-weight: var(--weight-bold);
    letter-spacing: 0.08em;
  }

  .invalid {
    background: var(--color-danger);
    animation:
      shake var(--dur-slow) var(--ease-in-out),
      fade-out var(--dur-base) var(--dur-slow) forwards;
  }

  .target {
    background: var(--color-success);
    animation: rise var(--dur-slow) var(--dur-fast) var(--ease-out) forwards;
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

  @keyframes rise {
    to {
      translate: 0 -32px;
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
