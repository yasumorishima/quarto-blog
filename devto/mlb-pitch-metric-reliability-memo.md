---
title: Does a pitch's performance carry over to next season? Whiff rate vs run value on 8,022 MLB pairs
published: true
description: I used public Baseball Savant data to see how strongly each pitch metric carries over from one season to the next, then rebuilt run value from pitch-level data to see which parts carry over.
tags: baseball, datascience, dbt, duckdb
---

While looking at pitch-type stats on Baseball Savant, I wondered whether a pitch that was good last year is still good this year, so I checked with public MLB data. I have no professional baseball experience; this is just public data.

## Whiff rate carries over; run value does not

![Whiff rate carries over; run value does not](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_carryover_1_en.png)

Same pitcher, same pitch type, two consecutive seasons (2017–2025, 8,022 pairs).

## How often the top pitches stay on top

![Share of top-20% pitches still top 20% next season](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_carryover_2_en.png)

## What run value is made of

I rebuilt run value from pitch-level data (about 5.98 million pitches), confirmed it matches Savant's published values for over 99% of rows, and split it into five parts.

![Run value breakdown](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_carryover_3_en.png)

![Batted-ball luck and situation barely carry over](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_carryover_4_en.png)

## Dropping luck and situation predicts next season better

![Dropping luck and situation predicts next season better](https://raw.githubusercontent.com/yasumorishima/mlb-data-pipeline/master/docs/images/pitch_carryover_5_en.png)

## Summary

- Whiff rate and K/BB carry over well
- About 30% of one season's run value is batted-ball luck and base/out situation, which barely carry over

My personal takeaway: one season of run value is easier to think about next to whiff rate and similar numbers.

## Appendix

**Terms**

- Whiff rate: share of swings that missed
- xwOBA allowed: expected value of contact allowed, mainly from exit velocity and launch angle
- Run value: sum of each pitch's change in run expectancy (positive = good for the pitcher)
- Batted-ball luck: actual result (hit or out) minus the value expected from contact quality

**Method**

- Values are relative to the pitch-type average (sliders compared with sliders, and so on)
- Bands use the smaller of the two seasons' pitch counts
- "Predicting next season": fit on pairs whose second season is 2021 or earlier, checked on 2022 or later. The 95% interval of the 0.35 − 0.29 difference is 0.03–0.10
- Includes 2020 (short season). Pitchers who stopped pitching the next year are not included

**Code**: https://github.com/yasumorishima/mlb-data-pipeline
