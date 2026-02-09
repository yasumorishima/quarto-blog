---
title: "Kodai Senga's Ghost Fork Analyzed with Statcast Data (2023-2025)"
published: true
description: A deep dive into how MLB hitters adapted to Senga's devastating forkball using Statcast pitch-level data
tags: baseball, mlb, statcast, datascience
---

## Introduction

Mets pitcher Kodai Senga has long been known for his "Ghost Fork" -- a forkball with exceptional drop that earned its nickname during his career in Japan's NPB. In his 2023 rookie season, the pitch recorded a 58% whiff rate, proving it could dominate MLB hitters as well.

However, on June 12, 2025, Senga suffered a hamstring injury against the Nationals. After about a month on the injured list (IL), he returned in July, but his performance declined significantly after that return.

In this article, I use Statcast pitch-level data to examine Senga's forkball across four distinct periods: "2023 (Rookie Year)," "2024 (Injury Year -- only 1 start)," "2025 First Half (strong performance)," and "2025 Second Half (post-return)." The goal is to explore what the data suggests about changes to the Ghost Fork over time. This is purely a data-driven analysis of observable trends, not a definitive statement about the pitcher's intentions or physical condition.

> The Google Colab notebook used for this analysis is linked at the bottom of the article.

## Overview of the Four Periods

| Period | Starts | Pitches | FF (Four-Seam) Avg Velo | Pitch Types |
|---|---|---|---|---|
| 2023 (Rookie) | 29 | 2,803 | 95.7 mph | 6 |
| 2024 (Injury) | 1 | 73 | 95.8 mph | 6 |
| 2025 First Half (before 6/12 injury) | 13 | 1,180 | 94.7 mph | 8 |
| 2025 Second Half (after 7/11 return) | 9 | 728 | 94.7 mph | 8 |

In 2024, a shoulder injury limited Senga to just one start (73 pitches). His ERA during the 2025 first half was 1.47, indicating strong performance, but the hamstring injury on 6/12 appears to mark a turning point.

Four-seam velocity dropped approximately 1 mph, from 95.7 mph in 2023 to 94.7 mph in 2025.

> In Statcast's pitch classification system, Senga's forkball is categorized as **FO (Forkball)**, which is distinct from the more common splitter (FS) classification.

## Forkball Whiff Rate Decline

Let's look at the whiff rate trend for Senga's signature forkball (FO).

> **Whiff Rate** = Swinging strikes / Total swings. It measures how often hitters swing and miss. Higher values indicate a more difficult pitch to make contact with. The MLB average varies by pitch type but is roughly around 25%.

| Period | Whiff Rate | Pitches | 2-Strike Whiff Rate |
|---|---|---|---|
| 2023 | **58.2%** | 664 | 52.9% |
| 2025 First Half | 39.9% | 337 | 35.3% |
| 2025 Second Half | 39.4% | 203 | 34.6% |

The whiff rate dropped substantially from 58.2% in 2023 to approximately 40% in 2025. Notably, **this decline had already begun before the injury, during the 2025 first half**. The difference between the first half (39.9%) and second half (39.4%) is only 0.5 percentage points.

As a putaway pitch on two-strike counts, reliability also declined -- from 52.9% in 2023 to 34-35% in 2025.

## Zone Analysis: Whiff Rate in the Chase Zone

Breaking down the forkball's effectiveness by zone reveals more detail.

| Period | Chase Pitch% | Chase Whiff% | In-Zone Whiff% |
|---|---|---|---|
| 2023 | 77.4% | 72.8% | 33.6% |
| 2025 First Half | 71.8% | 58.6% | 11.7% |
| 2025 Second Half | 73.9% | 55.6% | 11.1% |

> The **chase zone** refers to the area outside the strike zone. A forkball's effectiveness relies on looking like a strike out of the hand and then dropping below the zone -- getting hitters to chase. Chase zone whiff rate is the lifeline of a forkball.

In 2023, 77% of Senga's forkballs were thrown in the chase zone, and 73% of those resulted in swings and misses. By 2025, the chase zone whiff rate had dropped to 55-59%.

The in-zone whiff rate also fell from 33.6% to approximately 11%, suggesting that hitters were making more contact with the forkball regardless of location.

## The Third Time Through the Order Problem

Looking at forkball whiff rate by time through the order (TTO) reveals an interesting pattern.

> **Time Through the Order (TTO)** tracks how many times a pitcher has faced the same batter in a game. The "1st time" is the initial matchup, "2nd time" is the second, and "3rd+" is the third or later. Hitters generally improve as they see the same pitcher multiple times, which tends to put pitchers at a disadvantage later in games.

