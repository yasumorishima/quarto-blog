---
title: "Yusei Kikuchi's Pitching Evolution: A Statcast Analysis (2019-2025)"
published: true
description: Tracking Kikuchi's pitch mix transformation across 4 MLB teams using Statcast data from 2019-2025
tags: baseball, mlb, statcast, datascience
---

## Introduction

Since joining MLB in 2019, Yusei Kikuchi has pitched for four different teams: Mariners, Blue Jays, Astros, and Angels. In Japan, his repertoire centered on a four-seam fastball and slider, but by 2025 -- his seventh MLB season -- his slider has become his most-thrown pitch, overtaking the four-seamer. The data suggests a significant transformation in his pitching approach over the years.

This article uses Statcast pitch-tracking data to trace the evolution of Kikuchi's pitch mix across seven seasons. In particular, the data points to a notable slider-driven shift that appears to have started around his July 2024 trade to the Astros. This is an analysis of trends visible in the data, and does not claim to represent the pitcher's personal intentions or philosophy.

> The Google Colab notebook used for this analysis is linked at the end of the article.

## Career Overview

| Period | Team | Starts | Pitches | Avg Velocity (all pitches) | Pitch Types |
|---|---|---|---|---|---|
| 2019 | SEA | 32 | 2,721 | 87.3 mph | 5 |
| 2020 | SEA | 9 | 795 | 91.4 mph | 4 |
| 2021 | SEA | 29 | 2,562 | 90.5 mph | 5 |
| 2022 | TOR | 32 | 1,844 | 91.1 mph | 6 |
| 2023 | TOR | 32 | 2,818 | 90.5 mph | 7 |
| 2024 1st Half | TOR | 22 | 1,955 | 90.7 mph | 4 |
| 2024 2nd Half | HOU | 10 | 971 | 89.9 mph | 4 |
| 2025 | LAA | 33 | 3,109 | 88.5 mph | 6 |

In 2025, Kikuchi logged a career-high 33 starts and 3,109 pitches.

> "Avg Velocity (all pitches)" includes all pitch types (four-seam, slider, changeup, etc.). Since this average is affected by pitch mix, four-seam-specific velocity trends are covered in a later section.

## Pitch Mix Evolution: Three Phases

Kikuchi's seven-year pitch mix can be broadly divided into three phases.

### Phase 1: The Cutter Era (2019-2021, Mariners)

| Pitch | 2019 | 2020 | 2021 |
|---|---|---|---|
| FF (Four-Seam) | 48.9% | 37.7% | 35.8% |
| FC (Cutter) | 0.0% | **40.0%** | **32.9%** |
| SL (Slider) | 28.0% | 16.0% | 20.2% |
| CU (Curveball) | 15.4% | 0.0% | 0.4% |
| CH (Changeup) | 7.6% | 6.3% | 10.7% |

In 2020, the cutter (FC) suddenly accounted for 40% of his pitches, and remained a primary pitch in 2021 at 32.9%. The four-seam/cutter combination defined this period.

> **Cutter (FC):** A pitch thrown at near-fastball velocity with slight horizontal movement. It moves late, making it effective at jamming hitters and avoiding solid contact.

### Phase 2: Fastball-Dominant (2022-2024 1st Half, Blue Jays)

| Pitch | 2022 | 2023 | 2024-TOR |
|---|---|---|---|
| FF | **50.5%** | 45.2% | **49.6%** |
| SL | 30.3% | 26.3% | 17.4% |
| CU | 0.3% | **18.9%** | **22.1%** |
| CH | 13.4% | 9.1% | 10.9% |
| FC | 5.4% | 0.0% | 0.0% |

After joining the Blue Jays, the cutter was effectively shelved. With the four-seamer at roughly 50%, the curveball re-emerged in 2023, creating a balanced four-pitch mix. By the first half of 2024, however, the slider had dropped to just 17.4%, and his approach appeared increasingly fastball-dependent.

### Phase 3: The Slider Transformation (2024 2nd Half - 2025, Astros to Angels)

| Pitch | 2024-TOR | 2024-HOU | 2025 |
|---|---|---|---|
| FF | 49.6% | 41.8% | **34.9%** |
| SL | 17.4% | **37.2%** | **36.2%** |
| CU | 22.1% | 9.4% | 15.4% |
| CH | 10.9% | 11.6% | 12.1% |

Following the July 2024 trade to Houston, slider usage surged from **17.4% to 37.2%** (+19.8 percentage points). In 2025 with the Angels, the slider (36.2%) overtook the four-seamer (34.9%) for the first time in Kikuchi's career as his most-thrown pitch.

## Slider Deep Dive

Beyond usage rate, the slider's quality has also evolved.

