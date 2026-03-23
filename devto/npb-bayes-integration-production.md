---
title: "Adding Bayesian Ensemble + Monte Carlo to an NPB Prediction App"
published: true
description: "How adding Bayesian corrections and foreign player projections changed NPB team standings predictions — with accuracy data from 8 years of backtesting."
tags: baseball, python, bayesian, datascience
cover_image:
canonical_url:
---

## Introduction

I've been running a personal NPB (Japanese pro baseball) prediction app:

- **Dashboard**: [npb-prediction.streamlit.app](https://npb-prediction.streamlit.app/)
- **GitHub**: [npb-prediction](https://github.com/yasumorishima/npb-prediction)

It used Marcel projections (3-year weighted average) and ML (XGBoost/LightGBM). Decent, but I wanted better accuracy. After adding Bayesian corrections, the predicted standings changed significantly.

## Terms

| Term | Meaning |
|---|---|
| **Marcel** | Predict next year from weighted average of past 3 years |
| **Bayesian** | Combine prior knowledge with data. Gives uncertainty estimates |
| **CI** | Credible interval — range where the true value falls with 80%/95% probability |
| **OPS** | On-base + Slugging. Overall batting metric |
| **ERA** | Earned Run Average. Runs allowed per 9 innings |
| **MAE** | Mean Absolute Error. Average prediction miss. Lower = better |

---

## Problems with the Previous Approach

### Problem 1: All Foreign Players Treated as "Average"

Marcel needs 3 years of NPB data. First-year foreign players have none, so all 24 of them were treated as league-average. Dalbec (Giants, .355 wOBA in MLB) and Hummel (BayStars, .240 wOBA) were calculated identically.

### Problem 2: Skill Metrics Ignored

Marcel averages past results directly. Two players with OPS .800 might have very different K% and BB% profiles, which affects how stable their performance will be next year.

### Problem 3: No Uncertainty

"Maki's OPS: .812" gives no sense of how much it might vary. The difference between .750-.870 and .790-.830 matters a lot for team projections.

---

## What Changed with Bayesian Integration

### Foreign Players: Average → Individual Predictions

Built a model to convert MLB/KBO stats to NPB projections. For example, a .350 wOBA MLB hitter maps to approximately `.350 × 1.235 = .432` NPB-equivalent wOBA.

All 24 players' names and prior-league stats were individually web-verified (guessing English names from katakana is surprisingly error-prone).

**Foreign hitter examples:**

| Player | Team | Prior wOBA | NPB Pred OPS | 80% CI |
|---|---|---|---|---|
| Sano | Dragons | .370 | .760 | .632–.889 |
| Seymour | Buffaloes | .365 | .735 | .607–.863 |
| Dalbec | Giants | .355 | .725 | .577–.884 |
| Hummel | BayStars | .240 | .694 | .530–.849 |

**Foreign pitcher examples:**

| Player | Team | Prior ERA | NPB Pred ERA | 80% CI |
|---|---|---|---|---|
| Quijada | Swallows | 3.26 | 2.76 | 1.28–4.24 |
| Hjelle | Buffaloes | 3.90 | 3.34 | 1.05–5.59 |
| Cox | BayStars | 8.86 | 3.36 | 1.82–4.85 |

Players with poor prior-league stats get pulled toward league average (Bayesian regression effect), but with wider CIs = lower confidence.

### Japanese Players: K%/BB%/BABIP Corrections

Three models combined into a final prediction:

| Model | Weight | Notes |
|---|---|---|
| Marcel | 35% | Strong baseline, especially for pitcher ERA |
| Bayesian correction | 40% | K%/BB%/BABIP/age adjustment on top of Marcel |
| ML | 25% | XGBoost/LightGBM |

---

## Did Accuracy Improve?

8-year backtest (2018–2025, predict each year and compare to actual):

| Metric | Marcel MAE | Bayesian MAE | Improvement prob. |
|---|---|---|---|
| Hitter wOBA | 0.05023 | **0.04980** | 97.1% |
| Pitcher ERA | 1.23008 | **1.22241** | 97.1% |

Small improvement, but consistent — **97% probability of beating Marcel across 8 years**.

### Historical Marcel Accuracy for Context

**Overall (8 years × 12 teams = 96 team-years):**

| Metric | Value |
|---|---|
| Wins MAE | **6.4 wins** |
| Avg rank error | 1.42 positions |
| Exact rank rate | 18% |
| Within 1 rank | 65% |

**Recent examples of Marcel misses:**

| Year | Team | Actual | Predicted | Miss |
|---|---|---|---|---|
| 2025 | Swallows (CL) | 57W (6th) | 72W (4th) | +15 |
| 2024 | SoftBank (PL) | 91W (1st) | 75W (2nd) | -16 |
| 2024 | Buffaloes (PL) | 63W (5th) | 78W (1st) | +15 |

**Patterns:**
- Overestimates bottom teams, underestimates top teams (regression to mean)
- Can't predict collapses (2024 Buffaloes: defending champions → 5th place)
- Foreign player impact not captured when all treated as average

---

## How Did the 2026 Standings Change?

### Central League — Leader Changed

| Team | Marcel | Bayesian | Diff | P(Pennant) |
|---|---|---|---|---|
| **Giants** | 71W (3rd) | **74W (1st)** | +3 | 42.6% |
| Dragons | 69W (5th) | 72W (2nd) | +3 | 20.0% |
| Tigers | **80W (1st)** | 72W (3rd) | **-8** | 23.2% |
| BayStars | 71W (2nd) | 70W (4th) | -2 | 7.7% |
| Carp | 70W (4th) | 69W (5th) | -2 | 6.5% |
| Swallows | 64W (6th) | 62W (6th) | -2 | 0.1% |

**Biggest change: Tigers dropped from 1st (80W) to 3rd (72W).** Skill-metric corrections adjusted their projection downward. The CL is now a three-way race: Giants 43%, Tigers 23%, Dragons 20%.

### Pacific League — Lions Surge

| Team | Marcel | Bayesian | Diff | P(Pennant) |
|---|---|---|---|---|
| Hawks | 80W (1st) | 80W (1st) | -1 | 50.0% |
| Fighters | 77W (2nd) | 78W (2nd) | +1 | 24.1% |
| Buffaloes | 74W (3rd) | 77W (3rd) | +3 | 18.5% |
| Lions | 69W (4th) | 75W (4th) | **+6** | 7.4% |
| Eagles | 66W (5th) | 67W (5th) | +1 | 0.1% |
| Marines | 67W (6th) | 65W (6th) | -2 | 0.0% |

**Lions +6 wins** — the largest gain, driven by foreign player individual projections replacing league-average estimates.

---

## Summary

| Problem | Before | After |
|---|---|---|
| Foreign players | All league-average | 24 individual projections from prior-league stats |
| Skill metrics | Not used | K%/BB%/BABIP corrections on Marcel |
| Uncertainty | None (point estimates) | 80%/95% credible intervals on every prediction |
| Team standings | Single number | 10,000 Monte Carlo sims with pennant probabilities |
| Accuracy | Marcel MAE 0.050 | **0.0498** (97% probability of improvement) |

The accuracy gain is modest, but "foreign players are no longer invisible" and "every prediction comes with uncertainty" meaningfully changed the standings picture. The CL went from "Tigers runaway" to "three-team race."

- **Dashboard**: [npb-prediction.streamlit.app](https://npb-prediction.streamlit.app/)
- **GitHub**: [github.com/yasumorishima/npb-prediction](https://github.com/yasumorishima/npb-prediction)

## Data Sources

- [Baseball Data Freak](https://baseball-data.com) — NPB player stats
- [NPB Official](https://npb.jp) — Official records
