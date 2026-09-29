---
title: Does a pitch's performance carry over to next season? Whiff rate vs run value on 8,022 MLB pairs
published: true
description: I used public Baseball Savant data to see how strongly each pitch metric carries over from one season to the next, then rebuilt run value from pitch-level data to see which parts carry over.
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
| xwOBA allowed | The value of plate appearances ending on this pitch, in on-base/extra-base terms. For batted balls it uses the expected value mainly from exit velocity and launch angle instead of whether the ball actually fell for a hit (sprint speed is also used for some batted balls; strikeouts, walks, etc. are counted as they happened) |
| Hard-hit rate | Share of batted balls with an exit velocity of 95 mph or more |
| Run value / 100 pitches | How many runs the pitch saved (or cost), adding up the run value of every pitch outcome (ball, strike, hit, out, ...) and scaling to 100 pitches. In this data, higher is better for the pitcher |

Run value condenses a pitch's results into one number, so it is a number you see often. The second half of this post looks into it using pitch-level data.

## How I measured it

### Year-to-year correlation

Take the same pitcher and pitch type in two consecutive seasons as one pair, e.g. "pitcher A's slider in 2023" and "pitcher A's slider in 2024". Collect many pairs and compute the correlation between the first and second season.

- Near 1: a pitch that was good this year is about as good next year
- Near 0: this year's number has little to do with next year's

### Subtract the pitch-type average first

Levels differ a lot by pitch type: sliders get many whiffs, sinkers few. Correlating raw values would come out high just because sliders get more whiffs no matter who throws them.

What I wanted to see is whether "this pitcher's slider is good among sliders" persists, so each value is taken relative to that season's average for that pitch type (e.g. "how many points above the average slider whiff rate").

### Split by pitch count

With few pitches, numbers are noisy, so pairs are split into four bands by the smaller of the two seasons' pitch counts. Roughly, I think 100–199 pitches is about a reliever's third pitch and 800+ about a starter's main pitch.

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

Among pitches with 400+ pitches, about one in three of the top-20% run value pitches was still in the top 20% the next season, and 36% had dropped to the bottom half (about 50% if the seasons were unrelated). For whiff rate, 58% stayed in the top 20% and 12% dropped to the bottom half.

## Looking further into run value

I went down to pitch-level data to see why run value's year-to-year correlation is low.

### Checking how run value is calculated

