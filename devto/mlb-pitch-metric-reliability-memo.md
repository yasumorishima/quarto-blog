---
title: Don't judge a pitch by one season of run value: year-to-year carryover measured on 8,022 MLB pitcher-pitch pairs
published: false
description: Using public Baseball Savant data, I measured how well each pitch metric in one season predicts the same pitcher's same pitch the next season. Whiff rate carries over well; run value per 100 pitches barely does.
tags: baseball, datascience, dbt, duckdb
---

I measured, with public MLB data, whether the numbers a team uses to grade a pitch **point the same way next year**. This is written for people who make decisions with these numbers, so the conclusions come first.

## Conclusions

1. **Make whiff rate the main number when grading a pitch.** For the same pitcher and the same pitch type, the correlation with the next season is 0.70 at 400–799 pitches and 0.74 at 800 or more.
2. **Don't grade a pitch on one season of run value (per 100 pitches).** Even for pitches thrown 800+ times, the correlation with the next season is 0.35. One season of it says little more than "that is how that year went". If you use it, combine several seasons or read it next to whiff rate and xwOBA allowed.
3. **Pitches thrown only 100–199 times (a reliever's third pitch, for example) are a band where judgement should wait.** Even whiff rate only reaches 0.53 there.

## What was measured

- Data: Baseball Savant pitch arsenal stats (2017–2025), taken from a dataset I publish myself (Hugging Face `yasumorishima/mlb-stats`, `marts/mart_scouting_reliability`).
- Pairs: the same pitcher's same pitch type in two consecutive seasons (100+ pitches in both). The 2026 season, still in progress, is not included.
- Number: the correlation between the two seasons, **after subtracting the mean of each pitch type** (sliders miss more bats to begin with, so a plain correlation would come out high just from the difference between pitch types). This compares a slider with other sliders, the way scouting does.
- Bands: pairs are split by the smaller of the two seasons' pitch counts.

| Metric (within pitch type) | 100–199 pitches | 200–399 | 400–799 | 800+ |
|---|---|---|---|---|
| Usage | 0.79 | 0.81 | 0.87 | 0.84 |
| Whiff rate | 0.53 | 0.63 | 0.70 | 0.74 |
| xwOBA allowed | 0.26 | 0.34 | 0.46 | 0.53 |
| Hard-hit rate | 0.20 | 0.28 | 0.38 | 0.43 |
| Run value / 100 pitches | 0.09 | 0.17 | 0.25 | 0.35 |
| Pairs | 3,063 | 2,997 | 1,561 | 401 |

## How to read it

- The correlation contains both "noise in the number" and "the pitch really changed". **It is not a measure of how precise one season is.** Read it as "how well last season's number tells you next season's".
- The 800+ band is small, with 401 pairs.
- The band is set by the smaller of the two seasons' pitch counts. The larger season is not restricted by the band, so a band can contain pairs where only one of the two years had a heavy workload. The mix of pitchers also differs between bands (for example the share of starters and relievers), so differences between bands contain that difference in mix as well as the difference in pitch count.
- Pairs that include 2020 (the 60-game shortened season) are included.
- Selection by who stays in the league (a pitcher who stopped pitching after a bad year does not form a pair) is not corrected for.

## Reproducing it

The numbers come from one dbt model, with a test that recomputes every cell another way (I confirmed the test fails when errors such as pairing across pitch types or forgetting to subtract the within-type mean are introduced). I also recomputed all 20 correlations and the pair counts from the raw Savant table with pandas, independently of dbt, and they match the published table.
https://github.com/yasumorishima/mlb-data-pipeline
