---
title: Does a pitch's performance carry over to next season? Whiff rate vs run value on 8,022 MLB pairs
published: true
description: I used public Baseball Savant data to see how strongly each pitch metric carries over from one season to the next for the same pitcher and pitch, and dug into why run value carries over so little.
tags: baseball, datascience, dbt, duckdb
---

## Why I looked into this

While browsing pitch-type stats on Baseball Savant, I started wondering: "Does a pitch that got a lot of whiffs one year still get them the next year?" and "Does a pitch that did well one year still do well the next?"

Was that year's number good because the pitch is good, or because it happened to be a good year? That probably depends on the metric. So I used public MLB data to look at this:

> For a given pitcher and pitch type, how strongly is this season's number related to next season's (same pitcher, same pitch)?
> How much does that differ between metrics (whiff rate, run value, and so on)?

I have no professional baseball experience; this is just a look at public data.

## Metrics

Baseball Savant publishes these numbers for each pitcher and pitch type. I mainly looked at five of them.

| Metric | Meaning |
|---|---|
| Usage | Share of the pitcher's pitches that were this pitch type |
| Whiff rate | Share of swings that missed |
| xwOBA allowed | The value of plate appearances ending on this pitch, in on-base/extra-base terms. For batted balls it uses the expected value from exit velocity and launch angle instead of whether the ball actually fell for a hit (strikeouts, walks, etc. are counted as they happened) |
| Hard-hit rate | Share of batted balls with an exit velocity of 95 mph or more |
| Run value / 100 pitches | How many runs the pitch saved (or cost), adding up the run value of every pitch outcome (ball, strike, hit, out, ...) and scaling to 100 pitches. In this data, higher is better for the pitcher |

Run value condenses a pitch's results into one number, so it is a number you see often. The second half of this post digs into it a little.

## How I measured it

### Year-to-year correlation

Take the same pitcher and pitch type in two consecutive seasons as one pair, e.g. "pitcher A's slider in 2023" and "pitcher A's slider in 2024". Collect many pairs and compute the correlation between the first and second season.

- Near 1: a pitch that was good this year is about as good next year
- Near 0: this year's number has little to do with next year's

### Subtract the pitch-type average first

Levels differ a lot by pitch type: sliders get many whiffs, sinkers few. Correlating raw values would come out high just because sliders get more whiffs no matter who throws them.

What I wanted to see is whether "this pitcher's slider is good among sliders" persists, so each value is taken relative to that season's average for that pitch type (e.g. "how many points above the average slider whiff rate").

### Split by pitch count

With few pitches, numbers are noisy, so pairs are split into four bands by the smaller of the two seasons' pitch counts. Roughly, 100–199 pitches is a reliever's third pitch and 800+ is a starter's main pitch.

### Data

- Baseball Savant pitch arsenal stats, 2017–2025, from a dataset I publish (Hugging Face `yasumorishima/mlb-stats`, `marts/mart_scouting_reliability`)
- Only pairs with at least 100 pitches in both seasons: 8,022 pairs
- The in-progress 2026 season is excluded

## Results

![Year-to-year correlation for the same pitcher and pitch](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_metric_yoy_en.png)

| Metric | 100–199 pitches | 200–399 pitches | 400–799 pitches | 800+ pitches |
|---|---|---|---|---|
| Usage | 0.79 | 0.81 | 0.87 | 0.84 |
| Whiff rate | 0.53 | 0.63 | 0.70 | 0.74 |
| xwOBA allowed | 0.26 | 0.34 | 0.46 | 0.53 |
| Hard-hit rate | 0.20 | 0.28 | 0.38 | 0.43 |
| Run value / 100 pitches | 0.09 | 0.17 | 0.25 | 0.35 |
| Pairs | 3,063 | 2,997 | 1,561 | 401 |

What I noticed:

- Except for usage, every metric correlates more with more pitches. Fewer pitches means more noise, so this was expected
- The difference between metrics was larger than the difference between pitch counts. Whiff rate in the 100–199 band (0.53) has a higher year-to-year correlation than run value in the 800+ band (0.35)
- Run value was only 0.35 even in the 800+ band. In this data, the relationship between this season's run value and next season's is weak

Usage is high probably because pitchers do not change their mix much from year to year. It is not a quality metric and is shown for reference.

### Share of the top 20% that is still in the top 20% next year

The correlations were hard to picture, so I also counted it another way. After subtracting the pitch-type average, I ranked pitches within each season and checked how many in the best 20% were still in the best 20% the next season (for xwOBA allowed, lower is better). If the two seasons were unrelated, this would be about 20%.

