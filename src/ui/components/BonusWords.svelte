<!--
@component
The bonus words found on this level, newest first, and how far along the next hint is.

- `words`: bonus words found, as written, in the order found.
- `total`: bonus words the level has.
- `untilHint`: bonus words still to find for the next hint.
- `onclose()`: the player is done looking.
-->
<script lang="ts">
  import { strings } from '../../i18n';
  import Dialog from './Dialog.svelte';

  type Props = { words: readonly string[]; total: number; untilHint: number; onclose: () => void };
  let { words, total, untilHint, onclose }: Props = $props();
</script>

<Dialog title={strings.bonusTitle} {onclose}>
  <p>{strings.bonusFoundOf(words.length, total)} · {strings.untilHint(untilHint)}</p>
  {#if words.length > 0}
    <ul>
      {#each words.toReversed() as word (word)}
        <li>{word}</li>
      {/each}
    </ul>
  {:else}
    <p class="empty">{strings.bonusNone}</p>
  {/if}
  <button class="secondary" onclick={onclose}>{strings.close}</button>
</Dialog>

<style>
  p {
    margin: 0;
    color: var(--color-text-muted);
  }

  .empty {
    margin: var(--space-2) 0;
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
    margin: var(--space-2) 0;
    padding: 0;
    list-style: none;
  }

  li {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    background: var(--color-tile);
    box-shadow: inset 0 0 0 1px var(--color-tile-border);
    color: var(--color-bonus);
    font-weight: var(--weight-bold);
    letter-spacing: 0.04em;
  }
</style>
