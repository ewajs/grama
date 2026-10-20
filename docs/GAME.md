# Game design

The source of truth for **what the game does**. Update this file in the same
change that alters a rule, so code and spec never drift.

## Core loop (MVP)

1. A **level** shows 6+ letters arranged in a circle (the _wheel_) and a
   **board**: one row of empty tiles per expected word, sorted by length and then
   alphabetically. The board _is_ the hint: it says "find 2 words of 3 letters, 3 of
   4…", and each word has its own row, so where a found word lands hints at its
   neighbors.
2. The player drags across the wheel to build a word. Each letter tile can be
   used once per word. Dragging back onto the previous letter removes the last
   one (undo while dragging).
3. Lifting the finger (or mouse button) **submits** the word. Letting go with a single
   letter selected cancels silently, and so does a drag the system interrupts (an edge
   swipe, a call). Two other ways to spell:
   - **Tap** letters one by one: the word waits in the pill, with a check; tapping the
     pill submits it. Tapping the last letter again takes it back; tapping the wheel
     between letters starts over. Shuffling drops a waiting word.
   - **Type** on a keyboard (accents ignored, `Ñ` included): Enter submits, Backspace
     takes back the last letter, Escape clears.
4. The submission is evaluated:

   | Result     | Condition                                  | Points | Feedback                                   |
   | ---------- | ------------------------------------------ | ------ | ------------------------------------------ |
   | `invalid`  | Not a word, or shorter than 3 letters      | 0      | Shakes red in place, fades                 |
   | `target`   | In the level's expected set, not yet found | high   | Its letters fly from the pill into its row |
   | `bonus`    | Real word, not in the expected set, new    | low    | Pops amber in place; the counter pulses    |
   | `repeated` | Already found (target or bonus)            | 0      | Fades grey; its row or the counter glows   |

5. When every target is found the level is **complete**: a short celebration,
   a summary (points, bonus words found) and a "Next level" action.
6. Levels never run out: level N is generated on the device from the word list, and
   is the same for everyone who played at the same difficulty (D11, D16). Changing the
   difficulty never brings back a level already played. The score keeps growing across
   levels. `?nivel=N` in the URL opens level N directly, for playtesting.

### Scoring (tunable in `POINTS_PER_LETTER`, `src/core/evaluate.ts`)

- `target`: 10 points per letter.
- `bonus`: 2 points per letter.
- `invalid` / `repeated`: 0.
- Hard levels multiply points by 1.5 and extra-hard ones by 2 (`TIER_MULTIPLIER`);
  finishing an extra-hard level also earns a hint.

### Stars and history (`src/core/history.ts`)

Each completed level is recorded with its tier, hints used, bonus words found and stars:
**★★★** with no hints and at least 3 bonus words, **★★** with at most one hint, **★**
otherwise. Replaying a level keeps the best of every play (most stars, fewest hints, most
bonus words), so stats and achievements never go down.

