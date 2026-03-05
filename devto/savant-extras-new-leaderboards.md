---
title: "Park Factors in One Line of Python (savant-extras v0.3.2–v0.4.2)"
published: true
description: "savant-extras v0.4.2: removed OAA/Outfield Jump/Stuff+ (already in pybaseball). Park factors remain as the unique addition."
tags: python, baseball, opensource, pypi
canonical_url: https://yasumorishima.github.io/quarto-blog/posts/savant-extras-new-leaderboards/
---

## What Changed in savant-extras

| Version | Change |
|---|---|
| v0.3.2 | Added **park_factors** (FanGraphs ballpark factors) |
| v0.3.3 | Added lxml dependency, fixed StringIO (pandas 2.0+) |
| v0.4.0 | Added outs_above_average, outfield_jump |
| v0.4.1 | Added pitcher_quality |
| **v0.4.2** | **Removed** outs_above_average, outfield_jump, pitcher_quality |

```bash
pip install savant-extras
```

---

## v0.4.2: Three Functions Removed

After a closer look, the three functions added in v0.4.0–v0.4.1 were already available in pybaseball with identical data:

| Removed | pybaseball equivalent |
|---|---|
| `outs_above_average(year)` | `statcast_outs_above_average(year, 'all')` |
| `outfield_jump(year)` | `statcast_outfielder_jump(year)` |
| `pitcher_quality(year)` | `fg_pitching_data(year, qual=0)[["Stuff+", "Location+", "Pitching+"]]` |

They access the same data sources (Baseball Savant / FanGraphs) and return the same columns. Use pybaseball for these:

```python
from pybaseball import statcast_outs_above_average, statcast_outfielder_jump, fg_pitching_data

df_oaa = statcast_outs_above_average(2024, 'all')
df_oj  = statcast_outfielder_jump(2024)
df_pq  = fg_pitching_data(2024, qual=0)[["Name", "Team", "Stuff+", "Location+", "Pitching+"]]
```

---

## park_factors — Still Unique (v0.3.2+)

FanGraphs Park Factors are **not available in pybaseball**. savant-extras provides clean, per-season access for all 30 MLB teams.

```python
from savant_extras import park_factors, park_factors_range

# Single season (30 teams)
df = park_factors(2024)
# Columns: season, team, pf_5yr, pf_3yr, pf_1yr, pf_hr, pf_1b, pf_2b, pf_3b, pf_so, pf_bb, pf_fip

print(df[df["team"] == "COL"][["team", "pf_5yr", "pf_hr"]])
#    team  pf_5yr  pf_hr
# 5   COL     113    131

# Multi-season (for ML feature engineering)
df = park_factors_range(2020, 2025)
print(df.shape)  # (180, 12) — 6 seasons × 30 teams
```

Key columns:

| Column | Description |
|---|---|
| `pf_5yr` | 5-year weighted average (most stable) |
| `pf_1yr` | Current season only |
| `pf_hr` | Home run factor |
| `pf_fip` | FIP adjustment factor |

100 = neutral, >100 = hitter-friendly, <100 = pitcher-friendly.

---

## Summary

savant-extras focuses on data **not available in pybaseball**. After v0.4.2 cleanup, the main unique leaderboards are:

| Function | Description |
|---|---|
| `park_factors` / `park_factors_range` | FanGraphs ballpark run factors |
| `bat_tracking` | Bat speed, attack angle (custom date ranges) |
| `pitch_tempo` | Pace metrics |
| `catcher_blocking` / `catcher_stance` | Catcher defense metrics |
| `timer_infractions` | Pitch clock violations |

- **GitHub**: https://github.com/yasumorishima/savant-extras
- **PyPI**: https://pypi.org/project/savant-extras/
