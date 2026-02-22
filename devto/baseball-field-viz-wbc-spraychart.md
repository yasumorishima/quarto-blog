---
title: "Draw Baseball Fields and Spray Charts in matplotlib: baseball-field-viz"
published: true
description: "baseball-field-viz is a Python library for Statcast spray charts in matplotlib — enabling heatmap overlays that pybaseball's built-in spraychart() doesn't support. Demonstrated with MLB Statcast data for WBC 2026 roster players."
tags: python, baseball, matplotlib, datascience
canonical_url: https://zenn.dev/shogaku/articles/baseball-field-viz-wbc-spraychart
cover_image:
---

## Background

pybaseball's built-in `spraychart()` is convenient, but it doesn't support overlaying heatmaps — making it hard to visualize batted ball density by zone.

To use seaborn's `kdeplot` or `histplot` on top of a baseball field, you need to draw the field manually in matplotlib. Writing the coordinate transform and field drawing code every time is tedious, so I packaged it.

```bash
pip install baseball-field-viz
```

**PyPI**: https://pypi.org/project/baseball-field-viz/
**GitHub**: https://github.com/yasumorishima/baseball-field-viz

## What baseball-field-viz provides

Three functions for Statcast visualization:

```python
from baseball_field_viz import transform_coords, draw_field, spraychart
```

| Function | Description |
|---|---|
| `transform_coords(df)` | Convert Statcast `hc_x`/`hc_y` to feet (home plate at origin) |
| `draw_field(ax)` | Draw a baseball field on a matplotlib Axes |
| `spraychart(ax, df, color_by='events')` | One-liner combining the two above |

## Usage

### Quickstart

```python
import matplotlib.pyplot as plt
from baseball_field_viz import spraychart

fig, ax = plt.subplots(figsize=(10, 10))
spraychart(ax, df, color_by='events', title='Player — Batted Balls')
plt.show()
```

With `color_by='events'`: home run = red, triple = orange, double = blue, single = green.

### Overlay a heatmap (the key advantage)

Since `draw_field` returns the `Axes` object, you can layer any matplotlib/seaborn plot on top:

```python
import seaborn as sns
from baseball_field_viz import draw_field, transform_coords

df_t = transform_coords(df[df['hc_x'].notna()])
hits = df_t[df_t['events'].isin(['home_run', 'double', 'triple', 'single'])]
outs = df_t[~df_t['events'].isin(['home_run', 'double', 'triple', 'single'])]

fig, axs = plt.subplots(1, 2, figsize=(16, 8))

draw_field(axs[0])
sns.kdeplot(data=hits, x='x', y='y', ax=axs[0],
            cmap='Reds', fill=True, alpha=0.6)
axs[0].set_xlim(-350, 350); axs[0].set_ylim(-50, 400)
axs[0].set_title('Hits Heatmap')

draw_field(axs[1])
sns.kdeplot(data=outs, x='x', y='y', ax=axs[1],
            cmap='Blues', fill=True, alpha=0.6)
axs[1].set_xlim(-350, 350); axs[1].set_ylim(-50, 400)
axs[1].set_title('Outs Heatmap')

plt.tight_layout()
plt.show()
```

## Applied to WBC 2026 Roster Players

I published a Kaggle notebook using this library with the WBC 2026 Scouting dataset — **MLB regular season Statcast data (2024–2025) for players on WBC 2026 rosters** across all 18 countries. Note: this is not WBC game data, but MLB data for WBC-eligible players.

**Kaggle Notebook**: https://www.kaggle.com/code/yasunorim/mlb-statcast-spray-charts-for-wbc-2026-players

### All 18 countries — overview spray chart

Using `draw_field` + per-country scatter with tab20 colormap:

```python
from baseball_field_viz import draw_field, transform_coords
import matplotlib.cm as cm

hits = transform_coords(df[df['hc_x'].notna() & df['events'].isin(hit_events)])
country_list = sorted(hits['country_name'].unique())
colors = cm.tab20(np.linspace(0, 1, len(country_list)))
color_map = dict(zip(country_list, colors))

fig, ax = plt.subplots(figsize=(12, 12))
draw_field(ax)
for country in country_list:
    subset = hits[hits['country_name'] == country]
    ax.scatter(subset['x'], subset['y'],
               c=[color_map[country]], alpha=0.35, s=12,
               label=f"{country} ({len(subset)})")
ax.legend(loc='upper right', fontsize=8, ncol=2)
plt.show()
```

### Top 4 countries comparison

`spraychart()` makes per-country grids straightforward:

```python
top_countries = ['USA', 'Dominican Republic', 'Venezuela', 'Japan']
fig, axs = plt.subplots(2, 2, figsize=(16, 14))

for ax, country in zip(axs.flat, top_countries):
    df_c = df[df['country_name'] == country]
    spraychart(ax, df_c, color_by='events', title=country)

plt.tight_layout()
plt.show()
```

### Japan — hits vs outs heatmap

The kdeplot overlay reveals zone-level tendencies in a way scatter plots can't:

```python
df_jpn_t = transform_coords(df[df['country_name'] == 'Japan'][df['hc_x'].notna()])
hits_jpn = df_jpn_t[df_jpn_t['events'].isin(hit_events)]
outs_jpn = df_jpn_t[~df_jpn_t['events'].isin(hit_events)]

fig, axs = plt.subplots(1, 2, figsize=(16, 8))
draw_field(axs[0])
sns.kdeplot(data=hits_jpn, x='x', y='y', ax=axs[0], cmap='Reds', fill=True, alpha=0.6)
draw_field(axs[1])
sns.kdeplot(data=outs_jpn, x='x', y='y', ax=axs[1], cmap='Blues', fill=True, alpha=0.6)
plt.show()
```

## WBC 2026 Scouting Dashboard

The WBC 2026 Scouting dataset also powers an interactive dashboard:

**https://wbc-2026-scouting-dashboard-zvg.caffeine.xyz/**

Per-player batting and pitching stats for all 18 countries, built from the same Statcast data.

## v0.2.0: Strike Zone Support

v0.2.0 adds two new functions:

| Function | Description |
|---|---|
| `draw_strike_zone(ax, sz_top=3.5, sz_bot=1.5)` | Draw strike zone rectangle in plate_x/plate_z coordinates |
| `pitch_zone_chart(ax, df, color_by='pitch_type')` | Plot pitch locations with auto-sized strike zone |

```python
from pybaseball import statcast_pitcher
from baseball_field_viz import pitch_zone_chart

df = statcast_pitcher('2025-03-01', '2025-10-31', 592789)  # Yoshinobu Yamamoto

fig, ax = plt.subplots(figsize=(6, 6))
pitch_zone_chart(ax, df, color_by='pitch_type', title='Yamamoto 2025 — Pitch Locations')
plt.show()
```

Statcast includes per-pitch `sz_top`/`sz_bot` columns (Hawk-Eye measured, not height-derived). When present in the DataFrame, `pitch_zone_chart` uses their mean automatically — so the strike zone reflects each batter's actual stance, not an estimate.

## Installation

```bash
pip install baseball-field-viz
```

Requirements: Python 3.9+, matplotlib >= 3.5, numpy >= 1.21, pandas >= 1.3

## Summary

- `draw_field(ax)` + `spraychart()` replace boilerplate Statcast visualization code
- Direct `Axes` access enables heatmap overlays not possible with pybaseball's `spraychart()`
- Tested with WBC 2026 Statcast data across 18 countries

**PyPI**: https://pypi.org/project/baseball-field-viz/
**GitHub**: https://github.com/yasumorishima/baseball-field-viz
