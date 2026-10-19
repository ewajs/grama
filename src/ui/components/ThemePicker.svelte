<!--
@component
Picks the color theme, like a radio group: one sample per theme, painted in that theme's
own colors (its background, a found tile, the bonus color). Bind its value:
`<ThemePicker bind:value={preferences.theme} />`.

- `value`: the chosen theme (bindable).
-->
<script lang="ts">
  import { strings } from '../../i18n';
  import { THEMES, type Theme } from '../../storage/settings';

  let { value = $bindable() }: { value: Theme } = $props();
</script>

<div class="themes" role="radiogroup" aria-label={strings.theme}>
  {#each THEMES as theme (theme)}
    <button
      role="radio"
      aria-checked={value === theme}
      class:active={value === theme}
      onclick={() => (value = theme)}
    >
      <!-- data-theme gives the sample that theme's colors (see tokens.css). -->
      <span class="sample" data-theme={theme} aria-hidden="true">
        <span class="tile">A</span>
        <span class="bonus"></span>
      </span>
      {strings.themes[theme]}
    </button>
  {/each}
</div>

<style>
  .themes {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-2);
  }

  button {
    display: grid;
    gap: var(--space-1);
    padding: 0;
    border: none;
    background: none;
    color: var(--color-text-muted);
    font: inherit;
    font-size: var(--text-sm);
    font-weight: var(--weight-medium);
    cursor: pointer;
  }

  .active {
    color: var(--color-text);
  }

  .sample {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1);
    height: 48px;
    border-radius: var(--radius-sm);
    background: linear-gradient(var(--color-bg-top), var(--color-bg-bottom));
    box-shadow: inset 0 0 0 1px var(--color-tile-border);
    transition: box-shadow var(--dur-fast);
  }

  /* The chosen one is ringed in its own accent. */
  .active .sample {
    box-shadow: inset 0 0 0 2px var(--color-accent);
  }

  .tile {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    font-weight: var(--weight-bold);
  }

  .bonus {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-bonus);
  }
</style>
