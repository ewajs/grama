# Game design

The source of truth for **what the game does**. Update this file in the same
change that alters a rule, so code and spec never drift.

## Core loop (MVP)

1. A **level** shows 6+ letters arranged in a circle (the _wheel_) and a
   **board**: one row of empty tiles per expected word, grouped and sorted by
   length. The board _is_ the hint: it says "find 2 words of 3 letters, 3 of 4…".
2. The player drags across the wheel to build a word. Each letter tile can be
   used once per word. Dragging back onto the previous letter removes the last
   one (undo while dragging).
3. Lifting the finger (or mouse button) **submits** the word.
4. The submission is evaluated:

   | Result     | Condition                                  | Points | Feedback                                   |
   | ---------- | ------------------------------------------ | ------ | ------------------------------------------ |
   | `invalid`  | Not a word, or shorter than 3 letters      | 0      | Word shakes and fades                      |
   | `target`   | In the level's expected set, not yet found | high   | Word flies into its row, tiles flip in     |
   | `bonus`    | Real word, not in the expected set, new    | low    | Word flies to the bonus counter, it pulses |
   | `repeated` | Already found (target or bonus)            | 0      | The existing row / counter briefly glows   |

5. When every target is found the level is **complete**: a short celebration,
   a summary (points, bonus words found) and a "Next level" action.
6. Levels cycle: after the last level, play starts over from the first (never a
   dead end). The score keeps growing across levels.

### Scoring (tunable in `POINTS_PER_LETTER`, `src/core/evaluate.ts`)

- `target`: 10 points per letter.
- `bonus`: 2 points per letter.
- `invalid` / `repeated`: 0.

### Words and letters (Spanish first)

The game is built around **language packs** so more languages can be added and
picked by the player later. A pack is: the alphabet and normalization rules, the
level data, and the UI strings. Spanish is the only pack in the MVP.

Spanish is Rioplatense: the UI speaks with voseo ("Uní las letras") and any
cultural references or imagery are Argentine.

Spanish rules:

- Words are compared in a **normalized form**: uppercase, accents stripped
  (`Á→A`, `É→E`, `Í→I`, `Ó→O`, `Ú→U`, `Ü→U`). `Ñ` is its own letter.
- Minimum word length is 3.
- Target words are common words; bonus words come from a broader dictionary.
  Offensive words are never targets. Proper nouns and abbreviations are excluded.
- Every level has at least one target that uses **all** its letters.

### Level shape

A level is static, self-contained data (no global dictionary is shipped): the
letters on the wheel (a letter may repeat), its target words and its bonus words.
The type is `Level` in `src/core/level.ts`. A level is valid when:

- it has at least 6 letters;
- every word has 3+ letters and can be spelled with the level's letters, each used once;
- no word appears twice, across targets and bonus;
- at least one target uses every letter.

Difficulty ramps with the level number: more letters, more and longer targets.

## UX and visual direction

The reference app is functional but noisy. We aim for **calm and focused**:

- One background (soft gradient or solid), no photos, no ads, no clutter.
- One accent color; neutral tiles; high contrast letters. Light and dark themes.
- Rounded geometric sans-serif, large letters, generous spacing.
- Header: level number (left), score (right). Nothing else in MVP.
- Board in the upper half, wheel in the lower half within thumb reach.
- A single secondary action next to the wheel: **shuffle** letters.
- The word being built floats above the wheel as a pill; the drag path is a
  smooth line in the accent color.

Rough layout (portrait phone):

```
┌───────────────────────────┐
│  Nivel 12          ★ 340  │
│                           │
│        [C][A][S][A]       │
│        [ ][ ][ ][ ]       │
│      [ ][ ][ ][ ][ ]      │
│    [ ][ ][ ][ ][ ][ ]     │
│                           │
│          ( CAS )          │  ← current word pill
│         ╭───────╮         │
│     ⟳   │ S   A │  +3     │  ← shuffle · wheel · bonus count
│         │L     I│         │
│         │ C   F │         │
│         ╰───────╯         │
└───────────────────────────┘
```

Desktop: same layout, centered, max width ~480px. Mouse drag works the same;
typing on the keyboard + Enter is a later addition (see backlog in PLAN.md).

### Motion

- Fast and purposeful: 120–250 ms for feedback, springy but never bouncy-slow.
- Never block input on an animation; the next drag can start immediately.
- Respect `prefers-reduced-motion` (fade instead of move/flip).
- Light haptic tick on each letter connected where `navigator.vibrate` exists.
