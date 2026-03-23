---
title: "Adding Bayesian Ensemble + Monte Carlo to an NPB Prediction System"
published: true
description: "Notes on integrating a Stan Bayesian model into an NPB baseball prediction system — Monte Carlo team simulation, credible intervals in Streamlit, and foreign player projections."
tags: baseball, python, bayesian, datascience
cover_image:
canonical_url:
---

## Introduction

In a previous article, I documented my journey adding Bayesian regression (Stan/Ridge) to my NPB (Japanese pro baseball) prediction system.

- **Previous article**: [Beyond Marcel: Adding Bayesian Regression to NPB Predictions](https://dev.to/shogaku/beyond-marcel-adding-bayesian-regression-to-npb-baseball-predictions-a-15-step-journey-37a0)

That work lived in a separate research repository ([npb-bayes-projection](https://github.com/yasumorishima/npb-bayes-projection)). This article covers the integration into the **production system** — a 7-phase process that touched 19 files and added 4,087 lines.

- **GitHub**: [npb-prediction](https://github.com/yasumorishima/npb-prediction)
- **Live dashboard**: [npb-prediction.streamlit.app](https://npb-prediction.streamlit.app/)

---

## Before: Point Estimates Only

```
Marcel (3-year weighted avg) → ML (XGBoost/LightGBM)
    ↓                              ↓
  Point estimate               Point estimate
    ↓
Pythagorean Win% → Team standings
```

**Problems:**
- No uncertainty quantification
- 24 new foreign players treated as league-average (wRAA=0)
- Marcel and ML run independently — no ensemble
- Team standings are a single number with no confidence interval

## After: Bayesian Ensemble + Monte Carlo

```
Layer 1: Marcel (unchanged)
    ↓
Layer 2: Stan Bayesian correction
  - Japanese: Ridge correction via K%/BB%/BABIP/age
  - Foreign: Prior-league stats × league-specific conversion (Stan v2)
    ↓
Layer 3: ML (XGBoost/LightGBM)
    ↓
Layer 4: BMA (Bayesian Model Averaging)
  - Marcel 35% + Stan 40% + ML 25%
  - 80%/95% credible intervals on every prediction
    ↓
Monte Carlo 10,000 draws → Team win distributions
  - P(pennant) / P(Climax Series) / P(last place)
```

---

## The 7 Phases

### Phase 1: Japanese Player Bayesian Inference

The key design decision: **Stan does not run at inference time.**

cmdstanpy is heavy to install and won't fit on a Raspberry Pi 5 (4GB RAM). Instead, I pre-compute posterior parameters into `posteriors.json` during training (in GitHub Actions), then sample with NumPy at runtime.

```python
# posteriors.json structure (hitter example)
{
  "japanese_hitter": {
    "beta": [0.152, -0.089, -0.245, -0.003],
    "sigma_residual": 0.06215,
    "feature_names": ["K_pct", "BB_pct", "BABIP", "age_from_peak"]
  }
}

# Runtime sampling (milliseconds, not seconds)
z = (features - scaler_mean) / scaler_std
correction = beta @ z
samples = marcel_value + correction + rng.normal(0, sigma, size=5000)
ci_80 = np.percentile(samples, [10, 90])
```

### Phase 2: Foreign Player Stan v2 Predictions

The most labor-intensive phase. I had to web-verify all 24 foreign players individually:

- Katakana name → correct English name
- Origin league (MLB / KBO / independent)
- Most recent season stats

**Lesson learned: Never guess English names from katakana.**

Over 10 of my initial 28 guesses were wrong:

| NPB Name | Initial Guess | Correct |
|---|---|---|
| Dalbec | Spencer Torkelson | Bobby Dalbec |
| Jerry | Sean Gerry | Sean Hjelle |
| Lucas | Josh Lucas | Easton Lucas |

I also misidentified 4 Japanese draft picks (with katakana names) as foreign players. The rule: **verify every single entry via web search before committing.**

### Phase 3: Monte Carlo Team Simulation

Player-level uncertainty propagates to team-level through 10,000 independent simulations:

```python
for sim in range(10000):
    for team in teams:
        rs = sum(sample_hitter_runs(h) for h in team.hitters)
        ra = sum(sample_pitcher_runs(p) for p in team.pitchers)
        rs, ra = apply_park_factor(rs, ra, team)
        wins[team][sim] = 143 * rs**1.83 / (rs**1.83 + ra**1.83)
```

Foreign players get 1.5x sigma (wider uncertainty since they have no NPB data).

### Phase 5: API Integration

Three new FastAPI endpoints:

| Endpoint | Description |
|---|---|
| `/predict/hitter/{name}` | Bayesian OPS + 80%/95% CI (added to existing) |
| `/predict/foreign/{name}` | Foreign player Stan v2 projections (new) |
| `/standings/simulation` | Monte Carlo team standings (new) |

### Phase 6: Streamlit Integration

The largest phase — added ~370 lines to the 1,669-line `streamlit_app.py`:

1. **Bayesian CI bars** on existing prediction pages (Plotly overlay bars for 80%/95% intervals)
2. **Team Simulation page** (new) — fan chart + probability table
3. **Foreign Players page** (new) — prior-league stats + NPB projection with CI

### Phase 7: BigQuery Integration

Added 8 tables (25 → 33 total): Bayesian predictions, foreign player data, simulation results, and conversion factors.

---

## Technical Decisions

### posteriors.json vs. cmdstanpy at runtime

| | posteriors.json | cmdstanpy runtime |
|---|---|---|
| Inference speed | NumPy only (ms) | Stan call (seconds) |
| Memory | Few KB | Hundreds of MB |
| Updates | Annual retraining via GitHub Actions | Fit every time |

For a system running on RPi5 with 4GB RAM, this was the only viable option. With annual data updates, there's no need to re-fit on every request.

### BMA Weight Rationale

Marcel 35% + Stan 40% + ML 25% was determined by 8-year LOO-CV:

- Stan correction improved Marcel 97.1% of the time (bootstrap)
- ML matched Marcel on hitter OPS but underperformed on pitcher ERA
- The 3-model BMA was more robust than any single model

### The Full-Width Space Trap

Marcel CSVs used full-width spaces (U+3000) in player names while sabermetrics CSVs used half-width spaces. This caused 237 of 463 players to fail matching until I normalized with a `player_join` column.

---

## Results

| Metric | Value |
|---|---|
| New files | 12 (2 Python + 10 data) |
| Modified files | 7 |
| Lines added | +4,087 |
| BigQuery tables | 25 → 33 |
| Streamlit pages | 7 → 9 |
| Foreign players individually projected | 0 → 24 |

The system moved from point estimates to probability distributions. "The Giants have a 42.6% chance of winning the pennant" is more useful than "The Giants are projected to win 74 games."

---

## Takeaways

Moving research code to production has its own challenges, distinct from the research itself:

- **Data quality matters more than model quality.** Incorrect foreign player names/stats would have propagated through the entire pipeline
- **Design for your runtime constraints.** posteriors.json lets a 4GB RPi5 do Bayesian inference
- **Uncertainty visualization needs thought.** CI bars, fan charts, and probability tables each communicate different aspects of the same distributions

Phase 4 (automated Stan retraining pipeline) remains for next season. But the prediction system now runs Bayesian ensemble predictions end-to-end, from individual players to team championship probabilities.

- **Dashboard**: [npb-prediction.streamlit.app](https://npb-prediction.streamlit.app/)
- **GitHub**: [github.com/yasumorishima/npb-prediction](https://github.com/yasumorishima/npb-prediction)

## Data Sources

- [Baseball Data Freak](https://baseball-data.com) — NPB player stats
- [NPB Official](https://npb.jp) — Official records