According to the [MLB glossary](https://www.mlb.com/glossary/statcast/run-value), run value gives each pitch a value based on how much its result (ball, strike, hit, out, ...) moved the run expectancy, and adds those up.

To check this, I downloaded every regular-season pitch from 2017 to 2025 from Baseball Savant (about 5.98 million pitches). Each pitch carries `delta_run_exp`, the change in run expectancy on that pitch (positive = good for the batter). Summing it by pitcher, pitch type and season, flipping the sign to the pitcher's side and rounding to an integer reproduces Savant's published pitch-type run value exactly for 99.2–99.7% of rows in every season. The remaining rows are off by 1, and all of them have a fractional part of about 0.5, where rounding can go either way. Savant's pitch-type table folds knuckle curves and slow curves into curveballs, so I did the same.

One thing this showed: pitch-type run value includes the base/out situation. The same swinging strike is worth different amounts in different situations. For example, in 2025 a 0-0 swinging strike with no outs was worth 0.039 runs to the pitcher on average with the bases empty, and 0.045 with the bases loaded.

### Splitting run value into five parts

I split each pitch's value into five parts that add back up exactly to run value.

| Part | What it is |
|---|---|
| Mid-PA pitches | Pitches that did not end the plate appearance (balls, called/swinging strikes, fouls): the value of the count changing (a foul with two strikes is 0) |
| K / BB / HBP | Plate appearances ending in a strikeout, walk or hit-by-pitch |
| Batted balls (quality) | For batted balls, the value expected from exit velocity and launch angle (xwOBA) and the count at contact |
| Batted balls (luck) | For batted balls, actual minus expected: the same batted ball can be an out if it goes right at a fielder or a hit if it finds a hole |
| Situation | The part that changes with runners and outs, for the same count and result |

The first four parts use situation-averaged values: the average over all pitches with the same season, count and result, and for batted-ball quality, the average over batted balls in the same season and count with similar exit velocity and launch angle.

### Results of the split

For pairs with 400+ pitches in both seasons (1,962 pairs), per 100 pitches and relative to the pitch-type average as before:

| Part | Share of one season's run value variation | Year-to-year correlation | Contribution to what carries over |
|---|---|---|---|
| Batted balls (quality) | 36% | 0.27 | 37% |
| Batted balls (luck) | 27% | 0.06 | −7% |
| K / BB / HBP | 22% | 0.57 | 47% |
| Mid-PA pitches | 11% | 0.60 | 25% |
| Situation | 4% | −0.03 | −2% |
| Run value total | 100% | 0.27 | 100% |

How to read the table:

- "Share of one season's run value variation": run value differs a lot between pitchers and pitch types; this is each part's share when that difference is split into the five parts
- "Year-to-year correlation": the correlation of that part alone between this season and next
- "Contribution to what carries over": the link "a pitch with high run value this year also has high run value next year" (statistically, the covariance of this year's and next year's run value), split by this year's five parts. A negative value means the part weakens that link. It is computed against next year's total run value, so its sign can differ from the part's own year-to-year correlation (batted-ball luck is an example)

Both the shares and the contributions add up to 100%. The total's 0.27 pools all 400+ pairs, so it differs a little from the per-band values in the earlier table (0.25 for 400–799, 0.35 for 800+).

What I noticed:

- About 30% of one season's run value variation (luck 27% and situation 4%) barely carries over to the next season
- About 70% of what does carry over (47% and 25%) comes from K/BB/HBP and mid-PA pitches, which together are only about a third of one season's variation
- Even the batted-ball quality part has a modest year-to-year correlation of 0.27

So one season of run value seems to be a mix of parts that carry over and parts that do not.

### Predicting next season with only the parts that carry over

If so, adding up only the three parts other than luck and situation might predict next season's run value better. The prediction formula (and weights, where used) was set on pairs whose second season is 2021 or earlier, and checked on pairs whose second season is 2022 or later, so the check uses years not used to set it. That is why run value's 0.29 below differs a little from the 0.27 above (all years).

| This season's numbers | Correlation with next season's run value (400+) |
|---|---|
| Run value | 0.29 |
| Sum of the three parts (without luck and situation) | 0.35 |
| The three parts, each weighted | 0.38 |

Just dropping luck and situation gave a higher correlation with next season's run value than this season's run value itself. Repeating the calculation 2,000 times with pitchers resampled at random, the 95% interval of the difference (0.35 vs 0.29) is 0.03–0.10, which does not include zero. For 100–399 pairs the direction was the same (0.12 → 0.18), but both values are low.

## Summary

In this data:

- Whiff rate had a fairly high year-to-year correlation
- One season of run value had a low year-to-year correlation
- Split into five parts, about 30% of a season's run value variation came from batted-ball luck and the base/out situation, which barely carry over
- About 70% of what carries over came from K/BB/HBP and mid-PA pitches
- Adding up the three parts other than luck and situation gave a higher correlation with next season's run value than run value itself (400+ pairs, second season 2022 or later: 0.29 → 0.35)

My personal takeaway is that when looking at one season of run value, also looking at numbers that carry over well, like whiff rate and K/BB, seems to make next season easier to think about.

## Caveats

- The correlation contains both random noise and real change in the pitch (new grip, lost velocity, ...). It does not say how accurate a single season's number is
- The 800+ band has only 401 pairs
- Bands use the smaller of the two seasons' pitch counts, so a band can contain pairs where one season is much bigger. The mix of starters and relievers also differs between bands, so differences between bands include more than pitch count
- Pairs that include 2020 (the 60-game season) are included
- Pitchers who stopped pitching (or fell below 100 pitches) after a bad year do not form a pair; this is not corrected
- Batted-ball luck is just the difference from the value expected from exit velocity, launch angle and count; defense and park effects are not separated out
- The five-part split is my own choice. For example, whether the batted-ball expectation uses the count moves the line between quality and luck a little

## About the numbers

The table is built with dbt, with a test that recomputes it a different way. Separately from dbt, I recomputed the correlations and pair counts from the raw Savant table with pandas and confirmed they match the published table. The run value split is computed with pandas from the pitch-level data downloaded from Savant.

https://github.com/yasumorishima/mlb-data-pipeline
