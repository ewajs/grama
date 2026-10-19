/**
 * Sharing text: the device's share sheet, or the clipboard.
 * @module
 */

/**
 * Shares text through the device's share sheet when there is one (phones), or copies it.
 * @returns How it went, so the UI can confirm a copy.
 */
export async function shareText(text: string): Promise<'shared' | 'copied' | 'failed'> {
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return 'shared';
    }
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    // Cancelled by the player, or not allowed.
    return 'failed';
  }
}
