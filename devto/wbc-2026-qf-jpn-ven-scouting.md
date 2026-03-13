---
title: I Built a WBC Quarterfinal Scouting App with MLB Statcast Data
published: true
description: A 5-tab Streamlit dashboard analyzing Japan vs Venezuela using pitch-by-pitch MLB Statcast data — no coaching tone, just numbers
tags: baseball, python, streamlit, datascience
---

## What I Built

A Streamlit scouting dashboard for the WBC 2026 Quarterfinal: Japan vs Venezuela.

**App**: [https://wbc-qf-jpn-ven.streamlit.app/](https://wbc-qf-jpn-ven.streamlit.app/)
**GitHub**: [https://github.com/yasumorishima/wbc-scouting](https://github.com/yasumorishima/wbc-scouting)

For the pool round, I built 30 team-level dashboards (20 teams). But quarterfinals are head-to-head matchups — you want to know "which pitch type is effective against this batter?" and "which zone has the highest opponent BA against this pitcher?" in one place.

## 5-Tab Structure

### 🎯 Tab 1: Matchup Preview

![Predicted Lineup Table](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/wbc-qf-lineup-table.png)

Venezuela's predicted starting lineup (9 batters) table, an alert for Machado (NPB player, no Statcast data), and a bench/pinch-hit candidates table.

Each batter expands into a full scouting report:

- 6 key metrics (AVG/OBP/SLG/OPS/K%/BB%) with MLB average comparison
- Radar chart (5-axis, MLB average line overlay)
- Zone heatmaps (3x3, 5x5) — BA and xwOBA by zone, split by vs LHP/RHP
- Spray charts — split by vs LHP/RHP

![Spray Charts (vs LHP / vs RHP)](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/wbc-qf-spray-chart.png)
- Platoon splits (OPS/AVG/K%/BB% side by side)
- Pitching plan — overall + vs LHP + vs RHP. Auto-generated from pitch type whiff rates, zone-level BA, count-split OPS, and platoon data
- Defensive positioning — auto-generated from spray angle, ground ball rate, and exit velocity, split by pitcher handedness
- Pitch type performance table (BA, SLG, Whiff%, Chase%)
- Count-based performance (color-coded: green=hitter ahead, red=behind, amber=even)

At the bottom, there's a full analysis section for the starting pitcher (Ranger Suárez, LHP) with hitting approach (as LHB/RHB), arsenal table, movement chart, location heatmaps, platoon splits, and pitch selection by count — all in collapsible expanders.

### 📋 Tab 2: Game Plan

Statcast data organized by game phase:

![Team Weakness Analysis](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/wbc-qf-weakness-analysis.png)

- **Team weakness detection** — batters with K% ≥ 22.4% (MLB avg), BB% < 8.3%, or platoon OPS gap ≥ 80 pts, auto-extracted with player names and values
- **Innings 1-3 vs Suárez (starter)** — Batting: SP's K%/BB%/Whiff%/velocity and pitch mix. Pitching: per-batter AVG/K%/BB% grouped by lineup position (#1-3, #4-6, #7-9)
- **Innings 4-5 (2nd time through or bullpen transition)** — Batting: bridge reliever stats. Pitching: MLB league-wide trend (opp OPS rises 15-20% on 2nd time through) plus batter classification by K% and BB%
- **Innings 6+ (high-leverage)** — Batting: closer/setup K%/Whiff%/Chase%/velocity with pitcher type classification. Pitching: platoon matchup data for batters with significant splits, full per-batter stat line
- **Pinch-hit candidates** — bench player AVG/OPS/K%

Every piece of text is driven by MLB Statcast numbers only. No coaching instructions — just data.

### ⚔️ Tab 3: Lineup Scouting

Team batting radar chart at the top (AVG/OBP/SLG/K%/BB%, 5-axis, MLB average line overlay). Below that, a full roster table and a dropdown selector for individual player analysis (metrics, scouting summary, pitching plan, defensive positioning, radar chart, zone heatmaps, spray charts, etc.).

### 🎱 Tab 4: Starting Pitcher Analysis

Ranger Suárez's pitching data. Metric cards (avg velocity, avg spin, whiff%, chase%, put away%, opp avg, etc.) and scouting summary, plus collapsible expanders for:

- Hitting approach (as LHB / as RHB)
- Arsenal table (velocity mph/km/h, break, whiff%, put away%) + movement chart
- Pitch location heatmap + platoon splits
- Pitch selection by count (donut charts) + count-based performance

![Pitch Selection by Count](https://raw.githubusercontent.com/yasumorishima/zenn-content/master/images/wbc-qf-pitch-selection.png)

### 🔥 Tab 5: Bullpen Scouting

Bullpen overview (all relievers' ERA, K%, velocity in one info box), then a dropdown selector for individual reliever analysis. Same structure as Tab 4 (metric cards, scouting summary, hitting approach, arsenal, heatmaps, count analysis).

## Technical Highlights

### Dynamic text generation from raw Statcast data

Six generator functions compute per-player analysis from pitch-by-pitch data:

| Function | Purpose |
|----------|---------|
| `generate_player_summary()` | Batter scouting summary (strengths/weaknesses) |
| `generate_pitcher_summary()` | Pitcher scouting summary |
| `generate_pitching_plan()` | How to pitch to a batter (pitch types, zones, counts, platoon) |
| `generate_hitting_plan()` | How to hit a pitcher (hittable pitches, zones, counts) |
| `generate_defensive_positioning()` | Infield/outfield shift recommendation from spray data |
| `generate_sp_pitch_analysis()` | Starting pitcher's pitch-by-pitch analysis |

Each function calculates stats from raw Statcast data and outputs only items that cross statistical thresholds:

```python
# Example: identify the pitch type with highest opponent BA
hittable = sorted(
    [p for p in pt_stats if p["ba"] is not None],
    key=lambda x: x["ba"], reverse=True
)
if hittable and hittable[0]["ba"] >= 0.250:
    h = hittable[0]
    lines.append(
        f"- **Highest opp BA pitch:** {h['label']}"
        f" (BA .{int(h['ba']*1000):03d})"
    )
```

### MLB average as baseline for every stat

A raw number like "SLG .476" is meaningless without context. Every stat shows the MLB average alongside it:

```
K% 28.3% (MLB avg 22.4%)
BB% 6.1% (MLB avg 8.3%)
```

### Handedness-aware zone names

"Inside" and "outside" flip depending on batter handedness. `_zone_names_for_bats()` automatically adjusts zone labels so "inside high" is always correct relative to the batter's stance.

### Glossary built into every section

Every stat has a **?** tooltip (Streamlit's `help` parameter) showing its definition and MLB average. Count displays include a reading guide ("Balls-Strikes" format) with color legend (🟢 hitter ahead, 🔴 hitter behind, 🟡 even).

## Data Source

- [Baseball Savant](https://baseballsavant.mlb.com/) Statcast data (2024-2025 MLB regular season)
- Retrieved via [pybaseball](https://github.com/jldbc/pybaseball)

## Related

- [I Built a WBC 2026 Scouting Dashboard with MLB Statcast Data](https://dev.to/shogaku/i-built-a-wbc-2026-scouting-dashboard-with-mlb-statcast-data-3k3j)
