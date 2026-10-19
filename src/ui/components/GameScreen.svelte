<!--
@component
The screen where a level is played: header, board, the word being spelled and the
letter wheel with its controls.

- `game`: the running game; the screen reads it and sends it the player's words.
- `preferences`: the player's settings, changed from the menu.
- `installer`: for the menu's install option.
- `onback()`: back to the home screen.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import type { Game } from '../../app/game.svelte';
  import type { Installer } from '../../app/install.svelte';
  import type { Preferences } from '../../app/preferences.svelte';
  import { shareText } from '../../app/share';
  import { vibrate } from '../lib/haptics';
  import type { Submission } from '../../core/evaluate';
  import { shuffled } from '../../core/random';
  import { strings } from '../../i18n';
  import { FEEDBACK_DURATION } from '../lib/motion';
  import Board from './Board.svelte';
  import Header from './Header.svelte';
  import HintButton from './HintButton.svelte';
  import AchievementToast from './AchievementToast.svelte';
  import BonusCounter from './BonusCounter.svelte';
  import BonusWords from './BonusWords.svelte';
  import LetterWheel from './LetterWheel.svelte';
  import LevelComplete from './LevelComplete.svelte';
  import Menu from './Menu.svelte';
  import ReportDialog from './ReportDialog.svelte';
  import ResetDialog from './ResetDialog.svelte';
  import Tutorial from './tutorial/Tutorial.svelte';
  import WordPill from './WordPill.svelte';

  type Props = {
    game: Game;
    preferences: Preferences;
    installer: Installer;
    onback: () => void;
  };
  let { game, preferences, installer, onback }: Props = $props();

  /** The dialog open over the game, if any (the level-complete one shows on its own). */
  // The tutorial opens by itself on first launch. `untrack` reads the setting once, on
  // purpose: marking it seen later shouldn't change which panel is open.
  let panel = $state<'menu' | 'tutorial' | 'report' | 'reset' | 'bonus' | null>(
    untrack(() => (preferences.tutorialSeen ? null : 'tutorial')),
  );
  const close = () => (panel = null);
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
    if (preferences.vibration && next.length > word.length) vibrate('letter');
    word = next;
    if (next) result = null;
  }

  function nextLevel() {
    result = null;
    if (game.replaying || game.daily) {
      game.playCurrent();
      onback();
    } else {
      game.next(preferences.difficulty);
    }
  }

  /** Shares today's daily result; returns how it went. */
  function shareDaily() {
    const { today } = game;
    return shareText(
      strings.shareText({
        number: today.number,
        weekday: strings.weekday(today.date),
        tier: strings.tiers[today.tier],
        stars: game.stars,
        hints: game.hintsUsed,
        streak: today.streak,
        url: location.origin + import.meta.env.BASE_URL,
      }),
    );
  }

  function submit(next: string) {
    const submission = game.submit(next);
    if (preferences.vibration && submission.kind !== 'repeated') vibrate(submission.kind);
    result = { id: ++resultCount, submission };
    clearTimeout(clearResult);
    clearResult = setTimeout(() => (result = null), FEEDBACK_DURATION);
  }
</script>

<main>
  <Header
    title={game.daily
      ? strings.dailyTitle(game.levelNumber)
      : game.replaying
        ? `${strings.level(game.levelNumber)} · ${strings.replaying}`
        : strings.level(game.levelNumber)}
    tier={game.tier}
    score={game.score}
    {onback}
    onmenu={() => (panel = 'menu')}
  />

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
        onopen={() => (panel = 'bonus')}
      />
    </div>
  </div>
</main>

{#if panel === 'menu'}
  <Menu
    {preferences}
    {installer}
    ontutorial={() => (panel = 'tutorial')}
    onreport={() => (panel = 'report')}
    onreset={() => (panel = 'reset')}
    onclose={close}
  />
{:else if panel === 'tutorial'}
  <Tutorial
    onclose={() => {
      preferences.tutorialSeen = true;
      close();
    }}
  />
{:else if panel === 'report'}
  <ReportDialog link={(kind) => game.reportUrl(kind)} onclose={close} />
{:else if panel === 'reset'}
  <ResetDialog
    onconfirm={() => {
      result = null;
      game.reset(preferences.difficulty);
      close();
    }}
    onclose={close}
  />
{:else if panel === 'bonus'}
  <BonusWords
    words={game.bonusWords}
    total={game.bonusTotal}
    untilHint={game.bonusUntilHint}
    onclose={close}
  />
{/if}

{#if game.complete}
  <LevelComplete
    detail={game.daily
      ? strings.dailyCompleteDetail(game.levelNumber)
      : strings.levelCompleteDetail(game.levelNumber)}
    tier={game.tier}
    stars={game.stars}
    nextLabel={game.daily
      ? strings.backHome
      : game.replaying
        ? strings.backToMap
        : strings.nextLevel}
    share={game.daily ? shareDaily : undefined}
    points={game.levelPoints}
    bonus={game.bonusFound}
    onnext={nextLevel}
  />
{/if}

<AchievementToast unlocked={game.achievements} />

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
