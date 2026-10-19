<!-- @component Root of the app: loads the words, then starts or resumes the game. -->
<script lang="ts">
  import { Game } from './app/game.svelte';
  import { levelFromUrl, startState } from './app/start';
  import { loadWords } from './content';
  import { strings } from './i18n';
  import { loadGame, saveGame } from './storage/save';
  import GameScreen from './ui/components/GameScreen.svelte';

  const words = loadWords();
  const start = startState(loadGame(), levelFromUrl(location.search));
  // Once applied, ?nivel= leaves the URL so a reload continues instead of jumping again.
  history.replaceState(null, '', location.pathname);
</script>

{#await words}
  <p class="status">{strings.loading}</p>
{:then words}
  <GameScreen game={new Game(words, start, saveGame)} />
{:catch}
  <p class="status">{strings.loadError}</p>
{/await}

<style>
  .status {
    display: grid;
    place-items: center;
    min-height: 100dvh;
    margin: 0;
    padding: var(--space-6);
    color: var(--color-text-muted);
    text-align: center;
  }
</style>
