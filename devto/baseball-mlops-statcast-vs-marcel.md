---
title: "Can Statcast Data Improve MLB Player Performance Predictions? — Beating Marcel with LightGBM"
published: true
description: "I tried to beat the Marcel projection system using MLB Statcast tracking data (exit velocity, barrel rate, Whiff%, Stuff+). Here's what happened: +12.1% improvement for batters, +4.0% for pitchers."
tags: baseball, python, machinelearning, mlops
cover_image:
canonical_url:
---

## Introduction

This article is a continuation of my NPB Bayesian prediction series. Along the way, I reached a conclusion:

> **"Without tracking data like Statcast, we can't break through the next wall."**

In my NPB project, I added Bayesian regression (Stan/Ridge) on top of Marcel projections. At the player level there was consistent improvement (p=0.06), but at the team level the gains disappeared. The reason: Marcel's 3-year weighted average is already accurate for high-PA regulars, leaving no margin for improvement using only aggregate stats like K%/BB%/BABIP.

MLB has **Statcast**. This article tests whether Statcast tracking features can beat Marcel.

> **GitHub**: https://github.com/yasumorishima/baseball-mlops
> **Streamlit**: https://baseball-mlops.streamlit.app/

---

## What is Marcel?

Marcel is a simple projection system from the 1980s: weighted average of the past 3 years (weights 5:4:3) + regression to the mean + age adjustment. Despite its simplicity, it's remarkably accurate — especially for regular players with large sample sizes.

---

## Data & Features

- **Source**: pybaseball (FanGraphs + Baseball Savant)
- **Target**: MLB batters (PA≥100) / pitchers (IP≥30)
- **Period**: 2015-2024 (training), 2025 (evaluation)

### Batter Features (38)

| Category | Features |
|---|---|
| Statcast | EV, Barrel%, xwOBA, Sprint Speed, Launch Angle, EV95% |
| FanGraphs | HardHit%, Contact%, O-Swing%, SwStr% |
| 1-year lag delta | wOBA change, xwOBA change, K% change, BB% change, Barrel% change |
| **2-year trend (v7)** | **2-year wOBA direction (rising/falling)** |
| Engineered (v7) | **age_from_peak** (distance from peak age 29), **park_factor**, **team_changed**, pa_rate |
| Interaction | age × (xwOBA − wOBA) — luck sensitivity by age |
| Stacking | lgb_delta (LightGBM OOF residual) |

### Pitcher Features (35)

| Category | Features |
|---|---|
| Statcast | K%, BB%, Whiff%, CSW%, SwStr%, Barrel%, EV |
| Stuff | Stuff+, Location+, Pitching+, Velo, Spin Rate |
| 1-year lag delta | xFIP change, K% change, BB% change, K-BB% change |
| **2-year trend (v7)** | **2-year xFIP direction** |
| Engineered (v7) | **age_from_peak**, **park_factor**, **team_changed**, ip_rate, FIP-ERA gap |
| Interaction | age × K-BB% |
| Stacking | lgb_delta |

The park factor work from the NPB series was carried over into baseball-mlops as a `park_factor` feature — the same methodology, now applied to MLB stadiums.

---

## Model

Three models combined:

1. **Marcel** (baseline): 3-year weighted avg + regression to mean + age adjustment
2. **LightGBM**: Optuna 1000-trial hyperparameter optimization (time-series expanding-window CV)
3. **Bayes correction (ElasticNet)**: Predicts Marcel residuals using Statcast features, adds 80% CI
   - Recency Decay: samples weighted by 0.85/year (recent seasons count more)
   - LightGBM OOF predictions used as stacking feature
4. **Ensemble**: Marcel×31% + LightGBM×33% + Bayes×36% (auto-weighted by inverse MAE)

### Backtest Design

2025 is a **strict holdout** — never seen by Optuna or CV:

```
2015-2019: Initial training
2020-2024: Time-series expanding-window CV (Optuna tuning)
2025:      Strict holdout (no leakage)
```

---

## Results

### 2025 Strict Holdout

| | Marcel MAE | ML MAE | Improvement |
|---|---|---|---|
| Batter wOBA | 0.0331 | **0.0291** | **+12.1%** |
| Pitcher xFIP | 0.5038 | **0.4837** | **+4.0%** |