| TTO | 2023 | 2025 First Half | 2025 Second Half |
|---|---|---|---|
| 1st | 62.1% | 46.6% | 38.9% |
| 2nd | 55.3% | 41.9% | 45.7% |
| 3rd+ | 57.1% | **28.6%** | **32.1%** |

In 2023, Senga maintained a 57.1% whiff rate even the third time through the order, meaning the forkball remained an effective weapon late in games.

By 2025, the third-time-through whiff rate had dropped to 28-32%. The data suggests that more hitters were able to adjust to the forkball in subsequent plate appearances.

## Movement Has Increased: A Question of Quality, Not Quantity

Surprisingly, the forkball's actual movement has increased year over year.

> **Movement** measures how much a pitch deviates from a straight trajectory due to forces other than gravity, in inches. Negative horizontal movement (for a right-handed pitcher) indicates glove-side run (tailing away from right-handed batters). Lower vertical movement values indicate more drop.

| Period | Horizontal Movement | Vertical Movement | Velocity | Spin Rate |
|---|---|---|---|---|
| 2023 | -7.2 in | 1.9 in | 83.2 mph | 1,118 rpm |
| 2025 First Half | -9.5 in | 0.7 in | 82.7 mph | 1,148 rpm |
| 2025 Second Half | **-10.7 in** | 0.7 in | 82.2 mph | 1,269 rpm |

Horizontal movement increased from -7.2 inches to -10.7 inches, and vertical drop also increased (1.9 to 0.7 inches). The forkball appears to be moving *more* than ever, yet the whiff rate has declined.

This may suggest the issue is not the "amount" of movement but rather its "quality" or predictability. If hitters can anticipate the trajectory of the movement, they can adjust even to pitches with significant break. It is also possible that changes in release mechanics or timing are giving hitters earlier cues.

## FF-FO Tunnel Effect Remains Intact

> The **tunnel effect** refers to the phenomenon where different pitch types appear to emerge from the same release point at the same angle, making it harder for hitters to distinguish between pitches. When the four-seam fastball (FF) and forkball (FO) share a nearly identical release point, hitters may commit to swinging as if a fastball is coming, only to be fooled by the forkball's drop.

One key reason the Ghost Fork has been so effective is that it appears to come from the same release point as the four-seam fastball (FF). Let's check whether this effect still holds.

| Period | X Difference | Z Difference | FF-FO Velo Gap |
|---|---|---|---|
| 2023 | 0.05 in | 0.02 in | 12.5 mph |
| 2025 First Half | 0.03 in | 0.02 in | 12.0 mph |
| 2025 Second Half | 0.02 in | 0.05 in | 12.5 mph |

The release point difference remains extremely small across all periods (0.02-0.05 inches), indicating that the tunnel effect is intact. The velocity gap also stays consistent at 12-12.5 mph.

This suggests that the whiff rate decline is **not** caused by hitters being able to distinguish between the FF and FO at the point of release. The data points more toward hitters having improved their ability to read the pitch's trajectory after release.

## Pitch Mix Changes After Injury

Let's examine how the pitch mix shifted between the 2025 first and second halves.

| Pitch Type | 2023 | 2025 1H | 2025 2H | 1H → 2H Change |
|---|---|---|---|---|
| FF (Four-Seam) | 37.0% | 31.0% | 32.3% | +1.3% |
| FO (Forkball) | 23.8% | 28.7% | 27.9% | -0.8% |
| FC (Cutter) | 25.0% | 20.6% | 19.8% | -0.8% |
| SL (Slider) | 5.8% | **8.5%** | **1.7%** | **-6.8%** |
| ST (Sweeper) | 5.9% | 4.4% | **8.9%** | **+4.5%** |
| SI (Sinker) | 0.0% | 5.0% | 7.6% | +2.6% |

The most striking change is the **sharp decrease in slider (SL) usage**. From 8.5% in the first half, it dropped to just 1.7% after the return. Meanwhile, the sweeper (ST) roughly doubled from 4.4% to 8.9%, and the sinker (SI) also increased from 5.0% to 7.6%.

- **Slider (SL)**: A breaking ball with sharp lateral movement generated by wrist snap
- **Sweeper (ST)**: A slider variant with broader, more horizontal break; increasingly popular across MLB in recent years
- **Sinker (SI)**: A fastball variant that sinks at the plate, effective for inducing ground balls

