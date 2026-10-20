<!--
@component
One of the game's line icons (`ui/lib/icons`), in the current text color. Decorative:
screen readers skip it, so what it stands for must be said in text nearby.

- `name`: which icon.
- `size`: in pixels; 24 by default.
- `filled`: filled in instead of outlined (the score's star).
-->
<script lang="ts">
  import { ICONS, type IconName } from '../lib/icons';

  type Props = { name: IconName; size?: number; filled?: boolean };
  let { name, size = 24, filled = false }: Props = $props();
</script>

<svg viewBox="0 0 24 24" width={size} height={size} class:filled aria-hidden="true">
  <path d={ICONS[name]} />
</svg>

<style>
  svg {
    flex: none;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .filled {
    fill: currentColor;
    stroke: none;
  }
</style>
