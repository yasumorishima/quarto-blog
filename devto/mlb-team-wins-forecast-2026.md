---
title: How well do player projections predict team wins? I froze MLB 2026 first, then checked
published: false
description: I summed simple Marcel-style player projections into team wins, froze the 2026 projections before the standings were read, and compared them with three naive floors.
tags: baseball, datascience, python, statistics
---

Every spring there are plenty of "how many games will each team win" projections. Most of them build a forecast for each player and add the players up by team. I had long wondered how well that actually works.

So I built one of my own and checked it against the 2026 MLB season. I froze the projections in a repository before looking at the results, so nothing could be adjusted afterwards. I have no experience inside the game; this is just an analysis of public data.

## Data and method

- **Player stats**: batting and pitching from the MLB Stats API, 2015-2026, every player
- **Rosters**: each team's **40-man roster on opening day** (including the 60-day injured list), from the same API (only what is known before the season)
- **The answer**: final standings (wins, runs scored, runs allowed) from the same API

The player forecasts are based on **Marcel**, a deliberately simple method by Tom Tango: weight the last three seasons (newer ones more), pull the result toward league average, and adjust a little for age. It is often used as the baseline other systems are compared with. The real Marcel projects each component (home runs, walks, strikeouts, ...) separately; mine is a simplified version that applies its weights, regression, playing time and age factor to wOBA and FIP directly.

1. **Batters**: wOBA relative to league average, three seasons weighted 5:4:3, regressed with 1,200 PA of league average
2. **Pitchers**: FIP relative to league average, weighted 3:2:1, regressed with 134 innings of league average
3. **Playing time**: half of last season plus a tenth of the season before, plus 200 PA for batters and 60 innings (starters) or 25 (relievers) for pitchers
4. **Team**: add up the opening-day 40-man roster into runs scored and allowed, then turn them into wins with the Pythagorean formula

For one batter it looks like this in Python (simplified; the real code also adjusts for age and makes league runs scored and allowed match):

```python
# h: the player's last three seasons, one row per season
# rel = that season's wOBA minus that season's league wOBA
w = h.season.map({y - 1: 5, y - 2: 4, y - 3: 3})
rel = (w * h.pa * h.rel).sum() / ((w * h.pa).sum() + 1200)   # pull toward league average
pa = 0.5 * pa_last + 0.1 * pa_before + 200                    # playing time
runs_above_avg = pa * rel / woba_scale                         # runs above an average hitter
```

A team's runs scored are league-average runs plus the sum of its players' runs above average; runs allowed are built the same way from the pitchers. Plate appearances and innings are scaled so each team gets 162 games' worth.

To have something to beat, I used three floors that take no work at all:

- **Every team .500**: 81 wins each
- **Last season's record**: the same winning percentage as last year
- **Last season's Pythagenpat**: last year's winning percentage implied by its runs scored and allowed (Pythagenpat is a version of the Pythagorean formula)

If adding up player forecasts is worth the effort, it should at least beat these three. The yardstick is the mean absolute error of wins over the 30 teams.

## First, the past seasons

Before 2026 I ran the same thing on the nine seasons 2016-2025 (leaving out the 60-game 2020), each projected only from the seasons before it.

