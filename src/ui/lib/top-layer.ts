/**
 * Keeping toasts visible over dialogs.
 * @module
 */

/**
 * Shows an element with `popover="manual"` in the browser's top layer, where open dialogs
 * live, so a toast isn't hidden behind one. It waits a frame, so a dialog opening at the
 * same moment (Level Complete, with an achievement) goes underneath.
 * Use as an attachment: `<div popover="manual" {@attach onTop}>`.
 */
export function onTop(node: HTMLElement): () => void {
  const frame = requestAnimationFrame(() => node.showPopover());
  return () => cancelAnimationFrame(frame);
}
