---
title: "Did Adding Stadium Correction Improve My NPB Baseball Predictions? — A Full Backtest Comparison"
published: true
description: "I added park factor correction to my Marcel+Stan Bayesian NPB standings model. Win MAE didn't change — but here's why that's expected, and what actually improved."
tags: baseball, python, bayesian, datascience
cover_image:
canonical_url:
---

## Introduction

This is a follow-up to my NPB (Nippon Professional Baseball) standings prediction series. I added **park factor correction** to the existing Marcel+Stan Bayesian system and ran a full backtest (2018–2025, 96 team-seasons) to measure the impact.

Previous articles:
- [Beyond Marcel: Adding Bayesian Regression to NPB Baseball Predictions](https://dev.to/yasumorishima/beyond-marcel-adding-bayesian-regression-to-npb-baseball-predictions-a-15-step-journey-1b4f)
- [I Calculated NPB Park Factors for 10 Years — Stadium Renovations Revealed](https://dev.to/yasumorishima/npb-park-factors)

**GitHub**: [npb-bayes-projection](https://github.com/yasumorishima/npb-bayes-projection)

---

## Key Terms (for first-time readers)

| Term | Meaning |
|---|---|
| **Marcel method** | Predicts next year's stats using a weighted 3-year average (weights: 5:4:3, recent years weighted higher) |
| **Bayesian prediction (Stan)** | Estimates probability distributions from data, capturing uncertainty in predictions |
| **Park factor** | Measures how much a stadium inflates or suppresses scoring. 1.0 = neutral; >1.0 = hitter-friendly; <1.0 = pitcher-friendly |
| **Pythagorean win%** | Estimates win% from runs scored (RS) and allowed (RA): `RS^1.83 / (RS^1.83 + RA^1.83)` |
| **MAE** | Mean Absolute Error — average prediction miss. Lower is better |
| **80% CI** | 80% confidence interval — the range where actual values fall 80% of the time |

---

## Why Park Factor Correction?

Marcel predicts player stats from their past 3 years. The problem: **those stats embed the home stadium's environment**.

- **Vantelin Dome (Chunichi Dragons)**: PF_5yr = 0.844 → heavily pitcher-friendly
- **ES CON Field (Nippon Ham)**: PF_5yr = 1.147 → hitter-friendly

A Vantelin pitcher's ERA looks better partly because of the park. Using those raw stats to project team runs allowed (RA) will underestimate RA compared to a neutral stadium.

### The correction formula

```python
# (PF + 1.0) / 2.0 = average of home and away
# Players play half games at home, half away
pf_factor = (PF_5yr + 1.0) / 2.0
rs_adjusted = rs_raw / pf_factor   # normalize runs scored to neutral park
ra_adjusted = ra_raw / pf_factor   # normalize runs allowed to neutral park
```

---

## Results (2018–2025, 96 team-seasons)

### Win MAE didn't change — here's why

| Metric | No correction | 5yr avg PF | Change |
|---|---|---|---|
| Win MAE | 6.41 | 6.41 | **±0.00** |
| Win Bias | +2.69 | +2.70 | +0.01 |
| 80% CI coverage | 86.5% | **87.5%** | **+1.0%** |

MAE didn't move at all. The reason is **structural**:

```
After correction: RS_adj = RS / factor,  RA_adj = RA / factor
Pythagorean: RS^exp / (RS^exp + RA^exp)
```

When you divide both RS and RA by the same factor, the **ratio is preserved**. Pythagorean win% depends on the ratio — so win predictions barely change.

The **80% CI coverage improved from 86.5% to 87.5%**. Removing the park bias makes the prediction distribution slightly more reliable, even when the point estimate stays the same.

---

### RS and RA accuracy improved significantly

| Metric | No correction | 5yr avg PF | Change |
|---|---|---|---|
| RS MAE (runs scored) | 101.1 | 74.8 | **-26.3** |
| RA MAE (runs allowed) | 97.5 | 73.0 | **-24.5** |

The absolute-value accuracy of run predictions improved substantially. This doesn't directly affect win predictions, but it matters for **player valuation and roster construction analysis**.

---

### Year-by-year breakdown

| Year | Win MAE (no PF) | Win MAE (5yr PF) | Change |
|---|---|---|---|
| 2018 | 6.18 | 6.18 | ±0.00 |
| 2019 | 3.90 | 3.90 | ±0.00 |
| 2020 | 6.27 | 6.28 | +0.01 |
| 2021 | 10.33 | 10.33 | ±0.00 |
| 2022 | 5.13 | 5.12 | -0.01 |
| 2023 | 6.88 | 6.89 | +0.01 |
| 2024 | 6.69 | 6.71 | +0.02 |
| 2025 | 5.90 | 5.90 | ±0.00 |

The 2021 spike (MAE = 10.33) reflects Yakult and Orix going from last place to champions — an exceptional event unrelated to park factors.

---

## Single-Year PF vs. 5-Year Average: Which Is Better?

I tested two variants of park factor:

- **Single-year PF**: calculated from one season only — higher noise
- **PF_5yr**: 5-year rolling average with renovation breakpoints — smoother

| Metric | No PF | Single-year PF | 5-year avg PF |
|---|---|---|---|
| Win MAE | 6.41 | 6.41 | 6.41 |
| RS MAE | 101.1 | 74.8 | 74.8 |
| RA MAE | 97.5 | 73.0 | 73.0 |
| 80% CI coverage | 86.5% | 86.5% | **87.5%** |

RS/RA accuracy improved equally with both. The **only difference is CI coverage** — single-year PF is too noisy to improve the prediction interval. The 5-year average's smoothing is what improves reliability.

---

## Focus: Nippon Ham and ES CON Field Opening (2023)

In 2023, Nippon Ham moved from Sapporo Dome to ES CON Field — a brand-new ballpark.

| Year | Single-year PF | 5yr avg PF | Predicted W | Actual W | Error |
|---|---|---|---|---|---|
| 2022 (last at Sapporo) | 0.949 | 0.967 | 68.2 | 59 | +9.2 |
| **2023 (ES CON opens)** | **0.969** | **0.969** | 65.4 | 60 | +5.4 |
| 2024 | **1.212** | 1.089 | 69.0 | 75 | -6.0 |
| 2025 | **1.271** | 1.147 | 73.4 | 83 | -9.6 |

**Opening year (2023)**: single-year and 5-year PF happen to match (0.969). The 5-year average was still dominated by Sapporo Dome data.

**2024–2025**: the gap widens. ES CON is clearly hitter-friendly (PF > 1.2), but the 5-year average is still held down by Sapporo Dome history. Win predictions don't change between methods — confirming the structural argument above.

---

## Summary

| Finding | Result |
|---|---|
| Win MAE | No change (structurally cannot change) |
| RS/RA MAE | **-26 / -25 runs** improvement |
| 80% CI coverage | **+1.0%** (5-year average only) |
| Single-year vs. 5-year PF | Same accuracy; 5-year wins on CI reliability |

The unchanging win MAE isn't a failure — it's by design. The Pythagorean formula preserves the RS/RA ratio when both are scaled by the same factor.

Park factor correction improves **prediction interval reliability** and **absolute run accuracy**, which matters for player analysis even when the win total doesn't shift.

As ES CON and renovated stadiums like Vantelin Dome (2026: HR wing) and Rakuten Mobile Park (2026: fence moved in) accumulate data, the gap between single-year and 5-year PF will grow. That's when the choice of smoothing method will matter more.

---

## Related Articles

- [Beyond Marcel: Adding Bayesian Regression to NPB Baseball Predictions](https://dev.to/yasumorishima/beyond-marcel-adding-bayesian-regression-to-npb-baseball-predictions-a-15-step-journey-1b4f)
- [I Calculated NPB Park Factors for 10 Years — Stadium Renovations Revealed](https://dev.to/yasumorishima/npb-park-factors)
- [I Added Park Factor Correction to My NPB Bayesian Prediction Model](https://dev.to/yasumorishima/npb-bayes-park-factors)
