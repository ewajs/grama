<!-- @component Root of the app: starts a game with the current language's levels. -->
<script lang="ts">
  import { Game } from './app/game.svelte';
  import { levels } from './content';
  import GameScreen from './ui/components/GameScreen.svelte';

  const game = new Game(levels);
</script>

<GameScreen {game} />
