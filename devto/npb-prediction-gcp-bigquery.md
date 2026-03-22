---
title: "Moving an NPB Prediction System to BigQuery — BQML and Cloud Run on the Free Tier"
published: true
description: "I migrated my Japanese baseball (NPB) prediction system to Google BigQuery, trained BQML models with SQL window functions, and deployed the API to Cloud Run — all within GCP's free tier."
tags: bigquery, gcp, python, baseball
canonical_url: https://zenn.dev/shogaku/articles/npb-prediction-gcp-bigquery
cover_image:
---

## Background

I've been running an NPB (Japanese professional baseball) player performance prediction project for over a year.

→ Previous articles:
- [Why Marcel Beat LightGBM: Building an NPB Player Performance Prediction System](https://dev.to/yasunorim/why-marcel-beat-lightgbm-building-an-npb-player-performance-prediction-system-2ln4)
- [Annual Auto-Retraining for NPB Baseball Predictions with GitHub Actions](https://dev.to/yasunorim/annual-auto-retraining-for-npb-baseball-predictions-with-github-actions-30ln)

The setup was: GitHub Actions fetches data → trains models → saves CSVs → Streamlit displays results. Data lived in CSVs, the API ran on a Raspberry Pi 5 Docker container, and analysis was done in local Python.

I added Google BigQuery to centralize the data, run SQL analysis, compare BQML accuracy against Python ML, and deploy the API to Cloud Run. Everything fits within GCP's free tier.

→ **GitHub**: https://github.com/yasumorishima/npb-prediction

---

## Why BigQuery

Pain points with the CSV-based setup:

1. **Full re-fetch every run** — The annual pipeline re-downloads all data from scratch. No incremental updates
2. **Cross-analysis was tedious** — JOINing hitter stats with park factors meant writing pandas merge code every time
3. **Wanted SQL access** — Quick queries like "wRC+ TOP 10" or "age curve peak" required writing Python each time
4. **Wanted to try BQML** — How far can SQL-only ML go compared to Python?

---

## Architecture

```
GitHub Actions (Annual Pipeline)
  ├── Data fetch (baseball-data.com / npb.jp)
  ├── Marcel projections
  ├── ML projections (XGBoost / LightGBM)
  ├── load_to_bq.py → BigQuery 25 tables
  ├── bqml_train.py → BQML 4 models
  └── Cloud Run deploy (on master merge)

BigQuery (npb dataset)
  ├── Raw data: 15 tables
  ├── Predictions: 4 tables
  ├── Metrics: 6 tables
  ├── BQML: 4 models
  └── Analysis views: 10

Display layer
  ├── Streamlit Cloud (dashboard)
  ├── Cloud Run API (serverless)
  └── Raspberry Pi 5 API (always-on)
```

---

## Loading Data to BigQuery

`load_to_bq.py` loads CSV files into BigQuery.

```python
RAW_TABLE_MAP = {
    "npb_hitters_2015_2025.csv": "raw_hitters",
    "npb_pitchers_2015_2025.csv": "raw_pitchers",
    "npb_batting_detailed_2015_2025.csv": "raw_batting_detailed",
    "npb_sabermetrics_2015_2025.csv": "sabermetrics",
    # ... 25 tables
}
```

NPB data has column names like `K%`, `BB%`, `HR/9` which BigQuery doesn't accept. The loader sanitizes them:

```python
new = new.replace("%", "_pct")
new = new.replace("/", "_per_")
new = re.sub(r"[^a-zA-Z0-9_]", "_", new)
```

All tables use `WRITE_TRUNCATE` (full replace) on each run, so schema changes are handled automatically.

---

## BQML: ML with SQL Only

BigQuery ML lets you build features with SQL window functions and train models with `CREATE MODEL`.

### Training View (Feature Engineering)

```sql
CREATE OR REPLACE VIEW `npb.v_batter_train` AS
WITH base AS (
  SELECT player, season, OPS, wOBA, K_pct, BB_pct, Age, PA, ...
  FROM `npb.raw_hitters`
  WHERE PA >= 100
),
lagged AS (
  SELECT
    player, season,
    LAG(OPS, 1) OVER w AS OPS_y1,
    LAG(wOBA, 1) OVER w AS wOBA_y1,
    LAG(OPS, 2) OVER w AS OPS_y2,
    LAG(OPS, 1) OVER w - LAG(OPS, 2) OVER w AS OPS_delta,
    LAG(Age, 1) OVER w - 27 AS age_from_peak,
    POW(LAG(Age, 1) OVER w - 27, 2) AS age_sq,
    OPS AS target_ops
  FROM base
  WINDOW w AS (PARTITION BY player ORDER BY season)
)
SELECT * FROM lagged WHERE OPS_y1 IS NOT NULL;
```

The same lag features, deltas, and age curves I had in Python, reimplemented as SQL window functions.

### Model Training

```sql
CREATE OR REPLACE MODEL `npb.bqml_batter_ops`
OPTIONS(
  model_type = 'BOOSTED_TREE_REGRESSOR',
  input_label_cols = ['target_ops'],
  max_iterations = 200,
  learn_rate = 0.05,
  early_stop = TRUE
) AS
SELECT OPS_y1, wOBA_y1, K_pct_y1, BB_pct_y1,
       age_from_peak, age_sq, OPS_delta, ...
FROM `npb.v_batter_train`;
```

4 models total:

| Model | Target | Type |
|---|---|---|
| `bqml_batter_ops` | Next-year OPS | Boosted Tree |
| `bqml_batter_ops_linear` | Next-year OPS | Linear Regression |
| `bqml_pitcher_era` | Next-year ERA | Boosted Tree |
| `bqml_pitcher_era_linear` | Next-year ERA | Linear Regression |

---

## BQML vs Python ML Accuracy

Same data, same evaluation period, MAE comparison.

**Batter OPS MAE (lower is better)**

| Model | MAE |
|---|---|
| BQML Boosted Tree | **.0642** |
| Python (XGBoost) | .063 |
| Python (LightGBM) | .066 |
| Marcel | .063 |

**Pitcher ERA MAE (lower is better)**

| Model | MAE |
|---|---|
| BQML Boosted Tree | **.909** |
| Python (XGBoost) | .93 |
| Python (LightGBM) | .92 |
| Marcel | **.78** |

BQML performed comparably to Python ML. For pitcher ERA, both fall short of Marcel (0.78) — an ongoing challenge for ML approaches.

BQML uses more features (park factors, DIPS metrics, Marcel weighted averages), which may contribute to its Boosted Tree performance.

---

## Analysis Views

10 views for my own analysis use:

| View | Purpose |
|---|---|
| `v_batter_trend` | Player OPS/wOBA trends by season |
| `v_pitcher_trend` | Player ERA/WHIP trends + FIP approximation |
| `v_team_pythagorean` | Team win% vs Pythagorean expectation |
| `v_sabermetrics_leaders` | wRC+ leaderboard by season |
| `v_marcel_accuracy` | Marcel historical accuracy validation |
| `v_age_curve` | NPB-wide age curve (OPS × age) |
| `v_park_effects` | Park factor impact analysis |
| `v_data_coverage` | Season-by-season data coverage |
| `v_data_quality` | Per-table NULL/missing value summary |

For example, checking "2025 wRC+ TOP 10" or "age curve peak" now takes SQL instead of writing pandas code.

```sql
-- Example query from my environment
SELECT player, team, season, wRC_plus, wOBA, OPS
FROM `npb.v_sabermetrics_leaders`
WHERE season = 2025
ORDER BY wrc_rank
LIMIT 10;
```

---

## Cloud Run Deployment

Deployed the existing FastAPI to Cloud Run.

```dockerfile
FROM python:3.12-slim
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "${PORT:-8080}"]
```

Merging to master triggers automatic deployment via Artifact Registry.

The same API runs on both the Raspberry Pi 5 Docker container and Cloud Run.

---

## Free Tier Usage

Everything runs within GCP's free tier.

| Resource | Free Tier | Usage | % Used |
|---|---|---|---|
| Storage | 10 GB/mo | ~5 MB | 0.05% |
| Queries | 1 TB/mo | ~22 GB | 2.2% |
| Cloud Run | 2M requests/mo | minimal | ≈0% |

Daily BigQuery usage monitoring with projected month-end pace is sent to Discord.

---

## GitHub Actions Pipeline

The annual pipeline (`annual_update.yml`) now includes BigQuery loading, BQML training, and Cloud Run deployment.

```
Step 1: fetch_npb_data.py       → Scrape hitter/pitcher stats
Step 2: fetch_npb_detailed.py   → Detailed batting stats (for wOBA)
Step 3: pythagorean.py          → Standings + Pythagorean win%
Step 4: sabermetrics.py         → wOBA/wRC+/wRAA calculation
Step 5: marcel_projection.py    → Marcel projections
Step 6: ml_projection.py        → ML projections + model save
Step 7: git commit & push       → Auto-commit data/
Step 8: load_to_bq.py           → Load all data to BigQuery  ← NEW
Step 9: bqml_train.py           → BQML train & evaluate      ← NEW
```

BQML steps use `continue-on-error: true`, so BigQuery issues don't break the Python ML pipeline.

---

## Takeaways

- BQML accuracy was comparable to Python. Writing features as SQL window functions takes getting used to, but views make them reusable
- Analysis views are quietly useful. SQL replaces pandas for routine queries
- At ~40,000 rows, free tier usage is negligible
- Having the API on both Cloud Run and RPi5 means one can go down without losing service

---

## Related Articles

- [Why Marcel Beat LightGBM: Building an NPB Player Performance Prediction System](https://dev.to/yasunorim/why-marcel-beat-lightgbm-building-an-npb-player-performance-prediction-system-2ln4)
- [Annual Auto-Retraining for NPB Baseball Predictions with GitHub Actions](https://dev.to/yasunorim/annual-auto-retraining-for-npb-baseball-predictions-with-github-actions-30ln)
