---
title: MLB Pitcher Arsenal Evolution Dataset (2020-2025)
published: true
description: Comprehensive pitch arsenal metrics tracking the evolution of MLB pitchers' repertoires from 2020 to 2025
tags: baseball, mlb, kaggle, pitching
canonical_url: https://yasumorishima.github.io/quarto-blog/posts/dataset3-pitcher-arsenal/
cover_image: https://storage.googleapis.com/kaggle-datasets-images/6275933/10286009/d8dcdcfac01e8b7bfc39869e79eb2f48/dataset-cover.png
---

## Introduction

I've published a Kaggle dataset that tracks the year-over-year evolution of MLB pitchers' arsenals from 2020 to 2025. This dataset enables analysis of how pitchers adjust their pitch mix, velocity, and spin rates over time.

**Dataset Link:** https://www.kaggle.com/datasets/yasunorim/mlb-pitcher-arsenal-2020-2025

## Dataset Overview

This dataset provides pitch-by-pitch aggregated metrics for MLB pitchers across six seasons (2020-2025).

### Basic Information

- **Period**: 2020-2025 seasons (6 seasons)
- **Rows**: 4,253 rows (pitcher × season combinations)
- **Columns**: 111 columns
- **Format**: Wide format (1 row = 1 pitcher × 1 season)
- **Filter**: Only pitchers with 100+ pitches in a season
- **Quality Score**: 10.0/10 on Kaggle

### Data Source

Data is sourced from MLB Advanced Media (Statcast) via the [pybaseball](https://github.com/jldbc/pybaseball) library and aggregated by pitcher × season × pitch type.

---

## Data Structure

### Identifier Columns (3 columns)

- `player_id`: MLB player ID
- `player_name`: Player name
- `season`: Season year (2020-2025)

### Pitch Metrics (18 pitch types × 6 metrics = 108 columns)

For each pitch type, the dataset includes 6 metrics:

1. **usage_pct**: Usage rate (0-100%)
2. **avg_speed**: Average velocity (mph)
3. **avg_spin**: Average spin rate (rpm)
4. **whiff_rate**: Whiff rate (0-1)
5. **avg_pfx_x**: Average horizontal movement (inches, gravity-adjusted)
6. **avg_pfx_z**: Average vertical movement (inches, gravity-adjusted)

### Pitch Types (18 types)

FF (Four-seam), SI (Sinker), FC (Cutter), SL (Slider), CU (Curve), CH (Changeup), FS (Splitter), KC (Knuckle Curve), FO (Forkball), EP (Eephus), KN (Knuckleball), ST (Sweeper), SV (Slurve), and more.

---

## Usage

### Downloading the Data

Download the CSV directly from Kaggle:

```python
import pandas as pd

# Download via Kaggle API
!kaggle datasets download -d yasunorim/mlb-pitcher-arsenal-2020-2025

# Load data
df = pd.read_csv('pitcher_arsenal_evolution_2020_2025.csv')
```

### Analysis Notebook

A comprehensive analysis notebook is also available:

https://www.kaggle.com/code/yasunorim/pitcher-arsenal-analysis

The notebook includes:

- Individual pitcher arsenal trend analysis
- MLB-wide pitch type trends (2020-2025)
- Velocity change analysis
- Correlation heatmaps

---

## Use Cases

### 1. Pitcher Arsenal Trend Analysis

Track year-over-year changes in a specific pitcher's repertoire:

```python
# Yusei Kikuchi's pitch usage evolution
kikuchi = df[df['player_name'].str.contains('Kikuchi', case=False)]
kikuchi.plot(x='season', y=['SL_usage_pct', 'FF_usage_pct', 'CH_usage_pct'])
```

For Kikuchi, slider usage increased from ~20% in 2019 to over 40% in 2022-2025, showing a significant shift in pitch mix strategy.

### 2. MLB-Wide Trend Analysis

Visualize league-wide pitch type trends:

```python
# Calculate yearly average usage rates
yearly_avg = df.groupby('season')[['FF_usage_pct', 'SI_usage_pct', 'SL_usage_pct']].mean()
yearly_avg.plot(kind='line', marker='o')
```

Recent trends show increasing usage of sliders and sweepers across MLB.

### 3. Machine Learning Features

Use arsenal metrics as features for pitcher performance prediction:

```python
# Calculate pitch diversity
df['pitch_diversity'] = (df[[col for col in df.columns if 'usage_pct' in col]] > 5).sum(axis=1)
```

---

## Related Datasets

I've published other MLB datasets on Kaggle:

- [Japanese MLB Players Statcast (2015-2025)](https://www.kaggle.com/datasets/yasunorim/japan-mlb-pitchers-batters-statcast)
- [MLB Bat Tracking (2024-2025)](https://www.kaggle.com/datasets/yasunorim/mlb-bat-tracking-2024-2025)

All datasets have a quality score of 10.0/10.

---

## Links

- **Dataset**: https://www.kaggle.com/datasets/yasunorim/mlb-pitcher-arsenal-2020-2025
- **Analysis Notebook**: https://www.kaggle.com/code/yasunorim/pitcher-arsenal-analysis
- **GitHub Repository**: https://github.com/yasumorishima/kaggle-datasets
