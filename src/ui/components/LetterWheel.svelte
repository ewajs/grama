<!--
@component
The circle of letters the player drags across to spell a word. Pointer events, so touch
and mouse work the same way.

- `tiles`: letters in display order. `id` keeps a letter's identity when the order
  changes, so it glides to its new place instead of jumping.
- `onword(word)`: the word being spelled changed during a drag.
- `onsubmit(word)`: the player let go after selecting two or more letters.
-->
<script lang="ts">
  import { strings } from '../../i18n';
  import { extendPath, letterAt, letterPosition, letterPositions, type Point } from '../lib/wheel';

  type Tile = { id: number; letter: string };
  type Props = {
    tiles: readonly Tile[];
    onword?: (word: string) => void;
    onsubmit: (word: string) => void;
  };
  type WheelPointerEvent = PointerEvent & { currentTarget: HTMLElement };

  let { tiles, onword, onsubmit }: Props = $props();

  /** Indices of the selected tiles, in order. */
  let path = $state<readonly number[]>([]);
  /** Where the dragging pointer is, while it's down. */
  let pointer = $state<Point | null>(null);
  /** Which pointer is dragging, so a second finger can't interfere. */
  let pointerId: number | null = null;

  const positions = $derived(letterPositions(tiles.length));
  const line = $derived(
    [...path.map((index) => positions[index]), pointer]
      .filter((point) => point != null)
      .map(({ x, y }) => `${x * 100},${y * 100}`)
      .join(' '),
  );

  function wordOf(indices: readonly number[]): string {
    return indices.map((index) => tiles[index]?.letter).join('');
  }

  function setPath(next: readonly number[]) {
    if (next === path) return;
    path = next;
    onword?.(wordOf(next));
  }

  function toWheel(event: WheelPointerEvent): Point {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height };
  }

  function start(event: WheelPointerEvent) {
    if (pointerId !== null) return;
    const point = toWheel(event);
    const index = letterAt(point, positions);
    if (index === null) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerId = event.pointerId;
    pointer = point;
    setPath([index]);
  }

  function move(event: WheelPointerEvent) {
    if (event.pointerId !== pointerId) return;
    pointer = toWheel(event);
    setPath(extendPath(path, letterAt(pointer, positions)));
  }

  function end(event: WheelPointerEvent) {
    if (event.pointerId !== pointerId) return;
    const word = wordOf(path);
    cancel(event);
    if (word.length > 1) onsubmit(word);
  }

  // The system took the pointer (an edge swipe, a call): drop the word, don't submit it.
  function cancel(event: WheelPointerEvent) {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    pointer = null;
    setPath([]);
  }
</script>

<div
  class="wheel"
  role="application"
  aria-label={strings.wheel}
  onpointerdown={start}
  onpointermove={move}
  onpointerup={end}
  onpointercancel={cancel}
>
  <svg viewBox="0 0 100 100" aria-hidden="true">
    <polyline points={line} />
  </svg>
  {#each tiles as tile, index (tile.id)}
    {@const at = letterPosition(index, tiles.length)}
    <div
      class="letter"
      class:selected={path.includes(index)}
      style:--x={at.x}
      style:--y={at.y}
      data-letter={tile.letter}
    >
      {tile.letter}
    </div>
  {/each}
</div>

<style>
  .wheel {
    container-type: size;
    position: relative;
    width: var(--wheel-size);
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--color-surface);
    box-shadow: var(--shadow-md);
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
  }

  svg {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  polyline {
    fill: none;
    stroke: var(--color-accent);
    stroke-width: 2.5;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.6;
  }

  .letter {
    position: absolute;
    top: 0;
    left: 0;
    display: grid;
    place-items: center;
    width: 20cqw;
    height: 20cqw;
    translate: calc(var(--x) * 100cqw - 50%) calc(var(--y) * 100cqh - 50%);
    border-radius: 50%;
    font-size: 10cqw;
    font-weight: var(--weight-bold);
    transition:
      translate var(--dur-slow) var(--ease-out),
      scale var(--dur-fast) var(--ease-out),
      background-color var(--dur-fast),
      color var(--dur-fast);
  }

  .letter.selected {
    background: var(--color-accent);
    color: var(--color-accent-contrast);
    scale: 1.08;
  }
</style>