| Period | Usage | Avg Velo | Spin Rate | Whiff Rate | xBA Against |
|---|---|---|---|---|---|
| 2022 | 30.3% | 86.6 mph | 2,355 rpm | 31.0% | .366 |
| 2023 | 26.3% | 88.7 mph | 2,427 rpm | 28.0% | .361 |
| 2024-TOR | 17.4% | 89.0 mph | 2,412 rpm | 27.8% | .343 |
| 2024-HOU | **37.2%** | 87.5 mph | 2,380 rpm | 28.1% | .346 |
| 2025 | **36.2%** | 87.0 mph | 2,295 rpm | 23.1% | .344 |

> **Whiff Rate** = Swings and misses / Total swings. **xBA (Expected Batting Average)** is calculated from exit velocity and launch angle -- lower values indicate weaker contact from hitters.

The whiff rate dipped to 23.1% in 2025, but the xBA against has remained stable at .343-.346, which may suggest the slider is functioning more as a **contact-management pitch** than a pure swing-and-miss offering. The fact that batted ball quality has not deteriorated despite the doubling of usage is noteworthy.

## 52% Sliders Against Left-Handed Hitters

As a left-handed pitcher, Kikuchi's slider moves away from same-side (left-handed) batters. Conventionally, lefty pitchers don't throw sliders heavily to left-handed hitters, but Kikuchi's 2025 data shows an interesting pattern.

**2025 Pitch Mix vs Left-Handed Batters:**

| Pitch | Usage | Whiff Rate |
|---|---|---|
| SL | **52.4%** | 23.6% |
| FF | 32.7% | 19.8% |
| CU | 10.5% | 34.3% |
| SI | 4.4% | 20.0% |

Over **half** of his pitches to left-handed batters were sliders. He threw no changeups to lefties, relying on a streamlined three-pitch mix of slider, four-seam, and curveball.

Against right-handed batters, by contrast, his usage was more balanced: FF 35.7%, SL 32.6%, CU 16.6%, CH 14.7%.

## Four-Seam Velocity Trends

| Period | Avg Velocity | Spin Rate |
|---|---|---|
| 2019 | 92.5 mph | 2,096 rpm |
| 2020 | 95.0 mph | 2,172 rpm |
| 2021 | 95.1 mph | 2,214 rpm |
| 2022 | 94.9 mph | 2,271 rpm |
| 2023 | 95.1 mph | 2,339 rpm |
| 2024-TOR | **95.6 mph** | 2,276 rpm |
| 2024-HOU | 95.2 mph | 2,322 rpm |
| 2025 | 94.8 mph | 2,185 rpm |

After a notable jump from 92.5 mph in 2019 to 95.0 mph in 2020, his four-seam velocity has remained stable in the 94.8-95.6 mph range. The 2025 mark of 94.8 mph is well within his career norms.

### Velocity by Inning

With a career-high 33 starts in 2025, how much did Kikuchi's velocity drop as games progressed?

| Inning | 2023 | 2024-TOR | 2024-HOU | 2025 |
|---|---|---|---|---|
| 1st | 95.0 | 95.9 | 95.3 | 95.2 |
| 3rd | 95.2 | 95.9 | 95.2 | 95.1 |
| 5th | 95.0 | 95.3 | 95.2 | 94.5 |
| 7th | 95.1 | 95.1 | 94.5 | 94.3 |

In 2025, the drop from the 1st inning (95.2) to the 7th (94.3) was **-0.9 mph** -- a modest decline that suggests solid durability through seven innings.

## Batted Ball Quality: Signs of Improvement

| Period | xwOBA | Hard Hit% | Avg Exit Velo |
|---|---|---|---|
| 2019 | .384 | 28.7% | 84.5 mph |
| 2021 | .419 | 28.4% | 84.3 mph |
| 2022 | **.456** | 26.9% | 83.6 mph |
| 2023 | .400 | 25.9% | 83.5 mph |
| 2024-HOU | .382 | 25.3% | 82.1 mph |
| 2025 | **.385** | **25.1%** | 83.5 mph |

> **xwOBA (Expected Weighted On-Base Average):** Calculated from exit velocity and launch angle to estimate how likely batted balls are to become hits. Lower is better for pitchers; ~.320 is roughly league average. **Hard Hit%:** Percentage of batted balls with exit velocity of 95+ mph. Lower is better for pitchers.

The xwOBA has steadily improved from .456 in 2022 to .385 in 2025. Hard Hit% has also trended downward from 28.7% (2019) to 25.1% (2025), which may suggest an increasing ability to **suppress hard contact** over time.

The Astros period (2024-HOU) stands out with an xwOBA of .382 and Hard Hit% of 25.3%, and the data suggests the mid-season trade may have been a turning point for his pitching development.

## Whiff Rate: A Declining Trend

