---
title: Does a pitch's performance carry over to next season? Whiff rate vs run value on 8,022 MLB pairs
published: false
description: I used public Baseball Savant data to see how similar each pitch metric is from one season to the next for the same pitcher and pitch. In this data, whiff rate was fairly similar year to year; one season of run value was not.
tags: baseball, datascience, dbt, duckdb
---

## Why I looked into this

While browsing pitch-type stats on Baseball Savant, I started wondering: "Does a pitch that got a lot of whiffs last year still get them this year?" and "Does a pitch that did well last year still do well this year?"

Was last year's number good because the pitch is good, or because it happened to be a good year? That probably depends on the metric. So I used public MLB data to look at this:

> For a given pitcher and pitch type, how similar is this season's number to the same pitcher's same pitch next season?
> How much does that differ between metrics (whiff rate, run value, and so on)?

I have no professional baseball experience; this is just a look at public data.

## Metrics

Baseball Savant publishes these numbers for each pitcher and pitch type. I looked at five of them.

| Metric | Meaning |
|---|---|
| Usage | Share of the pitcher's pitches that were this pitch type |
| Whiff rate | Share of swings that missed |
| xwOBA allowed | The value of plate appearances ending on this pitch, in on-base/extra-base terms. For batted balls it uses the expected value from exit velocity and launch angle instead of whether the ball actually fell for a hit (strikeouts, walks, etc. are counted as they happened) |
| Hard-hit rate | Share of batted balls with an exit velocity of 95 mph or more |
| Run value / 100 pitches | How many runs the pitch saved (or cost), adding up the run value of every pitch outcome (ball, strike, hit, out, ...) and scaling to 100 pitches. In this data, positive means good for the pitcher |

Run value condenses a pitch's results into one number, so it is a number you see often.

## How I measured it

### Year-to-year correlation

Take the same pitcher and pitch type in two consecutive seasons as one pair, e.g. "pitcher A's slider in 2023" and "pitcher A's slider in 2024". Collect many pairs and compute the correlation between the first and second season.

- Near 1: a pitch that was good this year is about as good next year
- Near 0: this year's number has little to do with next year's

### Subtract the pitch-type average first

Levels differ a lot by pitch type: sliders get many whiffs, sinkers few. Correlating raw values would come out high just because "a slider is a slider every year".

What I wanted to see is whether "this pitcher's slider is good among sliders" persists, so each value is taken relative to that season's average for that pitch type (e.g. "how many points above the average slider whiff rate").

### Split by pitch count

With few pitches, numbers are noisy, so pairs are split into four bands by the smaller of the two seasons' pitch counts. Roughly, 100–199 pitches is a reliever's third pitch and 800+ is a starter's main pitch.

### Data

- Baseball Savant pitch arsenal stats, 2017–2025, from a dataset I publish (Hugging Face `yasumorishima/mlb-stats`, `marts/mart_scouting_reliability`)
- Only pairs with at least 100 pitches in both seasons: 8,022 pairs
- The in-progress 2026 season is excluded

## Results

![Year-to-year correlation for the same pitcher and pitch](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_metric_yoy_en.png)

| Metric | 100–199 pitches | 200–399 | 400–799 | 800+ |
|---|---|---|---|---|
| Usage | 0.79 | 0.81 | 0.87 | 0.84 |
| Whiff rate | 0.53 | 0.63 | 0.70 | 0.74 |
| xwOBA allowed | 0.26 | 0.34 | 0.46 | 0.53 |
| Hard-hit rate | 0.20 | 0.28 | 0.38 | 0.43 |
| Run value / 100 pitches | 0.09 | 0.17 | 0.25 | 0.35 |
| Pairs | 3,063 | 2,997 | 1,561 | 401 |

What I noticed:

- Every metric correlates more with more pitches. Fewer pitches means more noise, so this was expected
- The difference between metrics was larger than the difference between pitch counts. Whiff rate at 100–199 pitches (0.53) is more similar year to year than run value at 800+ (0.35)
- Run value was only 0.35 even at 800+ pitches. In this data, one season of run value and the next season's run value are not very similar

Usage is high probably because pitchers do not change their mix much from year to year. It is not a quality metric and is shown for reference.

### Share of the top 20% that is still in the top 20% next year

The correlations were hard to picture, so I also counted it another way. After subtracting the pitch-type average, I ranked pitches within each season and checked how many in the best 20% were still in the best 20% the next season (for xwOBA allowed, lower is better). If the two seasons were unrelated, this would be about 20%.

| Metric | All pairs (100+ pitches) | Pairs with 400+ pitches |
|---|---|---|
| Whiff rate | 52% | 58% |
| xwOBA allowed | 37% | 41% |
| Run value / 100 pitches | 29% | 32% |

Among pitches with 400+ pitches, about one in three of the top-20% run value pitches was still in the top 20% the next season, and 36% were in the bottom half. For whiff rate, 58% stayed in the top 20% and 12% were in the bottom half.

### Why run value may be less similar (a guess)

I did not check this properly, so it is a guess. Run value adds up the run value of every pitch outcome, so it includes things the pitcher does not fully control, such as whether a batted ball becomes a hit or an out. Whiff rate only counts whether a swing missed, so less of that may get in. xwOBA allowed sitting in between might be because, for batted balls, it replaces "was it a hit" with exit velocity and launch angle.

## Summary

In this data, whiff rate was fairly similar from one season to the next, while one season of run value was not very similar to the next. My personal takeaway is that when looking at one season of run value, it seems worth also looking at whiff rate and xwOBA allowed, or combining several seasons.

## Caveats

- The correlation contains both random noise and real change in the pitch (new grip, lost velocity, ...). It does not say how accurate a single season's number is
- The 800+ band has only 401 pairs
- Bands use the smaller of the two seasons' pitch counts, so a band can contain pairs where one season is much bigger. The mix of starters and relievers also differs between bands, so differences between bands include more than pitch count
- Pairs that include 2020 (the 60-game season) are included
- Pitchers who stopped pitching after a bad year do not form a pair; this is not corrected

## About the numbers

The table is built with dbt, with a test that recomputes it a different way. Separately from dbt, I recomputed the correlations and pair counts from the raw Savant table with pandas and confirmed they match the published table.

https://github.com/yasumorishima/mlb-data-pipeline
