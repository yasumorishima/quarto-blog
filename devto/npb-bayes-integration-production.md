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

### Central League — Tigers Runaway Disappears, 4-Team Deadlock

| Team | Marcel | Bayesian | Diff | P(Pennant) |
|---|---|---|---|---|
| Tigers | **80.1W (1st)** | 71.5W (1st) | **-8.6** | 26.0% |
| Giants | 70.7W (3rd) | 71.1W (2nd) | +0.4 | 20.2% |
| Dragons | 68.8W (5th) | 71.0W (3rd) | +2.2 | 21.2% |
| BayStars | 71.3W (2nd) | 70.7W (4th) | -0.6 | 20.2% |
| Carp | 70.4W (4th) | 69.1W (5th) | -1.3 | 12.3% |
| Swallows | 64.3W (6th) | 61.2W (6th) | -3.1 | 0.1% |

**Tigers dropped from 80.1W to 71.5W (-8.6).** Skill corrections pulled them down. Giants at 71.1W even after losing Okamoto to MLB. **Four teams within 0.8 wins** — Tigers 26%, Dragons 21%, Giants 20%, BayStars 20%. Swallows at 61.2W (78% last place) after Murakami's MLB departure.

### Pacific League — Lions Surge

| Team | Marcel | Bayesian | Diff | P(Pennant) |
|---|---|---|---|---|
| Hawks | 80.5W (1st) | 81.3W (1st) | +0.8 | 47.9% |
| Fighters | 76.8W (2nd) | 79.1W (2nd) | +2.3 | 27.2% |
| Buffaloes | 73.8W (3rd) | 77.5W (3rd) | +3.7 | 17.6% |
| Lions | 68.6W (4th) | 74.9W (4th) | **+6.3** | 7.1% |
| Eagles | 65.5W (5th) | 66.7W (5th) | +1.2 | 0.1% |
| Marines | 67.1W (6th) | 64.9W (6th) | -2.2 | 0.1% |

**Lions +6.3 wins** — foreign player projections offsetting Imai's MLB departure.

---

## Summary

| Problem | Before | After |
|---|---|---|
| Foreign players | All league-average | 24 individual projections from prior-league stats |
| Skill metrics | Not used | K%/BB%/BABIP corrections on Marcel |
| Uncertainty | None (point estimates) | 80%/95% credible intervals on every prediction |
| Team standings | Single number | 10,000 Monte Carlo sims with pennant probabilities |
| Accuracy | Marcel MAE 0.050 | **0.0498** (97% probability of improvement) |

The accuracy gain is modest, but "foreign players are no longer invisible," "MLB departures are reflected," and "every prediction comes with uncertainty" meaningfully changed the standings picture. The CL went from "Tigers runaway" to a four-team deadlock.

### Caveat: Data Limitations

During this work, I discovered that **players who moved to MLB (Murakami, Okamoto)** were still included in the team simulation — the roster filter only existed in the Streamlit display layer, not in the CSV generation pipeline. Fixed and regenerated, but **there may be other oversights I haven't caught.**

This is a personal project without professional-grade QA. The data is best treated as automated model output, not authoritative predictions.

- **Dashboard**: [npb-prediction.streamlit.app](https://npb-prediction.streamlit.app/)
- **GitHub**: [github.com/yasumorishima/npb-prediction](https://github.com/yasumorishima/npb-prediction)

## Data Sources

- [Baseball Data Freak](https://baseball-data.com) — NPB player stats
- [NPB Official](https://npb.jp) — Official records
