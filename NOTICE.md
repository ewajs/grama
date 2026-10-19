# Third-party notices

Grama's code is MIT-licensed (see `LICENSE`). These data files are not; each keeps the
license of its source and carries the same notice in its header.

## Spanish dictionary — `src/content/es/dictionary.txt`

Derived from the **RLA-ES Spanish (Argentina) dictionary** v2.9, © Santiago Bosio and the
RLA-ES contributors, https://github.com/sbosio/rla-es. Used under the
[Mozilla Public License 2.0](https://www.mozilla.org/MPL/2.0/) (chosen from the
GPLv3+/LGPLv3+/MPL-1.1+ options it is offered under). Modified: affixes expanded into
full words, filtered to 3–8 letters, normalized (uppercase, accents removed). Its source
is the original dictionary plus `scripts/prepare-words.ts` in this repository.

## Spanish word frequencies — `src/content/es/frequency.txt`

Derived from **wordfreq** 3.2 by Robyn Speer, https://github.com/rspeer/wordfreq, which
includes data from Google Books Ngrams, OpenSubtitles 2018 (opensubtitles.org), Wikipedia,
ParaCrawl and the Leeds Internet Corpus. Modified: filtered, normalized and converted to a
ranked list. This file is licensed under
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