On the other hand, whiff rates across his pitch arsenal present an area to watch.

| Pitch | 2023 | 2024-TOR | 2024-HOU | 2025 |
|---|---|---|---|---|
| FF | 23.1% | 24.0% | 26.5% | **18.0%** |
| SL | 28.0% | 27.8% | 28.1% | **23.1%** |
| CH | 18.1% | 29.7% | **41.9%** | 24.6% |
| CU | 28.0% | 26.3% | 25.0% | 23.8% |

In 2025, both the four-seamer (18.0%) and slider (23.1%) showed lower whiff rates. Meanwhile, the changeup posted a remarkable 41.9% whiff rate during his Astros stint, though it settled back to 24.6% in 2025.

The overall trend appears to point toward a shift from a **strikeout-oriented** approach to one that emphasizes **inducing ground balls and weak contact**. Given the improvement in batted ball quality metrics, this may be a deliberate evolution.

## Two-Strike Pitch Selection

Kikuchi's approach with two strikes has also shifted over time.

| Period | FF | SL | CU | CH | Highest Whiff Pitch |
|---|---|---|---|---|---|
| 2023 | 39.6% | 36.8% | 15.3% | 7.5% | CU 31.0% |
| 2024-TOR | 39.7% | 25.6% | 19.1% | 15.7% | CH **39.5%** |
| 2024-HOU | 42.9% | **36.6%** | 9.5% | 11.0% | CH **44.4%** |
| 2025 | 36.7% | **30.8%** | 14.7% | **16.7%** | SL 27.2% |

The 44.4% changeup whiff rate on two-strike counts during the Astros period is particularly striking. In 2025, four-seam usage in two-strike counts decreased, and the distribution across all four pitches became more balanced.

## Performance by Times Through the Order

> **Times Through the Order (TTO):** Tracks how a pitcher performs against the same batters in successive plate appearances within a game. Generally, hitters adjust to a pitcher's repertoire with each pass, giving the pitcher a disadvantage later in games.

| TTO | 2023 | 2024-HOU | 2025 |
|---|---|---|---|
| 1st Time Whiff% | 26.0% | 25.8% | 20.9% |
| 2nd Time Whiff% | 26.0% | 31.9% | 23.0% |
| 3rd+ Time Whiff% | 22.0% | 26.8% | 20.5% |

| TTO | 2023 xwOBA | 2024-HOU xwOBA | 2025 xwOBA |
|---|---|---|---|
| 1st Time | .416 | .393 | .405 |
| 2nd Time | .385 | .367 | **.363** |
| 3rd+ Time | .399 | .386 | .386 |

In 2025, the 3rd-time xwOBA of .386 is higher than the 2nd-time mark (.363), but compared to 2023 (.399) it shows improvement. The slider-heavy transformation may be contributing to better durability against the third pass through the order. Having a broader and more varied pitch mix could make it harder for hitters to adjust on subsequent at-bats.

## Summary

The Statcast data from Kikuchi's 2019-2025 career reveals several notable trends:

- **Three Phases:** Cutter era (2019-21) → Fastball-dominant (2022-24 1st half) → Slider-driven (2024 2nd half - 25)
- **Slider Transformation:** After the Astros trade, SL usage jumped from 17.4% to 37.2%. In 2025, SL surpassed FF as his most-thrown pitch (36.2% > 34.9%)
- **Improved Batted Ball Quality:** xwOBA improved from .456 (2022) to .385 (2025); Hard Hit% dropped from 28.7% (2019) to 25.1% (2025)
- **Declining Whiff Rates:** FF 23.1% → 18.0%, SL 28.0% → 23.1% (2025) -- suggesting a possible shift toward a weak-contact approach
- **52% Sliders to LHH:** A bold platoon-defying pitch mix against same-side hitters
- **Durability Over 33 Starts:** Only -0.9 mph velocity drop through 7 innings

Kikuchi's career appears to be a compelling case study in how a pitcher can reshape his performance by adjusting his pitch mix. The data suggests that his evolution has been shaped by the influence of different pitching coaches and analytics departments across the four organizations he has been part of.

> **Note:** The 2020 season (9 starts, 795 pitches) and 2024-HOU (10 starts, 971 pitches) have limited sample sizes. Pitch-type and situational breakdowns from these periods should be interpreted with caution.

## Reproduce This Analysis on Google Colab

You can run the full analysis using the notebook below. Change the PITCHER_ID to analyze any other pitcher.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/yasumorishima/mlb-statcast-visualization/blob/main/kikuchi_2019_2025.ipynb)

## References

- [pybaseball (GitHub)](https://github.com/jldbc/pybaseball)
- [Baseball Savant - Yusei Kikuchi](https://baseballsavant.mlb.com/savant-player/yusei-kikuchi-579328)
