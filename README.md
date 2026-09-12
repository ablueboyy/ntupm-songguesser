# Song Guesser — NTUPM 18th

A music quiz built for the NTU Pop Music Club's booth at the student club fair,
still online after it. Fifteen seconds of a song, nine titles, pick the right one.

**Play: https://ntupm18th.github.io/ntupm-songguesser/**

The interface is Traditional Chinese; the code and comments are English.

## Two modes

- **競速 (speed)** — ten questions, 12 seconds each, 10,000 max. The result
  screen tells you how many of the club you beat and what percentage of all
  players you are ahead of.
- **闖關 (stage)** — six stages, ten questions each. Clearing one is about
  score (4,000 up to 9,000) and the song pool grows as you go: Mandarin →
  Taiwanese → Western → Korean and Japanese. Fail and you restart at stage 1.

## No server

Everything is a static file. The song bank, the decoys, the preview URLs, the
crew board and the score distribution all ship with the page; scores live in
the player's own browser.

It was not always like this. There used to be a live Supabase leaderboard, and
it did not survive the game spreading online — the free tier gives 5GB of
egress a month and we were burning about 1.5GB a day, almost entirely reads.
The replacement is `crew.js`: the scores the club set before the fair opened,
frozen, plus the score distribution of 13,191 players. "You beat 23 of the
club, 89 points short of the next one" turns out to read better than a rank of
1,240 out of eight thousand, and it costs nothing to serve.

`board-config.js`, `staff.html` and `sql/` are what remains of that system. The
game no longer loads them; they are kept so the historical data stays reachable
and so the live board can be brought back if anyone wants it.

## Running it

Any static server:

```
python -m http.server 8000
# then open http://localhost:8000
# from a phone on the same Wi-Fi: http://<your-ip>:8000
```

Deployment is GitHub Pages from `main`. Push and it is live in about a minute.

## Audio

No audio files are stored here. `previews.js` holds Apple's official 30-second
preview URLs and the browser streams them directly from Apple at play time —
which is both cheaper and a great deal safer than hosting clips.

If a song has no preview the game falls back to a synthesised placeholder
melody, so a missing source is audible rather than silent.

`audio/` exists for locally supplied clips (`audio/<id>.m4a` wins over the
stream), and `tools/make-clips.ps1` cuts them. **Leave it empty unless you own
the recordings** — hosting audio is redistribution in a way that streaming
Apple's previews is not.

## Song bank

| file | what | audio needed |
| --- | --- | --- |
| `songs.js` | 390 songs that can be asked | yes |
| `decoys.js` | 605 titles used only to fill the grid | no |
| `previews.js` | preview URL per song, generated | — |

`genre` never appears on screen. It sets the per-round floor (so every speed
round has a classic, a Taiwanese track and something non-Chinese), it decides
which stage a song unlocks in, and it picks decoys — a Mandarin answer needs
Mandarin decoys or the grid is solvable by elimination.

### Adding songs

1. Add rows to `songs.js` (`id` unique and lowercase, `title` clean — no
   "(theme from ...)" subtitles).
2. `node tools/fetch-previews.js` — fills in what is missing. Review anything
   it flags as low confidence; a cover version usually matches title and
   artist perfectly and sounds nothing like the original.
3. `node tools/build-decoys.js` — rebuilds the decoy pool and drops anything
   now used as a question.
4. Open `check.html` and listen. Put the new ids in `NEW_IDS` there and the
   page defaults to that filter.

Other flags: `--force` refetches everything, `--only id1,id2` targets specific
songs, `--country JP` switches store, `--delay` slows down (the API allows
roughly 20 calls a minute).

Two recurring traps, both from the Apple store: titles come back with
subtitles attached, and Japanese titles come back romanised. Both defeat naive
duplicate checks, so a song already in the bank can slip into the decoy pool.

## Tuning

`CONFIG` at the top of the script in `index.html` holds the round: question
count, seconds, base and speed points, per-genre floor, reveal pause.

`STAGES` holds the stage table — threshold, genres, and what each stage
unlocks. `TITLES` holds the end-of-round titles; edit the table and nothing
below cares. The last row must have `min: 0`.

## crew.js

Real data. `CREW` is every device that played on the two days before the fair
opened to the public — that was the club — best score per device, nicknames
untouched. `SCORE_DIST` is the distribution of best scores across 13,191
players in 250-point buckets.

**Forking this? Replace `CREW` with your own people.** Those are real
nicknames belonging to real members.

## Files

```
index.html              the game (HTML, CSS and JS in one file)
crew.js                 crew board and score distribution
songs.js                song bank, hand-maintained
decoys.js               decoy titles, generated
previews.js             preview URLs, generated
check.html              audio check bench, internal
staff.html              console for the old leaderboard data
board-config.js         Supabase settings for that old leaderboard
assets/theme.webp       background (82KB; theme.png is the 1MB master)
audio/                  optional local clips, empty by default
tools/                  generators for previews and decoys
sql/                    schema and prune script for the old leaderboard
```

`previews.js` and `decoys.js` are generated — single entries can be corrected
by hand (the scripts do not overwrite existing values), but do not rewrite them
wholesale.

## Licence

MIT, see `LICENSE`. It covers the source only, not the songs and not the
nicknames in `crew.js`.
