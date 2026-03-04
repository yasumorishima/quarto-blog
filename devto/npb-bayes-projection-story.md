---
title: "Beyond Marcel: Adding Bayesian Regression to NPB Baseball Predictions — A 15-Step Journey"
published: true
description: "How I tried to beat the Marcel projection system for NPB (Japanese pro baseball) using Stan/Ridge regression with K%/BB%/BABIP features, and what I learned about the structural limits of public baseball data."
tags: baseball, python, bayesian, datascience
cover_image:
canonical_url:
---

## Introduction

In a previous project, I built an NPB (Nippon Professional Baseball) player projection system using the **Marcel method** — a simple "3-year weighted average + regression to the mean" approach.

- **GitHub**: [npb-prediction](https://github.com/yasumorishima/npb-prediction)

Marcel performed surprisingly well: it beat ML models (LightGBM/XGBoost) for pitcher ERA prediction. But it had clear limitations:

| Limitation | Marcel's approach |
|---|---|
| New foreign players | Use league average (can't use previous league stats) |
| Point estimates only | No uncertainty quantification |
| Uniform age adjustment | +0.3%/year for all players |
| Ignores skill metrics | Can't leverage K% or BB% |

To address these, I started a new project: **Bayesian regression on top of Marcel**.

- **GitHub**: [npb-bayes-projection](https://github.com/yasumorishima/npb-bayes-projection)

Here's what happened over 15 steps.

---

## Step 1: Foreign Player Conversion Factors

NPB teams sign foreign players every year. If we can convert their previous-league stats to NPB scale, we should beat league-average predictions.

### What I did

1. **Identified 365 foreign players** in NPB (2015-2025)
2. **Matched 231 to FanGraphs** using name normalization
3. **Computed conversion ratios**:

| League | wOBA ratio (hitters) | ERA ratio (pitchers) | n |
|---|---|---|---|
| MLB→NPB | 1.235 | 0.579 | 56 / 74 |
| AAA→NPB | 1.271 | 0.462 | 9 / 6 |

Hitter wOBA improves ~24%, pitcher ERA improves ~42% — reflecting the level difference between MLB and NPB.

### Lesson

**Raw conversion factors performed worse than the baseline (league average).** wOBA/ERA are "outcome metrics" heavily dependent on environment. I pivoted to using them as priors in a Bayesian model.

---

## Steps 2-4: From PyMC to Stan — Discovering Skill Metrics

### PyMC Hierarchical Model (failed)

Learned a shrinkage weight w ≈ 0.12, essentially ignoring previous-league stats.

### Stan v1 — K%/BB% Features (success)

The key insight: **K% and BB% are environment-independent skill metrics**, unlike wOBA/ERA.

```
Hitter: npb_wOBA = lg_avg + β_woba·z_woba + β_K·z_K + β_BB·z_BB + noise
Pitcher: npb_ERA = lg_avg + β_era·z_era + β_fip·z_fip + β_K·z_K + β_BB·z_BB + noise
```

Results (2020-2025 backtest):

| Model | MAE | Baseline | Improvement |
|---|---|---|---|
| Hitter v0 (wOBA only) | 0.0330 | 0.0337 | -2.1% |
| **Hitter v1 (+K%/BB%)** | **0.0325** | 0.0337 | **-3.8%** |
| Pitcher v0 (ERA only) | 0.749 | 0.749 | ±0% |
| **Pitcher v1 (+K%/BB%/FIP)** | **0.736** | 0.749 | **-1.7%** |

---

## Steps 5-6: Data Enrichment & Team Projections

### Data Growth
- Master database: 365 → **393 players**
- FanGraphs matches: 231 → **253**
- Hitter improvement: -3.8% → **-5.1%**

### Monte Carlo Team Simulation

1. Add per-player noise (σ = Marcel backtest MAE)
2. Aggregate team RS/RA
3. Pythagorean expectation (exp=1.83) → win totals
4. Repeat 10,000 times

**Backtest (2018-2025, 96 team-seasons): MAE = 6.41 wins, 80% CI coverage = 86.5%**

---

## Steps 7-9: Japanese Player Stan Model — The Real Challenge

Foreign players are ~90/year. The real target was **1,300+ Japanese players**.

### Model Design

```
Hitter: actual_wOBA = Marcel_wOBA + δ_K·z_K + δ_BB·z_BB + δ_BABIP·z_babip + noise
Pitcher: actual_ERA = Marcel_ERA + δ_K·z_K + δ_BB·z_BB + noise
```

Key finding: **K%/BB% are already embedded in wOBA** (BB is a direct component). Instead, **BABIP** (luck component) provided the signal — high BABIP regresses the following year.

### Scaling Fix

Independent RS/RA scaling was canceling Stan's systematic improvements. Developed **marcel_anchored scaling**: ΔMAE improved from -0.063 to **-0.154** (2.4x better).

---

## Steps 10-11: Pursuing Statistical Significance

Used Ridge regression to approximate the Stan Bayesian model for fast LOO-CV.

### Player-Level (2018-2025)

| Metric | n | Marcel MAE | Stan MAE | p-value | Bootstrap |
|---|---|---|---|---|---|
| Hitter wOBA | 2,208 | 0.05023 | **0.04980** | 0.060 | 97.1% |
| Pitcher ERA | 2,164 | 1.23008 | **1.22241** | 0.057 | 97.1% |

### The 5-Feature Discovery

Adding K/9 and BB/9 to the pitcher model:

| Model | p-value | Bootstrap |
|---|---|---|
| ERA (3 features: K%, BB%, age) | 0.607 | 68.9% |
| **ERA (5 features: +K/9, BB/9)** | **0.012** | **99.3%** |

K% (per plate appearance) and K/9 (per inning) carry different information — using both captures pitcher skill more accurately.

---

## Steps 12-14: Improving Team Predictions

1. **FA attribution fix**: Assign traded players to correct teams
2. **League-average imputation**: Fill uncovered PA/IP with league averages
3. **Coverage improvement**: Added 14 missing birthdays → PA_cov +2pp
4. **4 new features**: pa_stability, ip_stability, prev_babip_p, prev_woba_dev_sq

---

## Step 15: Hitting the Ceiling

### The Paradox

- **Player-level**: Stan > Marcel (p=0.06, Bootstrap 97%)
- **Team-level**: Stan < Marcel (+0.198W worse)

### Root Cause: PA-Weighted Aggregation

| Quartile | PA Range | Stan Win Rate |
|---|---|---|
| Q1 (low PA) | 30-64 | **55%** (Stan strongest) |
| Q2 | 65-157 | 46% |
| Q3 | 158-361 | 44% |
| Q4 (high PA) | 362-685 | 49% |

**Stan excels for low-PA players where Marcel is unreliable, but team RS is PA-weighted — Q4 (regulars) dominates.** For regulars, Marcel's 3-year weighted average is already quite accurate, leaving little room for K%/BB%/BABIP corrections.

### min_pa_team Sweep

| min_pa_team | Marcel MAE | Stan MAE | Δ |
|---|---|---|---|
| 0 (current) | 6.725 | 6.923 | +0.198 |
| 50 | 6.682 | 6.903 | +0.221 |
| 100 | 6.644 | 6.868 | +0.224 |

Filtering low-PA players improves Marcel but worsens the Stan-Marcel gap. The structural problem can't be solved by filtering.

---

## Conclusions

### Final Results

| Level | Marcel MAE | Stan MAE | Verdict |
|---|---|---|---|
| Player (wOBA) | 0.05023 | **0.04980** | Stan better (p=0.06) |
| Player (ERA) | 1.23008 | **1.22241** | Stan better (p=0.06) |
| Team (wins) | **6.725** | 6.923 | Marcel better |

### Four Takeaways

1. **Marcel is a remarkably strong baseline.** The 3-year weighted average is highly accurate for regular players.
2. **K%/BB% are valuable as environment-independent skill metrics**, especially for low-PA players and cross-league comparisons.
3. **Player-level improvements don't automatically translate to team-level gains.** PA-weighted aggregation is dominated by high-PA players where Marcel is already strong.
4. **Without batted-ball quality data (barrel rate, exit velocity, whiff rate), the next wall can't be broken.**

### What's Next

The plan is to apply these learnings to MLB, where **Statcast data** provides the batted-ball and pitch-quality metrics that NPB's public data lacks.

---

Data sources: [Baseball Data Freak](https://baseball-data.com), [NPB Official](https://npb.jp)
