<!--
@component
The circle of letters the player spells words on. Pointer events, so touch and mouse
work the same way. Three ways to spell:

- **Drag** across letters; letting go submits.
- **Tap** letters one by one; the word waits (tap the last letter to take it back, the
  empty wheel to start over) until `submit()`, e.g. from tapping the word pill.
- **Type** them, through `type(letter)`, `erase()`, `submit()` and `clear()`, which the
  game screen calls from the keyboard.

Props:

- `tiles`: letters in display order. `id` keeps a letter's identity when the order
  changes, so it glides to its new place instead of jumping. A new order (shuffle, next
  level) drops a waiting word.
- `onword(word, waiting)`: the word being spelled changed; `waiting` when it's tapped or
  typed and waits to be submitted, not dragged.
- `onsubmit(word)`: a word of two or more letters was submitted.
-->
<script lang="ts">
  import { untrack } from 'svelte';
  import { strings } from '../../i18n';
  import {
    extendPath,
    letterAt,
    letterPosition,
    letterPositions,
    tapLetter,
    typeLetter,
    type Point,
  } from '../lib/wheel';

  type Tile = { id: number; letter: string };
  type Props = {
    tiles: readonly Tile[];
    onword?: (word: string, waiting: boolean) => void;
    onsubmit: (word: string) => void;
  };
  type WheelPointerEvent = PointerEvent & { currentTarget: HTMLElement };

  let { tiles, onword, onsubmit }: Props = $props();

  /** Indices of the selected tiles, in order. */
  let path = $state<readonly number[]>([]);
  /** Where the dragging pointer is, while it's down. */
  let pointer = $state<Point | null>(null);
  /** Which pointer is down, so a second finger can't interfere. */
  let pointerId: number | null = null;
  /** The press so far: the letter pressed, the word before it, and whether it dragged. */
  let press: { index: number; before: readonly number[]; dragged: boolean } | null = null;

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
    // Waiting: no finger down, so it was tapped or typed.
    onword?.(wordOf(next), next.length > 0 && press === null);
  }

  // Indices point at places on the wheel: when the letters move, a waiting word is void.
  $effect(() => {
    void tiles;
    untrack(() => setPath([]));
  });

  /** Adds a typed letter (normalized: `A`…`Z`, `Ñ`) to the word, if one is left. */
  export function type(letter: string) {
    if (pointerId === null)
      setPath(
        typeLetter(
          path,
          tiles.map((tile) => tile.letter),
          letter,
        ),
      );
  }

  /** Takes back the last letter. */
  export function erase() {
    if (pointerId === null) setPath(path.slice(0, -1));
  }

  /** Drops the word being spelled. */
  export function clear() {
    if (pointerId === null) setPath([]);
  }

  /** Submits the waiting word; a single letter is just dropped. */
  export function submit() {
    if (pointerId !== null) return;
    const word = wordOf(path);
    setPath([]);
    if (word.length > 1) onsubmit(word);
  }

  function toWheel(event: WheelPointerEvent): Point {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height };
  }

  function start(event: WheelPointerEvent) {
    if (pointerId !== null) return;
    const point = toWheel(event);
    const index = letterAt(point, positions);
    // A tap on the wheel between letters starts over.
    if (index === null) return setPath([]);
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerId = event.pointerId;
    pointer = point;
    press = { index, before: path, dragged: false };
    // A new letter shows selected at once; the last one is only taken back on a tap.
    if (!path.includes(index)) setPath([...path, index]);
  }

  function move(event: WheelPointerEvent) {
    if (event.pointerId !== pointerId || !press) return;
    pointer = toWheel(event);
    const next = extendPath(path, letterAt(pointer, positions));
    if (next !== path) press.dragged = true;
    setPath(next);
  }

  function end(event: WheelPointerEvent) {
    if (event.pointerId !== pointerId || !press) return;
    const { index, before, dragged } = press;
    pointerId = null;
    pointer = null;
    press = null;
    if (dragged) {
      submit();
    } else {
      // A tap: the word waits for more letters, or for submit().
      setPath(tapLetter(before, index));
    }
  }

  // The system took the pointer (an edge swipe, a call): drop the word, don't submit it.
  function cancel(event: WheelPointerEvent) {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    pointer = null;
    press = null;
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
