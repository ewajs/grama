<!--
@component
Celebrates a finished level over the game screen, with what was won, and moves on.

- `level`: number of the level just finished.
- `tier`: how hard it was; harder levels list their rewards.
- `points`: points won on it.
- `bonus`: bonus words found on it.
- `onnext()`: the player wants the next level.
-->
<script lang="ts">
  import type { Tier } from '../../core/difficulty';
  import { TIER_MULTIPLIER } from '../../core/evaluate';
  import { strings } from '../../i18n';
  import { CELEBRATION_DELAY } from '../lib/motion';
  import Dialog from './Dialog.svelte';

  type Props = { level: number; tier: Tier; points: number; bonus: number; onnext: () => void };
  let { level, tier, points, bonus, onnext }: Props = $props();
</script>

<Dialog title={strings.levelComplete} delay={CELEBRATION_DELAY}>
  <p>{strings.levelCompleteDetail(level)}</p>
  <ul>
    {#if tier === 'hard' || tier === 'extra'}
      <li class="tier {tier}">
        {strings.tiers[tier]} · {strings.tierReward(TIER_MULTIPLIER[tier])}
      </li>
    {/if}
    <li class="points">{strings.pointsWon(points)}</li>
    <li class="bonus">{strings.bonusWords(bonus)}</li>
    {#if tier === 'extra'}
      <li class="hint">{strings.extraHint}</li>
    {/if}
  </ul>
  <button class="primary" onclick={onnext}>{strings.nextLevel}</button>
</Dialog>

<style>
  p {
    margin: 0;
    color: var(--color-text-muted);
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
    margin: var(--space-2) 0 var(--space-4);
    padding: 0;
    list-style: none;
    font-weight: var(--weight-medium);
  }

  li {
    padding: var(--space-1) var(--space-3);
    border-radius: var(--radius-full);
    background: var(--color-tile);
    box-shadow: inset 0 0 0 1px var(--color-tile-border);
  }

  .points {
    color: var(--color-success);
  }

  .bonus,
  .hint {
    color: var(--color-bonus);
  }

  .tier {
    color: var(--color-accent-contrast);
    box-shadow: none;
  }

  .tier.hard {
    background: var(--color-bonus);
  }

  .tier.extra {
    background: var(--color-danger);
  }
</style>
