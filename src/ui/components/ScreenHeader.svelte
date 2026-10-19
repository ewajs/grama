<!--
@component
The top of a secondary screen: a back arrow and the screen's title.

- `title`: the screen's name.
- `onback()`: back to the previous screen.
- `sticky`: stays at the top while the screen scrolls.
-->
<script lang="ts">
  import { strings } from '../../i18n';

  type Props = { title: string; onback: () => void; sticky?: boolean };
  let { title, onback, sticky = false }: Props = $props();
</script>

<header class:sticky>
  <button aria-label={strings.back} onclick={onback}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
  </button>
  <h1>{title}</h1>
</header>

<style>
  header {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) 0;
  }

  .sticky {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--color-bg-top);
  }

  h1 {
    margin: 0;
    font-size: var(--text-xl);
  }

  button {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    margin-left: calc(-1 * var(--space-2));
    padding: 0;
    border: none;
    border-radius: 50%;
    background: none;
    color: var(--color-text);
    cursor: pointer;
  }

  svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
</style>
