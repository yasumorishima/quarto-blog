---
title: "Yu Darvish's Pitching Evolution (2021-2025): A Statcast Data Analysis"
published: true
description: Analyzing Yu Darvish's pitch mix, velocity, and whiff rate changes over 5 seasons with Statcast data
tags: baseball, mlb, statcast, datascience
---

## Introduction

In November 2025, Yu Darvish underwent UCL (ulnar collateral ligament) surgery, ruling him out for the entire 2026 season.

Over his five years with the San Diego Padres (2021-2025), his game appearances declined from 30 to 15. Looking at the Statcast data from this period, the numbers suggest significant shifts in his pitch mix and pitching style.

In this article, I use pybaseball + DuckDB to pull five seasons of Statcast data and examine how his pitch selection, velocity, and whiff rates changed over time. **Note:** This is purely a data-driven exploration of observable trends -- it is not intended to make definitive claims about the pitcher's intentions or decision-making.

> The Google Colab notebook used for this analysis is linked at the bottom of the article.

## Five-Year Timeline

Before diving into the data, here is a brief timeline of key events during this period.

| Year | Age | Games | Pitches | Notes |
|---|---|---|---|---|
| 2021 | 34-35 | 30 | 2,773 | First season with the Padres |
| 2022 | 35-36 | 30 | 2,971 | Peak FF velocity (95.0 mph) |
| 2023 | 36-37 | 24 | 2,219 | Participated in WBC for Japan (Feb camp onward) -- delayed season start. Shut down in August with olecranon stress reaction |
| 2024 | 37-38 | 16 | 1,264 | Multiple injuries (neck, hip, elbow). Placed on restricted list (family matters). Returned in September |
| 2025 | 38-39 | 15 | 1,160 | Started season on IL with right elbow inflammation. Returned in July after 269 days. UCL surgery in November |

Elbow-related injuries have been a recurring theme since 2023. Let's see what changes appear in the data from this period.

## Data Collection

```python
from pybaseball import statcast_pitcher
import duckdb

PITCHER_ID = 506433  # Yu Darvish
YEARS = [2021, 2022, 2023, 2024, 2025]

dfs = []
for year in YEARS:
    df_year = statcast_pitcher(f'{year}-03-01', f'{year}-12-31', PITCHER_ID)
    df_year['season'] = year
    dfs.append(df_year)

df_raw = pd.concat(dfs, ignore_index=True)

# Regular season only
con = duckdb.connect()
df = con.execute("SELECT * FROM df_raw WHERE game_type = 'R'").df()
# -> 10,387 pitches (5 seasons combined)
```

> **Important:** Filtering by `game_type = 'R'` is necessary to exclude spring training and postseason data.

## Pitch Mix Changes

Here is how his pitch usage rates shifted over five seasons.

| Pitch | 2021 | 2022 | 2023 | 2024 | 2025 | Change |
|---|---|---|---|---|---|---|
| SL (Slider) | 31.0% | 31.5% | 17.7% | 23.3% | 14.9% | -16.1% |
| ST (Sweeper) | 22.8% | 15.4% | 18.6% | 14.0% | 9.1% | -13.7% |
| FF (Four-Seam) | 22.1% | 25.5% | 16.7% | 18.4% | 16.0% | -6.1% |
| SI (Sinker) | 8.3% | 8.5% | 18.6% | 17.1% | 20.0% | +11.7% |
| CU (Curveball) | 4.6% | 4.0% | 5.0% | 8.6% | 15.4% | +10.8% |
| FC (Cutter) | 2.5% | 4.3% | 8.9% | 4.6% | 12.2% | +9.7% |
| FS (Splitter) | 4.9% | 7.4% | 7.7% | 4.0% | 10.6% | +5.7% |

In 2021, slider (31%) + sweeper (23%) = 54% of all pitches, making horizontal breaking balls the core of his arsenal.

By 2025, that combined share had dropped to 24%, while sinker (20%), curveball (15%), and cutter (12%) usage all increased.

### The 2023 Shift

The 2023 data stands out. SL usage dropped from 31.5% to 17.7%, while SI jumped from 8.5% to 18.6%. That season was marked by a delayed start due to WBC participation and an August shutdown for an olecranon stress reaction, both of which may have contributed to the shift in pitch selection.

Generally speaking, sliders and sweepers are considered to put relatively more stress on the elbow. Sinkers, by contrast, involve a more natural arm motion, and curveballs rely more on speed differential. This shift could reflect an adjustment for elbow health, though strategic pitch-sequencing decisions and other factors may also be at play.

## Velocity Trends

