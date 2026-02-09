---
title: "Shota Imanaga's Sophomore Year: What Statcast Data Reveals (2024-2025)"
published: true
description: Analyzing Shota Imanaga's pitch mix changes, split-finger decline, and sweeper surge using Statcast data
tags: baseball, mlb, statcast, datascience
---

## Introduction

A pitcher's second MLB season is sometimes called the "Sophomore Slump." After a full year of data accumulates, opposing hitters and their scouting departments have far more information to work with.

Chicago Cubs left-hander Shota Imanaga made 29 starts in his 2024 rookie campaign. In 2025, his first half appeared strong, but his numbers took a noticeable turn for the worse in the second half.

In this article, I break his Statcast pitch data into three periods -- "2024," "2025 First Half," and "2025 Second Half" -- to explore what changed. This is strictly an analysis of data-driven trends and is not intended to make definitive claims about the pitcher's intentions or decision-making.

> The Google Colab notebook used for this analysis is linked at the bottom of the article.

## Overview of the Three Periods

The 2025 season is split at the All-Star break (mid-July) into first and second halves.

| Period | Starts | Pitches | FF Avg Velo | Pitch Types |
|---|---|---|---|---|
| 2024 | 29 | 2,594 | 91.7 mph | 8 |
| 2025 1H | 12 | 1,026 | 90.9 mph | 6 |
| 2025 2H | 13 | 1,152 | 90.8 mph | 6 |

In 2025, his four-seam fastball velocity dropped by roughly 1 mph, and the number of pitch types used decreased from 8 to 6.

## Pitch Mix Changes

| Pitch | 2024 | 2025 1H | 2025 2H | Trend |
|---|---|---|---|---|
| FF (Four-Seam) | 51.9% | 49.5% | 47.9% | Slight decrease |
| FS (Splitter) | 30.8% | 35.6% | 27.6% | Up in 1H, down in 2H |
| ST (Sweeper) | 7.6% | 11.1% | **21.5%** | Sharp increase in 2H |
| CH (Changeup) | 3.8% | 0.0% | 0.0% | Disappeared |
| CU (Curveball) | 3.2% | 2.7% | 0.6% | Nearly disappeared |

In 2024, FF and FS accounted for roughly 83% of his pitches, with CH, CU, SI, and ST mixed in as secondary offerings.

By the second half of 2025, FF + FS + ST made up **97% of all pitches**. The most striking change was the sweeper's usage rate tripling from 7.6% to 21.5%.

## Batted Ball Quality Over Time

To examine the "results" of his pitching, here are batted ball quality metrics by period.

> **xwOBA** (Expected Weighted On-Base Average) estimates how likely a batted ball is to become a hit or extra-base hit based on exit velocity and launch angle. It removes defensive influence and reflects the quality of contact itself. For pitchers, a lower xwOBA against is better, with roughly .320 representing an MLB-average level.

| Period | xwOBA | Hard Hit% | Avg Exit Velo |
|---|---|---|---|
| 2024 | .366 | 22.7% | 81.7 mph |
| 2025 1H | **.339** | 25.0% | 83.3 mph |
| 2025 2H | **.408** | **28.8%** | 82.6 mph |

His 2025 first-half xwOBA of .339 was actually better than his 2024 mark (.366), confirming that he was pitching well early on. However, the second-half figure of .408 suggests he was getting hit hard.

### September Stands Out in Monthly Data

| 2025 | xwOBA | Hard Hit% |
|---|---|---|
| March | .226 | 26.3% |
| April | .431 | 23.7% |
| May | .305 | 21.9% |
| June | .232 | 15.6% |
| July | .333 | 26.2% |
| August | .336 | 22.6% |
| September | **.496** | **40.1%** |

After a rough April, he bounced back in May and June. July and August were reasonable at .333-.336.

September, however, saw a dramatic spike to .496 xwOBA and 40.1% Hard Hit%. This may reflect a combination of late-season fatigue, accumulated scouting data, and other factors.

## Times Through the Order (TTO): Struggles Starting from the First Time Through

This breakdown shows performance based on how many times a batter has faced the pitcher in a single game.

| TTO | 2024 xwOBA | 2025 1H | 2025 2H |
|---|---|---|---|
| 1st time | .357 | .331 | **.505** |
| 2nd time | .347 | .320 | .378 |
| 3rd time+ | .404 | .395 | .316 |

Typically, pitchers struggle more the second or third time through the order. But in the 2025 second half, the **first-time-through xwOBA was .505** -- an extremely high figure.

