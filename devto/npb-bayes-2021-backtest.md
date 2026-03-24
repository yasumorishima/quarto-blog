---
title: "NPB 2021 Backtest: Could a Bayesian Model Predict Last-Place-to-Champion?"
published: true
description: "Testing if Bayesian ensemble predictions with individual foreign player projections could predict Yakult and Orix going from last place to champions in 2021."
tags: baseball, python, bayesian, datascience
cover_image:
canonical_url:
---

## Introduction

In a [previous article](https://dev.to/yasumorishima/adding-bayesian-ensemble-monte-carlo-to-an-npb-prediction-app-58po), I added Bayesian integration to my NPB prediction system. The 8-year backtest showed "97% probability of beating Marcel." But how did it perform in the **worst year for predictions**?

2021 was NPB's biggest upset: both **Yakult (CL)** and **Orix (PL)** went from last place to champions. I ran a full backtest with **25 new foreign players individually projected** using FanGraphs and Baseball Savant data.

- **GitHub**: [npb-2021-backtest](https://github.com/yasumorishima/npb-2021-backtest)
- **Main model**: [npb-prediction](https://github.com/yasumorishima/npb-prediction)

## Team Standings: Predicted vs Actual

### Central League

| Team | Actual | Bayes (no foreign) | Bayes (with foreign) | Foreign Effect |
|---|---|---|---|---|
| **Yakult** | **73W (1st)** | 69.5W (4th) | 70.7W (4th) | +1.2W (Santana, Osuna) |
| Hanshin | 77W (2nd) | 72.8W (2nd) | 72.6W (2nd) | -0.2W |
| Giants | 61W (3rd) | 83.1W (1st) | 84.3W (1st) | +1.2W (Smoak, Thames) |

### Pacific League

| Team | Actual | Bayes (no foreign) | Bayes (with foreign) | Foreign Effect |
|---|---|---|---|---|
| **Orix** | **70W (1st)** | 64.5W (6th) | 62.0W (6th) | **-2.5W (worse)** |
| SoftBank | 60W (4th) | 77.6W (1st) | 76.2W (1st) | -1.4W |

**MAE: 10.4 wins → 10.7 wins.** Foreign player predictions slightly worsened accuracy.

## Foreign Player Predictions vs Actual

### Accurate Predictions (average MLB players)

| Player | Team | Pred OPS | Actual OPS | Diff |
|---|---|---|---|---|
| Kevin Cron | Carp | .703 | **.701** | -.002 |
| Jose Osuna | Swallows | .683 | .694 | +.011 |
| Cy Sneed | Swallows | ERA 3.53 | **ERA 3.41** | -0.12 |

### Major Misses (extreme players)

| Player | Team | Pred OPS | Actual OPS | Diff |
|---|---|---|---|---|
| Mike Gerber | Dragons | .862 | **.352** | -.510 |
| Mel Rojas Jr. | Tigers | .867 | .663 | -.204 |
| Domingo Santana | Swallows | .713 | **.877** | +.164 |

**Gerber** had an MLB wOBA of .127 (49.3% K rate) — the model over-regressed toward the mean, predicting .862 OPS when the actual was .352.

**Santana** was predicted from 84 PA in 2020 (COVID-shortened). His career .757 OPS would have been more predictive.

## What Actually Drove the 2021 Standings

### Yakult's Championship Run

| Player | 2020 | 2021 | Change |
|---|---|---|---|
| Tetsuto Yamada | OPS .766 | OPS .885 | **+.119** |
| Domingo Santana | — | OPS .877 | New signing |
| Noboru Shimizu | ERA 3.54 | ERA 2.39 | **-1.15** |

### Orix's Championship Run

| Player | 2020 | 2021 | Change |
|---|---|---|---|
| Yutaro Sugimoto | OPS .695 | OPS .931 | **+.236** (HR King at 31) |
| Hiroya Miyagi | — | ERA 2.51 (147IP) | 20-year-old, 13 wins |
| Yoshinobu Yamamoto | ERA 2.20 | ERA 1.39 | **-0.81** (Sawamura Award) |

**Sugimoto and Miyagi's breakouts were impossible to predict from past data.** This is a structural change, not a statistical fluctuation.

### Giants Collapse (Predicted 84.3W → Actual 61W)

Sugano (ERA 1.97→3.19), Sakamoto (OPS .844→.657), Maru (OPS .899→.775) — three stars declining simultaneously. The Bayesian model **trusted their skill metrics** and predicted even higher than Marcel.

## Key Findings

1. **Average MLB players predicted well** (Cron .703 vs .701 actual)
2. **Extreme players over-regressed** (Gerber .862 vs .352) → need regression limits
3. **Single-year small samples mislead** (Santana's 84 PA in 2020) → use career stats
4. **Bad MLB pitchers stay bad in NPB** (Sparkman 6.02→3.88 pred→6.88 actual)
5. **2021 was driven by Japanese player breakouts**, not foreign players

## Conclusion

Individual foreign player projections improve accuracy for "average" players but carry risk for extreme cases. In 2021, Japanese player breakouts and collapses determined the standings — foreign player predictions had minimal impact (MAE +0.3 wins).

This is a personal hobby project. There may be oversights in data collection and verification.

## Data Sources

- [Baseball Data Freak](https://baseball-data.com) — NPB player stats
- [NPB Official](https://npb.jp) — Official records
- [FanGraphs](https://www.fangraphs.com) — MLB wOBA/K%/BB%
- [Baseball Savant](https://baseballsavant.mlb.com) — MLB Statcast
- [Baseball Reference](https://www.baseball-reference.com) — MLB/MiLB stats
