---
title: "Why Marcel Beat LightGBM: Building an NPB Player Performance Prediction System"
published: true
description: "I built a Japanese professional baseball (NPB) player performance prediction system using Marcel projection, LightGBM/XGBoost, custom wOBA/wRC+ calculation, and FastAPI. Marcel outperformed ML — just like the research says."
tags: python, baseball, machinelearning, datascience
canonical_url: https://zenn.dev/shogaku/articles/npb-prediction-marcel-vs-ml
cover_image:
---

## What I Built

A system to answer: **"How will this NPB player perform next season?"**

→ **GitHub**: https://github.com/yasumorishima/npb-prediction

Two prediction methods:
- **Marcel projection** — a simple statistical method from the 1980s
- **LightGBM / XGBoost** — modern machine learning

The key finding: **Marcel outperformed ML.** This is well-known in baseball analytics, but confirming it with NPB data was the most interesting part of this project.

---

## Data Sources

- [Pro Baseball Data Freak (baseball-data.com)](https://baseball-data.com) — NPB batter/pitcher stats, 2015–2025
- [NPB Official Site (npb.jp)](https://npb.jp) — detailed batting stats (2B/3B/SF, for wOBA calculation)

Collected via `pandas.read_html()`.

| Dataset | Rows |
|---|---|
| Batter stats | 3,780 |
| Pitcher stats | 3,773 |
| Standings | 132 (12 teams × 11 years) |
| Player birthdays | 2,479 |
| Detailed batting stats | 4,538 |

Data source: [Pro Baseball Data Freak](https://baseball-data.com) / [NPB Official](https://npb.jp)

---

## Marcel Projection

Developed by Tom Tango. The implementation is straightforward.

### Step 1: Weighted average of past 3 years

Recent seasons matter more — weighted **5/4/3**.

```python
weight_map = {0: 5, 1: 4, 2: 3}  # 0=most recent
```

### Step 2: Regression to league mean

Players with fewer plate appearances are pulled toward league average.

```python
regression = 1200 / (pa + 1200)
predicted = (1 - regression) * weighted + regression * league_avg
```

### Step 3: Age adjustment

Peak performance assumed at age 27.

```python
age_factor = 1.0 + (27 - age) * 0.003
```

---

## Custom wOBA / wRC+ for NPB

Unlike MLB (where Baseball Savant provides wOBA), NPB has no official published wOBA values. I calculated them from NPB official data using league-adjusted weights.

```python
# wOBA (NPB league-adjusted weights)
woba = (
    0.69 * BB + 0.72 * HBP +
    0.89 * H1B + 1.27 * H2B +
    1.62 * H3B + 2.10 * HR
) / (AB + BB + HBP + SF)
```

### 2024 wRC+ Top 3 (my calculation)

| Player | Team | wOBA | wRC+ |
|---|---|---|---|
| Kondo Kensuke | SoftBank | .479 | 249 |
| Austin | DeNA | .478 | 248 |
| Santana | Rakuten | .441 | 220 |

---

## ML Approach (LightGBM / XGBoost)

Features include age, historical stats, and the wOBA/wRC+ calculated above.

```python
features = [
    'age', 'OPS_prev1', 'OPS_prev2', 'OPS_prev3',
    'woba', 'wrc_plus',
    'PA_prev1', 'PA_prev2'
]
```

---

## Results: Two Years of Backtesting

I ran backtests for both 2024 and 2025 to see if the pattern holds.

### 2024 Backtest (trained on 2015–2023, predicted 2024)

| Method | OPS MAE | ERA MAE |
|---|---|---|
| **Marcel** | **.055** | **0.62** |
| LightGBM | .077 | 0.95 |

### 2025 Backtest (trained on 2015–2024, predicted 2025)

| Method | OPS MAE | ERA MAE |
|---|---|---|
| **Marcel** | **.048** | **0.63** |
| XGBoost | .062 | 0.92 |
| LightGBM | .065 | 0.92 |

**Marcel won consistently across both years.** The 2025 batter OPS MAE of .048 was particularly impressive.

Adding wOBA/wRC+ as features didn't change the outcome. This aligns with the well-known finding that Marcel is a "surprisingly strong baseline."

Why does Marcel hold up so well?

- Player true talent changes slowly (1–2 years)
- ML tends to overfit with limited sample sizes
- Simple weighted averages fit the actual distribution of year-to-year changes

---

## Player Stories: Where Marcel Shines and Struggles

### Austin (DeNA) — Prediction error of just .008

After missing most of 2022–2023 due to injuries, Austin returned in 2024 with an incredible OPS of .983. For 2025, Marcel predicted:

| | OPS | PA |
|---|---|---|
| Marcel prediction | .842 | 213 |
| 2025 actual | .834 | 246 |
| **Error** | **.008** | — |

Marcel's regression toward league average perfectly captured the expected decline from an unsustainably high 2024, while also accounting for his injury-prone playing time.

### Tsutsugo Yoshitomo (DeNA) — A comeback Marcel couldn't see

A former NPB star (OPS ~.900 through 2019), Tsutsugo returned from MLB in 2024 and struggled to OPS .683 in just 168 PA.

| | OPS | PA |
|---|---|---|
| Marcel prediction | .656 | 168 |
| 2025 actual | .876 | 257 |
| **Error** | **.220** | — |

Marcel was anchored to his poor 2024 season and predicted continued decline. Instead, Tsutsugo hit 20 home runs and posted OPS .876 — a full-blown resurgence that a weighted-average model simply cannot anticipate. This highlights Marcel's inherent limitation: it struggles with players whose recent performance doesn't reflect their true ability level.

---

## Pythagorean Win Expectation

Predicts team win percentage from runs scored and allowed.

```
Win% ≈ RS^k / (RS^k + RA^k)
```

MLB uses `k=1.83` as standard. I searched for the NPB-optimal value and found **`k=1.72`**.

| Exponent | MAE | Sample |
|---|---|---|
| NPB optimal (k=1.72) | **3.20 wins** | All 12 teams, 2015–2025 |
| MLB standard (k=1.83) | 3.32 wins | Same |

---

## FastAPI Inference API

```bash
pip install -r requirements.txt
uvicorn api:app --reload
# Open http://localhost:8000/docs for Swagger UI
```

### Endpoints

| Path | Description |
|---|---|
| `GET /predict/hitter/{name}` | Batter projection (Marcel + ML) |
| `GET /predict/pitcher/{name}` | Pitcher projection (Marcel + ML) |
| `GET /predict/team/{name}` | Team Pythagorean win% |
| `GET /sabermetrics/{name}` | wOBA / wRC+ / wRAA |
| `GET /rankings/hitters` | Batter rankings |
| `GET /rankings/pitchers` | Pitcher rankings |
| `GET /pythagorean` | All teams' Pythagorean win% |

### Sample response (Maki Shugo, next season projection)

```json
{
  "player": "牧 秀悟",
  "team": "DeNA",
  "marcel": { "OPS": 0.834, "AVG": 0.295, "HR": 22.9, "RBI": 81.4 },
  "ml": { "pred_OPS": 0.874 }
}
```

Docker support included — `docker compose up --build` to run.

---

## Summary

| Item | Detail |
|---|---|
| Data | baseball-data.com + npb.jp (2015–2025, 5 datasets) |
| Marcel accuracy (2025) | Batter OPS MAE=.048 / Pitcher ERA MAE=0.63 |
| ML accuracy (2025) | Batter OPS MAE=.062 / Pitcher ERA MAE=0.92 |
| Pythagorean | NPB optimal k=1.72, MAE=3.20 wins |
| API | FastAPI 7 endpoints, Docker-ready |

The biggest takeaway: **newer doesn't always mean better**. Across two years of backtesting, Marcel — a method from the 1980s — consistently outperformed modern ML on NPB data. At the same time, player stories like Austin (error .008) and Tsutsugo (error .220) show both the power and limits of any projection system.

→ **GitHub**: https://github.com/yasumorishima/npb-prediction

**Data credit**: [Pro Baseball Data Freak](https://baseball-data.com) / [NPB Official](https://npb.jp)
