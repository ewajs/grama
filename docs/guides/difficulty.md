---
title: Difficulty
group: Guides
---

# Difficulty

A level has a **size** (letters on the wheel, number of targets), which grows with
progress, and a **tier** (easy, medium, hard, extra hard), which alternates in a rhythm.
They're independent: the tier only changes _which words_ are the targets. The numbers
here come from calibrating on generated levels (D16).

## Size grows with progress

{@link "core/generate"!SIZES | SIZES}, read by {@link "core/generate"!levelShape | levelShape}:

| From level | Letters | Max targets | Shortest target |
| ---------- | ------- | ----------- | --------------- |
| 1          | 6       | 6           | 3               |
| 6          | 6       | 7           | 3               |
| 16         | 7       | 8           | 3               |
| 41         | 8       | 9           | 4               |

Every level has at least {@link "core/generate"!MIN_TARGETS | MIN_TARGETS} targets.

## Scoring a level

{@link "core/difficulty"!levelScore | levelScore}: for each target, the order of magnitude of its rank
plus a bit for length, averaged; then a little off for bigger wheels, where long words
come naturally.

```
score = mean over targets of [ log10(rank + 1) + 0.25 × (length − 3) ]
        − 0.25 × (letters − 6)
```

A level of everyday short words (ranks in the hundreds) scores around 2.5; one of rare,
long words (ranks in the thousands) around 4.

## Tiers

{@link "core/difficulty"!classify | classify} cuts the score at {@link "core/difficulty"!TIER_STARTS | TIER_STARTS}:

| Tier | Score from | Recipe ({@link "core/difficulty"!RECIPES | RECIPES}) | Median score of the recipe |
| ---------- | ---------- | ------------------------------------------ | -------------------------- |
| easy | — | top 1,500 words, most common first | 2.49 |
| medium | 2.75 | top 3,000, longest first | 2.98 |
| hard | 3.25 | top 8,000, longest first | 3.51 |
| extra hard | 3.75 | top 20,000, longest first | 4.00 |

The cut-offs sit between the recipes' medians, so a recipe usually lands in its tier;
the generator checks and retries until it does.

## Choosing seeds without repeats

The seed word gives the level its letters. Seeds are chosen so that nearby levels never
share letters:

1. **Bands.** Each tier draws seeds from its own band of ranks: easy from the top 1,500,
   medium from 1,500–3,000, hard from 3,000–8,000, extra hard from 8,000–20,000.
2. **One per letter set.** Anagrams make the same level, so each set of letters appears
   once, in the lowest band that has it.
3. **A fixed order.** Each band is shuffled once (seeded by tier and size), the same on
   every device.
4. **Blocks.** Levels of the same tier and size take consecutive blocks of
   {@link "core/generate"!SEED_BLOCK | SEED_BLOCK} seeds in that order. The player's progress
   counts the levels actually played of each tier and size
   ({@link "core/cadence"!Occurrences | Occurrences}), so the next one takes the next block even after
   a change of difficulty; a level's block is saved in its record, for replays.
   {@link "core/cadence"!occurrence | occurrence} gives the block when every earlier level was played at
   one difficulty, which is what `?nivel=N` opens.
5. **Within its block**, a level takes the first seed whose level lands in its tier. If
   none does, it tries up to {@link "core/generate"!FAR_TRIES | FAR_TRIES} seeds from the far side
   of the order (last used about half a cycle ago), then settles for the first workable
   one. A seed is only workable with enough targets and at least
   {@link "core/history"!THREE_STAR_BONUS | THREE_STAR_BONUS} bonus words, so every level can earn ★★★.

Over 600 levels every level lands in its tier, and the closest repeat is 88 levels
apart. Generation takes a few milliseconds: each word's letters are precomputed as a
bitmask, so most words are rejected with one comparison before the full spelling check.

## The rhythm

{@link "core/cadence"!tierFor | tierFor}:

| Position in cycle | 1    | 2      | 3      | 4    | 5    | 6      | 7          |
| ----------------- | ---- | ------ | ------ | ---- | ---- | ------ | ---------- |
| Tier              | easy | medium | medium | hard | easy | medium | extra hard |

- No extra hard before level {@link "core/cadence"!FIRST_EXTRA | FIRST_EXTRA} (it's hard instead).
- From level {@link "core/cadence"!HARDER_FROM | HARDER_FROM}, the middle easy becomes medium; the easy
  after an extra hard stays.
- The player's setting shifts every tier one step: relaxed easier (and never extra hard),
  challenging harder. The setting in force when a level starts is stored with it, so
  changing it never regenerates the level in play.

## Rewards

- Points ×1.5 on hard, ×2 on extra hard ({@link "core/evaluate"!TIER_MULTIPLIER | TIER_MULTIPLIER}).
- A hint for finishing an extra-hard level, the first time only
  ({@link "core/hints"!EXTRA_HARD_HINTS | EXTRA_HARD_HINTS}).

## The daily challenge

{@link "core/daily"!generateDaily | generateDaily}: always {@link "core/daily"!DAILY_SHAPE | DAILY_SHAPE} (7 letters, up to 8
targets), the tier from the weekday ({@link "core/daily"!DAILY_TIERS | DAILY_TIERS}). Dailies count
their own blocks per tier ({@link "core/daily"!dailyOccurrence | dailyOccurrence}) and take them from the
_end_ of the tier's order backwards, while main levels start at the beginning: a daily
doesn't repeat another for about seven months, nor a main level for longer. That's the
word list's limit: easy and medium have only about 220 workable 7-letter seeds each, and
each takes two dailies a week.

## Recalibrating

If the word lists change a lot, or the tiers stop feeling right:

1. Generate a few hundred levels per recipe and look at the score distribution (the real-
   data tests in `src/content/es/words.test.ts` are a starting point).
2. Move {@link "core/difficulty"!TIER_STARTS | TIER_STARTS} to sit between the recipes' medians, or
   change the recipes.
3. Check the tests: levels valid in every size and tier, more than 98% landing in their
   tier, no repeat within 50 levels.
4. Record the new numbers in D16, and bump
   {@link "core/generate"!LEVELS_VERSION | LEVELS_VERSION} (the golden test asks for it).
