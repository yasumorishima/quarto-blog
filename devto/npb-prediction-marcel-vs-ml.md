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

### Austin (DeNA) — A tale of two predictions

Tracking Austin's comeback from 2022–2023 injuries reveals both Marcel's weakness and strength.

**2024 prediction (based on 2021–2023 data):**

| | OPS | PA |
|---|---|---|
| Marcel prediction | .818 | 145 |
| 2024 actual | .983 | 445 |
| **Error** | **.165** | — |

With only 38 PA in 2022 and 54 PA in 2023 due to injuries, Marcel regressed heavily toward league average. It completely missed the OPS .983 comeback.

**2025 prediction (based on 2022–2024 data):**

| | OPS | PA |
|---|---|---|
| Marcel prediction | .842 | 213 |
| 2025 actual | .834 | 246 |
| **Error** | **.008** | — |

The very next year, Marcel nailed it with an error of just .008. With the strong 2024 season now in the data, regression worked in the opposite direction — pulling an unsustainably high OPS back down to a realistic level.

Same player, same method, wildly different accuracy — a perfect illustration of how data availability shapes projection quality.

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

### Team Roster Simulation

v0.3.0 adds `/simulate/team/{team}` — swap players in/out and see how projected wins change.

```
GET /simulate/team/DeNA?year=2025&add=山川&remove=宮﨑
```

It adjusts team runs scored by each player's wRAA and recalculates Pythagorean win expectation.

---

## Streamlit Dashboard

All API features are also available through an interactive Streamlit dashboard.

```bash
pip install -r requirements.txt
streamlit run streamlit_app.py
```

7 pages covering batter/pitcher projections, rankings, Pythagorean standings, and team win projections. Charts are built with Plotly, using NPB team colors for all 12 teams. The dashboard supports both **Japanese and English**.

### Batter Rankings: wOBA / wRC+ Sort Options

In addition to OPS/AVG/HR/RBI, you can now sort by **wOBA** (run value per plate appearance) and **wRC+** (batting strength with league average = 100).

### Pitcher Rankings: FIP / K% / BB% and More

Beyond ERA/WHIP, pitchers can now be ranked by **FIP** (fielding-independent pitching), **K%** (strikeout rate), **BB%** (walk rate), **K-BB%** (strikeout minus walk rate), **K/9**, **BB/9**, and **HR/9**.

```
FIP = (13×HR + 3×(BB+HBP) - 2×SO) / IP + constant C
```

A pitcher with FIP lower than ERA may be performing better than their results suggest (bad defense behind them), while FIP higher than ERA may indicate defensive support inflating their stats.

### Prediction Pages: Formula Explanations

Batter predictions now show wOBA/wRC+/wRAA metric cards with a **wRC+ trend chart**. Pitcher predictions show FIP/K%/BB%/K-BB%/K9/BB9/HR9 cards with a **radar chart**. Each metric includes an expandable formula explanation with benchmark values.

---

## Current Limitations and Future Plans

### Handling New Foreign Players and Rookies

Marcel requires **3 years of NPB data**, which means new foreign players, rookies, and players returning from long-term injuries are all excluded from the calculation. Currently, these players are implicitly treated as **league-average contributors (wRAA=0)**.

The dashboard visualizes uncounted players with orange badges and an expander listing each player. I've also **implemented prediction ranges (confidence intervals)** to show this uncertainty directly on the chart.

### ✅ Implemented: Prediction ranges (confidence intervals)

Uncounted players are treated as wRAA=0 (league-average contribution), but first-year performance for foreign players varies widely in practice.

**The logic:**

1. Historically, first-year NPB foreign players show wRAA ranging from roughly **-15 to +25 runs**
2. Baseball's rule of thumb: **10 runs ≈ 1 win** (derived from Pythagorean win expectation)
3. → Uncertainty per uncounted player ≈ **±1.5 wins**

```
Prediction range = uncounted players × 1.5 wins
Example: 3 uncounted players, 70 projected wins → displayed as "67–74 wins"
```

The orange error bars on the chart show this range. Teams with more uncounted players have wider bars — a direct visual representation of "this team's actual finish could vary significantly depending on how their new players perform."

### Remaining work

| Approach | Description | Difficulty |
|---|---|---|
| **Historical average** | Use average first-year NPB stats for foreign players | ★★☆ |
| **League translation factors** | Apply MLB/KBO → NPB conversion rates | ★★★ |
| **Draft position priors** | Assign different expected values by draft round | ★★☆ |

Teams with more uncounted players carry higher prediction uncertainty — a team ranked lower by the model may still have significant upside if their new additions outperform historical averages.

### Marcel's other blind spot: young player breakouts

Marcel's age adjustment is only **+0.3% per year below age 27** — small enough that it can't capture sudden growth. When a 23–26-year-old player is on the verge of a breakout, Marcel pulls their projection back toward their past three-year average, systematically underestimating what they're capable of.

Just like the uncounted-player problem, **teams with several young players approaching a breakout are likely underrated by this model**. This uncertainty is not currently reflected in the orange confidence interval bars, so the actual gap between prediction and reality may be wider than the chart suggests.

## Summary

| Item | Detail |
|---|---|
| Data | baseball-data.com + npb.jp (2015–2025, 5 datasets) |
| Marcel accuracy (2025) | Batter OPS MAE=.048 / Pitcher ERA MAE=0.63 |
| ML accuracy (2025) | Batter OPS MAE=.062 / Pitcher ERA MAE=0.92 |
| Pythagorean | NPB optimal k=1.72, MAE=3.20 wins |
| API | FastAPI 8 endpoints, Docker-ready |
| Dashboard | Streamlit 7 pages, Plotly charts, JA/EN bilingual |

The biggest takeaway: **newer doesn't always mean better**. Across two years of backtesting, Marcel — a method from the 1980s — consistently outperformed modern ML on NPB data. At the same time, player stories like Austin (error .165 in 2024, then .008 in 2025) and Tsutsugo (error .220) show both the power and limits of any projection system.

→ **GitHub**: https://github.com/yasumorishima/npb-prediction

**Data credit**: [Pro Baseball Data Freak](https://baseball-data.com) / [NPB Official](https://npb.jp)