Finishing a level shows its stars landing one by one, then the points counting up, the
bonus words and hints won (none isn't mentioned) and, short of three stars, what was
missing ("Para 3 estrellas: sin pistas y 1 palabra extra más").

The **map** shows every level reached, by tier, with its stars; tapping an earlier level
replays it as it was generated. A replay only counts for better stars: it pays no points,
no progress toward hints and no extra-hard hint (the level already paid once), and never
changes the current level.

### Daily challenge (`src/core/daily.ts`)

One level per date (the player's own), the same for everyone: 7 letters, up to 8 targets, and a
difficulty by weekday (Monday–Tuesday easy, Wednesday–Thursday medium, Friday–Saturday
hard, Sunday extra hard). It's saved as it's played; completing it records the date and
keeps a **streak** of consecutive days, alive until the day without one ends. Every 7
days in a row earn a **streak freeze** (one held at a time, shown as ❄️ on Home): a
missed day spends it and the streak holds; two missed days in a row, or one without a
freeze, end it (`streakOf`). The result
can be shared: "Grama #3 · Miércoles · Media / ★★☆ · 1 pista · 🔥 3". Points and hints are
shared with the main game; it never moves the current level.

### Contrarreloj (`src/core/time-trial.ts`, D19)

A timed mode, apart from the main game. A run starts with 60 seconds; a target adds 3,
a bonus word 1, and finishing a wheel's board adds 10 and brings the next wheel, harder
as the run goes (`RAMP`: 6 easy letters with 5 targets first, up to 8 hard letters with
6). **Pasar** skips to a new wheel for 10 seconds, unless that would end the run; there
are no hints. The run ends at zero, and its score is its points (as in levels).

Every run gets a random seed, so its wheels are new. The clock stops while the app is
hidden; leaving the screen drops the run. Runs never touch the main score, hints, stars
or level: they keep their own record (runs played, best run, most wheels), saved apart
(`storage/trials`), which feeds three achievements. Their words do go into Tu diccionario.

### Achievements (`src/core/achievements.ts`)

25 achievements, each a stat reaching a goal (levels, stars, extra-hard levels, words,
bonus words, Tu diccionario, levels without hints, dailies and streaks, Contrarreloj). Dailies count like levels for
stars, words, hints and tiers, but not toward the number of levels completed. Stats only
grow; "hints used" counts every hint ever spent. A toast announces each achievement as
it's earned; the Logros screen lists them with progress and the player's stats.

### Definitions

Any found word can be looked up: tap its row on the board, a bonus word in the bonus
list, a word in the level-complete recap or in Tu diccionario, for a link to the RAE
dictionary.

### Tu diccionario (`src/core/dictionary.ts`, D24)

Every word the player finds, target or bonus, on a level, a replay, a daily or a
Contrarreloj run, goes into **Tu diccionario**, once. Its screen (from Home) lists them in
alphabetical order (`Ñ` after `N`), grouped by letter, with a row of letters to jump to
and a search by how a word starts; tapping one offers its definition. Finishing a level,
or a Contrarreloj run, says how many words were new ("+3 en tu diccionario"); the Logros
screen counts them, with three achievements (100, 500 and 2000 words). It's saved apart
from the progress, so starting over keeps it.

### Hints (tunable in `src/core/hints.ts`)

- A new game starts with **3 hints**; every **5 bonus words** found earn one more. Hints
  carry over between levels. The bonus counter's ring shows progress to the next one.
- A hint reveals the next letter of a target: the one showing the fewest letters, the
  shortest on a tie, so hints spread over the board. Revealed letters show outlined.
- A hint never reveals a word's last letter: the player still spells it, for full points.

### Words and letters (Spanish first)

The game is built around **language packs** so more languages can be added and
picked by the player later. A pack is: the normalization rules, the word lists, and
the UI strings. Spanish is the only pack in the MVP.

Spanish is Rioplatense: the UI speaks with voseo ("Uní las letras") and any
cultural references or imagery are Argentine.

Spanish rules:

- Words are compared in a **normalized form**: uppercase, accents stripped
  (`Á→A`, `É→E`, `Í→I`, `Ó→O`, `Ú→U`, `Ü→U`). `Ñ` is its own letter. The wheel
  shows plain letters; found words are shown as written, with accents (its most
  frequent spelling: `TENÉS`, `ÁRBOL`).
- Minimum word length is 3.
- Valid words are the dictionary's (with generated voseo forms) plus our Argentine list,
  `src/content/es/argentina.txt` (D12, D14). The frequency list only ranks them.
- Targets are among the most frequent valid words: the top 1,500 for easy levels, up to
  the top 20,000 for extra hard (see Difficulty); every word on the Argentine list ranks
  within the top 2,500, so all of them can be targets. Offensive words
  (`scripts/blocklist-es.txt`) are never targets.
- Every level has at least one target that uses **all** its letters.

### Level shape

A level is the letters on the wheel (a letter may repeat), its target words and its
bonus words: the type `Level` in `src/core/level.ts`. `generateLevel` in
`src/core/generate.ts` builds level N: its letters are a common word's, shuffled; the
words they spell that the level's tier picks (that one included, up to the size's
maximum) are the targets; every other valid word they spell is a bonus word. A level is valid when:

- it has at least 6 letters;
- every word has 3+ letters and can be spelled with the level's letters, each used once;
- no word appears twice, across targets and bonus;
- at least one target uses every letter.

Generated levels also have at least 3 bonus words, so every level can earn ★★★.

Size grows with the level number (`SIZES` in `src/core/generate.ts`): 6 letters at
first, 7 from level 16 and 8 from level 41, with 6 to 9 targets and, from 8 letters on,
no 3-letter targets.

### Difficulty

Every level is **easy, medium, hard or extra hard**, scored from how rare and long its
targets are (D16). Tiers follow a 7-level rhythm (easy, medium, medium, hard, easy,
medium, extra hard), with an easy level after each extra hard, no extra hard before level
15, and a harder mix from level 50. A badge under the level number always shows the
current level's tier.

The player picks **Relajada** (one tier easier, never extra hard), **Normal** or
**Desafiante** (one tier harder) in the menu; it applies from the next level.

## UX and visual direction

The reference app is functional but noisy. We aim for **calm and focused**:

- One background (soft gradient or solid), no photos, no ads, no clutter.
- One accent color; neutral tiles; high contrast letters.
- Four color themes, picked in the menu (**Tema**): Grama (indigo, the default), Argento
  (the flag's light blue and the sun of May), Yerba (mate green) and Quebrada
  (terracotta, turquoise bonus). Each has a light and a dark mode; the mode (**Modo**)
  follows the device unless the player picks Claro or Oscuro. Every theme passes WCAG AA.
- Rounded geometric sans-serif, large letters, generous spacing.
- Header: back to home and the level number with its tier badge (left); score and the
  menu (right).
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

Wide screens (a phone on its side, a tablet or computer in landscape) put the board on
the left and the wheel on the right, as big as the height allows; an upright tablet gets
a wider column with a bigger board and wheel. Mouse drag works the same, and so does
typing. The installed app stays upright on Android; iPhones and browsers turn freely.

The installed app has shortcuts on its icon (long-press, or right-click on a computer):
Desafío del día, Contrarreloj and Tu diccionario (`?ir=`, `app/shortcuts`).

### Motion

- Fast and purposeful: 120–250 ms for feedback, springy but never bouncy-slow.
- Never block input on an animation; the next drag can start immediately.
- Respect `prefers-reduced-motion` (fade instead of move/flip).
- Light haptic tick on each letter connected where `navigator.vibrate` exists.

### Sound (`src/ui/lib/sound.ts`)

Soft synthesized sounds (Web Audio, nothing to download), on unless turned off in the
menu ("Sonido"): a tick per letter that climbs a scale as the word grows, a chime for a
target, a light note for a bonus word, a low soft tone for a word that isn't valid, and
an arpeggio with the confetti when a level is done. Repeated words are silent. On
iPhone they mix with the player's music and stay quiet in silent mode.
