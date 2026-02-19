---
title: I Built a WBC 2026 Scouting Dashboard with MLB Statcast Data
published: true
description: 30 Streamlit apps and a Kaggle dataset covering 20 national teams with pitch-by-pitch MLB Statcast data for WBC 2026 roster players
tags: baseball, kaggle, streamlit, python
---

## What I Built

For WBC 2026 (World Baseball Classic), I created three scouting tools using MLB Statcast data:

1. **Streamlit Scouting Dashboards** — 30 apps covering all 20 national teams (17 batter + 13 pitcher dashboards)
2. **Kaggle Dataset** — Statcast data for 20 countries, 540,000+ pitches
3. **Kaggle EDA Notebook** — Country-by-country analysis

---

## 1. Scouting Dashboards

**GitHub**: https://github.com/yasumorishima/wbc-scouting

The dashboards visualize Statcast data for MLB-affiliated WBC 2026 roster players.

- **Batter dashboards**: 17 countries, 105 players
- **Pitcher dashboards**: 13 countries, 86 players

Each national team has its own independent Streamlit app (30 apps total).

### Batter Dashboard Features

Spray charts, exit velocity, launch angle, and count-based performance.

![Spray Chart](https://raw.githubusercontent.com/yasumorishima/zenn-content/main/images/wbc-batter-spray-chart.png)

Strike zone split into a 3x3 grid with performance heatmaps for each zone.

![Zone Heatmap](https://raw.githubusercontent.com/yasumorishima/zenn-content/main/images/wbc-batter-zone-heatmap.png)

### Pitcher Dashboard Features

Pitch location distribution by pitch type, L/R splits, and count-based tendencies.

![Pitch Location](https://raw.githubusercontent.com/yasumorishima/zenn-content/main/images/wbc-pitcher-location.png)

Pitch movement chart showing horizontal and vertical break by pitch type.

![Pitch Movement](https://raw.githubusercontent.com/yasumorishima/zenn-content/main/images/wbc-pitcher-movement.png)

### Dashboard URLs

| Country | Batters | Pitchers |
|---|---|---|
| USA | [wbc-usa-batters](https://wbc-usa-batters.streamlit.app/) | [wbc-usa-pitchers](https://wbc-usa-pitchers.streamlit.app/) |
| Japan | [wbc-japan-batters](https://wbc-japan-batters.streamlit.app/) | [wbc-japan-pitchers](https://wbc-japan-pitchers.streamlit.app/) |
| Dominican Republic | [wbc-dr-batters](https://wbc-dr-batters.streamlit.app/) | [wbc-dr-pitchers](https://wbc-dr-pitchers.streamlit.app/) |
| Mexico | [wbc-mex-batters](https://wbc-mex-batters.streamlit.app/) | [wbc-mex-pitchers](https://wbc-mex-pitchers.streamlit.app/) |
| Puerto Rico | [wbc-pr-batters](https://wbc-pr-batters.streamlit.app/) | [wbc-pr-pitchers](https://wbc-pr-pitchers.streamlit.app/) |
| Korea | [wbc-kor-batters](https://wbc-kor-batters.streamlit.app/) | [wbc-kor-pitchers](https://wbc-kor-pitchers.streamlit.app/) |
| Netherlands | [wbc-ned-batters](https://wbc-ned-batters.streamlit.app/) | [wbc-ned-pitchers](https://wbc-ned-pitchers.streamlit.app/) |
| Canada | [wbc-can-batters](https://wbc-can-batters.streamlit.app/) | [wbc-can-pitchers](https://wbc-can-pitchers.streamlit.app/) |
| Italy | [wbc-ita-batters](https://wbc-ita-batters.streamlit.app/) | [wbc-ita-pitchers](https://wbc-ita-pitchers.streamlit.app/) |
| Israel | [wbc-isr-batters](https://wbc-isr-batters.streamlit.app/) | [wbc-isr-pitchers](https://wbc-isr-pitchers.streamlit.app/) |
| Great Britain | [wbc-gb-batters](https://wbc-gb-batters.streamlit.app/) | [wbc-gb-pitchers](https://wbc-gb-pitchers.streamlit.app/) |
| Panama | [wbc-pan-batters](https://wbc-pan-batters.streamlit.app/) | [wbc-pan-pitchers](https://wbc-pan-pitchers.streamlit.app/) |
| Colombia | [wbc-col-batters](https://wbc-col-batters.streamlit.app/) | [wbc-col-pitchers](https://wbc-col-pitchers.streamlit.app/) |
| Cuba | [wbc-cuba-batters](https://wbc-cuba-batters.streamlit.app/) | — |
| Chinese Taipei | [wbc-twn-batters](https://wbc-twn-batters.streamlit.app/) | — |
| Nicaragua | [wbc-nic-batters](https://wbc-nic-batters.streamlit.app/) | — |
| Australia | [wbc-aus-batters](https://wbc-aus-batters.streamlit.app/) | — |

> **Note**: Streamlit apps go to sleep after inactivity. If you see "Zzzz" or "Your app is in the oven," just wait a moment or reload the page.

---

## 2. Kaggle Dataset

https://www.kaggle.com/datasets/yasunorim/wbc-2026-scouting

![Dataset Page](https://raw.githubusercontent.com/yasumorishima/zenn-content/main/images/wbc-kaggle-dataset.png)

Pitch-by-pitch Statcast data for MLB-affiliated WBC 2026 roster players. Data sourced from [Baseball Savant](https://baseballsavant.mlb.com/) via [pybaseball](https://github.com/jldbc/pybaseball).

### Files

| File | Contents |
|---|---|
| `statcast_batters.csv` (36MB) | 324,099 pitches faced, 18 countries |
| `statcast_pitchers.csv` (29MB) | 217,139 pitches thrown, 14 countries |
| `batter_summary.csv` | Per-player batting summary: 105 players, 19 countries |
| `pitcher_summary.csv` | Per-player pitching summary: 86 players, 14 countries |
| `rosters.csv` | Full WBC 2026 roster: 309 players, 20 countries |
| `stadiums.csv` | MLB stadium coordinates for spray chart rendering |

---

## 3. Kaggle EDA Notebook

https://www.kaggle.com/code/yasunorim/wbc-2026-scouting-eda-statcast-analysis

An exploratory analysis of the dataset, including country-by-country fastball velocity comparisons and batting profiles.

![Notebook Graph](https://raw.githubusercontent.com/yasumorishima/zenn-content/main/images/wbc-notebook-graph.png)

---

## Data Notes

Roster data is based on official WBC 2026 announcements (Baseball America, February 2026). Some players may be missing or have since been added/removed from rosters. All data reflects MLB regular season performance only — it doesn't predict WBC performance directly.

---

## Links

- **Dashboard (GitHub)**: https://github.com/yasumorishima/wbc-scouting
- **Dataset (Kaggle)**: https://www.kaggle.com/datasets/yasunorim/wbc-2026-scouting
- **EDA Notebook (Kaggle)**: https://www.kaggle.com/code/yasunorim/wbc-2026-scouting-eda-statcast-analysis
