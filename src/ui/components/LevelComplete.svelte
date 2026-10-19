<!--
@component
Celebrates a finished level over the game screen, with what was won, and moves on.

- `level`: number of the level just finished.
- `points`: points won on it.
- `bonus`: bonus words found on it.
- `onnext()`: the player wants the next level.
-->
<script lang="ts">
  import { strings } from '../../i18n';
  import { CELEBRATION_DELAY } from '../lib/motion';
  import Dialog from './Dialog.svelte';

  type Props = { level: number; points: number; bonus: number; onnext: () => void };
  let { level, points, bonus, onnext }: Props = $props();
</script>

<Dialog title={strings.levelComplete} delay={CELEBRATION_DELAY}>
  <p>{strings.levelCompleteDetail(level)}</p>
  <ul>
    <li class="points">{strings.pointsWon(points)}</li>
    <li class="bonus">{strings.bonusWords(bonus)}</li>
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

  .bonus {
    color: var(--color-bonus);
  }
</style>
