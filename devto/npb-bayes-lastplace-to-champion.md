---
title: "Did Bayesian Projection (Stan/Ridge) Predict the 2021 NPB Last-to-First Upsets?"
published: true
description: "A follow-up to my Marcel analysis: I applied a Bayesian model (Stan/Ridge correction using K%, BB%, BABIP) to the same 2021 Yakult and Orix question — and found honest answers about what Bayes can and cannot fix."
tags: python, baseball, datascience, bayesian
canonical_url: https://zenn.dev/shogaku/articles/npb-bayes-lastplace-to-champion
cover_image:
---

## Background

In a [previous article](https://zenn.dev/shogaku/articles/npb-marcel-lastplace-to-champion), I analyzed why Marcel projection missed the 2021 NPB upsets — where both pennant winners came from last place the year before:

- **Tokyo Yakult Swallows**: Last in 2020 → Central League champions in 2021
- **Orix Buffaloes**: Last in 2020 → Pacific League champions in 2021

Marcel identified three patterns it couldn't see:

| Pattern | Examples |
|---------|---------|
| Breakout rookie starters | Okugawa Yasanobu, Miyagi Hiromu |
| Foreign hitter jackpot | Santana, Osuna |
| Breakout performance by established player | Sugimoto Yutaro, Takahashi Keiji |

This article applies a Bayesian model (Stan/Ridge correction) to the same question: **would it have done better?**

→ GitHub: https://github.com/yasumorishima/npb-bayes-projection

---

## What the Bayesian Model Adds

The Bayes model uses Marcel projections as a starting point, then applies three corrections:

**① K% / BB% adjustment**

Batting average and ERA are heavily influenced by park, opponent quality, and luck. Strikeout rate (K%) and walk rate (BB%) are more environment-stable indicators of underlying skill. K% is particularly useful for pitchers: high-strikeout pitchers tend to outperform their Marcel ERA projection.

**② BABIP correction**

Batted-ball luck (BABIP) fluctuates year to year. Players with unusually low BABIP may have been unlucky; high BABIP may have inflated their stats. The model adjusts Marcel projections accordingly.

**③ Better initialization for foreign players**

Marcel uses league average for first-year foreign players (no NPB history). The Bayes model converts prior-league (MLB/KBO) stats into NPB scale as an initial value.

---

## Team-Level Results: Marcel vs Stan (2021)

**Yakult**

| | Marcel | Stan | Actual |
|--|--------|------|--------|
| 2021 wins | 63.3 | 64.3 | **73** |
| Error | **-9.7** | **-8.7** | — |

**Orix**

| | Marcel | Stan | Actual |
|--|--------|------|--------|
| 2021 wins | 71.7 | 73.5 | **70** |
| Error | +1.7 | +3.5 | — |

Stan reduced Yakult's error by about 1 win. Orix was close to actual in both models. Neither model "predicted" the upsets.

---

## Testing the Three Patterns with Stan

### Pattern 1: Rookie Starter Breakouts (Okugawa, Miyagi)

Okugawa Yasanobu pitched 0 innings in 2020. Marcel excludes him (no data). The Bayes model is in the same position — you can't apply K%/BB% corrections without historical data.

Miyagi Hiromu had minimal prior data, so the model could produce an estimate:

| Player | Actual ERA | Marcel | Stan | Stan improvement |
|--------|-----------|--------|------|-----------------|
| Miyagi (2021) | 2.51 | 3.78 | 3.40 | -0.38 |

Stan is 0.38 closer, but still off. "Is this pitcher MLB-ready?" cannot be read from box score data alone.

### Pattern 2: Foreign Hitter Jackpot (Santana)

First-year foreign players get league-average initialization in both models.

| Player | Actual wOBA | Marcel | Stan |
|--------|------------|--------|------|
| Santana (2021) | .392 | .318 (lg_avg) | .316 (lg_avg) |
| Osuna (2021) | .311 | .318 (lg_avg) | .315 (lg_avg) |

Even with MLB conversion factors, a league-average conversion cannot predict individual player adaptation. Both models missed Santana's .392 by roughly the same margin.

### Pattern 3: Established Player Breakout (Sugimoto, Takahashi)

This is where the results diverge.

**Takahashi Keiji (pitcher): Stan improves**

| Player | Actual ERA | Marcel | Stan | Stan improvement |
|--------|-----------|--------|------|-----------------|
| Takahashi (2021) | 2.87 | 4.55 | 4.22 | **-0.33** |

Takahashi's K% was already high in 2020. The correction "high K% pitchers tend to have better ERA" moved the projection in the right direction.

**Sugimoto Yutaro (hitter): Stan gets worse**

| Player | Actual wOBA | Marcel | Stan | Stan change |
|--------|------------|--------|------|-------------|
| Sugimoto (2021) | .413 | .310 | .299 | **-0.011 (worse)** |

Sugimoto hit .695 OPS in only 141 PA in 2020 — was he unlucky, or genuinely poor? The model can't tell. BABIP correction moved the projection *further down*, not up. In MLB, Statcast exit velocity and launch angle would help distinguish between these cases. Without that data, the box score alone is ambiguous.

---

## Where K% Correction Worked: Pitcher Results

**Yakult pitchers (2021, IP≥40)**

| Pitcher | Actual ERA | Marcel | Stan | Stan improvement |
|---------|-----------|--------|------|-----------------|
| Takahashi Keiji | 2.87 | 4.55 | 4.22 | -0.33 |
| Konno Ryuta | 2.76 | 3.47 | 2.92 | **-0.56** |
| McGough | 2.52 | 3.59 | 3.32 | -0.26 |
| Kanakubo Yuto | 2.74 | 3.98 | 3.69 | -0.29 |
| Shimizu Noboru | 2.39 | 4.21 | 4.11 | -0.10 |

**Orix pitchers (2021, IP≥40)**

| Pitcher | Actual ERA | Marcel | Stan | Stan improvement |
|---------|-----------|--------|------|-----------------|
| Yamamoto Yoshinobu | 1.39 | 2.46 | 2.23 | -0.23 |
| Miyagi Hiromu | 2.51 | 3.78 | 3.40 | -0.38 |
| Higgins | 2.53 | 3.19 | 2.86 | -0.34 |

Stan consistently outperformed Marcel for high-K% pitchers. But the actual ERAs of Shimizu (2.39) and Yamamoto (1.39) were still well beyond what the model projected.

---

## Summary

| Factor | Marcel limitation | Stan improvement |
|--------|------------------|-----------------|
| Rookie starter breakout (Okugawa, Miyagi) | Out of scope (no data) | None (same limitation) |
| Foreign hitter jackpot (Santana) | League average substitution | None (initialization gap remains) |
| Established hitter breakout (Sugimoto) | Drags prior year's low stats | None (actually worse) |
| Pitcher improvement (Takahashi, etc.) | Drags prior year's stats | **Yes — K% correction helps** |

The Bayesian K%/BB% correction is useful for pitchers. For batters, foreign player unknowns, and rookies — the bottleneck is the same as Marcel: what data is available.

Both models give the same bottom line for 2021: the upsets were caused by changes that past performance data can't capture.

---

## What Would Help

The missing piece is batted-ball quality data. In MLB, Statcast records exit velocity and launch angle for every batted ball. A hitter with a poor BABIP but strong exit velocity is a candidate for positive regression — the opposite of Sugimoto as the model interpreted him.

NPB doesn't publish this level of data. Until it does, the ceiling for projection accuracy from box scores alone is structural, not algorithmic.

---

## Related

- Previous article (Marcel analysis): https://zenn.dev/shogaku/articles/npb-marcel-lastplace-to-champion
- Bayes model development log: https://zenn.dev/shogaku/articles/npb-bayes-projection-story
- Prediction app (Marcel + Stan projections both available): https://npb-prediction.streamlit.app/
- GitHub (Marcel): https://github.com/yasumorishima/npb-prediction
- GitHub (Bayes model): https://github.com/yasumorishima/npb-bayes-projection

Data sources: [baseball-data.com](https://baseball-data.com/) / [npb.jp](https://npb.jp/)
