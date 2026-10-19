/** Vibration patterns in milliseconds (vibrate, pause, vibrate…). Subtle by design. */
export const HAPTICS: Record<'letter' | 'target' | 'bonus' | 'invalid', VibratePattern> = {
  /** A letter joins the word. */
  letter: 8,
  /** A target word found. */
  target: [12, 50, 18],
  /** A bonus word found. */
  bonus: [10, 40, 10],
  /** Not a word. */
  invalid: 35,
};

/** Whether this device can vibrate (Android browsers can; iOS Safari can't). */
export const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

/** Vibrates with one of the {@link HAPTICS} patterns, if the device can. */
export function vibrate(kind: keyof typeof HAPTICS): void {
  if (canVibrate) navigator.vibrate(HAPTICS[kind]);
}