The slider demands significant arm-side torque, and it is possible that the hamstring injury affected lower-body stability, making it harder to execute. The shift toward the sweeper and sinker -- pitches that may rely more on overall body mechanics -- could be an adaptation to work around that limitation.

> Note: Pitch classifications are determined by Statcast's automated system and may not always align with the pitcher's actual grip or intent. Whether the SL-to-ST shift was intentional cannot be determined from the data alone.

## Loss of Platoon Advantage Against Right-Handed Hitters

Looking at forkball (FO) whiff rates split by batter handedness reveals a notable change against right-handed hitters.

| Period | vs LHH | vs RHH |
|---|---|---|
| 2023 | 51.4% | **64.2%** |
| 2025 First Half | 38.6% | 41.8% |
| 2025 Second Half | 40.0% | **38.2%** |

In 2023, the whiff rate against right-handed hitters was 64.2%, well above the 51.4% against lefties. This makes sense -- the forkball tails away from and drops on right-handed hitters, making it particularly difficult for them.

However, by the 2025 second half, the whiff rate against righties had fallen to 38.2%, actually dropping below the rate against left-handed hitters (40.0%). The data indicates that right-handed hitters in particular appear to have adapted to the forkball.

## Batted Ball Quality

Let's look at the quality of contact when the forkball was put in play.

> - **xwOBA** (Expected Weighted On-Base Average): A metric that estimates the expected outcome of a batted ball based on exit velocity and launch angle, removing the influence of defense. For pitchers, a lower xwOBA is better; around .320 is roughly the MLB average.
> - **Hard Hit%**: The percentage of batted balls with exit velocity of 95+ mph. Lower is better for pitchers.
> - **Exit Velo**: The speed of the ball off the bat at the moment of contact. Higher exit velocity generally means harder contact.

| Period | xwOBA | Hard Hit% | Avg Exit Velo |
|---|---|---|---|
| 2023 | .377 | 24.1% | 83.1 mph |
| 2025 First Half | **.323** | 25.2% | 83.3 mph |
| 2025 Second Half | .383 | 28.6% | 83.7 mph |

The 2025 first half xwOBA of .323 was actually better than 2023's .377, confirming the strong performance during that stretch.

For the forkball (FO) specifically, the expected batting average (xBA) dropped from .307 in 2023 to .252 in the 2025 first half, suggesting that while whiffs decreased, the quality of contact was still being managed. After the return, overall xwOBA worsened to .383 and Hard Hit% climbed to 28.6%.

## Summary

The Statcast data from Senga's 2023-2025 seasons reveals the following trends:

- **Significant FO whiff rate decline**: 58.2% to 39.4%. The drop had already begun in the 2025 first half, before the injury.
- **Third time through the order problem worsened**: Maintained 57% in 2023, dropped to 28-32% in 2025.
- **Movement increased, but whiffs decreased**: Horizontal movement grew from -7.2 in to -10.7 in, suggesting the issue may be pitch predictability rather than movement itself.
- **FF-FO tunnel effect remained intact**: Release point differences stayed at 0.02-0.05 inches throughout.
- **Post-injury SL usage collapsed, replaced by ST and SI**: May indicate the hamstring injury's impact on lower-body mechanics.
- **Lost platoon advantage against RHH**: FO whiff rate vs. righties fell from 64.2% to 38.2%.

Rather than a sudden breakdown caused by injury, the data paints a picture of **trends that were already developing before the injury and accelerated afterward**. The decline appears to involve a combination of MLB hitters' scouting-driven adaptation to the forkball and changes in pitching mechanics possibly related to the injury.

> **Note**: The 2025 first half (13 starts, 1,180 pitches) and second half (9 starts, 728 pitches) represent limited sample sizes. Splits by pitch type, batter handedness, and TTO are particularly prone to variance. The 2024 data consists of only 1 start (73 pitches) and should be treated as a reference point only.

## Reproduce This Analysis in Google Colab

You can reproduce this entire analysis using the notebook below. Change the PITCHER_ID to analyze any other pitcher.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/yasumorishima/mlb-statcast-visualization/blob/main/senga_2023_2025.ipynb)

## References

- [pybaseball Official Repository](https://github.com/jldbc/pybaseball)
- [Baseball Savant - Kodai Senga](https://baseballsavant.mlb.com/savant-player/kodai-senga-673540)
- [Darvish Pitching Evolution Analysis (2021-2025)](https://dev.to/yasumorishima/darvish-pitching-evolution-analysis-2021-2025)
