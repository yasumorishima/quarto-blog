---
title: MLB Bat Tracking Dataset (2024-2025)
published: true
description: Comprehensive bat tracking metrics for MLB batters across 2024 and 2025 seasons
tags: baseball, mlb, kaggle, battracking
canonical_url: https://yasumorishima.github.io/quarto-blog/posts/dataset2-bat-tracking/
cover_image: https://storage.googleapis.com/kaggle-datasets-images/6262899/10269697/c7b52e8cd9eff3b2d8cb9c6ea01bde29/dataset-cover.png
---

## Introduction

I've published a Kaggle dataset containing MLB Bat Tracking metrics for the 2024 and 2025 seasons. This dataset provides swing speed, attack angle, and other bat tracking statistics that were introduced by MLB in 2024.

**Dataset Link:** https://www.kaggle.com/datasets/yasunorim/mlb-bat-tracking-2024-2025

## Dataset Overview

**MLB Bat Tracking (2024-2025)**

- **Batters**: 452 batters (226 per season)
- **Columns**: 19 columns
- **Seasons**: 2024, 2025
- **Source**: Baseball Savant (directly accessed, not via pybaseball)
- **Quality Score**: 10.0/10 on Kaggle

---

## What is Bat Tracking?

Bat Tracking is a new technology introduced by MLB in 2024 that measures swing metrics using high-speed cameras. It provides insights into swing mechanics that were previously unavailable.

### Key Metrics

| Metric | Description |
|---|---|
| `bat_speed` | Swing speed at contact (mph) |
| `swing_length` | Length of swing path (feet) |
| `squared_up_rate` | Rate of optimal bat-ball contact (0-1) |
| `attack_angle` | Swing plane angle (degrees) |
| `blast_avg` | Percentage of swings with both high speed and optimal contact |

---

## Dataset Schema

### Main Columns

| Column | Type | Description |
|---|---|---|
| `year` | int | Season year (2024 or 2025) |
| `player_name` | str | Player name |
| `player_id` | int | MLBAM player ID |
| `bat_speed` | float | Average bat speed (mph) |
| `swing_length` | float | Average swing length (feet) |
| `squared_up_rate` | float | Rate of squared-up contact (0-100%) |
| `attack_angle` | float | Average attack angle (degrees) |
| `blast_avg` | float | BLAST score (0-100) |

---

## Usage in Kaggle Notebooks

### Loading the Dataset

```python
import pandas as pd

# Load bat tracking data
df = pd.read_csv('/kaggle/input/mlb-bat-tracking-2024-2025/bat_tracking_2024_2025.csv')

print(f"Total records: {len(df)}")
print(f"Seasons: {df['year'].unique()}")
print(f"Average bat speed: {df['bat_speed'].mean():.2f} mph")
```

### Year-over-Year Comparison

```python
import matplotlib.pyplot as plt

# Compare bat speed distribution between seasons
df_2024 = df[df['year'] == 2024]
df_2025 = df[df['year'] == 2025]

plt.hist(df_2024['bat_speed'], alpha=0.5, label='2024', bins=20)
plt.hist(df_2025['bat_speed'], alpha=0.5, label='2025', bins=20)
plt.xlabel('Bat Speed (mph)')
plt.ylabel('Frequency')
plt.legend()
plt.title('Bat Speed Distribution: 2024 vs 2025')
plt.show()
```

---

## Analysis Examples

### Top Performers by Bat Speed

```python
# Top 10 fastest bat speeds in 2025
top_bat_speed = df[df['year'] == 2025].nlargest(10, 'bat_speed')[
    ['player_name', 'bat_speed', 'squared_up_rate', 'attack_angle']
]
print(top_bat_speed)
```

### Squared-Up Rate Analysis

```python
import seaborn as sns

# Relationship between bat speed and squared-up rate
sns.scatterplot(data=df, x='bat_speed', y='squared_up_rate', hue='year', alpha=0.6)
plt.xlabel('Bat Speed (mph)')
plt.ylabel('Squared-Up Rate (%)')
plt.title('Bat Speed vs Squared-Up Rate')
plt.show()
```

---

## Links

- **Dataset**: https://www.kaggle.com/datasets/yasunorim/mlb-bat-tracking-2024-2025
- **GitHub Repository**: https://github.com/yasumorishima/kaggle-datasets
- **Baseball Savant**: https://baseballsavant.mlb.com/leaderboard/bat-tracking
