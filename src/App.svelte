<!-- @component Root of the app: loads the words, then starts a game. -->
<script lang="ts">
  import { Game } from './app/game.svelte';
  import { levelFromUrl } from './app/url';
  import { loadWords } from './content';
  import { strings } from './i18n';
  import GameScreen from './ui/components/GameScreen.svelte';

  const words = loadWords();
</script>

{#await words}
  <p class="status">{strings.loading}</p>
{:then words}
  <GameScreen game={new Game(words, levelFromUrl(location.search))} />
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
