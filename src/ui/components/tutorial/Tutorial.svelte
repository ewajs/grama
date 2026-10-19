<!--
@component
"Cómo jugar": three short animated steps. Shown on first launch and from the menu.

- `onclose()`: finished or skipped.
-->
<script lang="ts">
  import { strings } from '../../../i18n';
  import Dialog from '../Dialog.svelte';
  import BoardDemo from './BoardDemo.svelte';
  import DrawDemo from './DrawDemo.svelte';
  import HintDemo from './HintDemo.svelte';

  let { onclose }: { onclose: () => void } = $props();

  let step = $state(0);
  const last = strings.tutorial.length - 1;
  const current = $derived(strings.tutorial[step]);
</script>

<Dialog title={current?.title ?? ''} {onclose}>
  <div class="demo">
    {#if step === 0}
      <DrawDemo />
    {:else if step === 1}
      <BoardDemo />
    {:else}
      <HintDemo />
    {/if}
  </div>
  <p>{current?.text}</p>
  <div class="dots" aria-hidden="true">
    {#each strings.tutorial as page, index (page.title)}
      <span class:active={index === step}></span>
    {/each}
  </div>
  {#if step < last}
    <button class="primary" onclick={() => step++}>{strings.next}</button>
    <button class="skip" onclick={onclose}>{strings.skip}</button>
  {:else}
    <button class="primary" onclick={onclose}>{strings.play}</button>
  {/if}
</Dialog>

<style>
  .demo {
    display: grid;
    place-items: center;
    min-height: 220px;
  }

  p {
    margin: 0;
    color: var(--color-text-muted);
  }

  .dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin: var(--space-2) 0;
  }

  .dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-tile-border);
    transition: background-color var(--dur-fast);
  }

  .dots .active {
    background: var(--color-accent);
  }

  .skip {
    min-height: 44px;
    border: none;
    background: none;
    color: var(--color-text-muted);
    font: inherit;
    cursor: pointer;
  }
</style>