CV results (batter 0.0281 / pitcher 0.521) are consistent with holdout — no overfitting detected.

### Year-by-Year Backtest

| Year | Batter ML | Marcel | | Pitcher ML | Marcel | |
|---|---|---|---|---|---|---|
| 2020 | 0.0359 | 0.0371 | ✓ +3.2% | 0.595 | 0.618 | ✓ +3.7% |
| 2021 | 0.0293 | 0.0317 | ✓ +7.6% | 0.542 | 0.553 | ✓ +1.9% |
| 2022 | 0.0296 | 0.0330 | ✓ +10.3% | 0.578 | 0.569 | ✗ -1.5% |
| 2023 | 0.0277 | 0.0303 | ✓ +8.7% | 0.535 | 0.559 | ✓ +4.3% |
| 2024 | 0.0280 | 0.0333 | ✓ +16.0% | 0.509 | 0.522 | ✓ +2.5% |
| **2025** | **0.0291** | **0.0331** | **✓ +12.1%** | **0.484** | **0.504** | **✓ +4.0%** |

Batters: 6/6 wins. Pitchers: 5/6 wins (2022 loss likely due to limited training data — only COVID-shortened 2020-2021).

---

## Why Does Statcast Help?

The Bayes (ElasticNet) model predicts Marcel's residuals using Statcast features. Larger coefficients = more information Marcel is missing.

### Batters

| Feature | Coef | Interpretation |
|---|---|---|
| Max EV | +0.0046 | Peak hitting power — Marcel can't see this |
| Contact% | +0.0040 | Finer skill signal than K% alone |
| BB% | +0.0038 | Additional plate discipline information |
| xwOBA | +0.0037 | Luck-removed true hitting ability |

### Pitchers

| Feature | Coef | Interpretation |
|---|---|---|
| Pitching+ | -0.0892 | Overall stuff quality → lower future xFIP |
| K% | -0.0631 | High strikeout rate outperforms Marcel forecast |
| SwStr% | -0.0346 | Swing-and-miss ability |
| Stuff+ | -0.0279 | Velocity + movement + spin combined |

Marcel's ERA/xFIP carries luck components. **Statcast's stuff metrics (Stuff+/Pitching+) reflect skill stripped of luck, which is why they add predictive signal.**

---

## MLOps Pipeline

```
Every Monday JST 11:00 (GitHub Actions cron)
  ↓
fetch_statcast.py (pybaseball → Statcast CSV)
  ↓
train.py (LightGBM + Optuna 1000 trials + Bayes correction)
  ↓
W&B Model Registry (MAE comparison → auto-promote "production" tag)
  ↓
FastAPI (polls W&B every 6h → auto-loads latest model)
```

The FastAPI server polls W&B every 6 hours and automatically loads the new model when the `production` tag is updated — **no container restart needed**.

---

## Looking Ahead: NPB Hawk-Eye

NPB installed Hawk-Eye tracking in all 12 stadiums in 2024. Once data becomes publicly available (expected 2026+), this pipeline can be transplanted directly.

| baseball-mlops | NPB Hawk-Eye version |
|---|---|
| pybaseball | NPB Hawk-Eye API |
| EV / Barrel% / xwOBA | Equivalent metrics |
| MLB Marcel | NPB Marcel |
| LightGBM + Bayes | Same architecture |

---

## Summary

| | NPB Bayesian project | baseball-mlops (MLB) |
|---|---|---|
| Data | K%/BB%/BABIP (aggregate stats) | Statcast (tracking) |
| Marcel improvement | Marginal (p=0.06) | **+12.1% (batters) / +4.0% (pitchers)** |
| Year-by-year wins | — | Batters 6/6, Pitchers 5/6 |

The reason Statcast works: Marcel's 3-year weighted average can't see **contact quality or pitch stuff**. Exit velocity, barrel rate, and Stuff+ directly measure those dimensions that aggregate stats miss.

Data: [Baseball Savant](https://baseballsavant.mlb.com/) / [FanGraphs](https://www.fangraphs.com/) via pybaseball