| Metric | All pairs (100+ pitches) | Pairs with 400+ pitches |
|---|---|---|
| Whiff rate | 52% | 58% |
| xwOBA allowed | 37% | 41% |
| Run value / 100 pitches | 29% | 32% |

Among pitches with 400+ pitches, about one in three of the top-20% run value pitches was still in the top 20% the next season, and 36% had dropped to the bottom half. For whiff rate, 58% stayed in the top 20% and 12% dropped to the bottom half.

## Digging into run value

I used other numbers in the same Savant table to look at why run value has a low year-to-year correlation. This section mainly looks at pitches thrown 400+ times (4,609 single-season rows; 1,962 two-season pairs). All numbers are relative to the pitch-type average.

### What one season of run value is made of

I checked how much of run value two numbers can explain:

- xwOBA allowed: contact quality from exit velocity and launch angle (strikeouts and walks included)
- The "luck" part: actual wOBA allowed (counting whether balls actually fell for hits) minus xwOBA allowed. The same batted ball can be an out if it goes right at a fielder or a hit if it finds a hole

Within a season, xwOBA allowed explains about 49% of the variation in run value, and adding the luck part brings it to about 78%. So close to 30% (78% − 49%) of one season's run value variation is explained by the luck part. The remaining ~20% probably includes the value of balls and strikes in the middle of plate appearances, which do not show up in plate-appearance results (this table cannot separate it, so that is a guess).

### The luck part barely carries over

Year-to-year correlation of each component (400+ pairs):

| Component | Year-to-year correlation |
|---|---|
| Whiff rate | 0.70 |
| Strikeout share (of PAs ending on this pitch) | 0.67 |
| xwOBA allowed | 0.47 |
| Actual wOBA allowed | 0.33 |
| Run value / 100 pitches | 0.27 |
| Luck part (wOBA − xwOBA) | 0.05 |

The luck part's year-to-year correlation is 0.05, essentially zero (0.02 for 100–399 pairs). A component that explains close to 30% of a season's run value variation barely carries over to the next season, which is likely the main reason run value's year-to-year correlation is low.

(This pools all 400+ pairs, so run value's 0.27 here differs a little from the per-band 0.25–0.35 in the earlier table.)

### Predicting next season's run value

If you want next season's run value, which of this season's numbers helps most? I fit on pairs whose second season is 2021 or earlier and tested on pairs whose second season is 2022 or later (years not used for fitting). Correlation between predicted and actual next-season run value (400+ pairs):

| This season's numbers | Correlation with next season's run value |
|---|---|
| Run value only | 0.28 |
| Whiff rate only | 0.31 |
| xwOBA allowed only | 0.30 |
| Whiff rate + xwOBA allowed | 0.34 |
| Whiff rate + xwOBA allowed + run value | 0.36 |

Even for predicting next season's run value, this season's whiff rate and xwOBA allowed were as good as, or a little better than, this season's run value. All three together reach 0.36 versus 0.28 for run value alone. Resampling pitchers 2,000 times, the 95% interval of that difference is 0.04–0.11, which does not include zero.

For 100–399 pairs, though, every combination stayed at 0.12–0.20; next season's run value was hard to predict.

## Summary

In this data:

- Whiff rate has a fairly high year-to-year correlation
- One season of run value has a low year-to-year correlation
- The main reason is likely that close to 30% of run value's variation is explained by a luck part (whether a batted ball becomes a hit or an out), and that part barely carries over
- For 400+ pairs, next season's run value was predicted better by combining whiff rate and xwOBA allowed than by run value alone (for 100–399 pairs, no combination predicted it well)

My personal takeaway is that when looking at one season of run value, also looking at whiff rate and xwOBA allowed seems to make next season easier to think about.

## Caveats

- The correlation contains both random noise and real change in the pitch (new grip, lost velocity, ...). It does not say how accurate a single season's number is
- The 800+ band has only 401 pairs
- Bands use the smaller of the two seasons' pitch counts, so a band can contain pairs where one season is much bigger. The mix of starters and relievers also differs between bands, so differences between bands include more than pitch count
- Pairs that include 2020 (the 60-game season) are included
- Pitchers who stopped pitching (or fell below 100 pitches) after a bad year do not form a pair; this is not corrected
- The "luck" part is just wOBA minus xwOBA; defense and park effects are not separated out

## About the numbers

The table is built with dbt, with a test that recomputes it a different way. Separately from dbt, I recomputed the correlations and pair counts from the raw Savant table with pandas and confirmed they match the published table. The run value deep dive is computed with pandas from the same raw table.

https://github.com/yasumorishima/mlb-data-pipeline
