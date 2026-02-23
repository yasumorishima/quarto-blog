---
title: MLB Bat Tracking Dataset (2024-2025)
published: true
description: Swing speed, attack angle, and other bat tracking statistics for 452 MLB batters across the 2024 and 2025 seasons
tags: baseball, mlb, kaggle, dataset
canonical_url: https://yasumorishima.github.io/quarto-blog/posts/dataset2-bat-tracking/
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

## Data Collection

This dataset was collected directly from Baseball Savant using custom scraping, as pybaseball does not yet support bat tracking data.

**Data Source:** [Baseball Savant Bat Tracking Leaderboard](https://baseballsavant.mlb.com/leaderboard/bat-tracking)

```python
import pandas as pd
import requests
from bs4 import BeautifulSoup

# Example: Fetching 2024 bat tracking data
url = "https://baseballsavant.mlb.com/leaderboard/bat-tracking?year=2024"
response = requests.get(url)
# Parse HTML and extract table data
# (Full implementation available in the dataset repository)
```

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
| `fast_swing_rate` | float | Percentage of fast swings (0-100%) |
| `swords_rate` | float | Percentage of swings-and-misses on pitches in zone (0-100%) |

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

## Insights from Bat Tracking Data

### What Makes a Good Hitter?

Bat tracking data reveals that elite hitters typically have:

- **High bat speed** (75+ mph)
- **High squared-up rate** (30%+)
- **Optimal attack angle** (10-20 degrees for most hitters)
- **Short swing length** (Efficient swing mechanics)

### Comparing Swing Profiles

Different player types show distinct swing profiles:

- **Power hitters**: High bat speed, steep attack angle
- **Contact hitters**: Lower swing length, high squared-up rate
- **Speed-focused players**: Fast swing rate, shallow attack angle

## Links

- **Dataset**: https://www.kaggle.com/datasets/yasunorim/mlb-bat-tracking-2024-2025
- **GitHub Repository**: https://github.com/yasumorishima/kaggle-datasets
- **Baseball Savant**: https://baseballsavant.mlb.com/leaderboard/bat-tracking
