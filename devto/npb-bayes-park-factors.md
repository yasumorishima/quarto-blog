---
title: "I Added Park Factor Correction to My NPB Bayesian Prediction Model — Backtest Validation & 2026 Forecast"
published: true
description: "How adding park factor (PF) correction to a Marcel+Stan Bayesian NPB standings simulation affected accuracy across 8 seasons (2018-2025), and the resulting 2026 predictions."
tags: baseball, python, bayesian, datascience
cover_image:
canonical_url:
---

## Introduction

In a previous project, I built an NPB (Nippon Professional Baseball) standings prediction system combining the **Marcel method** with **Stan Bayesian regression**.

- **GitHub**: [npb-bayes-projection](https://github.com/yasumorishima/npb-bayes-projection)
- **Previous article**: [Beyond Marcel: Adding Bayesian Regression to NPB Baseball Predictions](https://dev.to/yasumorishima/beyond-marcel-adding-bayesian-regression-to-npb-baseball-predictions-a-15-step-journey-1b4f)

This time, I added **park factor (PF) correction** to the team simulation component, validated it against 8 years of historical data (2018-2025), and updated the 2026 forecast.

---

## Why Park Factor Correction?

Marcel projections are based on each player's past 3-year stats — but those stats include home park effects. This creates a bias:

- **Vantelin Dome** (Chunichi): PF_5yr = **0.844** — extreme pitcher's park, suppresses scoring
- **ES CON Field** (Nippon-Ham): PF_5yr = **1.147** — hitter-friendly park, inflates scoring

If Chunichi pitchers' ERA looks great because of their park, using that ERA directly to project team runs allowed (RA) would underestimate their "true" RA when the park effect is separated out.

The correction removes this embedded park effect before the Pythagorean win% calculation.

---

## Correction Formula

```python
# Park Factor definition
# PF = ((HomeRS + HomeRA) / HomeG) / ((AwayRS + AwayRA) / AwayG)
# PF_5yr = 5-year rolling average with renovation breakpoints

# Correction
pf_factor = (PF + 1.0) / 2.0
rs_adjusted = rs_raw / pf_factor   # Normalize projected RS to neutral park
ra_adjusted = ra_raw / pf_factor   # Normalize projected RA to neutral park
```

The `(PF + 1.0) / 2.0` factor represents the average park effect, since players split their games equally between home and away.

---

## Data

- **PF data**: `npb_park_factors.csv` from [npb-prediction](https://github.com/yasunorim/npb-prediction) (2016-2025, 12 teams)
- **Player stats**: baseball-data.com + npb.jp (2015-2025)
- **Backtest period**: 2018-2025 (8 seasons, 96 team-seasons)

### 2025 PF_5yr Values

| Stadium | Team | PF_5yr |
|---|---|---|
| ES CON Field | Nippon-Ham | 1.147 |
| Jingu Stadium | Yakult | 1.129 |
| Yokohama Stadium | DeNA | 1.102 |
| ZOZO Marine Stadium | Lotte | 1.097 |
| PayPay Dome | SoftBank | 1.007 |
| Mazda Stadium | Hiroshima | 0.996 |
| Tokyo Dome | Giants | 0.981 |
| Belluna Dome | Seibu | 0.962 |
| Kyocera Dome | Orix | 0.943 |
| Koshien Stadium | Hanshin | 0.942 |
| Rakuten Mobile Park | Rakuten | 0.908 |
| Vantelin Dome | Chunichi | 0.844 |

---

## Backtest Results

I ran the simulation with and without PF correction using the same random seed, comparing predictions vs. actual standings for 2018-2025.

### Overall Comparison

| Metric | No PF | With PF | Δ |
|---|---|---|---|
| MAE (wins) | 6.41 | 6.41 | ±0.00 |
| Bias (wins) | +2.69 | +2.70 | +0.01 |
| 80% CI coverage | 86.5% | **87.5%** | **+1.0%** |

### Year-by-Year Detail

| Year | MAE (No PF) | MAE (With PF) | Δ | 80% CI Coverage |
|---|---|---|---|---|
| 2018 | 6.18 | 6.18 | +0.00 | 100.0% |
| 2019 | 3.90 | 3.90 | +0.00 | 100.0% |
| 2020 | 6.27 | 6.28 | +0.01 | 83.3% |
| 2021 | 10.33 | 10.33 | +0.00 | 50.0% |
| 2022 | 5.13 | 5.12 | **-0.01** | 100.0% |
| 2023 | 6.88 | 6.89 | +0.01 | 91.7% |
| 2024 | 6.69 | 6.71 | +0.02 | 83.3% |
| 2025 | 5.90 | 5.90 | +0.00 | 91.7% |
| **Avg** | **6.41** | **6.41** | **±0.00** | **87.5%** |

### Interpretation

**MAE is essentially unchanged.** This makes sense structurally: the PF correction adjusts both RS and RA simultaneously, so the RS/RA ratio (which drives Pythagorean win%) is largely self-canceling. PF_5yr also changes slowly (5-year rolling average), keeping corrections modest.

**80% CI coverage improved by +1.0%** (86.5% → 87.5%). Explicitly removing park bias from player projections appears to slightly improve prediction interval calibration.

> **Note on 2021's 50% coverage**: This is not related to PF correction — it reflects the exceptional Yakult and Orix last-to-first turnarounds, which are hard to predict from any model.

---

## Why Keep It?

The decision to keep PF correction despite minimal current impact:

1. **Conceptually correct** — Marcel stats embed park effects; removing them before aggregation is more principled
2. **No degradation** — MAE doesn't get worse
3. **Future upside** — Vantelin Dome and Rakuten Mobile Park are scheduled for renovation in 2026 (HR-friendly modifications). As their PF values shift, the correction's impact will grow

| Stadium | Current PF_5yr | 2026 Renovation |
|---|---|---|
| Vantelin Dome | 0.844 | HR wing installation |
| Rakuten Mobile Park | 0.908 | Fence moved forward |

---

## 2026 Predictions (With PF Correction)

N=10,000 Monte Carlo simulations using Marcel+Stan player projections with PF_5yr correction.

### Central League

| Team | P(Pennant) | P(Clinch CS) | Median W | 80% CI |
|---|---|---|---|---|
| Hanshin | 78.2% | 97.8% | 80.6 | [75.1, 86.5] |
| Giants | 12.7% | 78.4% | 74.4 | [69.7, 79.4] |
| DeNA | 4.1% | 52.4% | 71.8 | [67.1, 76.7] |
| Hiroshima | 3.3% | 38.1% | 70.5 | [65.4, 75.7] |
| Chunichi | 1.8% | 30.8% | 69.8 | [65.0, 74.9] |
| Yakult | 0.0% | 2.5% | 64.2 | [60.2, 68.6] |

### Pacific League

| Team | P(Pennant) | P(Clinch CS) | Median W | 80% CI |
|---|---|---|---|---|
| SoftBank | 55.2% | 93.8% | 77.6 | [72.3, 82.8] |
| Nippon-Ham | 23.8% | 81.5% | 74.7 | [69.6, 80.1] |
| Orix | 15.4% | 74.0% | 73.6 | [68.8, 78.6] |
| Seibu | 5.2% | 39.8% | 70.5 | [65.7, 75.6] |
| Lotte | 0.3% | 6.8% | 66.0 | [61.7, 70.5] |
| Rakuten | 0.2% | 4.2% | 65.2 | [61.0, 69.6] |

---

## Summary

| Item | Result |
|---|---|
| MAE improvement | None (±0.00) |
| CI coverage | +1.0% (86.5% → 87.5%) |
| Conceptual correctness | ✅ Park effect removed from Marcel projections |
| Decision | ✅ Incorporated (no harm, upside expected post-renovation) |

PF correction is now a permanent part of the pipeline. The effect is small today because PF_5yr moves slowly — but when extreme stadiums like Vantelin undergo fan-friendly renovations, the correction will become more material.

---

## GitHub

**[yasumorishima/npb-bayes-projection](https://github.com/yasumorishima/npb-bayes-projection)**

---

## Related Articles

- [I Calculated NPB Park Factors for 10 Years — Stadium Renovations Revealed](https://dev.to/yasumorishima/i-calculated-npb-park-factors-for-10-years-stadium-renovations-revealed-2m1o)
- [Beyond Marcel: Adding Bayesian Regression to NPB Baseball Predictions](https://dev.to/yasumorishima/beyond-marcel-adding-bayesian-regression-to-npb-baseball-predictions-a-15-step-journey-1b4f)
