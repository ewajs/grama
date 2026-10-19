<!--
@component
Pick one of a few options, side by side (like a radio group). Bind its value:
`<Segmented label="Tema" options={…} bind:value={preferences.theme} />`.

- `label`: what is being chosen, for screen readers.
- `options`: each option's value and visible label.
- `value`: the chosen option (bindable).
-->
<script lang="ts" generics="T extends string">
  type Props = { label: string; options: readonly { value: T; label: string }[]; value: T };
  // `$bindable` lets a parent write `bind:value`, so a choice here updates its state.
  let { label, options, value = $bindable() }: Props = $props();
</script>

<div class="segmented" role="radiogroup" aria-label={label}>
  {#each options as option (option.value)}
    <button
      role="radio"
      aria-checked={value === option.value}
      class:active={value === option.value}
      onclick={() => (value = option.value)}
    >
      {option.label}
    </button>
  {/each}
</div>

<style>
  .segmented {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    gap: 2px;
    padding: 3px;
    border-radius: var(--radius-full);
    background: var(--color-tile);
    box-shadow: inset 0 0 0 1px var(--color-tile-border);
  }

  button {
    min-height: 40px;
    border: none;
    border-radius: var(--radius-full);
    background: none;
    color: var(--color-text-muted);
    font: inherit;
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition:
      background-color var(--dur-fast),
      color var(--dur-fast);
  }

  .active {
    background: var(--color-accent);
    color: var(--color-accent-contrast);
  }
</style>
