---
title: "MLB Statcast + Bat Tracking Dataset (2024-2025)"
published: true
description: "Comprehensive MLB Statcast dataset with Bat Tracking metrics for 2024-2025 seasons. 1.4M pitches, 118 columns including bat_speed, swing_length, and swing mechanics data."
tags: kaggle, baseball, datascience, machinelearning
canonical_url: https://yasumorishima.github.io/quarto-blog/posts/dataset4-mlb-statcast-bat-tracking/
cover_image: https://raw.githubusercontent.com/yasumorishima/quarto-blog/main/posts/dataset4-mlb-statcast-bat-tracking/thumbnail.png
---

I've published a comprehensive MLB Statcast dataset with Bat Tracking metrics for the 2024-2025 seasons on Kaggle.

**Dataset:** [MLB Statcast + Bat Tracking (2024-2025)](https://www.kaggle.com/datasets/yasunorim/mlb-statcast-bat-tracking-2024-2025)

## What is Bat Tracking?

Bat Tracking is a revolutionary measurement technology introduced by MLB in 2024 that quantifies batting mechanics using high-speed cameras. It captures:

- **bat_speed**: Bat velocity at contact (mph)
- **swing_length**: Path length of the bat to contact (feet) - shorter indicates more efficient mechanics
- **swing_path_tilt**: Angle of swing plane (degrees) - positive = uppercut, negative = downward
- **attack_angle**: Bat angle relative to pitch trajectory (degrees)
- **attack_direction**: Horizontal bat angle (degrees) - indicates pull vs opposite field tendency

While traditional Statcast focused on **batted ball outcomes** (exit velocity, launch angle), Bat Tracking quantifies **the swing itself** - opening new dimensions for analysis.

## Dataset Overview

### Basic Information
- **Period**: 2024-2025 Regular Seasons
- **Rows**: 1,443,802 pitches (~1.4M)
- **Columns**: 118 metrics
- **Size**: 808MB
- **Bat Tracking Coverage**: ~46.6% of pitches (~672,000 swings)

### Key Metrics

**Bat Tracking Metrics**
- bat_speed, swing_length, swing_path_tilt
- attack_angle, attack_direction
- intercept_ball_minus_batter_pos_x/y_inches

**Statcast Metrics (Traditional)**
- release_speed, spin_rate, movement (pfx_x, pfx_z)
- launch_speed, launch_angle, hit_distance_sc
- estimated_woba, estimated_ba_using_speedangle
- pitch_type, zone, description, events

**Game Context**
- game_date, game_type, inning, count (balls/strikes)
- player_name, batter, pitcher, stand, p_throws
- home/away score, win expectancy

All 118 columns have detailed descriptions on Kaggle.

## How to Access

The dataset is easily accessible via pybaseball's `statcast()` function. Bat Tracking metrics are automatically included.

```python
from pybaseball import statcast
import pandas as pd

# 2024 season
df_2024 = statcast(start_dt='2024-03-20', end_dt='2024-09-29')

# 2025 season
df_2025 = statcast(start_dt='2025-03-27', end_dt='2025-09-28')

# Combine
df = pd.concat([df_2024, df_2025], ignore_index=True)

# Check bat tracking coverage
print(f"Bat tracking coverage: {df['bat_speed'].notna().sum() / len(df) * 100:.1f}%")
```

Data generation notebook is available on Google Colab:
[Generate Dataset](https://colab.research.google.com/github/yasumorishima/kaggle-datasets/blob/main/dataset4_statcast_bat_tracking/generate.ipynb)

## Analysis Notebook

I've created a comprehensive analysis notebook demonstrating the dataset's potential:

[MLB Bat Tracking Analysis 2024-2025](https://www.kaggle.com/code/yasunorim/mlb-bat-tracking-analysis-2024-2025)

**Analysis Includes:**
1. Bat Tracking coverage analysis
2. Distribution of bat_speed, swing_length, swing_path_tilt
3. Correlation: bat_speed vs launch_speed
4. Top 10 bat speed leaders by player
5. Average bat speed by pitch type
6. Heatmap: attack_angle vs attack_direction

## Use Cases

This dataset enables various types of analysis:

### 1. Swing Mechanics Analysis
- Efficient swing path (swing_length vs bat_speed)
- Uppercut effectiveness (swing_path_tilt vs launch_angle)
- Fastest bat speed rankings

### 2. Pitch-Swing Relationships
- Which pitch types generate higher bat_speed?
- Swing tendencies by count
- Relationship between pitch location and attack_direction

### 3. Batted Ball Outcomes
- bat_speed → launch_speed conversion efficiency
- swing_length impact on batting average
- attack_angle correlation with barrel rate

### 4. Player Development & Scouting
- Evaluating draft prospects' swing efficiency
- Tracking player swing improvements
- Opponent tendency analysis

## Comparison with Other Datasets

My previous baseball datasets:

1. [Japanese MLB Players Statcast (2015-2025)](https://www.kaggle.com/datasets/yasunorim/japan-mlb-pitchers-batters-statcast)
   - 25 pitchers + 10 batters detailed data

2. [MLB Bat Tracking Leaderboard (2024-2025)](https://www.kaggle.com/datasets/yasunorim/mlb-bat-tracking-2024-2025)
   - Season-aggregated data for 452 players

3. [MLB Pitcher Arsenal Evolution (2020-2025)](https://www.kaggle.com/datasets/yasunorim/mlb-pitcher-arsenal-2020-2025)
   - Pitch mix changes over time

**This Dataset's Unique Features:**
- **Pitch-by-pitch granularity**
- Most comprehensive dataset including Bat Tracking metrics
- Two full seasons of data

## Conclusion

Bat Tracking adds a new dimension to baseball analysis. Instead of seeing only **results**, we can now quantify the **process** of hitting.

I hope this dataset contributes to baseball analytics, machine learning research, and sports science.

## Links

- **Dataset**: https://www.kaggle.com/datasets/yasunorim/mlb-statcast-bat-tracking-2024-2025
- **Analysis Notebook**: https://www.kaggle.com/code/yasunorim/mlb-bat-tracking-analysis-2024-2025
- **GitHub Repository**: https://github.com/yasumorishima/kaggle-datasets
- **Data Generation**: [Google Colab](https://colab.research.google.com/github/yasumorishima/kaggle-datasets/blob/main/dataset4_statcast_bat_tracking/generate.ipynb)
