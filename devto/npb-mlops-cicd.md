---
title: "Annual Auto-Retraining for NPB Baseball Predictions with GitHub Actions"
published: true
description: "I added CI/CD to my NPB player performance prediction system: joblib model artifacts, annual metrics JSON, a FastAPI /metrics endpoint, and an 8-step GitHub Actions pipeline. Plus the 4 bugs that only showed up in CI."
tags: python, mlops, githubactions, baseball
canonical_url: https://zenn.dev/shogaku/articles/npb-mlops-cicd
cover_image:
---

## Background

I built a Japanese professional baseball (NPB) player performance prediction system.

→ Previous article: [Why Marcel Beat LightGBM: Building an NPB Player Performance Prediction System](https://dev.to/yasunorim/why-marcel-beat-lightgbm-building-an-npb-player-performance-prediction-system-2ln4)

After getting it working, I realized I was running `python ml_projection.py` manually every March (before the season starts).

That meant all of this was manual:
- Web scraping (data fetch)
- Model retraining
- Prediction CSV update
- Checking whether accuracy improved year-over-year

So I automated it with GitHub Actions, and added model artifact saving and accuracy logging.

→ **GitHub**: https://github.com/yasumorishima/npb-prediction

---

## 3 Things I Added

| Feature | What I did |
|---|---|
| **Model saving** | `joblib` → `.pkl` files in `data/models/`, one per year |
| **Metrics logging** | Marcel vs ML MAE saved to JSON + FastAPI `/metrics` endpoint |
| **Auto-run** | GitHub Actions cron, every March 1st (after FA/transfers finalized) |

---

## ① Save Models with joblib

After training, save each model to a `.pkl` file:

```python
import joblib
from pathlib import Path

MODELS_DIR = Path("data/models")
MODELS_DIR.mkdir(parents=True, exist_ok=True)

for model_name, res in h_results.items():
    if "model" in res:
        pkl_path = MODELS_DIR / f"{model_name}_hitters_{TARGET_YEAR}.pkl"
        joblib.dump(res["model"], pkl_path)
        print(f"Saved: {pkl_path}")
```

The year in the filename prevents overwriting:

```
data/models/
├── lgb_hitters_2026.pkl
├── xgb_hitters_2026.pkl
├── lgb_pitchers_2026.pkl
└── xgb_pitchers_2026.pkl
```

---

## ② Log Accuracy to JSON, Expose via FastAPI

### Save to JSON

```python
import json
from datetime import datetime

metrics = {
    "year": TARGET_YEAR,
    "data_end_year": DATA_END_YEAR,
    "generated_at": datetime.utcnow().isoformat(),
    "hitter": {k: round(v["mae"], 4) for k, v in h_results.items() if "mae" in v},
    "pitcher": {k: round(v["mae"], 4) for k, v in p_results.items() if "mae" in v},
}
metrics["hitter"]["marcel"] = round(marcel_mae, 4)
metrics["pitcher"]["marcel"] = round(marcel_mae_p, 4)

path = Path("data/metrics") / f"metrics_{TARGET_YEAR}.json"
with open(path, "w") as f:
    json.dump(metrics, f, indent=2)
```

Example output (`metrics_2026.json`):

```json
{
  "year": 2026,
  "data_end_year": 2025,
  "generated_at": "2026-11-01T09:30:00",
  "hitter": {
    "lgb": 0.031,
    "xgb": 0.033,
    "ensemble": 0.030,
    "marcel": 0.048
  },
  "pitcher": {
    "lgb": 0.58,
    "xgb": 0.61,
    "ensemble": 0.57,
    "marcel": 0.63
  }
}
```

If `hitter.lgb < hitter.marcel`, ML is beating Marcel. Otherwise Marcel wins.

### FastAPI `/metrics` endpoint

Reads all JSON files from `data/metrics/` and returns them sorted by year:

```python
def _load_all_metrics() -> list[dict]:
    if not METRICS_DIR.exists():
        return []
    result = []
    for p in sorted(METRICS_DIR.glob("metrics_*.json")):
        with open(p, encoding="utf-8") as f:
            result.append(json.load(f))
    return sorted(result, key=lambda x: x.get("year", 0))

all_metrics = _load_all_metrics()

@app.get("/metrics")
def get_metrics():
    if not all_metrics:
        raise HTTPException(503, "No metrics data available")
    return {"count": len(all_metrics), "metrics": all_metrics}
```

As years accumulate, you can chart accuracy trends.

---

## ③ Automate Everything with GitHub Actions

Full `annual_update.yml`:

```yaml
name: Annual NPB Update

on:
  schedule:
    - cron: '0 9 1 3 *'   # March 1st, 9:00 UTC (after FA/transfers finalized, before opening day)
  workflow_dispatch:
    inputs:
      data_end_year:
        description: 'Last season year (e.g. 2025)'
        default: ''

permissions:
  contents: write  # required for git push

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: pip install pandas numpy beautifulsoup4 requests lxml scikit-learn lightgbm xgboost joblib

      - name: 1. Fetch hitter/pitcher stats
        run: python fetch_npb_data.py

      - name: 2. Fetch detailed batting stats
        run: python fetch_npb_detailed.py

      - name: 3. Fetch standings + Pythagorean
        run: python pythagorean.py

      - name: 4. Calculate wOBA/wRC+
        run: python sabermetrics.py

      - name: 5. Marcel projections
        run: python marcel_projection.py

      - name: 6. ML projections (LightGBM/XGBoost)
        run: python ml_projection.py

      - name: Commit and push updated data
        run: |
          git config user.name 'github-actions[bot]'
          git config user.email 'github-actions[bot]@users.noreply.github.com'
          git add data/
          if git diff --staged --quiet; then
            echo "No data changes to commit"
          else
            git commit -m "auto: update NPB data to ${NPB_DATA_END_YEAR}"
            git push
          fi
```

`git add data/` picks up `data/models/*.pkl` and `data/metrics/*.json` automatically.

---

## 4 Bugs That Only Appeared in CI

Local code that worked fine broke in 4 consecutive ways once it hit CI.

### Bug 1: StringDtype passed to numeric operations

```
TypeError: can't multiply sequence by non-int of type 'str'
```

Scraped data columns like `AVG`, `OBP` were still strings when used in arithmetic.

```python
# Before: only converting RC27 and XR27
for col in ["RC27", "XR27"]:
    df[col] = pd.to_numeric(df[col], errors="coerce")

# After: convert every column you'll use
for col in ["AVG", "OBP", "SLG", "OPS", "PA", "HR", ..., "RC27", "XR27"]:
    df[col] = pd.to_numeric(df[col], errors="coerce")
```

### Bug 2: NaN not caught by `== 0`

```
ValueError: cannot convert float NaN to integer
```

Bug 1's fix introduced NaN values, but `if pa == 0:` doesn't skip NaN.

```python
float('nan') == 0  # → False (not skipped!)
```

```python
# Before
if pa == 0:
    continue

# After
if pd.isna(pa) or pa == 0:
    continue
```

### Bug 3: Empty test set crashes predict

```
ValueError: Input data must be 2 dimensional and non empty.
```

Cascading NaN caused the holdout test set to be 0 rows.

```python
# Guard against empty test set
if len(X_test) > 0:
    pred = model.predict(X_test)
    mae = mean_absolute_error(y_test, pred)
    results[name] = {"model": model, "pred": pred, "mae": mae}
else:
    print("WARNING: empty test set. Saving model only.")
    results[name] = {"model": model}  # no MAE, model saved anyway
```

### Bug 4: github-actions[bot] denied write access

```
remote: Permission to ... denied to github-actions[bot].
fatal: unable to access ...: The requested URL returned error: 403
```

The default `GITHUB_TOKEN` is read-only. You need to declare write permission explicitly.

```yaml
# At the workflow level (not inside jobs)
permissions:
  contents: write
```

---

All 4 bugs were "worked locally" patterns. CI surfaces data quality issues you never notice running manually.

---

## Summary

| File | Change |
|---|---|
| `ml_projection.py` | joblib model save + `metrics_*.json` output |
| `api.py` | `/metrics` endpoint added |
| `requirements.txt` | `joblib>=1.3` added |
| `.github/workflows/annual_update.yml` | 8-step pipeline, runs every March 1st |
| `fetch_rosters.py` | Fetch registered player roster (excludes departed/MLB players from Marcel) |

Each run produces:

```
data/models/lgb_hitters_2026.pkl
data/models/xgb_hitters_2026.pkl
data/models/lgb_pitchers_2026.pkl
data/models/xgb_pitchers_2026.pkl
data/metrics/metrics_2026.json
```

All committed to the repo automatically. Once multiple years accumulate, accuracy trends become trackable. Whether this qualifies as "MLOps" is debatable, but it's no longer a "run the script manually every March" operation.

→ **GitHub**: https://github.com/yasumorishima/npb-prediction
