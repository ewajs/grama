<!--
@component
The screen where a level is played: header, board, the word being spelled and the
letter wheel with its controls.

- `game`: the running game; the screen reads it and sends it the player's words.
-->
<script lang="ts">
  import type { Game } from '../../app/game.svelte';
  import type { Submission } from '../../core/evaluate';
  import { shuffled } from '../../core/random';
  import { strings } from '../../i18n';
  import { FEEDBACK_DURATION } from '../lib/motion';
  import Board from './Board.svelte';
  import Header from './Header.svelte';
  import HintButton from './HintButton.svelte';
  import BonusCounter from './BonusCounter.svelte';
  import LetterWheel from './LetterWheel.svelte';
  import LevelComplete from './LevelComplete.svelte';
  import WordPill from './WordPill.svelte';

  let { game }: { game: Game } = $props();

  /** The word being spelled on the wheel right now. */
  let word = $state('');
  /** The last submitted word's result, shown briefly. */
  let result = $state<{ id: number; submission: Submission } | null>(null);
  let resultCount = 0;
  let clearResult: ReturnType<typeof setTimeout> | undefined;

  // Derived from the level, so a new level brings new letters; shuffling overrides it.
  let tiles = $derived(game.level.letters.map((letter, id) => ({ id, letter })));

  const repeated = $derived(result?.submission.kind === 'repeated' ? result.submission.word : null);

  // What the player sees: words as written, with their accents.
  const shown = $derived(
    result && {
      id: result.id,
      kind: result.submission.kind,
      word: game.written(result.submission.word),
    },
  );

  function spell(next: string) {
    word = next;
    if (next) result = null;
  }

  function nextLevel() {
    result = null;
    game.next();
  }

  function submit(next: string) {
    result = { id: ++resultCount, submission: game.submit(next) };
    clearTimeout(clearResult);
    clearResult = setTimeout(() => (result = null), FEEDBACK_DURATION);
  }
</script>

<main>
  <Header level={game.levelNumber} score={game.score} />

  <div class="board">
    <Board rows={game.board} glow={repeated && game.written(repeated)} />
  </div>

  <WordPill {word} result={shown} />

  <div class="controls">
    <LetterWheel {tiles} onword={spell} onsubmit={submit} />
    <button class="shuffle" aria-label={strings.shuffle} onclick={() => (tiles = shuffled(tiles))}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7h3c4 0 6 10 10 10h5M3 17h3c4 0 6-10 10-10h5m-3-3 3 3-3 3m0 4 3 3-3 3" />
      </svg>
    </button>
    <div class="hint">
      <HintButton count={game.hints} disabled={!game.canHint} onhint={() => game.hint()} />
    </div>
    <div class="bonus">
      <BonusCounter
        count={game.bonusFound}
        progress={game.hintProgress}
        untilHint={game.bonusUntilHint}
        glow={repeated !== null && !game.level.targets.includes(repeated)}
      />
    </div>
  </div>
</main>

{#if game.complete}
  <LevelComplete
    level={game.levelNumber}
    points={game.levelPoints}
    bonus={game.bonusFound}
    onnext={nextLevel}
  />
{/if}

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
    height: 100dvh;
    max-width: 480px;
    margin: 0 auto;
    padding: max(var(--space-3), env(safe-area-inset-top)) var(--space-4)
      max(var(--space-4), env(safe-area-inset-bottom));
  }

  .board {
    flex: 1;
    align-self: stretch;
    min-height: 0;
  }

  .controls {
    position: relative;
    display: grid;
    place-items: center;
    align-self: stretch;
  }

  .shuffle,
  .bonus {
    position: absolute;
    bottom: 0;
  }

  .shuffle {
    left: 0;
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: var(--color-surface);
    box-shadow: var(--shadow-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: scale var(--dur-fast) var(--ease-out);
  }

  .shuffle:active {
    scale: 0.92;
  }

  .shuffle svg {
    width: 24px;
    height: 24px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .bonus {
    right: 0;
  }

  .hint {
    position: absolute;
    top: 0;
    right: 0;
  }
</style>
