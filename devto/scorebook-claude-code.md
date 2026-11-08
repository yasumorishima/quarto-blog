---
title: Reading Paper Baseball Scorebooks with Claude Code, and Checking Them with Arithmetic
published: true
description: How an amateur baseball team turns photos of handwritten scorebooks into per-game stats with Claude Code, why plate appearances = outs + runs + left on base catches misreads, and the notation guide and code I opened up.
tags: baseball, claude, opencv, python
---

The amateur baseball team I play for posts per-game stats on its website. The source is the paper scorebook kept during the game. Typing it in by hand after every game takes time, and it is easy to misread a mark. I wondered whether the photos could be read instead, and after trying a few things, Claude Code (model: Claude Opus 5.5) now reads the photos, checks them with arithmetic, and saves the stats.

I opened up the procedure, a guide to the marks, and the code, in case they help anyone else who keeps or tallies scorebooks. I am not a scoring expert; this is what I learned reading my own team's books. The scorebooks here use the Japanese scoring system.

## The overall flow

![From photos to saved stats](https://raw.githubusercontent.com/yasumorishima/baseball-scorebook-ocr-docs/main/images/blog/en/fig-flow.png)

A game has two sheets: one with our batting and one with theirs. Our batting stats come from our sheet. Our pitchers' stats (hits, strikeouts and walks allowed) are written as the opponent's batting, so they come from the opponent's sheet.

The scorekeeper only pastes the photos with a one-line request such as "add the result for <date>", and answers the few questions the paper cannot settle. Claude Code does the rest: read, check, save, and look at the site.

## One cell is split into four zones, one per base

![How to read one cell](https://raw.githubusercontent.com/yasumorishima/baseball-scorebook-ocr-docs/main/images/blog/en/fig-cell.png)

Each cell, where a lineup row meets an inning column, is one plate appearance. A small diamond is printed in the middle, and the four zones around it stand for the bases. The batter's result goes bottom right (first base); the top right, top left and bottom left (second, third, home) say how the runner got to that base.

For example, `/8` bottom right is a hit to center, `6-3` is a groundout from short to first, and `B` is a walk. `(5)` in the second-base zone means "reached second during the No. 5 hitter's plate appearance", and `S` means a stolen base. The roman numeral in the middle is the out number in the inning, written in the cell of the player who was out, even when a batter reached base and was put out later as a runner.

Different scorekeepers write very differently. One writes the third out as IV or II; one skips the third out when a runner made it; one writes hits in red; one, when the team bats around and the inning's column runs out, carries on in the next column and renumbers the printed inning headers by hand. I collected what I met while transcribing 33 sheets cell by cell in a [notation guide](https://github.com/yasumorishima/baseball-scorebook-ocr-docs/blob/main/notation.md) (Japanese).

## Plate appearances = outs + runs + left on base, exactly

![Plate appearances equal outs plus runs plus left on base](https://raw.githubusercontent.com/yasumorishima/baseball-scorebook-ocr-docs/main/images/blog/en/fig-check.png)

Every plate appearance ends in exactly one of three ways: an out, a run, or stranded on base when the inning ends. (When an inning ends on a runner's out or when time runs out, the batter who was still at the plate does not get a plate appearance.) A batter who reached base and was later caught stealing or forced out counts as an out. So, per inning and per game, plate appearances equal outs + runs + left on base.

The figure is a recent 6-inning game, called for time with two out in the bottom of the 6th. We had 28 plate appearances: 18 outs, 5 runs, 5 left on base. They had 25: 17 outs, 1 run, 7 left on base. In a game cut short, the outs are not 3 × innings, so you match against the outs you actually counted.

The check is simply sorting each plate appearance by how it ended and counting.

```python
# Plate appearances as read: (inning, lineup slot, how it ended), ending is "out" / "run" / "lob"
pas = [(1, 1, "out"), (1, 2, "out"), (1, 3, "lob"), (1, 4, "out"),
       (2, 5, "out"), (2, 6, "lob")]   # in practice, every PA in the game

from collections import Counter
for inning in sorted({p[0] for p in pas}):
    c = Counter(end for i, _, end in pas if i == inning)
    print(inning, "PA", sum(c.values()), "= outs", c["out"], "+ runs", c["run"], "+ LOB", c["lob"])
```

I keep reading until this and the other checks agree: the line score adds up to the final score, the pitchers' runs allowed add up to the opponent's runs, and so on. In this game, the out number in the 5th-inning cell of the leadoff batter looked like III on the whole photo. Zoomed in, it was a II with serifs. Had it been III, the inning would have ended with him, and the No. 5 hitter's groundout later in the inning would have been a fourth out. When the shape of a mark is in doubt, arithmetic like this decides.

The rest of the checks, and how to settle what the paper cannot (two players with the same surname, the inning a pitcher was replaced, innings pitched in a game called for time), are in the [stats guide](https://github.com/yasumorishima/baseball-scorebook-ocr-docs/blob/main/stats-from-scorebook.md) (Japanese).

## Over 90% per cell, but the line score is fully right on 25 of 33 sheets

![Per-cell accuracy is high, but the whole line score is right on 25 of 33 sheets](https://raw.githubusercontent.com/yasumorishima/baseball-scorebook-ocr-docs/main/images/blog/en/fig-accuracy.png)

This figure is why the checks and the scorekeeper's confirmation stay in the loop. I built a tool that reads the photos automatically ([baseball-scorebook-reader](https://github.com/yasumorishima/baseball-scorebook-reader)) and measured it on 33 sheets that have reference transcriptions. It finds the grid with OpenCV, cuts out each inning column, asks Claude about each column (is there a plate appearance in each cell, what was the result, did the batter score), and assembles a batting line for each lineup slot.

Per cell, "did the batter score" matched the transcription 99% of the time (913/923) and the plate-appearance result 91% (859/941). But one sheet has about 30 plate appearances, so a few misread cells are enough to throw off the line score. The whole line score matched on 25 of the 33 sheets.

When the same photo is read twice, the cells where the two reads disagree are wrong 61% of the time (versus 6% where they agree). The tool shows those cells as "please check".

## Given nothing, Claude matched my CV pipeline fed the true facts

![Claude given nothing matched the classic computer-vision pipeline given the true facts](https://raw.githubusercontent.com/yasumorishima/baseball-scorebook-ocr-docs/main/images/blog/en/fig-methods.png)

Before Claude, I built a reader that uses no generative AI, on a Raspberry Pi 5. It subtracts a blank form to isolate the pencil, reads the marks in each base zone by their distance to templates, and solves them together with baseball rules: a runner's advance number can only be a batter who came up after him, one runner per base, no passing.

On the 396 base-zone marks of the 33 sheets (such as the lineup number of the batter during whose plate appearance the runner advanced), the classic pipeline got 71% (283/396) with nothing given, and 92% (366/396) when given all the true facts (plate appearances, reaches and out numbers). Claude, given no examples and no answers for this comparison, got 93% (370/396). That run took 429 calls and cost about 3.8 US dollars.

The reference transcriptions were originally made with Claude's help, so if both made the same misreading, agreement would be inflated. I therefore cut out 47 marks from the original photos, zoomed in and checked them, including the 21 where only Claude and the transcription agreed. All 21 matched what is written on the paper. The check also found 4 misreadings in the transcriptions.

In case it helps anyone reading the notation or the solver, that code is open too ([cv/](https://github.com/yasumorishima/baseball-scorebook-reader/tree/main/cv)).

## How I do it in Claude Code

After each game I don't run the tool; I have Claude read the photos in a Claude Code session.

### The steps live in a skill

Claude Code lets you write a fixed procedure down as a "skill". Recording a game result is a skill, so every game goes in the same order without skipping anything: look up the opponent and venue from the schedule, then the result and line score, the scorebook images, batting and pitching stats, the checks and read-back, and finally the site. Once the session saved only the result and forgot the individual stats. Since then a hook (a check that runs automatically at a set point) stops the session from finishing if images were uploaded but no stats were saved. I also published a [skill template](https://github.com/yasumorishima/baseball-scorebook-ocr-docs/blob/main/claude-code/scorebook-stats/SKILL.md) (Japanese) that any team can adapt.

### Zoom in before reading

On the whole photo, small marks get misread. The photo is turned to landscape, and the lineup column and each inning column are cut out and enlarged 2–4× before Claude reads them.

```python
from PIL import Image

im = Image.open("sheet.jpg").rotate(-90, expand=True)   # portrait photo -> landscape
col = im.crop((1150, 400, 1400, 1760))                   # just the 5th-inning column
col.resize((col.width * 2, col.height * 2), Image.LANCZOS).save("inning5.png")
```

### Show a table, then write

The readings go to the scorekeeper as a table. Only what the paper cannot settle, such as which of two players with the same surname it was, is asked through Claude Code's question prompt. After the go-ahead, the result, batting and pitching are written in one SQL statement, and the totals are read back and compared with the checks.

```sql
select sum(plate_appearances) as pa, sum(at_bats) as ab, sum(hits) as h,
       sum(walks_hbp) as bb, sum(strikeouts) as k
from game_player_batting where game_id = '<the game just saved>';
-- pa = 28, ab = 21, h = 3, bb = 7, k = 7 ... same as the checks?
```

The database key is not on the PC that runs Claude Code. It sits on a small server at home, and the scripts run there.

### Corrections become rules

When the scorekeeper corrects something, the rule goes into Claude Code's memory and the repository's instructions file (CLAUDE.md). This time, for example, I followed the official rule that a starter must pitch five innings to get the win, and gave the win to the reliever. The scorekeeper corrected me: "it's amateur ball, we don't use that minimum; the win goes to the starter." It is now written down as a team rule.

## What I opened up

- [Notation guide](https://github.com/yasumorishima/baseball-scorebook-ocr-docs/blob/main/notation.md) (Japanese): how to read a cell, how results and advances are written, and how scorekeepers differ
- [Stats guide](https://github.com/yasumorishima/baseball-scorebook-ocr-docs/blob/main/stats-from-scorebook.md) (Japanese): the flow, the checks, how to settle what the paper cannot, the data model
- [Claude Code skill template](https://github.com/yasumorishima/baseball-scorebook-ocr-docs/blob/main/claude-code/scorebook-stats/SKILL.md) (Japanese): edit the team rules and use it
- [baseball-scorebook-reader](https://github.com/yasumorishima/baseball-scorebook-reader): the Claude-based reader (`scorebook/`) and the reader without generative AI (`cv/`), MIT licensed

Player names in the transcriptions, the scorebook images, the actual stats and the database key are not public.

## Summary

Within what I measured:

- Plate appearances equal outs + runs + left on base, exactly, which makes it a strong way to catch misreadings
- Read automatically, cells are over 90% right, but the whole line score is right on 25 of 33 sheets, so the checks and the scorekeeper's confirmation are still needed
- On base-zone marks, Claude given nothing read 93%, about the same as the CV pipeline I spent a long time on, given the true facts (92%)

Many teams still keep paper scorebooks. I would be glad if these reading tips and checks save someone a little time.

## Appendix

**Terms**

- Plate appearance (PA): each time a batter comes to the plate. At-bats are PA minus walks, hit-by-pitches, sacrifices and similar
- Left on base (LOB): runners stranded when the inning ends
- Zone: one of the four quarters of a cell. Bottom right = first, top right = second, top left = third, bottom left = home

**Conditions and caveats**

- One printed form, written by a few scorekeepers of one team. Other forms and habits will give different results
- The tool's numbers are on the 33 development sheets (October 2026). Claude was given no examples or answers when reading, but the tool's design (how to crop, what to ask) was decided while looking at these 33 sheets
- The transcriptions were made with Claude's help; 47 marks were checked against the original photos
- The agree/disagree numbers come from reading the same photo a second time, and they move a little from run to run (line score 25 → 26 sheets)
