/**
 * Sound effects, synthesized with the Web Audio API: nothing to download, and quiet by
 * design.
 * @module
 */

/** What a sound is for. */
export type SoundKind = 'letter' | 'target' | 'bonus' | 'invalid' | 'complete';

/** One note: its pitch, when it starts (seconds from now) and how long it rings. */
export type Note = { frequency: number; at: number; duration: number };

/** How loud every sound is, from 0 to 1: a soft background to the game, not the point. */
export const VOLUME = 0.12;

// A pentatonic scale from C5: any run of its notes sounds pleasant.
const SCALE = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98];

/**
 * The notes of a sound. A letter's tick rises with each letter of the word (`step`, from
 * 1), so spelling a long word climbs a scale.
 */
export function notesOf(kind: SoundKind, step = 1): Note[] {
  switch (kind) {
    case 'letter':
      return [
        { frequency: SCALE[Math.min(step, SCALE.length) - 1] ?? 523.25, at: 0, duration: 0.08 },
      ];
    case 'target':
      return [
        { frequency: 783.99, at: 0, duration: 0.18 },
        { frequency: 1046.5, at: 0.08, duration: 0.3 },
      ];
    case 'bonus':
      return [{ frequency: 1318.51, at: 0, duration: 0.2 }];
    case 'invalid':
      return [
        { frequency: 220, at: 0, duration: 0.12 },
        { frequency: 196, at: 0.08, duration: 0.16 },
      ];
    case 'complete':
      return [523.25, 659.25, 783.99, 1046.5].map((frequency, index) => ({
        frequency,
        at: index * 0.09,
        duration: index === 3 ? 0.6 : 0.25,
      }));
  }
}

let context: AudioContext | null = null;

/** The audio context, made on first use (browsers allow it during a tap or key press). */
function audio(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null;
  if (!context) {
    // Safari: "ambient" mixes with the player's music and stays quiet in silent mode.
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) session.type = 'ambient';
    context = new AudioContext();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

/** Plays a sound (see {@link notesOf}); silently does nothing where audio can't play. */
export function play(kind: SoundKind, step?: number): void {
  const ctx = audio();
  if (!ctx) return;
  for (const { frequency, at, duration } of notesOf(kind, step)) {
    const start = ctx.currentTime + at;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = kind === 'invalid' ? 'sine' : 'triangle';
    oscillator.frequency.value = frequency;
    // A quick rise and a soft decay: a pluck, never a click.
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(VOLUME, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }
}
