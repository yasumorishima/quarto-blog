---
title: "Optimizing Marcel Projection Weights for NPB — Grid Search + Bootstrap Validation"
published: true
description: "The conventional Marcel weights (5/4/3) used in npb-prediction aren't optimal for NPB. I ran a 720-combination grid search on 11 years of NPB data and found statistically significant improvements (p=0.003)."
tags: baseball, python, statistics, datascience
canonical_url: https://yasumorishima.github.io/quarto-blog/posts/npb-marcel-weight-optimization/
---

## Background

The [Marcel projection system](https://www.tangotiger.net/marcel/) is a simple but effective player performance forecasting method created by Tom Tango. It uses a weighted average of the last 3 seasons plus regression to the mean.

> **GitHub**: https://github.com/yasumorishima/npb-marcel-weight-study

I've been using these default parameters in [npb-prediction](https://github.com/yasumorishima/npb-prediction) ([blog post](https://dev.to/yasumorishima/npb-prediction-marcel-vs-ml)), but they were originally calibrated for **MLB data**:

| Parameter | Meaning | Previous (MLB Default) |
|---|---|---|
| w0 / w1 / w2 | Weights for N-1 / N-2 / N-3 seasons | 5 / 4 / 3 |
| REG_PA | Regression strength (hitters) | 1200 |
| REG_IP | Regression strength (pitchers) | 600 |

Are these optimal for NPB (Nippon Professional Baseball)? I ran a comprehensive grid search to find out.

## Study Design

### Grid Search

| Target | Search Space | Combinations |
|---|---|---|
| Hitters | w0(3-8) × w1(1-5) × w2(1-4) × REG_PA(6 values) | 720 |
| Pitchers | w0(3-8) × w1(1-5) × w2(1-4) × REG_IP(5 values) | 600 |

### Evaluation

- Cross-validation: 2019–2025 (7 years)
- Two scenarios: **with 2020** (COVID-shortened season) / **without 2020**
- Metric: MAE (Mean Absolute Error)
- Data: 3,780 hitter rows / 3,773 pitcher rows (2015–2025)
- Runtime: ~4.5 hours on GitHub Actions

## Results: Hitters

### OPS MAE — Top 5 (with 2020)

| Weights | REG_PA | OPS MAE |
|---|---:|---|
| **8/4/3** | 2000 | **.06142** |
| 7/3/3 | 2000 | .06142 |
| 7/5/1 | 2000 | .06143 |
| 8/5/1 | 2000 | .06145 |
| 4/3/1 | 1200 | .06146 |

Previous (5/4/3, REG_PA=1200): **.06227 — ranked 224th out of 720**

Improvement: .06227 → .06142 = **1.37% MAE reduction**

### Optimal Weights Differ by Metric

| Metric | Best Weights | REG_PA | MAE |
|---|---|---:|---|
| AVG | 3/2/4 | 1500 | .02160 |
| OBP | 7/3/3 | 1500 | .02449 |
| SLG | 4/3/1 | 1000 | .04200 |
| OPS | 8/4/3 | 2000 | .06142 |

AVG favors the N-3 season (stability), while SLG minimizes it (recency). The optimal parameters align with each metric's characteristics.

## Results: Pitchers

### ERA MAE — Top 5 (with 2020)

| Weights | REG_IP | ERA MAE | WHIP MAE |
|---|---:|---|---|
| **4/5/2** | 800 | **.68171** | .13065 |
| 3/4/1 | 800 | .68172 | .13103 |
| 3/4/1 | 600 | .68228 | .13068 |
| 3/4/2 | 800 | .68304 | .13099 |
| 3/3/2 | 800 | .68312 | .13118 |

Previous (5/4/3, REG_IP=600): **.69105 — ranked 75th out of 600**

Improvement over previous: 1.35% (with 2020) / 1.53% (without 2020)

## Bootstrap Validation

300 bootstrap resamples to test if the improvement is statistically significant.

**Hitter OPS (optimal 8/4/3 reg=2000 vs previous 5/4/3 reg=1200):**

| Statistic | Value |
|---|---|
| Mean improvement | 0.00084 |
| 95% CI | [0.00022, 0.00147] |
| best > default | 99.7% |
| p-value | **0.003** |

The lower bound of the 95% CI is above zero — **statistically significant** (p < 0.01).

## Key Findings: NPB vs MLB

### Hitters: Strong N-1 Bias + Stronger Regression

| Feature | Previous | NPB Optimal |
|---|---|---|
| N-1 (most recent) weight | 5 | **8** |
| N-3 weight | 3 | **1–3** |
| Regression (REG_PA) | 1200 | **2000** |

The simultaneous increase in both w0 and REG_PA seems contradictory but is actually coherent:
- **w0=8**: Emphasize the N-1 season in the weighted average
- **REG_PA=2000**: Pull extreme performances back to the mean more aggressively

In NPB data, this "trust trends but don't trust extremes" combination proved optimal.

### Pitchers: N-2 Season is Most Predictive

| Feature | Previous | NPB Optimal |
|---|---|---|
| N-1 (most recent) weight | 5 | **3–4** |
| N-2 weight | 4 | **4–5** |
| N-3 weight | 3 | **1–2** |
| Regression (REG_IP) | 600 | **800** |

The most striking finding: **w1 (N-2 season) is larger than w0 (N-1 season)**. This contradicts the conventional assumption that the most recent season is always most important.

Incorporating the N-2 season helps smooth out temporary fluctuations.

## Recommended Parameters

| Target | Weights | Regression | Evidence |
|---|---|---|---|
| Hitters | **8/4/3** | REG_PA=**2000** | Bootstrap p=0.003 |
| Pitchers | **4/5/2** | REG_IP=**800** | Optimal for both ERA and WHIP across scenarios |

These parameters will be applied to [npb-prediction](https://github.com/yasumorishima/npb-prediction).

## Reproducibility

Code and all result CSVs are available at [npb-marcel-weight-study](https://github.com/yasumorishima/npb-marcel-weight-study).

## Summary

- The conventional Marcel weights (5/4/3) are **not optimal for NPB**
- Hitters: strong N-1 weight (w0=8) + stronger regression (REG_PA=2000)
- Pitchers: N-2 season is more predictive than N-1 (most recent)
- Bootstrap test confirms significance at **p=0.003**

Marcel is simple, but there's room for improvement when you calibrate parameters to your league.

---

> **Data sources**: [baseball-data.com](https://baseball-data.com) / [npb.jp](https://npb.jp)
> **GitHub**: https://github.com/yasumorishima/npb-marcel-weight-study
