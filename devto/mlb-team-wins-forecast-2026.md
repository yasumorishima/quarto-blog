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

## Over nine past seasons, it beat last season's Pythagenpat in seven

Before 2026 I ran the same thing on the nine seasons 2016-2025 (leaving out the 60-game 2020), projecting each season only from the seasons before it and taking the mean error over its 30 teams.

![Lower error than last season's Pythagenpat in 7 of 9 seasons](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_2_en.png)

The average over the nine seasons was **8.27 wins**, against 10.60 for .500, 9.67 for last season's record and 9.34 for last season's Pythagenpat. It beat the toughest floor, Pythagenpat, in 7 of 9 seasons (not in 2019 or 2025).

These nine seasons, though, are the ones I was looking at while making design choices, so they may flatter the method. Against Pythagenpat, the 95% bootstrap interval (resampling seasons) only just cleared zero, with an upper end of -0.01 to -0.05 depending on the random seed.

## In 2026 it was slightly better than the floors, but not distinguishably

For 2026 I wrote the projections to a file and merged them into the repository, together with the scoring rules, before fetching the standings. I froze them after the season had ended, but the projections only use information from before opening day; the point is that the method cannot be adjusted to fit the result. At scoring time I checked that the frozen files had not changed by a byte.

![2026: lower error than the floors, but not distinguishably](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_1_en.png)

The mean error was **7.92 wins**, a little below all three floors. But the 95% intervals from resampling the 30 teams cross zero for every floor (against Pythagenpat: -0.80 wins, -2.82 to +1.36). By the rule set in advance, that is "indistinguishable".

A version that stretches the projections away from .500 by a factor of 1.25 (fitted on the past seasons) did slightly worse in 2026, at 8.16.

## The big misses were MIL, TB, SF and ATH

![The big misses were MIL, TB, SF and ATH](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_3_en.png)

Projected wins across, actual wins up; the closer to the dashed line, the better. MIL was projected for 84 and won 103, TB 80 and 98, SF 83 and 65, ATH 80 and 64. The correlation of projected and actual wins was 0.48 (0.63 over the nine past seasons).

## The projections spread half as wide as the results

![The projections spread half as wide as the results](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_4_en.png)

The 30 projected and actual win totals on one line: the projections sit between 67 and 93 wins, while the actual records ran from 58 to 103. Marcel pulls every player toward league average, so the teams built from them are pulled toward .500 too.

## Even with the actual runs, about 4 wins of error remain

A miss splits into two parts: the runs scored and allowed were projected wrong, or the team won more or fewer games than its runs suggest. The second part comes from things like close games, and no player forecast can remove it. So I asked how well the Pythagorean formula does if the actual runs scored and allowed were known.

![Even with the actual runs, about 4 wins of error remain](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_5_en.png)

With the actual runs, the average miss is still **3.94 wins**. The gap between the projected wins and the wins implied by the actual runs, which is the runs projection being off, averages 8.06 (runs scored were off by a standard deviation of 56, runs allowed by 68).

## What the miss is made of differs by team

For the four big misses, I split the miss into those two parts. Blue is the runs projection (projected wins minus wins implied by actual runs), gray is record versus runs (wins implied by actual runs minus actual wins); together they make the miss.

![What the miss is made of differs by team](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_8_en.png)

Almost all of MIL's 19-win miss came from runs. TB's 10 wins from runs were topped up by 8 wins of beating its runs. ATH's runs projection was off by 21 wins, but it won 5 more than its runs suggest, shrinking the miss to 16. SF's 11 wins from runs were compounded by losing 6 more than its runs suggest.

## MIL had two projected players beat their forecasts by 30+ runs

I split MIL, the biggest miss, by player: how many runs above average each was projected to add (or save), against what they did. Batters use wOBA and pitchers FIP, converted to runs the same way as in the projection. Projected PA and innings are after scaling the roster to 162 games. Only players on the opening-day 40-man roster with a projection are shown.

![MIL: two projected players beat their forecast by 30+ runs](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_6_en.png)

Jacob Misiorowski (pitcher) was projected for 97 innings and about 5 runs saved; he threw 169 innings and saved about 38. With few innings behind him, his forecast was pulled hard toward average and his innings were estimated low. Jake Bauers (batter) was projected for 309 PA at about league average and had 574 PA and about 31 runs above average. Better rates and more playing time both played a part.

## Still, the projected players beating their forecasts explain only 40% of MIL's run gap

![MIL: projected players beating their forecasts explain 40% of the run gap](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_9_en.png)

MIL scored 93 more runs than projected and allowed 96 fewer, about 190 runs in all. The projected batters beating their forecasts (+19 projected, +71 actual) account for 52 of them, the projected pitchers (by FIP, +46 to +70) for 24: about 40% together. The other 60% includes fielding, baserunning and batted-ball outcomes that FIP and wOBA do not see, and players without a projection; pitchers with no forecast threw 33% of MIL's innings.

## 20-30% of playing time went to players with no forecast

The players without a projection are those not on the opening-day 40-man roster and rookies with no MLB history. I took their share of all 2026 plate appearances and innings.

![20-30% of playing time went to players with no forecast](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/team_wins_7_en.png)

They took 20% of plate appearances and 27% of innings. The projection assumes the projected players fill that time in proportion. Across the 30 teams, though, the correlation between a team's miss and its unprojected players' total WAR was a weak -0.27, with no clear link to the big misses.

## Summary

- Adding up player forecasts beat the floors over nine past seasons, but in the frozen 2026 test its mean error of 7.92 wins could not be told apart from the floors (8.50 to 8.83).
- Even with the actual runs, about 4 wins of error remain. The runs projections alone miss by about 8 wins on average, partly offset for some teams by winning more or fewer games than their runs suggest. The projections cluster toward .500 and spread half as wide as the results.
- In the biggest miss, MIL, projected players beating their forecasts explain about 40% of the run gap; the rest includes fielding, baserunning and unprojected players.

What surprised me most is that a gap of under one win cannot be seen in one season. A method can win over past seasons and still not show it in a single year of scoring, so comparing projection systems probably takes several years side by side. If I change anything next, it will be how rookies and new arrivals are handled, again frozen in advance, for 2027.

## Appendix

### Terms

- **wOBA**: a batting rate that weights each outcome (walk, single, home run, ...) by its run value
- **FIP**: a pitcher's run estimate from strikeouts, walks, hit batters and home runs only, leaving out whether balls in play fall for hits
- **Marcel**: Tom Tango's simple projection: a weighted average of three seasons, regressed toward average, with an age adjustment (applied here directly to wOBA and FIP)
- **Pythagenpat**: the Pythagorean win formula with an exponent that depends on the run environment, ((runs scored + allowed) per game)^0.287

### Also checked

- **Do young teams beat their projection?** MIL made it look as if teams whose young players improve should beat their projections. Over 300 team-seasons (the nine past seasons and 2026), the correlation between the age of a team's projected batters (weighted by projected PA, relative to that season's average) and its miss was -0.01. Split into age quartiles, the average miss ranged from -0.7 to +1.6 wins with no order.

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
