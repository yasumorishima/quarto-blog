---
title: "ABS Challenges from Triple-A to MLB: Catchers Win Most, and Batters Who Don't Chase Win More"
published: true
description: What a dataset of every ABS challenge board (Triple-A 2025 to MLB 2026) says about who wins ball-strike challenges
tags: baseball, mlb, statcast, datascience
---

## What ABS challenges are

In 2026 MLB introduced the **ABS (Automated Ball-Strike) challenge system**. The plate umpire still calls every pitch, but the batter, pitcher or catcher can challenge the call, and Hawk-Eye decides.

Triple-A has used it since 2025, and MLB tested it in 2025 spring training. So **challenge records exist for many players before they reached MLB**, and we can ask with real data whether players who challenged well in Triple-A also challenge well in MLB.

I joined Baseball Savant's 15 ABS challenge boards (MLB and Triple-A; batters, pitchers and catchers) on the MLBAM player id and published the result on Kaggle. Here is what it shows.

- Dataset: [ABS Challenges: Triple-A 2025 to MLB 2026](https://www.kaggle.com/datasets/yasunorim/mlb-abs-challenges-aaa-2025-to-mlb-2026) (DOI: [10.34740/kaggle/dsv/20077454](https://doi.org/10.34740/kaggle/dsv/20077454))
- Notebook: [ABS Challenges: Who Wins Them, AAA to MLB](https://www.kaggle.com/code/yasunorim/abs-challenges-who-wins-them-aaa-to-mlb)

> Data as of 2026-09-28. The MLB 2026 regular season is in its final days, so the numbers can still move. Everything below is correlation, not causation.

## The data

- `abs_challenges_players.csv`: 12,130 rows x 211 columns. One row per player per board, including players who never challenged
- `abs_aaa2025_to_mlb2026.csv`: 398 batters and 78 catchers who were on both the Triple-A 2025 and MLB 2026 boards, side by side (176 columns)

Besides Savant's challenge columns, every row carries the player's season stats for the same level and season (MLB StatsAPI) and Statcast aggregates (chase rate, zone swing rate, xwOBA, catchers' zone calls, and more).

## Finding 1: catchers win the most

![Share of challenges won by board](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/abs-share-won.png)

| Board | Challenger | Challenges | Share won (95% interval) |
|---|---|---|---|
| MLB 2026 | Catcher | 5,581 | 58.7% (57.4-59.9%) |
| MLB 2026 | Batter | 4,743 | 48.9% (47.4-50.3%) |
| MLB 2026 | Pitcher | 178 | 39.3% (32.4-46.7%) |
| AAA 2026 | Catcher | 5,349 | 57.9% (56.5-59.2%) |
| AAA 2026 | Batter | 4,433 | 45.0% (43.5-46.4%) |
| AAA 2025 | Catcher | 4,810 | 53.7% (52.3-55.1%) |
| AAA 2025 | Batter | 4,487 | 45.1% (43.6-46.5%) |

- At every level, catchers win about 10 points more often than batters, and the intervals do not overlap
- Pitchers rarely challenge (178 times in MLB 2026) and win least often
- Triple-A catchers went from 53.7% in 2025 to 57.9% in 2026; batters stayed at 45%

Catchers see the pitch closest, right into the glove, and it shows.

## Finding 2: batters who chase less win more challenges

I split MLB 2026 batters (at least 100 plate appearances in Statcast) into thirds by chase rate, the share of pitches outside the zone they swung at.

![Challenge success by chase rate](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/abs-chase-tiers.png)

| Chase rate | Median | Challenges | Share won (95% interval) |
|---|---|---|---|
| Low | 25% | 1,870 | 51.2% (48.9-53.4%) |
| Middle | 30% | 1,521 | 48.3% (45.8-50.8%) |
| High | 37% | 1,185 | 45.6% (42.8-48.4%) |

Per player (320 batters with at least 5 challenges), the rank correlation between chase rate and share won is -0.15 (p = 0.006). **Batters with a good eye also pick better pitches to challenge.**

How **often** a batter challenges, on the other hand, has almost nothing to do with chase rate (rank correlation -0.05, 462 batters). Batters with a good eye do not challenge more.

## Finding 3: a framing proxy that works outside MLB, but it is a different skill

Savant's official framing numbers exist only for MLB. So I computed, per catcher from Statcast, **the share of taken pitches outside the zone that were called strikes**. This can be computed for Triple-A too.

![Proxy vs official framing runs](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/abs-framing-proxy.png)

Against the official framing runs for MLB 2026, the rank correlation is **0.83** (58 catchers), which looks good enough to study Triple-A catchers' framing. (Triple-A has no official framing numbers, so I cannot check that it is as accurate there.)

But the proxy has almost no relation to **challenge skill** (overturns relative to expected): 0.02 for MLB 2026, 0.08 for AAA 2026 and 0.14 for AAA 2025, none significant. Stealing strikes and knowing which calls to overturn look like different skills.

## Finding 4: the habit carries from Triple-A to MLB, the skill is unclear

I compared the same players in Triple-A 2025 and MLB 2026 (at least 5 challenges at both levels: 63 batters, 51 catchers).

![Same batters, Triple-A 2025 vs MLB 2026](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/abs-carryover.png)

| Measure (rank correlation) | Batters (63) | Catchers (51) |
|---|---|---|
| Challenge rate (how often) | 0.38 (p = 0.002) | 0.46 (p < 0.001) |
| Share won | 0.32 (p = 0.010) | 0.21 (p = 0.13) |
| Overturns vs expected (Savant's `overturns_vs_exp`) | 0.05 (p = 0.70) | 0.23 (p = 0.10) |
| (Reference) chase rate | 0.68 | - |

- **How often a player challenges** clearly carries from Triple-A to MLB
- **Share won** also carries for batters, but Savant's **overturns vs expected** (a net count against an average challenger given the same opportunities, which mixes how often and how well a player challenges) is close to zero for batters
- Chase rate itself carries strongly (0.68)

The challenging habit comes with the player from Triple-A. Whether the skill of overturning hard calls is consistent across levels cannot be said with this many players.

## Finding 5: no clear age difference

Among MLB 2026 batters, those 34 and older won 54.4%, higher than the others. But that is only 34 batters and 331 challenges, the interval (49.0-59.7%) overlaps the other age groups, and overturns vs expected per batter shows no ordering by age. There is no clear age effect.

## Summary

- Catchers win the most, about 10 points more than batters
- Batters who chase less win more of their challenges, though they do not challenge more often
- A framing proxy that can be computed for Triple-A matches official framing at 0.83, but it is a different skill from challenging
- How often players challenge carries from Triple-A to MLB; whether challenge skill does is unclear

The dataset has many columns this post does not use (exit velocity, xwOBA, catchers' caught stealing and more). Try your own angle.

- Dataset: https://www.kaggle.com/datasets/yasunorim/mlb-abs-challenges-aaa-2025-to-mlb-2026
- Build code: https://github.com/yasumorishima/kaggle-datasets (`abs-challenges-dataset/`)
- Sources: Baseball Savant and MLB StatsAPI (MLB Advanced Media), collected with my [savant-extras](https://pypi.org/project/savant-extras/) package

*Correction (2026-09-30): an earlier version described overturns vs expected as accounting for the difficulty of the challenged pitches and said older batters were below expected. Savant's expected values are for an average challenger given the player's opportunities, not for the pitches the player chose, and the "below expected" figure mixed two denominators.*