Being hit hard the first time through suggests that the issue may not have been in-game pitch recognition but rather **pre-game scouting preparation** by opposing hitters.

## Splitter (FS) Whiff Rate Decline

The splitter -- Imanaga's signature weapon -- saw a decline in whiff rate.

| Period | Whiff% | Chase Zone% | Chase Zone Whiff% |
|---|---|---|---|
| 2024 | 41.1% | 59.7% | 55.8% |
| 2025 1H | 28.0% | 52.1% | 38.2% |
| 2025 2H | 33.2% | 53.5% | 40.5% |

> The **chase zone** refers to the area outside the strike zone (ball territory). For pitchers, getting hitters to swing at pitches in this area is key to generating whiffs.

In 2024, about 60% of his splitters landed in the chase zone, producing a 55.8% whiff rate. In 2025, chase zone rate dropped to 52-53%, and the whiff rate fell to 38-40%.

The data suggests that hitters became more disciplined at laying off splitters out of the zone. With a full year of data available, opposing teams may have studied his splitter's trajectory and the counts in which he tends to throw it.

## Sweeper (ST) Splits by Batter Handedness

Here is a closer look at the sweeper's effectiveness, broken down by batter handedness.

### vs. Left-Handed Batters

| Period | Pitches | Whiff% | xBA Against |
|---|---|---|---|
| 2024 | 173 | 36.0% | .350 |
| 2025 1H | 86 | 42.4% | .265 |
| 2025 2H | 94 | 42.0% | **.582** |

### vs. Right-Handed Batters

| Period | Pitches | Whiff% | xBA Against |
|---|---|---|---|
| 2024 | 23 | 20.0% | .493 |
| 2025 1H | 28 | 28.6% | .124 |
| 2025 2H | 154 | 25.4% | .384 |

Against lefties, the whiff rate held steady at 42%, yet xBA against jumped from .265 to .582. This appears to indicate a pattern of "still generating swings and misses, but getting punished on contact."

Against righties, sweeper usage surged to 154 pitches in the 2025 second half (up from just 23 in all of 2024). The .384 xBA against suggests that the increased frequency may have given hitters more opportunity to prepare for the pitch.

## Four-Seam Velocity and Speed Differential with the Splitter

| Period | FF Avg | FS Avg | Speed Gap |
|---|---|---|---|
| 2024 | 91.7 mph | 82.9 mph | 8.8 mph |
| 2025 1H | 90.9 mph | 82.7 mph | 8.2 mph |
| 2025 2H | 90.8 mph | 83.2 mph | 7.6 mph |

The FF-FS speed differential narrowed from 8.8 mph to 7.6 mph. The four-seam/splitter combination works by appearing to travel on the same trajectory until late in the pitch's flight. When the speed gap shrinks, this deception effect may diminish.

## Summary

The following trends emerged from Imanaga's 2024-2025 Statcast data:

- **Pitch consolidation**: FF + FS + ST accounted for 97% of pitches, with CH and CU nearly disappearing
- **Splitter whiff rate decline**: Hitters showed increased discipline against chase-zone splitters
- **Sweeper surge with mixed results**: Usage tripled, but xBA against lefties reached .582
- **Hit hard from the first time through**: 2025 2H first-TTO xwOBA of .505 may point to advanced scouting
- **September collapse**: xwOBA .496, Hard Hit% 40.1%
- **FF-FS speed gap narrowing**: 8.8 mph down to 7.6 mph

It is worth noting that Imanaga's 2025 first half (xwOBA .339) was actually better than his 2024 full season. He was not struggling all year -- the second-half decline, particularly in September, weighed heavily on his overall numbers.

The combination of a more predictable pitch mix and advanced scouting by opponents appears to be a contributing factor, but elements that data alone cannot capture -- such as fatigue and physical condition -- may also have played a role.

> **Note**: The 2025 first half (12 starts, 1,026 pitches) and second half (13 starts, 1,152 pitches) represent limited sample sizes. Monthly and pitch-type splits by handedness are even smaller, so these figures should be interpreted with appropriate caution.

## Reproduce the Analysis in Google Colab

The analysis in this article can be reproduced using the notebook below. You can change PITCHER_ID to analyze any other pitcher.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/yasumorishima/mlb-statcast-visualization/blob/main/imanaga_2024_2025.ipynb)

## References

- [pybaseball GitHub Repository](https://github.com/jldbc/pybaseball)
- [Baseball Savant - Shota Imanaga](https://baseballsavant.mlb.com/savant-player/shota-imanaga-684007)
