<!--
@component
Offers a found word's definition, in the RAE dictionary (opens in the browser).

- `word`: the word, as written.
- `onclose()`: done.
-->
<script lang="ts">
  import { definitionUrl } from '../../app/dictionary';
  import { strings } from '../../i18n';
  import Dialog from './Dialog.svelte';

  let { word, onclose }: { word: string; onclose: () => void } = $props();
</script>

<Dialog title={word} {onclose}>
  <p>{strings.definitionHint}</p>
  <a class="primary" href={definitionUrl(word)} target="_blank" rel="noopener" onclick={onclose}>
    {strings.seeDefinition}
  </a>
  <button class="secondary" onclick={onclose}>{strings.close}</button>
</Dialog>

<style>
  p {
    margin: 0 0 var(--space-2);
    color: var(--color-text-muted);
  }
</style>