![Lower error than last season's Pythagenpat in 7 of 9 past seasons](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_2_en.png)

The mean error over the nine seasons was **8.27 wins**, against 10.60 for .500, 9.67 for last season's record and 9.34 for last season's Pythagenpat. It beat the toughest floor, Pythagenpat, in 7 of 9 seasons.

These nine seasons, though, are the ones I was looking at while making design choices (for example how to handle NL pitchers batting), so they may flatter the method. Against Pythagenpat, the 95% bootstrap interval from resampling seasons only just cleared zero (upper end -0.01 to -0.05, depending on the random seed).

## Freezing 2026, then scoring it

For 2026 I wrote the projections to a file and merged it into the repository before fetching the standings. I froze them after the season had ended; the projections only use information from before opening day, and the point of freezing is to rule out adjusting the method to fit the result. The scoring rules (what to compare with, and what counts as a win) were written down first as well. At scoring time I checked that the frozen files had not changed by a byte.

![2026: lower error than the floors, but not distinguishably](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_1_en.png)

The mean error was **7.92 wins**, a little below all three floors (8.50, 8.83 and 8.71). But the 95% intervals from resampling the 30 teams cross zero for every floor (against Pythagenpat: -0.80 wins, -2.82 to +1.36). By the rule set in advance, that is "indistinguishable". With one season of 30 teams, a difference of under one win sits inside chance.

I had also prepared a version that stretches the projections away from .500 by a factor of 1.25, fitted on the past seasons. In 2026 it was slightly worse (8.16).

## Hits and misses

![Hits and misses](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_3_en.png)

The closer to the dashed line, the better. The four biggest misses:

- **MIL**: projected 84, won 103
- **TB**: projected 80, won 98
- **SF**: projected 83, won 65
- **ATH**: projected 80, won 64

The correlation of projected and actual wins was 0.48 (0.63 over the nine past seasons).

![The projections spread half as wide as the results](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_4_en.png)

The projections sit between 67 and 93 wins, while the actual records ran from 58 to 103. The standard deviation was 5.6 wins projected against 11.0 actual, about half. Marcel pulls every player toward league average, so the teams built from them are pulled toward .500 too, and many large misses are to be expected from that alone.

## Where the misses came from

A miss has two parts: the runs scored and allowed were projected wrong, or the team won more or fewer games than its runs suggest. The second part comes from things like close games and no player forecast can remove it.

So I asked how well the Pythagorean formula does **if the actual runs scored and allowed were known**.

![Even with the actual runs, a 4-win miss remains](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_5_en.png)

Even with the actual runs, the average miss is **3.94 wins**; that part is out of reach for this approach. Most of the rest came from the runs: the average gap between the projected wins and the wins implied by the actual runs was 8.06. The runs-scored projection was off by a standard deviation of 56 runs, runs allowed by 68.

The four big misses differ inside:

- **MIL**: almost all of its 19-win miss came from runs. It scored 832 against 739 projected and allowed 618 against 714.
- **TB**: 10 wins from runs, 8 from winning more than its runs suggest.
- **SF**: 11 wins from runs, 6 from winning fewer than its runs suggest (projected 83, 71 implied by its runs, won 65).
- **ATH**: runs alone account for 21 wins, partly offset by winning 5 more games than its runs suggest. It scored 699 against 786 projected and allowed 937 against 798.

### MIL, player by player

I split the biggest miss, MIL, by player: how many runs above average each was projected to add (or save), against what they did. Batters use wOBA and pitchers use FIP, converted to runs the same way.

![MIL: players it did project played above their forecasts](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_6_en.png)

The chart only includes players who were on the opening-day 40-man roster and had a projection.

- **Jacob Misiorowski (pitcher)**: projected for 93 innings and about 5 runs saved; he threw 169 innings and saved about 38. With few innings behind him, his forecast was pulled hard toward average and his innings were estimated low.
- **Jake Bauers (batter)**: projected for 344 PA at about league average; he had 574 PA and about 31 runs above average.

The projected batters together were projected for +21 runs above average and produced +71; the projected pitchers (runs saved by FIP) were projected for +44 and produced +70, from both better rates and more playing time than expected.

Still, that is +50 runs from batters and +26 from pitchers, about 40% of the team's total run gap (+93 scored, -96 allowed, roughly 190 runs). The rest is fielding and batted-ball outcomes that FIP does not see, and players without a projection: pitchers with no forecast threw 33% of MIL's innings.

### How much the unprojected players played

Still, players without a projection played quite a lot: those not on the opening-day 40-man roster, and rookies with no MLB history.

![20-30% of playing time went to players with no forecast](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_7_en.png)

In 2026 they took 20% of plate appearances and 27% of innings. The projection assumes the projected players fill that time in proportion. But the correlation between each team's miss and the WAR of its unprojected players was a weak -0.27 across the 30 teams, with no clear link to the big misses.

### Do young teams beat their projection?

MIL makes it look as if teams whose young players improve should beat their projections. Over 300 team-seasons (the nine past seasons and 2026), the correlation between the age of a team's projected batters (weighted by projected PA, relative to that season's average) and its miss was -0.01, and split into age quartiles the average miss ranged from -0.7 to +1.6 wins with no order. In this data the young teams were not systematically underrated.

## Summary

- Adding up player forecasts beat the floors over nine past seasons, but in the frozen 2026 test its mean error of 7.92 wins could not be told apart from the floors (8.50 to 8.83).
- Even with the actual runs, about 4 wins of error remain. The runs projections alone miss by about 8 wins on average, partly offset for some teams by winning more or fewer games than their runs suggest.
- In the biggest miss, MIL, projected players beating their forecasts made up about 40% of the run gap; the rest was fielding and unprojected players. Because the forecasts pull toward average, the projections cluster toward .500 and spread half as wide as the results.

What surprised me most is that a gap of under one win cannot be seen in one season. A method can win over past seasons and still not show it in a single year of scoring, so comparing projection systems probably takes several years side by side. If I change anything next, it will be how rookies and new arrivals are handled, again frozen in advance, for 2027.

## Appendix

### Terms

- **wOBA**: a batting rate that weights each outcome (walk, single, home run, ...) by its run value
- **FIP**: a pitcher's run estimate from strikeouts, walks, hit batters and home runs only, leaving out whether balls in play fall for hits
- **Marcel**: Tom Tango's simple projection: a weighted average of three seasons, regressed toward average, with an age adjustment (applied here directly to wOBA and FIP)
- **Pythagenpat**: the Pythagorean win formula with an exponent that depends on the run environment, ((runs scored + allowed) per game)^0.287

### Caveats

- No fielding, park or schedule. Runs allowed come from FIP only, so defence is not in it.
- Opening-day 40-man rosters include players on the injured list or in the minors that day, so playing time is spread over more players than actually played.
- Shohei Ohtani is listed as a pitcher on the 2018-2019 rosters, so his batting is missing from the 2019 backtest (he is a two-way player from 2020 on).
- The interval for one season of 30 teams ignores that teams share league-wide trends, so it is narrower than it should be.

### Reproducing it

Code, the frozen projections and the scoring rules are in [mlb-data-pipeline, forecast/team_wins](https://github.com/yasumorishima/mlb-data-pipeline/tree/master/forecast/team_wins).

- `fetch.py`: opening-day 40-man rosters and standings from the MLB Stats API
- `project.py`: Marcel forecasts and team wins
- `score.py`: floors and scoring
- `PREREG.md`: the scoring rules written before the answer was known
- `RESULTS.md`: the 2026 result