While the pitch mix changed substantially, average velocities for each pitch type remained relatively stable.

| Pitch | 2021 | 2022 | 2023 | 2024 | 2025 | Change |
|---|---|---|---|---|---|---|
| FF | 94.5 | 95.0 | 94.7 | 94.1 | 93.9 | -0.6 mph |
| SI | 94.0 | 94.7 | 94.3 | 93.6 | 93.4 | -0.6 mph |
| SL | 86.2 | 86.0 | 85.7 | 85.9 | 85.7 | -0.5 mph |

A decrease of 0.6 mph on the four-seam over five years is not particularly dramatic. The pitch mix changes appear to be driven by factors other than velocity loss -- possibly condition management, strategic adjustments, or a combination of both.

## Velocity by Inning

While average velocity held up, the pattern of velocity drop-off as games progressed tells a different story.

| Year | 1st Inning | Final Inning | Change | Latest Inning with Data |
|---|---|---|---|---|
| 2021 | 94.5 | 95.0 | +0.5 | 7th |
| 2022 | 94.9 | 94.4 | -0.5 | 8th |
| 2023 | 94.9 | 93.7 | -1.2 | 7th |
| 2024 | 94.4 | 93.3 | -1.1 | 7th |
| 2025 | 94.2 | 92.8 | -1.4 | 6th |

In 2021, Darvish maintained his velocity through seven innings. By 2025, the data shows a 1.4 mph drop by the sixth inning. That said, the 2024-2025 data includes starts made shortly after returning from injury, which likely affects these numbers.

## Whiff Rate Changes

Whiff rate = swinging strikes / total swings (whiffs + fouls + balls in play).

| Pitch | 2021 | 2022 | 2023 | 2024 | 2025 |
|---|---|---|---|---|---|
| FF | 30.0% | 19.4% | 15.4% | 13.0% | 14.3% |
| CU | 29.2% | 26.8% | 44.0% | 41.1% | 33.8% |
| FS | 31.9% | 34.4% | 38.9% | 34.5% | 26.6% |
| SL | 26.2% | 24.4% | 22.7% | 26.6% | 18.3% |
| ST | 21.2% | 24.2% | 25.8% | 25.0% | 32.6% |

The four-seam whiff rate declined from 30.0% to 14.3%, while the curveball's whiff rate peaked at 44.0% in 2023. The shift in which pitches generated the most swings and misses appears to correlate with the changes in pitch selection.

## Pitch Selection with Two Strikes

The same trend is visible in his two-strike pitch selection.

| Year | 1st | 2nd | 3rd |
|---|---|---|---|
| 2021 | ST 25.6% | FF 24.4% | SL 15.4% |
| 2022 | FF 32.8% | FS 17.6% | ST 16.1% |
| 2023 | FF 22.4% | FS 17.9% | SI 15.6% |
| 2024 | FF 21.2% | SL 19.9% | ST 15.1% |
| 2025 | CU 21.8% | FS 17.2% | FF 15.1% |

In 2021-2022, the four-seam and sweeper were his primary putaway pitches. By 2025, the curveball had become his most-used two-strike offering.

## Summary

Across Yu Darvish's five seasons with the Padres, the Statcast data reveals the following trends:

- **Pitch mix**: A gradual shift from slider/sweeper-heavy (2021-2022) to sinker/curveball/cutter-heavy (2024-2025)
- **Velocity**: Average velocity for each pitch type declined only about 0.5-0.6 mph over five years
- **Velocity by inning**: Late-inning velocity drop-off appears to have increased year over year
- **Whiff rate**: Four-seam whiff rate declined, while curveball whiff rate increased
- **Putaway pitch**: Two-strike pitch selection shifted from four-seam/sweeper to curveball

The changes seem to have accelerated around 2023, coinciding with his WBC participation and the olecranon stress reaction. The data suggests that changes in physical condition may have influenced his pitch selection over time.

> **Note:** The 2024 (16 games) and 2025 (15 games) seasons have small sample sizes, so the numbers should be interpreted with caution. Whiff rates for less frequently thrown pitches are especially volatile with fewer observations. Additionally, the data includes starts made shortly after injury rehabilitation, which may not reflect typical performance levels.

## Reproduce This Analysis on Google Colab

You can run the full analysis using the notebook below. Change `PITCHER_ID` or `YEARS` to apply the same analysis to other pitchers.

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/yasumorishima/mlb-statcast-visualization/blob/main/darvish_evolution_2021_2025.ipynb)

## References

- [pybaseball GitHub Repository](https://github.com/jldbc/pybaseball)
- [Baseball Savant](https://baseballsavant.mlb.com/)
