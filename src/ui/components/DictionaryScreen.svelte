<!--
@component
Tu diccionario: every word the player has found, in alphabetical order and grouped by
letter, with a search and a row of letters to jump to. Tapping a word offers its
definition.

- `game`: the player's game, for the dictionary and how words are written.
- `onback()`: back to the home screen.
-->
<script lang="ts">
  import type { Game } from '../../app/game.svelte';
  import { strings } from '../../i18n';
  import { DURATION, fly } from '../lib/motion';
  import { wordIndex } from '../lib/word-index';
  import DefinitionDialog from './DefinitionDialog.svelte';
  import ScreenHeader from './ScreenHeader.svelte';

  type Props = { game: Game; onback: () => void };
  let { game, onback }: Props = $props();

  let search = $state('');
  /** The word whose definition is offered, as written. */
  let defining = $state<string | null>(null);
  const groups = $derived(wordIndex(game.dictionary, search));
  const shown = $derived(groups.reduce((sum, group) => sum + group.words.length, 0));

  // Each letter's section, to jump to; `bind:this` below fills it in.
  const sections: Record<string, HTMLElement> = {};
  // How tall the sticky top is, so a section jumped to lands just below it.
  let top = $state(0);
</script>

<main in:fly={{ y: 12, duration: DURATION.slow }}>
  <div class="top" bind:clientHeight={top}>
    <ScreenHeader title={strings.dictionary} {onback} />
    {#if game.dictionary.length > 0}
      <input
        type="search"
        placeholder={strings.dictionarySearch}
        aria-label={strings.dictionarySearch}
        autocomplete="off"
        spellcheck="false"
        bind:value={search}
      />
      <nav aria-label={strings.dictionaryLetters}>
        {#each groups as group (group.letter)}
          <button
            aria-label={strings.dictionaryLetter(group.letter)}
            onclick={() => sections[group.letter]?.scrollIntoView({ block: 'start' })}
          >
            {group.letter}
          </button>
        {/each}
      </nav>
    {/if}
  </div>

  {#if game.dictionary.length === 0}
    <p class="empty">{strings.dictionaryEmpty}</p>
  {:else if groups.length === 0}
    <p class="empty">{strings.dictionaryNoMatch(search.trim())}</p>
  {:else}
    <p class="count">{strings.dictionaryCount(shown)}</p>
  {/if}

  {#each groups as group (group.letter)}
    <section bind:this={sections[group.letter]} style:scroll-margin-top="{top}px">
      <h2>{group.letter}</h2>
      <ul>
        {#each group.words as word (word)}
          <li>
            <button onclick={() => (defining = game.written(word))}>{game.written(word)}</button>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</main>

{#if defining}
  <DefinitionDialog word={defining} onclose={() => (defining = null)} />
{/if}

<style>
  main {
    max-width: 480px;
    margin: 0 auto;
    padding: 0 var(--space-4) max(var(--space-6), env(safe-area-inset-bottom));
  }

  .top {
    position: sticky;
    top: 0;
    z-index: 1;
    display: grid;
    gap: var(--space-2);
    padding: max(var(--space-3), env(safe-area-inset-top)) 0 var(--space-2);
    background: var(--color-bg-top);
  }

  input {
    min-height: 44px;
    padding: 0 var(--space-4);
    border: none;
    border-radius: var(--radius-full);
    background: var(--color-surface);
    box-shadow: inset 0 0 0 1px var(--color-tile-border);
    color: var(--color-text);
    /* 16px or more, so iPhones don't zoom in on focus. */
    font: inherit;
    font-size: var(--text-md);
    user-select: text;
    -webkit-user-select: text;
  }

  input::placeholder {
    color: var(--color-text-muted);
  }

  /* One row of letters that scrolls sideways, so it never takes over the screen. */
  nav {
    display: flex;
    overflow-x: auto;
    scrollbar-width: none;
    /* Fades out at the right edge: there's more to scroll to. */
    mask-image: linear-gradient(to right, black 85%, transparent);
  }

  nav button {
    flex: none;
    min-width: 44px;
    height: 44px;
    border: none;
    border-radius: var(--radius-sm);
    background: none;
    color: var(--color-accent-strong);
    font: inherit;
    font-weight: var(--weight-bold);
    cursor: pointer;
  }

  .count,
  .empty {
    margin: var(--space-2) 0;
    color: var(--color-text-muted);
    font-size: var(--text-sm);
  }

  h2 {
    margin: var(--space-4) 0 var(--space-2);
    color: var(--color-accent-strong);
    font-size: var(--text-lg);
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li button {
    min-height: 44px;
    padding: 0 var(--space-3);
    border: none;
    border-radius: var(--radius-sm);
    background: var(--color-tile);
    box-shadow: inset 0 0 0 1px var(--color-tile-border);
    color: var(--color-text);
    font: inherit;
    font-weight: var(--weight-bold);
    letter-spacing: 0.04em;
    cursor: pointer;
  }
</style>
