<!--
@component
Announces achievements as they're earned: a toast slides in from the top, one at a time.

- `unlocked`: every achievement reached so far; the ones that appear after this mounts
  are announced.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import type { AchievementId } from '../../core/achievements';
  import { strings } from '../../i18n';
  import { onTop } from '../lib/top-layer';
  import { DURATION, fly } from '../lib/motion';

  /** How long each toast stays. */
  const SHOWN_FOR = 2600;

  let { unlocked }: { unlocked: readonly AchievementId[] } = $props();

  // Already earned when the screen opened: not news. Not reactive on purpose.
  let known = untrack(() => [...unlocked]);
  let queue = $state<AchievementId[]>([]);

  $effect(() => {
    const fresh = unlocked.filter((id) => !known.includes(id));
    known = [...known, ...fresh];
    if (fresh.length > 0) queue = [...untrack(() => queue), ...fresh];
  });

  // Shows the first in line, then the next.
  $effect(() => {
    if (queue.length === 0) return;
    const timer = setTimeout(() => (queue = queue.slice(1)), SHOWN_FOR);
    return () => clearTimeout(timer);
  });
</script>

{#each queue.slice(0, 1) as id (id)}
  {@const [title] = strings.achievementList[id]}
  <div
    class="toast"
    role="status"
    popover="manual"
    {@attach onTop}
    transition:fly={{ y: -24, duration: DURATION.slow }}
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0V4Zm0 2H4v1a3 3 0 0 0 3 3m10-4h3v1a3 3 0 0 1-3 3"
      />
    </svg>
    <div>
      <small>{strings.achievementUnlocked}</small>
      <b>{title}</b>
    </div>
  </div>
{/each}

<style>
  /* A popover (see onTop), with the browser's popover styles undone. */
  .toast {
    position: fixed;
    inset: auto;
    margin: 0;
    border: none;
    color: inherit;
    overflow: visible;
    top: max(var(--space-3), env(safe-area-inset-top));
    left: 50%;
    translate: -50%;
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-4) var(--space-2) var(--space-3);
    border-radius: var(--radius-full);
    background: var(--color-surface);
    box-shadow: var(--shadow-md);
    white-space: nowrap;
  }

  svg {
    width: 28px;
    height: 28px;
    fill: none;
    stroke: var(--color-bonus);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  div {
    display: grid;
  }

  small {
    color: var(--color-text-muted);
    font-size: 0.7rem;
  }
</style>
