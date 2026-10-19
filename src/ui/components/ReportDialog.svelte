<!--
@component
Asks what went wrong with the level, then opens a pre-filled GitHub issue about it.

- `link(kind)`: the GitHub link for each kind of report.
- `onclose()`: done, or cancelled.
-->
<script lang="ts">
  import type { ReportKind } from '../../app/report';
  import { strings } from '../../i18n';
  import Dialog from './Dialog.svelte';

  type Props = { link: (kind: ReportKind) => string; onclose: () => void };
  let { link, onclose }: Props = $props();

  const kinds: ReportKind[] = ['missing', 'wrong', 'other'];
</script>

<Dialog title={strings.reportTitle} {onclose}>
  <p>{strings.reportIntro}</p>
  {#each kinds as kind (kind)}
    <a class="secondary" href={link(kind)} target="_blank" rel="noopener" onclick={onclose}>
      {strings.reportKinds[kind]}
    </a>
  {/each}
  <button class="cancel" onclick={onclose}>{strings.cancel}</button>
</Dialog>

<style>
  p {
    margin: 0 0 var(--space-2);
    color: var(--color-text-muted);
  }

  .cancel {
    min-height: 44px;
    border: none;
    background: none;
    color: var(--color-text-muted);
    font: inherit;
    cursor: pointer;
  }
</style>
