---
title: Two players, pick one on last season's numbers: how often is it right? MLB 2026, checked against rules fixed in advance
published: true
description: Hundreds of thousands of two-player picks: last season's xwOBA picked the better 2026 hitter 65% of the time against 61% for wOBA, while pitchers' ERA, FIP, xERA and K-BB% could not be told apart in one season.
tags: baseball, datascience, python, statistics
---

When players are compared, "his average was higher last year" or "his ERA was lower" often comes up first. There are also plenty of numbers that try to take the luck out of the results: xwOBA, FIP, K−BB% and so on. If one of two players has to be chosen, which of last season's numbers most often picks the one who does better the next season? I had long wondered about that.

So I used public MLB data to repeat "pick one of two players on last season's numbers" hundreds of thousands of times, and counted how often each number picked right. For 2026, I wrote down the method and the reading rule and froze them in a repository before checking the result. I have no experience inside the game; this is just an analysis of public data.

## Data and method

- **Season stats for hitters and pitchers**: tables built from the MLB Stats API and Baseball Savant, 2015-2026. I used the player-season tables of my public [Hugging Face dataset](https://huggingface.co/datasets/yasumorishima/mlb-stats)

The method:

1. Take every player with at least 100 plate appearances (hitters) or 100 batters faced (pitchers) in both a season (year 1) and the next season (year 2)
2. Pair up **every two players** of the same season (pitchers only with the same role: starters with starters, relievers with relievers)
3. Pick one of the two on a year-1 number: for hitters the higher one, for pitchers the lower ERA, FIP or xERA, or the higher K−BB%
4. The pick is right if the picked player did better in year 2: higher wOBA for hitters, lower ERA for pitchers

A pair that a rule cannot split (equal year-1 numbers) counts as half right. A share of 50% means the rule does no better than a coin flip.

Scoring the pairs looks like this in Python (simplified; the real code also filters the players and computes the intervals):

```python
# x: year-1 number (oriented so that higher is better), y: year-2 result (higher is better)
dx = x[:, None] - x[None, :]          # year-1 difference for every pair
dy = y[:, None] - y[None, :]          # year-2 difference for every pair
right = np.where(dx == 0, 0.5, (dx > 0) == (dy > 0))   # right if the pick is also ahead in year 2
valid = (dy != 0) & ~np.eye(len(x), dtype=bool)         # drop year-2 ties and self-pairs
share = right[valid].mean()
```

The numbers compared (definitions in the appendix):

- **Hitters**: wOBA, xwOBA, wRC+, and a blend of five numbers (xwOBA carries the most weight)
- **Pitchers**: ERA, FIP, xERA, K−BB%, and a blend of the four

The blends were fitted only on pairs whose year 1 is 2015-2024 (year 2 up to 2025).

### What was fixed in advance

I built the method on 2015-2024 (dropping the seasons where year 1 or year 2 is the 60-game 2020), then **picked on 2025 numbers and scored on 2026 results**. Before reading the 2026 results, I froze the rule in the repository: "for the 2025→2026 pairs, report each number's share picked right and its difference from the base number (wOBA for hitters, ERA for pitchers). If the whole 95% interval of the difference is above 0, the number picks right more often; if it is wholly below 0, it picks right less often; if it crosses 0, the two are indistinguishable." In fact the pitcher version was scored first; the hitter version was written in the same form and frozen after I had seen the pitcher result, then scored. The intervals come from 2,000 resamples of players with replacement. The same player sits in hundreds of pairs, so resampling pairs instead of players would make the intervals far too narrow.

The 2026 test has 353 hitters (62,126 pairs) and 359 pitchers (32,122 pairs).

## Hitters: last season's xwOBA picked right 65% of the time, wOBA 61%

![Hitters: last season's xwOBA picked right 65% of the time, wOBA 61%](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/decision_pairs_1_en.png)

Picking on last season's wOBA was right 61.4% of the time. xwOBA was right 65.1% and the blend 65.4%. wRC+ was 61.6%, about the same as wOBA.

![Hitters: xwOBA and the blend beat wOBA. Pitchers: none separable from ERA](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/decision_pairs_2_en.png)

Against wOBA, xwOBA was +3.7 points (95% interval +1.3 to +6.1) and the blend +3.9 points (+1.9 to +6.1); both intervals are above 0, so by the rule fixed in advance both pick right more often than wOBA. wRC+ was +0.2 points (−0.3 to +0.6): indistinguishable.

Note that wRC+ adjusts for park and league, while the outcome here (next season's wOBA) is not adjusted.

## Pitchers: 56-58% whichever number, none separable from ERA

Picking pitchers on last season's ERA was right 55.8% of the time. FIP was 57.1%, xERA 58.1%, K−BB% 58.4% and the blend 58.5%. All are a little above ERA, but every 95% interval of the difference (+1.2 to +2.6 points) crosses 0, so by the rule all four are indistinguishable from ERA.

"Indistinguishable" does not mean "no difference". It means one season of pairs was not enough to tell a difference of this size apart.

## 2026 came out in roughly the same order as the development seasons

![2026 came out in roughly the same order as the development seasons](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/decision_pairs_3_en.png)

Here 2026 sits next to 2015-2024, the seasons the method was built on (486,143 hitter pairs, 259,065 pitcher pairs). White is that period, blue is 2026.

- Hitters' wOBA fell from 63.8% to 61.4%, while xwOBA barely moved (65.8% to 65.1%), so the gap widened in 2026 (+2.0 to +3.7 points)
- Pitchers' ERA was 55.8% both times. The other numbers were 0.9 to 1.6 points lower in 2026, so their gap to ERA shrank
- In 2015-2024, FIP, xERA and K−BB% did beat ERA for pitchers (+2.9 to +3.6 points, intervals clear of 0). The case that these numbers pick pitchers better than ERA rests on that period

## When wOBA and xwOBA disagree, xwOBA was right 59% of the time

In most pairs every number picks the same player. The choice of number only matters in the pairs where two numbers point at different players, so here are those pairs alone.

![When wOBA and xwOBA disagree, xwOBA was right 59% of the time](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/decision_pairs_4_en.png)

wOBA and xwOBA pointed at different hitters in 12,195 of 62,126 pairs (about a fifth); xwOBA was right in 59% of them and wOBA in 41%. ERA and K−BB% pointed at different pitchers in 11,028 of 32,122 pairs (about a third); K−BB% was right in 54% and ERA in 46%. The 95% interval of the difference is +6.9 to +30.1 points for hitters (xwOBA minus wOBA, +18.7), clear of 0, but −3.2 to +18.9 for pitchers (K−BB% minus ERA, +7.4), which crosses 0: one season cannot separate them. In 2015-2024 the figures were 56% for xwOBA and 56% for K−BB%.

### One pair at a time

Here are a few pairs where the numbers disagree sharply.

**Hitters: Harrison Bader and Salvador Perez** (2025)

| | wOBA | xwOBA | PA | 2026 wOBA |
|---|---|---|---|---|
| Harrison Bader | .346 | .297 | 501 | .238 |
| Salvador Perez | .311 | .357 | 641 | .285 |

wOBA picks Bader, xwOBA picks Perez. Bader's results were .049 better than his quality of contact predicted, Perez's .046 worse. In 2026 Perez was ahead: xwOBA was right. Note, though, that Bader had only 111 PA in 2026.

Nor is xwOBA always right. Pairing the same Perez with Jacob Wilson (2025 wOBA .348, xwOBA .304, 523 PA), Wilson had .301 in 2026 and Perez .285: wOBA was right.

**Pitchers: Brayan Bello and Dylan Cease** (2025, both starters)

| | ERA | K−BB% | FIP | xERA | Batters faced | 2026 ERA |
|---|---|---|---|---|---|---|
| Brayan Bello | 3.35 | 9.3% | 4.19 | 4.48 | 700 | 4.33 |
| Dylan Cease | 4.55 | 19.9% | 3.56 | 3.46 | 722 | 2.40 |

ERA picks Bello, K−BB% picks Cease. Cease struck out many more than he walked yet had a 4.55 ERA; in 2026 his ERA was 2.40. K−BB% was right.

On the other hand, with Clay Holmes (2025 ERA 3.53, K−BB% 8.9%) and Jack Flaherty (ERA 4.64, K−BB% 18.9%), Holmes had 3.29 in 2026 and Flaherty 4.48: ERA was right.

Hand-picked pairs alone prove nothing, so here are all such pairs counted together. Among pitcher pairs where both faced 500+ batters and the one with the ERA lower by more than 1.00 was not the one with the K−BB% higher by more than 6 points, there were 38 pairs and K−BB% was right in 55% (21); with only 38 pairs, that cannot be told apart from a coin flip. Among hitter pairs where both had 500+ PA and the one with the wOBA higher by more than .025 was not the one with the xwOBA higher by more than .025, there were 56 pairs and xwOBA was right in 35 of them (62.5%). Both counts were made after the results were read, for reference.

## Hitters picked on xwOBA had a next-season wOBA .019 higher, over all pairs

The share picked right does not say how far apart the picked and the unpicked player end up the next season. Here is the mean next-season gap between the player picked and the one left (wrong picks count as negative).

![Hitters picked on xwOBA had a next-season wOBA .019 higher, over all pairs](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/decision_pairs_5_en.png)

For hitters, picking on wOBA gave a next-season wOBA .014 higher on average, xwOBA .019. For pitchers, picking on ERA gave a next-season ERA 0.23 lower, K−BB% 0.37 lower. In both cases picking on xwOBA or K−BB% gives the bigger gap.

## Why

### Hitters: xwOBA takes out the luck on batted balls

wOBA is computed from the actual result of each plate appearance. xwOBA replaces each batted ball with the value expected mostly from its exit velocity and launch angle. The difference between the two contains batted-ball luck: whether the same ball goes straight to a fielder or finds a gap.

In my [previous article](https://dev.to/yasumorishima/does-a-pitchs-performance-carry-over-to-next-season-whiff-rate-vs-run-value-on-8022-mlb-pairs-bj) on pitch-level results, batted-ball luck hardly carried over to the next season either. For hitters too, plotting last season's wOBA and xwOBA against next season's wOBA, xwOBA gives the clearer upward slope.

![Last season's xwOBA tracks next season's wOBA more closely](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/decision_pairs_6_en.png)

Over the 353 hitters of the 2026 test, the correlation with next season's wOBA is 0.32 for wOBA and 0.42 for xwOBA.

### How hard the outcome itself is: same-season numbers get about 80%

To see why the numbers were harder to tell apart for pitchers, I measured how hard the outcome itself is to pick. What if the 2026 ERA is picked using the **same season's** 2026 FIP? Same pairs, same scoring as the picks on last season's numbers. It is a reference value that could never be used in practice, and it is not part of the method fixed in advance.

![Same-season numbers picked right about 80% of the time (reference)](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/decision_pairs_7_en.png)

Even knowing the same season's FIP, the lower ERA was picked 77% of the time (xERA 76%, K−BB% 67%). For hitters, the same season's xwOBA picked the higher wOBA 82% of the time. Even with same-season numbers, around a fifth of pairs come out the other way. For hitters, xwOBA and wOBA differ only in the results of batted balls (out, single, extra-base hit), so that is where the reversals come from. For pitchers, ERA also depends on whether hits come with runners on and on the fielders behind them, which FIP leaves out.

Picking on last season's numbers, hitters land 11 points (wOBA) or 15 points (xwOBA) above a coin flip, pitchers 6 points (ERA) or 8 points (K−BB%). For pitchers no number gets far from a coin flip, and the numbers differ from each other by only 1 to 3 points. One season's intervals are ±3 to 4 points wide, too wide to separate gaps of that size. Pooling the eight seasons of 2015-2024 narrows the intervals to about ±1 point, and gaps of the same size then clear 0.

### By plate appearances, xwOBA had the higher share in every band

I split the pairs into three bands by the smaller of the two hitters' 2025 PA. The pre-registration lists this as reported only, not used for conclusions.

![In every PA band, xwOBA had the higher share picked right (reported only)](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/decision_pairs_8_en.png)

xwOBA had the higher share in every band, but in the 500+ PA band the interval of the difference crosses 0 (−1.8 to +7.2 points). In 2015-2024 too, the 500+ band had a small gap between xwOBA and wOBA (0.7 points) with an interval crossing 0.

## Summary

In this data:

- Picking one of two hitters on last season's numbers, xwOBA was right 65% of the time in 2026 and wOBA 61%, and the gap held up on one season alone. wRC+ did about as well as wOBA
- Picking one of two pitchers, ERA, FIP, xERA, K−BB% and the blend were all right 56-58% of the time, and 2026 alone could not separate them from ERA. In 2015-2024 the numbers other than ERA did pick better
- Where wOBA and xwOBA point at different hitters, xwOBA was right 59% of the time. For pitchers, K−BB% was right 54% against ERA, which one season cannot separate
- For reference, even same-season FIP or xwOBA picks right about 80% of the time

What surprised me most is that picking the player with the better number last season is still wrong about 4 times in 10. For hitters, picking on xwOBA was right more often than picking on wOBA, and that is the clearest result here. For pitchers one season says little, and I would like to keep checking it for a few more seasons.

## Appendix

### Terms

- **wOBA**: an overall batting measure that weights each plate-appearance outcome (walk, single, home run, ...) by its run value
- **xwOBA**: wOBA with each batted ball replaced by the value expected mostly from its exit velocity and launch angle (sprint speed is also used for some weakly hit balls)
- **wRC+**: batting run contribution adjusted for park and league, with league average = 100
- **ERA**: earned runs per nine innings
- **FIP**: a pitcher's expected run allowance from strikeouts, walks, hit-by-pitches and home runs only
- **xERA**: an ERA estimate from the exit velocity and launch angle of the batted balls a pitcher allowed, plus strikeouts, walks and hit-by-pitches
- **K−BB%**: strikeouts minus walks, as a share of batters faced
- **Blend**: a combination of year-1 numbers fitted on 2015-2024 to predict year 2. Hitters: wOBA, xwOBA, strikeout rate, walk rate and ISO (slugging minus average). Pitchers: ERA, FIP, xERA and K−BB%. In the hitter blend xwOBA carries the most weight (about 60% by coefficient times standard deviation) and wOBA almost none

### Caveats

- Only players with 100+ PA (batters faced) in year 2 are counted. Players whose playing time dropped after a bad season drop out, so this compares players who kept playing. With a 50 bar in year 2, the hitters' order is the same; for pitchers xERA and K−BB% swap places (58.9% and 58.8%)
- A pitcher is a starter if at least half of his year-1 games were starts, otherwise a reliever; only same-role pairs are formed
- Pairs a rule cannot split count as half right; pairs with equal year-2 results are not counted
- The same player appears in hundreds of pairs, so tens of thousands of pairs do not carry that much information; the intervals resample players
- The strong-disagreement counts (500+ PA or batters faced, an ERA gap of more than 1.00, and so on) and the same-season reference values were computed after the results were read and are not part of the method fixed in advance
- Fielding, baserunning, park, age, health and contracts are not included. Choosing real players involves a lot more than this

### Reproducing

All code, the rules fixed in advance and the results are in [mlb-data-pipeline](https://github.com/yasumorishima/mlb-data-pipeline).

- [`analysis/decision_pairs_batters/`](https://github.com/yasumorishima/mlb-data-pipeline/tree/master/analysis/decision_pairs_batters): hitters (`PREREG.md` is the rule fixed in advance, `RESULTS.md` the result)
- [`analysis/decision_pairs/`](https://github.com/yasumorishima/mlb-data-pipeline/tree/master/analysis/decision_pairs): pitchers (same). `article_dig.py` computes the extra numbers for this article and `article_figs.py` draws the charts
